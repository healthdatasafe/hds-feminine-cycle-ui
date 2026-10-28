import type { HdsEventLike, Representation } from './types.ts';
import type { ComposeOptions } from './composeCellInput.ts';
import { mucusItemKeysOf, mucusOptionOf } from './mucusOption.ts';

const SECONDS_PER_DAY = 86400;
const FERTILE_LOOKAHEAD_DAYS = 4;

/**
 * Detect peak and fertile days from a flat list of HDS events.
 *
 * **Not for patient-facing verdicts.** This is a display heuristic (a 4-day
 * look-ahead over the spec's `candidateOptions`), not any method's rule: HDS
 * apps do not decide, show, count or project fertile or infertile days
 * (model-cervical-fluid `references/rules/method-rules.json`, `hdsPosition`).
 * To chart a method's peak and the count after it, use `peakNotation`.
 *
 * Resolution per event (mucus role only):
 *   1. If event.content.source.key matches the rep's bound method →
 *      use source.sourceData.mucus directly.
 *   2. Else if vectors are present and `opts.closestOption` is provided →
 *      force-convert to the bound method's closest option key.
 *   3. Else skip.
 *
 * A day's mucus option is checked against `rep.spec.peakMarker.candidateOptions`.
 * A candidate day is the **peak** if no other candidate day exists within the
 * next FERTILE_LOOKAHEAD_DAYS days. Other candidate days are **fertile**.
 *
 * Returns sets keyed by UTC day-index (`Math.floor(time / 86400)`).
 */
export interface FertilityWindow {
  peakDays: Set<number>;
  fertileDays: Set<number>;
}

export function detectFertilityWindow (
  events: HdsEventLike[],
  rep: Representation,
  opts?: ComposeOptions
): FertilityWindow {
  const peakDays = new Set<number>();
  const fertileDays = new Set<number>();

  const candidates = rep.spec.peakMarker?.candidateOptions;
  if (!candidates || candidates.length === 0) return { peakDays, fertileDays };
  const candidateSet = new Set(candidates.map(String));

  const mucusItemKeys = mucusItemKeysOf(rep);
  if (mucusItemKeys.size === 0) return { peakDays, fertileDays };

  // Day → true if any mucus event on that day resolves to a candidate option.
  const dayHit = new Set<number>();
  for (const ev of events) {
    if (typeof ev.time !== 'number') continue;
    const isMucus = ev.streamIds?.some(s => mucusItemKeys.has(s));
    if (!isMucus) continue;
    const optionKey = mucusOptionOf(ev, rep, opts);
    if (optionKey && candidateSet.has(optionKey)) {
      dayHit.add(Math.floor(ev.time / SECONDS_PER_DAY));
    }
  }
  if (dayHit.size === 0) return { peakDays, fertileDays };

  const sorted = Array.from(dayHit).sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    const day = sorted[i];
    const next = sorted[i + 1];
    const hasFollowupCandidate = next != null && next - day <= FERTILE_LOOKAHEAD_DAYS;
    if (hasFollowupCandidate) fertileDays.add(day);
    else peakDays.add(day);
  }

  return { peakDays, fertileDays };
}
