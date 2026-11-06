import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCustomText, normalizeForLevel, normalizePhrases, pickBankPhrases, pickCustomPhrases,
  truncatePhrase, nameKey, cleanPlayerName, toTypeable,
} from '../js/core/texts.js';
import { PHRASE_BANK } from '../js/data/phrase-bank.js';

test('texto propio: cada línea no vacía es una frase, sin espacios dobles ni extremos', () => {
  const { phrases } = parseCustomText('  Hola   mundo  \n\n\r\n   \nSegunda  línea\n');
  assert.deepEqual(phrases, ['Hola mundo', 'Segunda línea']);
});

test('texto propio: frases sobre 120 caracteres se cortan en un espacio y se avisan', () => {
  const long = `${'palabra '.repeat(20)}fin`;
  const { phrases, truncated } = parseCustomText(`corta\n${long}`);
  assert.ok(phrases[1].length <= 120);
  assert.ok(!phrases[1].endsWith(' '));
  assert.deepEqual(truncated, [1]);
  assert.equal(truncatePhrase('x'.repeat(130)).length, 120, 'sin espacios corta en seco');
});

test('comillas y guiones tipográficos se vuelven tecleables', () => {
  assert.equal(toTypeable('“Hola” — dijo… ‘ok’'), '"Hola" - dijo... \'ok\'');
});

test('nivel 1: minúsculas, sin tildes ni ñ, sin puntuación ni números', () => {
  assert.equal(normalizeForLevel('¿El Camión Nº 3 está listo? ¡Sí, señor!', 1), 'el camion n esta listo si senor');
});

test('nivel 2: mayúscula inicial, tildes y ñ, solo punto final', () => {
  assert.equal(normalizeForLevel('¿la grúa 7, de Muñoz, llegó?', 2), 'La grúa de Muñoz llegó.');
  assert.equal(normalizeForLevel('revisa el camión', 2), 'Revisa el camión');
});

test('nivel 3: se mantiene la puntuación', () => {
  assert.equal(normalizeForLevel('¡Atención!  El vehículo 2, hoy.', 3), '¡Atención! El vehículo 2, hoy.');
});

test('normalizar descarta frases que quedan vacías', () => {
  assert.deepEqual(normalizePhrases(['123 !!', 'hola'], 1), ['hola']);
});

test('banco: elige N al azar sin repetir y ordena de más corta a más larga', () => {
  let seed = 1;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const picked = pickBankPhrases(PHRASE_BANK[2], 5, random);
  assert.equal(picked.length, 5);
  assert.equal(new Set(picked).size, 5);
  for (let i = 1; i < picked.length; i++) assert.ok(picked[i - 1].length <= picked[i].length);
});

test('texto propio usa las primeras N líneas en su orden (1 a 10)', () => {
  const list = Array.from({ length: 12 }, (_, i) => `frase ${i}`);
  assert.deepEqual(pickCustomPhrases(list, 3), ['frase 0', 'frase 1', 'frase 2']);
  assert.equal(pickCustomPhrases(list, 50).length, 10);
  assert.equal(pickCustomPhrases(list, 0).length, 1);
});

test('banco: al menos 15 frases por nivel, de 20 a 70 caracteres, que respetan su nivel', () => {
  for (const level of [1, 2, 3]) {
    const bank = PHRASE_BANK[level];
    assert.ok(bank.length >= 15, `nivel ${level} tiene ${bank.length}`);
    for (const phrase of bank) {
      assert.ok(phrase.length >= 20 && phrase.length <= 70, `"${phrase}" mide ${phrase.length}`);
      if (level < 3) assert.equal(normalizeForLevel(phrase, level), phrase, `"${phrase}" no cumple el nivel ${level}`);
    }
  }
});

test('nombres: largo 2–20 y clave que detecta repetidos', () => {
  assert.equal(cleanPlayerName(' A ').ok, false);
  assert.equal(cleanPlayerName('x'.repeat(21)).ok, false);
  assert.deepEqual(cleanPlayerName('  José   Pérez '), { ok: true, name: 'José Pérez' });
  assert.equal(nameKey('José  Pérez'), nameKey('jose perez'));
  assert.match(nameKey('Iñaki.$#[]/'), /^[a-z0-9_]+$/);
});
