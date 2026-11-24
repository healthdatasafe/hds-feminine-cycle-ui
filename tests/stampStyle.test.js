import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stampColours, stampTextLayout, luminanceOf, textOn, registry } from '../js/index.js';
import { stampBadge } from '../js/stampStyle.js';

const DARK = '#1f2937';
const WHITE = '#fff';
const BOLD_CHAR_WIDTH_EM = 0.7;

test('stamp text: red stamps take white text (B-2026-11-23-3)', () => {
  for (const red of ['#C8155A', '#D32F2F', '#E8341C']) {
    assert.equal(stampColours(red, false).overlay, WHITE, red);
    assert.equal(stampColours(red, false).stroke, 'none', red);
  }
});

test('stamp text: the colour of dark and white that contrasts more with the fill', () => {
  for (const light of ['#FFFFFF', '#F4C752', '#EF9A9A', '#D9A65B', '#7FB069']) assert.equal(stampColours(light, false).overlay, DARK, light);
  for (const dark of ['#1F3B7A', '#3B6FB6', '#7A4A2B']) assert.equal(stampColours(dark, false).overlay, WHITE, dark);
});

test('stamp border: only very light fills, and empty cells', () => {
  assert.deepEqual(stampColours('#FFFFFF', false), { overlay: DARK, stroke: '#888', strokeWidth: 1 });
  assert.equal(stampColours('#7FB069', false).stroke, 'none');
  assert.deepEqual(stampColours(undefined, true), { overlay: WHITE, stroke: '#888', strokeWidth: 2 });
});

test('textOn: a dot-circle letter by contrast, over one fill or both halves', () => {
  assert.equal(textOn('#C8155A'), WHITE);
  assert.equal(textOn('#F4C752'), DARK);
  assert.equal(textOn('#FFFFFF', '#F4C752'), DARK);
  assert.equal(textOn('#1F3B7A', '#C8155A'), WHITE);
  assert.equal(textOn(undefined), WHITE);
  assert.equal(textOn('transparent'), WHITE);
});

test('dot-circle specs: FEMM and Mira bleeding letters stay white on their red', () => {
  for (const id of ['femm', 'mira']) {
    const rep = registry.get(id);
    assert.equal(textOn(rep.resolveColor('bleedingHeavy')), WHITE, id);
    assert.equal(textOn(rep.resolveColor('bleedingLight')), WHITE, id);
  }
});

test('luminanceOf: hex only', () => {
  assert.equal(luminanceOf('#fff'), 1);
  assert.equal(luminanceOf('#000000'), 0);
  assert.equal(luminanceOf('transparent'), undefined);
});

const fits = (size, text, line, widthRatio = 1) => [...text].length * line.fontSize * BOLD_CHAR_WIDTH_EM <= (size - 2) * widthRatio + 1e-9;

test('stamp text: the longest Creighton codes fit the stamp at every host size (B-2026-11-23-3)', () => {
  const rep = registry.get('creighton');
  const codes = JSON.parse(readFileSync(new URL('./fixtures/creighton-codes.json', import.meta.url))).codes.map(c => c.value).filter(c => c.length >= 5);
  assert.ok(codes.length > 0);
  assert.equal(Math.max(...codes.map(c => c.length)), rep.spec.maxCodeLength);
  for (const size of [22, 24, 26, 28, 36]) {
    for (const code of codes) {
      assert.ok(fits(size, code, stampTextLayout(size, { code }).code), `${code} at ${size}`);
      assert.ok(fits(size, code, stampTextLayout(size, { code, frequency: 'AD' }).code), `${code} AD at ${size}`);
    }
  }
});

test('stamp text: short codes keep their size', () => {
  assert.equal(stampTextLayout(24, { code: '6' }).code.fontSize, 12);
  assert.equal(stampTextLayout(24, { code: '10KL' }).code.y, 12);
  assert.deepEqual(stampTextLayout(24, { letter: 'P' }), {});
});

test('stamp text: with a frequency, the code stays centred and the frequency is written under it (B-2026-11-23-9)', () => {
  const t = stampTextLayout(28, { code: '10KL', frequency: 'X3' });
  assert.equal(t.code.y, 14);
  assert.ok(t.frequency.y > 14);
  assert.ok(t.frequency.y + t.frequency.fontSize / 2 <= 27);
  assert.ok(t.code.y + t.code.fontSize / 2 <= t.frequency.y - t.frequency.fontSize / 2 + 1e-9);
  assert.ok(fits(28, 'X3', t.frequency));
  assert.equal(stampTextLayout(28, { frequency: 'X3' }).frequency, undefined);
});

test('stamp badge (peak letter, count): whole inside the cell at every size', () => {
  for (const size of [14, 16, 22, 24, 26, 28, 40]) {
    const b = stampBadge(size);
    const reach = b.r + b.strokeWidth / 2;
    assert.ok(b.cx + reach <= size + 1e-9 && b.cy - reach >= -1e-9, `${size}: right and top`);
    assert.ok(b.cx - reach >= size / 2, `${size}: in the right half, clear of the baby (top left)`);
    assert.ok(b.cy + reach < size / 2, `${size}: above the code's line`);
  }
});

test('stamp badge: its letter and outline read on the disc, whatever the stamp', () => {
  const { ink, fill } = stampBadge(24);
  assert.equal(fill, WHITE);
  assert.equal(ink, DARK);
  assert.notEqual(ink, fill);
  // the overlay of a red stamp is white: it must not be the badge's ink
  assert.notEqual(ink, stampColours('#D32F2F', false).overlay);
});
