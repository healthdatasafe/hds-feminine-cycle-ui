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

const mucus = (femmValue: 1 | 2 | 3 | 4): HdsEventLike => ({
  streamIds: ['body-vulva-mucus-inspect'],
  type: 'vulva-mucus-inspect/9d-vector',
  content: { source: { key: 'femm', sourceData: { mucus: femmValue } } }
});

const bleeding = (intensity: 'heavy' | 'medium' | 'light' | 'spotting'): HdsEventLike => ({
  streamIds: ['body-vagina-bleeding'],
  type: 'bleeding/intensity',
  content: intensity
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
