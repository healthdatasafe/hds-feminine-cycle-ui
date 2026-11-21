/**
 * Public types for hds-feminine-cycle-ui.
 *
 * The contract follows `_plans/50-custom-mucus-ui-atwork/02-abstraction.md`.
 * Three concepts:
 *   1. RepresentationSpec — pure data describing a representation.
 *   2. CellInput — normalized input the renderer reads.
 *   3. RepresentationCell — the React component (in RepresentationCell.tsx).
 */

/** A localised string. Keys are BCP-47 language tags. */
export interface I18nText {
  en: string;
  fr?: string;
  [lang: string]: string | undefined;
}

/** Minimal HDS event shape this package needs. Hosts pass full events; we only read these fields. */
export interface HdsEventLike {
  time?: number;
  streamIds: string[];
  type: string;
  content?: any;
}

/** A role binds an HDS item-key to a slot in the representation's mappingRules. */
export interface ConsumesEntry {
  itemKey: string;
  role: string; // 'mucus' | 'bleeding' | 'bleedingSubstate' | future
  /**
   * For a presence-only item (no content, e.g. `body-vulva-bleeding-browndark`): the option of the role's mapping
   * rules its presence selects. Needed when the role has several options (Creighton bleeding: heavy … brown).
   */
  presenceOption?: string;
}

/** A single mapping-rule fragment. Palette names are resolved later. */
export interface MappingRuleFragment {
  fill?: string; // palette key
  letter?: string; // single-char overlay
  code?: string; // multi-char overlay (Creighton)
  centerDot?: { color: string };
  /** `true` draws a baby; `false` removes one a lower-precedence role drew (Creighton: no red stamp with a baby). */
  baby?: boolean;
}

/** Per-role mapping table: option-value -> fragment. */
export type MappingRules = Record<string, Record<string, MappingRuleFragment>>;

export interface PeakMarkerSpec {
  compute: 'lastSlipperyDayInCycle' | 'none';
  primitive: 'centerDot' | 'letter' | 'X';
  color?: string; // palette key
  thresholds?: { lubricative?: number; stretchability?: number };
  /**
   * Mucus option keys that count as high-fertility candidates for peak/fertile
   * marking. The key is the value of `source.sourceData.mucus` (or the
   * force-converted equivalent in the bound method). Used by
   * `detectFertilityWindow` when raw vectors don't carry full lub/stretch
   * dimensions (e.g. cyclefeminin → Creighton imports).
   */
  candidateOptions?: string[];
  /**
   * Peak-type by rule on the option key, for a method whose codes are a notation (Creighton): any code it accepts
   * counts as a candidate, with or without `candidateOptions`.
   */
  isCandidate?: (code: string) => boolean;
  /**
   * Letter shown on the peak day when `primitive === 'letter'`. Defaults to
   * 'X' (Billings convention). Creighton uses 'P'.
   */
  letter?: string;
  /**
   * How many days the method counts after the peak day (the "1, 2, 3" written
   * on the chart). Notation only: `peakNotation` writes the numbers, it never
   * says what they mean for fertility. Omitted when the method has no count.
   */
  countAfter?: number;
}

/**
 * How the method charts the days of the period:
 *   - 'stamp': the period days are the method's bleeding stamp (the cell shows
 *     the bleeding; Creighton, Billings, Chart Neo).
 *   - 'separate': the method writes the bleeding on its own line and the cell
 *     shows the fluid as logged (sympto-thermal, Sensiplan, Marquette, Apple
 *     Health). Such specs do not consume the bleeding items: the host draws
 *     them in their own row.
 * Omitted when the method's rule is not known.
 */
export type PeriodDisplay = 'stamp' | 'separate';

/**
 * The signs a cycle chart can follow beside the fluid, by the hosts' row ids:
 * the basal temperature, the LH tests, a fertility monitor, the cervix.
 */
export type ChartSign = 'temperature' | 'lh' | 'monitor' | 'cervix';

/**
 * Whether the method charts a sign (model-cervical-fluid `shows.signs`):
 *   - 'default': part of the method, shown by default.
 *   - 'optional': part of the method for some, off by default.
 *   - 'no': not part of the method, off by default.
 * The person can still show or hide any sign.
 */
export type SignShown = 'default' | 'optional' | 'no';

/** What the method's chart follows beside the fluid. */
export interface ChartSpec {
  signs: Partial<Record<ChartSign, SignShown>>;
  /** The item key of the method's monitor readings, drawn as the monitor row's marks. */
  monitorItem?: string;
}

export interface RepresentationSpec {
  id: string;
  label: I18nText;
  /** One-line user-facing description shown alongside the label in pickers. */
  description?: I18nText;
  version: string;
  primitive: 'dot-circle' | 'stamp-square';
  boundMethod: { itemKey: string; methodId: string };
  consumes: ConsumesEntry[];
  palette: Record<string, string>; // name -> hex
  mappingRules: MappingRules;
  /**
   * For a method whose codes are a notation (Creighton): the fragment of any mucus code, by rule on its text,
   * case-insensitive; undefined for a text it cannot read. Used when `mappingRules.mucus` has no entry for the code;
   * the fragment's `code` is the code as the method spells it. With it, a day holding two codes shows the one
   * `mucusRank` ranks highest, else the peak-type one, else the last.
   */
  mucusRule?: (code: string) => MappingRuleFragment | undefined;
  /** With `mucusRule`: how fertile a code's sign is, higher first (Creighton: peak-type, other mucus, dry). Ties: the last read. */
  mucusRank?: (code: string) => number;
  /** The longest code `mucusRule` writes, for `longestCode` (the table holds only samples then). */
  maxCodeLength?: number;
  /** The method's bleeding letters (Creighton H, M, L, VL, B): what each one saves. Pickers only. */
  bleedingNotation?: BleedingNotationEntry[];
  precedence: string[]; // role names, lowest precedence first
  halfSplit?: { enabled: boolean; pairs: [string, string][] };
  peakMarker?: PeakMarkerSpec;
  /** How the method charts the period days (see `PeriodDisplay`). */
  periodDisplay?: PeriodDisplay;
  /** The signs the method charts (see `ChartSpec`). Omitted when not known. */
  chart?: ChartSpec;
  /**
   * False while the method's chart is not complete enough to offer: hosts
   * leave it out of their pickers, and keep it for a person who chose it.
   */
  offered?: boolean;
  referenceUrl?: string;
}

/**
 * A bleeding letter of the method's notation and what it saves: a value of a flow item (`value`), or the presence of
 * an item (no `value`, e.g. `body-vulva-bleeding-browndark`). `band` is the key of `mappingRules.bleeding` it draws.
 */
export interface BleedingNotationEntry {
  code: string;
  label: I18nText;
  band: string;
  itemKey: string;
  value?: number;
  /**
   * The mucus part of the record (Creighton book ch. 6): `none` the letter is written alone (H, M), `required` always
   * with a mucus or dry code (L, VL, B). Omitted: either.
   */
  mucus?: 'none' | 'required';
}

/** Normalized result of composeCellInput. Forward-compatible: unknown fields ignored. */
export interface CellInput {
  fill?: string; // resolved hex color
  letter?: string;
  code?: string;
  centerDot?: { color: string };
  halfFill?: { color: string };
  baby?: boolean;
  /** True when no event matched any role — render as empty outline. */
  empty?: boolean;
}

/** Loaded Representation = spec + a few precomputed lookups. */
export interface Representation {
  spec: RepresentationSpec;
  /** Resolves a palette key to its hex, returns the key itself if not found (so raw hex passes through). */
  resolveColor: (key: string) => string;
}

/** Props for the RepresentationCell React component. */
export interface CellProps {
  representationId: string;
  input: CellInput;
  size?: number;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}
