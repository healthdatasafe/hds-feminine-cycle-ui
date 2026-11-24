import type { HdsEventLike, MappingRuleFragment, Representation } from './types.ts';
import type { ComposeOptions } from './composeCellInput.ts';

/**
 * The native option of `event.content.source.sourceData`. Two shapes in the wild:
 *   1. Object: `{ mucus: "Sticky" }` (e.g. bridge-cyclefeminin-net).
 *   2. Bare scalar: `"Sticky"` or `4` (e.g. bridge-mira's mira-demo dataset).
 */
export function readNativeMucus (sourceData: any): string | number | undefined {
  if (typeof sourceData === 'string' || typeof sourceData === 'number') return sourceData;
  const m = sourceData?.mucus;
  return typeof m === 'string' || typeof m === 'number' ? m : undefined;
}

/**
 * A mucus event's option key in the representation's bound method:
 *   1. `source.key` is the bound method → the native option.
 *   2. Else vectors + `closestOption` → the closest option in the bound method.
 *   3. Else, for an event that names no method (no `source.key`), the native option.
 * Null when nothing resolves. The native option of an event that names another method is never read as one of this
 * method's: the same text means something else there (FEMM 4 is Slippery, Creighton 4 is dry).
 */
export function mucusOptionOf (
  ev: HdsEventLike,
  rep: Representation,
  opts?: Pick<ComposeOptions, 'closestOption'>
): string | null {
  const c: any = ev.content;
  if (!c) return null;
  const sourceKey = c.source?.key;
  const native = readNativeMucus(c.source?.sourceData);
  const targetMethod = rep.spec.boundMethod.methodId;
  if (sourceKey === targetMethod && native != null) return ruleKeyOf(rep, 'mucus', String(native));
  if (c.vectors && opts?.closestOption) {
    try {
      const closest = opts.closestOption(targetMethod, c.vectors);
      if (closest) return ruleKeyOf(rep, 'mucus', String(closest));
    } catch (_e) { /* no conversion */ }
  }
  return sourceKey == null && native != null ? ruleKeyOf(rep, 'mucus', String(native)) : null;
}

/**
 * A role's option key as the spec spells it. Methods such as Creighton are case-insensitive (`6ck` converts as
 * `6CK`), so a stored spelling that differs only in case reads as the spec's key; any other key comes back unchanged.
 */
export function ruleKeyOf (rep: Representation, role: string, key: string): string {
  const rules = rep.spec.mappingRules[role];
  if (!rules || key in rules) return key;
  const upper = key.toUpperCase();
  const inTable = Object.keys(rules).find(k => k.toUpperCase() === upper);
  if (inTable != null) return inTable;
  if (role === 'mucus' && rep.spec.mucusRule) return rep.spec.mucusRule(key)?.code ?? key;
  return key;
}

/** The fragment of a role's option key: the table's entry, else (mucus) the spec's `mucusRule`. */
export function fragmentOf (rep: Representation, role: string, key: string): MappingRuleFragment | undefined {
  const rules = rep.spec.mappingRules[role];
  const fromTable = rules?.[key];
  if (fromTable) return fromTable;
  return role === 'mucus' ? rep.spec.mucusRule?.(key) : undefined;
}

/** Whether a mucus option key is peak-type: listed in `candidateOptions`, or accepted by `isCandidate`. */
export function isPeakOption (rep: Representation, key: string): boolean {
  const pm = rep.spec.peakMarker;
  if (!pm) return false;
  return (pm.candidateOptions ?? []).map(String).includes(key) || (pm.isCandidate?.(key) ?? false);
}

/** Whether the spec can tell peak-type mucus at all. */
export function hasPeakRule (rep: Representation): boolean {
  const pm = rep.spec.peakMarker;
  return !!pm && ((pm.candidateOptions?.length ?? 0) > 0 || !!pm.isCandidate);
}

/** Item keys the representation reads under the mucus role. */
export function mucusItemKeysOf (rep: Representation): Set<string> {
  return new Set(rep.spec.consumes.filter(c => c.role === 'mucus').map(c => c.itemKey));
}
