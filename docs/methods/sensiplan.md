# Sensiplan (`sensiplan`)

Rules: model-cervical-fluid `references/rules/method-rules.json`, `methods.sensiplan`; source
`references/sensiplan.md`. Converter: data-model `models/cervical-fluid/sensiplan` (in the pack since 3.24.0).

## Shipped

- **Notation**: the method's letters, black on a white square: `t`, `ø`, `f`, `S`, `S+` (`observations[*].mark`, hds;
  `stampNote`: "Sensiplan writes letters, black and white"). No colour.
- **Period days**: `separate` (`periodDays`, literature: "Sensiplan writes the bleeding and the mucus letters on their
  own lines"). The spec consumes the mucus only.
- **Peak**: last day of the best mucus quality, `S+` (`peak`, hds; `S+` is the only `peakType` observation).
- **Count**: 3 days after the peak (`fertileAfterOvulation.afterPeak`, hds: "3 days of lower quality").

## To confirm

- A cycle whose best quality is `S` (no `S+`): `references/sensiplan.md` puts the peak on the best quality observed,
  the rules file counts `S` as non-peak. Today such a cycle shows no peak.
- The letter on the peak day (`P`; `peakMark` carries no status).
- The `f` label: "Mucus seen" in the definition, moist sensation in `sensiplan.md` (`hdsDisagreements`).
- The bleeding colours (`colours`, decision without a source): not used.
- The temperature (3 over 6, `coverline-rules.json`): not drawn by this package.
