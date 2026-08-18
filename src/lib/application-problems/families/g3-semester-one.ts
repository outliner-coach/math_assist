import addSubPack from '../../../../public/data/application-problems/packs/g3-1-add-sub.json'
import divisionPack from '../../../../public/data/application-problems/packs/g3-1-division.json'
import fractionDecimalPack from '../../../../public/data/application-problems/packs/g3-1-fraction-decimal.json'
import lengthTimePack from '../../../../public/data/application-problems/packs/g3-1-length-time.json'
import linesPack from '../../../../public/data/application-problems/packs/g3-1-lines.json'
import multiplyPack from '../../../../public/data/application-problems/packs/g3-1-multiply.json'
import { G3_1_ADD_SUB_FAMILY_RECIPES } from './g3-1-add-sub'
import { G3_1_DIVISION_FAMILY_RECIPES } from './g3-1-division'
import { G3_1_FRACTION_DECIMAL_FAMILY_RECIPES } from './g3-1-fraction-decimal'
import { G3_1_LENGTH_TIME_FAMILY_RECIPES } from './g3-1-length-time'
import { G3_1_LINES_FAMILY_RECIPES } from './g3-1-lines'
import { G3_1_MULTIPLY_FAMILY_RECIPES } from './g3-1-multiply'
import type { G3ApplicationUnitContent } from './g3-family-support'

export const G3_SEMESTER_ONE_APPLICATION_UNITS: readonly G3ApplicationUnitContent[] = Object.freeze([
  { unitId: 'g3-1-add-sub', pack: addSubPack, coreConceptIds: ['g3-1-add-sub-addition-subtraction'], requiredRepresentations: ['equation', 'text'], recipes: G3_1_ADD_SUB_FAMILY_RECIPES },
  { unitId: 'g3-1-lines', pack: linesPack, coreConceptIds: ['g3-1-lines-line-angle'], requiredRepresentations: ['diagram', 'text'], recipes: G3_1_LINES_FAMILY_RECIPES },
  { unitId: 'g3-1-division', pack: divisionPack, coreConceptIds: ['g3-1-division-division-meaning'], requiredRepresentations: ['diagram', 'text'], recipes: G3_1_DIVISION_FAMILY_RECIPES },
  { unitId: 'g3-1-multiply', pack: multiplyPack, coreConceptIds: ['g3-1-multiply-multiplication'], requiredRepresentations: ['diagram', 'text'], recipes: G3_1_MULTIPLY_FAMILY_RECIPES },
  { unitId: 'g3-1-length-time', pack: lengthTimePack, coreConceptIds: ['g3-1-length-time-length-time'], requiredRepresentations: ['diagram', 'text'], recipes: G3_1_LENGTH_TIME_FAMILY_RECIPES },
  { unitId: 'g3-1-fraction-decimal', pack: fractionDecimalPack, coreConceptIds: ['g3-1-fraction-decimal-fraction-decimal'], requiredRepresentations: ['diagram', 'text'], recipes: G3_1_FRACTION_DECIMAL_FAMILY_RECIPES },
])
