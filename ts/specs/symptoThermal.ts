import type { RepresentationSpec } from '../types.ts';

/**
 * Sympto-thermal (Taking Charge of Your Fertility) representation.
 *
 * Rules from model-cervical-fluid `references/rules/method-rules.json`,
 * `methods.sympto-thermal` (source: model-cervical-fluid `references/stm-tcoyf.md`):
 *   - TCOYF records the cervical fluid in rows, not colours (stampNote): the
 *     cell is neutral, the fluid written short (D, S, C, EW, W), as the
 *     methods that chart the period apart write their words (periodDays,
 *     decision: "Creamy C, Egg white EW").
 *   - the period on its own row (periodDays "separate", literature): the spec
 *     does not consume the bleeding items.
 *   - peak: last day of egg-white or watery fluid (hds); count of 3 after it
 *     (fertileAfterOvulation.afterPeak, hds).
 *
 * To confirm: stamp colours (the rules file's Billings / Creighton colours are
 * an HDS decision without a source); the peak letter (`peakMark` has no status).
 *
 * Mucus options match `data-model/.../models/cervical-fluid/sympto-thermal/v0.json`.
 */
export const symptoThermalSpec: RepresentationSpec = {
  id: 'sympto-thermal',
  label: { en: 'Sympto-thermal', fr: 'Symptothermie' },
  description: {
    en: 'The fluid written short on a plain square (D, S, C, EW, W). Bleeding on its own row. Peak day marked P, then 1, 2, 3.',
    fr: 'La glaire écrite en abrégé sur un carré neutre (D, S, C, EW, W). Le saignement sur sa propre ligne. Jour pic marqué P, puis 1, 2, 3.'
  },
  version: 'v0',
  primitive: 'stamp-square',
  boundMethod: { itemKey: 'cervical-fluid', methodId: 'sympto-thermal' },
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
      creamy: { fill: 'neutral', code: 'C' },
      watery: { fill: 'neutral', code: 'W' },
      eggWhite: { fill: 'neutral', code: 'EW' }
    }
  },
  precedence: ['mucus'],
  periodDisplay: 'separate',
  peakMarker: {
    compute: 'lastSlipperyDayInCycle',
    primitive: 'letter',
    color: 'peak',
    candidateOptions: ['eggWhite', 'watery'],
    letter: 'P',
    countAfter: 3
  }
};
