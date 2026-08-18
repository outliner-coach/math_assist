import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_PATTERN_DRAFT_FAMILIES } from './g2-2-pattern'
import { oracleG2PatternProblem } from './g2-2-pattern.oracle'
import { validateG2PatternVisual } from './g2-2-pattern.visual'
export function proveG2PatternFamilies() { return proveG2FiniteDraftFamilies({ families: G2_2_PATTERN_DRAFT_FAMILIES, oracle: oracleG2PatternProblem, validateVisual: validateG2PatternVisual }) }
