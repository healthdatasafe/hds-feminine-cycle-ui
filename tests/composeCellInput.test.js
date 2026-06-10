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
    { streamIds: ['body-vulva-bleeding'], type: 'ratio/proportion', content: 0.15 },
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

test('events with no mucus option in source.sourceData → empty', () => {
  const events = [
    { streamIds: ['body-vulva-mucus-inspect'], type: 'vulva-mucus-inspect/9d-vector', content: { source: { key: 'billings', sourceData: { mucus: 'cloudyWhite' } } } }
  ];
  // billings option keys aren't in FEMM's mappingRules, so this falls through to empty.
  // (Force-conversion across methods is a deferred follow-up.)
  const out = composeCellInput(events, femm);
  assert.equal(out.empty, true);
});

test('event on unrelated stream is ignored', () => {
  const events = [
    { streamIds: ['body-weight'], type: 'mass/kg', content: 60 }
  ];
  const out = composeCellInput(events, femm);
  assert.equal(out.empty, true);
});
