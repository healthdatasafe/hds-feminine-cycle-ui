# AGENTS.md

Operational notes for AI agents working in this repo. Update as development progresses.

## What this package is

Custom UI representations for cervical-fluid / cycle-tracking events in the HDS ecosystem — render the same data as **FEMM**, **Billings**, **Creighton**, or **Mira** charts. Layout-agnostic: the same cell renderer is reused as a timeline marker, a form picker button, a diary-card glyph, or a calendar-grid cell. Hosts position it.

Also ships `CervixPositionMarker` — a standalone glyph for `body-vulva-cervix-position` 3-D vector events (height / firmness / openness). Not part of the spec/registry; rendered by hosts directly.

Read-first:

1. `README.md` — high-level concepts, install, quick start.
2. `docs/concept.md` — the abstraction model (cell renderer + spec + composition).
3. `docs/methods/<method>.md` — per-method choices and knowledge (FEMM, Billings, Creighton).
4. `CHANGELOG.md` — what shipped per version.

## Conventions

- **ESM**, `"type": "module"`, Node `>=24`.
- **TypeScript** source in `ts/`, built `js/` is **not** in git (built via `prepare: tsc`).
- **JSX** for React 19 (peer-dep). `tsconfig.json` uses `"jsx": "react-jsx"`.
- **Tests** use the built-in `node --test` runner against the built `js/`. Tests live in `tests/*.test.js` and import from `../js/index.js` (so they exercise the published shape).
- **Lint** is neostandard with semicolons (`eslint.config.cjs` mirrors `hds-lib-js`).

## Public surface

Exports stay narrow on purpose. Today:

```ts
import {
  RepresentationCell,        // React component for cycle-fluid cells (dot-circle | stamp-square)
  CervixPositionMarker,      // React component for cervix-position glyph (3-D vector → SHOW glyph)
  composeCellInput,          // pure function: events → CellInput
  detectFertilityWindow,     // sliding-window peak/fertile detection over option keys
  registry,                  // built-in + user-extensible registrations
  samplePreviewEvents,       // shared 7-day fixture for previews
  femmSpec, billingsSpec, creightonSpec, miraSpec
} from 'hds-feminine-cycle-ui';

// types
import type {
  Representation,
  RepresentationSpec,
  CellInput,
  CellProps,
  CervixPositionMarkerProps,
  FertilityWindow,
  HdsEventLike,
  I18nText
} from 'hds-feminine-cycle-ui';
```

Adding a new field to `CellInput` is **non-breaking** (older renderers ignore unknown fields). Removing or renaming a field requires a version bump.

## Worked example — HDS mucus events → a rendered cell

End-to-end: raw HDS events for one day → `composeCellInput` → `<RepresentationCell>`, including force-conversion of a mucus observation logged in a *different* method.

**Mucus event content shape** (what `composeCellInput` reads under the `mucus` role):

```jsonc
{
  "source":  { "key": "vulva-mucus-inspect", "sourceData": 4 },  // method id + native option (scalar or { mucus: "Sticky" })
  "vectors": { /* n-D observation vector, e.g. the FEMM 9d-vector */ }
}
```

If `source.key` matches the representation's bound method, the native `sourceData` option is used directly. If it doesn't, `composeCellInput` force-converts `vectors` to the closest option in the bound method — but **only if you supply the `closestOption` bridge** (this package never imports `hds-lib-js`; the host wires the converter in):

```tsx
import { registry, composeCellInput, RepresentationCell } from 'hds-feminine-cycle-ui';
import { getHDSModel } from 'hds-lib';

// 1. The converter pack LAZY-LOADS — ensureEngine (async) must run before any sync use.
const converters = getHDSModel().converters;
await converters.ensureEngine('cervical-fluid');
const engine = converters.getEngine('cervical-fluid');

// 2. closestOption bridges vectors → the bound method's option key.
//    engine.fromVector(methodId, vector) returns a ConversionResult: { data, matchDistance }.
const closestOption = (methodId, vector) => engine.fromVector(methodId, vector)?.data;

// 3. Reduce one day's events to a CellInput for a chosen representation.
const rep = registry.get('femm');            // 'femm' | 'billings' | 'creighton' | 'mira'
const input = composeCellInput(eventsForDay, rep, {
  closestOption,
  dayContext: { isPeak: true }                // optional: from detectFertilityWindow over the cycle
});

// 4. Render. representationId must match the rep you composed with.
<RepresentationCell representationId='femm' input={input} size={28} />
```

Notes:
- `composeCellInput(events, rep, opts)` is pure aside from the `closestOption` callback; with no `closestOption`, only native (`source.key`-matching) mucus and presence-only events resolve — cross-method events fall through to empty.
- `registry.get(id)` returns a `Representation` (`{ spec, resolveColor }`); the four built-ins auto-register at import. `RepresentationCell` looks the rep up again by `representationId`, so pass the same id you composed with.
- Peak/fertile decoration comes from `opts.dayContext`, which the host sets after running `detectFertilityWindow` across the cycle's option keys.

## Don't

- **Don't import `react-dom`** — this package never renders to the DOM directly. It only emits JSX. Hosts mount it.
- **Don't add layout containers here** — calendar grids, picker grids, timeline rows live in the *host* repos (`hds-react-timeline`, `hds-forms-js`, `hds-webapp`).
- **Don't import from `hds-lib-js` or `data-model`** at the package top level — once force-conversion is wired, those become *peer*-deps consumed by hosts. The package itself stays free of runtime HDS dependencies so it builds standalone.
- **Don't commit `js/`** — it's built on install via `prepare`.

## Status

`v0.7.0` (current) — FEMM + Billings + Creighton + Mira cycle-fluid reps; standalone CervixPositionMarker.

| Slice | Status |
|---|---|
| Package skeleton (TS, ESM, eslint, tests) | ✅ shipped (v0.1) |
| `RepresentationCell` `dot-circle` | ✅ shipped (v0.1) |
| `composeCellInput` N→1 reduction + halfSplit | ✅ shipped (v0.1; 14/14 tests pass) |
| Registry + FEMM spec | ✅ shipped (v0.1) |
| `samplePreviewEvents` synthetic fixture | ✅ shipped (v0.1; gained vectors in v0.2) |
| `stamp-square` primitive | ✅ shipped (v0.2) |
| Billings spec | ✅ shipped (v0.2) |
| Force-conversion via host-supplied `closestOption` callback | ✅ shipped (v0.2) |
| Peak/fertile detection (`detectFertilityWindow`) + dayContext | ✅ shipped (v0.3) |
| Brown-dark canonical stream wiring | ✅ shipped (v0.3) |
| Creighton spec (33 codes) | ✅ shipped (v0.4) |
| Peak letter customisation (`PeakMarkerSpec.letter`) | ✅ shipped (v0.4) |
| Mira spec (5 options) | ✅ shipped (v0.5) |
| Bare-scalar source.sourceData support | ✅ shipped (v0.5) |
| Spec descriptions (`RepresentationSpec.description`) | ✅ shipped (v0.6) |
| `CervixPositionMarker` standalone glyph | ✅ shipped (v0.7) |
| `cycleGrid` row container | ⏳ deferred (lives in `hds-react-timeline`) |
| Creighton "fertile" day visual differentiation | ⏳ deferred |
| `StampGridPicker` (host) field for `hds-forms-js` | ✅ shipped (lives in hds-forms-js, consumes RepresentationCell + registry) |

## Adding a new representation

1. Drop a `RepresentationSpec` under `ts/specs/<id>.ts`.
2. Register it in `ts/index.ts`.
3. Add a `docs/methods/<id>.md` capturing palette choices, mapping rules, sources, and (when available) reference images in `docs/images/`.
4. Tests: extend `tests/composeCellInput.test.js` with at least one mucus + one bleeding case.
5. Regenerate the visual-vocabulary SVG: `npm run docs:images` (see below).

## Regenerating `docs/images/<id>-options.svg`

The per-method labelled SVGs in `docs/images/` are produced by `scripts/render-method-images.mjs`, which reads the *live* registry from the built `js/` and hand-renders the same primitives the React components use (so changes to `mappingRules` / palette / `peakMarker` / `halfSplit` flow through automatically).

```bash
npm run build         # rebuild js/ if you edited a spec
npm run docs:images   # writes docs/images/<id>-options.svg + creighton-codes-grid.svg
```

The script uses no React/JSDOM — it emits SVG markup directly. If you change `RepresentationCell.tsx` (the React renderer), mirror the change in `dotCircle()` / `stampSquare()` inside `scripts/render-method-images.mjs` so the docs stay in sync. README.md and downstream docs (e.g. `dev-site`) embed these SVGs.

## Updating this file

When a slice in the **Status** table moves from ⏳ to ✅ — and at any meaningful API change — update this file along with `CHANGELOG.md`. Treat it as the agent-onboarding doc; it should let a fresh agent get oriented in under a minute.
