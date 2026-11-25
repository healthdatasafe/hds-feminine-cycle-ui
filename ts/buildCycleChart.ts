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

export interface ChartDay<T extends ChartEvent = ChartEvent> {
  /** Its place in the cycle, from 1. */
  day: number;
  date: string;
  /** The stamp drawn for it, without the peak mark or the count; missing when nothing recorded draws one. */
  input?: CellInput;
  /** The code the stamp shows. */
  code?: ChartCode;
  /** The other codes of the day, as recorded. */
  otherCodes: ChartCode[];
  bleeding: ChartBleeding[];
  /** The stamp charted on it, when the cell shows it in place of the drawn one. */
  stamp?: { id: string; label: I18nText };
  /** The other methods it was also, or only, recorded in: their ids; '' for a record that names no method. */
  otherMethods: string[];
  peak?: 'recorded' | 'computed';
  /** The method's count after the peak. */
  count?: number;
  /** What the host gave for the day, oldest first: the events the chart reads. */
  events: T[];
}

export interface ChartCycle<T extends ChartEvent = ChartEvent> {
  id: string;
  startDate: string;
  endDate: string;
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
  for (const { id, start, end, open } of rowsOf(opts.rows, startDays, today)) {
    const days: Array<ChartDay<T>> = [];
    for (let i = start; i <= end; i++) {
      placed.add(i);
      const list = [...(byDay.get(i) ?? [])].sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
      days.push(dayOfEvents(i - start + 1, dateOfIndex(i), list, rep));
    }
    markPeak(days, rep, opts.computedPeak === true);
    cycles.push({ id, startDate: dateOfIndex(start), endDate: dateOfIndex(end), open, days });
  }
  for (const [index, list] of [...byDay].sort((a, b) => a[0] - b[0])) {
    if (!placed.has(index)) for (const event of list) unplaced.push({ reason: 'outside-rows', event });
  }
  return { representationId: rep.spec.id, cycles, unplaced };
}

/** The rows as day indexes, oldest first: one per start day, none after today, each ending before the next. */
function rowsOf (given: ChartRow[] | undefined, startDays: Set<number>, today: number): Array<{ id: string; start: number; end: number; open: boolean }> {
  const starts = new Map<number, { id?: string; end: number | null }>();
  if (given) {
    for (const row of given) {
      const start = indexOfDay(row.startDate);
      if (start == null) throw new Error(`buildCycleChart: a row's startDate must be YYYY-MM-DD, not "${row.startDate}"`);
      if (!starts.has(start)) starts.set(start, { id: row.id, end: indexOfDay(row.endDate) });
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
      start,
      end: closed ? row.end! : limit,
      open: next == null && !closed
    };
  });
}

function dayOfEvents<T extends ChartEvent> (day: number, date: string, events: T[], rep: Representation): ChartDay<T> {
  const out: ChartDay<T> = { day, date, otherCodes: [], bleeding: [], otherMethods: [], events };
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
      if (event.content?.method !== methodId || !Object.hasOwn(rep.spec.stamps ?? {}, event.content?.stamp)) other(event.content?.method);
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
function addCode (day: ChartDay, code: ChartCode, rep: Representation): void {
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

/** The recorded peak days, all of them, and the count after the last; else, on request, the one the observations show. */
function markPeak (days: ChartDay[], rep: Representation, computed: boolean): void {
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
