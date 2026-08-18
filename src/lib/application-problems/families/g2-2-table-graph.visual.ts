import type { GeneratedApplicationProblemV1 } from '../contracts'
import { validateG2FiniteDraftVisual } from './g2-2-content-core'
import { G2_2_TABLE_GRAPH_DRAFT_FAMILIES } from './g2-2-table-graph'
export function validateG2TableGraphVisual(problem: GeneratedApplicationProblemV1): boolean { return validateG2FiniteDraftVisual(problem, G2_2_TABLE_GRAPH_DRAFT_FAMILIES) }
