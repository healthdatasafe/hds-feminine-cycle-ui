/**
 * hds-feminine-cycle-ui — public API.
 * See README.md and `_plans/50-custom-mucus-ui-atwork/` in the workspace for design.
 */

import { registry } from './registry.ts';
import { femmSpec } from './specs/femm.ts';
import { billingsSpec } from './specs/billings.ts';
import { creightonSpec } from './specs/creighton.ts';
import { miraSpec } from './specs/mira.ts';
import { sensiplanSpec } from './specs/sensiplan.ts';
import { symptoThermalSpec } from './specs/symptoThermal.ts';
import { justisseSpec } from './specs/justisse.ts';
import { chartneoSpec } from './specs/chartneo.ts';
import { marquetteSpec } from './specs/marquette.ts';
import { appleHealthSpec } from './specs/appleHealth.ts';

export type {
  Representation,
  RepresentationSpec,
  CellInput,
  CellProps,
  HdsEventLike,
  MappingRules,
  MappingRuleFragment,
  StampSpec,
  ConsumesEntry,
  PeakMarkerSpec,
  PeriodDisplay,
  ChartSign,
  SignShown,
  ChartSpec,
  I18nText,
  BleedingNotationEntry
} from './types.ts';

export { registry } from './registry.ts';
export { longestCode } from './longestCode.ts';
export { composeCellInput, stickerOf, bleedingBandOf } from './composeCellInput.ts';
export { CHART_STAMP_ITEM, CHART_STAMP_TYPE, chartedStampOf, stampChoices, stampFitsDay } from './chartStamp.ts';
export type { ChartedStamp, StampChoice } from './chartStamp.ts';
export { isPeakOption } from './mucusOption.ts';
export { stampColours, stampTextLayout, luminanceOf, textOn } from './stampStyle.ts';
export type { StampColours, StampTextLine } from './stampStyle.ts';
export type { ComposeOptions } from './composeCellInput.ts';
export { detectFertilityWindow } from './detectFertilityWindow.ts';
export type { FertilityWindow } from './detectFertilityWindow.ts';
export { peakNotation, RECORDED_PEAK_ITEM } from './peakNotation.ts';
export type { PeakNotation, PeakNotationOptions } from './peakNotation.ts';
export { buildCycleChart, canChart, peakLetterOf, CYCLE_START_ITEM, isDayToCheck, daysToCheck, nextToCheck } from './buildCycleChart.ts';
export type {
  ChartEvent, ChartRow, CycleChartOptions, ChartCode, ChartBleeding, ChartLayer, ChartDay, ChartCycle, UnplacedReason, CycleChartModel,
  DraftState, ChartDraft, ChartDraftRow, DaysToCheckOptions
} from './buildCycleChart.ts';
export { CycleChart, NUMBERED_DAYS } from './CycleChart.tsx';
export type { CycleChartProps } from './CycleChart.tsx';
export { CYCLE_CHART_STRINGS } from './cycleChartStrings.ts';
export type { CycleChartStringKey, CycleChartStrings } from './cycleChartStrings.ts';
export { RepresentationCell } from './RepresentationCell.tsx';
export { CervixPositionMarker } from './CervixPositionMarker.tsx';
export type { CervixPositionMarkerProps } from './CervixPositionMarker.tsx';
export { samplePreviewEvents } from './samplePreviewEvents.ts';
export type { PreviewDay } from './samplePreviewEvents.ts';

// Built-in registrations.
registry.register(femmSpec);
registry.register(billingsSpec);
registry.register(creightonSpec);
registry.register(miraSpec);
registry.register(sensiplanSpec);
registry.register(symptoThermalSpec);
registry.register(justisseSpec);
registry.register(chartneoSpec);
registry.register(marquetteSpec);
registry.register(appleHealthSpec);

export {
  femmSpec, billingsSpec, creightonSpec, miraSpec,
  sensiplanSpec, symptoThermalSpec, justisseSpec, chartneoSpec, marquetteSpec, appleHealthSpec
};
