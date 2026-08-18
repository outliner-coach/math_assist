import { resolveApplicationVisual } from '../visual-validator'
import { G2_1_PLACE_VALUE_FAMILY_RECIPES } from './g2-1-place-value'
import { evaluateG2SemesterOnePlaceValueOracle } from './g2-1-place-value.oracle'

export function proveG2SemesterOnePlaceValueFamilies() {
  return G2_1_PLACE_VALUE_FAMILY_RECIPES.map((recipe) => {
    const issues: string[] = []
    recipe.cases.forEach((_, variantIndex) => {
      const problem = recipe.generate({ seed: 0, variantIndex })
      if (problem.answer.normalized !== evaluateG2SemesterOnePlaceValueOracle(problem)) issues.push(`oracle:${variantIndex}`)
      if (resolveApplicationVisual(problem.visual, { familyValidator: (scene) => recipe.validateScene(scene, problem.params) }).status !== 'ready') issues.push(`visual:${variantIndex}`)
    })
    return { familyId: recipe.family.familyId, checkedCount: recipe.cases.length, proven: issues.length === 0, issues }
  })
}
