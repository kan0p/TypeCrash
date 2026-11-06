// Orquestador de la pantalla del anfitrión:
// configura → crea sala → lobby → cuenta regresiva → carrera → podio → tabla → revancha.
import { $, gsap, showScreen, escapeHTML, prefersReducedMotion } from '../shared/dom.js';
import { initSetup, prepareSetup, buildRaceConfig, setSetupError } from './setup.js';
import { initLobby, showLobbyRoom, renderLobby, resetLobby } from './lobby.js';
import { createTrack, printSceneStep, stampNumber } from './track.js';
import { playPodium, showStandings } from './results.js';
import { formatClock } from '../core/timing.js';
import { rank } from '../core/scoring.js';
import {
  sound, unlockOnGesture, playMusic, getAudioPrefs, setVolume, setMuted,
} from './sound.js';

const COUNTDOWN_MS = 4200; // margen para que todos reciban el inicio antes del 3
const FINALS_TIMEOUT_MS = 6000; // espera máxima de los resultados finales

const params = new URLSearchParams(location.search);
const demoCount = params.has('demo') ? Number(params.get('demo')) || 24 : 0;

let api = null;
let code = null;
let room = null; // copia local: { status, round, config, startAt }
let phase = 'setup'; // setup | lobby | race | results
let returnTo = null;
const players = new Map();
let unlisten = null;

// Estado de la carrera en curso
let race = null;

// ---------------------------------------------------------------------------
// Jugadores
// ---------------------------------------------------------------------------
function onPlayer(uid, data) {
  players.set(uid, data);
  if (phase === 'lobby') renderLobby(players);
  if (phase === 'race' && race) {
    const live = data.live;
    if (live && live.round === room.round) race.activity += race.track?.update(uid, live) || 0;
    checkAllDone();
  }
}

function onPlayerRemoved(uid) {
  players.delete(uid);
  if (phase === 'lobby') renderLobby(players);
  if (phase === 'race' && race) {
    race.track?.remove(uid);
    race.participants.delete(uid);
    checkAllDone();
  }
}

function listen() {
  unlisten?.();
  players.clear();
  unlisten = api.listenPlayers(code, { added: onPlayer, changed: onPlayer, removed: onPlayerRemoved });
}

const isDone = (p) => p?.live?.round === room.round && p.live.done;

function checkAllDone() {
  if (!race || race.ended || !race.started) return;
  const ids = [...race.participants];
  if (ids.length && ids.every((uid) => isDone(players.get(uid)))) endRace();
}

// ---------------------------------------------------------------------------
// Sala
// ---------------------------------------------------------------------------
async function createRoom() {
  const config = buildRaceConfig(1);
  const data = { status: 'lobby', round: 1, config };
  code = await api.createRoom(data);
  room = { status: 'lobby', round: 1, config };
  resetLobby();
  listen();
  goLobby();
}

async function reconfigure() {
  const round = room.round + 1;
  const config = buildRaceConfig(round);
  await api.updateRoom(code, { config, round, status: 'lobby', startAt: null, results: null });
  Object.assign(room, { config, round, status: 'lobby', startAt: null });
  goLobby();
}

function goLobby() {
  phase = 'lobby';
  playMusic('lobby');
  teardownRace();
  showLobbyRoom(code, room.config);
  renderLobby(players);
  showScreen('lobby');
  $('#start-btn').focus();
}

async function closeRoom() {
  if (!window.confirm('¿Cerrar la sala? Los jugadores quedarán fuera.')) return;
  teardownRace();
  unlisten?.(); unlisten = null;
  await api.removeRoom(code).catch((err) => console.error(err));
  code = null; room = null;
  players.clear();
  resetLobby();
  goSetup('create');
}

function goSetup(mode) {
  playMusic('lobby');
  returnTo = mode === 'reconfigure' ? phase : null;
  phase = 'setup';
  prepareSetup(mode);
  showScreen('setup');
}

async function kick(uid) {
  const p = players.get(uid);
  try { await api.kick(code, uid, p); } catch (err) { console.error(err); }
}

// ---------------------------------------------------------------------------
// Carrera
// ---------------------------------------------------------------------------
async function startRace() {
  if (players.size < 1) return;
  $('#start-btn').disabled = true;
  const startAt = Math.round(api.now() + COUNTDOWN_MS);
  try {
    await api.updateRoom(code, { status: 'countdown', startAt, results: null });
  } catch (err) {
    console.error(err);
    $('#start-btn').disabled = false;
    return;
  }
  Object.assign(room, { status: 'countdown', startAt });
  runRace({ resume: false });
}

function renderPhrases(phrases) {
  const list = $('#race-phrases');
  const total = phrases.reduce((s, p) => s + p.length, 0);
  list.classList.toggle('is-two', phrases.length > 4);
  // Más texto → letra más chica, siempre legible desde el fondo.
  const size = total > 600 ? 1.15 : total > 420 ? 1.3 : total > 260 ? 1.5 : 1.8;
  list.style.setProperty('--phrase-size', `clamp(1rem, ${size * 1.05}vw, ${size}rem)`);
  list.innerHTML = phrases.map((p) => `<li><span>${escapeHTML(p)}</span></li>`).join('');
}

function runRace({ resume }) {
  phase = 'race';
  playMusic('race');
  teardownRace();
  const participants = new Set([...players.keys()]);
  const list = [...participants].map((uid) => ({ uid, ...players.get(uid) }));
  showScreen('race');
  $('#race-code').textContent = code;
  $('#race-over').hidden = true;
  renderPhrases(room.config.phrases);

  const scene = $('#race-scene');
  const track = createTrack({ area: $('#track-area'), scene, players: list, onCrash: () => sound.crash() });
  race = {
    track, participants, started: false, ended: false, lastCount: null, raf: 0, activity: 0, lastLevelAt: 0,
    endAt: room.startAt + room.config.durationSec * 1000,
  };
  for (const p of list) if (p.live?.round === room.round) track.prime(p.uid, p.live);

  const countdown = $('#countdown');
  const number = $('#countdown-n');
  if (api.now() < room.startAt - 3000) printSceneStep(scene, 'reset');
  else printSceneStep(scene, 'all');

  const clock = $('#race-time');
  const tick = () => {
    if (!race || race.ended) return;
    const now = api.now();
    if (now < room.startAt) {
      const left = Math.ceil((room.startAt - now) / 1000);
      if (left <= 3 && left !== race.lastCount) {
        race.lastCount = left;
        countdown.hidden = false;
        stampNumber(number, String(left));
        printSceneStep(scene, left);
        sound.count();
      }
      clock.textContent = formatClock(room.config.durationSec);
    } else {
      if (!race.started) {
        race.started = true;
        printSceneStep(scene, 'all');
        if (!resume || now - room.startAt < 1500) {
          countdown.hidden = false;
          stampNumber(number, '¡YA!');
          sound.go();
          setTimeout(() => { countdown.hidden = true; }, 1100);
        }
        track.go();
        sound.engineStart();
        if (room.status === 'countdown') {
          room.status = 'racing';
          api.updateRoom(code, { status: 'racing' }).catch(console.error);
        }
      }
      // El motor sigue el ritmo de la carrera: cuánto avanzó la pista en el último cuarto de segundo.
      if (now - race.lastLevelAt > 250) {
        race.lastLevelAt = now;
        sound.engineLevel(race.activity / Math.max(1, race.participants.size) * 160);
        race.activity = 0;
      }
      const left = (race.endAt - now) / 1000;
      clock.textContent = formatClock(left);
      clock.classList.toggle('is-low', left <= 10);
      if (left <= 0) { endRace(); return; }
    }
    race.raf = requestAnimationFrame(tick);
  };
  race.raf = requestAnimationFrame(tick);
}

async function endRace() {
  if (!race || race.ended) return;
  race.ended = true;
  cancelAnimationFrame(race.raf);
  race.track.stop();
  sound.engineStop();
  sound.horn();
  $('#race-time').textContent = '0:00';
  $('#countdown').hidden = true;
  const over = $('#race-over');
  over.hidden = false;
  if (!prefersReducedMotion()) gsap.fromTo(over, { scale: 1.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2.5)' });

  room.status = 'finished';
  await api.updateRoom(code, { status: 'finished' }).catch(console.error);
  await waitForFinals(race.participants);
  const ranked = computeRanking(race.participants);
  await publishResults(ranked);
  showResults(ranked);
}

/** Espera a que cada jugador mande su resultado final (o se acabe el plazo). */
function waitForFinals(participants) {
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      const pending = [...participants].filter((uid) => players.has(uid) && !isDone(players.get(uid)));
      if (!pending.length || Date.now() - started > FINALS_TIMEOUT_MS) resolve();
      else setTimeout(check, 250);
    };
    setTimeout(check, 600);
  });
}

function computeRanking(participants) {
  const entries = [...participants].filter((uid) => players.has(uid)).map((uid) => {
    const p = players.get(uid);
    const f = p.final?.round === room.round ? p.final : null;
    return {
      uid, name: p.name, vehicle: p.vehicle,
      score: f?.score ?? 0, errors: f?.errors ?? 0, correct: f?.correct ?? 0,
      accuracy: f?.accuracy ?? 0, lastKeyAt: f?.lastKeyAt ?? 0,
    };
  });
  return rank(entries);
}

async function publishResults(ranked) {
  const positions = Object.fromEntries(ranked.map((r) => [r.uid, r.position]));
  await api.updateRoom(code, { results: { round: room.round, total: ranked.length, positions } }).catch(console.error);
}

function showResults(ranked) {
  phase = 'results';
  playMusic('lobby');
  showScreen('results');
  room.lastRanked = ranked;
  playPodium(ranked);
}

function teardownRace() {
  sound.engineStop();
  if (!race) return;
  cancelAnimationFrame(race.raf);
  race.track?.destroy();
  race = null;
}

async function rematch() {
  const round = room.round + 1;
  const config = buildRaceConfig(round);
  try {
    await api.updateRoom(code, { config, round, status: 'lobby', startAt: null, results: null });
  } catch (err) { console.error(err); return; }
  Object.assign(room, { config, round, status: 'lobby', startAt: null });
  goLobby();
}

// ---------------------------------------------------------------------------
// Retomar una sala abierta (recarga de página)
// ---------------------------------------------------------------------------
async function resumeRoom(found) {
  code = found.code;
  room = {
    status: found.room.status, round: found.room.round, config: found.room.config, startAt: found.room.startAt,
  };
  resetLobby();
  listen();
  await new Promise((r) => setTimeout(r, 700)); // deja llegar a los jugadores
  const now = api.now();
  if (room.status === 'lobby') goLobby();
  else if ((room.status === 'countdown' || room.status === 'racing') && now < room.startAt + room.config.durationSec * 1000) {
    runRace({ resume: true });
  } else {
    if (room.status !== 'finished') await api.updateRoom(code, { status: 'finished' }).catch(console.error);
    room.status = 'finished';
    const ranked = computeRanking(new Set(players.keys()));
    await publishResults(ranked);
    showResults(ranked);
  }
}

async function offerResume() {
  const found = await api.findOpenRoom().catch(() => null);
  const box = $('#resume');
  if (!found) { box.hidden = true; return; }
  const labels = { lobby: 'en el lobby', countdown: 'en carrera', racing: 'en carrera', finished: 'con resultados' };
  $('#resume-text').textContent = `Tienes la sala ${found.code} abierta ${labels[found.room.status] || ''}.`;
  box.hidden = false;
  $('#resume-go').onclick = () => { box.hidden = true; resumeRoom(found); };
  $('#resume-close').onclick = async () => {
    box.hidden = true;
    await api.removeRoom(found.code).catch(console.error);
  };
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Panel de audio: música y efectos con silencio y volumen independientes
// ---------------------------------------------------------------------------
function syncAudioPanel() {
  const prefs = getAudioPrefs();
  for (const channel of ['music', 'sfx']) {
    const { volume, muted } = prefs[channel];
    const pct = Math.round(volume * 100);
    $(`[data-volume="${channel}"]`).value = String(pct);
    $(`[data-volume-out="${channel}"]`).textContent = String(muted ? 0 : pct);
    const btn = $(`[data-mute="${channel}"]`);
    btn.setAttribute('aria-pressed', String(muted));
    btn.setAttribute('aria-label', `${muted ? 'Activar' : 'Silenciar'} ${channel === 'music' ? 'música' : 'efectos'}`);
  }
}

function bindAudioPanel() {
  const panel = $('#audio-panel');
  let opener = null;
  const close = () => {
    panel.hidden = true;
    opener?.setAttribute('aria-expanded', 'false');
  };
  for (const btn of document.querySelectorAll('[data-audio-open]')) {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!panel.hidden && opener === btn) { close(); return; }
      opener?.setAttribute('aria-expanded', 'false');
      opener = btn;
      syncAudioPanel();
      panel.hidden = false;
      const r = btn.getBoundingClientRect();
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      panel.style.left = `${Math.max(16, Math.min(window.innerWidth - w - 16, r.right - w))}px`;
      panel.style.top = r.bottom + h + 12 < window.innerHeight ? `${r.bottom + 8}px` : `${Math.max(16, r.top - h - 8)}px`;
      btn.setAttribute('aria-expanded', 'true');
      $('[data-volume="music"]', panel).focus();
    });
  }
  document.addEventListener('pointerdown', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !e.target.closest('[data-audio-open]')) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { close(); opener?.focus(); } });
  for (const range of panel.querySelectorAll('[data-volume]')) {
    range.addEventListener('input', () => { setVolume(range.dataset.volume, Number(range.value) / 100); syncAudioPanel(); });
  }
  for (const btn of panel.querySelectorAll('[data-mute]')) {
    btn.addEventListener('click', () => {
      const channel = btn.dataset.mute;
      setMuted(channel, !getAudioPrefs()[channel].muted);
      syncAudioPanel();
    });
  }
}

function bindButtons() {
  unlockOnGesture();
  bindAudioPanel();
  $('#start-btn').addEventListener('click', startRace);
  $('#lobby-config').addEventListener('click', () => goSetup('reconfigure'));
  $('#lobby-close').addEventListener('click', closeRoom);
  $('#stop-btn').addEventListener('click', () => {
    if (window.confirm('¿Terminar la carrera ahora? Se mostrarán los resultados.')) endRace();
  });
  $('#to-table').addEventListener('click', () => showStandings(room.lastRanked, { total: room.lastRanked.length, round: room.round }));
  $('#replay-podium').addEventListener('click', () => playPodium(room.lastRanked));
  $('#rematch-btn').addEventListener('click', rematch);
  $('#newconfig-btn').addEventListener('click', () => goSetup('reconfigure'));
  $('#close-btn').addEventListener('click', closeRoom);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' && !e.target.closest('input, textarea, select')) {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    }
  });
}

async function main() {
  initSetup({
    onSubmit: async () => {
      if (code) await reconfigure();
      else await createRoom();
    },
    onCancel: () => {
      if (returnTo === 'results') { phase = 'results'; showScreen('results'); } else goLobby();
    },
  });
  initLobby({ onKick: kick });
  bindButtons();
  goSetup('create');

  try {
    if (demoCount) {
      const { createDemoBackend } = await import('./simulator.js');
      api = createDemoBackend(demoCount);
    } else {
      const { createFirebaseBackend } = await import('./room-api.js');
      api = createFirebaseBackend();
    }
    await api.init();
  } catch (err) {
    console.error(err);
    const { friendlyError } = await import('../firebase.js').catch(() => ({ friendlyError: () => null }));
    setSetupError(friendlyError?.(err) || 'No se pudo conectar con Firebase. Revisa la conexión y recarga la página.');
    $('#setup-submit').disabled = true;
    return;
  }

  api.onConnection((online) => { $('#conn').hidden = online; });
  if (!api.demo) offerResume();
}

function waitForLibs() {
  if (window.gsap) return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
}

waitForLibs().then(main);
