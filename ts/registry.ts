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

export const registry = new RepresentationRegistry();
export type { RepresentationRegistry };
