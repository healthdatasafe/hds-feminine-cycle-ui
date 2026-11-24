/**
 * Colours and text layout of a stamp-square cell (and the letter colour of a dot-circle one), shared by `RepresentationCell` and
 * `scripts/render-method-images.mjs` so the app and the docs images draw the same stamp.
 */

import { fittedFontSize } from './cellA11y.ts';
import type { CellInput } from './types.ts';

const DARK_TEXT = '#1f2937';
const WHITE_TEXT = '#fff';

/** WCAG relative luminance of a `#rgb` / `#rrggbb` colour; undefined for anything else (a name, `transparent`). */
export function luminanceOf (color: string): number | undefined {
  let hex = color.replace('#', '');
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = [...hex].map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return undefined;
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: number, b: number): number => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const DARK_L = luminanceOf(DARK_TEXT)!;

export interface StampColours {
  /** Text and badge outline: whichever of dark or white contrasts more with the fill. */
  overlay: string;
  stroke: string;
  strokeWidth: number;
}

/**
 * The text colour for these fills: dark or white, whichever keeps the higher contrast on all of them (a letter over
 * a half-filled circle sits on two colours). White when no fill is a `#rgb` / `#rrggbb` colour.
 */
export function textOn (...fills: Array<string | undefined>): string {
  const ls = fills.map(f => f == null ? undefined : luminanceOf(f)).filter((l): l is number => l != null);
  if (ls.length === 0) return WHITE_TEXT;
  const worst = (textL: number): number => Math.min(...ls.map(l => contrast(l, textL)));
  return worst(DARK_L) > worst(1) ? DARK_TEXT : WHITE_TEXT;
}

/**
 * The stamp's text colour is the one of dark and white with the higher contrast on its fill (Creighton's red
 * `#D32F2F` takes white, its green `#7FB069` dark). A very light fill (white, pale yellow) also gets a grey border,
 * so it does not vanish on a light page.
 */
export function stampColours (fill: string | undefined, empty: boolean): StampColours {
  if (empty || !fill) return { overlay: WHITE_TEXT, stroke: '#888', strokeWidth: 2 };
  const l = luminanceOf(fill);
  if (l == null) return { overlay: WHITE_TEXT, stroke: 'none', strokeWidth: 0 };
  const overlay = textOn(fill);
  const veryLight = l > 0.5;
  return { overlay, stroke: veryLight ? '#888' : 'none', strokeWidth: veryLight ? 1 : 0 };
}

/** Smallest code size, as a ratio of the cell: low enough for Creighton's 6-character codes to fit the stamp. */
const CODE_MIN = 0.2;

export interface StampTextLine { y: number; fontSize: number }

/**
 * Where the code and the frequency go: the code centred, shrunk to fit the stamp's width; with a frequency
 * (Creighton X1, X2, X3, AD), the code is smaller and the frequency is written in the band under it, as on the
 * method's chart.
 */
export function stampTextLayout (size: number, input: Pick<CellInput, 'code' | 'letter' | 'frequency'>): { code?: StampTextLine; frequency?: StampTextLine } {
  if (!input.code) return {};
  const widthRatio = input.letter ? 0.7 : 0.86;
  if (!input.frequency) {
    return { code: { y: size / 2, fontSize: fittedFontSize(size, input.code, CODE_MIN, 0.5, widthRatio) } };
  }
  // the code stays centred, clear of the baby badge (top left, down to 0.32 of the cell); the frequency in the band under it
  return {
    code: { y: size / 2, fontSize: fittedFontSize(size, input.code, CODE_MIN, 0.36, widthRatio) },
    frequency: { y: size * 0.82, fontSize: fittedFontSize(size, input.frequency, CODE_MIN, 0.22, 0.6) }
  };
}

export interface StampBadge { cx: number; cy: number; r: number; fontSize: number; fill: string; ink: string; strokeWidth: number }

/**
 * The badge of a stamp that shows a code and a letter (the peak's P, the count after it): a white disc in the top right
 * corner, whole inside the cell (an svg clips what leaves its box), its letter and outline by contrast with the disc,
 * not with the stamp (white for a red stamp, so unreadable on the disc).
 */
export function stampBadge (size: number): StampBadge {
  const r = size * 0.18;
  const strokeWidth = 0.5;
  const edge = r + strokeWidth / 2;
  return { cx: size - edge, cy: edge, r, fontSize: size * 0.28, fill: WHITE_TEXT, ink: textOn(WHITE_TEXT), strokeWidth };
}
