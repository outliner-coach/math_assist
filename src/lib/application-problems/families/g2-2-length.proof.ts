import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_LENGTH_DRAFT_FAMILIES } from './g2-2-length'
import { oracleG2LengthDraftProblem } from './g2-2-length.oracle'
import { validateG2LengthDraftVisual } from './g2-2-length.visual'

export function proveG2LengthDraftFamilies() {
  return proveG2FiniteDraftFamilies({ families: G2_2_LENGTH_DRAFT_FAMILIES, oracle: oracleG2LengthDraftProblem, validateVisual: validateG2LengthDraftVisual })
}
