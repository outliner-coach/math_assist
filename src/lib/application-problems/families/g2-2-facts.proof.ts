import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_FACTS_DRAFT_FAMILIES } from './g2-2-facts'
import { verifyG2FactsProblem } from './g2-2-facts.oracle'

export function proveG2FactsFamilies() {
  return proveG2FiniteDraftFamilies({ families: G2_2_FACTS_DRAFT_FAMILIES, verify: verifyG2FactsProblem })
}
