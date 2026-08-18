import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_FACTS_DRAFT_FAMILIES } from './g2-2-facts'
import { oracleG2FactsProblem } from './g2-2-facts.oracle'
import { validateG2FactsVisual } from './g2-2-facts.visual'

export function proveG2FactsFamilies() {
  return proveG2FiniteDraftFamilies({ families: G2_2_FACTS_DRAFT_FAMILIES, oracle: oracleG2FactsProblem, validateVisual: validateG2FactsVisual })
}
