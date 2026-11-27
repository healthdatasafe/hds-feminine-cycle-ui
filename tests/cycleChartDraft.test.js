import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registry, buildCycleChart, CycleChart, CYCLE_CHART_STRINGS, daysToCheck, nextToCheck, isDayToCheck } from '../js/index.js';

const rep = registry.get('creighton');
const at = (date) => Date.parse(`${date}T12:00:00Z`) / 1000;
const ev = (item, date, content) => ({ time: at(date), streamIds: [item], type: 'x', content });
const code = (date, value, frequency) => ev('body-vulva-mucus-inspect', date, { source: { key: 'creighton', sourceData: value, ...(frequency ? { annotations: { frequency } } : {}) } });
const flow = (date, value) => ev('body-vulva-bleeding', date, value);
/** a proposal: shaped as a record, on no day of its own */
const dCode = (value, frequency) => ({ streamIds: ['body-vulva-mucus-inspect'], type: 'x', content: { source: { key: 'creighton', sourceData: value, ...(frequency ? { annotations: { frequency } } : {}) } } });
const dFlow = (value) => ({ streamIds: ['body-vulva-bleeding'], type: 'x', content: value });
const dPeak = () => ({ streamIds: ['fertility-cycles-peak-day'], type: 'x', content: null });
const dayOf = (e) => new Date(e.time * 1000).toISOString().slice(0, 10);
const build = (events, draftRows, opts = {}) => buildCycleChart(events, rep, { dayOf, today: '2026-03-31', draftRows, ...opts });
const html = (model, props = {}) => renderToStaticMarkup(createElement(CycleChart, { model, ...props }));
const cells = (h) => [...h.matchAll(/<td([^>]*)>(.*?)<\/td>/gs)].map(m => ({ attrs: m[1], body: m[2] }));
/** what is heard of each day, its day first; the same without its day */
const spoken = (h) => cells(h).map(c => /<span class="hdsfc-sr"[^>]*>(.*?)<\/span>/s.exec(c.body)[1]);
const heard = (h) => spoken(h).map(t => t.replace(/^[^:]*?\s?:\s/, ''));
const seen = (h) => cells(h).map(c => [...c.body.split('<span class="hdsfc-sr"')[0].matchAll(/<svg class="hdsfc-line[^>]*>(?:<text[^>]*>(.*?)<\/text>)?<\/svg>/g)].map(x => x[1] ?? '').filter(Boolean));

/** a row of every state: what she recorded on its days, and what was read from her chart */
const recorded = [code('2026-03-04', '10KL', 'X1'), code('2026-03-05', '8C', 'X1'), code('2026-03-06', '0', 'AD'), code('2026-03-08', '8C', 'X1')];
const row = {
  id: 'r',
  startDate: '2026-03-01',
  days: [
    { day: 1, events: [dCode('8C', 'X1')], state: 'draft', ref: 'c1' },
    { day: 2, events: [dCode('6C')], state: 'unread' },
    { day: 3, events: [dFlow(0.35), dCode('6C')], state: 'incomplete' },
    { day: 4, events: [dCode('10KL', 'X1')], state: 'edited' },
    { day: 5, events: [dCode('10KL', 'X1')], state: 'draft' },
    { day: 6, events: [], state: 'unread' },
    { day: 8, events: [dCode('8C', 'X1')], state: 'draft' }
  ]
};
const model = () => build(recorded, [row]);

test('draft rows are the rows, in their order: a row with its first day dates its days, one without has none', () => {
  const m = build([code('2026-03-02', '8C', 'X1'), code('2026-02-01', '2')], [
    { id: 'r1', startDate: '2026-03-01', ref: { sheet: 1 }, days: [{ day: 2, events: [dCode('8C', 'X1')], state: 'draft', ref: 'c2' }, { day: 4, events: [], state: 'unread' }] },
    { id: 'r2', length: 3, days: [{ day: 1, events: [dFlow(0.75)], state: 'draft' }] }
  ]);
  assert.deepEqual(m.cycles.map(c => [c.id, c.row, c.startDate, c.endDate, c.days.length, c.open]), [
    ['r1', 1, '2026-03-01', '2026-03-04', 4, false], ['r2', 2, undefined, undefined, 3, false]
  ]);
  assert.deepEqual(m.cycles[0].ref, { sheet: 1 });
  const d2 = m.cycles[0].days[1];
  assert.equal(d2.date, '2026-03-02');
  assert.deepEqual([d2.draft.state, d2.draft.ref, d2.draft.code, d2.code, d2.relation], ['draft', 'c2', { code: '8C', frequency: 'X1' }, { code: '8C', frequency: 'X1' }, 'same']);
  const d4 = m.cycles[0].days[3];
  assert.deepEqual([d4.draft.state, d4.draft.input, d4.relation], ['unread', undefined, undefined]);
  assert.equal(Object.hasOwn(m.cycles[1].days[0], 'date'), false);
  assert.equal(m.cycles[1].days[0].draft.bleeding[0].letter, 'H');
  // nothing dropped: what she recorded outside the rows is counted
  assert.deepEqual(m.unplaced.map(u => u.reason), ['outside-rows']);
});

test('a draft is the same as the record by its key, code, annotations, bleeding and peak, never by the order of its keys', () => {
  const relation = (recordedEvents, draftEvents) => build(recordedEvents, [{ id: 'r', startDate: '2026-03-01', days: [{ day: 1, events: draftEvents, state: 'draft' }] }]).cycles[0].days[0].relation;
  const reordered = { streamIds: ['body-vulva-mucus-inspect'], type: 'x', content: { source: { annotations: { frequency: 'X1' }, sourceData: '8C', key: 'creighton' } } };
  assert.equal(relation([code('2026-03-01', '8C', 'X1')], [reordered]), 'same');
  assert.equal(relation([code('2026-03-01', '8C', 'X1')], [dCode('8C', 'X2')]), 'differs');
  assert.equal(relation([code('2026-03-01', '8C', 'X1')], [dCode('8C')]), 'differs');
  assert.equal(relation([code('2026-03-01', '8C', 'X1')], [dCode('8C', 'X1'), dPeak()]), 'differs');
  assert.equal(relation([code('2026-03-01', '8C', 'X1')], [dCode('8C', 'X1'), dFlow(0.35)]), 'differs');
  assert.equal(relation([code('2026-03-01', '8C', 'X1'), flow('2026-03-01', 0.35)], [dFlow(0.35), dCode('8C', 'X1')]), 'same');
  assert.equal(relation([], [dCode('8C', 'X1')]), undefined);
});

test('a draft writes its own peak and the count after it, never a computed one', () => {
  const m = build([], [{
    id: 'r',
    startDate: '2026-03-01',
    days: [
      { day: 1, events: [dCode('10KL', 'X1'), dPeak()], state: 'draft' }, { day: 2, events: [dCode('0', 'AD')], state: 'draft' }, { day: 3, events: [dCode('0', 'AD')], state: 'draft' }
    ]
  }], { computedPeak: true });
  assert.deepEqual(m.cycles[0].days.map(d => [d.draft.peak, d.draft.count, d.peak, d.count]), [['recorded', undefined, undefined, undefined], [undefined, 1, undefined, undefined], [undefined, 2, undefined, undefined]]);
  const none = build([], [{ id: 'r', startDate: '2026-03-01', days: [{ day: 1, events: [dCode('10KL', 'X1')], state: 'draft' }, { day: 2, events: [dCode('0', 'AD')], state: 'draft' }] }], { computedPeak: true });
  assert.deepEqual(none.cycles[0].days.map(d => d.draft.peak), [undefined, undefined]);
  assert.match(html(none), /Dashed/);
  assert.doesNotMatch(html(none), /\(P\)/);
});

test('a draft row is refused when it cannot be drawn', () => {
  assert.throws(() => build([], [], { rows: [{ startDate: '2026-03-01' }] }), /give one/);
  assert.throws(() => build([], [{ id: 'r', days: [{ day: 2, events: [], state: 'draft' }, { day: 2, events: [], state: 'unread' }] }]), /day 2 twice/);
  assert.throws(() => build([], [{ id: 'r', days: [{ day: 0, events: [], state: 'draft' }] }]), /has a day 0/);
  assert.throws(() => build([], [{ id: 'r', startDate: '2026-02-30', days: [] }]), /YYYY-MM-DD/);
});

test('every state is seen and heard as it is (rules 15 and 16): a draft never looks recorded, not read is never empty', () => {
  const h = html(model());
  assert.deepEqual(heard(h), [
    'draft 8C X1, not saved',
    'written on the chart, not read',
    'draft 6C, bleeding L, Light, part not read, not saved',
    '10KL X1, already recorded, same, corrected by you',
    'recorded 8C X1, draft 10KL X1, not saved',
    '0 AD; on the chart, something written that was not read',
    'Nothing recorded',
    '8C X1, already recorded, same'
  ]);
  assert.deepEqual(seen(h), [['8C', 'X1', '?'], ['??'], ['L', '6C', '?…'], ['10KL', 'X1', '✓✎'], ['8C', 'X1', '≠', '10KL', 'X1', '?'], ['0', 'AD', '??'], [], ['8C', 'X1', '✓']]);
  const attrs = cells(h).map(c => [/data-draft="(\w+)"/.exec(c.attrs)?.[1], /data-relation="(\w+)"/.exec(c.attrs)?.[1]]);
  assert.deepEqual(attrs, [['draft'], ['unread'], ['incomplete'], [undefined, 'same'], [undefined, 'differs'], [], [], [undefined, 'same']].map(([a, b]) => [a, b]));
  // a draft alone has its stamp, under a dashed outline and hatching; beside a record, the record is drawn as it is and
  // the draft (or its "??") is in a dashed box under it
  assert.match(cells(h)[0].body, /<span class="hdsfc-stamp"><svg/);
  assert.match(cells(h)[1].body, /<span class="hdsfc-stamp"><\/span>/);
  assert.match(cells(h)[4].body, /hdsfc-draft-part/);
  assert.match(cells(h)[5].body, /<span class="hdsfc-stamp"><svg.*hdsfc-draft-part/s);
  const css = readFileSync(new URL('../css/cycle-chart.css', import.meta.url), 'utf8');
  assert.match(css, /\.hdsfc-cell\[data-draft\]::before, \.hdsfc-draft-part::before \{[^}]*dashed/);
  assert.match(css, /\.hdsfc-cell\[data-draft\] \.hdsfc-stamp::after \{[^}]*repeating-linear-gradient/);
  for (const note of ['Dashed, ?: read from the chart, not saved.', '??: written on the chart, not read.', '…: part of it not read.', '✎: corrected by you.', '✓: already recorded, the same.', '≠: recorded otherwise; the draft is written under the record.']) {
    assert.ok(h.includes(note), note);
  }
  assert.doesNotMatch(html(build(recorded, undefined, { rows: [{ startDate: '2026-03-01' }] })), /Dashed|not read|draft/);
});

test('a row without its first day: its place, "first day not answered", days by number only, the host\'s line under it', () => {
  const m = build([], [row, { id: 'u', length: 3, days: [{ day: 2, events: [dCode('2')], state: 'draft' }] }]);
  const h = html(m, { rowNote: (c) => c.startDate ? null : createElement('p', { className: 'host' }, `answer row ${c.row}`) });
  assert.match(h, /Row 1, from March 1, 2026 · 8 days/);
  assert.match(h, /aria-label="Row 2"/);
  assert.match(h, /Row 2 · first day not answered · 3 days/);
  const second = h.split('hdsfc-cycle').at(-1);
  assert.deepEqual([...second.matchAll(/<th[^>]*>.*?<span class="hdsfc-sr">(.*?)<\/span><\/th>/gs)].map(x => x[1]), ['Day 1', 'Day 2', 'Day 3']);
  assert.match(second, /<p class="host">answer row 2<\/p>/);
  assert.equal((h.match(/class="host"/g) ?? []).length, 1);
  assert.equal(heard(h)[9], 'draft 2, not saved');
});

test('a real button in each cell she can act on (rule 17), named by its day and its content; none when read-only; no grid', () => {
  const m = build(recorded, [row, { id: 'u', days: [{ day: 1, events: [dCode('2')], state: 'draft' }] }]);
  assert.doesNotMatch(html(m), /<button/);
  const h = html(m, { onActivateDay: () => {}, selected: { cycleId: 'r', day: 5 } });
  const acting = cells(h).map(c => c.body.startsWith('<button'));
  assert.deepEqual(acting, [true, true, true, false, true, true, false, false, true]);
  for (const [, tag] of h.matchAll(/<td[^>]*>(<button[^>]*>)/g)) assert.match(tag, /type="button"/);
  // named by its own text, its day first: everything else in it is hidden from speech
  assert.deepEqual(spoken(h).filter((_, i) => acting[i]).slice(0, 2), ['Day 1, March 1, 2026: draft 8C X1, not saved', 'Day 2, March 2, 2026: written on the chart, not read']);
  assert.equal(spoken(h).at(-1), 'Day 1: draft 2, not saved');
  // a day that is not a button (settled: the same as recorded) keeps its day
  assert.equal(spoken(h)[3], 'Day 4, March 4, 2026: 10KL X1, already recorded, same, corrected by you');
  for (const c of cells(h).filter(c => c.body.startsWith('<button'))) assert.match(c.body, /^<button[^>]*><span aria-hidden="true"/);
  assert.doesNotMatch(h, /role="grid"/);
  assert.match(cells(h)[4].body, /^<button[^>]*aria-current="true"/);
  assert.equal((h.match(/aria-current/g) ?? []).length, 1);
  assert.match(h, /<button type="button" class="hdsfc-next">Next to check \(6 left\)<\/button>/);
  assert.match(h, /class="hdsfc-skip">Skip to Row 2<\/button>/);
  assert.match(h, /class="hdsfc-skip">Skip past the chart<\/button>/);
  assert.doesNotMatch(html(build(recorded, [row]), { onActivateDay: () => {} }), /hdsfc-skip/);
  // the host chooses the days: here, also what she recorded
  const all = html(m, { onActivateDay: () => {}, actionable: (day) => day.draft != null || day.events.length > 0 });
  assert.equal(cells(all).filter(c => c.body.startsWith('<button')).length, 8);
});

test('the host says which of the days she can act on are still to check: they are counted, the others stay buttons', () => {
  const m = build(recorded, [row, { id: 'u', days: [{ day: 1, events: [dCode('2')], state: 'draft' }] }]);
  const buttons = (h) => cells(h).filter(c => c.body.startsWith('<button')).length;
  const next = (h) => /class="hdsfc-next">(.*?)<\/button>/.exec(h)?.[1];
  const actionable = (day) => day.draft != null;
  const settled = new Set(['r1', 'r5', 'r8']);
  const toCheck = (day, cycle) => !settled.has(`${cycle.id}${day.day}`);
  // without toCheck, every day she can act on is to check (as before)
  const before = html(m, { onActivateDay: () => {}, actionable });
  assert.equal(buttons(before), 8);
  assert.equal(next(before), 'Next to check (8 left)');
  const h = html(m, { onActivateDay: () => {}, actionable, toCheck });
  assert.equal(buttons(h), 8);
  assert.equal(next(h), 'Next to check (5 left)');
  // a day to check that is not a button is not counted
  assert.equal(next(html(m, { onActivateDay: () => {}, toCheck: () => true })), 'Next to check (6 left)');
  assert.equal(next(html(m, { onActivateDay: () => {}, toCheck: (day) => day.draft?.state === 'unread' })), 'Next to check (2 left)');
  // none left: no "Next to check", the days are still buttons
  const done = html(m, { onActivateDay: () => {}, actionable, toCheck: () => false });
  assert.equal(next(done), undefined);
  assert.equal(buttons(done), 8);
  // read-only: no button, whatever is to check
  assert.equal(buttons(html(m, { actionable, toCheck })), 0);
});

test('the next day to check, in the order drawn, after the one shown even when it is no longer one, round to the first', () => {
  const m = build(recorded, [row, { id: 'u', days: [{ day: 1, events: [dCode('2')], state: 'draft' }] }]);
  const at = (selected, opts) => { const t = nextToCheck(m, selected, opts); return t && `${t.cycle.id}${t.day.day}`; };
  assert.deepEqual(daysToCheck(m).map(t => `${t.cycle.id}${t.day.day}`), ['r1', 'r2', 'r3', 'r5', 'r6', 'u1']);
  assert.equal(at(null), 'r1');
  assert.equal(at({ cycleId: 'r', day: 1 }), 'r2');
  assert.equal(at({ cycleId: 'r', day: 4 }), 'r5');
  assert.equal(at({ cycleId: 'r', day: 6 }), 'u1');
  assert.equal(at({ cycleId: 'u', day: 1 }), 'r1');
  assert.equal(at({ cycleId: 'gone', day: 3 }), 'r1');
  assert.equal(at({ cycleId: 'u', day: 1 }, { newestFirst: true }), 'r1');
  assert.equal(at({ cycleId: 'r', day: 8 }, { newestFirst: true }), 'u1');
  assert.equal(nextToCheck(build(recorded, [{ id: 'r', startDate: '2026-03-04', days: [{ day: 1, events: [dCode('10KL', 'X1')], state: 'draft' }] }]), null), null);
  assert.equal(isDayToCheck({ draft: { state: 'unread' } }), true);
  assert.equal(isDayToCheck({ draft: { state: 'draft' }, relation: 'same' }), false);
});

test('every new word in every language the chart has, with its placeholders', () => {
  const marks = (s) => [...s.matchAll(/\{\w+\}/g)].map(m => m[0]).sort();
  for (const [key, text] of Object.entries(CYCLE_CHART_STRINGS)) {
    for (const lang of ['fr', 'es', 'it', 'pt-BR']) {
      assert.ok(text[lang], `${key} ${lang}`);
      assert.deepEqual(marks(text[lang]), marks(text.en), `${key} ${lang}`);
    }
  }
  const h = html(model(), { lang: 'fr' });
  assert.equal(heard(h)[0], 'brouillon 8C X1, non enregistré');
  assert.equal(heard(h)[1], 'écrit sur le tableau, non lu');
});
