/**
 * Cervical-position glyph — visual marker for `body-vulva-cervix-position`
 * events. Renders a fixed centered ring (the cervix) plus a horizontal
 * "horizon" bar that moves vertically to encode reach depth, plus an
 * optional orientation tick outside the ring for tilt.
 *
 * The three core dimensions follow HDS convention: 0.0 = least fertile, 1.0
 * = most fertile (SHOW mnemonic — Soft, High, Open, Wet). Tilt is
 * position-only — not a fertility signal.
 *
 *   height    → horizon-bar y-position. Low (0.0) = bar at top (cervix shallow,
 *               little to reach past). High (1.0) = bar at bottom (cervix deep,
 *               long reach above).
 *   firmness  → ring stroke width (thin = soft = fertile).
 *   openness  → ring center hole radius (large hole = open = fertile).
 *   tilt      → orientation tick rotation around ring center. 0 (Straight) =
 *               tick at 12 o'clock; 1 (Tilted) = tick rotated 30° clockwise.
 *               Tick is hidden entirely when tilt is undefined (3d render).
 *
 * Designed to read at 18-32px in timelines, calendar grids, and pickers.
 */

const DEFAULT_SIZE = 28;

const COLOR_FERTILE = '#0d9488'; // teal-600 (fertile signal)
const COLOR_NEUTRAL = '#94a3b8'; // slate-400
const COLOR_HORIZON = '#475569'; // slate-600 (horizon bar — darker than neutral)

export interface CervixPositionMarkerProps {
  /** 0.0 = Low, 0.5 = Medium, 1.0 = High */
  height?: number;
  /** 0.0 = Firm, 0.5 = Medium, 1.0 = Soft */
  firmness?: number;
  /** 0.0 = Closed, 0.5 = Medium, 1.0 = Open */
  openness?: number;
  /** 0.0 = Straight, 0.5 = Medium, 1.0 = Tilted. Position-only — not a
   *  fertility signal. Optional; absence renders as 3d (no tick). */
  tilt?: number;
  size?: number;
  ariaLabel?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Linear interpolation between two values on the 0..1 axis. Returns `a` when
 * `t` is undefined (treats undefined as "no signal" → most-conservative end).
 */
function lerp (a: number, b: number, t: number | undefined): number {
  if (t == null || Number.isNaN(t)) return a;
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

const MAX_TILT_DEG = 30; // tilt=1 → 30° rotation of the orientation tick

export function CervixPositionMarker ({
  height,
  firmness,
  openness,
  tilt,
  size = DEFAULT_SIZE,
  ariaLabel,
  className,
  onClick
}: CervixPositionMarkerProps): React.JSX.Element {
  const half = size / 2;

  // Ring stays centered. Outer radius is fixed; openness drives the inner
  // hole, firmness drives ring stroke width.
  const rOuter = size * 0.28;
  const rHole = lerp(0, size * 0.18, openness);
  const strokeW = lerp(size * 0.16, size * 0.04, firmness);

  // Horizon bar moves with height: Low → top of cell, High → bottom.
  // (Low cervix = shallow reach, horizon high; High cervix = deep, horizon low.)
  const horizonTop = size * 0.18;
  const horizonBottom = size * 0.82;
  const horizonY = lerp(horizonTop, horizonBottom, height);
  const horizonX1 = size * 0.12;
  const horizonX2 = size * 0.88;

  // Hue: average the three signals; if all unknown, stay neutral.
  const known = [height, firmness, openness].filter(v => v != null) as number[];
  const meanFertile = known.length > 0 ? known.reduce((s, v) => s + v, 0) / known.length : 0;
  const ringColor = known.length === 0 ? COLOR_NEUTRAL : interpolateColor(COLOR_NEUTRAL, COLOR_FERTILE, meanFertile);

  const isInteractive = !!onClick;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role={isInteractive ? 'button' : 'img'}
      aria-label={ariaLabel}
      onClick={onClick}
      style={isInteractive ? { cursor: 'pointer' } : undefined}
    >
      {/* Horizon bar — only drawn when height is known. Drawn first so the
          ring sits on top of it when the bar passes through cell center. */}
      {/* Horizon bar — split into left + right halves that stop at the ring's
          edge, with a small gap, so the bar never overlaps the cervix glyph
          even when height is mid-range and the bar passes through cell center. */}
      {height != null && !Number.isNaN(height) && (() => {
        const dy = horizonY - half;
        const ringEdgeOffset = Math.abs(dy) < rOuter
          ? Math.sqrt(rOuter * rOuter - dy * dy)
          : 0;
        const gap = size * 0.05;
        const innerLeft = half - ringEdgeOffset - gap;
        const innerRight = half + ringEdgeOffset + gap;
        const sw = Math.max(1.5, size * 0.06);
        const segments = [];
        if (innerLeft > horizonX1) {
          segments.push(<line key='hl' x1={horizonX1} y1={horizonY} x2={innerLeft} y2={horizonY} stroke={COLOR_HORIZON} strokeWidth={sw} strokeLinecap='round' />);
        }
        if (innerRight < horizonX2) {
          segments.push(<line key='hr' x1={innerRight} y1={horizonY} x2={horizonX2} y2={horizonY} stroke={COLOR_HORIZON} strokeWidth={sw} strokeLinecap='round' />);
        }
        return <>{segments}</>;
      })()}

      {/* Cervix ring (always centered) */}
      <circle
        cx={half}
        cy={half}
        r={rOuter}
        fill='#ffffff'
        stroke={ringColor}
        strokeWidth={strokeW}
      />

      {/* Inner hole — empty when "open", invisible when "closed" */}
      {rHole > 0 && (
        <circle cx={half} cy={half} r={rHole} fill='#ffffff' />
      )}

      {/* Center dot — only when closed (rHole ~ 0): reinforces "closed" reading */}
      {rHole < size * 0.04 && (
        <circle cx={half} cy={half} r={size * 0.05} fill={ringColor} />
      )}

      {/* Tilt orientation tick — small line outside the ring, anchored at the
          ring's top, rotated around the ring center. 0 = vertical (no lean).
          Hidden when tilt is undefined (3d render). */}
      {tilt != null && !Number.isNaN(tilt) && (() => {
        const tickInner = rOuter + strokeW * 0.5 + size * 0.02;
        const tickOuter = tickInner + size * 0.12;
        const angleDeg = lerp(0, MAX_TILT_DEG, tilt);
        return (
          <line
            x1={half}
            y1={half - tickInner}
            x2={half}
            y2={half - tickOuter}
            stroke={COLOR_HORIZON}
            strokeWidth={Math.max(1.2, size * 0.05)}
            strokeLinecap='round'
            transform={`rotate(${angleDeg} ${half} ${half})`}
          />
        );
      })()}
    </svg>
  );
}

function interpolateColor (from: string, to: string, t: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  const tt = Math.max(0, Math.min(1, t));
  const r = Math.round(a.r + (b.r - a.r) * tt);
  const g = Math.round(a.g + (b.g - a.g) * tt);
  const bl = Math.round(a.b + (b.b - a.b) * tt);
  return `rgb(${r}, ${g}, ${bl})`;
}

function parseHex (hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}
