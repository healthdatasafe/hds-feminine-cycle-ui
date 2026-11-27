import type { Representation, RepresentationSpec } from './types.ts';

class RepresentationRegistry {
  #byId = new Map<string, Representation>();

  /**
   * Register `spec` under its id. `version` is the version of the package copy registering it: the built-ins pass
   * theirs, a host's own spec passes nothing. When an id is registered again, the spec from the newer version is
   * kept (no version counts as older than any); see `versionAware` below.
   */
  register (spec: RepresentationSpec, _version?: string): void {
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

interface Source { version?: string; content: string }

const SOURCES_KEY = Symbol.for('hds-feminine-cycle-ui:RepresentationRegistry:sources');

/** Semver order; a missing version is older than any. Pre-releases sort before their release. */
export function compareVersions (a: string | undefined, b: string | undefined): number {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  const [coreA, preA] = a.split('-', 2);
  const [coreB, preB] = b.split('-', 2);
  const partsA = coreA.split('.').map(Number);
  const partsB = coreB.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (partsA[i] || 0) - (partsB[i] || 0);
    if (d !== 0) return Math.sign(d);
  }
  if (preA === preB) return 0;
  if (preA == null) return 1;
  if (preB == null) return -1;
  return preA < preB ? -1 : 1;
}

/** A spec's content as a string: keys sorted, functions by their source. */
function contentOf (spec: RepresentationSpec): string {
  return JSON.stringify(spec, (_key, value) => {
    if (typeof value === 'function') return `fn:${value.toString()}`;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(Object.keys(value).sort().map((k) => [k, value[k]]));
    }
    return value;
  });
}

function label (version: string | undefined): string {
  return version ?? 'an unversioned registration (a copy older than 0.20.1, or the host)';
}

/**
 * Make a registry instance keep, for each id, the spec from the newest package version (B-2026-11-20-15). Every
 * copy of the package loaded in a page shares one instance (see below), which may have been created by an older copy
 * whose `register` just overwrites: so the rule is installed on the instance itself, as an own `register` shadowing
 * the prototype's, by whichever versioned copy loads first. Ids registered before that (by an older copy) count as
 * unversioned. Different content under one id warns once; the same content stays silent.
 */
export function versionAware<T extends RepresentationRegistry> (target: T): T {
  const holder = target as unknown as Record<symbol, Map<string, Source>>;
  if (holder[SOURCES_KEY]) return target;
  const sources = new Map<string, Source>();
  const warned = new Set<string>();
  holder[SOURCES_KEY] = sources;
  const plainRegister = Object.getPrototypeOf(target).register as (spec: RepresentationSpec) => void;
  Object.defineProperty(target, 'register', {
    configurable: true,
    writable: true,
    value: (spec: RepresentationSpec, version?: string): void => {
      const incoming: Source = { version, content: contentOf(spec) };
      const existing = target.get(spec.id);
      const previous = sources.get(spec.id) ?? (existing ? { content: contentOf(existing.spec) } : undefined);
      const order = previous ? compareVersions(version, previous.version) : 1;
      const keep = order >= 0;
      if (previous && previous.content !== incoming.content) {
        const [kept, dropped] = keep ? [incoming, previous] : [previous, incoming];
        const key = `${spec.id}|${kept.version}|${dropped.version}`;
        if (!warned.has(key)) {
          warned.add(key);
          console.warn(`hds-feminine-cycle-ui: representation "${spec.id}" is registered by two copies of the package ` +
            `with different content; keeping the one from ${label(kept.version)}, ignoring the one from ` +
            `${label(dropped.version)}. Deduplicate hds-feminine-cycle-ui in this app.`);
        }
      }
      if (!keep) return;
      plainRegister.call(target, spec);
      sources.set(spec.id, incoming);
    }
  });
  return target;
}

/** A new, empty, version-aware registry (tests; the page-wide one is `registry`). */
export function createRegistry (): RepresentationRegistry {
  return versionAware(new RepresentationRegistry());
}

// Cross-module-graph singleton (B-2026-07-06-2). A Vite consumer can end up with
// this module instantiated more than once — e.g. the dep-optimizer pre-bundles the
// package entry (which runs `registry.register(...)`) while externalizing
// `RepresentationCell.tsx`, so the cell would import a *second, empty* registry and
// render the FallbackBox. Anchoring the single instance on `globalThis` (keyed by
// package + major) guarantees every module copy shares one populated registry,
// regardless of how the bundler splits the graph. Method dispatch goes through the
// shared instance's prototype, so the `#byId` private-field brand check stays valid
// even across duplicate class definitions. The key never changes, so copies of other
// versions share the instance too; `versionAware` decides whose spec wins.
const REGISTRY_KEY = Symbol.for('hds-feminine-cycle-ui:RepresentationRegistry:v0');
const _globals = globalThis as unknown as Record<symbol, RepresentationRegistry>;
export const registry: RepresentationRegistry =
  versionAware(_globals[REGISTRY_KEY] ??= new RepresentationRegistry());
export type { RepresentationRegistry };
