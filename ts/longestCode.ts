import type { RepresentationSpec } from './types.ts';

/**
 * The length of the longest code or letter the spec writes in a cell (4 for
 * Creighton's `10KL`, 0 for a spec that writes none), so a host can size its
 * day columns from the method's own notation.
 */
export function longestCode (spec: RepresentationSpec): number {
  let n = 0;
  for (const role of Object.values(spec.mappingRules)) {
    for (const f of Object.values(role)) n = Math.max(n, f.code?.length ?? 0, f.letter?.length ?? 0);
  }
  return n;
}
