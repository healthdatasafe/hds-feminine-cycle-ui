import type { RepresentationSpec } from '../types.ts';

/**
 * Chart Neo / NeoFertility representation.
 *
 * Rules from model-cervical-fluid `references/rules/method-rules.json`,
 * `methods.chartneo`:
 *   - colours (literature, NeoFertility introduction slides 2026): red sticker
 *     for bleeding (#e8341c), spotting #ef9a9a.
 *   - period days: a red sticker (periodDays "stamp", literature).
 *   - peak: Chart Neo computes it ("can be overridden", hds, Data Mapping
 *     Chartneo - HDS) and counts P, 1, 2, 3 after it: the peak comes from the
 *     recorded `fertility-cycles-peak-day`, written as P and a count of 3
 *     (notation only: what the count means is open, status missing).
 *
 * Left out until confirmed: the reading of the day's fields (walking, wiping,
 * inspect, test) as dry / mucus / peak-type (fieldRule, hds-draft) and with it
 * the dry (#8dc63f) and mucus (#2aa9e0) colours and peak candidates; the data
 * model's chartneo labels do not match Chart Neo's own field list
 * (hdsDisagreements). The mucus is not drawn in the cell yet.
 */
export const chartneoSpec: RepresentationSpec = {
  id: 'chartneo',
  label: { en: 'Chart Neo', fr: 'Chart Neo' },
  description: {
    en: 'Red stickers on bleeding days. Peak day (as recorded) marked P, then 1, 2, 3.',
    fr: 'Pastilles rouges les jours de saignement. Jour pic (enregistré) marqué P, puis 1, 2, 3.'
  },
  version: 'v0',
  primitive: 'stamp-square',
  boundMethod: { itemKey: 'cervical-fluid', methodId: 'chartneo' },
  consumes: [
    { itemKey: 'body-vulva-bleeding', role: 'bleeding' },
    { itemKey: 'body-vagina-bleeding', role: 'bleeding' }
  ],
  palette: {
    bleeding: '#E8341C',
    spotting: '#EF9A9A',
    peak: '#1F3B7A'
  },
  mappingRules: {
    bleeding: {
      heavy: { fill: 'bleeding' },
      medium: { fill: 'bleeding' },
      light: { fill: 'bleeding' },
      spotting: { fill: 'spotting' }
    }
  },
  precedence: ['bleeding'],
  periodDisplay: 'stamp',
  peakMarker: {
    compute: 'none',
    primitive: 'letter',
    color: 'peak',
    letter: 'P',
    countAfter: 3
  }
};
