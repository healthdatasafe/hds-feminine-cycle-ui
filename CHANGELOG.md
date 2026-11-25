# Changelog

## [Unreleased]

## [0.14.0] - 2026-11-25

### Added
- **Charted stamps** (data-model 4.32.0, `fertility-cycles-chart-stamp`; plan 141): `composeCellInput` draws the stamp
  charted on a day, in the representation's method, in place of the one drawn from the observations, with the code, the
  frequency and the peak mark or count on it, and also on a day without a code. `CellInput.stamp` is its id. Creighton
  lists its six (`RepresentationSpec.stamps`): red, green, green with a baby, white with a baby, yellow, yellow with a baby;
  `onInstruction` on the two yellow ones. A stamp of another method, or one the spec does not list, changes nothing. Two
  on a day: the one modified last (`HdsEventLike.modified`). No code draws yellow, as before.
- `stampChoices(rep)`, for a stamp picker; `chartedStampOf(events, rep)`; `CHART_STAMP_ITEM`, `CHART_STAMP_TYPE`.

## [0.13.4] - 2026-11-24

### Fixed
- The badge of a stamp with a code and a letter (Creighton's P, then 1, 2, 3) is whole: it was cut by the edge of the
  cell. Its letter is dark on its white disc; on a red stamp it was white on white. `stampBadge` (`stampStyle.ts`).

## [0.13.3] - 2026-11-24

### Fixed
- A mucus event recorded in another method is no longer read as an option of the chart's method when nothing converts
  it (no `closestOption`, or it finds no match): it draws nothing, as documented. FEMM 4 (Slippery) was drawn on a
  Creighton chart as a green 4 (dry), Marquette ratings as FEMM or Creighton options, and `peakNotation` and
  `detectFertilityWindow` could take a peak from them. An event that names no method (`source.key` absent) is read as
  before. `composeCellInput` and `mucusOptionOf` now share one reading.

## [0.13.2] - 2026-11-23

### Fixed
- Dot-circle letters and codes (FEMM, Mira) are dark or white by contrast with the circle, like the stamp-square text
  since 0.13.0; they were always white. FEMM's 1-2-3 count on a light circle now reads in dark. A letter over a
  half-filled circle takes the colour that reads on both halves.

### Added
- `textOn(...fills)` (exported): dark or white, whichever keeps the higher contrast on all the given fills.

## [0.13.1] - 2026-11-23

### Changed
- Creighton bleeding red is `#D32F2F` (was the magenta `#C8155A`): the colour of the method rules
  (model-cervical-fluid `method-rules.json`, sourced from the Creighton introductory session slides). Plan 131 review
  03 I4.

### Removed
- `PeakMarkerSpec.thresholds`: declared and set in the Creighton, Billings, FEMM and Mira specs, read nowhere
  (peak-type comes from `candidateOptions` or `isCandidate`). Plan 131 review 03 I6.

## [0.13.0] - 2026-11-23

### Added
- Creighton frequency on the stamp (B-2026-11-23-9): `CellInput.frequency` carries the frequency of the record whose
  code the cell shows (`source.annotations.frequency`, X1, X2, X3, AD, of an event recorded in the bound method;
  another method's or a converted record has none). `RepresentationCell` writes it under the code; the peak mark and
  the count keep it. An unlabelled clickable cell is named "code frequency".
- `stampColours(fill, empty)`, `stampTextLayout(size, input)`, `luminanceOf(color)`: the stamp's text colour, border
  and text layout, shared by `RepresentationCell` and the docs images script.

### Fixed
- Stamp text colour by contrast (B-2026-11-23-3): of dark and white, the one that contrasts more with the fill
  (WCAG luminance). Was: dark on any fill starting with c, d, e or f, so Creighton's red `#C8155A` and Billings' and
  Chart Neo's `#E8341C` drew dark text. Fills of mid luminance now take dark text too: Creighton's green `#7FB069`,
  `#7BB7E0`, `#A8A8A8`. Only very light fills (white, pale yellow) keep the grey border; pink, orange and tan lose it.
- Long codes fit the stamp (B-2026-11-23-3): a code shrinks to 0.2 of the cell (was 0.36), so Creighton's 5–6
  character codes (`10GCKL`) stay inside it at every host size; the width estimate of a bold character is 0.7 em
  (was 0.62, which let `6GBL` touch the edges in system-ui).
- The docs images draw the stamp as the app does (fitted code size, contrast colours); the Creighton sheet shows a
  code with its frequency.

## [0.12.0] - 2026-11-21

Plans 131 and 134: draws the 106 Creighton codes of data-model 4.23.0 (cervical-fluid converter v1).

### Changed — Creighton draws every code by rule
- The Creighton spec keeps no list of codes: `RepresentationSpec.mucusRule` draws any code by rule on its text
  (case-insensitive), so the 106 codes of the generated model list (data-model cervical-fluid converter v1) all draw,
  with their fill, baby and code, PC and PY (no number) included. `mappingRules.mucus` holds only sample codes for
  previews and legends.
- Peak-type by rule (`PeakMarkerSpec.isCandidate`), as the practitioner answered (plan 131, Q6 and Q10): K, L or
  base 10, C/K included, also with B or R; a dry code never. `peakNotation` and `detectFertilityWindow` read it.
- A day holding two Creighton codes shows the most fertile sign (Q7, `RepresentationSpec.mucusRank`): peak-type, then
  other mucus, then dry (0 < 2 < 2W < 4); on a tie the last read (was: the later one in the fixed table).
- `longestCode` is 6 for Creighton (`10GCKL`), from `RepresentationSpec.maxCodeLength`.

### Fixed
- Creighton: a bleeding day with mucus drew a red stamp with a baby, a sticker the book does not have; it is a red
  stamp with the code. `MappingRuleFragment.baby: false` removes a baby a lower-precedence role drew.

### Added
- `RepresentationSpec.bleedingNotation`: Creighton H, M, L, VL on the flow (0.75, 0.55, 0.35, 0.2), B as brown
  presence. Each entry's `mucus` says whether a mucus code goes with it: `none` for H and M, `required` for L, VL and
  B (book ch. 6, practitioner Q0). Exported `bleedingBandOf` reads a stored flow back as its band (0.95 → H, 0.08 → VL).
- `stickerOf(input)`: a stable key of a cell's sticker (fill, baby, half fill), for pickers grouping choices.
- `isPeakOption(rep, key)`.
- Case-insensitive codes; presence option for brown bleeding (plan 131).

## [0.11.1] - 2026-11-12

### Fixed — accessibility of the cell glyphs (B-2026-10-27-13)
- `RepresentationCell` and `CervixPositionMarker` no longer expose an unnamed `role="img"`. With `ariaLabel` they
  are a named image (a named button when clickable). A clickable `RepresentationCell` without one is named by its
  visible letter or code. A non-clickable glyph without one is decorative: `aria-hidden="true"`, no role. The
  fallback box is always hidden.
- A clickable `CervixPositionMarker` is focusable and activates on Enter / Space, as `RepresentationCell` does.
- A cell's centred code is drawn as large as fits the cell (up to half its size), never smaller than before: a
  two-character code in a 24 px cell goes from 8.2 px to about 12 px. Long codes keep their size.

## [0.11.0] - 2026-11-05

### Added
- `ComposeOptions.dayContext.inPeriod`: during the period any bleeding is bleeding (method-rules.json), so a
  spotting-band flow (0.08, 0.2) reads as light there. Unset or false keeps spotting, as after the period. Hosts set
  it from their period days (e.g. hds-lib `cyclePhaseAt`).

### Fixed — bleeding bands follow the scale's anchors (B-2026-10-28-15)
- `composeCellInput` reads a `body-vulva-bleeding` flow as the band of its nearest anchor on the data-model scale
  (Spotting 0.08, Very light 0.2, Light 0.35, Moderate 0.55, Heavy 0.75, Very heavy 0.95), the lower one on a
  midpoint, as hds-lib `eventToShortText` and `cyclePhaseAt` do. Very light (0.2) is now spotting, not light:
  model-cervical-fluid `method-rules.json` counts it as spotting after the period, as the Creighton book counts VL.
  Bands: up to 0.275 spotting, up to 0.45 light, up to 0.65 medium, above heavy (were `< 0.15`, `< 0.4`, `< 0.65`).
- `samplePreviewEvents`: the light day is 0.35 (the Light anchor), was 0.25.

### Documentation
- `AGENTS.md`: the worked example's `source.key` is the method id (`femm`), as `composeCellInput` compares it to
  `boundMethod.methodId` (B-2026-10-28-16). A stray `[Unreleased]` heading removed from this file: its entry shipped
  with 0.8.2.

## [0.10.0] - 2026-11-03

A method's chart is now described in its spec, so hosts draw every method the same way.

### Added
- `RepresentationSpec.chart` (`ChartSpec`): `signs`, whether the method charts the temperature, the LH tests, a monitor
  and the cervix (`default` / `optional` / `no`), from model-cervical-fluid `method-rules.json` `shows.signs`
  (literature) for Creighton, Billings, FEMM, Justisse, sympto-thermal, Sensiplan, Chart Neo and Marquette; and
  `monitorItem`, the item the method's monitor writes (Marquette: `fertility-monitor-lh-marquette`). Mira and Apple
  Health have no `shows.signs` yet.
- `RepresentationSpec.offered`: `false` keeps a spec out of hosts' pickers. Chart Neo is not offered until its mucus
  rule is confirmed (`methods.chartneo.fieldRule`).
- `longestCode(spec)`: the widest code or letter a spec writes (Creighton 4), for hosts sizing their day columns.

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
