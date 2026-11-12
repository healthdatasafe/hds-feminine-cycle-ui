/**
 * Accessibility and text sizing shared by the cell primitives.
 */

export interface CellA11yProps {
  role?: 'img' | 'button';
  'aria-label'?: string;
  'aria-hidden'?: true;
}

/**
 * A cell is named only when it can be: with `ariaLabel` it is an image (or a
 * button when clickable); a clickable cell without one falls back to its
 * visible text; a non-clickable cell without one is decorative and hidden from
 * assistive technology, never an unnamed `role="img"`.
 */
export function cellA11y (interactive: boolean, ariaLabel: string | undefined, visibleText: string | undefined): CellA11yProps {
  const name = ariaLabel || (interactive ? visibleText : undefined);
  if (name) return { role: interactive ? 'button' : 'img', 'aria-label': name };
  if (interactive) return { role: 'button' };
  return { 'aria-hidden': true };
}

const BOLD_CHAR_WIDTH_EM = 0.62;

/**
 * Font size for a centred code: as large as `maxRatio` of the cell allows,
 * shrunk only as far as needed for `text` to fit `widthRatio` of the cell, and
 * never below `minRatio` (the previous fixed size).
 */
export function fittedFontSize (size: number, text: string, minRatio: number, maxRatio: number, widthRatio = 0.86): number {
  const len = Math.max(1, [...text].length);
  const fit = (size * widthRatio) / (len * BOLD_CHAR_WIDTH_EM);
  return Math.max(size * minRatio, Math.min(size * maxRatio, fit));
}
