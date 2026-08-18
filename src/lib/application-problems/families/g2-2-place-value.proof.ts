import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_PLACE_VALUE_DRAFT_FAMILIES } from './g2-2-place-value'
import { oracleG2PlaceValueProblem } from './g2-2-place-value.oracle'
import { validateG2PlaceValueVisual } from './g2-2-place-value.visual'

export function proveG2PlaceValueFamilies() {
  return proveG2FiniteDraftFamilies({
    families: G2_2_PLACE_VALUE_DRAFT_FAMILIES,
    oracle: oracleG2PlaceValueProblem,
    validateVisual: validateG2PlaceValueVisual,
  })
}
