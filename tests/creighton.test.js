import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registry, composeCellInput, peakNotation, isPeakOption, stickerOf, bleedingBandOf } from '../js/index.js';

const rep = registry.get('creighton');
const cell = (code) => composeCellInput([{
  time: 0,
  streamIds: ['body-vulva-mucus-inspect'],
  type: 'vulva-mucus-inspect/9d-vector',
  content: { source: { key: 'creighton', sourceData: { mucus: code } } }
}], rep);

const GREEN = '#7FB069';
const WHITE = '#FFFFFF';
const RED = '#C8155A';

test('creighton: 0, 2, 2W, 4 are dry (green, no baby)', () => {
  for (const code of ['0', '2', '2W', '4']) {
    const input = cell(code);
    assert.equal(input.fill, GREEN, code);
    assert.equal(input.code, code);
    assert.equal(input.baby, undefined, code);
  }
});

test('creighton: every mucus code is white with a baby, never yellow', () => {
  for (const code of ['6', '6C', '6K', '6CK', '6P', '8', '8K', '8CK', '8Y', '10', '10C', '10KL', '10WL']) {
    const input = cell(code);
    assert.equal(input.fill, WHITE, code);
    assert.equal(input.baby, true, code);
  }
  for (const frag of Object.values(rep.spec.mappingRules.mucus)) {
    assert.notEqual(rep.resolveColor(frag.fill), '#F4C752');
  }
  assert.equal(Object.values(rep.spec.palette).includes('#F4C752'), false);
});

test('creighton: B and R codes stay red', () => {
  for (const code of ['6B', '6R', '10B', '10R']) assert.equal(cell(code).fill, RED, code);
});

test('creighton: a code stored in another case draws as the spec spells it (B-plan-131 bug 2)', () => {
  assert.deepEqual(cell('10kl'), cell('10KL'));
  assert.equal(cell('6ck').code, '6CK');
  assert.equal(cell('2w').fill, GREEN);
});

test('creighton: a lower-case peak-type code still sets the peak', () => {
  const day = (d, code) => ({ time: d * 86400, streamIds: ['body-vulva-mucus-inspect'], type: 'vulva-mucus-inspect/9d-vector', content: { source: { key: 'creighton', sourceData: code } } });
  const n = peakNotation([day(0, '6c'), day(1, '10kl'), day(2, '6c')], rep);
  assert.equal(n.peakDay, 1);
});

test('creighton: brown bleeding alone (presence-only event) draws a red stamp (bug 5)', () => {
  for (const itemKey of ['body-vulva-bleeding-browndark', 'bleeding-brown-dark']) {
    const input = composeCellInput([{ time: 0, streamIds: [itemKey], type: 'activity/plain', content: null }], rep);
    assert.equal(input.fill, RED, itemKey);
  }
});

test('creighton: clear, lubricative or 10 are peak-type; partly clear C/K is left out', () => {
  const peak = (code) => isPeakOption(rep, code);
  for (const code of ['6K', '8K', '6L', '6GL', '8L', '8YL', '10', '10C', '10CK', '10K', '10KL', '10L', '10P', '10Y', '10DL', '10SL', '10WL']) {
    assert.ok(peak(code), code);
  }
  for (const code of ['0', '2', '2W', '4', '6', '6C', '6P', '6Y', '6G', '8', '8C', '8P', '8Y', '6CK', '8CK', '6B', '6R', '10B', '10R']) {
    assert.equal(peak(code), false, code);
  }
});

// Plan 134: the codes are the model's; fcui draws them by rule, with no list of its own.
const MODEL_CODES = JSON.parse(readFileSync(new URL('./fixtures/creighton-codes.json', import.meta.url))).codes.map(c => c.value);

test('creighton: every code of the model draws a fill and its own code', () => {
  assert.equal(MODEL_CODES.length, 72);
  for (const code of MODEL_CODES) {
    const input = cell(code);
    assert.ok([GREEN, WHITE, RED].includes(input.fill), code);
    assert.equal(input.code, code);
    assert.equal(input.baby, input.fill === WHITE ? true : undefined, code);
  }
});

test('creighton: new codes are peak-type by rule (K, L or 10; not partly clear below 10 without L)', () => {
  const peak = (code) => isPeakOption(rep, code);
  for (const code of ['6GK', '6GKL', '6CKL', '6GCKL', '8GK', '8GCKL', '8CL', '10GC', '10GCK', '10CL', '10YL', '6YL']) {
    assert.ok(peak(code), code);
  }
  for (const code of ['6GC', '6GY', '6PC', '6PY', '8GC', '8GY', '6GCK', '8GCK']) {
    assert.equal(peak(code), false, code);
  }
  for (const code of ['10gck', '6gckl']) assert.ok(peak(code), code);
  assert.equal(peak('8gck'), false);
});

test('creighton: a lower-case new code draws as the model spells it', () => {
  assert.deepEqual(cell('6gckl'), cell('6GCKL'));
  assert.equal(cell('6gckl').code, '6GCKL');
});

test('creighton: an unreadable text draws nothing', () => {
  assert.equal(cell('abc').empty, true);
});

test('creighton: a new peak-type code sets the peak', () => {
  const day = (d, code) => ({ time: d * 86400, streamIds: ['body-vulva-mucus-inspect'], type: 'vulva-mucus-inspect/9d-vector', content: { source: { key: 'creighton', sourceData: code } } });
  const n = peakNotation([day(0, '6GC'), day(1, '10GCK'), day(2, '6GC')], rep);
  assert.equal(n.peakDay, 1);
});

test('creighton: two codes on one day show the peak-type one, else the last', () => {
  const ev = (code) => ({ time: 0, streamIds: ['body-vulva-mucus-inspect'], type: 'vulva-mucus-inspect/9d-vector', content: { source: { key: 'creighton', sourceData: code } } });
  assert.equal(composeCellInput([ev('10GCK'), ev('6C')], rep).code, '10GCK');
  assert.equal(composeCellInput([ev('6C'), ev('0')], rep).code, '0');
  assert.equal(composeCellInput([ev('0'), ev('6C')], rep).code, '6C');
});

test('creighton: bleeding notation H, M, L, VL on the flow, B as brown presence', () => {
  const bn = rep.spec.bleedingNotation;
  assert.deepEqual(bn.map(e => e.code), ['H', 'M', 'L', 'VL', 'B']);
  for (const e of bn) {
    assert.ok(e.label.en && e.label.fr, e.code);
    assert.ok(rep.spec.mappingRules.bleeding[e.band], e.code);
    if (e.value != null) assert.equal(bleedingBandOf(e.value), e.band, e.code);
  }
  assert.equal(bn.find(e => e.code === 'B').itemKey, 'body-vulva-bleeding-browndark');
  assert.equal(bn.find(e => e.code === 'B').value, undefined);
  const letterOf = (v) => bn.find(e => e.value != null && e.band === bleedingBandOf(v))?.code;
  assert.equal(letterOf(0.95), 'H');
  assert.equal(letterOf(0.08), 'VL');
});

test('creighton: bleeding with mucus is a red stamp with the code, no baby', () => {
  const input = composeCellInput([
    { time: 0, streamIds: ['body-vulva-mucus-inspect'], type: 'vulva-mucus-inspect/9d-vector', content: { source: { key: 'creighton', sourceData: '6C' } } },
    { time: 0, streamIds: ['body-vulva-bleeding'], type: 'ratio/proportion', content: 0.35 }
  ], rep);
  assert.equal(input.fill, RED);
  assert.equal(input.code, '6C');
  assert.equal(input.baby, undefined);
});

test('stickerOf: same sticker for codes of one group, regardless of code or letter', () => {
  const s = (code) => stickerOf(cell(code));
  assert.equal(s('0'), s('4'));
  assert.equal(s('6C'), s('10KL'));
  assert.equal(s('6B'), s('10R'));
  assert.notEqual(s('0'), s('6C'));
  assert.notEqual(s('6C'), s('6B'));
  assert.equal(stickerOf({ ...cell('6C'), letter: 'P' }), s('6C'));
  assert.equal(stickerOf({ empty: true }), 'empty');
});
