import { useId } from 'react';
import { registry } from './registry.ts';
import { RepresentationCell } from './RepresentationCell.tsx';
import { fittedFontSize } from './cellA11y.ts';
import { peakLetterOf, type ChartBleeding, type ChartCode, type ChartCycle, type ChartDay, type ChartEvent, type CycleChartModel, type UnplacedReason } from './buildCycleChart.ts';
import { CYCLE_CHART_STRINGS, fillText, textIn, type CycleChartStringKey, type CycleChartStrings } from './cycleChartStrings.ts';
import type { I18nText } from './types.ts';

/** Past it a day has its date and no cycle day number: a count that long says nothing. */
export const NUMBERED_DAYS = 90;

export interface CycleChartProps<T extends ChartEvent = ChartEvent> {
  /** `buildCycleChart`. */
  model: CycleChartModel<T>;
  /** Days per line: 35 as on paper (default), 7 on a phone. A longer cycle goes on the next line. */
  columns?: number;
  /** BCP-47 tag. Default: `en`. */
  lang?: string;
  /** Words in place of the built-in ones. */
  strings?: CycleChartStrings;
  /** A text of the method's (its bleeding letters, its stamps, its name) in the host's language. Default: by `lang`. */
  localize?: (text: I18nText) => string;
  /** A `YYYY-MM-DD` day in words (`long`: in headings and speech) or short (`short`: above the day). Default: `Intl`. */
  formatDate?: (date: string, style: 'long' | 'short') => string;
  /** The host's own control or mark in a day's cell (a link to the entry, a comment). */
  renderDay?: (day: ChartDay<T>, cycle: ChartCycle<T>) => React.ReactNode;
  /** The latest cycle first. Default: the oldest first, as on paper. */
  newestFirst?: boolean;
  className?: string;
}

interface Words {
  say: (key: CycleChartStringKey, values?: Record<string, string | number>) => string;
  localize: (text: I18nText) => string;
  date: (date: string, style: 'long' | 'short') => string;
  /** A method by its name, else by its id. */
  method: (id: string) => string;
  letter: string;
}

function intlDate (date: string, style: 'long' | 'short', lang: string): string {
  // a calendar day: formatted in UTC from UTC midnight, so no time zone moves it
  const options: Intl.DateTimeFormatOptions = style === 'long' ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'numeric' };
  return new Intl.DateTimeFormat(lang, { ...options, timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

/**
 * A person's cycles as a paper chart draws them, read-only: a table per cycle, a column per day, the method's stamp and
 * under it what was recorded. Needs the stylesheet: `import 'hds-feminine-cycle-ui/cycle-chart.css'`.
 */
export function CycleChart<T extends ChartEvent> (props: CycleChartProps<T>): React.JSX.Element {
  const { model, lang = 'en', strings, renderDay, newestFirst, className } = props;
  const columns = Math.max(1, Math.floor(props.columns ?? 35));
  const rep = registry.get(model.representationId);
  const localize = props.localize ?? ((text: I18nText) => textIn(text, lang));
  const words: Words = {
    say: (key, values = {}) => {
      const own = strings?.[key];
      return fillText(typeof own === 'string' ? own : textIn(own ?? CYCLE_CHART_STRINGS[key], lang), values);
    },
    localize,
    date: props.formatDate ?? ((date, style) => intlDate(date, style, lang)),
    method: (id) => {
      const label = registry.get(id)?.spec.label;
      return label ? localize(label) : id;
    },
    letter: rep ? peakLetterOf(rep) : ''
  };
  const cycles = newestFirst ? [...model.cycles].reverse() : model.cycles;
  const days = model.cycles.flatMap(c => c.days);
  const otherMethods = [...new Set(days.flatMap(d => d.otherMethods))];

  return (
    <div className={['hdsfc-chart', className].filter(Boolean).join(' ')} lang={lang}>
      {cycles.length === 0 && <p className='hdsfc-note'>{words.say('noCycle')}</p>}
      {cycles.map(cycle => (
        <CycleTable key={cycle.id} cycle={cycle} representationId={model.representationId} columns={columns} words={words} renderDay={renderDay} />
      ))}
      {days.some(d => d.peak === 'computed') && <p className='hdsfc-note'>{words.say('noteComputed', { letter: words.letter })}</p>}
      {days.some(d => d.bleeding.some(b => !b.none && b.letter == null)) && <p className='hdsfc-note'>{words.say('noteNoLetter', { mark: NO_LETTER })}</p>}
      {days.some(d => d.bleeding.some(b => b.none)) && <p className='hdsfc-note'>{words.say('noteNoBleeding', { mark: NO_BLEEDING })}</p>}
      {days.some(d => d.otherCodes.length > 0) && <p className='hdsfc-note'>{words.say('noteOtherCodes')}</p>}
      {otherMethods.length > 0 && (
        <p className='hdsfc-note'>{words.say('noteOtherMethod', { mark: OTHER_METHOD, methods: otherMethods.map(id => id ? words.method(id) : words.say('methodNone')).join(', ') })}</p>
      )}
      {model.unplaced.length > 0 && <p className='hdsfc-note'>{unplacedText(model, words)}</p>}
    </div>
  );
}

const UNPLACED_KEY: Record<UnplacedReason, CycleChartStringKey> = {
  'no-day': 'unplacedNoDay', 'after-today': 'unplacedAfterToday', 'outside-rows': 'unplacedOutside', predicted: 'unplacedPredicted'
};

function unplacedText (model: CycleChartModel, words: Words): string {
  const reasons = (Object.keys(UNPLACED_KEY) as UnplacedReason[])
    .map(reason => ({ reason, n: model.unplaced.filter(u => u.reason === reason).length }))
    .filter(r => r.n > 0)
    .map(({ reason, n }) => words.say(UNPLACED_KEY[reason], { n }));
  const n = model.unplaced.length;
  return words.say(n === 1 ? 'unplacedOne' : 'unplacedMany', { n, reasons: reasons.join(', ') });
}

function CycleTable<T extends ChartEvent> ({ cycle, representationId, columns, words, renderDay }: {
  cycle: ChartCycle<T>;
  representationId: string;
  columns: number;
  words: Words;
  renderDay?: CycleChartProps<T>['renderDay'];
}): React.JSX.Element {
  const id = useId();
  const n = cycle.days.length;
  const title = words.say('cycleOf', { date: words.date(cycle.startDate, 'long') });
  const length = words.say(cycle.open ? (n === 1 ? 'daysSoFarOne' : 'daysSoFarMany') : (n === 1 ? 'daysOne' : 'daysMany'), { n });
  const lines: Array<Array<ChartDay<T>>> = [];
  for (let i = 0; i < n; i += columns) lines.push(cycle.days.slice(i, i + columns));

  return (
    <div className='hdsfc-cycle' data-open={cycle.open || undefined}>
      {/* scrolls when the chart is wider than the page: reachable by keyboard, and named */}
      <div className='hdsfc-scroll' role='region' tabIndex={0} aria-label={title}>
        <table className='hdsfc-table' style={{ '--hdsfc-columns': columns } as React.CSSProperties}>
          <caption className='hdsfc-caption'>{title} · {length}</caption>
          <colgroup>{Array.from({ length: columns }, (_, i) => <col key={i} />)}</colgroup>
          {lines.map((line, l) => (
            <tbody key={l}>
              <tr>
                {line.map(day => (
                  <th key={day.day} id={`${id}d${day.day}`} scope='col' className='hdsfc-day'>
                    <span aria-hidden='true'>
                      <span className='hdsfc-number'>{day.day <= NUMBERED_DAYS ? day.day : ' '}</span>
                      <TextLine text={words.date(day.date, 'short')} className='hdsfc-date' />
                    </span>
                    <span className='hdsfc-sr'>
                      {day.day <= NUMBERED_DAYS ? words.say('day', { n: day.day, date: words.date(day.date, 'long') }) : words.date(day.date, 'long')}
                    </span>
                  </th>
                ))}
              </tr>
              <tr>
                {line.map(day => (
                  <td key={day.day} headers={`${id}d${day.day}`} className='hdsfc-cell' data-peak={day.peak}>
                    <DayCell day={day} representationId={representationId} words={words} />
                    <span className='hdsfc-sr'>{dayText(day, words)}</span>
                    {renderDay?.(day, cycle)}
                  </td>
                ))}
              </tr>
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

/** What is seen of a day: the mark line, the stamp (its code is written under it, not on it), then the record as text. */
function DayCell ({ day, representationId, words }: { day: ChartDay; representationId: string; words: Words }): React.JSX.Element {
  const mark = day.peak === 'recorded' ? words.letter : day.peak === 'computed' ? `(${words.letter})` : day.count != null ? String(day.count) : '';
  return (
    <span aria-hidden='true' className='hdsfc-seen'>
      <TextLine text={mark} className='hdsfc-mark' />
      <span className='hdsfc-stamp'>
        {day.input && <RepresentationCell representationId={representationId} input={{ ...day.input, code: undefined, letter: undefined }} size={32} />}
      </span>
      {/* as on paper: the bleeding letter, then the code ("L 6C") */}
      {day.bleeding.map((b, i) => <TextLine key={i} text={b.none ? NO_BLEEDING : b.letter ?? NO_LETTER} className='hdsfc-bleeding' />)}
      {day.code && <CodeLines code={day.code} />}
      {day.otherCodes.map((c, i) => <CodeLines key={i} code={c} before='+' />)}
      {day.otherMethods.length > 0 && <TextLine text={OTHER_METHOD} className='hdsfc-other' />}
    </span>
  );
}

/** A bleeding the method has no letter for; a record of no bleeding; one of another method. Each explained under the chart. */
const NO_LETTER = '●';
const NO_BLEEDING = '–';
const OTHER_METHOD = '◇';

function CodeLines ({ code, before = '' }: { code: ChartCode; before?: string }): React.JSX.Element {
  return (
    <>
      <TextLine text={before + code.code} className='hdsfc-code' />
      {code.frequency && <TextLine text={code.frequency} className='hdsfc-frequency' />}
    </>
  );
}

const LINE = { width: 100, height: 34 };

/**
 * A line of text that always fits its column: an svg as wide as it, the text shrunk when it is long (`10GCKL`). An empty
 * line keeps its height.
 */
function TextLine ({ text, className }: { text: string; className: string }): React.JSX.Element {
  return (
    <svg className={`hdsfc-line ${className}`} viewBox={`0 0 ${LINE.width} ${LINE.height}`}>
      {text && (
        <text x={LINE.width / 2} y={LINE.height / 2} textAnchor='middle' dominantBaseline='central' fontSize={fittedFontSize(LINE.width, text, 0.06, 0.32, 0.98)} fill='currentColor'>{text}</text>
      )}
    </svg>
  );
}

const codeText = (c: ChartCode): string => [c.code, c.frequency].filter(Boolean).join(' ');

function bleedingText (b: ChartBleeding, words: Words): string {
  if (b.none) return words.say('noBleeding');
  return b.letter ? words.say('bleedingLetter', { letter: b.letter, label: b.label ? words.localize(b.label) : '' }) : words.say('bleeding');
}

/** A day as it is spoken: everything that is drawn, and that nothing is when nothing is. */
function dayText (day: ChartDay, words: Words): string {
  const parts: string[] = [];
  if (day.code) parts.push(codeText(day.code));
  for (const b of day.bleeding) parts.push(bleedingText(b, words));
  for (const c of day.otherCodes) parts.push(words.say('also', { code: codeText(c) }));
  if (day.stamp) parts.push(words.say('stamp', { stamp: words.localize(day.stamp.label) }));
  if (day.peak) parts.push(words.say(day.peak === 'recorded' ? 'peak' : 'peakComputed'));
  if (day.count != null) parts.push(words.say('afterPeak', { n: day.count }));
  for (const id of day.otherMethods) parts.push(id ? words.say('otherMethod', { method: words.method(id) }) : words.say('otherMethodNone'));
  // a count alone is written on a day with no record
  if (day.events.length === 0) parts.unshift(words.say('nothing'));
  return parts.join(', ');
}
