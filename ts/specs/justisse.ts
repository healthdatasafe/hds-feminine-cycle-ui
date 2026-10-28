import type { RepresentationSpec } from '../types.ts';

/**
 * Justisse representation: neutral notation only.
 *
 * Rules from model-cervical-fluid `references/rules/method-rules.json`,
 * `methods.justisse` (source: model-cervical-fluid `references/justisse.md`):
 *   - Justisse's stamp key is in its paid user guide (stampNote): colours,
 *     bleeding colours and the period-days rule are open (status missing). The
 *     cell is neutral, the method's words written short (D, S, T, C, EW, W);
 *     the bleeding items are not consumed (the host shows them in their row).
 *   - peak: last day of peak-type mucus (hds); egg white and watery are
 *     peak-type (hds). Count of 3 after the peak (hds).
 *
 * To confirm (experts' worksheet, `methods.justisse.*`): dry, sticky, tacky,
 * creamy categories (observations[0..3]); colours; periodDays; the codes of
 * Justisse's own chart (O, ¼", F, G are Read Your Body's template, status app);
 * the peak letter.
 *
 * Mucus options match `data-model/.../models/cervical-fluid/justisse/v0.json`.
 */
export const justisseSpec: RepresentationSpec = {
  id: 'justisse',
  label: { en: 'Justisse', fr: 'Justisse' },
  description: {
    en: 'The fluid written short on a plain square (D, S, T, C, EW, W). Peak day marked P, then 1, 2, 3.',
    fr: 'La glaire écrite en abrégé sur un carré neutre (D, S, T, C, EW, W). Jour pic marqué P, puis 1, 2, 3.'
  },
  version: 'v0',
  primitive: 'stamp-square',
  boundMethod: { itemKey: 'cervical-fluid', methodId: 'justisse' },
  consumes: [
    { itemKey: 'body-vulva-mucus-inspect', role: 'mucus' }
  ],
  palette: {
    neutral: '#FFFFFF',
    peak: '#1F3B7A'
  },
  mappingRules: {
    mucus: {
      dry: { fill: 'neutral', code: 'D' },
      sticky: { fill: 'neutral', code: 'S' },
      tacky: { fill: 'neutral', code: 'T' },
      creamy: { fill: 'neutral', code: 'C' },
      eggWhite: { fill: 'neutral', code: 'EW' },
      watery: { fill: 'neutral', code: 'W' }
    }
  },
  precedence: ['mucus'],
  peakMarker: {
    compute: 'lastSlipperyDayInCycle',
    primitive: 'letter',
    color: 'peak',
    candidateOptions: ['eggWhite', 'watery'],
    letter: 'P',
    countAfter: 3
  }
};
