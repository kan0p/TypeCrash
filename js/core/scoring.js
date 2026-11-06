// Puntaje, avance en la pista y ranking. Funciones PURAS.

export const POINTS_CORRECT = 10;
export const POINTS_ERROR = -5;

/**
 * Puntaje de una frase.
 * +10 por carácter correcto, −5 por error, y si la frase se COMPLETÓ antes de su
 * límite, + milisegundos restantes ÷ 100 (3,4 s sobrantes = +34). Nunca baja de 0.
 */
export function phraseScore({ correct = 0, errors = 0, completed = false, remainingMs = 0 }) {
  const base = correct * POINTS_CORRECT + errors * POINTS_ERROR;
  const bonus = completed && remainingMs > 0 ? Math.floor(remainingMs / 100) : 0;
  return Math.max(0, base + bonus);
}

/** Puntaje total = suma de las frases. */
export function totalScore(phraseResults) {
  return phraseResults.reduce((sum, r) => sum + phraseScore(r), 0);
}

/** Precisión en %, con un decimal. Sin pulsaciones = 0. */
export function accuracy(correct, errors) {
  const typed = correct + errors;
  if (!typed) return 0;
  return Math.round((correct / typed) * 1000) / 10;
}

/** avance = max(0, correctos − 0,5 × errores) / totalCaracteres, entre 0 y 1. */
export function trackProgress(correct, errors, totalChars) {
  if (!totalChars) return 0;
  return Math.min(1, Math.max(0, correct - 0.5 * errors) / totalChars);
}

/**
 * Resume todas las frases de un jugador en su resultado final.
 * @param {Array<{correct:number, errors:number, completed:boolean, remainingMs:number}>} phraseResults
 */
export function summarize(phraseResults, lastKeyAt = 0) {
  const correct = phraseResults.reduce((s, r) => s + r.correct, 0);
  const errors = phraseResults.reduce((s, r) => s + r.errors, 0);
  return {
    score: totalScore(phraseResults),
    errors,
    correct,
    accuracy: accuracy(correct, errors),
    lastKeyAt,
  };
}

/** Orden del ranking: puntaje (desc) → errores (asc) → última pulsación (asc). */
export function compareResults(a, b) {
  return (b.score - a.score)
    || (a.errors - b.errors)
    || ((a.lastKeyAt || Infinity) - (b.lastKeyAt || Infinity));
}

/** Ordena y agrega la posición (1, 2, 3…). */
export function rank(results) {
  return [...results].sort(compareResults).map((r, i) => ({ ...r, position: i + 1 }));
}
