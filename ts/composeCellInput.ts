import type {
  CellInput,
  HdsEventLike,
  MappingRuleFragment,
  Representation
} from './types.ts';

/**
 * Optional behaviours for `composeCellInput`.
 *
 * `closestOption` is the host-supplied bridge to the data-model converter graph
 * (`hds-lib-js`'s `EuclidianDistanceEngine.fromVector(methodId, vector)`).
 * When present, mucus events whose `source.key` doesn't match the representation's
 * bound method are force-converted to the closest matching option in the bound
 * method — same engine bridges already use on ingest.
 */
export interface ComposeOptions {
  closestOption?: (methodId: string, vector: any) => string | null | undefined;
  /**
   * Per-day context — set by the host after running `detectFertilityWindow`.
   * Marks the cell as the peak day or a non-peak fertile day; composeCellInput
   * applies the spec's `peakMarker` config (FEMM: dark-blue fill + center dot;
   * Billings: white stamp + 'X' letter).
   */
  dayContext?: {
    isPeak?: boolean;
    isFertile?: boolean;
  };
}

/**
 * Reduce the HDS events on a given date to a single normalized CellInput.
 * Pure aside from the optional `closestOption` callback (which itself wraps a
 * pure engine call).
 */
export function composeCellInput (
  events: HdsEventLike[],
  rep: Representation,
  opts?: ComposeOptions
): CellInput {
  if (events.length === 0) return { empty: true };

  const rolesByItem = new Map<string, string>();
  for (const c of rep.spec.consumes) rolesByItem.set(c.itemKey, c.role);

  const roleEvents = new Map<string, HdsEventLike[]>();
  for (const ev of events) {
    for (const sid of ev.streamIds) {
      const role = rolesByItem.get(sid);
      if (!role) continue;
      if (!roleEvents.has(role)) roleEvents.set(role, []);
      roleEvents.get(role)!.push(ev);
    }
  }

  if (roleEvents.size === 0) return { empty: true };

  const roleFragments = new Map<string, MappingRuleFragment>();
  for (const [role, list] of roleEvents) {
    const rules = rep.spec.mappingRules[role];
    if (!rules) continue;
    const optionKey = pickOptionKey(role, list, rep, opts);
    const fragment = optionKey != null ? rules[optionKey] : undefined;
    if (fragment) roleFragments.set(role, fragment);
  }

  if (roleFragments.size === 0) return { empty: true };

  const ordered = rep.spec.precedence.filter((r) => roleFragments.has(r));
  if (ordered.length === 0) return { empty: true };

  const result: CellInput = {};
  for (const role of ordered) {
    Object.assign(result, fragmentToInput(roleFragments.get(role)!, rep));
  }

  applyHalfSplit(result, ordered, roleFragments, rep);

  if (opts?.dayContext?.isPeak) {
    return applyPeakMarker(result, rep);
  }
  if (opts?.dayContext?.isFertile) {
    return applyFertileMarker(result, rep);
  }

  return result;
}

/**
 * Read a "native mucus option" from `event.content.source.sourceData`.
 * The HDS ecosystem has two shapes in the wild:
 *   1. Object: `{ mucus: "Sticky" }` (e.g. bridge-cyclefeminin-net).
 *   2. Bare scalar: `"Sticky"` or `4` (e.g. bridge-mira's mira-demo dataset).
 * Both are accepted.
 */
function readNativeMucus (sourceData: any): string | number | undefined {
  if (sourceData == null) return undefined;
  if (typeof sourceData === 'string' || typeof sourceData === 'number') return sourceData;
  const m = sourceData?.mucus;
  if (typeof m === 'string' || typeof m === 'number') return m;
  return undefined;
}

function applyPeakMarker (input: CellInput, rep: Representation): CellInput {
  if (input.empty) return input;
  const pm = rep.spec.peakMarker;
  if (!pm) return input;

  // Spec-defined peak rule under the mucus role (Billings: white + X). Wins.
  const peakRule = rep.spec.mappingRules?.mucus?.peak;
  if (peakRule) {
    const out: CellInput = { ...input };
    if (peakRule.fill) out.fill = rep.resolveColor(peakRule.fill);
    if (peakRule.letter) out.letter = peakRule.letter;
    if (peakRule.code) out.code = peakRule.code;
    return out;
  }

  // Fallback to peakMarker config (FEMM: dark-blue centerDot).
  const out: CellInput = { ...input };
  const peakColor = pm.color ? rep.resolveColor(pm.color) : undefined;
  if (pm.primitive === 'centerDot') {
    if (peakColor) out.fill = peakColor;
    out.centerDot = { color: '#ffffff' };
  } else if (pm.primitive === 'letter' || pm.primitive === 'X') {
    out.letter = pm.letter ?? 'X';
  }
  return out;
}

function applyFertileMarker (input: CellInput, rep: Representation): CellInput {
  if (input.empty) return input;
  // Only meaningful for primitive='centerDot' representations (FEMM).
  // For 'letter' representations (Billings X-on-peak), fertile days stay as-is —
  // Billings doesn't decorate fertile days separately from "white discharge".
  const pm = rep.spec.peakMarker;
  if (!pm || pm.primitive !== 'centerDot') return input;
  // Fertile = same fill, smaller white center dot (no fill darkening).
  if (input.centerDot) return input;
  return { ...input, centerDot: { color: '#ffffff' } };
}

/**
 * Read the option-key for an event under a given role.
 *
 * Convention (matches `bridge-cyclefeminin-net/src/converters/mucus.js`):
 *   - mucus events:   content.source.sourceData.mucus is the option-key.
 *   - bleeding events: content (string) OR content.value is the intensity label.
 *   - bleedingSubstate events: identical to bleeding.
 *
 * If multiple events of the same role on the same day, pick the highest-precedence
 * option (last entry in the rules table wins; stable but representation-defined).
 */
function pickOptionKey (
  role: string,
  list: HdsEventLike[],
  rep: Representation,
  opts?: ComposeOptions
): string | null {
  const rules = rep.spec.mappingRules[role];
  if (!rules) return null;
  const orderedOptions = Object.keys(rules);

  let bestIndex = -1;
  for (const ev of list) {
    const candidates = readOptionCandidates(role, ev, rep, opts);
    for (const candidate of candidates) {
      const idx = orderedOptions.indexOf(candidate);
      if (idx > bestIndex) bestIndex = idx;
    }
  }
  if (bestIndex < 0) return null;
  return orderedOptions[bestIndex];
}

function readOptionCandidates (
  role: string,
  ev: HdsEventLike,
  rep: Representation,
  opts?: ComposeOptions
): string[] {
  const c = ev.content;
  if (c == null) return [];
  if (role === 'mucus') {
    const sourceKey = c?.source?.key;
    const native = readNativeMucus(c?.source?.sourceData);
    const targetMethod = rep.spec.boundMethod.methodId;
    // Native: event was logged in the bound method.
    if (sourceKey === targetMethod && native != null) {
      return [String(native)];
    }
    // Force-convert via the host-supplied engine bridge.
    const vectors = c?.vectors;
    if (vectors && opts?.closestOption) {
      try {
        const closest = opts.closestOption(targetMethod, vectors);
        if (closest) return [String(closest)];
      } catch (_e) { /* swallow — fall through to empty */ }
    }
    // Last-resort: if the event has a native option but no source.key match, accept it.
    if (native != null) return [String(native)];
    return [];
  }
  if (role === 'bleeding') {
    // The canonical HDS bleeding event is `ratio/proportion` (0..1).
    // Bucket numeric values into the categorical labels representations expect.
    // Thresholds match `bridge-cyclefeminin-net/src/converters/bleeding.js`:
    //   Traces=0.08 → spotting, Medium=0.55 → medium, Heavy=0.75 → heavy.
    let num: number | null = null;
    if (typeof c === 'number') num = c;
    else if (typeof c?.value === 'number') num = c.value;
    if (num != null) {
      if (num <= 0) return [];
      if (num < 0.15) return ['spotting'];
      if (num < 0.4) return ['light'];
      if (num < 0.65) return ['medium'];
      return ['heavy'];
    }
    if (typeof c === 'string') return [c];
    if (typeof c?.value === 'string') return [c.value];
    return [];
  }
  if (typeof c === 'string') return [c];
  if (typeof c === 'number') return [String(c)];
  if (typeof c?.value === 'string') return [c.value];
  return [];
}

function fragmentToInput (frag: MappingRuleFragment, rep: Representation): CellInput {
  const out: CellInput = {};
  if (frag.fill) out.fill = rep.resolveColor(frag.fill);
  if (frag.letter) out.letter = frag.letter;
  if (frag.code) out.code = frag.code;
  if (frag.centerDot) out.centerDot = { color: rep.resolveColor(frag.centerDot.color) };
  if (frag.baby) out.baby = true;
  return out;
}

function applyHalfSplit (
  result: CellInput,
  ordered: string[],
  fragments: Map<string, MappingRuleFragment>,
  rep: Representation
): void {
  const halfSplit = rep.spec.halfSplit;
  if (!halfSplit?.enabled || ordered.length < 2) return;

  const winner = ordered[ordered.length - 1];
  const loser = ordered[ordered.length - 2];
  const matches = halfSplit.pairs.some(([a, b]) =>
    (a === winner && b === loser) || (a === loser && b === winner));
  if (!matches) return;

  const loserFrag = fragments.get(loser);
  if (loserFrag?.fill) {
    result.halfFill = { color: rep.resolveColor(loserFrag.fill) };
  }
}
