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
 *
 * Signs beside the fluid (`shows.signs`, literature): the temperature by default, the cervix optional.
 */
export const symptoThermalSpec: RepresentationSpec = {
  id: 'sympto-thermal',
  label: { en: 'Sympto-thermal', fr: 'Symptothermie', es: 'Sintotérmico', it: 'Sintotermico', 'pt-BR': 'Sintotérmico' },
  description: {
    en: 'The fluid written short on a plain square (D, S, C, EW, W). Bleeding on its own row. Peak day marked P, then 1, 2, 3.',
    fr: 'La glaire écrite en abrégé sur un carré neutre (D, S, C, EW, W). Le saignement sur sa propre ligne. Jour pic marqué P, puis 1, 2, 3.',
    es: 'El fluido escrito en abreviatura sobre un cuadrado liso (D, S, C, EW, W). El sangrado en su propia fila. Día pico marcado con P, luego 1, 2, 3.',
    it: 'Il muco scritto in forma abbreviata su un quadrato neutro (D, S, C, EW, W). Il sanguinamento su una riga separata. Giorno del picco indicato con P, poi 1, 2, 3.',
    'pt-BR': 'O muco escrito de forma abreviada em um quadrado neutro (D, S, C, EW, W). Sangramento em linha própria. Dia do ápice marcado com P, depois 1, 2, 3.'
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
  chart: { signs: { temperature: 'default', lh: 'no', monitor: 'no', cervix: 'optional' } },
  peakMarker: {
    compute: 'lastSlipperyDayInCycle',
    primitive: 'letter',
    color: 'peak',
    candidateOptions: ['eggWhite', 'watery'],
    letter: 'P',
    countAfter: 3
  }
};
