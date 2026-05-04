# hds-feminine-cycle-ui

Custom UI representations for cervical-fluid / cycle-tracking events in the HDS ecosystem — render the same data as **FEMM**, **Billings (BOM)**, or **Creighton** charts.

Layout-agnostic. The same cell renderer is reused as a timeline marker, a form picker button, a diary-card glyph, or a calendar-grid cell. Hosts position it.

## Install

```bash
npm install hds-feminine-cycle-ui
```

Peer-dep: `react@^19`.

## Quick start

```tsx
import {
  RepresentationCell,
  composeCellInput,
  registry
} from 'hds-feminine-cycle-ui';

const rep = registry.get('femm');
const input = composeCellInput(eventsForADay, rep);

<RepresentationCell representationId='femm' input={input} size={24} />
```

## What's in here

- A small **registry** of representations (FEMM today; Billings + Creighton next).
- A **pure function** that reduces N HDS events on a date to a single normalized cell input.
- One **React component** that draws a cell into a `size × size` SVG box.

## Built-in representations

| id          | primitive      | status            |
|-------------|----------------|-------------------|
| `femm`      | `dot-circle`   | shipped (v0.1)    |
| `billings`  | `stamp-square` | planned (v0.2)    |
| `creighton` | `stamp-square` | planned (v0.2)    |

## Documentation

- [`docs/concept.md`](./docs/concept.md) — the abstraction model and why it's layout-agnostic.
- [`docs/methods/femm.md`](./docs/methods/femm.md) — FEMM palette, mapping, sources.
- [`docs/methods/billings.md`](./docs/methods/billings.md) — Billings design notes (planned).
- [`docs/methods/creighton.md`](./docs/methods/creighton.md) — Creighton design notes (planned).
- [`AGENTS.md`](./AGENTS.md) — operational notes for AI agents working on this repo.

Reference images for each representation will land under `docs/images/` as they become available; per-method docs link to them.

## Status

`v0.1.0`. See [`CHANGELOG.md`](./CHANGELOG.md).

## License

BSD-3-Clause
