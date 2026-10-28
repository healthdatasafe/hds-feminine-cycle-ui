import type { HdsEventLike, Representation } from './types.ts';
import type { ComposeOptions } from './composeCellInput.ts';
import { mucusItemKeysOf, mucusOptionOf } from './mucusOption.ts';

const SECONDS_PER_DAY = 86400;

/** The data-model item a recorded (mucus) peak day is written to. */
export const RECORDED_PEAK_ITEM = 'fertility-cycles-peak-day';

export interface PeakNotationOptions {
  /** Same bridge as `composeCellInput`: vectors → option key in the bound method. */
  closestOption?: ComposeOptions['closestOption'];
  /**
   * Day index of an event time (seconds). Defaults to the UTC day
   * (`Math.floor(time / 86400)`), as `detectFertilityWindow`. Pass the
   * patient's calendar day when the host knows her time zone.
   */
  dayOf?: (time: number) => number;
  /**
   * Last day the count may be written on. Defaults to the last day of the
   * events given, so the count is never written ahead of the data.
   */
  untilDay?: number;
}

export interface PeakNotation {
  /** The peak day (day index), or null when none is known. */
  peakDay: number | null;
  /** 'recorded': from `fertility-cycles-peak-day`; 'observed': from the mucus. */
  basis: 'recorded' | 'observed' | null;
  /** The letter the method writes on the peak day ('P', 'X'), or null if it marks it otherwise. */
  mark: string | null;
  /** The days counted after the peak: 1, 2, 3 … */
  count: Array<{ day: number; n: number }>;
}

const NONE: PeakNotation = { peakDay: null, basis: null, mark: null, count: [] };

/**
 * The method's own peak notation over one cycle's events: the peak day and the
 * 1, 2, 3 count written after it. **Notation only**: it says nothing about
 * fertile or infertile days.
 *
 * Rule (model-cervical-fluid `references/rules/method-rules.json`, `peakDay`,
 * status hds): the peak day is the last day of peak-type mucus, known the next
 * day when the mucus changes; a peak day recorded in the account
 * (`fertility-cycles-peak-day`) is used first.
 *   - peak-type = the spec's `peakMarker.candidateOptions`;
 *   - "known when the mucus changes" = the next day with a mucus observation
 *     is not peak-type; with several patches, the latest such day wins
 *     (Creighton: "only the last peak opens the count");
 *   - the count runs `peakMarker.countAfter` days and stops at a return of
 *     peak-type mucus (the count restarts from the new peak once it is known).
 *
 * Pass the events of a single cycle. A spec without `peakMarker` (Apple
 * Health: no peak rule) returns no notation.
 */
export function peakNotation (
  events: HdsEventLike[],
  rep: Representation,
  opts?: PeakNotationOptions
): PeakNotation {
  const pm = rep.spec.peakMarker;
  if (!pm) return NONE;
  const dayOf = opts?.dayOf ?? ((t: number) => Math.floor(t / SECONDS_PER_DAY));
  const mark = pm.letter ?? (pm.primitive === 'centerDot' ? null : 'X');

  const candidateSet = new Set((pm.candidateOptions ?? []).map(String));
  const mucusItemKeys = mucusItemKeysOf(rep);

  let lastDay: number | null = null;
  let recorded: number | null = null;
  // Day → true when a mucus observation that day is peak-type.
  const observed = new Map<number, boolean>();
  for (const ev of events) {
    if (typeof ev.time !== 'number') continue;
    const day = dayOf(ev.time);
    if (lastDay == null || day > lastDay) lastDay = day;
    if (ev.streamIds?.includes(RECORDED_PEAK_ITEM)) {
      if (recorded == null || day > recorded) recorded = day;
      continue;
    }
    if (!ev.streamIds?.some(s => mucusItemKeys.has(s))) continue;
    const option = mucusOptionOf(ev, rep, opts);
    if (option == null) continue;
    observed.set(day, (observed.get(day) ?? false) || candidateSet.has(option));
  }

  let peakDay: number | null = null;
  let basis: PeakNotation['basis'] = null;
  if (recorded != null) {
    peakDay = recorded;
    basis = 'recorded';
  } else if (pm.compute !== 'none' && candidateSet.size > 0) {
    const days = Array.from(observed.keys()).sort((a, b) => a - b);
    for (let i = days.length - 2; i >= 0; i--) {
      if (observed.get(days[i]) && !observed.get(days[i + 1])) {
        peakDay = days[i];
        basis = 'observed';
        break;
      }
    }
  }
  if (peakDay == null) return NONE;

  const until = opts?.untilDay ?? lastDay ?? peakDay;
  const count: PeakNotation['count'] = [];
  for (let n = 1; n <= (pm.countAfter ?? 0); n++) {
    const day = peakDay + n;
    if (day > until) break;
    if (observed.get(day)) break;
    count.push({ day, n });
  }
  return { peakDay, basis, mark, count };
}
