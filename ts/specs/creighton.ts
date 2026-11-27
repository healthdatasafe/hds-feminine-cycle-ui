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
 *                                    the app never colours them yellow"). No code draws
 *                                    yellow; a yellow stamp is drawn only where it was charted.
 *
 * Charted stamps (`stamps`, data-model 4.32.0): the six of the method. Yellow and yellow with a baby are used only on
 * the instructor's instruction (book ch. 6; plan 131 `08-practitioner-answers.md` Q9), and only on a day of mucus
 * judged not fertile by that instruction, never a dry one (`over: ['discharge']`; practitioner, 2026-11-26, plan 136
 * `seance-2026-11-26-questions-generales.md` Q4). The six are the whole list: no brown, no white without a baby (Q3).
 *
 * Peak-type (codeRules[2], hds, `peakMarker.isCandidate`): clear (K, so C/K too),
 * lubricative (L) or very stretchy (10) mucus, whatever the quantity, also when
 * the code carries B or R (the Peak Day can be a red sticker); never a dry code.
 * Practitioner answers Q6 and Q10 (plan 131 `08-practitioner-answers.md`).
 *
 * The sign of the day (Q7): peak-type, then other mucus, then dry, the highest
 * dry number first (`mucusRank`).
 *
 * Bleeding letters (book ch. 6; plan 131 06 D5): H, M, L, VL on the flow scale,
 * B (brown) as the presence of `body-vulva-bleeding-browndark`. H and M are
 * written alone; L, VL and B always with a mucus or dry code (book ch. 6, Q0).
 *
 * Signs beside the fluid (`shows.signs`, literature): none.
 */

/**
 * A code as Creighton writes it: a number, then letters; or P and letters (PC, PY: a pasty discharge without stretch,
 * Q3). Loose on purpose: a new letter still draws.
 */
const CODE_SHAPE = /^(\d+[A-Z]*|P[A-Z]+)$/;
const DRY = /^(0|2W?|4)$/;

type CreightonStamp = 'dryGreen' | 'bleedingRed' | 'discharge';

function stampFillFor (code: string): CreightonStamp {
  if (/[BR]/.test(code)) return 'bleedingRed';
  if (DRY.test(code)) return 'dryGreen';
  return 'discharge';
}

function isPeakType (code: string): boolean {
  const c = code.toUpperCase();
  if (!CODE_SHAPE.test(c) || DRY.test(c)) return false;
  return /K|L|^10/.test(c);
}

/** The most fertile sign of the day ranks highest (Q7): peak-type 3, other mucus 2, dry 1 + 0 < 2 < 2W < 4. */
function mucusRank (code: string): number {
  const c = code.toUpperCase();
  if (isPeakType(c)) return 3;
  if (DRY.test(c)) return 1 + ['0', '2', '2W', '4'].indexOf(c) / 10;
  return 2;
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
  { code: 'H', label: { en: 'Heavy', fr: 'Abondant', es: 'Abundante', it: 'Abbondante', 'pt-BR': 'Intenso' }, band: 'heavy', itemKey: 'body-vulva-bleeding', value: 0.75, mucus: 'none' },
  { code: 'M', label: { en: 'Medium', fr: 'Moyen', es: 'Medio', it: 'Medio', 'pt-BR': 'Moderado' }, band: 'medium', itemKey: 'body-vulva-bleeding', value: 0.55, mucus: 'none' },
  { code: 'L', label: { en: 'Light', fr: 'Léger', es: 'Leve', it: 'Leggero', 'pt-BR': 'Leve' }, band: 'light', itemKey: 'body-vulva-bleeding', value: 0.35, mucus: 'required' },
  { code: 'VL', label: { en: 'Very light', fr: 'Très léger', es: 'Muy leve', it: 'Molto leggero', 'pt-BR': 'Muito leve' }, band: 'spotting', itemKey: 'body-vulva-bleeding', value: 0.2, mucus: 'required' },
  { code: 'B', label: { en: 'Brown bleeding', fr: 'Saignement brun', es: 'Sangrado marrón', it: 'Sanguinamento marrone', 'pt-BR': 'Sangramento marrom' }, band: 'brown', itemKey: 'body-vulva-bleeding-browndark', mucus: 'required' }
];

export const creightonSpec: RepresentationSpec = {
  id: 'creighton',
  label: { en: 'Creighton', fr: 'Creighton', es: 'Creighton', it: 'Creighton', 'pt-BR': 'Creighton' },
  description: {
    en: 'Square stamps with letter codes (8CK, 10WL, …): red for bleeding, green for dry, white with a baby for mucus. Peak day marked with P, then 1, 2, 3.',
    fr: 'Tampons carrés avec codes (8CK, 10WL, …) : rouge pour le saignement, vert pour sec, blanc avec un bébé pour la glaire. Jour pic marqué d\'un P, puis 1, 2, 3.',
    es: 'Sellos cuadrados con códigos de letras (8CK, 10WL, …): rojo para el sangrado, verde para seco, blanco con un bebé para el moco. Día pico marcado con P, luego 1, 2, 3.',
    it: 'Timbri quadrati con codici a lettere (8CK, 10WL, …): rosso per il sanguinamento, verde per il secco, bianco con un bambino per il muco. Giorno del picco indicato con P, poi 1, 2, 3.',
    'pt-BR': 'Selos quadrados com códigos de letras (8CK, 10WL, …): vermelho para sangramento, verde para seco, branco com um bebê para muco. Dia do ápice marcado com P, depois 1, 2, 3.'
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
    { itemKey: 'body-vulva-mucus-inspect', role: 'mucus' },
    { itemKey: 'fertility-cycles-chart-stamp', role: 'stamp' }
  ],
  palette: {
    bleedingRed: '#D32F2F',
    dryGreen: '#7FB069',
    discharge: '#FFFFFF',
    stampYellow: '#F4C752',
    peak: '#1F3B7A'
  },
  stamps: {
    red: { fill: 'bleedingRed', label: { en: 'Red', fr: 'Rouge', es: 'Rojo', it: 'Rosso', 'pt-BR': 'Vermelho' } },
    green: { fill: 'dryGreen', label: { en: 'Green', fr: 'Vert', es: 'Verde', it: 'Verde', 'pt-BR': 'Verde' } },
    'green-baby': { fill: 'dryGreen', baby: true, label: { en: 'Green with a baby', fr: 'Vert avec un bébé', es: 'Verde con un bebé', it: 'Verde con un bambino', 'pt-BR': 'Verde com um bebê' } },
    'white-baby': { fill: 'discharge', baby: true, label: { en: 'White with a baby', fr: 'Blanc avec un bébé', es: 'Blanco con un bebé', it: 'Bianco con un bambino', 'pt-BR': 'Branco com um bebê' } },
    yellow: { fill: 'stampYellow', label: { en: 'Yellow', fr: 'Jaune', es: 'Amarillo', it: 'Giallo', 'pt-BR': 'Amarelo' }, onInstruction: true, over: ['discharge'] },
    'yellow-baby': { fill: 'stampYellow', baby: true, label: { en: 'Yellow with a baby', fr: 'Jaune avec un bébé', es: 'Amarillo con un bebé', it: 'Giallo con un bambino', 'pt-BR': 'Amarelo com um bebê' }, onInstruction: true, over: ['discharge'] }
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
  mucusRank,
  maxCodeLength: 6, // 10GCKL, 10GKYL
  bleedingNotation,
  precedence: ['mucus', 'bleeding'],
  periodDisplay: 'stamp',
  chart: { signs: { temperature: 'no', lh: 'no', monitor: 'no', cervix: 'no' } },
  peakMarker: {
    compute: 'lastSlipperyDayInCycle',
    primitive: 'letter',
    color: 'peak',
    isCandidate: isPeakType,
    letter: 'P',
    countAfter: 3
  }
};
