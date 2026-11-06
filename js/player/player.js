// Orquestador de la pantalla del jugador:
// código + nombre → vehículo → espera → cuenta regresiva → carrera → resultado.
// Modo práctica sin sala: index.html?practica (o ?practica=2 / ?practica=3 para el nivel).
import { $, showScreen, gsap, storage, prefersReducedMotion, misprint, markSVG } from '../shared/dom.js';
import { sceneHTML, startParallax } from '../shared/scene.js';
import { vehicleSVG, VEHICLES } from '../shared/vehicles.js';
import { createRaceSession } from './race.js';

const params = new URLSearchParams(location.search);
const NAME_KEY = 'typecrash.name';
const ROOM_KEY = 'typecrash.room';

let fb = null; // módulo firebase.js (carga diferida)
let join = null; // módulo join.js
let uid = null;
let code = null;
let me = null; // mi nodo de jugador
const roomState = { status: null, round: null, startAt: null, config: null, results: null };
let session = null;
let sessionRound = null;
let lastSummary = null;
let leaving = false;
let unsubs = [];
let keptOnDisconnect = false;

// ---------------------------------------------------------------------------
// Escenas animadas
// ---------------------------------------------------------------------------
function mountScene(el) {
  if (!el.querySelector('.scene__sky')) el.insertAdjacentHTML('afterbegin', sceneHTML());
  return startParallax(el, gsap, { reduced: prefersReducedMotion() });
}

let waitAnim = null;
function showWait(note = '') {
  showScreen('wait');
  $('#wait-who').textContent = me ? `${me.name} · sala ${code}` : '';
  $('#wait-note').hidden = !note;
  $('#wait-note').textContent = note;
  const car = $('#wait-car');
  car.innerHTML = vehicleSVG(me.vehicle.type, me.vehicle.color);
  waitAnim?.kill?.();
  if (!prefersReducedMotion()) {
    const svg = $('svg', car);
    waitAnim = gsap.timeline({ repeat: -1 })
      .to(svg.querySelectorAll('.wheel'), { rotation: 360, transformOrigin: '50% 50%', duration: 0.6, ease: 'none' }, 0)
      .to(svg.querySelector('.body'), { y: -2, duration: 0.15, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0);
    gsap.from(car, { x: '-60vw', duration: 1.1, ease: 'power3.out' });
  }
}

function showMessage(title, text, button = 'Entrar a otra sala', action = () => location.reload()) {
  showScreen('message');
  $('#message-title').textContent = title;
  $('#message-text').textContent = text;
  const btn = $('#message-btn');
  btn.textContent = button;
  btn.onclick = action;
}

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------
function showDone(summary, { practice = false } = {}) {
  showScreen('done');
  misprint($('#done-title'), summary.allDone ? '¡Llegaste!' : '¡Tiempo!');
  $('#done-score').textContent = summary.score.toLocaleString('es-CL');
  $('#done-errors').textContent = String(summary.errors);
  $('#done-accuracy').textContent = `${summary.accuracy.toLocaleString('es-CL', { maximumFractionDigits: 1 })}%`;
  $('#done-position').textContent = practice ? 'Modo práctica' : 'Calculando posiciones…';
  $('#again-btn').hidden = !practice;
  $('#done-next').hidden = practice;
  const vehicle = me?.vehicle || { type: 'cuna', color: 'tomate' };
  $('#done-car').innerHTML = vehicleSVG(vehicle.type, vehicle.color);
  if (!prefersReducedMotion()) {
    gsap.fromTo('.done__column', { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.6, ease: 'back.out(1.4)' });
    gsap.fromTo('#done-car', { y: -160, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: 'bounce.out', delay: 0.3 });
    gsap.from('.done__item', { y: 24, autoAlpha: 0, duration: 0.45, ease: 'back.out(2)', stagger: 0.08, delay: 0.5 });
    const score = { v: 0 };
    gsap.to(score, { v: summary.score, duration: 1.2, ease: 'power2.out', onUpdate: () => { $('#done-score').textContent = Math.round(score.v).toLocaleString('es-CL'); } });
  }
  showPosition();
}

function showPosition() {
  const r = roomState.results;
  if (!r || r.round !== roomState.round || !lastSummary) return;
  const pos = r.positions?.[uid];
  if (!pos) return;
  const el = $('#done-position');
  el.textContent = `Lugar ${pos} de ${r.total}`;
  if (!prefersReducedMotion()) gsap.fromTo(el, { scale: 1.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2.5)' });
}

// ---------------------------------------------------------------------------
// Carrera conectada a la sala
// ---------------------------------------------------------------------------
function startSession() {
  const { config, startAt, round } = roomState;
  const resumeLive = me.live?.round === round ? me.live : null;
  const resumeFinal = me.final?.round === round ? me.final : null;
  session?.destroy();
  sessionRound = round;
  lastSummary = null;
  showScreen('race');
  session = createRaceSession({
    config, startAt, round,
    now: fb.serverNow,
    vehicle: me.vehicle,
    base: resumeFinal ? { score: resumeFinal.score, errors: resumeFinal.errors, correct: resumeFinal.correct } : null,
    startPhrase: resumeLive ? resumeLive.phraseIndex + (resumeLive.done ? 1 : 0) : 0,
    send: (data) => {
      const patch = { live: data.live };
      if (data.final) patch.final = data.final;
      fb.update(fb.ref(fb.db, `rooms/${code}/players/${uid}`), patch).catch((err) => console.error(err));
    },
    onFinish: (summary) => {
      session = null;
      lastSummary = summary;
      showDone(summary);
    },
  });
}

function sync() {
  const { status, round, startAt, config } = roomState;
  if (!me) return;
  if (status === 'lobby') {
    if (session) { session.destroy(); session = null; }
    const isRematch = sessionRound !== null && round !== sessionRound;
    if (isRematch) { sessionRound = null; lastSummary = null; }
    if (isRematch || !document.querySelector('[data-screen="wait"]:not([hidden])')) {
      showWait(isRematch ? '¡Revancha! Prepárate: vienen frases nuevas.' : '');
    }
    return;
  }
  if ((status === 'countdown' || status === 'racing') && startAt && config) {
    if (!keptOnDisconnect) { keptOnDisconnect = true; join.keepOnDisconnect(code, uid, me); }
    const endAt = startAt + config.durationSec * 1000;
    if (sessionRound === round && (session || lastSummary)) return;
    if (fb.serverNow() < endAt) startSession();
    return;
  }
  if (status === 'finished') {
    if (session) { session.end(); return; }
    if (!lastSummary && me.final?.round === round) {
      lastSummary = { ...me.final, allDone: Boolean(me.live?.done) };
      sessionRound = round;
      showDone(lastSummary);
    }
    showPosition();
  }
}

function watchRoom() {
  const base = `rooms/${code}`;
  const on = (path, cb) => unsubs.push(fb.onValue(fb.ref(fb.db, `${base}/${path}`), (snap) => cb(snap.val())));
  on('config', (v) => { roomState.config = v; sync(); });
  on('round', (v) => { roomState.round = v; sync(); });
  on('startAt', (v) => { roomState.startAt = v; sync(); });
  on('results', (v) => { roomState.results = v; showPosition(); });
  on('status', (v) => {
    if (v === null) {
      session?.destroy(); session = null;
      storage.remove(ROOM_KEY);
      showMessage('Sala cerrada', 'El anfitrión cerró la sala. ¡Gracias por jugar!');
      stopWatching();
      return;
    }
    roomState.status = v;
    sync();
  });
  on(`players/${uid}`, async (v) => {
    if (v === null) {
      if (leaving || roomState.status === null) return;
      session?.destroy(); session = null;
      storage.remove(ROOM_KEY);
      stopWatching();
      // ¿Se cerró la sala completa o solo salió este jugador?
      const roomGone = !(await fb.get(fb.ref(fb.db, `rooms/${code}/status`)).catch(() => null))?.exists();
      if (roomGone) showMessage('Sala cerrada', 'El anfitrión cerró la sala. ¡Gracias por jugar!');
      else showMessage('Saliste de la sala', 'El anfitrión te sacó de la sala. Si fue un error, vuelve a entrar con otro nombre.');
      return;
    }
    me = v;
  });
}

function stopWatching() {
  unsubs.forEach((off) => off());
  unsubs = [];
}

async function enterRoom(roomCode, player) {
  code = roomCode;
  me = player;
  storage.set(ROOM_KEY, { code });
  showWait();
  watchRoom();
}

// ---------------------------------------------------------------------------
// Ingreso
// ---------------------------------------------------------------------------
function setJoinError(message, field) {
  const box = $('#join-error');
  box.hidden = !message;
  box.innerHTML = message ? `${markSVG('error')}<p></p>` : '';
  if (message) box.querySelector('p').textContent = message;
  $('#join-code').setAttribute('aria-invalid', String(field === 'code'));
  $('#join-name').setAttribute('aria-invalid', String(field === 'name'));
  if (field) $(`#join-${field}`).focus();
}

function bindJoin() {
  const codeInput = $('#join-code');
  const submit = $('#join-submit');
  submit.disabled = false;
  submit.textContent = 'Continuar';
  codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 5); });

  let pending = null;
  let getChoice = null;

  $('#join-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    setJoinError('');
    const btn = $('#join-submit');
    btn.disabled = true;
    const roomCode = codeInput.value.trim();
    const result = await join.checkRoom(roomCode, $('#join-name').value, uid);
    btn.disabled = false;
    if (!result.ok) { setJoinError(result.message, result.field); return; }
    storage.set(NAME_KEY, result.name);
    if (result.existing) { enterRoom(roomCode, result.existing); return; }
    pending = { code: roomCode, name: result.name };
    showScreen('garage');
    getChoice = join.renderGarage({ name: result.name, code: roomCode, taken: result.takenVehicles, onPick: () => {} });
  });

  $('#garage-back').addEventListener('click', () => { showScreen('join'); });
  $('#garage-go').addEventListener('click', async () => {
    const btn = $('#garage-go');
    const errBox = $('#garage-error');
    errBox.hidden = true;
    btn.disabled = true;
    const vehicle = getChoice();
    storage.set('typecrash.vehicle', vehicle);
    try {
      const player = await join.joinRoom({ code: pending.code, uid, name: pending.name, vehicle });
      await enterRoom(pending.code, player);
    } catch (err) {
      console.error(err);
      if (err.field === 'name') { showScreen('join'); setJoinError(err.friendly, 'name'); }
      else { errBox.hidden = false; errBox.textContent = err.friendly || 'No se pudo entrar a la sala. Inténtalo de nuevo.'; }
    } finally {
      btn.disabled = false;
    }
  });

  $('#leave-btn').addEventListener('click', async () => {
    if (!window.confirm('¿Salir de la sala?')) return;
    leaving = true;
    stopWatching();
    await join.leaveRoom(code, uid, me).catch(console.error);
    storage.remove(ROOM_KEY);
    location.reload();
  });
}

async function tryResume() {
  const saved = storage.get(ROOM_KEY, null);
  if (!saved?.code) return false;
  try {
    const snap = await fb.get(fb.ref(fb.db, `rooms/${saved.code}/players/${uid}`));
    if (!snap.exists()) { storage.remove(ROOM_KEY); return false; }
    await enterRoom(saved.code, snap.val());
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Modo práctica (sin sala ni Firebase)
// ---------------------------------------------------------------------------
async function runPractice() {
  const { PHRASE_BANK } = await import('../data/phrase-bank.js');
  const { pickBankPhrases } = await import('../core/texts.js');
  const { splitDuration } = await import('../core/timing.js');
  const level = [1, 2, 3].includes(Number(params.get('practica'))) ? Number(params.get('practica')) : 1;
  const start = () => {
    const phrases = pickBankPhrases(PHRASE_BANK[level], 3);
    const durationSec = 60;
    const config = { durationSec, phrases, phraseTimesMs: splitDuration(durationSec * 1000, phrases.map((p) => Array.from(p).length)) };
    me = { name: 'Práctica', vehicle: (() => { const v = storage.get('typecrash.vehicle', null); return VEHICLES.some((x) => x.id === v?.type) ? v : { type: 'cuna', color: 'tomate' }; })() };
    showScreen('race');
    createRaceSession({
      config, startAt: Date.now() + 3200, round: 1, now: Date.now, vehicle: me.vehicle,
      send: () => {}, onFinish: (summary) => showDone(summary, { practice: true }),
    });
  };
  $('#again-btn').onclick = start;
  start();
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
async function main() {
  mountScene($('#join-scene'));
  mountScene($('#wait-scene'));

  if (params.has('practica')) { runPractice(); return; }

  $('#join-name').value = storage.get(NAME_KEY, '') || '';
  const fromUrl = (params.get('sala') || '').replace(/\D/g, '').slice(0, 5);
  if (fromUrl) $('#join-code').value = fromUrl;

  try {
    [fb, join] = await Promise.all([import('../firebase.js'), import('./join.js')]);
    uid = await fb.signIn();
    await fb.syncClock();
  } catch (err) {
    console.error(err);
    setJoinError(fb?.friendlyError?.(err) || 'No se pudo conectar. Revisa internet y recarga la página.');
    $('#join-submit').disabled = true;
    return;
  }
  fb.watchConnection((online) => { $('#conn').hidden = online; });
  bindJoin();
  if (!(await tryResume())) {
    showScreen('join');
    ($('#join-code').value ? $('#join-name') : $('#join-code')).focus();
  }
}

function waitForLibs() {
  if (window.gsap) return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
}

waitForLibs().then(main);
