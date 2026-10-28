# Marquette (`marquette`)

Rules: model-cervical-fluid `references/rules/method-rules.json`, `methods.marquette`; source
`references/marquette.md`. Converter: data-model `models/cervical-fluid/marquette` (the 1 to 8 mucus scale).

## Shipped

- **Notation**: neutral white square with the mucus number `1` … `8` (the data model's scale).
- **Period days**: `separate` (`periodDays`, literature: "Marquette charts the bleeding, the monitor readings and the
  mucus numbers apart"). The spec consumes the mucus only.
- **Peak, mucus only**: the mucus peak day (`peak`, hds); `8` is the only peak-type number with status hds.
- **Count**: 3 days after the peak (`fertileAfterOvulation.afterPeak`, hds).

## To confirm (experts' worksheet, `methods.marquette.*`)

- **Levels** Low / High / Peak, their colours, and the 1–8 ↔ Low / High / Peak mapping (`levels`, status app:
  Marquette NFP Pro screenshots; `levels.mucusScaleNote`). Not shipped.
- `observations[1]` (2, missing), `[5]` (6, missing), `[6]` (7, hds-draft): dry or peak-type. 7 is not a peak
  candidate until answered.
- `fertileStart` (hds-draft).
- The monitor's Peak as the peak day (`peak`: "the monitor's Peak (the LH surge)"): the monitor reading
  (`fertility-monitor-lh-marquette`) is not consumed by this spec; hosts read it in its own row.
- Colours (`colours`, decision without a source). The letter on the peak day (`P`; `peakMark` carries no status).
