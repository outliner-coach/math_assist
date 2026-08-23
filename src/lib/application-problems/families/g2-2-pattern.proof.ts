import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_PATTERN_DRAFT_FAMILIES } from './g2-2-pattern'
import { verifyG2PatternProblem } from './g2-2-pattern.oracle'
export function proveG2PatternFamilies() { return proveG2FiniteDraftFamilies({ families: G2_2_PATTERN_DRAFT_FAMILIES, verify: verifyG2PatternProblem }) }
