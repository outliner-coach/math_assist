import capacityWeightPack from '../../../../public/data/application-problems/packs/g3-2-capacity-weight.json'
import circlePack from '../../../../public/data/application-problems/packs/g3-2-circle.json'
import divisionPack from '../../../../public/data/application-problems/packs/g3-2-division.json'
import fractionPack from '../../../../public/data/application-problems/packs/g3-2-fraction.json'
import graphPack from '../../../../public/data/application-problems/packs/g3-2-graph.json'
import multiplyPack from '../../../../public/data/application-problems/packs/g3-2-multiply.json'
import { G3_2_CAPACITY_WEIGHT_FAMILY_RECIPES } from './g3-2-capacity-weight'
import { G3_2_CIRCLE_FAMILY_RECIPES } from './g3-2-circle'
import { G3_2_DIVISION_FAMILY_RECIPES } from './g3-2-division'
import { G3_2_FRACTION_FAMILY_RECIPES } from './g3-2-fraction'
import { G3_2_GRAPH_FAMILY_RECIPES } from './g3-2-graph'
import { G3_2_MULTIPLY_FAMILY_RECIPES } from './g3-2-multiply'
import type { G3ApplicationUnitContent } from './g3-family-support'

export const G3_SEMESTER_TWO_APPLICATION_UNITS: readonly G3ApplicationUnitContent[] = Object.freeze([
  { unitId: 'g3-2-multiply', pack: multiplyPack, coreConceptIds: ['g3-2-multiply-multiplication'], requiredRepresentations: ['diagram', 'text'], recipes: G3_2_MULTIPLY_FAMILY_RECIPES },
  { unitId: 'g3-2-division', pack: divisionPack, coreConceptIds: ['g3-2-division-division-remainder'], requiredRepresentations: ['diagram', 'text'], recipes: G3_2_DIVISION_FAMILY_RECIPES },
  { unitId: 'g3-2-circle', pack: circlePack, coreConceptIds: ['g3-2-circle-circle'], requiredRepresentations: ['diagram', 'text'], recipes: G3_2_CIRCLE_FAMILY_RECIPES },
  { unitId: 'g3-2-fraction', pack: fractionPack, coreConceptIds: ['g3-2-fraction-fraction'], requiredRepresentations: ['diagram', 'text'], recipes: G3_2_FRACTION_FAMILY_RECIPES },
  { unitId: 'g3-2-capacity-weight', pack: capacityWeightPack, coreConceptIds: ['g3-2-capacity-weight-capacity-weight'], requiredRepresentations: ['diagram', 'text'], recipes: G3_2_CAPACITY_WEIGHT_FAMILY_RECIPES },
  { unitId: 'g3-2-graph', pack: graphPack, coreConceptIds: ['g3-2-graph-graph'], requiredRepresentations: ['graph', 'text'], recipes: G3_2_GRAPH_FAMILY_RECIPES },
])
