import type { Representation, RepresentationSpec } from './types.ts';

class RepresentationRegistry {
  #byId = new Map<string, Representation>();

  register (spec: RepresentationSpec): void {
    this.#byId.set(spec.id, this.#load(spec));
  }

  get (id: string): Representation | undefined {
    return this.#byId.get(id);
  }

  has (id: string): boolean {
    return this.#byId.has(id);
  }

  list (): Representation[] {
    return Array.from(this.#byId.values());
  }

  #load (spec: RepresentationSpec): Representation {
    const palette = spec.palette;
    return {
      spec,
      resolveColor: (key: string) => palette[key] ?? key
    };
  }
}

// Cross-module-graph singleton (B-2026-07-06-2). A Vite consumer can end up with
// this module instantiated more than once — e.g. the dep-optimizer pre-bundles the
// package entry (which runs `registry.register(...)`) while externalizing
// `RepresentationCell.tsx`, so the cell would import a *second, empty* registry and
// render the FallbackBox. Anchoring the single instance on `globalThis` (keyed by
// package + major) guarantees every module copy shares one populated registry,
// regardless of how the bundler splits the graph. Method dispatch goes through the
// shared instance's prototype, so the `#byId` private-field brand check stays valid
// even across duplicate class definitions.
const REGISTRY_KEY = Symbol.for('hds-feminine-cycle-ui:RepresentationRegistry:v0');
const _globals = globalThis as unknown as Record<symbol, RepresentationRegistry>;
export const registry: RepresentationRegistry =
  (_globals[REGISTRY_KEY] ??= new RepresentationRegistry());
export type { RepresentationRegistry };
