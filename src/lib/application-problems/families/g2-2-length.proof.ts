import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_LENGTH_DRAFT_FAMILIES } from './g2-2-length'
import { verifyG2LengthDraftProblem } from './g2-2-length.oracle'

export function proveG2LengthDraftFamilies() {
  return proveG2FiniteDraftFamilies({ families: G2_2_LENGTH_DRAFT_FAMILIES, verify: verifyG2LengthDraftProblem })
}
