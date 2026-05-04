# Changelog

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
