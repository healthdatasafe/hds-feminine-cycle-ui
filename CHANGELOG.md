# Changelog

## 0.5.0 — 2026-05-05

### Added
- Built-in **Mira** representation (`dot-circle`, 5 options: Dry/Sticky/Creamy/Watery/Raw Egg White). Watery + Raw Egg White flagged as peak candidates.

### Changed
- `composeCellInput` and `detectFertilityWindow` now accept two shapes for `event.content.source.sourceData`:
  - bare scalar (e.g. `"Sticky"`) — bridge-mira / mira-demo convention.
  - object `{ mucus: "..." }` — bridge-cyclefeminin-net convention.
- New internal helper `readNativeMucus` centralises the source-data shape detection.

## 0.4.0 — 2026-05-04

### Added
- Built-in **Creighton Model** spec (33 codes auto-generated from `CREIGHTON_OPTIONS`).
- `PeakMarkerSpec.letter?: string` — peak letter (defaults to `'X'`, Creighton uses `'P'`).
- `StampSquare`: when a cell has both `code` and `letter`, the letter renders as a small white badge in the top-right corner so the code stays legible.

## 0.3.0 — 2026-05-04

### Added
- `detectFertilityWindow(events, rep, opts?)` — sliding-window peak/fertile detection from mucus option keys (with optional `closestOption` for force-conversion).
- `composeCellInput` accepts `dayContext: { isPeak?, isFertile? }`. Applies the spec's `peakMarker` config — FEMM gets a dark-navy fill + white center dot; Billings gets the white discharge stamp + 'X' letter overlay (via `mappingRules.mucus.peak`).
- `PeakMarkerSpec.candidateOptions: string[]` — high-fertility option keys for peak/fertile classification.
- Brown-dark canonical stream `body-vulva-bleeding-browndark` added to FEMM/Billings consumes lists alongside the legacy `bleeding-brown-dark` name.

## 0.2.0 — 2026-05-04

### Added
- `stamp-square` primitive (rounded squares with light/dark fill awareness).
- Built-in **Billings (BOM)** spec (`billings`).
- `composeCellInput` accepts a `closestOption` callback (force-conversion via host's converter engine).
- `samplePreviewEvents` carries 9-d vectors so previews render under any registered representation.

### Changed
- Numeric bleeding buckets are now single-valued per range — removes ambiguous mapping where a low value used to map to both `spotting` and `light`.

## 0.1.0 — 2026-05-04

Initial release.

### Added
- `RepresentationCell` React component (layout-agnostic, `dot-circle` primitive).
- `composeCellInput(events, rep)` — N→1 reduction from HDS events to a normalized cell input.
- `RepresentationRegistry` — bundled-and-extensible registry of representations.
- Built-in spec: **FEMM** (`ts/specs/femm.ts`).
- `samplePreviewEvents` — shared 7-day synthetic fixture for previews.

### Scope (today's slice)
Only the `dot-circle` primitive and the FEMM spec are implemented. Billings + Creighton (`stamp-square`) and force-conversion via `EuclidianDistanceEngine.fromVector` are deferred to follow-up sessions.

See `_plans/50-custom-mucus-ui-atwork/` in the workspace for design and scope.
