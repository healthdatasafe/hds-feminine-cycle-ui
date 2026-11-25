import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registry, buildCycleChart, canChart, composeCellInput, peakLetterOf } from '../js/index.js';

const rep = registry.get('creighton');
const at = (date) => Date.parse(`${date}T12:00:00Z`) / 1000;
const ev = (item, date, content, extra = {}) => ({ id: `${item}@${date}`, time: at(date), streamIds: [item], type: 'x', content, ...extra });
const start = (date, extra) => ev('fertility-cycles-start', date, null, extra);
const peak = (date, extra) => ev('fertility-cycles-peak-day', date, null, extra);
const flow = (date, value) => ev('body-vulva-bleeding', date, value);
const brown = (date) => ev('body-vulva-bleeding-browndark', date, null);
const stamp = (date, method, id) => ev('fertility-cycles-chart-stamp', date, { method, stamp: id }, { type: 'fertility/chart-stamp-v1' });
const code = (date, value, frequency, key = 'creighton', time = 12) => ({
  ...ev('body-vulva-mucus-inspect', date, { vectors: {}, source: { ...(key ? { key } : {}), sourceData: value, ...(frequency ? { annotations: { frequency } } : {}) } }),
  time: Date.parse(`${date}T${String(time).padStart(2, '0')}:00:00Z`) / 1000
});
const dayOf = (e) => new Date(e.time * 1000).toISOString().slice(0, 10);
const chart = (events, opts = {}) => buildCycleChart(events, rep, { dayOf, today: '2026-03-31', ...opts });
const only = (events, opts) => chart([start('2026-03-01'), ...events], { today: '2026-03-10', ...opts }).cycles[0];
const dayAt = (events, n, opts) => only(events, opts).days[n - 1];

test('a row per recorded start, oldest first, each ending before the next, the last up to today', () => {
  const m = chart([start('2026-03-02'), start('2026-01-05'), start('2026-02-03')]);
  assert.deepEqual(m.cycles.map(c => [c.startDate, c.endDate, c.days.length, c.open]), [
    ['2026-01-05', '2026-02-02', 29, false], ['2026-02-03', '2026-03-01', 27, false], ['2026-03-02', '2026-03-31', 30, true]
  ]);
  assert.deepEqual(m.cycles[0].days.map(d => d.day).slice(0, 3), [1, 2, 3]);
  assert.equal(m.cycles[0].days[28].date, '2026-02-02');
  assert.deepEqual(m.unplaced, []);
});

test('two starts on one day are one row; a predicted start opens none', () => {
  const m = chart([start('2026-03-02'), { ...start('2026-03-02'), time: at('2026-03-02') + 3600 }, start('2026-03-20', { clientData: { hdsBasis: 'predicted' } })]);
  assert.deepEqual(m.cycles.map(c => c.startDate), ['2026-03-02']);
});

test('rows of the host replace the recorded starts, may end early, and may be without any start', () => {
  const m = chart([start('2026-03-15'), code('2026-01-05', '8C'), code('2026-02-20', '0')], {
    rows: [{ startDate: '2026-03-01' }, { id: 'sheet-1', startDate: '2026-01-01', endDate: '2026-01-30' }]
  });
  assert.deepEqual(m.cycles.map(c => [c.id, c.startDate, c.endDate, c.open]), [
    ['sheet-1', '2026-01-01', '2026-01-30', false], ['2026-03-01', '2026-03-01', '2026-03-31', true]
  ]);
  assert.equal(m.cycles[0].days[4].code.code, '8C');
  assert.deepEqual(m.unplaced.map(u => [u.reason, u.event.id]), [['outside-rows', 'body-vulva-mucus-inspect@2026-02-20']]);
});

test('a row cut by the next one ends there, whatever its endDate; one after today is not drawn', () => {
  const m = chart([], { rows: [{ startDate: '2026-01-01', endDate: '2026-03-20' }, { startDate: '2026-02-01' }, { startDate: '2026-05-01' }] });
  assert.deepEqual(m.cycles.map(c => [c.startDate, c.endDate, c.open]), [['2026-01-01', '2026-01-31', false], ['2026-02-01', '2026-03-31', true]]);
});

test('the calendar days are the host\'s: across a change of clock, a day is a day', () => {
  // 2026-03-29, Europe/Zurich: 23 hours; 00:30 and 23:30 local
  const local = (iso, date) => ({ ...code(date, '0'), time: Date.parse(iso) / 1000, day: date });
  const m = buildCycleChart([local('2026-03-28T23:30:00Z', '2026-03-29'), local('2026-03-29T21:30:00Z', '2026-03-29'), local('2026-03-29T22:30:00Z', '2026-03-30')], rep, {
    dayOf: e => e.day, today: '2026-03-31', rows: [{ startDate: '2026-03-27' }]
  });
  assert.deepEqual(m.cycles[0].days.map(d => [d.date, d.events.length]), [['2026-03-27', 0], ['2026-03-28', 0], ['2026-03-29', 2], ['2026-03-30', 1], ['2026-03-31', 0]]);
});

test('nothing is dropped in silence: no day, after today, before the first row, predicted', () => {
  const noDay = code('2026-03-05', '6C');
  const m = buildCycleChart([start('2026-03-01'), noDay, code('2026-04-02', '8'), code('2026-02-10', '2'), peak('2026-03-20', { clientData: { hdsBasis: 'predicted' } }), ev('body-temperature-basal', '2026-02-10', 36.5)], rep, {
    dayOf: e => e === noDay ? null : dayOf(e), today: '2026-03-31'
  });
  assert.deepEqual(m.unplaced.map(u => u.reason).sort(), ['after-today', 'no-day', 'outside-rows', 'predicted']);
  assert.equal(m.cycles[0].days.some(d => d.peak), false);
});

test('a day that is not a calendar day is on no day', () => {
  const m = buildCycleChart([code('2026-03-05', '6C')], rep, { dayOf: () => '2026-02-30', today: '2026-03-31', rows: [{ startDate: '2026-03-01' }] });
  assert.deepEqual(m.unplaced.map(u => u.reason), ['no-day']);
});

test('wrong input is refused, not drawn wrong', () => {
  assert.throws(() => chart([], { today: '31.03.2026' }), /today/);
  assert.throws(() => chart([], { rows: [{ startDate: '2026-3-1' }] }), /startDate/);
  for (const id of ['billings', 'femm', 'sensiplan', 'marquette']) {
    assert.equal(canChart(registry.get(id)), false, id);
    assert.throws(() => buildCycleChart([], registry.get(id), { dayOf, today: '2026-03-31' }), /cannot be drawn/);
  }
  assert.equal(canChart(rep), true);
});

test('an empty day has nothing: no stamp, no code, not dry', () => {
  const d = dayAt([], 3);
  assert.equal(d.input, undefined);
  assert.equal(d.code, undefined);
  assert.deepEqual([d.otherCodes, d.bleeding, d.otherMethods, d.events], [[], [], [], []]);
});

test('the stamp is the library\'s, its code and frequency as recorded', () => {
  const d = dayAt([code('2026-03-03', '10kl', 'X2')], 3);
  assert.deepEqual(d.code, { code: '10KL', frequency: 'X2' });
  assert.equal(d.input.code, '10KL');
  assert.equal(d.input.frequency, undefined);
  assert.equal(d.input.fill, composeCellInput([code('2026-03-03', '10KL')], rep).fill);
  assert.deepEqual(dayAt([code('2026-03-03', '10KL')], 3).code, { code: '10KL' });
});

test('the highest-ranked code is drawn, the others are written, each once', () => {
  const d = dayAt([code('2026-03-03', '0', 'AD', 'creighton', 8), code('2026-03-03', '8C', 'X1', 'creighton', 10), code('2026-03-03', '10KL', 'X1', 'creighton', 14), code('2026-03-03', '8c', 'X1', 'creighton', 18)], 3);
  assert.deepEqual(d.code, { code: '10KL', frequency: 'X1' });
  assert.deepEqual(d.otherCodes, [{ code: '0', frequency: 'AD' }, { code: '8C', frequency: 'X1' }]);
});

test('the same code with two frequencies: both are written', () => {
  const d = dayAt([code('2026-03-03', '8C', 'X1', 'creighton', 8), code('2026-03-03', '8C', 'X2', 'creighton', 18)], 3);
  assert.deepEqual(d.code, { code: '8C', frequency: 'X2' });
  assert.deepEqual(d.otherCodes, [{ code: '8C', frequency: 'X1' }]);
});

test('a code the method cannot read is written as recorded, without a stamp', () => {
  const d = dayAt([code('2026-03-03', 'zz9?')], 3);
  assert.equal(d.input, undefined);
  assert.deepEqual(d.code, { code: 'zz9?' });
});

test('another method is named, never drawn; a record that names none reads as this one\'s', () => {
  const femm = dayAt([code('2026-03-03', 4, undefined, 'femm')], 3);
  assert.equal(femm.input, undefined);
  assert.equal(femm.code, undefined);
  assert.deepEqual(femm.otherMethods, ['femm']);
  const both = dayAt([code('2026-03-03', 'wet', undefined, 'billings'), code('2026-03-03', '8C', 'X1')], 3);
  assert.deepEqual(both.code, { code: '8C', frequency: 'X1' });
  assert.deepEqual(both.otherMethods, ['billings']);
  assert.deepEqual(dayAt([code('2026-03-03', '8C', 'X1', null)], 3).code, { code: '8C' });
  assert.deepEqual(dayAt([ev('body-vulva-mucus-inspect', '2026-03-03', { vectors: { wetness: 1 } })], 3).otherMethods, ['']);
});

test('a bleeding letter only for its exact flow; any other flow is bleeding without a letter', () => {
  for (const [value, letter] of [[0.2, 'VL'], [0.35, 'L'], [0.55, 'M'], [0.75, 'H']]) {
    assert.equal(dayAt([flow('2026-03-03', value)], 3).bleeding[0].letter, letter);
  }
  for (const value of [0.08, 0.95, 0.5, 0.36]) {
    const d = dayAt([flow('2026-03-03', value)], 3);
    assert.deepEqual(d.bleeding, [{}], String(value));
    assert.ok(d.input, 'still the bleeding stamp');
  }
  assert.equal(dayAt([brown('2026-03-03')], 3).bleeding[0].letter, 'B');
  assert.deepEqual(dayAt([ev('body-vulva-bleeding', '2026-03-03', 'heavy')], 3).bleeding, [{}]);
});

test('"none" is recorded, not drawn, and says nothing beside a bleeding', () => {
  const none = dayAt([flow('2026-03-03', 0)], 3);
  assert.deepEqual(none.bleeding, [{ none: true }]);
  assert.equal(none.input, undefined);
  assert.deepEqual(dayAt([flow('2026-03-03', 0), flow('2026-03-03', 0.35)], 3).bleeding.map(b => b.letter), ['L']);
});

test('old records stay as recorded: H with a mucus code', () => {
  const d = dayAt([flow('2026-03-03', 0.75), code('2026-03-03', '8C', 'X1')], 3);
  assert.equal(d.bleeding[0].letter, 'H');
  assert.deepEqual(d.code, { code: '8C', frequency: 'X1' });
  assert.equal(d.input.baby, undefined);
});

test('a charted stamp is drawn and named; one of another method, or unknown, is said', () => {
  const d = dayAt([stamp('2026-03-03', 'creighton', 'yellow-baby'), code('2026-03-03', '6C', 'X1')], 3);
  assert.equal(d.stamp.id, 'yellow-baby');
  assert.equal(d.input.stamp, 'yellow-baby');
  assert.deepEqual(d.otherMethods, []);
  assert.deepEqual(dayAt([stamp('2026-03-03', 'billings', 'red')], 3).otherMethods, ['billings']);
  assert.deepEqual(dayAt([stamp('2026-03-03', 'creighton', 'toString')], 3).otherMethods, ['creighton']);
  assert.equal(dayAt([stamp('2026-03-03', 'creighton', 'toString')], 3).input, undefined);
});

test('only a recorded peak is marked, also on a day with nothing else, and the stamp carries none', () => {
  const c = only([code('2026-03-03', '10KL', 'X1'), code('2026-03-04', '0', 'AD'), peak('2026-03-05'), code('2026-03-06', '0', 'AD')]);
  assert.equal(c.days[4].peak, 'recorded');
  assert.equal(c.days[4].input, undefined);
  assert.deepEqual(c.days.map(d => d.count ?? 0), [0, 0, 0, 0, 0, 1, 0, 0, 0, 0]);
  assert.equal(dayAt([code('2026-03-03', '10KL', 'X1'), peak('2026-03-03')], 3).input.letter, undefined);
  const observed = only([code('2026-03-03', '10KL', 'X1'), code('2026-03-04', '0', 'AD')]);
  assert.equal(observed.days.some(d => d.peak || d.count), false);
  assert.equal(peakLetterOf(rep), 'P');
});

test('a computed peak only on request, and never over a recorded one', () => {
  const events = [code('2026-03-03', '10KL', 'X1'), code('2026-03-04', '0', 'AD'), code('2026-03-05', '0', 'AD')];
  const c = only(events, { computedPeak: true });
  assert.deepEqual(c.days.map(d => d.peak ?? d.count ?? '').slice(0, 6), ['', '', 'computed', 1, 2, '']);
  const r = only([...events, peak('2026-03-02')], { computedPeak: true });
  assert.deepEqual(r.days.map(d => d.peak ?? '').slice(0, 4), ['', 'recorded', '', '']);
});

test('two recorded peaks: both are marked, the count follows the last', () => {
  const c = only([peak('2026-03-03'), peak('2026-03-06'), code('2026-03-07', '0', 'AD'), code('2026-03-08', '2', 'X1')]);
  assert.deepEqual(c.days.map(d => d.peak ? 'P' : d.count ?? '').join(','), ',,P,,,P,1,2,,');
});

test('the peak and the count stay in their cycle', () => {
  const m = chart([start('2026-03-01'), peak('2026-03-08'), start('2026-03-10'), code('2026-03-10', '0', 'AD'), code('2026-03-11', '0', 'AD')]);
  assert.deepEqual(m.cycles[0].days.map(d => d.count ?? 0), [0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(m.cycles[1].days.some(d => d.count), false);
});

test('a long cycle keeps every day, past 35 and past 90', () => {
  const c = chart([code('2026-03-31', '8C', 'X1')], { rows: [{ startDate: '2025-12-01' }] }).cycles[0];
  assert.equal(c.days.length, 121);
  assert.equal(c.days[120].day, 121);
  assert.equal(c.days[120].code.code, '8C');
});

test('the events come back as the host gave them, and are not changed', () => {
  const mine = Object.freeze({ ...code('2026-03-03', '8C', 'X1'), mine: 42 });
  const d = dayAt([mine], 3);
  assert.equal(d.events[0], mine);
});
