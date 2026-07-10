import type { RepresentationSpec } from '../types.ts';

/**
 * Billings-style representation.
 *
 * HDS is not affiliated with, endorsed by, or licensed by the organizations
 * teaching this method; the spec renders users' own observations in the
 * charting style described in the published literature.
 *
 * Visual primitives: square colored stamps; X overlay marks the Peak day.
 * Bleeding always wins over mucus (red overrides). The "baby" icon variants
 * (post-Peak counting days) are deferred — would need an icon asset and the
 * counting-day computation isn't shipped yet.
 *
 * Mucus options match `data-model/.../models/cervical-fluid/billings/v0.json`.
 */
export const billingsSpec: RepresentationSpec = {
  id: 'billings',
  label: { en: 'Billings', fr: 'Billings' },
  description: {
    en: 'Square stamps — red, green, white, yellow. Peak day marked with X.',
    fr: 'Tampons carrés en rouge, vert, blanc, jaune. Jour pic marqué d\'un X.'
  },
  version: 'v0',
  primitive: 'stamp-square',
  boundMethod: { itemKey: 'cervical-fluid', methodId: 'billings' },
  consumes: [
    { itemKey: 'body-vulva-bleeding', role: 'bleeding' },
    { itemKey: 'body-vagina-bleeding', role: 'bleeding' },
    { itemKey: 'body-vulva-bleeding-browndark', role: 'bleeding' },
    { itemKey: 'bleeding-brown-dark', role: 'bleeding' },
    { itemKey: 'body-vulva-mucus-inspect', role: 'mucus' }
  ],
  palette: {
    bleedingRed: '#C8155A',
    dryGreen: '#7FB069',
    discharge: '#FFFFFF',
    dischargeBip: '#F4C752',
    peak: '#1F3B7A'
  },
  mappingRules: {
    mucus: {
      dry: { fill: 'dryGreen' },
      unchanged: { fill: 'dischargeBip' },
      sticky: { fill: 'discharge' },
      cloudyWhite: { fill: 'discharge' },
      wetSlippery: { fill: 'discharge' },
      peak: { fill: 'discharge', letter: 'X' }
    },
    bleeding: {
      heavy: { fill: 'bleedingRed' },
      medium: { fill: 'bleedingRed' },
      light: { fill: 'bleedingRed' },
      spotting: { fill: 'bleedingRed' },
      brown: { fill: 'bleedingRed' }
    }
  },
  // Bleeding wins everything: red square overrides mucus on the same day.
  precedence: ['mucus', 'bleeding'],
  peakMarker: {
    compute: 'lastSlipperyDayInCycle',
    primitive: 'letter',
    color: 'peak',
    thresholds: { lubricative: 0.7, stretchability: 0.7 },
    candidateOptions: ['wetSlippery', 'peak']
  }
};
