import type { RepresentationSpec } from '../types.ts';

/**
 * FEMM representation — composite mucus + bleeding + brown-spotting.
 * Source: https://femmhealth.org/
 *
 * Mucus options match `data-model/.../models/femm/v0.json` (1..4).
 * Bleeding intensity values follow the canonical body-vagina-bleeding labels
 * (heavy / medium / light / spotting). Substate is brown-dark.
 */
export const femmSpec: RepresentationSpec = {
  id: 'femm',
  label: { en: 'FEMM', fr: 'FEMM' },
  version: 'v0',
  primitive: 'dot-circle',
  referenceUrl: 'https://femmhealth.org/',
  boundMethod: { itemKey: 'cervical-fluid', methodId: 'femm' },
  consumes: [
    // Note: HDS canonical bleeding stream is `body-vulva-bleeding` (vulva-scoped).
    // Older naming `body-vagina-bleeding` is also accepted.
    { itemKey: 'body-vulva-bleeding', role: 'bleeding' },
    { itemKey: 'body-vagina-bleeding', role: 'bleeding' },
    { itemKey: 'bleeding-brown-dark', role: 'bleedingSubstate' },
    { itemKey: 'body-vulva-mucus-inspect', role: 'mucus' }
  ],
  palette: {
    dry: '#A8A8A8',
    pasty: '#F2A03D',
    moist: '#7BB7E0',
    slippery: '#3B6FB6',
    fertile: '#3B6FB6',
    peak: '#1F3B7A',
    bleedingHeavy: '#C8155A',
    bleedingLight: '#C8155A',
    spotting: '#F4A2BD',
    brown: '#7A4A2B'
  },
  mappingRules: {
    mucus: {
      1: { fill: 'dry' },
      2: { fill: 'pasty' },
      3: { fill: 'moist' },
      4: { fill: 'slippery' }
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
    thresholds: { lubricative: 0.7, stretchability: 0.7 }
  }
};
