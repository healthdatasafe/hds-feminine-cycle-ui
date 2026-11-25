/**
 * The words of `<CycleChart>`, seen and spoken: whole sentences with `{placeholders}`, in pairs (One / Many) where they
 * count. A host overrides any of them, in any language.
 */

import type { I18nText } from './types.ts';

export const CYCLE_CHART_STRINGS = {
  cycleOf: { en: 'Cycle of {date}', fr: 'Cycle du {date}' },
  daysOne: { en: '{n} day', fr: '{n} jour' },
  daysMany: { en: '{n} days', fr: '{n} jours' },
  daysSoFarOne: { en: '{n} day so far', fr: '{n} jour à ce jour' },
  daysSoFarMany: { en: '{n} days so far', fr: '{n} jours à ce jour' },
  noCycle: { en: 'No cycle to show.', fr: 'Aucun cycle à afficher.' },
  day: { en: 'Day {n}, {date}', fr: 'Jour {n}, {date}' },
  nothing: { en: 'Nothing recorded', fr: 'Rien de noté' },
  bleeding: { en: 'bleeding', fr: 'saignement' },
  bleedingLetter: { en: 'bleeding {letter}, {label}', fr: 'saignement {letter}, {label}' },
  noBleeding: { en: 'no bleeding', fr: 'pas de saignement' },
  also: { en: 'also {code}', fr: 'aussi {code}' },
  stamp: { en: 'stamp charted: {stamp}', fr: 'timbre noté : {stamp}' },
  stampUnlisted: { en: 'a stamp charted that is not drawn here: {stamp}', fr: 'un timbre noté, non dessiné ici : {stamp}' },
  peak: { en: 'peak day', fr: 'jour pic' },
  peakComputed: { en: 'peak day, computed', fr: 'jour pic, calculé' },
  afterPeak: { en: 'day {n} after the peak', fr: 'jour {n} après le pic' },
  otherMethod: { en: 'recorded in {method}, not drawn', fr: 'noté en {method}, non dessiné' },
  otherMethodNone: { en: 'recorded without a method, not drawn', fr: 'noté sans méthode, non dessiné' },
  noteComputed: {
    en: '({letter}): the peak as computed from what was recorded; no peak day was recorded in this cycle.',
    fr: '({letter}) : le pic calculé d’après ce qui est noté ; aucun jour pic n’est noté dans ce cycle.'
  },
  noteNoLetter: { en: '{mark}: bleeding for which the method has no letter.', fr: '{mark} : saignement pour lequel la méthode n’a pas de lettre.' },
  noteNoBleeding: { en: '{mark}: no bleeding, as recorded.', fr: '{mark} : pas de saignement, comme noté.' },
  noteOtherMethod: { en: '{mark}: recorded in another method ({methods}), not drawn here.', fr: '{mark} : noté dans une autre méthode ({methods}), non dessiné ici.' },
  noteUnlistedStamp: { en: '{mark}: a stamp charted that is not drawn here ({stamps}).', fr: '{mark} : un timbre noté, non dessiné ici ({stamps}).' },
  noteOtherCodes: { en: '+: more than one observation that day; the stamp is of the first one written.', fr: '+ : plus d’une observation ce jour-là ; le timbre est celui de la première écrite.' },
  methodNone: { en: 'none named', fr: 'aucune indiquée' },
  unplacedOne: { en: '{n} record is not on the chart: {reasons}.', fr: '{n} note n’est pas sur le tableau : {reasons}.' },
  unplacedMany: { en: '{n} records are not on the chart: {reasons}.', fr: '{n} notes ne sont pas sur le tableau : {reasons}.' },
  unplacedNoDay: { en: '{n} on no known day', fr: '{n} sans jour connu' },
  unplacedAfterToday: { en: '{n} after today', fr: '{n} après aujourd’hui' },
  unplacedOutside: { en: '{n} outside these cycles', fr: '{n} hors de ces cycles' },
  unplacedPredicted: { en: '{n} predicted', fr: '{n} d’après une prévision' }
} satisfies Record<string, I18nText>;

export type CycleChartStringKey = keyof typeof CYCLE_CHART_STRINGS;
/** A host's words: its own language alone, or several. */
export type CycleChartStrings = Partial<Record<CycleChartStringKey, string | I18nText>>;

/** A text in a language: the tag (`pt-BR`), else its language (`pt`), else English. */
export function textIn (text: I18nText, lang: string): string {
  return text[lang] ?? text[lang.split('-')[0]] ?? text.en;
}

/** Placeholders replaced by the values' text, in one pass: a value that holds `{n}` stays as it is. */
export function fillText (text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (all, key) => Object.hasOwn(values, key) ? String(values[key]) : all);
}
