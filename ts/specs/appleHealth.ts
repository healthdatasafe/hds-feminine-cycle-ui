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
  label: { en: 'Apple Health', fr: 'Apple Health', es: 'Apple Health', it: 'Apple Health', 'pt-BR': 'Apple Health' },
  description: {
    en: 'Each cervical mucus value as logged, written short on a plain square (D, S, C, W, EW). No peak: Apple Health is a scale, not a method.',
    fr: 'Chaque valeur de glaire telle qu\'enregistrée, en abrégé sur un carré neutre (D, S, C, W, EW). Pas de jour pic : Apple Health est une échelle, pas une méthode.',
    es: 'Cada valor de moco cervical tal como se registró, escrito en abreviatura sobre un cuadrado liso (D, S, C, W, EW). Sin día pico: Apple Health es una escala, no un método.',
    it: 'Ogni valore del muco cervicale come registrato, in forma abbreviata su un quadrato neutro (D, S, C, W, EW). Nessun picco: Apple Health è una scala, non un metodo.',
    'pt-BR': 'Cada valor de muco cervical como registrado, escrito de forma abreviada em um quadrado neutro (D, S, C, W, EW). Sem ápice: o Apple Health é uma escala, não um método.'
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
