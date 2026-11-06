import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPhrase, typeChar, typeText, closePhrase, isBlockedKey, isBlockedInputType, createInputReader,
} from '../js/core/typing-engine.js';

test('letra correcta suma y avanza', () => {
  const s = typeChar(createPhrase('hola'), 'h');
  assert.equal(s.pos, 1);
  assert.equal(s.correct, 1);
  assert.equal(s.errors, 0);
  assert.deepEqual(s.marks, ['ok']);
});

test('letra errónea se marca y el cursor igual avanza', () => {
  const s = typeChar(createPhrase('hola'), 'x');
  assert.equal(s.pos, 1);
  assert.equal(s.errors, 1);
  assert.deepEqual(s.marks, ['err']);
  const s2 = typeChar(s, 'o');
  assert.equal(s2.correct, 1);
  assert.equal(s2.pos, 2);
});

test('mayúscula distinta de minúscula es error', () => {
  assert.equal(typeChar(createPhrase('El'), 'e').errors, 1);
});

test('la frase termina al teclear todos sus caracteres y lo sobrante pasa a la siguiente', () => {
  const { state, overflow } = typeText(createPhrase('ab'), 'abcd');
  assert.equal(state.done, true);
  assert.equal(overflow, 'cd');
  assert.equal(typeChar(state, 'z'), state, 'una frase terminada no cambia');
});

test('retroceso, suprimir y atajos de pegar se bloquean', () => {
  assert.equal(isBlockedKey('Backspace'), true);
  assert.equal(isBlockedKey('Delete'), true);
  assert.equal(isBlockedKey('v', { ctrlKey: true }), true);
  assert.equal(isBlockedKey('a'), false);
  assert.equal(isBlockedKey('Dead'), false, 'la tecla muerta debe llegar al textarea');
  assert.equal(isBlockedInputType('deleteContentBackward'), true);
  assert.equal(isBlockedInputType('insertFromPaste'), true);
  assert.equal(isBlockedInputType('insertFromDrop'), true);
  assert.equal(isBlockedInputType('insertText'), false);
  assert.equal(isBlockedInputType('insertCompositionText'), false);
});

test('retroceso ignorado: un input de borrado no consume caracteres', () => {
  const field = { value: '' };
  const reader = createInputReader(field);
  // El navegador ya lo canceló en beforeinput; el campo queda vacío.
  assert.equal(reader.input({ isComposing: false }), '');
});

/** Simula el orden de eventos de Chrome: input(composing) … compositionend. */
function chromeDeadKey(reader, field, composed) {
  reader.compositionStart();
  field.value = '´';
  assert.equal(reader.input({ isComposing: true }), '');
  field.value = composed;
  assert.equal(reader.input({ isComposing: true }), '');
  return reader.compositionEnd();
}

/** Orden de Firefox: compositionend ANTES del input final. */
function firefoxDeadKey(reader, field, composed) {
  reader.compositionStart();
  field.value = '´';
  reader.input({ isComposing: true });
  field.value = composed;
  const fromEnd = reader.compositionEnd();
  const fromInput = reader.input({ isComposing: false });
  return fromEnd + fromInput;
}

for (const [name, run] of [['Chrome', chromeDeadKey], ['Firefox', firefoxDeadKey]]) {
  test(`tildes por composición (${name}): á é í ó ú y ñ Ñ`, () => {
    const field = { value: '' };
    const reader = createInputReader(field);
    let s = createPhrase('áéíóúñÑ');
    for (const ch of ['á', 'é', 'í', 'ó', 'ú']) {
      s = typeText(s, run(reader, field, ch)).state;
    }
    for (const ch of ['ñ', 'Ñ']) { // la ñ tiene tecla propia: input directo
      field.value = ch;
      s = typeText(s, reader.input({ isComposing: false })).state;
    }
    assert.equal(s.correct, 7);
    assert.equal(s.errors, 0);
    assert.equal(field.value, '', 'el campo se vacía después de leer');
  });
}

test('Chrome en Windows sin composición: la tecla muerta entrega "á" directo', () => {
  const field = { value: 'á' };
  const reader = createInputReader(field);
  assert.equal(reader.input({ isComposing: false }), 'á');
});

test('tecla muerta + consonante entrega dos caracteres (´ y la letra)', () => {
  const field = { value: '' };
  const reader = createInputReader(field);
  const typed = chromeDeadKey(reader, field, '´t');
  const { state } = typeText(createPhrase('ta'), typed);
  assert.equal(state.errors, 2, '´ ≠ t, y t ≠ a');
  assert.equal(state.correct, 0);
  assert.equal(state.pos, 2);
});

test('normalización NFC: á descompuesta (a + ´) cuenta como correcta', () => {
  const decomposed = 'á'; // NFD
  const s1 = typeText(createPhrase('á'), decomposed).state;
  assert.equal(s1.correct, 1);
  const s2 = typeText(createPhrase('árbol'.normalize('NFD')), 'á').state;
  assert.equal(s2.correct, 1, 'la frase también se normaliza');
});

test('cerrar por tiempo deja lo no escrito sin sumar', () => {
  const s = closePhrase(typeText(createPhrase('hola mundo'), 'hola').state);
  assert.equal(s.done, true);
  assert.equal(s.correct, 4);
});
