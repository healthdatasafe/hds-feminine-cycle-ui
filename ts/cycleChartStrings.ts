/**
 * The words of `<CycleChart>`, seen and spoken: whole sentences with `{placeholders}`, in pairs (One / Many) where they
 * count. A host overrides any of them, in any language.
 */

import type { I18nText } from './types.ts';

export const CYCLE_CHART_STRINGS = {
  cycleOf: { en: 'Cycle of {date}', fr: 'Cycle du {date}', es: 'Ciclo del {date}', it: 'Ciclo del {date}', 'pt-BR': 'Ciclo de {date}' },
  daysOne: { en: '{n} day', fr: '{n} jour', es: '{n} día', it: '{n} giorno', 'pt-BR': '{n} dia' },
  daysMany: { en: '{n} days', fr: '{n} jours', es: '{n} días', it: '{n} giorni', 'pt-BR': '{n} dias' },
  daysSoFarOne: { en: '{n} day so far', fr: '{n} jour à ce jour', es: '{n} día hasta ahora', it: '{n} giorno finora', 'pt-BR': '{n} dia até agora' },
  daysSoFarMany: { en: '{n} days so far', fr: '{n} jours à ce jour', es: '{n} días hasta ahora', it: '{n} giorni finora', 'pt-BR': '{n} dias até agora' },
  noCycle: { en: 'No cycle to show.', fr: 'Aucun cycle à afficher.', es: 'No hay ningún ciclo que mostrar.', it: 'Nessun ciclo da mostrare.', 'pt-BR': 'Nenhum ciclo para mostrar.' },
  day: { en: 'Day {n}, {date}', fr: 'Jour {n}, {date}', es: 'Día {n}, {date}', it: 'Giorno {n}, {date}', 'pt-BR': 'Dia {n}, {date}' },
  nothing: { en: 'Nothing recorded', fr: 'Rien de noté', es: 'Nada registrado', it: 'Nulla di registrato', 'pt-BR': 'Nada registrado' },
  bleeding: { en: 'bleeding', fr: 'saignement', es: 'sangrado', it: 'sanguinamento', 'pt-BR': 'sangramento' },
  bleedingLetter: { en: 'bleeding {letter}, {label}', fr: 'saignement {letter}, {label}', es: 'sangrado {letter}, {label}', it: 'sanguinamento {letter}, {label}', 'pt-BR': 'sangramento {letter}, {label}' },
  noBleeding: { en: 'no bleeding', fr: 'pas de saignement', es: 'sin sangrado', it: 'nessun sanguinamento', 'pt-BR': 'sem sangramento' },
  also: { en: 'also {code}', fr: 'aussi {code}', es: 'también {code}', it: 'anche {code}', 'pt-BR': 'também {code}' },
  stamp: { en: 'stamp charted: {stamp}', fr: 'timbre noté : {stamp}', es: 'sello registrado: {stamp}', it: 'timbro registrato: {stamp}', 'pt-BR': 'selo registrado: {stamp}' },
  stampUnlisted: { en: 'a stamp charted that is not drawn here: {stamp}', fr: 'un timbre noté, non dessiné ici : {stamp}', es: 'un sello registrado que no se dibuja aquí: {stamp}', it: 'un timbro registrato che qui non è disegnato: {stamp}', 'pt-BR': 'um selo registrado que não aparece aqui: {stamp}' },
  peak: { en: 'peak day', fr: 'jour pic', es: 'día pico', it: 'giorno del picco', 'pt-BR': 'dia do ápice' },
  peakComputed: { en: 'peak day, computed', fr: 'jour pic, calculé', es: 'día pico, calculado', it: 'giorno del picco, calcolato', 'pt-BR': 'dia do ápice, calculado' },
  afterPeak: { en: 'day {n} after the peak', fr: 'jour {n} après le pic', es: 'día {n} después del pico', it: 'giorno {n} dopo il picco', 'pt-BR': 'dia {n} depois do ápice' },
  otherMethod: { en: 'recorded in {method}, not drawn', fr: 'noté en {method}, non dessiné', es: 'registrado en {method}, no dibujado', it: 'registrato in {method}, non disegnato', 'pt-BR': 'registrado em {method}, não desenhado' },
  otherMethodNone: { en: 'recorded without a method, not drawn', fr: 'noté sans méthode, non dessiné', es: 'registrado sin método, no dibujado', it: 'registrato senza metodo, non disegnato', 'pt-BR': 'registrado sem método, não desenhado' },
  noteComputed: {
    en: '({letter}): the peak as computed from what was recorded; no peak day was recorded in this cycle.',
    fr: '({letter}) : le pic calculé d’après ce qui est noté ; aucun jour pic n’est noté dans ce cycle.',
    es: '({letter}): el pico calculado a partir de lo registrado; en este ciclo no se registró ningún día pico.',
    it: '({letter}): il picco calcolato in base a quanto registrato; in questo ciclo non è registrato nessun giorno del picco.',
    'pt-BR': '({letter}): o ápice calculado a partir do que foi registrado; nenhum dia do ápice foi registrado neste ciclo.'
  },
  noteNoLetter: { en: '{mark}: bleeding for which the method has no letter.', fr: '{mark} : saignement pour lequel la méthode n’a pas de lettre.', es: '{mark}: sangrado para el que el método no tiene letra.', it: '{mark}: sanguinamento per cui il metodo non ha una lettera.', 'pt-BR': '{mark}: sangramento para o qual o método não tem letra.' },
  noteNoBleeding: { en: '{mark}: no bleeding, as recorded.', fr: '{mark} : pas de saignement, comme noté.', es: '{mark}: sin sangrado, según lo registrado.', it: '{mark}: nessun sanguinamento, come registrato.', 'pt-BR': '{mark}: sem sangramento, como registrado.' },
  noteOtherMethod: { en: '{mark}: recorded in another method ({methods}), not drawn here.', fr: '{mark} : noté dans une autre méthode ({methods}), non dessiné ici.', es: '{mark}: registrado en otro método ({methods}), no dibujado aquí.', it: '{mark}: registrato in un altro metodo ({methods}), qui non disegnato.', 'pt-BR': '{mark}: registrado em outro método ({methods}), não desenhado aqui.' },
  noteUnlistedStamp: { en: '{mark}: a stamp charted that is not drawn here ({stamps}).', fr: '{mark} : un timbre noté, non dessiné ici ({stamps}).', es: '{mark}: un sello registrado que no se dibuja aquí ({stamps}).', it: '{mark}: un timbro registrato che qui non è disegnato ({stamps}).', 'pt-BR': '{mark}: um selo registrado que não aparece aqui ({stamps}).' },
  noteOtherCodes: { en: '+: more than one observation that day; the stamp is of the first one written.', fr: '+ : plus d’une observation ce jour-là ; le timbre est celui de la première écrite.', es: '+: más de una observación ese día; el sello es el de la primera anotada.', it: "+: più di un'osservazione in quel giorno; il timbro è quello della prima scritta.", 'pt-BR': '+: mais de uma observação nesse dia; o selo é o da primeira registrada.' },
  methodNone: { en: 'none named', fr: 'aucune indiquée', es: 'ninguno indicado', it: 'nessuno indicato', 'pt-BR': 'nenhum indicado' },
  unplacedOne: { en: '{n} record is not on the chart: {reasons}.', fr: '{n} note n’est pas sur le tableau : {reasons}.', es: '{n} registro no está en el gráfico: {reasons}.', it: '{n} registrazione non è sul grafico: {reasons}.', 'pt-BR': '{n} registro não está no gráfico: {reasons}.' },
  unplacedMany: { en: '{n} records are not on the chart: {reasons}.', fr: '{n} notes ne sont pas sur le tableau : {reasons}.', es: '{n} registros no están en el gráfico: {reasons}.', it: '{n} registrazioni non sono sul grafico: {reasons}.', 'pt-BR': '{n} registros não estão no gráfico: {reasons}.' },
  unplacedNoDay: { en: '{n} on no known day', fr: '{n} sans jour connu', es: '{n} sin día conocido', it: '{n} senza giorno noto', 'pt-BR': '{n} sem dia conhecido' },
  unplacedAfterToday: { en: '{n} after today', fr: '{n} après aujourd’hui', es: '{n} después de hoy', it: '{n} dopo oggi', 'pt-BR': '{n} depois de hoje' },
  unplacedOutside: { en: '{n} outside these cycles', fr: '{n} hors de ces cycles', es: '{n} fuera de estos ciclos', it: '{n} fuori da questi cicli', 'pt-BR': '{n} fora destes ciclos' },
  unplacedPredicted: { en: '{n} predicted', fr: '{n} d’après une prévision', es: '{n} previstos', it: '{n} previsti', 'pt-BR': '{n} previstos' },
  row: { en: 'Row {n}', fr: 'Ligne {n}', es: 'Fila {n}', it: 'Riga {n}', 'pt-BR': 'Linha {n}' },
  rowFrom: { en: 'Row {n}, from {date}', fr: 'Ligne {n}, du {date}', es: 'Fila {n}, desde el {date}', it: 'Riga {n}, dal {date}', 'pt-BR': 'Linha {n}, a partir de {date}' },
  rowUndated: { en: 'first day not answered', fr: 'premier jour sans réponse', es: 'primer día sin responder', it: 'primo giorno senza risposta', 'pt-BR': 'primeiro dia sem resposta' },
  dayButton: { en: '{day}: {text}', fr: '{day} : {text}', es: '{day}: {text}', it: '{day}: {text}', 'pt-BR': '{day}: {text}' },
  dayUndated: { en: 'Day {n}', fr: 'Jour {n}', es: 'Día {n}', it: 'Giorno {n}', 'pt-BR': 'Dia {n}' },
  draft: { en: 'draft {draft}, not saved', fr: 'brouillon {draft}, non enregistré', es: 'borrador {draft}, sin guardar', it: 'bozza {draft}, non salvata', 'pt-BR': 'rascunho {draft}, não salvo' },
  draftEmpty: { en: 'nothing read', fr: 'rien de lu', es: 'nada leído', it: 'nulla di letto', 'pt-BR': 'nada lido' },
  unread: { en: 'written on the chart, not read', fr: 'écrit sur le tableau, non lu', es: 'escrito en el gráfico, sin leer', it: 'scritto sul grafico, non letto', 'pt-BR': 'escrito no gráfico, não lido' },
  recordedUnread: { en: '{record}; on the chart, something written that was not read', fr: '{record} ; sur le tableau, quelque chose d’écrit, non lu', es: '{record}; en el gráfico, algo escrito sin leer', it: '{record}; sul grafico, qualcosa di scritto non letto', 'pt-BR': '{record}; no gráfico, algo escrito não lido' },
  partNotRead: { en: 'part not read', fr: 'une partie non lue', es: 'una parte sin leer', it: 'una parte non letta', 'pt-BR': 'uma parte não lida' },
  corrected: { en: 'corrected by you', fr: 'corrigé par vous', es: 'corregido por usted', it: 'corretto da te', 'pt-BR': 'corrigido por você' },
  same: { en: '{record}, already recorded, same', fr: '{record}, déjà noté, identique', es: '{record}, ya registrado, igual', it: '{record}, già registrato, uguale', 'pt-BR': '{record}, já registrado, igual' },
  differs: { en: 'recorded {record}, draft {draft}, not saved', fr: 'noté {record}, brouillon {draft}, non enregistré', es: 'registrado {record}, borrador {draft}, sin guardar', it: 'registrato {record}, bozza {draft}, non salvata', 'pt-BR': 'registrado {record}, rascunho {draft}, não salvo' },
  nextOne: { en: 'Next to check (1 left)', fr: 'Suivant à vérifier (1 restant)', es: 'Siguiente por revisar (queda 1)', it: 'Prossimo da controllare (ne resta 1)', 'pt-BR': 'Próximo a conferir (falta 1)' },
  nextMany: { en: 'Next to check ({n} left)', fr: 'Suivant à vérifier ({n} restants)', es: 'Siguiente por revisar (quedan {n})', it: 'Prossimo da controllare (ne restano {n})', 'pt-BR': 'Próximo a conferir (faltam {n})' },
  skipTo: { en: 'Skip to {title}', fr: 'Aller à {title}', es: 'Ir a {title}', it: 'Vai a {title}', 'pt-BR': 'Ir para {title}' },
  skipEnd: { en: 'Skip past the chart', fr: 'Aller après le tableau', es: 'Ir después del gráfico', it: 'Vai oltre il grafico', 'pt-BR': 'Ir para depois do gráfico' },
  noteDraft: { en: 'Dashed, {mark}: read from the chart, not saved.', fr: 'En pointillé, {mark} : lu sur le tableau, non enregistré.', es: 'Con línea discontinua, {mark}: leído del gráfico, sin guardar.', it: 'Tratteggiato, {mark}: letto dal grafico, non salvato.', 'pt-BR': 'Tracejado, {mark}: lido do gráfico, não salvo.' },
  noteUnread: { en: '{mark}: written on the chart, not read.', fr: '{mark} : écrit sur le tableau, non lu.', es: '{mark}: escrito en el gráfico, sin leer.', it: '{mark}: scritto sul grafico, non letto.', 'pt-BR': '{mark}: escrito no gráfico, não lido.' },
  notePartNotRead: { en: '{mark}: part of it not read.', fr: '{mark} : une partie non lue.', es: '{mark}: una parte sin leer.', it: '{mark}: una parte non letta.', 'pt-BR': '{mark}: uma parte não lida.' },
  noteCorrected: { en: '{mark}: corrected by you.', fr: '{mark} : corrigé par vous.', es: '{mark}: corregido por usted.', it: '{mark}: corretto da te.', 'pt-BR': '{mark}: corrigido por você.' },
  noteSame: { en: '{mark}: already recorded, the same.', fr: '{mark} : déjà noté, identique.', es: '{mark}: ya registrado, igual.', it: '{mark}: già registrato, uguale.', 'pt-BR': '{mark}: já registrado, igual.' },
  noteDiffers: { en: '{mark}: recorded otherwise; the draft is written under the record.', fr: '{mark} : noté autrement ; le brouillon est écrit sous la note.', es: '{mark}: registrado de otra forma; el borrador está escrito debajo del registro.', it: '{mark}: registrato diversamente; la bozza è scritta sotto la registrazione.', 'pt-BR': '{mark}: registrado de outra forma; o rascunho está escrito abaixo do registro.' }
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
