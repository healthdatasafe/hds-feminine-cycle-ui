import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registry, buildCycleChart, CycleChart, CYCLE_CHART_STRINGS } from '../js/index.js';

const rep = registry.get('creighton');
const ev = (item, date, content, extra = {}) => ({ time: Date.parse(`${date}T12:00:00Z`) / 1000, streamIds: [item], type: 'x', content, ...extra });
const start = (date) => ev('fertility-cycles-start', date, null);
const peak = (date) => ev('fertility-cycles-peak-day', date, null);
const flow = (date, value) => ev('body-vulva-bleeding', date, value);
const code = (date, value, frequency, key = 'creighton') => ev('body-vulva-mucus-inspect', date, { source: { key, sourceData: value, ...(frequency ? { annotations: { frequency } } : {}) } });
const dayOf = (e) => new Date(e.time * 1000).toISOString().slice(0, 10);
const build = (events, opts = {}) => buildCycleChart(events, rep, { dayOf, today: '2026-03-10', ...opts });
const html = (events, opts, props = {}) => renderToStaticMarkup(createElement(CycleChart, { model: build(events, opts), ...props }));
/** what is heard of each day, in order; what is seen of it */
const heard = (h) => [...h.matchAll(/<td[^>]*>.*?<span class="hdsfc-sr">(.*?)<\/span>/gs)].map(m => m[1].replaceAll('&#x27;', "'"));
const seen = (h) => [...h.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map(m => [...m[1].split('<span class="hdsfc-sr">')[0].matchAll(/<svg class="hdsfc-line[^>]*>(?:<text[^>]*>(.*?)<\/text>)?<\/svg>/g)].map(x => x[1] ?? '').filter(Boolean));
const S = start('2026-03-01');

test('a table per cycle with its caption, a header per day, each cell tied to its header', () => {
  const h = html([S, code('2026-03-03', '8C', 'X1')]);
  assert.match(h, /<caption[^>]*>Cycle of March 1, 2026 · 10 days so far<\/caption>/);
  const ids = [...h.matchAll(/<th id="([^"]+)" scope="col"/g)].map(m => m[1]);
  const refs = [...h.matchAll(/<td headers="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 10);
  assert.deepEqual(refs, ids);
  assert.match(h, /role="region" tabindex="0" aria-label="Cycle of March 1, 2026"/i);
  assert.equal(new Set(ids).size, 10);
  assert.match(h, /<span class="hdsfc-sr">Day 3, March 3, 2026<\/span>/);
});

test('two charts on one page share no id', () => {
  const model = build([S]);
  const h = renderToStaticMarkup(createElement('div', null, createElement(CycleChart, { model }), createElement(CycleChart, { model })));
  const ids = [...h.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test('a closed cycle says its days; a long one goes on a new line with its own headers', () => {
  const h = html([], { rows: [{ startDate: '2026-01-01', endDate: '2026-02-09' }] }, { columns: 35 });
  assert.match(h, /· 40 days<\/caption>/);
  const bodies = h.split('<tbody>').slice(1);
  assert.deepEqual(bodies.map(b => (b.match(/<th /g) ?? []).length), [35, 5]);
  assert.match(bodies[1], /Day 36, February 5, 2026/);
  assert.equal((h.match(/<col\/>/g) ?? []).length, 35);
  assert.equal(html([], { rows: [{ startDate: '2026-01-01', endDate: '2026-02-09' }] }, { columns: 7 }).split('<tbody>').length - 1, 6);
});

test('a day past 90 has its date and no number, and is there', () => {
  const h = html([code('2026-03-09', '8C', 'X1')], { rows: [{ startDate: '2025-12-01' }] });
  assert.equal((h.match(/<td /g) ?? []).length, 100);
  assert.match(h, /Day 90, February 28, 2026/);
  assert.doesNotMatch(h, /Day 91/);
  assert.match(h, /<span class="hdsfc-sr">March 1, 2026<\/span>/);
  assert.equal(heard(h)[98], '8C X1');
});

test('each day is heard as it is seen', () => {
  const h = html([S, flow('2026-03-01', 0.75), flow('2026-03-02', 0.35), code('2026-03-02', '0', 'AD'), code('2026-03-04', '10KL', 'X2'), peak('2026-03-04'), code('2026-03-05', '0', 'AD'), flow('2026-03-06', 0.5), flow('2026-03-07', 0)]);
  assert.deepEqual(heard(h).slice(0, 8), [
    'bleeding H, Heavy', '0 AD, bleeding L, Light', 'Nothing recorded', '10KL X2, peak day', '0 AD, day 1 after the peak',
    'bleeding, day 2 after the peak', 'no bleeding, day 3 after the peak', 'Nothing recorded'
  ]);
  assert.deepEqual(seen(h).slice(0, 8), [['H'], ['L', '0', 'AD'], [], ['P', '10KL', 'X2'], ['1', '0', 'AD'], ['2', '●'], ['3', '–'], []]);
});

test('an empty day draws no stamp; a recorded peak alone is marked without one', () => {
  const h = html([S, peak('2026-03-04'), code('2026-03-05', '0')]);
  const cells = [...h.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map(m => m[1]);
  assert.match(cells[2], /<span class="hdsfc-stamp"><\/span>/);
  assert.match(cells[3], /<span class="hdsfc-stamp"><\/span>/);
  assert.deepEqual(seen(h)[3], ['P']);
  assert.equal(heard(h)[3], 'peak day');
  assert.match(cells[4], /#7FB069/);
});

test('the stamp has neither the code nor the peak on it: they are written beside it, once', () => {
  const h = html([S, code('2026-03-04', '10KL', 'X2'), peak('2026-03-04')]);
  const cell = [...h.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map(m => m[1])[3];
  const stamp = /<span class="hdsfc-stamp">(.*?)<\/span>/s.exec(cell)[1];
  assert.doesNotMatch(stamp, /<text/);
  assert.match(stamp, /#FFFFFF/i);
  assert.equal((cell.match(/>10KL</g) ?? []).length, 1);
});

test('a computed peak looks different and is explained; a recorded one is not', () => {
  const events = [S, code('2026-03-03', '10KL', 'X1'), code('2026-03-04', '0', 'AD')];
  const h = html(events, { computedPeak: true });
  assert.deepEqual(seen(h)[2], ['(P)', '10KL', 'X1']);
  assert.equal(heard(h)[2], '10KL X1, peak day, computed');
  assert.match(h, /\(P\): the peak as computed/);
  assert.doesNotMatch(html(events), /computed/);
});

test('several observations, other methods and records off the chart are said', () => {
  const h = html([S, code('2026-03-03', '0', 'AD'), code('2026-03-03', '8C', 'X1'), code('2026-03-04', 4, undefined, 'femm'), code('2026-02-01', '2'), code('2026-03-20', '2')]);
  assert.deepEqual(seen(h)[2], ['8C', 'X1', '+0', 'AD']);
  assert.equal(heard(h)[2], '8C X1, also 0 AD');
  assert.deepEqual(seen(h)[3], ['◇']);
  assert.equal(heard(h)[3], 'recorded in FEMM, not drawn');
  assert.match(h, /another method \(FEMM\)/);
  assert.match(h, /2 records are not on the chart: 1 after today, 1 outside these cycles\./);
  const none = html([S]);
  assert.doesNotMatch(none, /hdsfc-note/);
});

test('in French, every word', () => {
  const h = html([S, flow('2026-03-01', 0.75), code('2026-03-04', '10KL', 'X2'), peak('2026-03-04')], {}, { lang: 'fr' });
  assert.match(h, /Cycle du 1 mars 2026 · 10 jours à ce jour/);
  assert.deepEqual(heard(h).slice(0, 5), ['saignement H, Abondant', 'Rien de noté', 'Rien de noté', '10KL X2, jour pic', 'Rien de noté']);
  for (const [key, text] of Object.entries(CYCLE_CHART_STRINGS)) {
    const marks = (s) => [...s.matchAll(/\{\w+\}/g)].map(m => m[0]).sort();
    assert.ok(text.fr, key);
    assert.deepEqual(marks(text.fr), marks(text.en), key);
  }
});

test('a host in another language overrides every word, seen and spoken, the dates and the method\'s texts', () => {
  const h = html([S, flow('2026-03-01', 0.75), flow('2026-03-02', 0.5)], {}, {
    lang: 'pt-BR',
    strings: { cycleOf: 'Ciclo de {date}', bleeding: { en: 'x', pt: 'sangramento' }, bleedingLetter: 'sangramento {letter}: {label}', nothing: 'Nada anotado', day: 'Dia {n}, {date}', daysSoFarMany: '{n} dias até hoje' },
    localize: (text) => text.en === 'Heavy' ? 'Intenso' : text.en,
    formatDate: (date) => date
  });
  assert.match(h, /lang="pt-BR"/);
  assert.match(h, /Ciclo de 2026-03-01 · 10 dias até hoje/);
  assert.deepEqual(heard(h).slice(0, 3), ['sangramento H: Intenso', 'sangramento', 'Nada anotado']);
  assert.match(h, /●: bleeding for which/);
  assert.match(html([S, flow('2026-03-02', 0)]), /–: no bleeding, as recorded/);
  assert.match(html([S, flow('2026-03-02', 0.5)], {}, { strings: { noteNoLetter: 'sem letra {mark}' } }), /sem letra ●/);
});

test('the host draws in a day, and chooses the order', () => {
  const h = html([start('2026-02-01'), S, code('2026-03-03', '8C', 'X1')], {}, { newestFirst: true, renderDay: (day, cycle) => day.code ? createElement('a', { href: `#${cycle.id}-${day.day}` }, 'open') : null });
  assert.ok(h.indexOf('March 1, 2026 ·') < h.indexOf('February 1, 2026 ·'));
  assert.match(h, /<a href="#2026-03-01-3">open<\/a><\/td>/);
});

test('text from a record is text, and never a placeholder', () => {
  const h = html([S, code('2026-03-03', '<b>{n}</b>')]);
  assert.doesNotMatch(h, /<b>/);
  assert.equal(heard(h)[2], '&lt;b&gt;{n}&lt;/b&gt;');
});

test('no cycle is said', () => {
  assert.match(html([]), /No cycle to show/);
});

test('nothing it says is a verdict', () => {
  const all = Object.values(CYCLE_CHART_STRINGS).flatMap(t => Object.values(t)).join(' ');
  assert.doesNotMatch(all, /fertil|safe|risk|infertil|ovulat/i);
});
