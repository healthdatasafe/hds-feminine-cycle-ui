import type { HdsEventLike } from './types.ts';

/**
 * Synthetic 7-day fixture used by Settings previews and tests.
 * Events are the minimum shape composeCellInput reads — no times,
 * no clientData, no auth-bearing fields.
 *
 * Days (ordered):
 *   1 — bleeding heavy
 *   2 — bleeding light
 *   3 — dry
 *   4 — sticky / pasty (FEMM 2)
 *   5 — moist (FEMM 3)
 *   6 — slippery / peak (FEMM 4)
 *   7 — dry (post-peak)
 */
export interface PreviewDay {
  dayLabel: string;
  events: HdsEventLike[];
}

// Vectors copied from `data-model/.../models/cervical-fluid/femm/v0.json`.
// Bundled here so previews can be force-converted to any other method
// (Billings, Creighton, …) via a host-supplied `closestOption` callback.
const FEMM_VECTORS: Record<1 | 2 | 3 | 4, Record<string, number>> = {
  1: {},
  2: { threadiness: 0.35, stretchability: 0.2, lubricative: 0.15, transparency: 0.15, wetness: 0.25, densityFluidity: 0.15, sensation: 0.2, mucusVolume: 0.3 },
  3: { threadiness: 0.55, stretchability: 0.45, lubricative: 0.45, transparency: 0.4, wetness: 0.55, densityFluidity: 0.4, sensation: 0.5, mucusVolume: 0.5 },
  4: { threadiness: 0.9, stretchability: 0.85, lubricative: 0.85, transparency: 0.8, wetness: 0.85, densityFluidity: 0.7, color: 0.45, sensation: 0.85, mucusVolume: 0.7 }
};

const mucus = (femmValue: 1 | 2 | 3 | 4): HdsEventLike => ({
  streamIds: ['body-vulva-mucus-inspect'],
  type: 'vulva-mucus-inspect/9d-vector',
  content: {
    source: { key: 'femm', sourceData: { mucus: femmValue } },
    vectors: FEMM_VECTORS[femmValue]
  }
});

// Bleeding events carry a numeric ratio (matching the canonical HDS bleeding
// stream `body-vulva-bleeding`, type `ratio/proportion`); composeCellInput
// buckets them into spotting/medium/heavy.
const BLEEDING_NUM: Record<'heavy' | 'medium' | 'light' | 'spotting', number> = {
  heavy: 0.75,
  medium: 0.55,
  light: 0.25,
  spotting: 0.08
};

const bleeding = (intensity: 'heavy' | 'medium' | 'light' | 'spotting'): HdsEventLike => ({
  streamIds: ['body-vulva-bleeding'],
  type: 'ratio/proportion',
  content: BLEEDING_NUM[intensity]
});

export const samplePreviewEvents: PreviewDay[] = [
  { dayLabel: '1', events: [bleeding('heavy')] },
  { dayLabel: '2', events: [bleeding('light')] },
  { dayLabel: '3', events: [mucus(1)] },
  { dayLabel: '4', events: [mucus(2)] },
  { dayLabel: '5', events: [mucus(3)] },
  { dayLabel: '6', events: [mucus(4)] },
  { dayLabel: '7', events: [mucus(1)] }
];
