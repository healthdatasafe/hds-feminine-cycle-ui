import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registry, detectFertilityWindow, composeCellInput } from '../js/index.js';

const femm = registry.get('femm');
const SECONDS_PER_DAY = 86400;

// Build a native FEMM mucus event for a given UTC day index.
const ev = (dayIdx, value) => ({
  time: dayIdx * SECONDS_PER_DAY + 12 * 3600, // mid-day for stable bucketing
  streamIds: ['body-vulva-mucus-inspect'],
  type: 'vulva-mucus-inspect/9d-vector',
  content: { source: { key: 'femm', sourceData: { mucus: value } } }
});

test('no candidates → empty sets', () => {
  const events = [ev(0, 1), ev(1, 1), ev(2, 2)];
  const w = detectFertilityWindow(events, femm);
  assert.equal(w.peakDays.size, 0);
  assert.equal(w.fertileDays.size, 0);
});

test('single slippery day → peak', () => {
  const events = [ev(0, 1), ev(3, 4), ev(6, 1)];
  const w = detectFertilityWindow(events, femm);
  assert.deepEqual(Array.from(w.peakDays), [3]);
  assert.deepEqual(Array.from(w.fertileDays), []);
});

test('two slippery days within window → first is fertile, last is peak', () => {
  const events = [ev(0, 1), ev(3, 4), ev(5, 4), ev(10, 1)];
  const w = detectFertilityWindow(events, femm);
  assert.deepEqual(Array.from(w.peakDays), [5]);
  assert.deepEqual(Array.from(w.fertileDays), [3]);
});

test('two slippery days >4 days apart → both are peaks', () => {
  const events = [ev(0, 4), ev(10, 4)];
  const w = detectFertilityWindow(events, femm);
  assert.deepEqual(Array.from(w.peakDays).sort(), [0, 10]);
  assert.deepEqual(Array.from(w.fertileDays), []);
});

test('full FEMM cycle: dry → slippery (peak) → dry produces center-dot CellInput', () => {
  // Day 0..5 dry (1), day 6 slippery (4) = peak, day 7..10 dry.
  const events = [];
  for (let d = 0; d <= 5; d++) events.push(ev(d, 1));
  events.push(ev(6, 4));
  for (let d = 7; d <= 10; d++) events.push(ev(d, 1));

  const w = detectFertilityWindow(events, femm);
  assert.equal(w.peakDays.has(6), true);

  // Compose day 6 with peak context — expect dark-blue fill + white center dot.
  const day6 = events.filter(e => Math.floor(e.time / SECONDS_PER_DAY) === 6);
  const input = composeCellInput(day6, femm, { dayContext: { isPeak: true } });
  assert.equal(input.fill, '#1F3B7A'); // FEMM peak palette
  assert.ok(input.centerDot, 'centerDot should be set');
  assert.equal(input.centerDot.color, '#ffffff');
});

test('Billings peak applies "X" letter on candidate day via mappingRules.mucus.peak', () => {
  const billings = registry.get('billings');
  // Native Billings wetSlippery is a candidate; without a follow-up, it's the peak.
  const billingsEv = (dayIdx, value) => ({
    time: dayIdx * SECONDS_PER_DAY + 12 * 3600,
    streamIds: ['body-vulva-mucus-inspect'],
    type: 'vulva-mucus-inspect/9d-vector',
    content: { source: { key: 'billings', sourceData: { mucus: value } } }
  });
  const events = [billingsEv(0, 'dry'), billingsEv(5, 'wetSlippery'), billingsEv(10, 'dry')];
  const w = detectFertilityWindow(events, billings);
  assert.equal(w.peakDays.has(5), true);

  const day5 = events.filter(e => Math.floor(e.time / SECONDS_PER_DAY) === 5);
  const input = composeCellInput(day5, billings, { dayContext: { isPeak: true } });
  // Billings spec defines mucus.peak = { fill: 'discharge', letter: 'X' }
  assert.equal(input.letter, 'X');
  assert.equal(input.fill, '#FFFFFF');
});

test('detectFertilityWindow uses closestOption when source method ≠ boundMethod', () => {
  // Simulate cyclefeminin/Creighton vector that is force-converted.
  // We pass a fake closestOption that returns '4' (FEMM Slippery) for high vectors.
  const events = [
    {
      time: 5 * SECONDS_PER_DAY + 12 * 3600,
      streamIds: ['body-vulva-mucus-inspect'],
      type: 'vulva-mucus-inspect/9d-vector',
      content: {
        source: { key: 'creighton', sourceData: { mucus: '10WL' } },
        vectors: { lubricative: 0.85, stretchability: 0.85 }
      }
    }
  ];
  const closestOption = (methodId, vector) => {
    if (methodId === 'femm' && vector?.lubricative >= 0.7) return '4';
    return null;
  };
  const w = detectFertilityWindow(events, femm, { closestOption });
  assert.equal(w.peakDays.has(5), true);
});
