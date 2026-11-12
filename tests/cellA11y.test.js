import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cellA11y, fittedFontSize } from '../js/cellA11y.js';

test('[A11Y-1] a labelled cell is a named image, or a named button when clickable', () => {
  assert.deepEqual(cellA11y(false, 'Peak day', 'P'), { role: 'img', 'aria-label': 'Peak day' });
  assert.deepEqual(cellA11y(true, 'Peak day', 'P'), { role: 'button', 'aria-label': 'Peak day' });
});

test('[A11Y-2] an unlabelled, non-clickable cell is hidden, never an unnamed img', () => {
  assert.deepEqual(cellA11y(false, undefined, '10KL'), { 'aria-hidden': true });
  assert.deepEqual(cellA11y(false, '', undefined), { 'aria-hidden': true });
});

test('[A11Y-3] an unlabelled clickable cell is named by its visible text', () => {
  assert.deepEqual(cellA11y(true, undefined, '10KL'), { role: 'button', 'aria-label': '10KL' });
  assert.deepEqual(cellA11y(true, undefined, undefined), { role: 'button' });
});

test('[A11Y-4] short codes grow to the cap, long ones keep at least the old size', () => {
  assert.equal(fittedFontSize(24, 'H', 0.34, 0.5), 12);
  assert.ok(fittedFontSize(24, '6C', 0.34, 0.5) > 24 * 0.34);
  assert.equal(fittedFontSize(24, '10DKL', 0.34, 0.5), 24 * 0.34);
});

test('[A11Y-5] a grown code still fits the cell width', () => {
  for (const code of ['H', '6C', '10K', '10KL']) {
    const fs = fittedFontSize(26, code, 0.34, 0.5);
    if (fs > 26 * 0.34) assert.ok(code.length * fs * 0.62 <= 26 * 0.86 + 1e-9, code);
  }
});
