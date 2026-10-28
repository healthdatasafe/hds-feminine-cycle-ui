import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registry, peakNotation, RECORDED_PEAK_ITEM } from '../js/index.js';

const DAY = 86400;
const at = (day) => day * DAY + 9 * 3600;
const obs = (method, day, option) => ({
  time: at(day),
  streamIds: ['body-vulva-mucus-inspect'],
  type: 'vulva-mucus-inspect/9d-vector',
  content: { source: { key: method, sourceData: option } }
});
const cycle = (method, options) => options.map((o, i) => (o == null ? null : obs(method, i, o))).filter(Boolean);

test('creighton: P on the last peak-type day, then 1, 2, 3', () => {
  const rep = registry.get('creighton');
  const events = cycle('creighton', ['0', '6C', '10KL', '10WL', '6C', '0', '0', '0']);
  const n = peakNotation(events, rep);
  assert.equal(n.peakDay, 3);
  assert.equal(n.basis, 'observed');
  assert.equal(n.mark, 'P');
  assert.deepEqual(n.count, [{ day: 4, n: 1 }, { day: 5, n: 2 }, { day: 6, n: 3 }]);
});

test('the peak is only known once the mucus changes', () => {
  const rep = registry.get('creighton');
  const n = peakNotation(cycle('creighton', ['0', '6C', '10KL', '10WL']), rep);
  assert.equal(n.peakDay, null);
  assert.deepEqual(n.count, []);
});

test('a later return of peak-type mucus moves the peak once it changes again', () => {
  const rep = registry.get('creighton');
  const events = cycle('creighton', ['10WL', '0', '0', '0', '0', '10KL', '6C', '0', '0', '0']);
  const n = peakNotation(events, rep);
  assert.equal(n.peakDay, 5);
  assert.deepEqual(n.count.map(c => c.n), [1, 2, 3]);
});

test('the count stops at a return of peak-type mucus not yet confirmed', () => {
  const rep = registry.get('sympto-thermal');
  const events = cycle('sympto-thermal', ['dry', 'eggWhite', 'sticky', 'eggWhite']);
  const n = peakNotation(events, rep);
  assert.equal(n.peakDay, 1);
  assert.deepEqual(n.count, [{ day: 2, n: 1 }]);
});

test('the count is not written ahead of the data, unless untilDay says so', () => {
  const rep = registry.get('billings');
  const events = cycle('billings', ['dry', 'wetSlippery', 'sticky']);
  assert.deepEqual(peakNotation(events, rep).count, [{ day: 2, n: 1 }]);
  assert.equal(peakNotation(events, rep).mark, 'X');
  assert.deepEqual(peakNotation(events, rep, { untilDay: 10 }).count.map(c => c.n), [1, 2, 3]);
});

test('days without an observation count too (calendar days)', () => {
  const rep = registry.get('justisse');
  const events = [obs('justisse', 0, 'watery'), obs('justisse', 1, 'sticky'), obs('justisse', 6, 'dry')];
  const n = peakNotation(events, rep);
  assert.equal(n.peakDay, 0);
  assert.deepEqual(n.count.map(c => c.day), [1, 2, 3]);
});

test('a recorded peak day is used first', () => {
  const rep = registry.get('marquette');
  const events = [
    ...cycle('marquette', ['1', '8', '3', '1', '1', '1', '1']),
    { time: at(3), streamIds: [RECORDED_PEAK_ITEM], type: 'activity/plain', content: null }
  ];
  const n = peakNotation(events, rep);
  assert.equal(n.peakDay, 3);
  assert.equal(n.basis, 'recorded');
  assert.deepEqual(n.count.map(c => c.day), [4, 5, 6]);
});

test('chartneo: peak from the record only', () => {
  const rep = registry.get('chartneo');
  const mucusOnly = [obs('chartneo', 0, { walking: 3 }), obs('chartneo', 1, { walking: 1 })];
  assert.equal(peakNotation(mucusOnly, rep).peakDay, null);
  const recorded = [...mucusOnly, { time: at(0), streamIds: [RECORDED_PEAK_ITEM], type: 'activity/plain' }];
  const n = peakNotation(recorded, rep, { untilDay: 5 });
  assert.equal(n.peakDay, 0);
  assert.equal(n.mark, 'P');
  assert.deepEqual(n.count.map(c => c.n), [1, 2, 3]);
});

test('apple health: a scale, no peak notation even when recorded', () => {
  const rep = registry.get('appleHealth');
  const events = [
    ...cycle('appleHealth', ['dry', 'eggWhite', 'sticky']),
    { time: at(1), streamIds: [RECORDED_PEAK_ITEM], type: 'activity/plain' }
  ];
  assert.deepEqual(peakNotation(events, rep), { peakDay: null, basis: null, mark: null, count: [] });
});

test('FEMM marks the peak with its dot, so mark is null; count still written', () => {
  const rep = registry.get('femm');
  const n = peakNotation(cycle('femm', ['1', '4', '2', '1', '1']), rep);
  assert.equal(n.peakDay, 1);
  assert.equal(n.mark, null);
  assert.deepEqual(n.count.map(c => c.n), [1, 2, 3]);
});

test('force-converted observations use closestOption, and dayOf sets the calendar', () => {
  const rep = registry.get('sensiplan');
  const events = [0, 1, 2].map(day => ({
    time: at(day),
    streamIds: ['body-vulva-mucus-inspect'],
    type: 'vulva-mucus-inspect/9d-vector',
    content: { source: { key: 'mira', sourceData: day === 1 ? 'Raw Egg White' : 'Dry' }, vectors: { lubricative: day === 1 ? 1 : 0 } }
  }));
  const closestOption = (methodId, v) => (methodId === 'sensiplan' ? (v.lubricative > 0.5 ? 'S+' : 't') : null);
  assert.equal(peakNotation(events, rep, { closestOption }).peakDay, 1);
  const shifted = peakNotation(events, rep, { closestOption, dayOf: t => Math.floor(t / DAY) + 100 });
  assert.equal(shifted.peakDay, 101);
});
