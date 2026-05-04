# AGENTS.md

Operational notes for AI agents working in this repo. Update as development progresses.

## What this package is

Custom UI representations for cervical-fluid / cycle-tracking events in the HDS ecosystem — render the same data as **FEMM**, **Billings**, or **Creighton** charts. Layout-agnostic: the same cell renderer is reused as a timeline marker, a form picker button, a diary-card glyph, or a calendar-grid cell. Hosts position it.

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
  RepresentationCell,        // React component, layout-agnostic
  composeCellInput,          // pure function: events → CellInput
  registry,                  // built-in + user-extensible registrations
  samplePreviewEvents,       // shared 7-day fixture for previews
  femmSpec                   // built-in spec
} from 'hds-feminine-cycle-ui';

// types
import type {
  Representation,
  RepresentationSpec,
  CellInput,
  CellProps,
  HdsEventLike
} from 'hds-feminine-cycle-ui';
```

Adding a new field to `CellInput` is **non-breaking** (older renderers ignore unknown fields). Removing or renaming a field requires a version bump.

## Don't

- **Don't import `react-dom`** — this package never renders to the DOM directly. It only emits JSX. Hosts mount it.
- **Don't add layout containers here** — calendar grids, picker grids, timeline rows live in the *host* repos (`hds-react-timeline`, `hds-forms-js`, `hds-webapp`).
- **Don't import from `hds-lib-js` or `data-model`** at the package top level — once force-conversion is wired, those become *peer*-deps consumed by hosts. The package itself stays free of runtime HDS dependencies so it builds standalone.
- **Don't commit `js/`** — it's built on install via `prepare`.

## Status

`v0.1.0` (current) — FEMM `dot-circle` only.

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
| Creighton spec (33 codes) | ⏳ next |
| Peak detection helper (`detectPeakDay`) | ⏳ deferred |
| `cycleGrid` row container | ⏳ deferred (lives in `hds-react-timeline`) |

## Adding a new representation

1. Drop a `RepresentationSpec` under `ts/specs/<id>.ts`.
2. Register it in `ts/index.ts`.
3. Add a `docs/methods/<id>.md` capturing palette choices, mapping rules, sources, and (when available) reference images in `docs/images/`.
4. Tests: extend `tests/composeCellInput.test.js` with at least one mucus + one bleeding case.

## Updating this file

When a slice in the **Status** table moves from ⏳ to ✅ — and at any meaningful API change — update this file along with `CHANGELOG.md`. Treat it as the agent-onboarding doc; it should let a fresh agent get oriented in under a minute.
