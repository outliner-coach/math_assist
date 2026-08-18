import { proveG2FiniteDraftFamilies } from './g2-2-content-core'
import { G2_2_TABLE_GRAPH_DRAFT_FAMILIES } from './g2-2-table-graph'
import { oracleG2TableGraphProblem } from './g2-2-table-graph.oracle'
import { validateG2TableGraphVisual } from './g2-2-table-graph.visual'
export function proveG2TableGraphFamilies() { return proveG2FiniteDraftFamilies({ families: G2_2_TABLE_GRAPH_DRAFT_FAMILIES, oracle: oracleG2TableGraphProblem, validateVisual: validateG2TableGraphVisual }) }
