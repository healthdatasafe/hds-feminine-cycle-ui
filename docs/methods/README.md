# Method display specs: what is sourced

Every display rule in a spec comes from model-cervical-fluid
[`references/rules/method-rules.json`](https://github.com/healthdatasafe/model-cervical-fluid/blob/main/references/rules/method-rules.json)
(the reviewed method specification), with its `status` and `source`. A spec ships a value only when its rule has status
`hds`, `literature`, or `decision` with a source. A rule with status `missing`, `hds-draft` or `app`, or a `decision`
without a source, is left out, or the observation is written as **neutral notation**: the method's own word, letter or
number on a plain white square, no colour, no verdict. Open rules are answered by the experts in
[`references/rules/experts-worksheet.md`](https://github.com/healthdatasafe/model-cervical-fluid/blob/main/references/rules/experts-worksheet.md);
when one is answered there, the spec follows.

HDS charts each method's notation (stamps, codes, the peak mark and the 1, 2, 3 count). It does not decide, show, count
or project fertile or infertile days (`hdsPosition`). `peakNotation` writes the peak and the count; it never says what
they mean for fertility. `detectFertilityWindow` is a display heuristic, not for patient-facing verdicts.

**The peak letter.** Creighton's `P` (the book), Billings' `X` (official key) and Chart Neo's `P` (Data Mapping sheet:
"P, 1, 2, 3") are sourced. For Sensiplan, sympto-thermal, Justisse and Marquette the peak *day* and the count of 3
are sourced (`peak`, `fertileAfterOvulation.afterPeak`, status hds), but the letter written on it is not
(`peakMark` has no status of its own): `P` is used, to confirm.

| Spec | Doc | Colours | Period days | Peak candidates | Count |
|---|---|---|---|---|---|
| `femm` | [femm.md](./femm.md) | draft (unchanged) | unset (draft) | `4` | 3 |
| `billings` | [billings.md](./billings.md) | official key | stamp | `wetSlippery`, `peak` | 3 |
| `creighton` | [creighton.md](./creighton.md) | the book | stamp | K, L, 10 (not C/K) | 3 |
| `mira` | — | unchanged | unset | unchanged | — |
| `sensiplan` | [sensiplan.md](./sensiplan.md) | none (black on white) | separate | `S+` | 3 |
| `sympto-thermal` | [sympto-thermal.md](./sympto-thermal.md) | none (neutral) | separate | `eggWhite`, `watery` | 3 |
| `justisse` | [justisse.md](./justisse.md) | none (neutral) | unset (missing) | `eggWhite`, `watery` | 3 |
| `chartneo` | [chartneo.md](./chartneo.md) | bleeding only | stamp | none: recorded peak | 3 |
| `marquette` | [marquette.md](./marquette.md) | none (neutral) | separate | `8` | 3 |
| `appleHealth` | [apple-health.md](./apple-health.md) | none (neutral) | separate | no peak | — |

`periodDisplay: 'separate'` specs do not consume the bleeding items, so hosts show the bleeding in its own row.
