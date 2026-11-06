// Textos: parseo de texto propio, normalización por nivel y selección del banco.
// Funciones PURAS (sin DOM ni Firebase) para poder testearlas con node --test.

export const MAX_PHRASE_LENGTH = 120;
export const MIN_PHRASES = 1;
export const MAX_PHRASES = 10;

/** Normaliza a NFC y unifica caracteres tipográficos que no existen en un teclado español. */
export function toTypeable(text) {
  return String(text ?? '')
    .normalize('NFC')
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„«»″]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/…/g, '...')
    .replace(/[   \t]/g, ' ');
}

/** Recorta extremos y colapsa espacios repetidos. */
export function collapseSpaces(text) {
  return String(text).replace(/ {2,}/g, ' ').trim();
}

/**
 * Corta una frase demasiado larga en el espacio más cercano al límite.
 * Si no hay espacios, corta en seco.
 */
export function truncatePhrase(phrase, max = MAX_PHRASE_LENGTH) {
  if (phrase.length <= max) return phrase;
  const cut = phrase.lastIndexOf(' ', max);
  return (cut > 0 ? phrase.slice(0, cut) : phrase.slice(0, max)).trim();
}

/**
 * Texto propio → frases. Cada línea no vacía es una frase.
 * @returns {{ phrases: string[], truncated: number[] }} truncated = índices de frases recortadas
 */
export function parseCustomText(text) {
  const phrases = [];
  const truncated = [];
  for (const raw of toTypeable(text).split(/\r?\n/)) {
    const line = collapseSpaces(raw);
    if (!line) continue;
    const short = truncatePhrase(line);
    if (short !== line) truncated.push(phrases.length);
    phrases.push(short);
  }
  return { phrases, truncated };
}

function stripDiacritics(text) {
  // Quita tildes y diéresis; la ñ también se convierte en n (nivel 1 no la usa).
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

function capitalizeFirst(text) {
  return text ? text[0].toLocaleUpperCase('es') + text.slice(1) : text;
}

/**
 * Aplica las reglas de un nivel a una frase.
 * 1: minúsculas, sin tildes ni ñ, sin puntuación, sin números.
 * 2: mayúscula inicial, tildes y ñ, sin puntuación salvo punto final, sin números.
 * 3: se deja tal cual (solo se asegura que sea tecleable).
 */
export function normalizeForLevel(phrase, level) {
  let text = collapseSpaces(toTypeable(phrase));
  if (level === 1) {
    text = stripDiacritics(text.toLocaleLowerCase('es'))
      .replace(/[^a-z ]/g, ' ');
    return collapseSpaces(text);
  }
  if (level === 2) {
    const endsWithPeriod = /[.!?]\s*$/.test(text);
    text = text.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, ' ');
    text = capitalizeFirst(collapseSpaces(text));
    return text && endsWithPeriod ? `${text}.` : text;
  }
  return text;
}

/** Normaliza una lista de frases, descartando las que quedan vacías. */
export function normalizePhrases(phrases, level) {
  return phrases.map((p) => truncatePhrase(normalizeForLevel(p, level))).filter(Boolean);
}

/** Mezcla Fisher–Yates con un generador inyectable (para tests). */
export function shuffle(list, random = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Elige n frases al azar del banco y las ordena de más corta a más larga. */
export function pickBankPhrases(bank, n, random = Math.random) {
  const count = clampPhraseCount(n, bank.length);
  return shuffle(bank, random)
    .slice(0, count)
    .sort((a, b) => a.length - b.length);
}

/** Primeras n frases de un texto propio, en su orden. */
export function pickCustomPhrases(phrases, n) {
  return phrases.slice(0, clampPhraseCount(n, phrases.length));
}

export function clampPhraseCount(n, available = MAX_PHRASES) {
  const wanted = Math.min(MAX_PHRASES, Math.max(MIN_PHRASES, Math.round(Number(n) || 0)));
  return Math.min(wanted, available);
}

/** Clave estable para detectar nombres repetidos: "José  Pérez" y "jose perez" chocan. */
export function nameKey(name) {
  return stripDiacritics(collapseSpaces(String(name ?? '')).toLocaleLowerCase('es'))
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

/** Valida y limpia el nombre de un jugador. */
export function cleanPlayerName(name) {
  const clean = collapseSpaces(toTypeable(name));
  if (clean.length < 2) return { ok: false, name: clean, reason: 'Tu nombre debe tener al menos 2 letras.' };
  if (clean.length > 20) return { ok: false, name: clean, reason: 'Tu nombre puede tener hasta 20 caracteres.' };
  if (!nameKey(clean)) return { ok: false, name: clean, reason: 'Usa letras o números en tu nombre.' };
  return { ok: true, name: clean };
}
