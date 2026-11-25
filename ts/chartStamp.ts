/**
 * The stamp a person or her instructor put on a day of her chart (data-model 4.32.0, item `fertility-cycles-chart-stamp`),
 * and the stamps a method offers. Chart notation: a stamp is drawn as charted, nothing is read from it.
 */

import type { CellInput, HdsEventLike, I18nText, Representation, StampSpec } from './types.ts';

/** The item and stream of a charted stamp. */
export const CHART_STAMP_ITEM = 'fertility-cycles-chart-stamp';
/** Its event type: content `{ method, stamp }`. */
export const CHART_STAMP_TYPE = 'fertility/chart-stamp-v1';

export interface ChartedStamp {
  /** the stamp's id, as stored (`yellow-baby`) */
  id: string;
  stamp: StampSpec;
}

/**
 * The stamp charted among a day's events for this representation's method: the one modified last (the last given, on
 * a tie). Undefined for a day without one, and for a stamp of another method or one this method's spec does not list:
 * the cell is then drawn from the observations.
 */
export function chartedStampOf (events: HdsEventLike[], rep: Representation): ChartedStamp | undefined {
  const stamps = rep.spec.stamps;
  if (!stamps) return undefined;
  let found: ChartedStamp | undefined;
  let foundAt = -Infinity;
  for (const ev of events) {
    if (ev.type !== CHART_STAMP_TYPE || ev.content?.method !== rep.spec.boundMethod.methodId) continue;
    const id = ev.content.stamp;
    if (typeof id !== 'string' || !Object.hasOwn(stamps, id)) continue;
    const at = ev.modified ?? -Infinity;
    if (at >= foundAt) { found = { id, stamp: stamps[id] }; foundAt = at; }
  }
  return found;
}

/** The cell with the charted stamp in place of the drawn one: its fill and baby. The code, frequency and letter stay. */
export function withStamp (input: CellInput, charted: ChartedStamp, rep: Representation): CellInput {
  const { empty, baby, halfFill, ...rest } = input;
  return { ...rest, fill: rep.resolveColor(charted.stamp.fill), ...(charted.stamp.baby ? { baby: true } : {}), stamp: charted.id };
}

export interface StampChoice {
  id: string;
  label: I18nText;
  /** the stamp alone, for a picker */
  input: CellInput;
  /** used on the instructor's instruction only: a picker offers it to a person who asked for such stamps */
  onInstruction: boolean;
}

/** The stamps a method's chart uses, in its order, for a picker. Empty when its spec lists none. */
export function stampChoices (rep: Representation): StampChoice[] {
  return Object.entries(rep.spec.stamps ?? {}).map(([id, stamp]) => ({
    id,
    label: stamp.label,
    input: withStamp({}, { id, stamp }, rep),
    onInstruction: stamp.onInstruction === true
  }));
}
