# Creighton Model FertilityCare (CrMS)

Source: [creightonmodel.com](https://creightonmodel.com/)

> Status: **shipped in v0.4**, stamp colours corrected in **v0.9** (B-2026-10-26-11).

The Creighton Model (CrMS) uses square stamps (red / green / white + baby), plus a **textual code** overlaid on each day's stamp (e.g. `8CK`, `10WL`). The codes are a compact alphanumeric grammar describing sensation + lubrication + color.

## Stamp colours (v0.9)

Rules from model-cervical-fluid `references/rules/method-rules.json`, `methods.creighton`, source: Creighton book (FR),
ch. 7 "Instructions de base", pp. 27-33. First matching rule wins:

| Codes | Stamp | Rule (status) |
|---|---|---|
| any code with `B` or `R` | red | `codeRules[0]`: blood seen with the mucus, charted as bleeding (literature) |
| `0`, `2`, `2W`, `4` | green | `codeRules[1]`: "2, 2W, 4 damp, wet, shiny without lubrication (the same meaning as dry)" (hds) |
| every other code (`6…`, `8…`, `10…`) | white + baby | `codeRules[2]`, `[3]` (hds); `stampNote`: "white with a baby for mucus; yellow stamps only in an instructor-led programme for continuous discharge (not used). Mucus days are fertile: the app never colours them yellow." |

Until v0.8, 2 / 2W / 4 and every 6 / 8 code without `L` were yellow ("non-fertile"), against the book
(`hdsDisagreements[0]`). No Creighton stamp is yellow any more.

**Peak** (`peak`, hds): the last day of clear (`K`), lubricative (`L`) or very stretchy (`10`, 2.5 cm or more) mucus,
whatever the quantity (`codeRules[2]`); with a later return of peak-type mucus, only the last peak opens the count.
Marked **P**, then **1, 2, 3** (`fertileAfterOvulation.afterPeak`, hds). `8` is not peak-type (the book keeps
peak-type stretch for `10`; `references/creighton.md` disagrees, `hdsDisagreements[1]`).

**To confirm** (experts' worksheet, "Other open points", Creighton; E1–E4):
- `6CK`, `8CK` (partly clear, C/K) as peak-type (`gaps[1]`): left out of the peak candidates; `10CK` is in through its
  stretch.
- The shade of the `B` / `R` stamps (`gaps[2]`, book ch. 6 unread): kept red.
- The green-baby and yellow-baby stamps (`gaps[0]`, book ch. 6 unread): not used.
- How the HDS bleeding levels map to Creighton's H, M, L, VL, B (E2): every bleeding level is red.

## Visual primitives

Same palette family as Billings (see [billings.md](./billings.md)) with a few differences:

- Peak day is marked with **`P`** (not `X`).
- A frequency suffix (`X1`, `X2`, `X3`, `AD`) is shown next to or under the stamp. v0.2 will likely render this as a separate annotation slot rather than packing it into the cell SVG.

## Mucus options

From `data-model/.../models/cervical-fluid/creighton/v0.json` — **33 options** total. The grammar:

- **Lead digit**: sensation/lubrication class.
  - `0` dry · `2` damp · `2W` wet · `4` shiny · `6` sticky · `8` tacky · `10` stretchy.
- **Letter modifiers** (any combination, alphabetical):
  - `B` brown · `C` cloudy · `K` clear · `G` gummy · `L` lubricative · `P` pasty · `R` red · `Y` yellow · `D` damp · `S` shiny · `W` wet.

The code is the most informative element on a Creighton chart — the color stamp alone doesn't disambiguate. So **the spec must always render the `code` text** (unlike Billings, where the stamp suffices).

## Mapping strategy

The mappingRules table is generated in `ts/specs/creighton.ts` from the option list (`CREIGHTON_OPTIONS`, matching
`creighton/v0.json`) with the code rules above, not from vectors.

## Open choices

- **Frequency suffix** placement. Two options: (a) extend `CellInput` with a `frequency?: string` field; (b) render it outside the SVG as a sibling label. Probably (a) for layout-agnosticness.
- **Long codes**. `10WL` fits at 24 px easily, but `10KL` + an `X1` could overflow. Probably truncate the suffix at 12 px sizes.
- **Cyclefeminin pass-through codes** (`2`, `2W`, `10`) — already routed through Creighton on ingest by `bridge-cyclefeminin-net/src/converters/mucus.js`. No special display handling needed; they'll match `creighton/v0.json` directly.

## Reference images

Planned, not yet committed:

- `docs/images/creighton-chart-row.png` — sample multi-cycle row.
- `docs/images/creighton-codes-legend.png` — legend showing each code's stamp color.
- `docs/images/creighton-frequency.png` — close-up of `X1` / `AD` annotations.

## Sources

- [Creighton Model — main site](https://creightonmodel.com/)
- [FertilityCare Centers of America](https://www.fertilitycare.org/creighton-model-system/)
- [FIAT FertilityCare — Charting Cycles (UK)](https://www.fiatfertilitycare.co.uk/how-we-work/creighton-model/charting-cycles/)
- HDS canonical mucus model: `data-model/.../models/cervical-fluid/creighton/v0.json`
