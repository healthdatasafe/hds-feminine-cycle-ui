#!/usr/bin/env node
/**
 * Generate one labelled SVG per built-in representation showing the full
 * option vocabulary (mucus + bleeding + peak day, plus a half-and-half
 * mucus+bleeding sample). Output: docs/images/<id>-options.svg.
 *
 * Hand-renders the primitives (dot-circle, stamp-square) directly as SVG
 * markup — no React/JSDOM. The shapes mirror RepresentationCell.tsx; if
 * you change one, change the other.
 *
 * Run via `npm run docs:images`. The script only depends on the built
 * `js/` (so run `npm run build` first if you've edited specs).
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { registry } from '../js/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'docs', 'images');

const CELL = 32;
const ROW_GAP = 8;
const LABEL_W = 320;
const PADDING = 16;
const LABEL_FONT = 13;

// Human-readable English labels for option keys per method.
// Where the key is already English (Mira, Billings), we just title-case it.
const LABELS = {
  femm: {
    mucus: { 1: 'Dry (1)', 2: 'Pasty (2)', 3: 'Moist (3)', 4: 'Slippery (4)' }
  },
  billings: {
    mucus: { dry: 'Dry', unchanged: 'Basic Infertile Pattern (BIP)', sticky: 'Sticky', cloudyWhite: 'Cloudy / White', wetSlippery: 'Wet & Slippery', peak: 'Peak day (X)' }
  },
  mira: {
    mucus: { Dry: 'Dry', Sticky: 'Sticky', Creamy: 'Creamy', Watery: 'Watery', 'Raw Egg White': 'Raw Egg White' }
  }
};

const BLEEDING_LABELS = {
  heavy: 'Bleeding — heavy',
  medium: 'Bleeding — medium',
  light: 'Bleeding — light',
  spotting: 'Bleeding — spotting',
  brown: 'Brown / dark coloration'
};

const escapeXml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

function dotCircle (size, input) {
  const r = size / 2 - 1;
  const cx = size / 2;
  const cy = size / 2;
  const empty = input.empty || !input.fill;
  const fill = input.fill ?? 'transparent';
  const stroke = empty ? '#888' : 'none';
  const strokeWidth = empty ? 2 : 0;
  const parts = [];
  if (input.halfFill && !empty) {
    parts.push(`<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z" fill="${input.halfFill.color}"/>`);
    parts.push(`<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z" fill="${fill}"/>`);
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#0002" stroke-width="0.5"/>`);
  } else {
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`);
  }
  if (input.centerDot && !empty) {
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${Math.max(2, size * 0.12)}" fill="${input.centerDot.color}"/>`);
  }
  if (input.letter && !empty) {
    parts.push(`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.55}" font-weight="600" fill="#fff">${escapeXml(input.letter)}</text>`);
  }
  return parts.join('');
}

function stampSquare (size, input) {
  const inset = 1;
  const sq = size - 2 * inset;
  const rx = Math.max(2, size * 0.16);
  const empty = input.empty || !input.fill;
  const fill = input.fill ?? 'transparent';
  const isLight = !empty && fill && /^#?(f|e|d|c)/i.test(fill.replace('#', ''));
  const stroke = empty ? '#888' : (isLight ? '#888' : 'none');
  const strokeWidth = empty ? 2 : (isLight ? 1 : 0);
  const overlayFill = isLight ? '#1f2937' : '#fff';
  const parts = [];
  if (input.halfFill && !empty) {
    parts.push(`<rect x="${inset}" y="${inset}" width="${sq / 2}" height="${sq}" rx="${rx}" ry="${rx}" fill="${input.halfFill.color}"/>`);
    parts.push(`<rect x="${inset + sq / 2}" y="${inset}" width="${sq / 2}" height="${sq}" rx="${rx}" ry="${rx}" fill="${fill}"/>`);
    parts.push(`<rect x="${inset}" y="${inset}" width="${sq}" height="${sq}" rx="${rx}" ry="${rx}" fill="none" stroke="#0002" stroke-width="0.5"/>`);
  } else {
    parts.push(`<rect x="${inset}" y="${inset}" width="${sq}" height="${sq}" rx="${rx}" ry="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`);
  }
  if (input.centerDot && !empty) {
    parts.push(`<circle cx="${size / 2}" cy="${size / 2}" r="${Math.max(2, size * 0.14)}" fill="${input.centerDot.color}"/>`);
  }
  if (input.letter && !empty && !input.code) {
    parts.push(`<text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.6}" font-weight="700" fill="${overlayFill}">${escapeXml(input.letter)}</text>`);
  }
  if (input.code && !empty) {
    parts.push(`<text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.36}" font-weight="700" fill="${overlayFill}">${escapeXml(input.code)}</text>`);
  }
  if (input.code && input.letter && !empty) {
    parts.push(`<g><circle cx="${size - inset - 1}" cy="${inset + 1}" r="${size * 0.18}" fill="#fff" stroke="${overlayFill}" stroke-width="0.5"/><text x="${size - inset - 1}" y="${inset + 1}" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.28}" font-weight="700" fill="${overlayFill}">${escapeXml(input.letter)}</text></g>`);
  }
  if (input.baby && !empty) {
    const cx = inset + size * 0.18;
    const cy = inset + size * 0.18;
    const r = size * 0.14;
    const eyeR = Math.max(0.6, size * 0.025);
    parts.push(`<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${overlayFill}" stroke-width="0.7"/><circle cx="${cx - r * 0.35}" cy="${cy - r * 0.1}" r="${eyeR}" fill="${overlayFill}"/><circle cx="${cx + r * 0.35}" cy="${cy - r * 0.1}" r="${eyeR}" fill="${overlayFill}"/><path d="M ${cx - r * 0.45} ${cy + r * 0.2} Q ${cx} ${cy + r * 0.6} ${cx + r * 0.45} ${cy + r * 0.2}" fill="none" stroke="${overlayFill}" stroke-width="0.7" stroke-linecap="round"/></g>`);
  }
  return parts.join('');
}

function renderCell (rep, input) {
  if (rep.spec.primitive === 'dot-circle') return dotCircle(CELL, input);
  return stampSquare(CELL, input);
}

function inputFromFragment (rep, frag) {
  return {
    fill: frag.fill ? rep.resolveColor(frag.fill) : undefined,
    letter: frag.letter,
    code: frag.code,
    centerDot: frag.centerDot ? { color: rep.resolveColor(frag.centerDot.color) } : undefined,
    baby: frag.baby
  };
}

function renderRow (rep, label, input, y) {
  const cellX = PADDING + LABEL_W;
  const cellY = y;
  const labelY = cellY + CELL / 2;
  return `<g transform="translate(${cellX}, ${cellY})">${renderCell(rep, input)}</g>` +
    `<text x="${PADDING}" y="${labelY}" font-size="${LABEL_FONT}" dominant-baseline="central" fill="#1f2937" font-family="system-ui, -apple-system, sans-serif">${escapeXml(label)}</text>`;
}

function buildRows (rep) {
  const rows = []; // [{ label, input }]
  const id = rep.spec.id;
  const labelsForMethod = LABELS[id]?.mucus ?? {};

  // Mucus options
  const mucusKeys = Object.keys(rep.spec.mappingRules?.mucus ?? {});
  for (const key of mucusKeys) {
    const frag = rep.spec.mappingRules.mucus[key];
    const label = labelsForMethod[key] ?? key;
    rows.push({ label, input: inputFromFragment(rep, frag) });
  }

  // Bleeding states (deduplicate visually identical fills/letters)
  const bleedingFrags = rep.spec.mappingRules?.bleeding ?? {};
  const seen = new Set();
  for (const key of Object.keys(bleedingFrags)) {
    const frag = bleedingFrags[key];
    const sig = `${frag.fill}|${frag.letter ?? ''}|${frag.code ?? ''}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    rows.push({ label: BLEEDING_LABELS[key] ?? `Bleeding — ${key}`, input: inputFromFragment(rep, frag) });
  }

  // Brown / dark coloration (substate)
  const subFrags = rep.spec.mappingRules?.bleedingSubstate ?? {};
  for (const key of Object.keys(subFrags)) {
    rows.push({ label: BLEEDING_LABELS[key] ?? `Bleeding (${key})`, input: inputFromFragment(rep, subFrags[key]) });
  }

  // Peak day (uses mucus.peak rule when present, otherwise centerDot peakMarker)
  const peakRule = rep.spec.mappingRules?.mucus?.peak;
  if (peakRule) {
    rows.push({ label: 'Peak day', input: inputFromFragment(rep, peakRule) });
  } else if (rep.spec.peakMarker?.primitive === 'centerDot' && mucusKeys.length > 0) {
    // Synthesize: highest-value mucus option + centerDot
    const highKey = mucusKeys[mucusKeys.length - 1];
    const highFrag = rep.spec.mappingRules.mucus[highKey];
    const peakColor = rep.resolveColor(rep.spec.peakMarker.color ?? 'peak');
    rows.push({
      label: 'Peak day',
      input: { ...inputFromFragment(rep, highFrag), centerDot: { color: peakColor } }
    });
  }

  // Half-and-half (mucus + bleeding) when the spec opts in
  if (rep.spec.halfSplit?.enabled && mucusKeys.length > 0 && Object.keys(bleedingFrags).length > 0) {
    const mucusKey = mucusKeys[Math.floor(mucusKeys.length / 2)] || mucusKeys[0];
    const bleedKey = Object.keys(bleedingFrags).includes('medium') ? 'medium' : Object.keys(bleedingFrags)[0];
    const mucusFrag = rep.spec.mappingRules.mucus[mucusKey];
    const bleedFrag = bleedingFrags[bleedKey];
    rows.push({
      label: `Mixed day — ${labelsForMethod[mucusKey] ?? mucusKey} + ${BLEEDING_LABELS[bleedKey] ?? bleedKey}`,
      input: {
        fill: rep.resolveColor(mucusFrag.fill),
        halfFill: { color: rep.resolveColor(bleedFrag.fill) }
      }
    });
  }

  return rows;
}

function svgFor (rep) {
  const rows = buildRows(rep);
  const width = PADDING * 2 + LABEL_W + CELL;
  const height = PADDING * 2 + rows.length * (CELL + ROW_GAP) - ROW_GAP;
  const body = rows.map((r, i) => renderRow(rep, r.label, r.input, PADDING + i * (CELL + ROW_GAP))).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(rep.spec.id)} — visual vocabulary">
  <title>${escapeXml(rep.spec.id)} — visual vocabulary</title>
  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
  ${body}
</svg>
`;
}

// Special: Creighton — render all 33 codes as a 6×6-ish grid (no labels, codes are inside the stamp)
function svgCreightonGrid (rep) {
  const codes = Object.keys(rep.spec.mappingRules?.mucus ?? {});
  const cols = 7;
  const rows = Math.ceil(codes.length / cols);
  const cellSize = 36;
  const gap = 10;
  const width = PADDING * 2 + cols * (cellSize + gap) - gap;
  const height = PADDING * 2 + rows * (cellSize + gap) - gap;
  const body = codes.map((code, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = PADDING + c * (cellSize + gap);
    const y = PADDING + r * (cellSize + gap);
    const frag = rep.spec.mappingRules.mucus[code];
    return `<g transform="translate(${x}, ${y})">${stampSquare(cellSize, inputFromFragment(rep, frag))}</g>`;
  }).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Creighton 33-code grid">
  <title>Creighton 33-code grid</title>
  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
  ${body}
</svg>
`;
}

// ── CervixPositionMarker — re-render sample 3-D vector glyphs.
// Mirrors ts/CervixPositionMarker.tsx; if you change the glyph there,
// update this function too.

const CP_FERTILE = '#0d9488';
const CP_NEUTRAL = '#94a3b8';
const CP_HORIZON = '#475569';

function lerp (a, b, t) {
  if (t == null || Number.isNaN(t)) return a;
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function parseHex (hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function interpolateColor (from, to, t) {
  const a = parseHex(from);
  const b = parseHex(to);
  const tt = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(a.r + (b.r - a.r) * tt)}, ${Math.round(a.g + (b.g - a.g) * tt)}, ${Math.round(a.b + (b.b - a.b) * tt)})`;
}

function cervixGlyph (size, height, firmness, openness) {
  const half = size / 2;
  const rOuter = size * 0.28;
  const rHole = lerp(0, size * 0.18, openness);
  const strokeW = lerp(size * 0.16, size * 0.04, firmness);
  const horizonTop = size * 0.18;
  const horizonBottom = size * 0.82;
  const horizonY = lerp(horizonTop, horizonBottom, height);
  const horizonX1 = size * 0.12;
  const horizonX2 = size * 0.88;
  const known = [height, firmness, openness].filter(v => v != null);
  const meanFertile = known.length > 0 ? known.reduce((s, v) => s + v, 0) / known.length : 0;
  const ringColor = known.length === 0 ? CP_NEUTRAL : interpolateColor(CP_NEUTRAL, CP_FERTILE, meanFertile);
  const parts = [];
  if (height != null && !Number.isNaN(height)) {
    const dy = horizonY - half;
    const ringEdgeOffset = Math.abs(dy) < rOuter ? Math.sqrt(rOuter * rOuter - dy * dy) : 0;
    const gap = size * 0.05;
    const innerLeft = half - ringEdgeOffset - gap;
    const innerRight = half + ringEdgeOffset + gap;
    const sw = Math.max(1.5, size * 0.06);
    if (innerLeft > horizonX1) {
      parts.push(`<line x1="${horizonX1}" y1="${horizonY}" x2="${innerLeft}" y2="${horizonY}" stroke="${CP_HORIZON}" stroke-width="${sw}" stroke-linecap="round"/>`);
    }
    if (innerRight < horizonX2) {
      parts.push(`<line x1="${innerRight}" y1="${horizonY}" x2="${horizonX2}" y2="${horizonY}" stroke="${CP_HORIZON}" stroke-width="${sw}" stroke-linecap="round"/>`);
    }
  }
  parts.push(`<circle cx="${half}" cy="${half}" r="${rOuter}" fill="#ffffff" stroke="${ringColor}" stroke-width="${strokeW}"/>`);
  if (rHole > 0) {
    parts.push(`<circle cx="${half}" cy="${half}" r="${rHole}" fill="#ffffff"/>`);
  }
  if (rHole < size * 0.04) {
    parts.push(`<circle cx="${half}" cy="${half}" r="${size * 0.05}" fill="${ringColor}"/>`);
  }
  return parts.join('');
}

function svgCervixSamples () {
  // A representative 5-cell strip from infertile → fertile. NOT exhaustive
  // (the value space is continuous 3-D); shows how the glyph reads at a few
  // canonical SHOW combinations.
  const samples = [
    { label: 'Low · Firm · Closed (infertile)', h: 0.0, f: 0.0, o: 0.0 },
    { label: 'Low · Medium · Closed', h: 0.0, f: 0.5, o: 0.0 },
    { label: 'Medium · Medium · Medium', h: 0.5, f: 0.5, o: 0.5 },
    { label: 'High · Medium · Open', h: 1.0, f: 0.5, o: 1.0 },
    { label: 'High · Soft · Open (peak fertile)', h: 1.0, f: 1.0, o: 1.0 }
  ];
  const cellSize = 36;
  const rowH = cellSize + ROW_GAP;
  const width = PADDING * 2 + LABEL_W + cellSize;
  const height = PADDING * 2 + samples.length * rowH - ROW_GAP;
  const body = samples.map((s, i) => {
    const cellY = PADDING + i * rowH;
    const cellX = PADDING + LABEL_W;
    return `<g transform="translate(${cellX}, ${cellY})">${cervixGlyph(cellSize, s.h, s.f, s.o)}</g>` +
      `<text x="${PADDING}" y="${cellY + cellSize / 2}" font-size="${LABEL_FONT}" dominant-baseline="central" fill="#1f2937" font-family="system-ui, -apple-system, sans-serif">${escapeXml(s.label)}</text>`;
  }).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Cervical position — sample glyphs">
  <title>Cervical position — sample glyphs (height · firmness · openness)</title>
  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
  ${body}
</svg>
`;
}

function main () {
  const reps = registry.list();
  for (const rep of reps) {
    const id = rep.spec.id;
    const out = join(OUT_DIR, `${id}-options.svg`);
    writeFileSync(out, svgFor(rep));
    console.log(`wrote ${out}`);
    if (id === 'creighton') {
      const grid = join(OUT_DIR, 'creighton-codes-grid.svg');
      writeFileSync(grid, svgCreightonGrid(rep));
      console.log(`wrote ${grid}`);
    }
  }
  const cervixOut = join(OUT_DIR, 'cervix-position-samples.svg');
  writeFileSync(cervixOut, svgCervixSamples());
  console.log(`wrote ${cervixOut}`);
}

main();
