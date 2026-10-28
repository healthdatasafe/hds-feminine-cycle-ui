import type { RepresentationSpec } from '../types.ts';

/**
 * Apple Health representation (a HealthKit scale, not a method).
 *
 * Rules from model-cervical-fluid `references/rules/method-rules.json`,
 * `methods.appleHealth` (source: model-cervical-fluid `references/apple-health.md`):
 *   - the menstrual flow and the cervical mucus quality are separate data
 *     (periodDays "separate", literature): the spec consumes the mucus only.
 *   - each value as logged, written short (D, S, C, W, EW), as the apps that
 *     chart the period apart write their words (periodDays, decision:
 *     "display creamy the way Apple would do").
 *   - no peak: "None (a scale, no rule)" (hds), so no peak marker and no count.
 *
 * Left out: categories and colours (status decision, no source).
 *
 * Mucus options match `data-model/.../models/cervical-fluid/appleHealth/v0.json`.
 */
export const appleHealthSpec: RepresentationSpec = {
  id: 'appleHealth',
  label: { en: 'Apple Health', fr: 'Apple Health' },
  description: {
    en: 'Each cervical mucus value as logged, written short on a plain square (D, S, C, W, EW). No peak: Apple Health is a scale, not a method.',
    fr: 'Chaque valeur de glaire telle qu\'enregistrée, en abrégé sur un carré neutre (D, S, C, W, EW). Pas de jour pic : Apple Health est une échelle, pas une méthode.'
  },
  version: 'v0',
  primitive: 'stamp-square',
  boundMethod: { itemKey: 'cervical-fluid', methodId: 'appleHealth' },
  consumes: [
    { itemKey: 'body-vulva-mucus-inspect', role: 'mucus' }
  ],
  palette: {
    neutral: '#FFFFFF'
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
  periodDisplay: 'separate'
};
