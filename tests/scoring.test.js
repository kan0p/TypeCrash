import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  phraseScore, totalScore, accuracy, trackProgress, summarize, rank, compareResults,
} from '../js/core/scoring.js';

test('frase perfecta: +10 por carácter más bono de velocidad', () => {
  assert.equal(phraseScore({ correct: 30, errors: 0, completed: true, remainingMs: 3400 }), 300 + 34);
});

test('frase con errores: −5 por error', () => {
  assert.equal(phraseScore({ correct: 28, errors: 2, completed: true, remainingMs: 0 }), 280 - 10);
});

test('frase incompleta por tiempo: sin bono aunque quede tiempo informado', () => {
  assert.equal(phraseScore({ correct: 12, errors: 1, completed: false, remainingMs: 5000 }), 115);
});

test('el puntaje de una frase nunca baja de 0', () => {
  assert.equal(phraseScore({ correct: 1, errors: 9, completed: true, remainingMs: 0 }), 0);
});

test('bono en milisegundos: ms restantes ÷ 100, redondeado hacia abajo', () => {
  assert.equal(phraseScore({ correct: 0, errors: 0, completed: true, remainingMs: 3499 }), 34);
  assert.equal(phraseScore({ correct: 0, errors: 0, completed: true, remainingMs: 99 }), 0);
});

test('total = suma de frases, cada una con su piso en 0', () => {
  const total = totalScore([
    { correct: 10, errors: 0, completed: true, remainingMs: 1000 }, // 110
    { correct: 0, errors: 4, completed: false, remainingMs: 0 }, // 0 (no −20)
  ]);
  assert.equal(total, 110);
});

test('precisión con un decimal y 0 sin pulsaciones', () => {
  assert.equal(accuracy(9, 1), 90);
  assert.equal(accuracy(2, 1), 66.7);
  assert.equal(accuracy(0, 0), 0);
});

test('avance en la pista penaliza errores y queda entre 0 y 1', () => {
  assert.equal(trackProgress(50, 0, 100), 0.5);
  assert.equal(trackProgress(50, 20, 100), 0.4);
  assert.equal(trackProgress(2, 10, 100), 0);
  assert.equal(trackProgress(100, 0, 100), 1);
  assert.equal(trackProgress(5, 0, 0), 0);
});

test('summarize junta frases en el resultado final', () => {
  const r = summarize([
    { correct: 10, errors: 1, completed: true, remainingMs: 500 },
    { correct: 5, errors: 0, completed: false, remainingMs: 0 },
  ], 1234);
  assert.deepEqual(r, { score: 100 - 5 + 5 + 50, errors: 1, correct: 15, accuracy: 93.8, lastKeyAt: 1234 });
});

test('ranking: puntaje desc, luego errores asc, luego última pulsación asc', () => {
  const ranked = rank([
    { id: 'a', score: 500, errors: 3, lastKeyAt: 10 },
    { id: 'b', score: 700, errors: 9, lastKeyAt: 50 },
    { id: 'c', score: 500, errors: 1, lastKeyAt: 90 },
    { id: 'd', score: 500, errors: 1, lastKeyAt: 20 },
  ]);
  assert.deepEqual(ranked.map((r) => r.id), ['b', 'd', 'c', 'a']);
  assert.deepEqual(ranked.map((r) => r.position), [1, 2, 3, 4]);
});

test('ranking: quien no tecleó (lastKeyAt 0) queda después en el empate', () => {
  assert.ok(compareResults({ score: 0, errors: 0, lastKeyAt: 0 }, { score: 0, errors: 0, lastKeyAt: 5 }) > 0);
});
