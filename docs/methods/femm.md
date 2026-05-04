# FEMM

Source: [femmhealth.org](https://femmhealth.org/)

The FEMM app charts cycle data as a vertical column of **circles**, one per day. Bleeding, brown spotting, and mucus collapse into a single colored circle per day, with optional `M` / `L` letters for bleeding intensity and a center-dot marker for fertile / peak days. When a day carries two states (e.g. spotting + mucus), the circle splits half-and-half.

## When to use

Best for:
- Users who already track in the FEMM app.
- Apps that want the modern, single-screen, "scrub through days" feel.
- Compact display — one circle per day takes ~24 px.

Less good for:
- Power users who want explicit Creighton-style codes.
- Practitioners who need the long-form descriptive sticker chart.

## Reference images

Sample charts from FEMM are not yet committed (license tracking pending). When added, they will live at:

- `docs/images/femm-cycle-vertical.png` — the in-app vertical-column view (one cycle).
- `docs/images/femm-multicycle.png` — the printable multi-cycle PDF.
- `docs/images/femm-half-split.png` — close-up of the half-and-half cell for transition days.

Once the files exist, the README will reference `docs/images/femm-cycle-vertical.png` directly.

## Visual primitives

| Color (palette key) | Hex      | Meaning                    |
|---------------------|----------|----------------------------|
| `dry`               | `#A8A8A8`| Dry day                    |
| `pasty`             | `#F2A03D`| Pasty mucus (FEMM 2)       |
| `moist`             | `#7BB7E0`| Moist mucus (FEMM 3)       |
| `slippery`          | `#3B6FB6`| Slippery mucus (FEMM 4)    |
| `fertile`           | `#3B6FB6`| Fertile-window day         |
| `peak`              | `#1F3B7A`| Peak day (last slippery)   |
| `bleedingHeavy`     | `#C8155A`| Bleeding heavy / medium    |
| `bleedingLight`     | `#C8155A`| Bleeding light             |
| `spotting`          | `#F4A2BD`| Spotting (light pink)      |
| `brown`             | `#7A4A2B`| Brown spotting (substate)  |

Palette values are **draft**. A designer pass against the official FEMM screenshots is queued before v1.0; the keys won't change.

## Mucus options (mapping)

The mucus axis matches `data-model/.../models/cervical-fluid/femm/v0.json`:

| Source value | Label    | Renders as |
|--------------|----------|-----------|
| `1`          | Dry      | grey       |
| `2`          | Pasty    | orange     |
| `3`          | Moist    | light blue |
| `4`          | Slippery | medium blue|

## Bleeding options (mapping)

Bleeding intensity comes from the canonical `body-vagina-bleeding` stream. Values:

| Source value | Renders as                |
|--------------|---------------------------|
| `heavy`      | magenta + `M` letter      |
| `medium`     | magenta + `M` letter      |
| `light`      | magenta + `L` letter      |
| `spotting`   | light pink (no letter)    |

Brown-substate (`bleeding-brown-dark` stream) renders as the brown swatch and overrides bleeding when present on the same day.

## Composition rules

- **Precedence (lowest→highest)**: `mucus` → `bleeding` → `bleedingSubstate`. Brown wins everything.
- **Half-split** active for the pairs `(mucus, bleeding)` and `(mucus, bleedingSubstate)`. So a day with mucus + bleeding shows half magenta with `M`, half mucus color.
- **Peak day** is derived (not stored): the last slippery day in the cycle. Renders a dark-blue center dot on top of the slippery cell. Threshold: `lubricative ≥ 0.7 AND stretchability ≥ 0.7` against the event vector. Peak detection is implemented in v0.2; v0.1 cells render without it.

## Spec location

Source of truth: `ts/specs/femm.ts`. Re-exported from the package as `femmSpec`.

## Sources

- [FEMM Health — main site](https://femmhealth.org/)
- HDS canonical mucus model: `data-model/.../models/cervical-fluid/femm/v0.json`
- Ingest converter for cyclefeminin → FEMM (vector-borrowing pattern reused for force-conversion): `bridge-cyclefeminin-net/src/converters/mucus.js`
