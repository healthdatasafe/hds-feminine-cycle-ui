# Sympto-thermal, Taking Charge of Your Fertility (`sympto-thermal`)

Rules: model-cervical-fluid `references/rules/method-rules.json`, `methods.sympto-thermal`; source
`references/stm-tcoyf.md`. Converter: data-model `models/cervical-fluid/sympto-thermal`.

## Shipped

- **Notation**: neutral white square, the fluid written short: `D` dry, `S` sticky, `C` creamy, `W` watery, `EW` egg
  white. TCOYF records the fluid in rows, not colours (`stampNote`); the short words follow `periodDays` (decision,
  source Loïc 2026-10-24: "Creamy C, Egg white EW").
- **Period days**: `separate` (`periodDays`, literature: "TCOYF records the period and the cervical fluid on their own
  rows"). The spec consumes the mucus only.
- **Peak**: last day of egg-white or watery fluid (`peak`, hds).
- **Count**: 3 days after the peak (`fertileAfterOvulation.afterPeak`, hds).

## To confirm

- Stamp colours: the rules file's Billings / Creighton stamps are an HDS decision without a source (`stampNote`,
  `colours`). Not used.
- The letter on the peak day (`P`; `peakMark` carries no status).
- The lubricative sensation alone as a peak (cannot be recorded today, `gaps`).
- The coverline (`coverline-rules.json`): not drawn by this package.
