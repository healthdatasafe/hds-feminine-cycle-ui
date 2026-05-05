import type { RepresentationSpec } from '../types.ts';

/**
 * Mira (mira-fertility-tracker) representation.
 *
 * Source: https://www.miracare.com/
 *
 * Mira's app shows mucus observations as labelled rows in a calendar; there's
 * no canonical paper-chart equivalent. We use `dot-circle` (FEMM-style) with
 * a colour scale mirroring Mira's labels: dry → moist → fertile → peak.
 *
 * Mucus options match `data-model/.../models/cervical-fluid/mira/v0.json`.
 * We surface only the 6 fertility-tracking labels here; the bridge-mira
 * edge cases ("Clumpy white", "Gray") map to nothing visual today and
 * fall through to an empty cell when present (rare in practice).
 */
export const miraSpec: RepresentationSpec = {
  id: 'mira',
  label: { en: 'Mira', fr: 'Mira' },
  description: {
    en: 'Five-step coloured circles from grey (dry) to dark blue (peak), matching the Mira app\'s mucus labels.',
    fr: 'Cercles colorés en cinq paliers, du gris (sec) au bleu foncé (pic), alignés sur les libellés de l\'app Mira.'
  },
  version: 'v0',
  primitive: 'dot-circle',
  referenceUrl: 'https://www.miracare.com/',
  boundMethod: { itemKey: 'cervical-fluid', methodId: 'mira' },
  consumes: [
    { itemKey: 'body-vulva-bleeding', role: 'bleeding' },
    { itemKey: 'body-vagina-bleeding', role: 'bleeding' },
    { itemKey: 'body-vulva-bleeding-browndark', role: 'bleedingSubstate' },
    { itemKey: 'bleeding-brown-dark', role: 'bleedingSubstate' },
    { itemKey: 'body-vulva-mucus-inspect', role: 'mucus' }
  ],
  palette: {
    dry: '#A8A8A8',
    sticky: '#D9A65B',
    creamy: '#7BB7E0',
    watery: '#3B6FB6',
    eggWhite: '#1F3B7A',
    peak: '#1F3B7A',
    bleedingHeavy: '#C8155A',
    bleedingLight: '#C8155A',
    spotting: '#F4A2BD',
    brown: '#7A4A2B'
  },
  mappingRules: {
    mucus: {
      Dry: { fill: 'dry' },
      Sticky: { fill: 'sticky' },
      Creamy: { fill: 'creamy' },
      Watery: { fill: 'watery' },
      'Raw Egg White': { fill: 'eggWhite' }
    },
    bleeding: {
      heavy: { fill: 'bleedingHeavy', letter: 'M' },
      medium: { fill: 'bleedingHeavy', letter: 'M' },
      light: { fill: 'bleedingLight', letter: 'L' },
      spotting: { fill: 'spotting' }
    },
    bleedingSubstate: {
      brown: { fill: 'brown' }
    }
  },
  precedence: ['mucus', 'bleeding', 'bleedingSubstate'],
  halfSplit: {
    enabled: true,
    pairs: [
      ['mucus', 'bleeding'],
      ['mucus', 'bleedingSubstate']
    ]
  },
  peakMarker: {
    compute: 'lastSlipperyDayInCycle',
    primitive: 'centerDot',
    color: 'peak',
    thresholds: { lubricative: 0.7, stretchability: 0.7 },
    candidateOptions: ['Watery', 'Raw Egg White']
  }
};
