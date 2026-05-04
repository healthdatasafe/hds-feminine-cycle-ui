/**
 * hds-feminine-cycle-ui — public API.
 * See README.md and `_plans/50-custom-mucus-ui-atwork/` in the workspace for design.
 */

import { registry } from './registry.ts';
import { femmSpec } from './specs/femm.ts';

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
export { RepresentationCell } from './RepresentationCell.tsx';
export { samplePreviewEvents } from './samplePreviewEvents.ts';
export type { PreviewDay } from './samplePreviewEvents.ts';

// Built-in registrations.
registry.register(femmSpec);

export { femmSpec };
