import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_TABLE_GRAPH_DRAFT_FAMILIES } from './g2-2-table-graph'
import { verifyG2TableGraphProblem } from './g2-2-table-graph.oracle'
export function proveG2TableGraphFamilies() { return proveG2FiniteDraftFamilies({ families: G2_2_TABLE_GRAPH_DRAFT_FAMILIES, verify: verifyG2TableGraphProblem }) }
