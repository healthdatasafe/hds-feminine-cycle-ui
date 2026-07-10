# Billings

> Status: **planned for v0.2**. This page captures design choices ahead of implementation so reviewers can sanity-check the palette and rules before code lands.

> HDS is not affiliated with, endorsed by, or licensed by the organizations teaching this method. This spec renders users' own observations in the charting style described in the published literature (see Sources).

The Billings method charts cycle days on a horizontal grid, one cycle per row. Each day cell carries a stamp (red / green / white / yellow), an optional baby-icon overlay (post-Peak counting days), and an `X` overlay on the Peak day.

## Visual primitives

| Color (palette key) | Standard color | Meaning                                       |
|---------------------|---------------|-----------------------------------------------|
| `bleedingRed`       | red           | Bleeding (menstruation, spotting)             |
| `dryGreen`          | green         | Dry (Basic Infertile Pattern of dryness)      |
| `discharge`         | white         | Any discharge / change from BIP               |
| `dischargeBip`      | yellow        | BIP of unchanging discharge                   |
| `peak`              | _layer_       | `X` letter overlay (peak day)                 |
| `babyGreen`         | green + baby  | Post-Peak day 1/2/3, dry                      |
| `babyYellow`        | yellow + baby | Post-Peak day 1/2/3, mucus but not slippery   |

## Mucus options (mapping)

From `data-model/.../models/cervical-fluid/billings/v0.json` — six options:

| Source value     | Renders as              |
|------------------|------------------------|
| `dry`            | green                   |
| `unchanged`      | yellow (BIP)            |
| `sticky`         | white                   |
| `cloudyWhite`    | white                   |
| `wetSlippery`    | white                   |
| `peak`           | white + `X` overlay     |

## Bleeding mapping

Bleeding **always** wins over mucus (red overrides white/green/yellow). Brown spotting renders red; the substate distinction is dropped on the Billings card (Billings's chart doesn't differentiate brown from regular bleeding).

## Open choices

- **Baby icon** — needs an asset (`docs/images/baby-glyph.svg`) shared between green-baby and yellow-baby stamps. Inline-SVG path or a small PNG?
- **Counting-day numbers** — Billings overlays `1` / `2` / `3` on the post-Peak baby stamps. Use the `code` field of CellInput? Add a new `numberOverlay` field?
- **`X` peak letter** — sits *on top* of the white stamp. Already supported by `CellInput.letter`; no new primitive needed.

## Reference images

Planned, not yet committed — all rendered by us from our own specs and sample data (do **not** reproduce third-party chart images or legends):

- `docs/images/billings-chart-row.png` — illustrative multi-cycle row, own rendering.
- `docs/images/billings-stamps-legend.png` — legend of our stamp vocabulary, own rendering.
- `docs/images/billings-peak-x.png` — close-up of the `X` peak overlay.

## Sources

Design derived from the method as described in the published literature; HDS is not affiliated with the method's organizations.

- Billings ovulation method — published descriptions and peer-reviewed literature (e.g. [Wikipedia overview](https://en.wikipedia.org/wiki/Billings_ovulation_method) and references therein)
- HDS canonical mucus model: `data-model/.../models/cervical-fluid/billings/v0.json`
- HDS method reference notes: `model-cervical-fluid/references/billings.md`
