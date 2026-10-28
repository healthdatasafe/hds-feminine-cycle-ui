import type { RepresentationSpec } from '../types.ts';

/**
 * Sensiplan representation: the method's own letters, black on white.
 *
 * Rules from model-cervical-fluid `references/rules/method-rules.json`,
 * `methods.sensiplan` (source: model-cervical-fluid `references/sensiplan.md`):
 *   - observations t, ø, f, S, S+ written as their letter (status hds);
 *     "Sensiplan writes letters, black and white" (stampNote): no colour.
 *   - the bleeding on its own line (periodDays "separate", literature): the
 *     spec does not consume the bleeding items.
 *   - peak: last day of the best mucus quality (status hds); S+ is the only
 *     peak-type option (categories). Count of 3 after the peak (hds).
 *
 * To confirm: a cycle whose best quality is S (no S+) has its peak on S per
 * references/sensiplan.md, but the rules file counts S as non-peak; the peak
 * letter (method-rules.json `peakMark` has no status of its own).
 *
 * Mucus options match `data-model/.../models/cervical-fluid/sensiplan/v0.json`.
 */
export const sensiplanSpec: RepresentationSpec = {
  id: 'sensiplan',
  label: { en: 'Sensiplan', fr: 'Sensiplan' },
  description: {
    en: 'The method\'s letters (t, ø, f, S, S+) in black on white. Bleeding on its own line. Peak day marked P, then 1, 2, 3.',
    fr: 'Les lettres de la méthode (t, ø, f, S, S+) en noir sur blanc. Le saignement sur sa propre ligne. Jour pic marqué P, puis 1, 2, 3.'
  },
  version: 'v0',
  primitive: 'stamp-square',
  boundMethod: { itemKey: 'cervical-fluid', methodId: 'sensiplan' },
  consumes: [
    { itemKey: 'body-vulva-mucus-inspect', role: 'mucus' }
  ],
  palette: {
    neutral: '#FFFFFF',
    peak: '#1F3B7A'
  },
  mappingRules: {
    mucus: {
      t: { fill: 'neutral', code: 't' },
      ø: { fill: 'neutral', code: 'ø' },
      f: { fill: 'neutral', code: 'f' },
      S: { fill: 'neutral', code: 'S' },
      'S+': { fill: 'neutral', code: 'S+' }
    }
  },
  precedence: ['mucus'],
  periodDisplay: 'separate',
  peakMarker: {
    compute: 'lastSlipperyDayInCycle',
    primitive: 'letter',
    color: 'peak',
    candidateOptions: ['S+'],
    letter: 'P',
    countAfter: 3
  }
};
