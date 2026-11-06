import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitDuration, isValidDuration, clampDuration, formatClock, paceWarning } from '../js/core/timing.js';

test('reparto proporcional suma exactamente la duración', () => {
  const cases = [
    [60000, [20, 35, 47]],
    [30000, [7, 7, 7]],
    [300000, [21, 33, 45, 51, 62, 69, 70, 25, 40, 33]],
    [45000, [1]],
    [95000, [13, 120, 59]],
  ];
  for (const [total, lengths] of cases) {
    const parts = splitDuration(total, lengths);
    assert.equal(parts.reduce((a, b) => a + b, 0), total, `${total} con ${lengths}`);
    assert.equal(parts.length, lengths.length);
  }
});

test('frases más largas reciben más tiempo', () => {
  const [a, b] = splitDuration(60000, [20, 40]);
  assert.equal(a, 20000);
  assert.equal(b, 40000);
});

test('duración: solo múltiplos de 5 entre 30 y 300', () => {
  assert.equal(isValidDuration(30), true);
  assert.equal(isValidDuration(300), true);
  assert.equal(isValidDuration(95), true);
  assert.equal(isValidDuration(25), false);
  assert.equal(isValidDuration(305), false);
  assert.equal(isValidDuration(62), false);
  assert.equal(clampDuration(62), 60);
  assert.equal(clampDuration(1000), 300);
  assert.equal(clampDuration(3), 30);
});

test('formato m:ss', () => {
  assert.equal(formatClock(95), '1:35');
  assert.equal(formatClock(300), '5:00');
  assert.equal(formatClock(4.2), '0:05');
  assert.equal(formatClock(-3), '0:00');
});

test('advertencia de ritmo', () => {
  assert.equal(paceWarning(30, 100).kind, 'hard');
  assert.equal(paceWarning(300, 50).kind, 'slow');
  assert.equal(paceWarning(60, 100), null);
});
