export {
  G6_RATIO_ALLOWED_STANDARD_CODES,
  findG6RatioScopeViolations,
} from './g6-ratio-common'
export type {
  G6RatioClosureIssue,
  G6RatioClosureResult,
  G6RatioGenerationInput,
  G6RatioProofDomainEntry,
} from './g6-ratio-common'

export {
  G6_RATIO_PART_WHOLE_CASES,
  G6_RATIO_PART_WHOLE_FAMILY,
  G6_RATIO_PART_WHOLE_GENERATOR,
  G6_RATIO_PART_WHOLE_PROOF_DOMAIN,
  createG6RatioPartWholeScene,
  generateG6RatioPartWhole,
  validateG6RatioPartWholeClosure,
  validateG6RatioPartWholeVisual,
} from './g6-ratio-part-whole'
export type { G6RatioPartWholeCase } from './g6-ratio-part-whole'

export {
  G6_RATIO_RELATIVE_COMPARISON_BASE_CASES,
  G6_RATIO_RELATIVE_COMPARISON_CASES,
  G6_RATIO_RELATIVE_COMPARISON_FAMILY,
  G6_RATIO_RELATIVE_COMPARISON_GENERATOR,
  G6_RATIO_RELATIVE_COMPARISON_PROOF_DOMAIN,
  createG6RatioRelativeComparisonScene,
  generateG6RatioRelativeComparison,
  validateG6RatioRelativeComparisonClosure,
  validateG6RatioRelativeComparisonVisual,
} from './g6-ratio-relative-comparison'
export type {
  G6RatioHigherPlacement,
  G6RatioRelativeComparisonBaseCase,
  G6RatioRelativeComparisonCase,
} from './g6-ratio-relative-comparison'

export {
  G6_RATIO_REPRESENTATION_BASES,
  G6_RATIO_REPRESENTATION_CASES,
  G6_RATIO_REPRESENTATION_CHECK_FAMILY,
  G6_RATIO_REPRESENTATION_CHECK_GENERATOR,
  G6_RATIO_REPRESENTATION_CHECK_PROOF_DOMAIN,
  createG6RatioRepresentationCheckScene,
  generateG6RatioRepresentationCheck,
  validateG6RatioRepresentationCheckClosure,
  validateG6RatioRepresentationCheckVisual,
} from './g6-ratio-representation-check'
export type {
  G6RatioRepresentationBase,
  G6RatioRepresentationCase,
  G6RatioRepresentationErrorMode,
} from './g6-ratio-representation-check'

import type { ApplicationProblemFamilyV1 } from '../contracts'
import { G6_RATIO_PART_WHOLE_FAMILY } from './g6-ratio-part-whole'
import { G6_RATIO_RELATIVE_COMPARISON_FAMILY } from './g6-ratio-relative-comparison'
import { G6_RATIO_REPRESENTATION_CHECK_FAMILY } from './g6-ratio-representation-check'

export const G6_RATIO_FAMILIES: readonly ApplicationProblemFamilyV1[] = Object.freeze([
  G6_RATIO_PART_WHOLE_FAMILY,
  G6_RATIO_RELATIVE_COMPARISON_FAMILY,
  G6_RATIO_REPRESENTATION_CHECK_FAMILY,
])
