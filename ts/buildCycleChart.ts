/**
 * The model of a paper cycle chart: one row per cycle, one day per column, what was recorded on it and the stamp the
 * method draws for it. Pure, drawn by `<CycleChart>`. **Notation only**: nothing here says what a day means, and nothing
 * is drawn that was not recorded (a computed peak only on request, and marked as such).
 */

import type { CellInput, HdsEventLike, I18nText, Representation } from './types.ts';
import { composeCellInput } from './composeCellInput.ts';
import { chartedStampOf, CHART_STAMP_ITEM } from './chartStamp.ts';
import { fragmentOf, readNativeMucus, ruleKeyOf } from './mucusOption.ts';
import { peakNotation, RECORDED_PEAK_ITEM } from './peakNotation.ts';

/** The data-model item that opens a cycle: its first day of full bleeding. */
export const CYCLE_START_ITEM = 'fertility-cycles-start';

/** An event the chart reads. `clientData.hdsBasis: 'predicted'` marks one an app predicted: it is never charted. */
export interface ChartEvent extends HdsEventLike {
  id?: string;
  clientData?: { hdsBasis?: unknown; [key: string]: unknown } | null;
}

/** A row the host gives. It ends on `endDate`, else the day before the next row, else today. */
export interface ChartRow {
  id?: string;
  /** Day 1, `YYYY-MM-DD`. */
  startDate: string;
  endDate?: string;
  /** Its heading, in the host's words (a row of a paper chart is not always a cycle). Default: "Cycle of {date}". */
  title?: string;
}

export interface CycleChartOptions<T extends ChartEvent = ChartEvent> {
  /**
   * The calendar day of an event, `YYYY-MM-DD`, **in the zone of the person charted**; null when it is on no day (an
   * unknown date, a month, a year). No default: a wrong one shifts the chart by a day.
   */
  dayOf: (event: T) => string | null | undefined;
  /** Today in that zone: the last cycle is drawn up to it, and an event after it is not charted. */
  today: string;
  /**
   * The rows, when the host knows them (a chart entered from paper records no cycle start). Default: a row for each day a
   * cycle start is recorded on.
   */
  rows?: ChartRow[];
  /** Also mark the peak the observations show, where none is recorded (`ChartDay.peak: 'computed'`). Default: no. */
  computedPeak?: boolean;
  /**
   * The rows of a draft: what was read from a paper chart, not saved. Given, they are the chart's rows, in their order (`rows`
   * is then not taken), and what she recorded on their days is drawn with them, to compare.
   */
  draftRows?: Array<ChartDraftRow<T>>;
}

/**
 * A day of a draft, as the host has it: `draft` read and not saved; `edited` changed by her; `incomplete` part of it not
 * read; `unread` written on the chart and not read (its events are not drawn: it is a cell, never an empty day).
 */
export type DraftState = 'draft' | 'edited' | 'incomplete' | 'unread';

/** A row of a draft. Without `startDate` (its first day not answered) its days have no date, and nothing recorded is drawn in it. */
export interface ChartDraftRow<T extends ChartEvent = ChartEvent> {
  id: string;
  title?: string;
  /** Day 1, `YYYY-MM-DD`, when it is known. */
  startDate?: string;
  /** Its days, when more than its last day with a draft. */
  length?: number;
  /** The host's, given back on the cycle. */
  ref?: unknown;
  /** Its days with something read or seen, each once. Their events are shaped as records (`streamIds`, `type`, `content`). */
  days: Array<{ day: number; events: T[]; state: DraftState; ref?: unknown }>;
}

/** A mucus code as recorded, in the chart's method. */
export interface ChartCode {
  code: string;
  /** The frequency recorded with it (Creighton X1, X2, X3, AD). */
  frequency?: string;
}

/** A bleeding record. Its letter only when it is exactly what the method's letter says. */
export interface ChartBleeding {
  letter?: string;
  label?: I18nText;
  /** It records that there was none. */
  none?: true;
}

/** What is written of a day from one source: what she recorded (the day itself), or a draft of it (`ChartDay.draft`). */
export interface ChartLayer<T extends ChartEvent = ChartEvent> {
  /** The stamp drawn for it, without the peak mark or the count; missing when nothing recorded draws one. */
  input?: CellInput;
  /** The code the stamp shows. */
  code?: ChartCode;
  /** The other codes of the day, as recorded. */
  otherCodes: ChartCode[];
  bleeding: ChartBleeding[];
  /** The stamp charted on it, when the cell shows it in place of the drawn one. */
  stamp?: { id: string; label: I18nText };
  /** Stamps charted in this method that its spec does not list, by id: not drawn. */
  unlistedStamps: string[];
  /** The other methods it was also, or only, recorded in: their ids; '' for a record that names no method. */
  otherMethods: string[];
  peak?: 'recorded' | 'computed';
  /** The method's count after the peak. */
  count?: number;
  /** What the host gave for the day, oldest first: the events the chart reads. */
  events: T[];
}

/** A draft of a day. Its `peak` is the one the draft records, its `count` the count after it; never computed. */
export interface ChartDraft<T extends ChartEvent = ChartEvent> extends ChartLayer<T> {
  state: DraftState;
  ref?: unknown;
}

export interface ChartDay<T extends ChartEvent = ChartEvent> extends ChartLayer<T> {
  /** Its place in the cycle, from 1. */
  day: number;
  /** Missing in a draft row whose first day is not answered. */
  date?: string;
  draft?: ChartDraft<T>;
  /** A draft (not `unread`) on a day with records: it says the same as them, or not (key, code, annotations, peak, stamp). */
  relation?: 'same' | 'differs';
}

export interface ChartCycle<T extends ChartEvent = ChartEvent> {
  id: string;
  /** The host's heading for the row, when it gave one. */
  title?: string;
  /** Missing in a draft row whose first day is not answered. */
  startDate?: string;
  endDate?: string;
  /** A draft row: its place among `draftRows`, from 1. */
  row?: number;
  /** A draft row's `ref`. */
  ref?: unknown;
  /** The cycle is not over: the days after `endDate` are not there yet. */
  open: boolean;
  days: Array<ChartDay<T>>;
}

/** Why an event the chart reads is on no day of it. */
export type UnplacedReason = 'no-day' | 'after-today' | 'outside-rows' | 'predicted';

export interface CycleChartModel<T extends ChartEvent = ChartEvent> {
  representationId: string;
  /** Oldest first. */
  cycles: Array<ChartCycle<T>>;
  unplaced: Array<{ reason: UnplacedReason; event: T }>;
}

/** A day she can act on, by default: a draft, unless it says the same as what she recorded. */
export function isDayToCheck (day: ChartDay): boolean {
  return day.draft != null && day.relation !== 'same';
}

export interface DaysToCheckOptions<T extends ChartEvent = ChartEvent> {
  /** Default: `isDayToCheck`. */
  actionable?: (day: ChartDay<T>, cycle: ChartCycle<T>) => boolean;
  /** In the order the chart is drawn: the latest cycle first. */
  newestFirst?: boolean;
}

/** The days she can act on, in the order the chart draws them. */
export function daysToCheck<T extends ChartEvent> (model: CycleChartModel<T>, opts: DaysToCheckOptions<T> = {}): Array<{ cycle: ChartCycle<T>; day: ChartDay<T> }> {
  const actionable = opts.actionable ?? isDayToCheck;
  const cycles = opts.newestFirst ? [...model.cycles].reverse() : model.cycles;
  return cycles.flatMap(cycle => cycle.days.filter(day => actionable(day, cycle)).map(day => ({ cycle, day })));
}

/**
 * The day to check after the one shown, in the order drawn, round to the first; the first when none is shown. The one shown
 * need not be one still to check (she has just confirmed it). Null when none is left.
 */
export function nextToCheck<T extends ChartEvent> (model: CycleChartModel<T>, selected: { cycleId: string; day: number } | null | undefined, opts: DaysToCheckOptions<T> = {}): { cycle: ChartCycle<T>; day: ChartDay<T> } | null {
  const list = daysToCheck(model, opts);
  if (selected == null) return list[0] ?? null;
  const cycles = opts.newestFirst ? [...model.cycles].reverse() : model.cycles;
  const at = cycles.findIndex(c => c.id === selected.cycleId);
  const after = list.find(t => {
    const c = cycles.indexOf(t.cycle);
    return c > at || (c === at && t.day.day > selected.day);
  });
  return after ?? list[0] ?? null;
}

/** The letter the method writes on a peak day, for a chart that draws its own mark line ('P'). */
export function peakLetterOf (rep: Representation): string {
  return rep.spec.peakMarker?.letter ?? 'X';
}

/**
 * Whether the method's paper chart can be drawn: it writes a code per day and the period on the same stamp (Creighton).
 * The other methods come later: a part of their chart would be missing, so none of it is drawn.
 */
export function canChart (rep: Representation): boolean {
  return rep.spec.mucusRule != null && rep.spec.bleedingNotation != null && rep.spec.periodDisplay === 'stamp';
}

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86400000;

/** The index of a calendar day, or null when it is not one. No time zone: a day is a day. */
function indexOfDay (date: string | null | undefined): number | null {
  const m = typeof date === 'string' ? ISO_DAY.exec(date) : null;
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(ms).toISOString().slice(0, 10) === date ? ms / MS_PER_DAY : null;
}

function dateOfIndex (index: number): string {
  return new Date(index * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * The chart of the events given, in a method. Throws when `today` is not a `YYYY-MM-DD` day, or the method's chart cannot
 * be drawn (`canChart`).
 */
export function buildCycleChart<T extends ChartEvent> (events: T[], rep: Representation, opts: CycleChartOptions<T>): CycleChartModel<T> {
  if (!canChart(rep)) throw new Error(`buildCycleChart: the chart of "${rep.spec.id}" cannot be drawn`);
  const today = indexOfDay(opts.today);
  if (today == null) throw new Error('buildCycleChart: today must be YYYY-MM-DD');

  const charted = new Set([...rep.spec.consumes.map(c => c.itemKey), RECORDED_PEAK_ITEM, CHART_STAMP_ITEM]);
  const unplaced: CycleChartModel<T>['unplaced'] = [];
  const byDay = new Map<number, T[]>();
  const startDays = new Set<number>();

  for (const event of events) {
    const isStart = event.streamIds?.includes(CYCLE_START_ITEM) ?? false;
    const isCharted = event.streamIds?.some(s => charted.has(s)) ?? false;
    if (!isStart && !isCharted) continue;
    if (event.clientData?.hdsBasis === 'predicted') {
      if (isCharted) unplaced.push({ reason: 'predicted', event });
      continue;
    }
    const index = indexOfDay(opts.dayOf(event));
    if (index == null) { unplaced.push({ reason: 'no-day', event }); continue; }
    if (index > today) { unplaced.push({ reason: 'after-today', event }); continue; }
    if (isStart) startDays.add(index);
    if (isCharted) {
      const list = byDay.get(index);
      if (list) list.push(event);
      else byDay.set(index, [event]);
    }
  }

  const cycles: Array<ChartCycle<T>> = [];
  const placed = new Set<number>();
  if (opts.draftRows != null) {
    if (opts.rows != null) throw new Error('buildCycleChart: rows and draftRows, give one');
    opts.draftRows.forEach((row, i) => cycles.push(draftCycle(row, i + 1, byDay, placed, rep, opts.computedPeak === true)));
  }
  for (const { id, title, start, end, open } of opts.draftRows != null ? [] : rowsOf(opts.rows, startDays, today)) {
    const days: Array<ChartDay<T>> = [];
    for (let i = start; i <= end; i++) {
      placed.add(i);
      const list = [...(byDay.get(i) ?? [])].sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
      days.push(dayOfEvents(i - start + 1, dateOfIndex(i), list, rep));
    }
    markPeak(days, rep, opts.computedPeak === true);
    cycles.push({ id, ...(title ? { title } : {}), startDate: dateOfIndex(start), endDate: dateOfIndex(end), open, days });
  }
  for (const [index, list] of [...byDay].sort((a, b) => a[0] - b[0])) {
    if (!placed.has(index)) for (const event of list) unplaced.push({ reason: 'outside-rows', event });
  }
  return { representationId: rep.spec.id, cycles, unplaced };
}

/** The rows as day indexes, oldest first: one per start day, none after today, each ending before the next. */
function rowsOf (given: ChartRow[] | undefined, startDays: Set<number>, today: number): Array<{ id: string; title?: string; start: number; end: number; open: boolean }> {
  const starts = new Map<number, { id?: string; title?: string; end: number | null }>();
  if (given) {
    for (const row of given) {
      const start = indexOfDay(row.startDate);
      if (start == null) throw new Error(`buildCycleChart: a row's startDate must be YYYY-MM-DD, not "${row.startDate}"`);
      if (!starts.has(start)) starts.set(start, { id: row.id, title: row.title, end: indexOfDay(row.endDate) });
    }
  } else {
    for (const start of startDays) starts.set(start, { end: null });
  }
  const sorted = [...starts].filter(([start]) => start <= today).sort((a, b) => a[0] - b[0]);
  return sorted.map(([start, row], i) => {
    const next = sorted[i + 1]?.[0];
    const limit = next != null ? next - 1 : today;
    const closed = row.end != null && row.end >= start && row.end <= limit;
    return {
      id: row.id ?? dateOfIndex(start),
      title: row.title,
      start,
      end: closed ? row.end! : limit,
      open: next == null && !closed
    };
  });
}

/** A draft row: its days dated from its start when it has one, what she recorded on them beside the draft, and how they compare. */
function draftCycle<T extends ChartEvent> (row: ChartDraftRow<T>, n: number, byDay: Map<number, T[]>, placed: Set<number>, rep: Representation, computed: boolean): ChartCycle<T> {
  const start = row.startDate == null ? null : indexOfDay(row.startDate);
  if (row.startDate != null && start == null) throw new Error(`buildCycleChart: a draft row's startDate must be YYYY-MM-DD, not "${row.startDate}"`);
  const drafts = new Map<number, ChartDraftRow<T>['days'][number]>();
  for (const d of row.days) {
    if (!Number.isInteger(d.day) || d.day < 1) throw new Error(`buildCycleChart: draft row "${row.id}" has a day ${d.day}`);
    if (drafts.has(d.day)) throw new Error(`buildCycleChart: draft row "${row.id}" has day ${d.day} twice`);
    drafts.set(d.day, d);
  }
  const length = Math.max(row.length ?? 0, ...drafts.keys(), 1);
  const days: Array<ChartDay<T>> = [];
  for (let day = 1; day <= length; day++) {
    const index = start == null ? null : start + day - 1;
    if (index != null) placed.add(index);
    const recorded = index == null ? [] : [...(byDay.get(index) ?? [])].sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
    const out: ChartDay<T> = { day, ...(index != null ? { date: dateOfIndex(index) } : {}), ...layerOf(recorded, rep) };
    const given = drafts.get(day);
    if (given) {
      out.draft = { ...layerOf(given.state === 'unread' ? [] : given.events, rep), state: given.state, ...(given.ref !== undefined ? { ref: given.ref } : {}) };
      if (given.state !== 'unread' && recorded.length > 0) out.relation = sameLayer(out, out.draft) ? 'same' : 'differs';
    }
    days.push(out);
  }
  markPeak(days, rep, computed);
  // the draft's own peak and count: what the chart has written, never computed
  const marks: PeakDay[] = days.map(d => ({ day: d.day, events: d.draft != null && d.draft.state !== 'unread' ? d.draft.events : [] }));
  markPeak(marks, rep, false);
  for (const day of days) {
    if (day.draft == null || day.draft.state === 'unread') continue;
    const { peak, count } = marks[day.day - 1];
    if (peak) day.draft.peak = peak;
    if (count != null) day.draft.count = count;
  }
  return {
    id: row.id,
    ...(row.title ? { title: row.title } : {}),
    ...(start != null ? { startDate: dateOfIndex(start), endDate: dateOfIndex(start + length - 1) } : {}),
    row: n,
    ...(row.ref !== undefined ? { ref: row.ref } : {}),
    open: false,
    days
  };
}

/** The same record: the codes with their frequency, the bleeding, a recorded peak, the stamps, the other methods. */
function sameLayer (a: ChartLayer, b: ChartLayer): boolean {
  const key = (l: ChartLayer): string => JSON.stringify([
    l.code ? [l.code.code, l.code.frequency ?? ''] : null,
    l.otherCodes.map(c => `${c.code} ${c.frequency ?? ''}`).sort(),
    l.bleeding.map(b => b.none ? '-' : b.letter ?? '?').sort(),
    l.events.some(e => e.streamIds?.includes(RECORDED_PEAK_ITEM)),
    l.stamp?.id ?? null,
    [...l.unlistedStamps].sort(),
    [...l.otherMethods].sort()
  ]);
  return key(a) === key(b);
}

function dayOfEvents<T extends ChartEvent> (day: number, date: string, events: T[], rep: Representation): ChartDay<T> {
  return { day, date, ...layerOf(events, rep) };
}

/** What a day's events write: the stamp, the codes, the bleeding, the stamps charted, the other methods. */
function layerOf<T extends ChartEvent> (events: T[], rep: Representation): ChartLayer<T> {
  const out: ChartLayer<T> = { otherCodes: [], bleeding: [], unlistedStamps: [], otherMethods: [], events };
  if (events.length === 0) return out;
  const input = composeCellInput(events, rep);
  if (!input.empty) {
    const { frequency, ...drawn } = input;
    out.input = drawn;
    if (input.code != null) out.code = { code: input.code, ...(frequency ? { frequency } : {}) };
  }
  const charted = chartedStampOf(events, rep);
  if (charted) out.stamp = { id: charted.id, label: charted.stamp.label };

  const roles = new Map(rep.spec.consumes.map(c => [c.itemKey, c.role]));
  const methodId = rep.spec.boundMethod.methodId;
  const other = (method: unknown): void => {
    const name = typeof method === 'string' ? method : '';
    if (!out.otherMethods.includes(name)) out.otherMethods.push(name);
  };
  for (const event of events) {
    const eventRoles = new Set(event.streamIds.map(s => roles.get(s)));
    if (event.streamIds.includes(CHART_STAMP_ITEM)) {
      // charted in another method, or a stamp this one's spec does not list: not drawn, and said
      const { method, stamp } = event.content ?? {};
      if (method !== methodId) other(method);
      else if (!Object.hasOwn(rep.spec.stamps ?? {}, stamp) && !out.unlistedStamps.includes(String(stamp))) out.unlistedStamps.push(String(stamp));
    } else if (eventRoles.has('mucus')) {
      const code = recordedCode(event, rep);
      if (code == null) other(event.content?.source?.key);
      else addCode(out, code, rep);
    } else if (eventRoles.has('bleeding')) {
      const bleeding = bleedingOf(event, rep);
      if (!out.bleeding.some(b => b.letter === bleeding.letter && b.none === bleeding.none)) out.bleeding.push(bleeding);
    }
  }
  // "none" beside a bleeding of the same day says nothing more
  if (out.bleeding.some(b => !b.none)) out.bleeding = out.bleeding.filter(b => !b.none);
  return out;
}

/** The code of a mucus event in the chart's method as recorded (a record that names no method reads as this one's). */
function recordedCode (event: ChartEvent, rep: Representation): ChartCode | null {
  const source = event.content?.source;
  const native = readNativeMucus(source?.sourceData);
  const methodId = rep.spec.boundMethod.methodId;
  if (native == null || (source.key != null && source.key !== methodId)) return null;
  const code = ruleKeyOf(rep, 'mucus', String(native));
  const frequency = source.key === methodId ? source.annotations?.frequency : undefined;
  return { code, ...(typeof frequency === 'string' && frequency ? { frequency } : {}) };
}

/** Every code of the day is written: the drawn one with its frequency, the others beside it, each once. */
function addCode (day: ChartLayer, code: ChartCode, rep: Representation): void {
  if (day.code == null && fragmentOf(rep, 'mucus', code.code) == null) { day.code = code; return; }
  if (day.code?.code === code.code && (code.frequency == null || code.frequency === day.code.frequency)) return;
  if (day.otherCodes.some(c => c.code === code.code && c.frequency === code.frequency)) return;
  day.otherCodes.push(code);
}

function bleedingOf (event: ChartEvent, rep: Representation): ChartBleeding {
  const content = event.content;
  const presence = rep.spec.consumes.find(c => c.presenceOption && event.streamIds.includes(c.itemKey));
  const flow = typeof content === 'number' ? content : typeof content?.value === 'number' ? content.value : null;
  if (presence == null && flow === 0) return { none: true };
  const entry = rep.spec.bleedingNotation?.find(e => presence != null ? e.value == null && e.band === presence.presenceOption : e.value != null && e.value === flow);
  return entry ? { letter: entry.code, label: entry.label } : {};
}

interface PeakDay { day: number; events: ChartEvent[]; peak?: 'recorded' | 'computed'; count?: number }

/** The recorded peak days, all of them, and the count after the last; else, on request, the one the observations show. */
function markPeak (days: PeakDay[], rep: Representation, computed: boolean): void {
  const recorded = days.filter(d => d.events.some(e => e.streamIds.includes(RECORDED_PEAK_ITEM)));
  for (const d of recorded) d.peak = 'recorded';
  if (recorded.length === 0 && !computed) return;
  // the days are the model's own: no time zone of the events comes in
  const events = days.flatMap(d => d.events.map(e => ({ ...e, time: d.day })));
  const notation = peakNotation(events, rep, { dayOf: t => t });
  if (notation.peakDay == null) return;
  if (notation.basis === 'observed') days[notation.peakDay - 1].peak = 'computed';
  for (const { day, n } of notation.count) days[day - 1].count = n;
}
