// Tiempos de la carrera. Funciones PURAS.

export const MIN_DURATION_SEC = 30;
export const MAX_DURATION_SEC = 300;
export const DURATION_STEP_SEC = 5;

/** true si la duración es múltiplo de 5 entre 30 y 300. */
export function isValidDuration(sec) {
  return Number.isInteger(sec)
    && sec >= MIN_DURATION_SEC
    && sec <= MAX_DURATION_SEC
    && sec % DURATION_STEP_SEC === 0;
}

/** Lleva cualquier valor a la duración válida más cercana. */
export function clampDuration(sec) {
  const n = Math.round((Number(sec) || 0) / DURATION_STEP_SEC) * DURATION_STEP_SEC;
  return Math.min(MAX_DURATION_SEC, Math.max(MIN_DURATION_SEC, n));
}

/** 95 → "1:35" */
export function formatClock(totalSec) {
  const s = Math.max(0, Math.ceil(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Reparte el tiempo total proporcional al largo de cada frase:
 *   tiempoFrase_i = duraciónTotal × largo_i / Σ largos
 * Usa el método del mayor resto para que la suma sea EXACTAMENTE totalMs.
 */
export function splitDuration(totalMs, lengths) {
  const total = Math.round(totalMs);
  const sum = lengths.reduce((a, b) => a + b, 0);
  if (!lengths.length) return [];
  if (sum <= 0) return splitDuration(total, lengths.map(() => 1));
  const exact = lengths.map((len) => (total * len) / sum);
  const result = exact.map(Math.floor);
  let missing = total - result.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => ({ i, rest: v - Math.floor(v) }))
    .sort((a, b) => b.rest - a.rest || a.i - b.i);
  for (let k = 0; missing > 0; k = (k + 1) % order.length, missing--) {
    result[order[k].i] += 1;
  }
  return result;
}

/**
 * Advertencia no bloqueante según segundos por carácter.
 * @returns {null | {kind: 'hard'|'slow', secPerChar: number}}
 */
export function paceWarning(durationSec, totalChars) {
  if (!totalChars) return null;
  const secPerChar = durationSec / totalChars;
  if (secPerChar < 0.4) return { kind: 'hard', secPerChar };
  if (secPerChar > 3) return { kind: 'slow', secPerChar };
  return null;
}
