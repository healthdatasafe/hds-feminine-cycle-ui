# Changelog

## [0.9.0] - 2026-10-28

Display rules now come from model-cervical-fluid `references/rules/method-rules.json` (1.2.0), and a spec ships a rule
only when it is sourced (status `hds`, `literature`, or `decision` with a source). Open rules are left out or written
as neutral notation; each `docs/methods/<id>.md` lists what is still to confirm. See `docs/methods/README.md`.

### Fixed — Creighton stamp colours (B-2026-10-26-11)
- `0`, `2`, `2W`, `4` are green (dry), and every mucus code (`6…`, `8…`, `10…` without `B`/`R`) is white with a baby.
  No Creighton stamp is yellow any more. Source: Creighton book (FR) ch. 7 via `methods.creighton.codeRules` and
  `stampNote` ("Mucus days are fertile: the app never colours them yellow").
- Peak candidates: clear (`K`), lubricative (`L`) or `10` (adds `6K`, `8K`). `6CK` / `8CK` (partly clear) left out,
  to confirm. `dischargeBip` removed from the Creighton palette; spec `version` `v1`.

### Added
- Six specs: `sensiplan`, `sympto-thermal`, `justisse`, `chartneo`, `marquette`, `appleHealth`. Sensiplan writes its
  letters black on white; sympto-thermal, Justisse, Marquette and Apple Health use neutral notation (the method's word,
  short, or number, on a white square); Chart Neo has its red bleeding sticker and a recorded peak only. Marquette's
  Low / High / Peak levels and Chart Neo's mucus fields are not shipped (status app / hds-draft).
- `peakNotation(events, rep, opts)` — pure: the peak day of one cycle (recorded `fertility-cycles-peak-day` first, else
  the last peak-type day once the mucus changes), its mark (`P` / `X`) and the count after it (1, 2, 3). Notation only.
- `RepresentationSpec.periodDisplay` (`'stamp' | 'separate'`), `PeakMarkerSpec.countAfter`, and
  `ComposeOptions.dayContext.peakCount` (writes the count as the cell's letter). Billings and FEMM gain `countAfter: 3`.

### Changed
- `detectFertilityWindow` is documented as a display heuristic, not for patient-facing verdicts; behaviour unchanged.

## [0.8.4] - 2026-07-22

### Fixed — cross-module-graph registry singleton (Vite duplicate-instance / FallbackBox)
- `registry.ts`: anchor the `RepresentationRegistry` singleton on `globalThis`
  (keyed `hds-feminine-cycle-ui:RepresentationRegistry:v0`, package + major) instead of a
  plain module-level `new`. A Vite consumer's dep-optimizer could pre-bundle the package
  entry (which runs `registry.register(...)`) while externalizing `RepresentationCell.tsx`,
  giving the cell a *second, empty* registry instance → every stamp (Billings/Creighton/FEMM/Mira)
  rendered the dashed FallbackBox instead of the colored stamp. The global anchor makes every
  module copy share one populated registry regardless of how the bundler splits the graph.
- No API change; `exports.import` stays TS-source (per `verify-live-source`). Fixes B-2026-07-06-2
  (healthdatasafe/hds-feminine-cycle-ui#2). Consumers pick it up on their next install/redeploy.

## [0.8.3] - 2026-07-10

### Changed — third-party method-site link removed from Billings spec
- `billingsSpec`: removed `referenceUrl` (`www.billings-ovulation-method.org`) so host
  apps no longer render a "Source" link to the method organization's site from the
  settings card; avoids any impression of affiliation or endorsement.
- Spec docstring and `docs/methods/billings.md` reworded: bare "Billings" naming,
  explicit non-affiliation note, sources now point at published literature; planned
  reference images must be own renderings (no third-party chart reproductions).
- `README.md`: "Billings (BOM)" / "Creighton Model" table labels → "Billings" / "Creighton".

## [0.8.2] - 2026-06-29

### Changed — trademark naming alignment (method labels)
- `billingsSpec.label`: `{ en: 'Billings (BOM)', fr: 'Billings (MOB)' }` → `{ en: 'Billings', fr: 'Billings' }`.
- `creightonSpec.label`: `{ en: 'Creighton Model', fr: 'Modèle Creighton' }` → `{ en: 'Creighton', fr: 'Creighton' }`.
- Drops the protected marks (BOM/MOB = Billings Ovulation Method®; "Creighton Model") from the bundled, user-visible labels. Method ids unchanged. Matches data-model v1.10.3 + model-cervical-fluid b401488.

## [Unreleased]

### Documentation
- `AGENTS.md`: added an end-to-end worked example — HDS mucus events
  (`{ source:{key,sourceData}, vectors }`) → `composeCellInput` (with the
  `closestOption` bridge from `getHDSModel().converters.ensureEngine('cervical-fluid')`,
  `fromVector` → `{ data, matchDistance }`) → `RepresentationCell`. Docs only;
  no code change (2026-06-19).

## 0.8.1 — 2026-06-10

### Fixed
- `composeCellInput`: presence-only events (null content) now resolve to the role's sole mapping option when unambiguous. Real-world brown-dark coloration events are `activity/plain` with null content on `body-vulva-bleeding-browndark` — they were silently dropped, so FEMM cells never merged brown-dark with bleeding (feedback C2). Two regression tests added mirroring the wild event shape.

## 0.8.0 — 2026-06-03

### Added
- `CervixPositionMarker` — optional fourth prop `tilt?: number` (0.0 = Straight, 0.5 = Medium, 1.0 = Tilted). Renders a small orientation tick anchored at the ring's top, rotated around the ring center (0° at tilt=0, 30° at tilt=1). Tick is hidden entirely when tilt is undefined — old 3d events render identically. Matches HDS data-model 1.9.0 `body-vulva-cervix-position` v1 → v2 (plan 70 phase E).

## 0.7.0 — 2026-05-05

### Added
- `CervixPositionMarker` — standalone React component for `body-vulva-cervix-position` events. Visualises the SHOW mnemonic (height → glyph y-position, firmness → ring stroke width, openness → ring center hole). Hue interpolates slate (infertile) → teal (fertile) by averaging the three signals. Standalone (not part of `RepresentationSpec`/`registry`) since cervical-position is a 3-D vector, not an option-key pick.

## 0.6.0 — 2026-05-05

### Added
- New optional `description: I18nText` field on `RepresentationSpec` for one-line user-facing prose used in pickers (en + fr).
- FEMM, Billings, Creighton, Mira each carry a description tailored to the visual primitive they ship.

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
