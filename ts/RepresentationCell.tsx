import { registry } from './registry.ts';
import { cellA11y, fittedFontSize } from './cellA11y.ts';
import { stampBadge, stampColours, stampTextLayout, textOn } from './stampStyle.ts';
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden='true'>
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
  const visibleText = empty ? undefined : (input.letter ?? input.code);
  const textFill = textOn(input.fill, input.halfFill?.color);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      {...cellA11y(interactive, ariaLabel, visibleText)}
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
          fill={textFill}
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
          fontSize={fittedFontSize(size, input.code, 0.34, 0.5)}
          fontWeight='600'
          fill={textFill}
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

  const empty = !!input.empty || !input.fill;
  const fill = input.fill ?? 'transparent';
  const { overlay: overlayFill, stroke, strokeWidth } = stampColours(input.fill, empty);
  const interactive = onClick != null;
  const text = stampTextLayout(size, input);
  const badge = stampBadge(size);
  const visibleText = empty ? undefined : (input.code ? [input.code, input.frequency].filter(Boolean).join(' ') : input.letter);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      {...cellA11y(interactive, ariaLabel, visibleText)}
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
      {/* Center text: letter wins when alone; code wins when alone; if BOTH,
          code stays centered and the letter renders as a corner badge. */}
      {input.letter && !empty && !input.code && (
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
      {input.code && text.code && !empty && (
        <text
          x={size / 2}
          y={text.code.y}
          textAnchor='middle'
          dominantBaseline='central'
          fontSize={text.code.fontSize}
          fontWeight='700'
          fill={overlayFill}
          style={{ userSelect: 'none' }}
        >
          {input.code}
        </text>
      )}
      {input.frequency && text.frequency && !empty && (
        <text
          x={size / 2}
          y={text.frequency.y}
          textAnchor='middle'
          dominantBaseline='central'
          fontSize={text.frequency.fontSize}
          fontWeight='600'
          fill={overlayFill}
          style={{ userSelect: 'none' }}
        >
          {input.frequency}
        </text>
      )}
      {input.code && input.letter && !empty && (
        <g>
          <circle cx={badge.cx} cy={badge.cy} r={badge.r} fill={badge.fill} stroke={badge.ink} strokeWidth={badge.strokeWidth} />
          <text
            x={badge.cx}
            y={badge.cy}
            textAnchor='middle'
            dominantBaseline='central'
            fontSize={badge.fontSize}
            fontWeight='700'
            fill={badge.ink}
            style={{ userSelect: 'none' }}
          >
            {input.letter}
          </text>
        </g>
      )}
      {/* Baby badge: tiny smiley in the top-left corner — flags fertile-class
          stamps (Creighton 10*, *L). Reference: Read Your Body's Billings
          stamps. Stroke color matches overlay text so it reads cleanly on
          both light and dark fills. */}
      {input.baby && !empty && (() => {
        const cx = inset + size * 0.18;
        const cy = inset + size * 0.18;
        const r = size * 0.14;
        const eyeR = Math.max(0.6, size * 0.025);
        return (
          <g>
            <circle cx={cx} cy={cy} r={r} fill='#fff' stroke={overlayFill} strokeWidth={0.7} />
            <circle cx={cx - r * 0.35} cy={cy - r * 0.1} r={eyeR} fill={overlayFill} />
            <circle cx={cx + r * 0.35} cy={cy - r * 0.1} r={eyeR} fill={overlayFill} />
            <path
              d={`M ${cx - r * 0.45} ${cy + r * 0.2} Q ${cx} ${cy + r * 0.6} ${cx + r * 0.45} ${cy + r * 0.2}`}
              fill='none'
              stroke={overlayFill}
              strokeWidth={0.7}
              strokeLinecap='round'
            />
          </g>
        );
      })()}
    </svg>
  );
}
