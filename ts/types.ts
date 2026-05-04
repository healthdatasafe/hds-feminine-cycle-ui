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
}

/** A single mapping-rule fragment. Palette names are resolved later. */
export interface MappingRuleFragment {
  fill?: string; // palette key
  letter?: string; // single-char overlay
  code?: string; // multi-char overlay (Creighton)
  centerDot?: { color: string };
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
   * Letter shown on the peak day when `primitive === 'letter'`. Defaults to
   * 'X' (Billings convention). Creighton uses 'P'.
   */
  letter?: string;
}

export interface RepresentationSpec {
  id: string;
  label: I18nText;
  version: string;
  primitive: 'dot-circle' | 'stamp-square';
  boundMethod: { itemKey: string; methodId: string };
  consumes: ConsumesEntry[];
  palette: Record<string, string>; // name -> hex
  mappingRules: MappingRules;
  precedence: string[]; // role names, lowest precedence first
  halfSplit?: { enabled: boolean; pairs: [string, string][] };
  peakMarker?: PeakMarkerSpec;
  referenceUrl?: string;
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
