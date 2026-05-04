import { registry } from './registry.ts';
import type { CellProps } from './types.ts';

export type { CellProps };

const DEFAULT_SIZE = 24;

export function RepresentationCell (props: CellProps): React.JSX.Element {
  const rep = registry.get(props.representationId);
  if (!rep) {
    return <FallbackBox size={props.size ?? DEFAULT_SIZE} className={props.className} />;
  }
  if (rep.spec.primitive === 'dot-circle') {
    return <DotCircle {...props} />;
  }
  if (rep.spec.primitive === 'stamp-square') {
    return <StampSquare {...props} />;
  }
  return <FallbackBox size={props.size ?? DEFAULT_SIZE} className={props.className} />;
}

function FallbackBox ({ size, className }: { size: number; className?: string }): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <rect x={1} y={1} width={size - 2} height={size - 2} fill='none' stroke='#999' strokeDasharray='2 2' />
    </svg>
  );
}

function DotCircle (props: CellProps): React.JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  const { input, onClick, ariaLabel, className } = props;
  const r = size / 2 - 1;
  const cx = size / 2;
  const cy = size / 2;

  const empty = input.empty || !input.fill;
  const fill = input.fill ?? 'transparent';
  const stroke = empty ? '#888' : 'none';
  const strokeWidth = empty ? 2 : 0;
  const interactive = onClick != null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role={interactive ? 'button' : 'img'}
      aria-label={ariaLabel}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive
        ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }
        : undefined}
      className={className}
      style={interactive ? { cursor: 'pointer' } : undefined}
    >
      {input.halfFill && !empty && (
        <path
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`}
          fill={input.halfFill.color}
        />
      )}
      {!input.halfFill && (
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      )}
      {input.halfFill && (
        <>
          <path
            d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`}
            fill={fill}
          />
          <circle cx={cx} cy={cy} r={r} fill='none' stroke='#0002' strokeWidth={0.5} />
        </>
      )}
      {input.centerDot && !empty && (
        <circle cx={cx} cy={cy} r={Math.max(2, size * 0.12)} fill={input.centerDot.color} />
      )}
      {input.letter && !empty && (
        <text
          x={cx}
          y={cy}
          textAnchor='middle'
          dominantBaseline='central'
          fontSize={size * 0.55}
          fontWeight='600'
          fill='#fff'
          style={{ userSelect: 'none' }}
        >
          {input.letter}
        </text>
      )}
      {input.code && !empty && !input.letter && (
        <text
          x={cx}
          y={cy}
          textAnchor='middle'
          dominantBaseline='central'
          fontSize={size * 0.34}
          fontWeight='600'
          fill='#fff'
          style={{ userSelect: 'none' }}
        >
          {input.code}
        </text>
      )}
    </svg>
  );
}

function StampSquare (props: CellProps): React.JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  const { input, onClick, ariaLabel, className } = props;
  const inset = 1;
  const sq = size - 2 * inset;
  const rx = Math.max(2, size * 0.16);

  const empty = input.empty || !input.fill;
  const fill = input.fill ?? 'transparent';
  // Light stamps (whites) need a visible border so they don't disappear on a light background.
  const isLight = !empty && fill && /^#?(f|e|d|c)/i.test(fill.replace('#', ''));
  const stroke = empty ? '#888' : (isLight ? '#888' : 'none');
  const strokeWidth = empty ? 2 : (isLight ? 1 : 0);
  const interactive = onClick != null;

  // Letter overlay color: dark for light stamps, white for dark stamps.
  const overlayFill = isLight ? '#1f2937' : '#fff';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role={interactive ? 'button' : 'img'}
      aria-label={ariaLabel}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive
        ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }
        : undefined}
      className={className}
      style={interactive ? { cursor: 'pointer' } : undefined}
    >
      {input.halfFill && !empty && (
        <rect x={inset} y={inset} width={sq / 2} height={sq} rx={rx} ry={rx} fill={input.halfFill.color} />
      )}
      {!input.halfFill && (
        <rect x={inset} y={inset} width={sq} height={sq} rx={rx} ry={rx} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      )}
      {input.halfFill && (
        <>
          <rect x={inset + sq / 2} y={inset} width={sq / 2} height={sq} rx={rx} ry={rx} fill={fill} />
          <rect x={inset} y={inset} width={sq} height={sq} rx={rx} ry={rx} fill='none' stroke='#0002' strokeWidth={0.5} />
        </>
      )}
      {input.centerDot && !empty && (
        <circle cx={size / 2} cy={size / 2} r={Math.max(2, size * 0.14)} fill={input.centerDot.color} />
      )}
      {input.letter && !empty && (
        <text
          x={size / 2}
          y={size / 2}
          textAnchor='middle'
          dominantBaseline='central'
          fontSize={size * 0.6}
          fontWeight='700'
          fill={overlayFill}
          style={{ userSelect: 'none' }}
        >
          {input.letter}
        </text>
      )}
      {input.code && !empty && !input.letter && (
        <text
          x={size / 2}
          y={size / 2}
          textAnchor='middle'
          dominantBaseline='central'
          fontSize={size * 0.36}
          fontWeight='700'
          fill={overlayFill}
          style={{ userSelect: 'none' }}
        >
          {input.code}
        </text>
      )}
    </svg>
  );
}
