// Audio del anfitrión, en dos canales independientes (como en los juegos):
// - Música: dos pistas en bucle (ambiente para lobby y resultados, carrera para la carrera).
// - Efectos: sintetizados con Web Audio, sin archivos (cuenta regresiva, motor, choques…).
// Cada canal tiene su volumen y su silencio, y se recuerdan en este navegador.
// Suena por los parlantes del proyector; los computadores de los jugadores quedan en silencio.
import { storage } from '../shared/dom.js';

const KEY = 'typecrash.audio';
const DEFAULTS = { music: { volume: 0.6, muted: false }, sfx: { volume: 0.8, muted: false } };
const saved = storage.get(KEY, null) || {};
const prefs = {
  music: { ...DEFAULTS.music, ...saved.music },
  sfx: { ...DEFAULTS.sfx, ...saved.sfx },
};
const save = () => storage.set(KEY, prefs);

let ctx = null;
let master = null;
let engine = null;
let lastCrash = 0;

const sfxLevel = () => (prefs.sfx.muted ? 0 : prefs.sfx.volume);
const sfxOn = () => sfxLevel() > 0;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = sfxLevel();
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// ---------------------------------------------------------------------------
// Música
// ---------------------------------------------------------------------------
const TRACKS = { lobby: 'assets/audio/ambiente.mp3', race: 'assets/audio/carrera.mp3' };
const players = {};
let currentTrack = null;
let wantedTrack = null;
const musicLevel = () => (prefs.music.muted ? 0 : prefs.music.volume);

function track(name) {
  if (!players[name]) {
    const el = new Audio(TRACKS[name]);
    el.loop = true;
    el.preload = 'auto';
    el.volume = 0;
    players[name] = el;
  }
  return players[name];
}

/** Sube o baja el volumen de una pista en `ms` milisegundos. */
function fade(el, to, ms, onDone) {
  cancelAnimationFrame(el._fade);
  const from = el.volume;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * t));
    if (t < 1) el._fade = requestAnimationFrame(step);
    else onDone?.();
  };
  el._fade = requestAnimationFrame(step);
}

/** Cambia la música con un fundido cruzado: 'lobby', 'race' o null (silencio). */
export function playMusic(name) {
  wantedTrack = name;
  if (name === currentTrack) return;
  const previous = currentTrack ? track(currentTrack) : null;
  currentTrack = name;
  if (previous) fade(previous, 0, 900, () => previous.pause());
  if (!name) return;
  const el = track(name);
  if (name === 'race') el.currentTime = 0; // la carrera siempre parte desde el inicio
  el.play().then(() => fade(el, musicLevel(), 1200)).catch(() => {
    currentTrack = null; // el navegador aún no permite audio: se reintenta con el primer clic
  });
}

function applyMusicLevel() {
  if (currentTrack) fade(track(currentTrack), musicLevel(), 250);
}

/** Los navegadores solo permiten audio después de un clic: se desbloquea en el primero. */
export function unlockOnGesture() {
  const unlock = () => {
    audio();
    if (wantedTrack && !currentTrack) playMusic(wantedTrack);
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

// ---------------------------------------------------------------------------
// Preferencias (panel de audio)
// ---------------------------------------------------------------------------
export function getAudioPrefs() { return structuredClone(prefs); }

/** channel: 'music' | 'sfx'. */
export function setVolume(channel, volume) {
  prefs[channel].volume = Math.max(0, Math.min(1, volume));
  if (prefs[channel].volume > 0) prefs[channel].muted = false;
  save();
  applyLevels(channel);
}

export function setMuted(channel, muted) {
  prefs[channel].muted = muted;
  save();
  applyLevels(channel);
}

function applyLevels(channel) {
  if (channel === 'music') applyMusicLevel();
  else if (master) master.gain.setTargetAtTime(sfxLevel(), ctx.currentTime, 0.05);
}

function tone(freq, { at = 0, dur = 0.15, type = 'square', vol = 0.18, slide = null } = {}) {
  const ac = audio();
  if (!ac || !sfxOn()) return;
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise({ at = 0, dur = 0.3, vol = 0.25, freq = 900, q = 0.8 } = {}) {
  const ac = audio();
  if (!ac || !sfxOn()) return;
  const t = ac.currentTime + at;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t);
}

export const sound = {
  /** Un jugador entra al lobby. */
  join() { tone(660, { dur: 0.08, vol: 0.1 }); tone(990, { at: 0.07, dur: 0.1, vol: 0.1 }); },
  /** 3, 2, 1… */
  count() { tone(440, { dur: 0.22, vol: 0.2 }); },
  /** ¡YA! */
  go() { tone(880, { dur: 0.5, vol: 0.22 }); tone(1320, { dur: 0.5, vol: 0.1, type: 'triangle' }); },
  /** Choque (limitado para que 50 jugadores no saturen). */
  crash() {
    const now = performance.now();
    if (now - lastCrash < 140) return;
    lastCrash = now;
    noise({ dur: 0.22, vol: 0.16, freq: 500 + Math.random() * 600 });
    tone(140, { dur: 0.18, type: 'triangle', vol: 0.12, slide: 70 });
  },
  /** Bocina de fin de tiempo. */
  horn() { tone(330, { dur: 0.7, type: 'sawtooth', vol: 0.12 }); tone(415, { dur: 0.7, type: 'sawtooth', vol: 0.1 }); },
  /** Redoble antes del 1.º lugar. */
  drumroll(seconds = 1.2) { for (let i = 0; i < seconds * 22; i++) noise({ at: i / 22, dur: 0.05, vol: 0.05 + (i / (seconds * 22)) * 0.1, freq: 2200, q: 0.5 }); },
  /** Revelación de 3.º y 2.º. */
  reveal() { tone(523, { dur: 0.14, vol: 0.14 }); tone(784, { at: 0.12, dur: 0.22, vol: 0.14 }); },
  /** Fanfarria del 1.º. */
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.12, dur: 0.18, vol: 0.16 }));
    tone(1047, { at: 0.5, dur: 0.9, vol: 0.15 });
    tone(784, { at: 0.5, dur: 0.9, vol: 0.1, type: 'triangle' });
  },

  /** Motor de fondo: su volumen y tono siguen la velocidad de la carrera (0..1). */
  engineStart() {
    const ac = audio();
    if (!ac || engine) return;
    const osc = ac.createOscillator();
    const osc2 = ac.createOscillator();
    const filter = ac.createBiquadFilter();
    const g = ac.createGain();
    osc.type = 'sawtooth';
    osc2.type = 'square';
    osc.frequency.value = 48;
    osc2.frequency.value = 49.5;
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    g.gain.value = 0.0001;
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(g).connect(master);
    osc.start();
    osc2.start();
    engine = { osc, osc2, filter, g };
  },
  engineLevel(level) {
    if (!engine || !ctx) return;
    const t = ctx.currentTime;
    const l = Math.max(0, Math.min(1, level));
    engine.g.gain.setTargetAtTime(0.02 + l * 0.07, t, 0.3);
    engine.osc.frequency.setTargetAtTime(48 + l * 50, t, 0.4);
    engine.osc2.frequency.setTargetAtTime(49.5 + l * 52, t, 0.4);
    engine.filter.frequency.setTargetAtTime(220 + l * 500, t, 0.4);
  },
  engineStop() {
    if (!engine || !ctx) return;
    const { osc, osc2, g } = engine;
    g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    osc.stop(ctx.currentTime + 2);
    osc2.stop(ctx.currentTime + 2);
    engine = null;
  },
};
