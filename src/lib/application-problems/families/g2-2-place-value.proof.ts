import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_PLACE_VALUE_DRAFT_FAMILIES } from './g2-2-place-value'
import { verifyG2PlaceValueProblem } from './g2-2-place-value.oracle'

export function proveG2PlaceValueFamilies() {
  return proveG2FiniteDraftFamilies({
    families: G2_2_PLACE_VALUE_DRAFT_FAMILIES,
    verify: verifyG2PlaceValueProblem,
  })
}
