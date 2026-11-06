// Carrera del jugador: cuenta regresiva, frase actual carácter por carácter,
// tiempo por frase, mini pista propia y envío del avance (máx. 4 veces por segundo).
import { $, escapeHTML, gsap, prefersReducedMotion, throttle } from '../shared/dom.js';
import { vehicleSVG } from '../shared/vehicles.js';
import {
  createPhrase, typeText, closePhrase, isBlockedKey, isBlockedInputType, createInputReader,
} from '../core/typing-engine.js';
import { phraseScore, accuracy, trackProgress } from '../core/scoring.js';
import { formatClock } from '../core/timing.js';

const LIVE_INTERVAL_MS = 250; // 4 veces por segundo

/**
 * @param {object} opts
 * @param {{phrases:string[], phraseTimesMs:number[], durationSec:number}} opts.config
 * @param {number} opts.startAt  inicio en hora del servidor
 * @param {number} opts.round
 * @param {() => number} opts.now  hora del servidor
 * @param {{type:string,color:string}} opts.vehicle
 * @param {{score:number, errors:number, correct:number}} [opts.base]  totales previos (al retomar)
 * @param {number} [opts.startPhrase]
 * @param {(data:{live:object, final?:object}) => void} opts.send
 * @param {(summary:object) => void} opts.onFinish
 */
export function createRaceSession(opts) {
  const { config, startAt, round, now, send, onFinish } = opts;
  const { phrases, phraseTimesMs } = config;
  const endAt = startAt + config.durationSec * 1000;
  const totalChars = phrases.reduce((s, p) => s + Array.from(p).length, 0);
  const reduced = prefersReducedMotion();

  const els = {
    phrase: $('#phrase'), next: $('#next-phrase'), input: $('#type-input'), refocus: $('#refocus'),
    n: $('#phrase-n'), total: $('#phrase-total'), fill: $('#phrase-fill'), clock: $('#global-clock'),
    timer: $('.race__timer'), countdown: $('#player-countdown'), countdownN: $('#player-countdown-n'),
    finished: $('#finished-note'), mini: $('#mini-car'), typing: $('#typing'),
  };

  const s = {
    index: Math.min(opts.startPhrase || 0, phrases.length - 1),
    engine: null,
    phraseStart: startAt,
    score: opts.base?.score || 0,
    correct: opts.base?.correct || 0,
    errors: opts.base?.errors || 0,
    lastKeyAt: 0,
    lastErrorAt: null,
    allDone: false,
    ended: false,
    started: false,
    lastCount: null,
    raf: 0,
    spans: [],
  };

  // ---- Envío al servidor ----
  // Quien completa todas las frases llega a la meta, aunque haya tenido errores.
  const progress = () => (s.allDone ? 1 : trackProgress(s.correct, s.errors, totalChars));
  const live = () => ({
    round,
    phraseIndex: s.index,
    progress: progress(),
    done: s.allDone || s.ended,
    ...(s.lastErrorAt ? { lastErrorAt: s.lastErrorAt } : {}),
  });
  const final = () => ({
    score: s.score, errors: s.errors, correct: s.correct,
    accuracy: accuracy(s.correct, s.errors), lastKeyAt: s.lastKeyAt, round,
  });
  const sendLive = throttle(() => send({ live: live() }), LIVE_INTERVAL_MS);
  const sendAll = () => { sendLive.cancel(); send({ live: live(), final: final() }); };

  // ---- Mini pista propia ----
  els.mini.innerHTML = vehicleSVG(opts.vehicle.type, opts.vehicle.color);
  const miniSvg = $('svg', els.mini);
  const moveMini = gsap.quickTo(els.mini, 'x', { duration: reduced ? 0.1 : 0.6, ease: 'power3.out' });
  const miniWheels = gsap.to(miniSvg.querySelectorAll('.wheel'), { rotation: 360, transformOrigin: '50% 50%', duration: 0.45, ease: 'none', repeat: -1, paused: true });
  function updateMini(crashed) {
    const road = els.mini.parentElement;
    moveMini(progress() * road.clientWidth);
    if (reduced) return;
    if (crashed) {
      gsap.fromTo(miniSvg, { rotation: -8 }, { rotation: 0, duration: 0.45, ease: 'elastic.out(1, 0.35)', transformOrigin: '30% 100%' });
    } else {
      miniWheels.play();
      gsap.fromTo(miniWheels, { timeScale: 1.6 }, { timeScale: 0, duration: 1.2, ease: 'power2.in', overwrite: true });
    }
  }

  // ---- Render de la frase ----
  function phraseSize(text) {
    const len = Array.from(text).length;
    if (len <= 36) return '3.4rem';
    if (len <= 55) return '3rem';
    if (len <= 80) return '2.6rem';
    return '2.2rem';
  }

  function renderPhrase() {
    const text = phrases[s.index];
    const chars = Array.from(text);
    els.phrase.style.setProperty('--phrase-size', phraseSize(text));
    els.phrase.setAttribute('aria-label', text);
    els.phrase.innerHTML = chars.map((c) => `<span class="ch${c === ' ' ? ' is-space' : ''}" aria-hidden="true">${escapeHTML(c)}</span>`).join('');
    s.spans = [...els.phrase.children];
    s.spans[0]?.classList.add('is-cur');
    els.next.textContent = phrases[s.index + 1] || '';
    els.n.textContent = String(s.index + 1);
    els.total.textContent = String(phrases.length);
    if (!reduced) gsap.from(s.spans, { y: 14, autoAlpha: 0, duration: 0.35, ease: 'power3.out', stagger: { amount: 0.25 } });
  }

  function markTyped(typed) {
    for (const { index, ok } of typed) {
      const span = s.spans[index];
      if (!span) continue;
      span.classList.remove('is-cur');
      span.classList.add(ok ? 'is-ok' : 'is-err');
    }
    s.spans[s.engine.pos]?.classList.add('is-cur');
  }

  // ---- Frases ----
  function startPhrase(at) {
    s.engine = createPhrase(phrases[s.index]);
    s.phraseStart = at;
    renderPhrase();
  }

  function stamp(completed) {
    const el = $('#phrase-stamp');
    el.textContent = completed ? 'Lista' : 'Tiempo';
    el.className = `stamp ${completed ? 'stamp--done' : 'stamp--time'}`;
    gsap.killTweensOf(el);
    if (reduced) { gsap.set(el, { scale: 1, rotation: -8 }); gsap.set(el, { scale: 0, delay: 0.9 }); return; }
    gsap.timeline()
      .fromTo(el, { scale: 2.2, rotation: -16 }, { scale: 1, rotation: -8, duration: 0.28, ease: 'power4.in' })
      .to(el, { x: -2, y: 2, duration: 0.05, yoyo: true, repeat: 1 })
      .to(el, { scale: 0, duration: 0.2, ease: 'power2.in' }, '+=0.55');
  }

  function finishPhrase(at, completed) {
    stamp(completed);
    const remainingMs = Math.max(0, s.phraseStart + phraseTimesMs[s.index] - at);
    s.score += phraseScore({ correct: s.engine.correct, errors: s.engine.errors, completed, remainingMs });
    s.engine = closePhrase(s.engine);
    if (s.index + 1 < phrases.length) {
      s.index += 1;
      startPhrase(at);
      sendAll();
    } else {
      s.allDone = true;
      updateMini(false);
      sendAll();
      showFinished();
    }
  }

  function showFinished() {
    els.finished.hidden = false;
    els.refocus.hidden = true;
    els.input.blur();
    if (!reduced) gsap.from(els.finished, { autoAlpha: 0, scale: 0.94, duration: 0.4, ease: 'back.out(2)' });
  }

  // ---- Entrada de teclado ----
  const reader = createInputReader(els.input);
  const canType = () => s.started && !s.ended && !s.allDone;

  function consume(text) {
    if (!text || !canType()) return;
    let rest = text;
    while (rest && canType()) {
      const at = now();
      const { state, typed, overflow } = typeText(s.engine, rest);
      const newErrors = state.errors - s.engine.errors;
      const newCorrect = state.correct - s.engine.correct;
      s.engine = state;
      s.correct += newCorrect;
      s.errors += newErrors;
      s.lastKeyAt = at;
      if (newErrors > 0) s.lastErrorAt = at;
      markTyped(typed);
      updateMini(newErrors > 0);
      if (state.done) finishPhrase(at, true);
      else sendLive();
      rest = overflow;
    }
  }

  const onBeforeInput = (e) => { if (isBlockedInputType(e.inputType)) e.preventDefault(); };
  const onInput = (e) => consume(reader.input({ isComposing: e.isComposing }));
  const onCompStart = () => reader.compositionStart();
  const onCompEnd = () => consume(reader.compositionEnd());
  const onKeyDown = (e) => {
    if (isBlockedKey(e.key, e)) { e.preventDefault(); return; }
    if (document.activeElement !== els.input && canType() && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Teclear fuera del campo: se recupera el foco y la letra no se pierde.
      e.preventDefault();
      focusInput();
      consume(e.key);
    }
  };
  const block = (e) => e.preventDefault();
  const onBlur = () => { reader.reset(); if (canType()) els.refocus.hidden = false; };
  const onFocus = () => { els.refocus.hidden = true; };
  const focusInput = () => { els.input.focus({ preventScroll: true }); };

  els.input.value = '';
  els.input.addEventListener('beforeinput', onBeforeInput);
  els.input.addEventListener('input', onInput);
  els.input.addEventListener('compositionstart', onCompStart);
  els.input.addEventListener('compositionend', onCompEnd);
  els.input.addEventListener('blur', onBlur);
  els.input.addEventListener('focus', onFocus);
  els.refocus.addEventListener('click', focusInput);
  els.typing.addEventListener('click', focusInput);
  document.addEventListener('keydown', onKeyDown, true);
  for (const type of ['paste', 'drop', 'contextmenu', 'cut', 'dragover']) document.addEventListener(type, block);

  // ---- Bucle principal ----
  els.finished.hidden = true;
  els.refocus.hidden = true;
  startPhrase(Math.max(startAt, now()));

  function tick() {
    if (s.ended) return;
    const t = now();
    if (t < startAt) {
      const left = Math.ceil((startAt - t) / 1000);
      if (left <= 3 && left !== s.lastCount) {
        s.lastCount = left;
        els.countdown.hidden = false;
        els.countdownN.textContent = String(left);
        els.countdownN.dataset.text = String(left);
        if (!reduced) gsap.fromTo(els.countdownN, { scale: 1.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(2.4)' });
      }
      els.clock.textContent = formatClock(config.durationSec);
      gsap.set(els.fill, { scaleX: 1 });
    } else {
      if (!s.started) {
        s.started = true;
        s.phraseStart = Math.max(s.phraseStart, startAt);
        els.countdown.hidden = true;
        focusInput();
        sendAll();
      }
      // Fin de la carrera
      if (t >= endAt) { end('time'); return; }
      // Tiempo de la frase
      if (!s.allDone) {
        const budget = phraseTimesMs[s.index];
        const used = t - s.phraseStart;
        if (used >= budget) {
          finishPhrase(s.phraseStart + budget, false);
        } else {
          const left = Math.min(budget - used, endAt - t);
          gsap.set(els.fill, { scaleX: Math.max(0, left / budget) });
          els.timer.classList.toggle('is-low', left < 3000);
        }
      }
      els.clock.textContent = formatClock((endAt - t) / 1000);
    }
    s.raf = requestAnimationFrame(tick);
  }
  s.raf = requestAnimationFrame(tick);

  // ---- Final ----
  function end() {
    if (s.ended) return;
    if (!s.allDone && s.started) {
      // La frase en curso se cierra con lo que alcanzó a escribir.
      s.score += phraseScore({ correct: s.engine.correct, errors: s.engine.errors, completed: false, remainingMs: 0 });
      s.engine = closePhrase(s.engine);
    }
    s.ended = true;
    cancelAnimationFrame(s.raf);
    sendAll();
    cleanup();
    onFinish({ ...final(), allDone: s.allDone });
  }

  function cleanup() {
    sendLive.cancel();
    cancelAnimationFrame(s.raf);
    miniWheels.kill();
    els.input.removeEventListener('beforeinput', onBeforeInput);
    els.input.removeEventListener('input', onInput);
    els.input.removeEventListener('compositionstart', onCompStart);
    els.input.removeEventListener('compositionend', onCompEnd);
    els.input.removeEventListener('blur', onBlur);
    els.input.removeEventListener('focus', onFocus);
    els.refocus.removeEventListener('click', focusInput);
    els.typing.removeEventListener('click', focusInput);
    document.removeEventListener('keydown', onKeyDown, true);
    for (const type of ['paste', 'drop', 'contextmenu', 'cut', 'dragover']) document.removeEventListener(type, block);
    els.input.blur();
    els.countdown.hidden = true;
  }

  return {
    /** El anfitrión terminó la carrera (tiempo o «terminar ahora»). */
    end,
    /** Se descarta sin enviar (sala cerrada, expulsión, revancha). */
    destroy() { if (!s.ended) { s.ended = true; cleanup(); } },
  };
}
