# Creighton Model FertilityCare (CrMS)

Source: [creightonmodel.com](https://creightonmodel.com/)

> Status: **planned for v0.2**. This page captures design choices ahead of implementation.

The Creighton Model (CrMS) uses the same family of square stamps as Billings (red / green / white / yellow + baby), plus a **textual code** overlaid on each day's stamp (e.g. `8CK`, `10WL`). The codes are a compact alphanumeric grammar describing sensation + lubrication + color.

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

Because Creighton's option set is large, the mappingRules table is verbose. We will generate it from the canonical `creighton/v0.json` rather than hand-write it:

```ts
import creightonModel from 'data-model/.../models/creighton/v0.json' assert { type: 'json' };

mappingRules.mucus = Object.fromEntries(
  creightonModel.components[0].options.map((opt) => [
    opt.value,
    { fill: pickStampColor(opt), code: opt.value }
  ])
);
```

`pickStampColor(opt)` infers the stamp from `opt.vector`:
- `lubricative ≥ 0.7 ∨ stretchability ≥ 0.7` → fertile-class → white.
- `color ≥ 0.7` → bleeding-class → red.
- `mucusVolume > 0 ∧ ¬fertile-class` → BIP → yellow.
- `mucusVolume = 0` → dry → green.

Thresholds need a designer pass; ballpark values above.

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
