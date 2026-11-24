import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeCellInput, registry, samplePreviewEvents } from '../js/index.js';

const femm = registry.get('femm');
assert.ok(femm, 'femm representation must be registered');

test('empty events → empty cell', () => {
  const out = composeCellInput([], femm);
  assert.equal(out.empty, true);
});

test('mucus dry (FEMM 1) → grey fill, no letter', () => {
  const out = composeCellInput(samplePreviewEvents[2].events, femm);
  assert.equal(out.fill, '#A8A8A8');
  assert.equal(out.letter, undefined);
  assert.equal(out.empty, undefined);
});

test('mucus slippery (FEMM 4) → blue fill', () => {
  const out = composeCellInput(samplePreviewEvents[5].events, femm);
  assert.equal(out.fill, '#3B6FB6');
});

test('bleeding heavy → magenta fill + M letter', () => {
  const out = composeCellInput(samplePreviewEvents[0].events, femm);
  assert.equal(out.fill, '#C8155A');
  assert.equal(out.letter, 'M');
});

test('bleeding light → magenta fill + L letter', () => {
  const out = composeCellInput(samplePreviewEvents[1].events, femm);
  assert.equal(out.fill, '#C8155A');
  assert.equal(out.letter, 'L');
});

test('bleeding precedence: bleeding overrides mucus', () => {
  const events = [
    { streamIds: ['body-vulva-mucus-inspect'], type: 'vulva-mucus-inspect/9d-vector', content: { source: { key: 'femm', sourceData: { mucus: 4 } } } },
    { streamIds: ['body-vagina-bleeding'], type: 'bleeding/intensity', content: 'heavy' }
  ];
  const out = composeCellInput(events, femm);
  assert.equal(out.fill, '#C8155A');
  assert.equal(out.letter, 'M');
  assert.ok(out.halfFill, 'mucus should be retained as halfFill');
  assert.equal(out.halfFill.color, '#3B6FB6');
});

test('brown spotting wins over both bleeding and mucus', () => {
  const events = [
    { streamIds: ['body-vulva-mucus-inspect'], type: 'vulva-mucus-inspect/9d-vector', content: { source: { key: 'femm', sourceData: { mucus: 3 } } } },
    { streamIds: ['body-vagina-bleeding'], type: 'bleeding/intensity', content: 'spotting' },
    { streamIds: ['bleeding-brown-dark'], type: 'bleeding/substate', content: 'brown' }
  ];
  const out = composeCellInput(events, femm);
  assert.equal(out.fill, '#7A4A2B');
});

test('brown-dark presence event (null content, real-world shape) merges with bleeding', () => {
  // In the wild (e.g. demo sample-mira), brown-dark coloration is an
  // `activity/plain` event with NULL content on the canonical
  // `body-vulva-bleeding-browndark` stream — presence is the signal.
  // It must compose: brown fill wins, bleeding letter retained.
  const events = [
    { streamIds: ['body-vulva-bleeding'], type: 'ratio/proportion', content: 0.35 },
    { streamIds: ['body-vulva-bleeding-browndark'], type: 'activity/plain', content: null }
  ];
  const out = composeCellInput(events, femm);
  assert.equal(out.fill, '#7A4A2B', 'brown-dark must override the bleeding fill');
  assert.equal(out.letter, 'L', 'bleeding intensity letter must be retained');
});

test('brown-dark presence event alone (null content) → brown cell', () => {
  const events = [
    { streamIds: ['body-vulva-bleeding-browndark'], type: 'activity/plain', content: null }
  ];
  const out = composeCellInput(events, femm);
  assert.equal(out.fill, '#7A4A2B');
});

const mucusOf = (key, mucus, vectors) => ({
  streamIds: ['body-vulva-mucus-inspect'],
  type: 'vulva-mucus-inspect/9d-vector',
  time: 0,
  content: { source: { key, sourceData: { mucus } }, vectors }
});
const creighton = registry.get('creighton');

test('[FOREIGN-1] an event of another method draws nothing without a conversion', () => {
  assert.equal(composeCellInput([mucusOf('billings', 'cloudyWhite')], femm).empty, true);
  // the same text exists in both methods, with another meaning: FEMM 4 is Slippery, Creighton 4 is dry
  assert.equal(composeCellInput([mucusOf('femm', 4)], creighton).empty, true);
  assert.equal(composeCellInput([mucusOf('marquette', '2')], femm).empty, true);
  assert.equal(composeCellInput([{ ...mucusOf('femm'), content: { source: { key: 'femm', sourceData: 4 } } }], creighton).empty, true);
});

test('[FOREIGN-2] no method draws another one\'s options', () => {
  const reps = registry.list();
  for (const from of reps) {
    const options = Object.keys(from.spec.mappingRules.mucus ?? {});
    for (const to of reps) {
      if (to === from) continue;
      for (const o of options) {
        const out = composeCellInput([mucusOf(from.spec.boundMethod.methodId, o)], to);
        assert.equal(out.empty, true, `${from.spec.id} "${o}" drawn as ${to.spec.id}`);
      }
    }
  }
});

test('[FOREIGN-3] a conversion that finds nothing, or fails, draws nothing; one that finds an option draws it', () => {
  const ev = mucusOf('femm', 4, { stretchability: 0.85 });
  assert.equal(composeCellInput([ev], creighton, { closestOption: () => null }).empty, true);
  assert.equal(composeCellInput([ev], creighton, { closestOption: () => { throw new Error('not loaded'); } }).empty, true);
  assert.equal(composeCellInput([ev], creighton, { closestOption: () => '10KL' }).code, '10KL');
});

test('[FOREIGN-4] an event that names no method is read by its own option, converted or not', () => {
  const ev = mucusOf(undefined, '8CK', { stretchability: 0.5 });
  assert.equal(composeCellInput([ev], creighton).code, '8CK');
  assert.equal(composeCellInput([ev], creighton, { closestOption: () => null }).code, '8CK');
});

test('[FOREIGN-5] bleeding is no method\'s: it draws beside another method\'s mucus', () => {
  const out = composeCellInput([mucusOf('femm', 4), { streamIds: ['body-vulva-bleeding'], type: 'ratio/proportion', content: 0.75 }], creighton);
  assert.equal(out.fill, '#D32F2F');
  assert.equal(out.code, undefined);
});

// A representation writing each bleeding band as its own letter.
const bands = {
  spec: {
    consumes: [{ itemKey: 'body-vulva-bleeding', role: 'bleeding' }],
    mappingRules: {
      bleeding: { spotting: { letter: 'S' }, light: { letter: 'L' }, medium: { letter: 'M' }, heavy: { letter: 'H' } }
    },
    precedence: ['bleeding']
  },
  resolveColor: (key) => key
};
const bandOf = (value) => composeCellInput([{ streamIds: ['body-vulva-bleeding'], type: 'ratio/proportion', content: value }], bands).letter;

test('bleeding scale anchors: Spotting and Very light are spotting, Light light, Moderate medium, Heavy and Very heavy heavy', () => {
  assert.equal(bandOf(0.08), 'S');
  assert.equal(bandOf(0.2), 'S', 'Very light (0.2) is spotting (method-rules.json, Creighton VL)');
  assert.equal(bandOf(0.35), 'L');
  assert.equal(bandOf(0.55), 'M');
  assert.equal(bandOf(0.75), 'H');
  assert.equal(bandOf(0.95), 'H');
  assert.equal(bandOf(1), 'H');
});

test('bleeding between anchors reads as the nearest anchor', () => {
  assert.equal(bandOf(0.01), 'S');
  assert.equal(bandOf(0.15), 'S');
  assert.equal(bandOf(0.27), 'S', 'nearer Very light (0.2) than Light (0.35)');
  assert.equal(bandOf(0.28), 'L', 'nearer Light (0.35) than Very light (0.2)');
  assert.equal(bandOf(0.44), 'L');
  assert.equal(bandOf(0.46), 'M');
  assert.equal(bandOf(0.65), 'M', 'on the Moderate / Heavy midpoint: the lower');
  assert.equal(bandOf(0.66), 'H');
});

test('bleeding 0 or below draws nothing; content.value is read like a bare number', () => {
  assert.equal(composeCellInput([{ streamIds: ['body-vulva-bleeding'], type: 'ratio/proportion', content: 0 }], bands).empty, true);
  assert.equal(composeCellInput([{ streamIds: ['body-vulva-bleeding'], type: 'ratio/proportion', content: { value: 0.2 } }], bands).letter, 'S');
});

test('during the period (dayContext.inPeriod) any bleeding is bleeding: the spotting band reads as light', () => {
  const inPeriod = (value, flag) => composeCellInput([{ streamIds: ['body-vulva-bleeding'], type: 'ratio/proportion', content: value }], bands, { dayContext: { inPeriod: flag } }).letter;
  assert.equal(inPeriod(0.08, true), 'L');
  assert.equal(inPeriod(0.2, true), 'L');
  assert.equal(inPeriod(0.35, true), 'L');
  assert.equal(inPeriod(0.55, true), 'M');
  assert.equal(inPeriod(0.95, true), 'H');
  assert.equal(inPeriod(0.2, false), 'S', 'outside the period, as after it');
  assert.equal(inPeriod(0, true), undefined, 'no flow, nothing drawn');
});

test('FEMM: very light bleeding (0.2) is a spotting circle, light (0.35) an L', () => {
  const at = (value) => composeCellInput([{ streamIds: ['body-vulva-bleeding'], type: 'ratio/proportion', content: value }], femm);
  assert.equal(at(0.2).fill, '#F4A2BD');
  assert.equal(at(0.2).letter, undefined);
  assert.equal(at(0.35).fill, '#C8155A');
  assert.equal(at(0.35).letter, 'L');
});

test('event on unrelated stream is ignored', () => {
  const events = [
    { streamIds: ['body-weight'], type: 'mass/kg', content: 60 }
  ];
  const out = composeCellInput(events, femm);
  assert.equal(out.empty, true);
});
