import type { GeneratedApplicationProblemV1 } from '../contracts'
import { validateG2FiniteDraftVisual } from './g2-2-content-core'
import { G2_2_PLACE_VALUE_DRAFT_FAMILIES } from './g2-2-place-value'

export function validateG2PlaceValueVisual(problem: GeneratedApplicationProblemV1): boolean {
  return validateG2FiniteDraftVisual(problem, G2_2_PLACE_VALUE_DRAFT_FAMILIES)
}
