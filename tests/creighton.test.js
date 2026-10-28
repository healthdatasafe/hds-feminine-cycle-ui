import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registry, composeCellInput } from '../js/index.js';

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

test('creighton: clear, lubricative or 10 are peak-type; partly clear C/K is left out', () => {
  const c = new Set(rep.spec.peakMarker.candidateOptions);
  for (const code of ['6K', '8K', '6L', '6GL', '8L', '8YL', '10', '10C', '10CK', '10K', '10KL', '10L', '10P', '10Y', '10DL', '10SL', '10WL']) {
    assert.ok(c.has(code), code);
  }
  for (const code of ['0', '2', '2W', '4', '6', '6C', '6P', '6Y', '6G', '8', '8C', '8P', '8Y', '6CK', '8CK', '6B', '6R', '10B', '10R']) {
    assert.equal(c.has(code), false, code);
  }
});
