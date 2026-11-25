// Writes docs/cycle-chart.html: <CycleChart> on made-up records, at 35 and at 7 columns. `npm run build` first.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildCycleChart, CycleChart, registry } from '../js/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DAY = 86400;
const noon = (date) => Date.parse(`${date}T12:00:00Z`) / 1000;
const event = (item, time, content, extra = {}) => ({ time, streamIds: [item], type: 'x', content, ...extra });
const mucus = (time, code, frequency, key = 'creighton') => event('body-vulva-mucus-inspect', time, { source: { key, sourceData: code, annotations: { frequency } } });

/** A cycle as "H", "L 6C X1", "10KL X2 P" … one entry a day; '' for a day with nothing recorded. */
function cycle (startDate, days) {
  const start = noon(startDate);
  const out = [event('fertility-cycles-start', start, null)];
  days.forEach((entry, i) => {
    const time = start + i * DAY;
    for (const observation of entry.split(' + ')) {
      const words = observation.split(' ').filter(Boolean);
      while (['H', 'M', 'L', 'VL', 'B', 'SPOT'].includes(words[0])) {
        const letter = words.shift();
        if (letter === 'B') out.push(event('body-vulva-bleeding-browndark', time, null));
        else out.push(event('body-vulva-bleeding', time, { H: 0.75, M: 0.55, L: 0.35, VL: 0.2, SPOT: 0.08 }[letter]));
      }
      if (words.at(-1) === 'P') { words.pop(); out.push(event('fertility-cycles-peak-day', time, null)); }
      if (words.at(-1)?.startsWith('stamp:')) out.push(event('fertility-cycles-chart-stamp', time, { method: 'creighton', stamp: words.pop().slice(6) }, { type: 'fertility/chart-stamp-v1' }));
      if (words.at(-1) === 'FEMM') out.push(mucus(time, 2, undefined, 'femm'));
      else if (words.length) out.push(mucus(time, words[0], words[1]));
    }
  });
  return out;
}

const events = [
  mucus(noon('2025-12-30'), '2', 'X1'),
  ...cycle('2026-01-05', ['H', 'H', 'M', 'L 0 AD', 'VL 0 AD', 'B 2 X1', '0 AD', '0 AD', '2 X1', '6C X1', '6C X2', '', '8CK X2', '10KL X2', '10GCKL X3', '10WL AD P', '4 X1', '2 X2', '0 AD', '0 AD', '0 AD', '', '0 AD', '2 X1', '0 AD', '0 AD', '0 AD', 'VL 0 AD']),
  ...cycle('2026-02-02', ['M', 'H', 'H', 'M', 'L 2 X1', 'SPOT', '0 AD', '0 AD', '6C X1 stamp:yellow-baby', '6C X1 stamp:yellow-baby', '', '', '8C X1 + 0 X1', '8C X1', '8K X2', '10C X1', '10K X1', '10KL X1 P', 'FEMM', '0 AD', '0 AD', '0 AD', '2 X1', '0 AD', '0 AD', '0 AD', '0 AD', '0 AD', '0 AD', '', '', '0 AD', '0 AD', '0 AD', '0 AD', '0 AD', '0 AD', '0 AD', '0 AD', 'VL 0 AD', 'B 0 AD']),
  ...cycle('2026-03-15', ['H', 'H', 'M', 'L 0 AD', '0 AD', '0 AD', '2 X1', '6C X1', '10KL X1', '0 AD'])
];
const dayOf = (e) => new Date(e.time * 1000).toISOString().slice(0, 10);
const model = buildCycleChart(events, registry.get('creighton'), { dayOf, today: '2026-03-26', computedPeak: true });
const chart = (props) => renderToStaticMarkup(h(CycleChart, { model, ...props }));

writeFileSync(join(root, 'docs', 'cycle-chart.html'), `<!doctype html>
<!-- Written by scripts/render-cycle-chart.mjs. Made-up records. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CycleChart</title>
<style>
@page { size: A4 landscape; margin: 10mm; }
body { font-family: system-ui, sans-serif; margin: 1rem; background: #fff; }
.phone { max-width: 343px; }
@media print { body { margin: 0; } .screen { display: none; } }
${readFileSync(join(root, 'css', 'cycle-chart.css'), 'utf8')}</style>
</head>
<body>
<main>
<h1 class="screen">CycleChart, made-up records</h1>
${chart({})}
<div class="screen">
<h2>7 columns, in French, the latest first</h2>
<div class="phone">
${chart({ columns: 7, lang: 'fr', newestFirst: true })}
</div>
</div>
</main>
</body>
</html>
`);
