import { useId, useRef } from 'react';
import { registry } from './registry.ts';
import { RepresentationCell } from './RepresentationCell.tsx';
import { fittedFontSize } from './cellA11y.ts';
import { daysToCheck, isDayToCheck, nextToCheck, peakLetterOf, type ChartBleeding, type ChartCode, type ChartCycle, type ChartDay, type ChartEvent, type ChartLayer, type CycleChartModel, type UnplacedReason } from './buildCycleChart.ts';
import { CYCLE_CHART_STRINGS, fillText, textIn, type CycleChartStringKey, type CycleChartStrings } from './cycleChartStrings.ts';
import type { I18nText } from './types.ts';

/** Past it a day has its date and no cycle day number: a count that long says nothing. */
export const NUMBERED_DAYS = 90;

/** A test of a day of a cycle (`actionable`, `toCheck`). */
export type CycleChartDayTest<T extends ChartEvent = ChartEvent> = (day: ChartDay<T>, cycle: ChartCycle<T>) => boolean;

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
  /**
   * A tap on a day she can act on. Given, each such day is a button, and the chart has "Next to check" and a skip per row.
   * Nothing is written by the chart: the host shows the day and asks.
   */
  onActivateDay?: (cycle: ChartCycle<T>, day: ChartDay<T>) => void;
  /** The days she can act on, each a button. Default: a draft, unless it is the same as what she recorded. */
  actionable?: CycleChartDayTest<T>;
  /**
   * Of the days she can act on, those still to check: "Next to check (n left)" counts them and goes through them in the
   * order drawn. A day she has settled stays a button (she can open it again) and is no longer counted. Default:
   * `actionable`, else `isDayToCheck`.
   */
  toCheck?: CycleChartDayTest<T>;
  /** The day the host shows. */
  selected?: { cycleId: string; day: number } | null;
  /** The host's line under a row (its first-day question, a confirm of the row). */
  rowNote?: (cycle: ChartCycle<T>) => React.ReactNode;
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

const dayKey = (cycleId: string, day: number): string => `${cycleId}\u0000${day}`;

/**
 * A person's cycles as a paper chart draws them: a table per cycle, a column per day, the method's stamp and under it what
 * was recorded; and beside it a draft of a chart, not saved, which never looks recorded. Read-only unless the host gives
 * `onActivateDay`. Needs the stylesheet: `import 'hds-feminine-cycle-ui/cycle-chart.css'`.
 */
export function CycleChart<T extends ChartEvent> (props: CycleChartProps<T>): React.JSX.Element {
  const { model, lang = 'en', strings, renderDay, newestFirst, className, onActivateDay, selected, rowNote } = props;
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
  const id = useId();
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const regions = useRef<Array<HTMLElement | null>>([]);
  const end = useRef<HTMLSpanElement>(null);

  const cycles = newestFirst ? [...model.cycles].reverse() : model.cycles;
  const days = model.cycles.flatMap(c => c.days);
  const layers: ChartLayer[] = [...days, ...days.flatMap(d => d.draft ? [d.draft] : [])];
  const otherMethods = [...new Set(layers.flatMap(d => d.otherMethods))];
  const unlistedStamps = [...new Set(layers.flatMap(d => d.unlistedStamps))];
  const drafts = days.flatMap(d => d.draft ? [{ day: d, draft: d.draft }] : []);

  const interactive = onActivateDay != null;
  const actionable: CycleChartDayTest<T> = props.actionable ?? isDayToCheck;
  const stillToCheck: CycleChartDayTest<T> = props.toCheck ?? actionable;
  // "Next to check" goes through the days that are buttons and still to check
  const checkOptions = { actionable: (day: ChartDay<T>, cycle: ChartCycle<T>) => actionable(day, cycle) && stillToCheck(day, cycle), newestFirst };
  const isActionable = (day: ChartDay<T>, cycle: ChartCycle<T>): boolean => interactive && actionable(day, cycle);
  const toCheck = interactive ? daysToCheck(model, checkOptions) : [];
  const activate = (cycle: ChartCycle<T>, day: ChartDay<T>): void => {
    onActivateDay?.(cycle, day);
    buttons.current.get(dayKey(cycle.id, day.day))?.focus();
  };
  const next = (): void => {
    const target = nextToCheck(model, selected, checkOptions);
    if (target) activate(target.cycle, target.day);
  };

  return (
    <div className={['hdsfc-chart', className].filter(Boolean).join(' ')} lang={lang}>
      {cycles.length === 0 && <p className='hdsfc-note'>{words.say('noCycle')}</p>}
      {interactive && toCheck.length > 0 && (
        <button type='button' className='hdsfc-next' onClick={next}>{words.say(toCheck.length === 1 ? 'nextOne' : 'nextMany', { n: toCheck.length })}</button>
      )}
      {cycles.map((cycle, i) => (
        <div key={cycle.id} className='hdsfc-cycle' data-open={cycle.open || undefined} data-undated={cycle.startDate == null || undefined}>
          {interactive && cycles.length > 1 && (
            <button
              type='button' className='hdsfc-skip'
              onClick={() => (regions.current[i + 1] ?? end.current)?.focus()}
            >
              {cycles[i + 1] ? words.say('skipTo', { title: titleOf(cycles[i + 1], words) }) : words.say('skipEnd')}
            </button>
          )}
          <CycleTable
            cycle={cycle} chartId={`${id}c${i}`} representationId={model.representationId} columns={columns} words={words} renderDay={renderDay}
            region={(el) => { regions.current[i] = el; }}
            cell={(day) => isActionable(day, cycle)
              ? {
                  selected: selected != null && selected.cycleId === cycle.id && selected.day === day.day,
                  handleClick: () => activate(cycle, day),
                  ref: (el) => { if (el) buttons.current.set(dayKey(cycle.id, day.day), el); else buttons.current.delete(dayKey(cycle.id, day.day)); }
                }
              : null}
          />
          {rowNote?.(cycle)}
        </div>
      ))}
      {days.some(d => d.peak === 'computed') && <p className='hdsfc-note'>{words.say('noteComputed', { letter: words.letter })}</p>}
      {layers.some(d => d.bleeding.some(b => !b.none && b.letter == null)) && <p className='hdsfc-note'>{words.say('noteNoLetter', { mark: NO_LETTER })}</p>}
      {layers.some(d => d.bleeding.some(b => b.none)) && <p className='hdsfc-note'>{words.say('noteNoBleeding', { mark: NO_BLEEDING })}</p>}
      {layers.some(d => d.otherCodes.length > 0) && <p className='hdsfc-note'>{words.say('noteOtherCodes')}</p>}
      {otherMethods.length > 0 && (
        <p className='hdsfc-note'>{words.say('noteOtherMethod', { mark: OTHER_METHOD, methods: otherMethods.map(id => id ? words.method(id) : words.say('methodNone')).join(', ') })}</p>
      )}
      {unlistedStamps.length > 0 && <p className='hdsfc-note'>{words.say('noteUnlistedStamp', { mark: UNLISTED_STAMP, stamps: unlistedStamps.join(', ') })}</p>}
      {drafts.some(({ day, draft }) => draft.state !== 'unread' && day.relation !== 'same') && <p className='hdsfc-note'>{words.say('noteDraft', { mark: MARK.draft })}</p>}
      {drafts.some(({ draft }) => draft.state === 'unread') && <p className='hdsfc-note'>{words.say('noteUnread', { mark: MARK.unread })}</p>}
      {drafts.some(({ draft }) => draft.state === 'incomplete') && <p className='hdsfc-note'>{words.say('notePartNotRead', { mark: MARK.incomplete })}</p>}
      {drafts.some(({ draft }) => draft.state === 'edited') && <p className='hdsfc-note'>{words.say('noteCorrected', { mark: MARK.edited })}</p>}
      {drafts.some(({ day }) => day.relation === 'same') && <p className='hdsfc-note'>{words.say('noteSame', { mark: MARK.same })}</p>}
      {drafts.some(({ day }) => day.relation === 'differs') && <p className='hdsfc-note'>{words.say('noteDiffers', { mark: MARK.differs })}</p>}
      {model.unplaced.length > 0 && <p className='hdsfc-note'>{unplacedText(model, words)}</p>}
      {interactive && <span ref={end} tabIndex={-1} className='hdsfc-end' />}
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

/** A row's heading: the host's, else a draft row's place (and its first day), else its cycle's first day. */
function titleOf (cycle: ChartCycle, words: Words): string {
  if (cycle.title) return cycle.title;
  if (cycle.row != null) return cycle.startDate ? words.say('rowFrom', { n: cycle.row, date: words.date(cycle.startDate, 'long') }) : words.say('row', { n: cycle.row });
  return words.say('cycleOf', { date: cycle.startDate ? words.date(cycle.startDate, 'long') : '' });
}

interface CellAction {
  selected: boolean;
  handleClick: () => void;
  ref: (el: HTMLButtonElement | null) => void;
}

function CycleTable<T extends ChartEvent> ({ cycle, chartId, representationId, columns, words, renderDay, region, cell }: {
  cycle: ChartCycle<T>;
  chartId: string;
  representationId: string;
  columns: number;
  words: Words;
  renderDay?: CycleChartProps<T>['renderDay'];
  region: (el: HTMLElement | null) => void;
  cell: (day: ChartDay<T>) => CellAction | null;
}): React.JSX.Element {
  const id = chartId;
  const n = cycle.days.length;
  const title = titleOf(cycle, words);
  const length = words.say(cycle.open ? (n === 1 ? 'daysSoFarOne' : 'daysSoFarMany') : (n === 1 ? 'daysOne' : 'daysMany'), { n });
  const heading = [title, ...(cycle.row != null && cycle.startDate == null ? [words.say('rowUndated')] : []), length].join(' · ');
  const lines: Array<Array<ChartDay<T>>> = [];
  for (let i = 0; i < n; i += columns) lines.push(cycle.days.slice(i, i + columns));

  return (
    /* scrolls when the chart is wider than the page: reachable by keyboard, and named */
    <div className='hdsfc-scroll' role='region' tabIndex={0} aria-label={title} ref={region}>
      <table className='hdsfc-table' style={{ '--hdsfc-columns': columns } as React.CSSProperties}>
        <caption className='hdsfc-caption'><span className='hdsfc-title'>{heading}</span></caption>
        <colgroup>{Array.from({ length: columns }, (_, i) => <col key={i} />)}</colgroup>
        {lines.map((line, l) => (
          <tbody key={l}>
            <tr>
              {line.map(day => (
                <th key={day.day} id={`${id}d${day.day}`} scope='col' className='hdsfc-day'>
                  <span aria-hidden='true'>
                    <span className='hdsfc-number'>{day.day <= NUMBERED_DAYS || day.date == null ? day.day : ' '}</span>
                    <TextLine text={day.date ? words.date(day.date, 'short') : ''} className='hdsfc-date' />
                  </span>
                  <span className='hdsfc-sr'>{dayHeader(day, words)}</span>
                </th>
              ))}
            </tr>
            <tr>
              {line.map(day => {
                const action = cell(day);
                const seen = <DayCell day={day} representationId={representationId} words={words} />;
                // every day is said with its day first, a button or not: a button is named by its own text (a name drawn from
                // the header would read its hidden parts), and a settled day keeps its day when it is no longer a button
                const heard = <span className='hdsfc-sr'>{words.say('dayButton', { day: dayHeader(day, words), text: dayText(day, words) })}</span>;
                return (
                  <td
                    key={day.day} headers={`${id}d${day.day}`} className='hdsfc-cell' data-peak={draftAlone(day) ? day.draft?.peak : day.peak}
                    data-draft={draftAlone(day) ? day.draft?.state : undefined} data-relation={day.relation}
                  >
                    {action
                      ? (
                        <button
                          type='button' className='hdsfc-act' ref={action.ref} onClick={action.handleClick}
                          aria-current={action.selected || undefined}
                        >
                          {seen}{heard}
                        </button>
                        )
                      : <>{seen}{heard}</>}
                    {renderDay?.(day, cycle)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        ))}
      </table>
    </div>
  );
}

function dayHeader (day: ChartDay, words: Words): string {
  if (day.date == null) return words.say('dayUndated', { n: day.day });
  return day.day <= NUMBERED_DAYS ? words.say('day', { n: day.day, date: words.date(day.date, 'long') }) : words.date(day.date, 'long');
}

/** The marks of a draft: read and not saved; not read; part not read; corrected by her; the same as recorded; recorded otherwise. */
const MARK = { draft: '?', unread: '??', incomplete: '…', edited: '✎', same: '✓', differs: '≠' } as const;

/** A draft on a day with no record: the whole cell is the draft's. Beside a record, the record is drawn as it is. */
const draftAlone = (day: ChartDay): boolean => day.draft != null && day.events.length === 0;

/**
 * What is seen of a day: the mark line, the stamp (its code is written under it, not on it), then the record as text. A
 * draft alone is drawn the same way in a dashed cell, its stamp hatched, with "?"; beside a record, the record is drawn and
 * the draft written under "≠", or "✓" when it says the same.
 */
function DayCell ({ day, representationId, words }: { day: ChartDay; representationId: string; words: Words }): React.JSX.Element {
  const draft = day.draft;
  const alone = draftAlone(day);
  const drawn: ChartLayer = draft && alone ? draft : day;
  const marks = (): string => [draft?.state === 'incomplete' ? MARK.incomplete : '', draft?.state === 'edited' ? MARK.edited : ''].join('');
  return (
    <span aria-hidden='true' className='hdsfc-seen'>
      <TextLine text={markOf(drawn, words)} className='hdsfc-mark' />
      <span className='hdsfc-stamp'>
        {drawn.input && <RepresentationCell representationId={representationId} input={{ ...drawn.input, code: undefined, letter: undefined }} size={32} />}
      </span>
      <LayerLines layer={drawn} words={words} />
      {draft?.state === 'unread' && alone && <TextLine text={MARK.unread} className='hdsfc-state' />}
      {draft?.state === 'unread' && !alone && <span className='hdsfc-draft-part'><TextLine text={MARK.unread} className='hdsfc-state' /></span>}
      {draft && draft.state !== 'unread' && alone && <TextLine text={MARK.draft + marks()} className='hdsfc-state' />}
      {day.relation === 'same' && <TextLine text={MARK.same + marks()} className='hdsfc-state' />}
      {draft && day.relation === 'differs' && (
        <span className='hdsfc-draft-part'>
          <TextLine text={MARK.differs} className='hdsfc-state' />
          {markOf(draft, words) && <TextLine text={markOf(draft, words)} className='hdsfc-mark' />}
          <LayerLines layer={draft} words={words} />
          <TextLine text={MARK.draft + marks()} className='hdsfc-state' />
        </span>
      )}
    </span>
  );
}

function markOf (layer: ChartLayer, words: Words): string {
  return layer.peak === 'recorded' ? words.letter : layer.peak === 'computed' ? `(${words.letter})` : layer.count != null ? String(layer.count) : '';
}

function LayerLines ({ layer, words }: { layer: ChartLayer; words: Words }): React.JSX.Element {
  return (
    <>
      {/* a charted stamp by its name too: its colour alone says nothing to some */}
      {layer.stamp && <StampName lines={wordLines(words.localize(layer.stamp.label))} />}
      {/* as on paper: the bleeding letter, then the code ("L 6C") */}
      {layer.bleeding.map((b, i) => <TextLine key={i} text={b.none ? NO_BLEEDING : b.letter ?? NO_LETTER} className='hdsfc-bleeding' />)}
      {layer.code && <CodeLines code={layer.code} />}
      {layer.otherCodes.map((c, i) => <CodeLines key={i} code={c} before='+' />)}
      {layer.unlistedStamps.length > 0 && <TextLine text={UNLISTED_STAMP} className='hdsfc-other' />}
      {layer.otherMethods.length > 0 && <TextLine text={OTHER_METHOD} className='hdsfc-other' />}
    </>
  );
}

/** A bleeding the method has no letter for; a record of no bleeding; one of another method; a stamp not drawn. Each explained under the chart. */
const NO_LETTER = '●';
const NO_BLEEDING = '–';
const OTHER_METHOD = '◇';
const UNLISTED_STAMP = '□';

/** Words on as many lines as keep them readable in a 35-column cell ("Yellow", "with a", "baby"). */
export function wordLines (text: string, width = 7): string[] {
  const lines: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const last = lines.at(-1);
    if (last != null && last.length + 1 + word.length <= width) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

function CodeLines ({ code, before = '' }: { code: ChartCode; before?: string }): React.JSX.Element {
  return (
    <>
      <TextLine text={before + code.code} className='hdsfc-code' />
      {code.frequency && <TextLine text={code.frequency} className='hdsfc-frequency' />}
    </>
  );
}

function StampName ({ lines }: { lines: string[] }): React.JSX.Element {
  // one size for its lines: the longest one's
  const longest = lines.reduce((a, b) => b.length > a.length ? b : a, '');
  return <>{lines.map((line, i) => <TextLine key={i} text={line} fit={longest} className='hdsfc-stamp-name' />)}</>;
}

const LINE = { width: 100, height: 34 };

/**
 * A line of text that always fits its column: an svg as wide as it, the text shrunk when it is long (`10GCKL`). An empty
 * line keeps its height.
 */
function TextLine ({ text, className, fit = text }: { text: string; className: string; fit?: string }): React.JSX.Element {
  return (
    <svg className={`hdsfc-line ${className}`} viewBox={`0 0 ${LINE.width} ${LINE.height}`}>
      {text && (
        <text x={LINE.width / 2} y={LINE.height / 2} textAnchor='middle' dominantBaseline='central' fontSize={fittedFontSize(LINE.width, fit, 0.06, 0.32, 0.98)} fill='currentColor'>{text}</text>
      )}
    </svg>
  );
}

const codeText = (c: ChartCode): string => [c.code, c.frequency].filter(Boolean).join(' ');

function bleedingText (b: ChartBleeding, words: Words): string {
  if (b.none) return words.say('noBleeding');
  return b.letter ? words.say('bleedingLetter', { letter: b.letter, label: b.label ? words.localize(b.label) : '' }) : words.say('bleeding');
}

/** What a layer writes, as it is spoken; '' when it writes nothing. */
function layerText (layer: ChartLayer, words: Words): string {
  const parts: string[] = [];
  if (layer.code) parts.push(codeText(layer.code));
  for (const b of layer.bleeding) parts.push(bleedingText(b, words));
  for (const c of layer.otherCodes) parts.push(words.say('also', { code: codeText(c) }));
  if (layer.stamp) parts.push(words.say('stamp', { stamp: words.localize(layer.stamp.label) }));
  for (const stamp of layer.unlistedStamps) parts.push(words.say('stampUnlisted', { stamp }));
  if (layer.peak) parts.push(words.say(layer.peak === 'recorded' ? 'peak' : 'peakComputed'));
  if (layer.count != null) parts.push(words.say('afterPeak', { n: layer.count }));
  for (const id of layer.otherMethods) parts.push(id ? words.say('otherMethod', { method: words.method(id) }) : words.say('otherMethodNone'));
  return parts.join(', ');
}

/** A day as it is spoken: everything that is drawn, and that nothing is when nothing is; a draft says it is not saved. */
function dayText (day: ChartDay, words: Words): string {
  const recorded = layerText(day, words);
  // a count alone is written on a day with no record
  const record = day.events.length === 0 ? [words.say('nothing'), recorded].filter(Boolean).join(', ') : recorded;
  const draft = day.draft;
  if (draft == null) return record;
  if (draft.state === 'unread') return day.events.length > 0 ? words.say('recordedUnread', { record }) : words.say('unread');
  const state = [...(draft.state === 'incomplete' ? [words.say('partNotRead')] : []), ...(draft.state === 'edited' ? [words.say('corrected')] : [])];
  if (day.relation === 'same') return [words.say('same', { record }), ...state].join(', ');
  const read = [layerText(draft, words) || words.say('draftEmpty'), ...state].join(', ');
  if (day.relation === 'differs') return words.say('differs', { record, draft: read });
  return words.say('draft', { draft: read });
}
