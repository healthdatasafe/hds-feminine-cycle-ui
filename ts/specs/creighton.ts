import type { RepresentationSpec, MappingRuleFragment } from '../types.ts';

/**
 * Creighton Model FertilityCare (CrMS).
 *
 * Source: https://creightonmodel.com/
 *
 * Visual: square colored stamps + textual code overlay (e.g. "8CK", "10WL").
 * Same primitive as Billings; Creighton always renders the textual code so the
 * exact mucus characteristics are visible (the stamp color alone doesn't
 * disambiguate Creighton's 33-code grammar).
 *
 * Stamp color rule (derived once from the option key, see `stampFillFor`):
 *   - "0"                                    → green (dry)
 *   - any code with `B` or `R` modifier      → red   (brown / red bleeding)
 *   - any code starting with `10`            → white (fertile-class)
 *   - any code containing `L` modifier       → white (lubricative)
 *   - everything else                        → yellow (BIP, non-fertile)
 *
 * Mucus options match `data-model/.../models/cervical-fluid/creighton/v0.json`.
 */

const CREIGHTON_OPTIONS = [
  '0',
  '2', '2W',
  '4',
  '6', '6B', '6C', '6CK', '6G', '6GL', '6K', '6L', '6P', '6R', '6Y',
  '8', '8C', '8CK', '8K', '8L', '8P', '8Y', '8YL',
  '10', '10B', '10C', '10CK', '10K', '10KL', '10L', '10P', '10R', '10Y',
  '10DL', '10SL', '10WL'
] as const;

function stampFillFor (code: string): 'dryGreen' | 'bleedingRed' | 'discharge' | 'dischargeBip' {
  if (code === '0') return 'dryGreen';
  if (/[BR]/.test(code)) return 'bleedingRed';
  if (code.startsWith('10')) return 'discharge';
  if (code.includes('L')) return 'discharge';
  return 'dischargeBip';
}

function buildMucusRules (): Record<string, MappingRuleFragment> {
  const out: Record<string, MappingRuleFragment> = {};
  for (const code of CREIGHTON_OPTIONS) {
    out[code] = { fill: stampFillFor(code), code };
  }
  return out;
}

const mucusRules = buildMucusRules();
const fertileOptions = CREIGHTON_OPTIONS.filter(c => stampFillFor(c) === 'discharge');

export const creightonSpec: RepresentationSpec = {
  id: 'creighton',
  label: { en: 'Creighton Model', fr: 'Modèle Creighton' },
  version: 'v0',
  primitive: 'stamp-square',
  referenceUrl: 'https://creightonmodel.com/',
  boundMethod: { itemKey: 'cervical-fluid', methodId: 'creighton' },
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
    mucus: mucusRules,
    bleeding: {
      heavy: { fill: 'bleedingRed' },
      medium: { fill: 'bleedingRed' },
      light: { fill: 'bleedingRed' },
      spotting: { fill: 'bleedingRed' },
      brown: { fill: 'bleedingRed' }
    }
  },
  precedence: ['mucus', 'bleeding'],
  peakMarker: {
    compute: 'lastSlipperyDayInCycle',
    primitive: 'letter',
    color: 'peak',
    thresholds: { lubricative: 0.7, stretchability: 0.7 },
    candidateOptions: [...fertileOptions],
    letter: 'P'
  }
};
