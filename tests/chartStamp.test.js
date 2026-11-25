import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registry, composeCellInput, chartedStampOf, stampChoices, stickerOf, peakNotation, CHART_STAMP_ITEM, CHART_STAMP_TYPE } from '../js/index.js';

const creighton = registry.get('creighton');
const YELLOW = '#F4C752';
const stamp = (id, extra = {}) => ({ streamIds: [CHART_STAMP_ITEM], type: CHART_STAMP_TYPE, content: { method: 'creighton', stamp: id }, ...extra });
const mucus = (code, frequency) => ({
  streamIds: ['body-vulva-mucus-inspect'],
  type: 'vulva-mucus-inspect/9d-vector',
  content: { vectors: {}, source: { key: 'creighton', sourceData: { mucus: code }, ...(frequency ? { annotations: { frequency } } : {}) } }
});
const bleeding = (value) => ({ streamIds: ['body-vulva-bleeding'], type: 'ratio/proportion', content: value });

test('[CST1] a charted stamp wins over the drawn one; the code and the frequency stay', () => {
  assert.deepEqual(composeCellInput([mucus('6C', 'X2')], creighton), { fill: '#FFFFFF', code: '6C', baby: true, frequency: 'X2' });
  assert.deepEqual(composeCellInput([mucus('6C', 'X2'), stamp('yellow')], creighton), { fill: YELLOW, code: '6C', frequency: 'X2', stamp: 'yellow' });
  assert.deepEqual(composeCellInput([stamp('yellow-baby'), mucus('6C')], creighton), { fill: YELLOW, code: '6C', baby: true, stamp: 'yellow-baby' });
});

test('[CST2] on a day without a code, and over bleeding', () => {
  assert.deepEqual(composeCellInput([stamp('green-baby')], creighton), { fill: '#7FB069', baby: true, stamp: 'green-baby' });
  assert.equal(composeCellInput([bleeding(0.2)], creighton).fill, '#D32F2F');
  assert.equal(composeCellInput([bleeding(0.2), stamp('green')], creighton).fill, '#7FB069');
});

test('[CST3] with the peak mark or the count on it', () => {
  assert.deepEqual(composeCellInput([mucus('10KL'), stamp('red')], creighton, { dayContext: { isPeak: true } }), { fill: '#D32F2F', code: '10KL', letter: 'P', stamp: 'red' });
  assert.deepEqual(composeCellInput([mucus('6C'), stamp('yellow-baby')], creighton, { dayContext: { peakCount: 2 } }), { fill: YELLOW, code: '6C', baby: true, letter: '2', stamp: 'yellow-baby' });
  assert.deepEqual(composeCellInput([stamp('green-baby')], creighton, { dayContext: { peakCount: 1 } }), { fill: '#7FB069', baby: true, letter: '1', stamp: 'green-baby' });
  assert.deepEqual(composeCellInput([], creighton, { dayContext: { isPeak: true } }), { empty: true });
});

test('[CST4] a stamp of another method, an unknown one, or a method that lists none: the drawn cell, unchanged', () => {
  const drawn = composeCellInput([mucus('6C')], creighton);
  for (const other of [
    stamp('yellow', { content: { method: 'billings', stamp: 'yellow' } }),
    stamp('brown'),
    stamp('constructor'),
    stamp('yellow', { content: { stamp: 'yellow' } }),
    stamp('yellow', { content: null }),
    stamp('yellow', { content: { method: 'creighton', stamp: 3 } })
  ]) {
    assert.deepEqual(composeCellInput([mucus('6C'), other], creighton), drawn, JSON.stringify(other.content));
    assert.deepEqual(composeCellInput([other], creighton), { empty: true });
  }
  for (const rep of registry.list ? registry.list() : []) {
    if (rep.spec.stamps) continue;
    assert.deepEqual(composeCellInput([stamp('yellow', { content: { method: rep.spec.boundMethod.methodId, stamp: 'yellow' } })], rep), { empty: true }, rep.spec.id);
  }
});

test('[CST5] two stamps on a day: the one modified last, in any order', () => {
  const old = stamp('yellow', { modified: 10 });
  const recent = stamp('green', { modified: 20 });
  assert.equal(chartedStampOf([old, recent], creighton).id, 'green');
  assert.equal(chartedStampOf([recent, old], creighton).id, 'green');
  assert.equal(chartedStampOf([stamp('red'), stamp('yellow')], creighton).id, 'yellow');
  assert.equal(chartedStampOf([], creighton), undefined);
});

test('[CST6] the choices: the six of Creighton, each its own sticker, yellow on instruction, named by colour', () => {
  const choices = stampChoices(creighton);
  assert.deepEqual(choices.map(c => c.id), ['red', 'green', 'green-baby', 'white-baby', 'yellow', 'yellow-baby']);
  assert.deepEqual(choices.filter(c => c.onInstruction).map(c => c.id), ['yellow', 'yellow-baby']);
  assert.equal(new Set(choices.map(c => stickerOf(c.input))).size, 6);
  for (const c of choices) {
    assert.deepEqual(c.input, composeCellInput([stamp(c.id)], creighton));
    for (const text of [c.label.en, c.label.fr]) {
      assert.ok(text);
      assert.doesNotMatch(text, /fertil|stérile|safe|sûr/i);
    }
  }
  assert.deepEqual(stampChoices(registry.get('femm')), []);
});

test('[CST7] no code draws yellow, and a stamp never makes a peak', () => {
  for (const code of ['0', '2', '2W', '4', '6C', '6Y', '6GY', '8CK', '10KL', '10KY', 'PY', '6B', '6R']) {
    assert.notEqual(composeCellInput([mucus(code)], creighton).fill, YELLOW, code);
  }
  const days = [1, 2, 3].map(day => stamp('white-baby', { time: day }));
  assert.equal(peakNotation(days, creighton, { dayOf: d => d }).peakDay, null);
});
