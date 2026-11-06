// Motor de tecleo SIN corrección y lector de entrada compatible con teclas muertas.
// Funciones PURAS: no tocan el DOM. El lector recibe un objeto con `.value`
// (el textarea oculto en el navegador, un objeto simple en los tests).

/** Estado inicial de una frase. */
export function createPhrase(phrase) {
  const chars = Array.from(String(phrase).normalize('NFC'));
  return { chars, marks: [], pos: 0, correct: 0, errors: 0, done: chars.length === 0 };
}

/**
 * Consume UN carácter tecleado. Siempre avanza el cursor:
 * coincide → correcto; no coincide → error. Devuelve un estado nuevo.
 */
export function typeChar(state, typed) {
  if (state.done) return state;
  const ch = String(typed).normalize('NFC');
  const ok = ch === state.chars[state.pos];
  const marks = [...state.marks, ok ? 'ok' : 'err'];
  const pos = state.pos + 1;
  return {
    ...state,
    marks,
    pos,
    correct: state.correct + (ok ? 1 : 0),
    errors: state.errors + (ok ? 0 : 1),
    done: pos >= state.chars.length,
  };
}

/**
 * Consume un texto (puede traer varios caracteres, p.ej. "´x" tras una tecla muerta).
 * @returns {{ state, typed: Array<{index:number, ok:boolean}>, overflow: string }}
 *   overflow = lo que sobró después de completar la frase (va a la siguiente).
 */
export function typeText(state, text) {
  const chars = Array.from(String(text ?? '').normalize('NFC'));
  const typed = [];
  let s = state;
  let i = 0;
  for (; i < chars.length && !s.done; i++) {
    const index = s.pos;
    s = typeChar(s, chars[i]);
    typed.push({ index, ok: s.marks[index] === 'ok' });
  }
  return { state: s, typed, overflow: chars.slice(i).join('') };
}

/** Cierra la frase por tiempo: lo no escrito no suma. */
export function closePhrase(state) {
  return { ...state, done: true };
}

/** Teclas que no hacen nada (borrar quitaría tiempo y frustraría). */
const BLOCKED_KEYS = new Set(['Backspace', 'Delete', 'Enter', 'Tab', 'Insert']);

export function isBlockedKey(key, { ctrlKey = false, metaKey = false } = {}) {
  if (BLOCKED_KEYS.has(key)) return true;
  // Atajos de pegar/cortar/deshacer.
  if ((ctrlKey || metaKey) && ['v', 'V', 'x', 'X', 'z', 'Z', 'y', 'Y'].includes(key)) return true;
  return false;
}

/** inputType de `beforeinput` que se cancelan. Solo se permite insertar texto. */
export function isBlockedInputType(inputType) {
  if (!inputType) return false;
  if (inputType === 'insertText' || inputType === 'insertCompositionText'
    || inputType === 'insertReplacementText' || inputType === 'deleteCompositionText') return false;
  return true; // borrar, pegar, soltar, saltos de línea, deshacer…
}

/**
 * Lector de entrada para el textarea oculto.
 * Respeta la composición (tecla muerta ´ + a = á) en Chrome y Firefox:
 * mientras se compone no se lee nada; al terminar se lee y se vacía el campo.
 */
export function createInputReader(field) {
  let composing = false;

  function read() {
    if (composing) return '';
    const value = field.value;
    field.value = '';
    return value ? value.normalize('NFC') : '';
  }

  return {
    get composing() { return composing; },
    compositionStart() { composing = true; return ''; },
    /** Chrome dispara compositionend DESPUÉS del último input; Firefox, ANTES. */
    compositionEnd() { composing = false; return read(); },
    input({ isComposing = false } = {}) {
      if (isComposing || composing) return '';
      return read();
    },
    /** Al perder la composición (blur), se descarta lo pendiente. */
    reset() { composing = false; field.value = ''; },
  };
}
