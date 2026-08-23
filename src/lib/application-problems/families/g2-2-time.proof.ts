import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_TIME_DRAFT_FAMILIES } from './g2-2-time'
import { verifyG2TimeProblem } from './g2-2-time.oracle'

export function proveG2TimeFamilies() {
  return proveG2FiniteDraftFamilies({ families: G2_2_TIME_DRAFT_FAMILIES, verify: verifyG2TimeProblem })
}
