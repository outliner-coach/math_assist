import type { GeneratedApplicationProblemV1 } from '../contracts'
import { validateG2FiniteDraftVisual } from './g2-2-content-core'
import { G2_2_LENGTH_DRAFT_FAMILIES } from './g2-2-length'

export function validateG2LengthDraftVisual(problem: GeneratedApplicationProblemV1): boolean {
  return validateG2FiniteDraftVisual(problem, G2_2_LENGTH_DRAFT_FAMILIES)
}
