// Configuración de la carrera (pantalla del anfitrión).
import { $, $$, storage, gsap, prefersReducedMotion, escapeHTML, markSVG } from '../shared/dom.js';
import { PHRASE_BANK } from '../data/phrase-bank.js';
import {
  parseCustomText, normalizePhrases, pickBankPhrases, clampPhraseCount, MAX_PHRASES,
} from '../core/texts.js';
import { clampDuration, formatClock, splitDuration, paceWarning } from '../core/timing.js';
import { vehicleSVG } from '../shared/vehicles.js';
import { sceneHTML, startParallax, ROAD_LINES_HTML } from '../shared/scene.js';

const SETTINGS_KEY = 'typecrash.settings';
const TEXTS_KEY = 'typecrash.texts';

const DEFAULTS = {
  durationSec: 60, source: 'bank', level: 1, count: 5,
  customText: '', normalize: false, normalizeLevel: 1,
};

let settings = { ...DEFAULTS, ...storage.get(SETTINGS_KEY, {}) };
let onSubmitCb = null;
let parallax = null;

const els = {};

function save() { storage.set(SETTINGS_KEY, settings); }

function savedTexts() { return storage.get(TEXTS_KEY, {}) || {}; }

/** Frases del texto propio ya parseadas (y ajustadas al nivel si corresponde). */
function customPhrases() {
  const { phrases, truncated } = parseCustomText(settings.customText);
  const list = settings.normalize ? normalizePhrases(phrases, settings.normalizeLevel) : phrases;
  return { phrases: list, truncated };
}

/**
 * Arma la configuración final de una ronda.
 * Banco: N frases al azar ordenadas de corta a larga.
 * Texto propio: N líneas en orden; en cada revancha avanza a las siguientes (rotando).
 */
export function buildRaceConfig(round = 1) {
  const durationSec = clampDuration(settings.durationSec);
  let phrases;
  let level = null;
  if (settings.source === 'bank') {
    level = settings.level;
    phrases = pickBankPhrases(PHRASE_BANK[level], settings.count);
  } else {
    const list = customPhrases().phrases;
    const n = clampPhraseCount(settings.count, list.length);
    const offset = list.length > n ? ((round - 1) * n) % list.length : 0;
    phrases = Array.from({ length: n }, (_, i) => list[(offset + i) % list.length]);
    if (settings.normalize) level = settings.normalizeLevel;
  }
  const phraseTimesMs = splitDuration(durationSec * 1000, phrases.map((p) => Array.from(p).length));
  const config = { durationSec, source: settings.source, phrases, phraseTimesMs };
  if (level) config.level = level;
  return config;
}

function estimatedChars() {
  if (settings.source === 'bank') {
    const bank = PHRASE_BANK[settings.level];
    const avg = bank.reduce((s, p) => s + p.length, 0) / bank.length;
    return Math.round(avg * clampPhraseCount(settings.count, bank.length));
  }
  const list = customPhrases().phrases;
  return list.slice(0, clampPhraseCount(settings.count, list.length)).reduce((s, p) => s + p.length, 0);
}

function render() {
  const sec = clampDuration(settings.durationSec);
  els.durOut.value = formatClock(sec);
  els.durOut.textContent = formatClock(sec);
  els.durRange.value = sec;
  els.durMinus.disabled = sec <= 30;
  els.durPlus.disabled = sec >= 300;

  for (const r of $$('input[name="source"]')) r.checked = r.value === settings.source;
  for (const r of $$('input[name="level"]')) r.checked = Number(r.value) === settings.level;
  els.bank.hidden = settings.source !== 'bank';
  els.custom.hidden = settings.source !== 'custom';
  els.normalize.checked = settings.normalize;
  els.normalizeLevel.disabled = !settings.normalize;
  els.normalizeLevel.value = String(settings.normalizeLevel);
  if (document.activeElement !== els.customText) els.customText.value = settings.customText;

  const isCustom = settings.source === 'custom';
  const list = isCustom ? customPhrases() : null;
  const max = isCustom ? Math.max(1, Math.min(MAX_PHRASES, list.phrases.length)) : MAX_PHRASES;
  const count = Math.min(Math.max(1, settings.count), max);
  els.countOut.textContent = String(count);
  els.countMinus.disabled = count <= 1;
  els.countPlus.disabled = count >= max;
  els.countHint.textContent = isCustom
    ? 'primeras líneas de tu texto, en su orden'
    : 'al azar del nivel, de la más corta a la más larga';

  if (isCustom) {
    const n = list.phrases.length;
    let info = n ? `${n} ${n === 1 ? 'frase' : 'frases'} detectadas.` : 'Escribe o pega tus frases, una por línea.';
    if (list.truncated.length) info += ` ${list.truncated.length} ${list.truncated.length === 1 ? 'línea superaba' : 'líneas superaban'} 120 caracteres y se cortó en el espacio más cercano.`;
    els.customInfo.textContent = info;
  }

  // Textos guardados
  const texts = savedTexts();
  const current = els.savedSelect.value;
  els.savedSelect.innerHTML = '<option value="">Textos guardados…</option>'
    + Object.keys(texts).sort((a, b) => a.localeCompare(b, 'es'))
      .map((name) => `<option value="${encodeURIComponent(name)}">${escapeHTML(name)}</option>`).join('');
  els.savedSelect.value = current;
  els.savedDelete.disabled = !els.savedSelect.value;

  // Advertencia de ritmo (no bloquea)
  const warn = paceWarning(sec, estimatedChars());
  els.pace.hidden = !warn;
  if (warn) {
    const per = warn.secPerChar.toFixed(2).replace('.', ',');
    els.pace.innerHTML = warn.kind === 'hard'
      ? `${markSVG('warn')}<p>Quedan ${per} s por letra: la carrera será casi imposible de terminar. Sube el tiempo o usa menos frases.</p>`
      : `${markSVG('warn')}<p>Quedan ${per} s por letra: la carrera será lenta. Baja el tiempo o agrega frases.</p>`;
  }
}

function setError(message) {
  els.error.hidden = !message;
  els.error.innerHTML = message ? `${markSVG('error')}<p>${message}</p>` : '';
}

function bind() {
  Object.assign(els, {
    form: $('#setup-form'),
    heading: $('#setup-heading'),
    durOut: $('#dur-out'), durRange: $('#dur-range'), durMinus: $('#dur-minus'), durPlus: $('#dur-plus'),
    bank: $('#source-bank'), custom: $('#source-custom'),
    customText: $('#custom-text'), customInfo: $('#custom-info'),
    normalize: $('#normalize'), normalizeLevel: $('#normalize-level'),
    savedSelect: $('#saved-select'), savedDelete: $('#saved-delete'), savedName: $('#saved-name'), savedSave: $('#saved-save'),
    countOut: $('#count-out'), countMinus: $('#count-minus'), countPlus: $('#count-plus'), countHint: $('#count-hint'),
    pace: $('#pace'), error: $('#setup-error'),
    submit: $('#setup-submit'), cancel: $('#setup-cancel'),
  });

  const setDuration = (v) => { settings.durationSec = clampDuration(v); save(); render(); };
  els.durRange.addEventListener('input', () => setDuration(els.durRange.value));
  els.durMinus.addEventListener('click', () => setDuration(settings.durationSec - 5));
  els.durPlus.addEventListener('click', () => setDuration(settings.durationSec + 5));

  for (const r of $$('input[name="source"]')) {
    r.addEventListener('change', () => { settings.source = r.value; save(); render(); });
  }
  for (const r of $$('input[name="level"]')) {
    r.addEventListener('change', () => { settings.level = Number(r.value); save(); render(); });
  }
  els.customText.addEventListener('input', () => { settings.customText = els.customText.value; save(); render(); });
  els.normalize.addEventListener('change', () => { settings.normalize = els.normalize.checked; save(); render(); });
  els.normalizeLevel.addEventListener('change', () => { settings.normalizeLevel = Number(els.normalizeLevel.value); save(); render(); });

  const setCount = (n) => { settings.count = Math.max(1, Math.min(MAX_PHRASES, n)); save(); render(); };
  els.countMinus.addEventListener('click', () => setCount(Number(els.countOut.textContent) - 1));
  els.countPlus.addEventListener('click', () => setCount(Number(els.countOut.textContent) + 1));

  els.savedSelect.addEventListener('change', () => {
    const name = decodeURIComponent(els.savedSelect.value);
    const text = savedTexts()[name];
    if (text != null) {
      settings.customText = text;
      els.customText.value = text;
      els.savedName.value = name;
      save();
    }
    render();
  });
  els.savedSave.addEventListener('click', () => {
    const name = els.savedName.value.trim();
    if (!name) { els.savedName.focus(); els.savedName.setAttribute('aria-invalid', 'true'); return; }
    els.savedName.removeAttribute('aria-invalid');
    const texts = savedTexts();
    texts[name] = settings.customText;
    if (!storage.set(TEXTS_KEY, texts)) {
      setError('Este navegador no permite guardar textos (modo privado o almacenamiento bloqueado).');
      return;
    }
    render();
    els.savedSelect.value = encodeURIComponent(name);
    els.savedDelete.disabled = false;
    els.savedSave.textContent = 'Guardado';
    setTimeout(() => { els.savedSave.textContent = 'Guardar texto'; }, 1400);
  });
  els.savedDelete.addEventListener('click', () => {
    const name = decodeURIComponent(els.savedSelect.value);
    if (!name || !window.confirm(`¿Borrar el texto «${name}»?`)) return;
    const texts = savedTexts();
    delete texts[name];
    storage.set(TEXTS_KEY, texts);
    els.savedSelect.value = '';
    render();
  });

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setError('');
    if (settings.source === 'custom' && !customPhrases().phrases.length) {
      setError('Escribe al menos una frase (una por línea) o elige el texto predefinido.');
      els.customText.focus();
      return;
    }
    els.submit.disabled = true;
    try {
      await onSubmitCb?.();
    } catch (err) {
      setError(err?.friendly || 'No se pudo crear la sala. Revisa la conexión e inténtalo de nuevo.');
      console.error(err);
    } finally {
      els.submit.disabled = false;
    }
  });
}

function startParade() {
  const parade = $('#setup-parade');
  const scene = $('#setup-scene');
  if (!scene.querySelector('.scene__sky')) scene.insertAdjacentHTML('afterbegin', sceneHTML());
  if (parallax) return;
  const picks = [['completo', 'maiz'], ['cuna', 'tomate'], ['tina', 'turquesa'], ['rally', 'sal'], ['cohete', 'magenta'], ['sofa', 'cobalto']];
  parade.innerHTML = ROAD_LINES_HTML + picks.map(([t, c]) => `<div class="parade__car">${vehicleSVG(t, c)}</div>`).join('');
  parallax = startParallax(scene, gsap, { reduced: prefersReducedMotion(), roads: [parade] });
  if (prefersReducedMotion()) {
    $$('.parade__car', parade).forEach((car, i) => { car.style.left = `${4 + i * 16}%`; });
    return;
  }
  $$('.parade__car', parade).forEach((car, i) => {
    const wheels = car.querySelectorAll('.wheel');
    gsap.to(wheels, { rotation: 360, transformOrigin: '50% 50%', duration: 0.7, ease: 'none', repeat: -1 });
    gsap.fromTo(car, { x: '-120%', left: 0 }, {
      x: () => `${parade.offsetWidth / car.offsetWidth * 100 + 20}%`,
      duration: 9 + (i % 3) * 1.7,
      ease: 'none',
      repeat: -1,
      delay: i * 1.6,
    });
    gsap.to(car.querySelector('.body'), { y: -1.5, duration: 0.18, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  });
}

/**
 * @param {{ onSubmit: () => Promise<void> }} opts
 */
export function initSetup({ onSubmit, onCancel }) {
  onSubmitCb = onSubmit;
  bind();
  $('#setup-cancel').addEventListener('click', () => onCancel?.());
  render();
}

/** Prepara el formulario: 'create' (sala nueva) o 'reconfigure' (sala abierta). */
export function prepareSetup(mode) {
  const reconfigure = mode === 'reconfigure';
  els.heading.textContent = reconfigure ? 'Nueva configuración' : 'Arma la carrera';
  els.submit.textContent = reconfigure ? 'Guardar y volver' : 'Crear sala';
  els.cancel.hidden = !reconfigure;
  setError('');
  render();
  startParade();
}

export { setError as setSetupError };
