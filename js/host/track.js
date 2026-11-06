// Render de la pista y animación de los vehículos.
// 1–30 jugadores: una pista. 31–50: dos pistas paralelas (mitad cada una).
// Los vehículos se deslizan con gsap.quickTo (nunca saltan); los errores generan choques.
import { $, $$, escapeHTML, gsap, prefersReducedMotion } from '../shared/dom.js';
import { vehicleSVG, OBSTACLES, OBSTACLE_KEYS } from '../shared/vehicles.js';
import { sceneHTML, startParallax, ROAD_LINES_HTML } from '../shared/scene.js';

const SINGLE_TRACK_MAX = 30;
const CRASH_COOLDOWN_MS = 700;

export function createTrack({ area, scene, players, onCrash }) {
  const reduced = prefersReducedMotion();
  const ordered = [...players].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  const trackCount = ordered.length > SINGLE_TRACK_MAX ? 2 : 1;
  const perTrack = Math.ceil(ordered.length / trackCount);
  const runners = new Map(); // uid → estado del corredor

  if (!scene.querySelector('.scene__sky')) scene.insertAdjacentHTML('afterbegin', sceneHTML());
  const parallax = startParallax(scene, gsap, { reduced, roads: [area] });
  parallax.setSpeed(0.15, 0.01);

  // ---- DOM ----
  area.innerHTML = '';
  area.style.setProperty('--tracks', String(trackCount));
  for (let t = 0; t < trackCount; t++) {
    const track = document.createElement('div');
    track.className = 'track';
    for (const p of ordered.slice(t * perTrack, (t + 1) * perTrack)) {
      const lane = document.createElement('div');
      lane.className = 'lane';
      lane.innerHTML = `<div class="lane__label"><span>${escapeHTML(p.name)}</span></div>`
        + `<div class="lane__road">${ROAD_LINES_HTML}`
        + `<div class="runner">${vehicleSVG(p.vehicle?.type, p.vehicle?.color, { title: p.name })}</div></div>`
        + '<div class="lane__finish" aria-hidden="true"></div>';
      track.append(lane);
      const runner = $('.runner', lane);
      const svg = $('svg', runner);
      const motion = gsap.timeline({ repeat: -1, paused: true })
        .to($$('.wheel', svg), { rotation: 360, transformOrigin: '50% 50%', duration: 0.5, ease: 'none' }, 0)
        .to($$('.body, .keyline', svg), { y: -1.6, duration: 0.25, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0);
      runners.set(p.uid, {
        lane, runner, svg, motion,
        road: $('.lane__road', lane),
        moveX: gsap.quickTo(runner, 'x', { duration: reduced ? 0.15 : 0.9, ease: 'power3.out' }),
        progress: 0,
        lastErrorAt: null,
        lastCrash: 0,
        obstacle: null,
      });
    }
    area.append(track);
  }

  // ---- Medidas ----
  let runLength = 0;
  function layout() {
    const lanesPerTrack = Math.max(1, perTrack);
    // Con muchos carriles la pista se come el cielo vacío: legibilidad antes que paisaje.
    const dense = lanesPerTrack > 12;
    scene.style.setProperty('--sky-h', dense ? '9%' : '30%');
    scene.classList.toggle('scene--dense', dense);
    area.style.setProperty('--track-top', dense ? '9.5%' : '26%');
    const height = area.clientHeight;
    const gap = Math.max(2, Math.min(8, Math.floor(height / lanesPerTrack * 0.12)));
    const laneH = Math.max(14, Math.min(110, Math.floor((height - gap * (lanesPerTrack - 1)) / lanesPerTrack)));
    area.style.setProperty('--lane-h', `${laneH}px`);
    area.style.setProperty('--lane-gap', `${gap}px`);
    area.style.setProperty('--label-w', trackCount === 1 ? '12vw' : '8.5vw');
    area.style.setProperty('--label-size', `${Math.max(14, Math.min(30, laneH * 0.62))}px`);
    const first = runners.values().next().value;
    if (!first) return;
    // En 1 la trompa del vehículo entra en la bandera de meta.
    runLength = Math.max(0, first.road.clientWidth - first.runner.offsetWidth * 0.55);
    for (const r of runners.values()) gsap.set(r.runner, { x: r.progress * runLength });
  }
  layout();
  const onResize = () => layout();
  window.addEventListener('resize', onResize);

  // ---- Choque ----
  function crash(r) {
    const now = performance.now();
    if (now - r.lastCrash < CRASH_COOLDOWN_MS) return;
    r.lastCrash = now;
    onCrash?.();
    const key = OBSTACLE_KEYS[Math.floor(Math.random() * OBSTACLE_KEYS.length)];
    r.obstacle?.remove();
    const obstacle = document.createElement('div');
    obstacle.className = 'obstacle';
    obstacle.innerHTML = OBSTACLES[key];
    const x = r.progress * runLength + r.runner.offsetWidth * 0.98;
    obstacle.style.left = `${Math.min(x, r.road.clientWidth - 10)}px`;
    r.road.append(obstacle);
    r.obstacle = obstacle;

    if (reduced) {
      gsap.to(obstacle, { autoAlpha: 0, delay: 1.2, duration: 0.2, onComplete: () => obstacle.remove() });
      return;
    }
    const tl = gsap.timeline();
    tl.from(obstacle, { scale: 0, y: -12, transformOrigin: '50% 100%', duration: 0.32, ease: 'back.out(3)' })
      // sacudida con estiramiento
      .to(r.svg, { rotation: -7, scaleX: 0.86, scaleY: 1.1, transformOrigin: '20% 100%', duration: 0.08, ease: 'power2.out' }, 0.05)
      .to(r.svg, { rotation: 4, scaleX: 1.05, scaleY: 0.96, duration: 0.09, ease: 'power1.inOut' })
      .to(r.svg, { rotation: -2, scaleX: 1, scaleY: 1, duration: 0.08 })
      .to(r.svg, { rotation: 0, duration: 0.35, ease: 'elastic.out(1, 0.4)' })
      .to(obstacle, { autoAlpha: 0, y: 6, duration: 0.35, ease: 'power1.in', onComplete: () => obstacle.remove() }, 1.4);
    // humo breve
    for (let i = 0; i < 3; i++) {
      const puff = document.createElement('span');
      puff.className = 'puff';
      puff.style.left = `${x - 6}px`;
      puff.style.bottom = '30%';
      r.road.append(puff);
      gsap.timeline({ delay: 0.05 + i * 0.05, onComplete: () => puff.remove() })
        .fromTo(puff, { scale: 0, x: 0, y: 0 }, { scale: 0.7 + i * 0.15, x: -10 - i * 10, y: -6 - i * 4, duration: 0.35, ease: 'back.out(2)' })
        .to(puff, { scale: 0, duration: 0.3, ease: 'power2.in' }, '+=0.15');
    }
  }

  // ---- API ----
  return {
    /** Aplica el estado en vivo de un jugador (progreso, error, terminado). */
    update(uid, live) {
      const r = runners.get(uid);
      if (!r || !live) return 0;
      const progress = Math.max(0, Math.min(1, Number(live.progress) || 0));
      const delta = progress - r.progress;
      if (Math.abs(delta) > 0.0001) {
        r.progress = progress;
        r.moveX(progress * runLength);
        if (delta > 0 && !reduced) {
          r.motion.play();
          gsap.fromTo(r.motion, { timeScale: 1.8 }, { timeScale: 0, duration: 1.6, ease: 'power2.in', overwrite: true });
          if (delta > 0.004) {
            gsap.fromTo(r.svg, { scaleX: 1.08, scaleY: 0.95, transformOrigin: '0% 100%' }, { scaleX: 1, scaleY: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' });
          }
        }
      }
      if (live.lastErrorAt && live.lastErrorAt !== r.lastErrorAt) {
        r.lastErrorAt = live.lastErrorAt;
        crash(r);
      }
      r.lane.classList.toggle('is-done', Boolean(live.done));
      return Math.max(0, delta);
    },

    /** Marca el estado inicial sin animar choques viejos (al retomar). */
    prime(uid, live) {
      const r = runners.get(uid);
      if (!r || !live) return;
      r.progress = Math.max(0, Math.min(1, Number(live.progress) || 0));
      r.lastErrorAt = live.lastErrorAt ?? null;
      gsap.set(r.runner, { x: r.progress * runLength });
    },

    remove(uid) {
      const r = runners.get(uid);
      if (r) r.lane.style.opacity = '0.35';
    },

    /** Partida: anticipación (retroceso + compresión) y salida. */
    go() {
      parallax.setSpeed(1, 1.6);
      if (reduced) return;
      const svgs = [...runners.values()].map((r) => r.svg);
      gsap.timeline()
        .to(svgs, { x: -6, scaleX: 0.9, scaleY: 1.06, transformOrigin: '0% 100%', duration: 0.22, ease: 'power2.out', stagger: { each: 0.008, from: 'random' } })
        .to(svgs, { x: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.45)', stagger: { each: 0.008, from: 'random' } });
      for (const r of runners.values()) {
        r.motion.play();
        gsap.fromTo(r.motion, { timeScale: 2 }, { timeScale: 0, duration: 1.4, ease: 'power2.in' });
      }
    },

    /** Fin: todo se detiene suavemente. */
    stop() {
      parallax.setSpeed(0, 1.2);
      for (const r of runners.values()) gsap.to(r.motion, { timeScale: 0, duration: 0.8, overwrite: true });
    },

    destroy() {
      window.removeEventListener('resize', onResize);
      parallax.kill();
      for (const r of runners.values()) { r.motion.kill(); gsap.killTweensOf(r.runner); gsap.killTweensOf(r.svg); }
      runners.clear();
      area.innerHTML = '';
    },
  };
}

/**
 * Cuenta regresiva «impresa»: la escena se estampa capa por capa (registro serigráfico).
 * step 3 → cielo y sol; 2 → cerros lejanos y medios; 1 → cerros cercanos y postes; 0 → ¡YA!
 */
export function printSceneStep(scene, step) {
  const reduced = prefersReducedMotion();
  const groups = {
    3: ['.scene__sky'],
    2: ['.scene__layer--far', '.scene__layer--mid'],
    1: ['.scene__layer--near', '.scene__layer--posts'],
  };
  if (step === 'reset') {
    const all = Object.values(groups).flat().map((s) => $(s, scene)).filter(Boolean);
    gsap.set(all, reduced ? { autoAlpha: 0 } : { clipPath: 'inset(0 100% 0 0)' });
    return;
  }
  if (step === 'all') {
    const all = Object.values(groups).flat().map((s) => $(s, scene)).filter(Boolean);
    gsap.set(all, { clipPath: 'inset(0 0% 0 0)', autoAlpha: 1 });
    return;
  }
  const targets = (groups[step] || []).map((s) => $(s, scene)).filter(Boolean);
  if (!targets.length) return;
  if (reduced) gsap.to(targets, { autoAlpha: 1, duration: 0.2 });
  else gsap.to(targets, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power3.inOut', stagger: 0.12 });
}

/** Numeral estampado de la cuenta regresiva. */
export function stampNumber(el, text) {
  el.textContent = text;
  el.dataset.text = text;
  if (prefersReducedMotion()) { gsap.set(el, { autoAlpha: 1, scale: 1 }); return; }
  gsap.timeline()
    .fromTo(el, { scale: 1.7, autoAlpha: 0, rotation: -6 }, { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.42, ease: 'back.out(2.4)' })
    .to(el, { scale: 0.92, autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 0.72);
}
