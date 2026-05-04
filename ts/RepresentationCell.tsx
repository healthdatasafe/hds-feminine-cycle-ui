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
