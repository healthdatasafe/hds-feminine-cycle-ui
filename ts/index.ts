/**
 * hds-feminine-cycle-ui — public API.
 * See README.md and `_plans/50-custom-mucus-ui-atwork/` in the workspace for design.
 */

import { registry } from './registry.ts';
import { femmSpec } from './specs/femm.ts';
import { billingsSpec } from './specs/billings.ts';
import { creightonSpec } from './specs/creighton.ts';
import { miraSpec } from './specs/mira.ts';

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
  I18nText
} from './types.ts';

export { registry } from './registry.ts';
export { composeCellInput } from './composeCellInput.ts';
export type { ComposeOptions } from './composeCellInput.ts';
export { detectFertilityWindow } from './detectFertilityWindow.ts';
export type { FertilityWindow } from './detectFertilityWindow.ts';
export { RepresentationCell } from './RepresentationCell.tsx';
export { samplePreviewEvents } from './samplePreviewEvents.ts';
export type { PreviewDay } from './samplePreviewEvents.ts';

// Built-in registrations.
registry.register(femmSpec);
registry.register(billingsSpec);
registry.register(creightonSpec);
registry.register(miraSpec);

export { femmSpec, billingsSpec, creightonSpec, miraSpec };
