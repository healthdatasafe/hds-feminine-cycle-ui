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
 * Rules from model-cervical-fluid `references/rules/method-rules.json`,
 * `methods.creighton` (Creighton book (FR), ch. 7 "Instructions de base",
 * pp. 27-33), first matching rule wins:
 *   - code with `B` or `R`        → red (blood seen with the mucus; codeRules[0],
 *                                    literature). The shade is to confirm (gaps[2]).
 *   - "0", "2", "2W", "4"         → green (codeRules[1], hds: "2, 2W, 4 damp, wet,
 *                                    shiny without lubrication: the same meaning as dry").
 *   - every other code (6, 8, 10) → white with a baby (codeRules[2], [3], hds;
 *                                    stampNote: "white with a baby for mucus …
 *                                    the app never colours them yellow").
 *
 * Peak candidates (codeRules[2], hds): clear (K), lubricative (L) or very
 * stretchy (10) mucus, whatever the quantity. The partly clear codes 6CK and
 * 8CK are left out until confirmed (gaps[1]); 10CK is in through its stretch.
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

/** Partly clear (C/K): peak-type to confirm (method-rules.json methods.creighton.gaps[1]). */
const TO_CONFIRM_PEAK = new Set(['6CK', '8CK']);

type CreightonStamp = 'dryGreen' | 'bleedingRed' | 'discharge';

function stampFillFor (code: string): CreightonStamp {
  if (/[BR]/.test(code)) return 'bleedingRed';
  if (/^(0|2W?|4)$/.test(code)) return 'dryGreen';
  return 'discharge';
}

function isPeakType (code: string): boolean {
  if (stampFillFor(code) !== 'discharge') return false;
  if (TO_CONFIRM_PEAK.has(code)) return false;
  return /K|L|^10/.test(code);
}

function buildMucusRules (): Record<string, MappingRuleFragment> {
  const out: Record<string, MappingRuleFragment> = {};
  for (const code of CREIGHTON_OPTIONS) {
    const fill = stampFillFor(code);
    out[code] = fill === 'discharge'
      ? { fill, code, baby: true }
      : { fill, code };
  }
  return out;
}

const mucusRules = buildMucusRules();
const peakTypeOptions = CREIGHTON_OPTIONS.filter(isPeakType);

export const creightonSpec: RepresentationSpec = {
  id: 'creighton',
  label: { en: 'Creighton', fr: 'Creighton' },
  description: {
    en: 'Square stamps with letter codes (8CK, 10WL, …): red for bleeding, green for dry, white with a baby for mucus. Peak day marked with P, then 1, 2, 3.',
    fr: 'Tampons carrés avec codes (8CK, 10WL, …) : rouge pour le saignement, vert pour sec, blanc avec un bébé pour la glaire. Jour pic marqué d\'un P, puis 1, 2, 3.'
  },
  version: 'v1',
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
  periodDisplay: 'stamp',
  peakMarker: {
    compute: 'lastSlipperyDayInCycle',
    primitive: 'letter',
    color: 'peak',
    thresholds: { lubricative: 0.7, stretchability: 0.7 },
    candidateOptions: [...peakTypeOptions],
    letter: 'P',
    countAfter: 3
  }
};
