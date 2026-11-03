import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registry, composeCellInput, longestCode } from '../js/index.js';

const BLEEDING_ITEMS = ['body-vulva-bleeding', 'body-vagina-bleeding', 'body-vulva-bleeding-browndark', 'bleeding-brown-dark'];

const mucus = (method, option) => ({
  time: 0,
  streamIds: ['body-vulva-mucus-inspect'],
  type: 'vulva-mucus-inspect/9d-vector',
  content: { source: { key: method, sourceData: option } }
});
const bleeding = (value) => ({ time: 0, streamIds: ['body-vulva-bleeding'], type: 'ratio/proportion', content: value });

// Each built-in: id → [methodId, periodDisplay, peak letter, count, options]
const METHODS = {
  femm: ['femm', undefined, null, 3, ['1', '2', '3', '4']],
  billings: ['billings', 'stamp', 'X', 3, ['dry', 'unchanged', 'sticky', 'cloudyWhite', 'wetSlippery', 'peak']],
  creighton: ['creighton', 'stamp', 'P', 3, ['0', '2', '2W', '4', '6', '6K', '8CK', '10', '10WL', '10B']],
  mira: ['mira', undefined, null, undefined, ['Dry', 'Sticky', 'Creamy', 'Watery', 'Raw Egg White']],
  sensiplan: ['sensiplan', 'separate', 'P', 3, ['t', 'ø', 'f', 'S', 'S+']],
  'sympto-thermal': ['sympto-thermal', 'separate', 'P', 3, ['dry', 'sticky', 'creamy', 'watery', 'eggWhite']],
  justisse: ['justisse', undefined, 'P', 3, ['dry', 'sticky', 'tacky', 'creamy', 'eggWhite', 'watery']],
  chartneo: ['chartneo', 'stamp', 'P', 3, []],
  marquette: ['marquette', 'separate', 'P', 3, ['1', '2', '3', '4', '5', '6', '7', '8']],
  appleHealth: ['appleHealth', 'separate', null, undefined, ['dry', 'sticky', 'creamy', 'watery', 'eggWhite']]
};

for (const [id, [methodId, periodDisplay, letter, count, options]] of Object.entries(METHODS)) {
  test(`${id}: registered, bound to ${methodId}`, () => {
    const rep = registry.get(id);
    assert.ok(rep, `${id} is registered`);
    assert.equal(rep.spec.id, id);
    assert.equal(rep.spec.boundMethod.methodId, methodId);
    assert.equal(rep.spec.periodDisplay, periodDisplay);
    assert.equal(rep.spec.peakMarker?.countAfter, count);
    if (letter) assert.equal(rep.spec.peakMarker?.letter ?? 'X', letter);
  });

  test(`${id}: every palette reference resolves to a hex colour`, () => {
    const rep = registry.get(id);
    for (const rules of Object.values(rep.spec.mappingRules)) {
      for (const frag of Object.values(rules)) {
        if (frag.fill) assert.match(rep.resolveColor(frag.fill), /^#[0-9A-F]{6}$/i, `${id} fill ${frag.fill}`);
      }
    }
    if (rep.spec.peakMarker?.color) assert.match(rep.resolveColor(rep.spec.peakMarker.color), /^#[0-9A-F]{6}$/i);
  });

  test(`${id}: peak candidates are options of the method`, () => {
    const rep = registry.get(id);
    const known = Object.keys(rep.spec.mappingRules.mucus ?? {});
    for (const c of rep.spec.peakMarker?.candidateOptions ?? []) assert.ok(known.includes(c), `${id} candidate ${c}`);
  });

  for (const option of options) {
    test(`${id}: native option ${option} renders a cell`, () => {
      const input = composeCellInput([mucus(methodId, option)], registry.get(id));
      assert.equal(input.empty, undefined);
      assert.ok(input.fill);
    });
  }

  test(`${id}: separate period display ⇔ no bleeding consumed`, () => {
    const rep = registry.get(id);
    const consumesBleeding = rep.spec.consumes.some(c => BLEEDING_ITEMS.includes(c.itemKey));
    if (periodDisplay === 'separate') assert.equal(consumesBleeding, false);
    if (periodDisplay === 'stamp') assert.equal(consumesBleeding, true);
  });
}

test('neutral-notation methods write the option on a white cell', () => {
  const cases = [
    ['sensiplan', 'S+', 'S+'], ['sensiplan', 'ø', 'ø'],
    ['sympto-thermal', 'eggWhite', 'EW'], ['sympto-thermal', 'creamy', 'C'],
    ['justisse', 'tacky', 'T'],
    ['marquette', '8', '8'], ['marquette', '2', '2'],
    ['appleHealth', 'watery', 'W']
  ];
  for (const [id, option, code] of cases) {
    const input = composeCellInput([mucus(id, option)], registry.get(id));
    assert.equal(input.fill, '#FFFFFF', `${id} ${option}`);
    assert.equal(input.code, code, `${id} ${option}`);
    assert.equal(input.baby, undefined);
  }
});

test('only sourced peak-type options are peak candidates', () => {
  assert.deepEqual(registry.get('sensiplan').spec.peakMarker.candidateOptions, ['S+']);
  assert.deepEqual(registry.get('sympto-thermal').spec.peakMarker.candidateOptions, ['eggWhite', 'watery']);
  assert.deepEqual(registry.get('justisse').spec.peakMarker.candidateOptions, ['eggWhite', 'watery']);
  // Marquette 6 (missing) and 7 (hds-draft) are left out.
  assert.deepEqual(registry.get('marquette').spec.peakMarker.candidateOptions, ['8']);
  // Chart Neo: the field reading is hds-draft, the peak comes from the record only.
  assert.equal(registry.get('chartneo').spec.peakMarker.compute, 'none');
  assert.equal(registry.get('chartneo').spec.peakMarker.candidateOptions, undefined);
  // Apple Health: a scale, no peak rule.
  assert.equal(registry.get('appleHealth').spec.peakMarker, undefined);
});

test('chartneo: red sticker for bleeding, spotting lighter, mucus not drawn yet', () => {
  const rep = registry.get('chartneo');
  assert.equal(composeCellInput([bleeding(0.75)], rep).fill, '#E8341C');
  assert.equal(composeCellInput([bleeding(0.08)], rep).fill, '#EF9A9A');
  assert.deepEqual(composeCellInput([mucus('chartneo', { walking: 3 })], rep), { empty: true });
});

test('signs beside the fluid, as method-rules.json shows.signs', () => {
  const signs = (id) => registry.get(id).spec.chart?.signs;
  const none = { temperature: 'no', lh: 'no', monitor: 'no', cervix: 'no' };
  assert.deepEqual(signs('creighton'), none);
  assert.deepEqual(signs('billings'), none);
  assert.deepEqual(signs('femm'), { ...none, lh: 'default' });
  assert.deepEqual(signs('justisse'), { ...none, temperature: 'optional' });
  assert.deepEqual(signs('sympto-thermal'), { ...none, temperature: 'default', cervix: 'optional' });
  assert.deepEqual(signs('sensiplan'), { ...none, temperature: 'default', cervix: 'optional' });
  assert.deepEqual(signs('chartneo'), { ...none, temperature: 'default' });
  assert.deepEqual(signs('marquette'), { ...none, temperature: 'optional', monitor: 'default' });
  assert.equal(registry.get('marquette').spec.chart.monitorItem, 'fertility-monitor-lh-marquette');
  // no shows.signs for these yet
  assert.equal(signs('mira'), undefined);
  assert.equal(signs('appleHealth'), undefined);
});

test('only chartneo is not offered yet', () => {
  const notOffered = registry.list().filter(r => r.spec.offered === false).map(r => r.spec.id);
  assert.deepEqual(notOffered, ['chartneo']);
});

test('longestCode: the widest notation a spec writes', () => {
  assert.equal(longestCode(registry.get('creighton').spec), 4);
  assert.equal(longestCode(registry.get('sympto-thermal').spec), 2);
  assert.equal(longestCode(registry.get('marquette').spec), 1);
  assert.equal(longestCode(registry.get('chartneo').spec), 0);
});

test('peakCount writes the count as the cell letter', () => {
  const rep = registry.get('sensiplan');
  const input = composeCellInput([mucus('sensiplan', 'f')], rep, { dayContext: { peakCount: 2 } });
  assert.equal(input.letter, '2');
  assert.equal(input.code, 'f');
  const peak = composeCellInput([mucus('sensiplan', 'S+')], rep, { dayContext: { isPeak: true } });
  assert.equal(peak.letter, 'P');
});
