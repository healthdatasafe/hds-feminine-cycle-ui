# Concept

This package solves a single problem: **how do you display cervical-fluid / cycle-tracking events in different visual styles** (FEMM dots, Billings stamps, Creighton stamps), in ways that work across multiple hosts (timeline, form, diary card) without duplicating the visual code?

## Three building blocks

```
┌───────────────────────────────────────────────────────────────┐
│  HDS events (bleeding, mucus, brown-spotting, …)              │
│        │                                                      │
│        ▼                                                      │
│  composeCellInput(events, rep)   ── pure function            │
│        │                                                      │
│        ▼                                                      │
│  CellInput { fill, letter, code, halfFill, centerDot, … }    │
│        │                                                      │
│        ▼                                                      │
│  <RepresentationCell representationId={…} input={…} />       │
│        │                                                      │
│        ▼                                                      │
│  SVG drawn into a size×size box                              │
└───────────────────────────────────────────────────────────────┘
```

The three building blocks separate **what to show** (the spec), **how to compose** (events → CellInput), and **how to render** (CellInput → SVG).

## Why "layout-agnostic"

Reference paper charts (FEMM/Billings/Creighton) all draw the **same kind of cell** but lay it out differently — vertical column for FEMM, horizontal grid for Billings/Creighton. In a real codebase, the cell appears in even more places:

| Surface | Container |
|---|---|
| Timeline event marker | one cell at the event's timestamp |
| Calendar / cycle grid | one cell per calendar day |
| Form picker button | one cell per option, in a row of buttons |
| Diary card glyph | one cell next to the event title |
| Settings preview | seven cells in a row, sample data |

If the cell renderer assumes a layout, you write five renderers. If it doesn't, you write one. This package picks the second path — **`RepresentationCell` draws into a `size × size` box and nothing else**. Hosts position it.

## What a representation is

A `RepresentationSpec` is pure data. Three pieces:

1. **`primitive`** — `'dot-circle'` (FEMM) or `'stamp-square'` (Billings, Creighton). Selects the SVG shape.
2. **`palette`** — named hex colors (`dry`, `pasty`, `peak`, `bleedingHeavy`, …). Mapping rules reference palette keys, not raw hex.
3. **`mappingRules`** — for each role (`mucus`, `bleeding`, `bleedingSubstate`, …), a table from option-key (e.g. `1` for FEMM dry, `'8CK'` for a Creighton code, `'heavy'` for bleeding intensity) to a partial CellInput (`fill`, `letter`, `code`, `centerDot`, `baby`).

Plus three modifiers:

- **`consumes`** — which HDS streams this representation reads.
- **`precedence`** — when multiple roles fire on the same day, the order in which they merge. Lowest precedence first; highest overwrites.
- **`halfSplit`** — when two roles produce fills, render one as a half-and-half circle (e.g. mucus + bleeding on the same day in FEMM).

## Composition: N→1

A single calendar day can carry several HDS events: a `body-vagina-bleeding` entry, a `bleeding-brown-dark` entry, a `body-vulva-mucus-inspect` entry. Paper charts collapse all of those into **one cell**.

`composeCellInput(events, rep)` does the reduction:

1. Bucket events by role (looking up `event.streamIds` against `rep.consumes`).
2. For each role, derive a partial CellInput from `rep.mappingRules`.
3. Merge in `rep.precedence` order — the highest-precedence role's fill, letter, code wins.
4. If the top two roles match a `halfSplit` pair, also write `halfFill` from the loser.

The function is pure — no I/O, no engine calls. That's deliberate: it can run inside SSR, in a test, or on a server-side rendered fallback.

## Force-conversion (deferred)

When a user picks "FEMM" but their data was logged with a `source.key='billings'` event, we want to display the closest FEMM option. The HDS data-model already encodes every method as a 9-d weighted-Euclidean vector; the existing `EuclidianDistanceEngine.fromVector(methodId, vector)` (in `hds-lib-js`) returns the closest option in any chosen method. Reusing that on the **display** side gives bit-identical conversion to what bridges already do on the **ingest** side.

For v0.1 this package leaves force-conversion to the host (which has the engine instance). v0.2 will surface a small wrapper so hosts pass in the engine and the package handles the lookup transparently.

## What this package does *not* do

- **No data fetching.** Hosts query Pryv / hds-lib and pass events in.
- **No layout.** Hosts position the cell.
- **No settings UI.** Hosts pick the active representation; this package only renders the chosen one.
- **No theming beyond the palette.** Each spec defines its own colors. A future high-contrast variant will be a separate spec, not a runtime flag.

## Per-method depth

Each representation gets its own doc with palette choices, source materials, and reference images:

- [FEMM](./methods/femm.md)
- Billings — _planned_
- Creighton — _planned_

When images are added under `docs/images/`, the per-method docs reference them so the README can stay short and the depth lives here.
