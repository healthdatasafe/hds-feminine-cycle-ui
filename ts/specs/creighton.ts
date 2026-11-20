import type { RepresentationSpec, MappingRuleFragment, BleedingNotationEntry } from '../types.ts';

/**
 * Creighton Model FertilityCare (CrMS).
 *
 * Source: https://creightonmodel.com/
 *
 * Visual: square colored stamps + textual code overlay (e.g. "8CK", "10WL").
 * Same primitive as Billings; Creighton always renders the textual code so the
 * exact mucus characteristics are visible (the stamp color alone doesn't
 * disambiguate Creighton's codes).
 *
 * Every code draws by rule on its text (`mucusRule`), case-insensitive: the
 * valid codes are the model's (model-cervical-fluid `creighton.json`, generated
 * from the book's grammar), and fcui keeps no list of them (plan 134, decision 5).
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
 * Peak-type (codeRules[2], hds, `peakMarker.isCandidate`): clear (K),
 * lubricative (L) or very stretchy (10) mucus, whatever the quantity. The partly
 * clear codes without L below 10 (6CK, 8CK, 6GCK, 8GCK) are left out until
 * confirmed (gaps[1], practitioner Q6); 10CK is in through its stretch.
 *
 * Bleeding letters (book ch. 6; plan 131 06 D5): H, M, L, VL on the flow scale,
 * B (brown) as the presence of `body-vulva-bleeding-browndark`.
 *
 * Signs beside the fluid (`shows.signs`, literature): none.
 */

/** A code as Creighton writes it: a number, then letters. Loose on purpose: a new letter still draws. */
const CODE_SHAPE = /^\d+[A-Z]*$/;

type CreightonStamp = 'dryGreen' | 'bleedingRed' | 'discharge';

function stampFillFor (code: string): CreightonStamp {
  if (/[BR]/.test(code)) return 'bleedingRed';
  if (/^(0|2W?|4)$/.test(code)) return 'dryGreen';
  return 'discharge';
}

function isPeakType (code: string): boolean {
  const c = code.toUpperCase();
  if (!CODE_SHAPE.test(c) || stampFillFor(c) !== 'discharge') return false;
  if (/^(6|8)G?CK$/.test(c)) return false;
  return /K|L|^10/.test(c);
}

function mucusRule (code: string): MappingRuleFragment | undefined {
  const c = code.toUpperCase();
  if (!CODE_SHAPE.test(c)) return undefined;
  const fill = stampFillFor(c);
  return fill === 'discharge' ? { fill, code: c, baby: true } : { fill, code: c };
}

/**
 * Sample codes for previews and legends (hosts read the first key; the method images list them). Not the valid
 * codes: any code draws by `mucusRule`.
 */
const SAMPLE_CODES = ['0', '2', '4', '6C', '8CK', '10KL', '10WL', '6B'];
const mucusSamples: Record<string, MappingRuleFragment> = Object.fromEntries(SAMPLE_CODES.map(c => [c, mucusRule(c)!]));

const bleedingNotation: BleedingNotationEntry[] = [
  { code: 'H', label: { en: 'Heavy', fr: 'Abondant' }, band: 'heavy', itemKey: 'body-vulva-bleeding', value: 0.75 },
  { code: 'M', label: { en: 'Medium', fr: 'Moyen' }, band: 'medium', itemKey: 'body-vulva-bleeding', value: 0.55 },
  { code: 'L', label: { en: 'Light', fr: 'Léger' }, band: 'light', itemKey: 'body-vulva-bleeding', value: 0.35 },
  { code: 'VL', label: { en: 'Very light', fr: 'Très léger' }, band: 'spotting', itemKey: 'body-vulva-bleeding', value: 0.2 },
  { code: 'B', label: { en: 'Brown bleeding', fr: 'Saignement brun' }, band: 'brown', itemKey: 'body-vulva-bleeding-browndark' }
];

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
    { itemKey: 'body-vulva-bleeding-browndark', role: 'bleeding', presenceOption: 'brown' },
    { itemKey: 'bleeding-brown-dark', role: 'bleeding', presenceOption: 'brown' },
    { itemKey: 'body-vulva-mucus-inspect', role: 'mucus' }
  ],
  palette: {
    bleedingRed: '#C8155A',
    dryGreen: '#7FB069',
    discharge: '#FFFFFF',
    peak: '#1F3B7A'
  },
  mappingRules: {
    mucus: mucusSamples,
    // `baby: false`: a bleeding day with mucus is a red stamp, never red with a baby (the book has no such sticker).
    bleeding: {
      heavy: { fill: 'bleedingRed', baby: false },
      medium: { fill: 'bleedingRed', baby: false },
      light: { fill: 'bleedingRed', baby: false },
      spotting: { fill: 'bleedingRed', baby: false },
      brown: { fill: 'bleedingRed', baby: false }
    }
  },
  mucusRule,
  maxCodeLength: 6, // 10GCKL
  bleedingNotation,
  precedence: ['mucus', 'bleeding'],
  periodDisplay: 'stamp',
  chart: { signs: { temperature: 'no', lh: 'no', monitor: 'no', cervix: 'no' } },
  peakMarker: {
    compute: 'lastSlipperyDayInCycle',
    primitive: 'letter',
    color: 'peak',
    thresholds: { lubricative: 0.7, stretchability: 0.7 },
    isCandidate: isPeakType,
    letter: 'P',
    countAfter: 3
  }
};
