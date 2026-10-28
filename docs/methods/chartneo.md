# Chart Neo / NeoFertility (`chartneo`)

Rules: model-cervical-fluid `references/rules/method-rules.json`, `methods.chartneo`. Converter: data-model
`models/cervical-fluid/chartneo` (multi-field: walking, wiping, inspect, test).

## Shipped

- **Bleeding**: red sticker `#E8341C`, spotting `#EF9A9A` (`colours`, literature: NeoFertility introduction slides 2026).
- **Period days**: `stamp` (`periodDays`, literature: "Chart Neo puts a red sticker on the days of bleeding").
- **Peak**: computed by Chart Neo, "can be overridden" (`peak`, hds, Data Mapping Chartneo - HDS): the peak comes from
  the recorded `fertility-cycles-peak-day` only (`peakMarker.compute: 'none'`), marked `P`.
- **Count**: `P, 1, 2, 3` as notation (the Data Mapping sheet). What the count means is open
  (`fertileAfterOvulation`, missing).

## To confirm (experts' worksheet, `methods.chartneo.*`)

- `fieldRule` (hds-draft): reading the day's fields as dry / mucus / peak-type. With it: the dry `#8dc63f` and mucus
  `#2aa9e0` colours and peak candidates. The data model's chartneo labels do not match Chart Neo's own field list
  (`hdsDisagreements`). **The mucus is not drawn in the cell yet.**
- `fertileAfterOvulation`, `fertileStart`, `temperature` (missing).
