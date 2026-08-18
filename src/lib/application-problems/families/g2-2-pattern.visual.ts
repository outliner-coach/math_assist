import type { GeneratedApplicationProblemV1 } from '../contracts'
import { validateG2FiniteDraftVisual } from './g2-2-content-core'
import { G2_2_PATTERN_DRAFT_FAMILIES } from './g2-2-pattern'
export function validateG2PatternVisual(problem: GeneratedApplicationProblemV1): boolean { return validateG2FiniteDraftVisual(problem, G2_2_PATTERN_DRAFT_FAMILIES) }
