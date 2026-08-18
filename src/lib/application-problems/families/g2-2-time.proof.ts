import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_TIME_DRAFT_FAMILIES } from './g2-2-time'
import { oracleG2TimeProblem } from './g2-2-time.oracle'
import { validateG2TimeVisual } from './g2-2-time.visual'

export function proveG2TimeFamilies() {
  return proveG2FiniteDraftFamilies({ families: G2_2_TIME_DRAFT_FAMILIES, oracle: oracleG2TimeProblem, validateVisual: validateG2TimeVisual })
}
