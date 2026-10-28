import type { RepresentationSpec } from '../types.ts';

/**
 * Marquette representation: the mucus as its 1 to 8 number, neutral.
 *
 * Rules from model-cervical-fluid `references/rules/method-rules.json`,
 * `methods.marquette` (source: model-cervical-fluid `references/marquette.md`):
 *   - the bleeding, the monitor readings and the mucus numbers charted apart
 *     (periodDays "separate", literature): the spec consumes the mucus only.
 *   - peak, mucus only: the peak day of the mucus (hds); 8 is the only
 *     peak-type number with status hds. Count of 3 after the peak (hds).
 *
 * Left out until confirmed (experts' worksheet): the Low / High / Peak levels
 * and their colours (levels, status app: Marquette NFP Pro screenshots), and
 * the 1 to 8 ↔ Low / High / Peak mapping (levels.mucusScaleNote); mucus 2
 * (observations[1], missing), 6 (observations[5], missing) and 7
 * (observations[6], hds-draft) as peak-type or not; colours (decision, no
 * source); the monitor's Peak as the peak day (hosts read the monitor item
 * themselves); the peak letter.
 *
 * Mucus options match `data-model/.../models/cervical-fluid/marquette/v0.json`.
 */
export const marquetteSpec: RepresentationSpec = {
  id: 'marquette',
  label: { en: 'Marquette', fr: 'Marquette' },
  description: {
    en: 'The mucus as its number (1 to 8) on a plain square. Bleeding and monitor on their own rows. Peak day marked P, then 1, 2, 3.',
    fr: 'La glaire par son numéro (1 à 8) sur un carré neutre. Saignement et moniteur sur leurs propres lignes. Jour pic marqué P, puis 1, 2, 3.'
  },
  version: 'v0',
  primitive: 'stamp-square',
  boundMethod: { itemKey: 'cervical-fluid', methodId: 'marquette' },
  consumes: [
    { itemKey: 'body-vulva-mucus-inspect', role: 'mucus' }
  ],
  palette: {
    neutral: '#FFFFFF',
    peak: '#1F3B7A'
  },
  mappingRules: {
    mucus: {
      1: { fill: 'neutral', code: '1' },
      2: { fill: 'neutral', code: '2' },
      3: { fill: 'neutral', code: '3' },
      4: { fill: 'neutral', code: '4' },
      5: { fill: 'neutral', code: '5' },
      6: { fill: 'neutral', code: '6' },
      7: { fill: 'neutral', code: '7' },
      8: { fill: 'neutral', code: '8' }
    }
  },
  precedence: ['mucus'],
  periodDisplay: 'separate',
  peakMarker: {
    compute: 'lastSlipperyDayInCycle',
    primitive: 'letter',
    color: 'peak',
    candidateOptions: ['8'],
    letter: 'P',
    countAfter: 3
  }
};
