# Apple Health (`appleHealth`)

A HealthKit scale (`HKCategoryValueCervicalMucusQuality`), not a method. Rules: model-cervical-fluid
`references/rules/method-rules.json`, `methods.appleHealth`; source `references/apple-health.md`. Converter: data-model
`models/cervical-fluid/appleHealth`.

## Shipped

- **Notation**: neutral white square, each value written short: `D` dry, `S` sticky, `C` creamy, `W` watery, `EW` egg
  white (`periodDays`, decision, source Loïc 2026-10-24: "display creamy the way Apple would do").
- **Period days**: `separate` (`periodDays`, literature: HealthKit keeps the menstrual flow and the mucus quality as
  separate data). The spec consumes the mucus only.
- **No peak, no count**: "None (a scale, no rule)" (`peak`, hds). The spec has no `peakMarker`.

## Left out

- Categories and colours of the observations (status decision, no source).
