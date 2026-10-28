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
  ConsumesEntry,
  PeakMarkerSpec,
  PeriodDisplay,
  I18nText
} from './types.ts';

export { registry } from './registry.ts';
export { composeCellInput } from './composeCellInput.ts';
export type { ComposeOptions } from './composeCellInput.ts';
export { detectFertilityWindow } from './detectFertilityWindow.ts';
export type { FertilityWindow } from './detectFertilityWindow.ts';
export { peakNotation, RECORDED_PEAK_ITEM } from './peakNotation.ts';
export type { PeakNotation, PeakNotationOptions } from './peakNotation.ts';
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
