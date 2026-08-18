import { resolveApplicationVisual } from '../visual-validator'
import { G2_1_SHAPES_FAMILY_RECIPES } from './g2-1-shapes'
import { evaluateG2SemesterOneShapesOracle } from './g2-1-shapes.oracle'

export function proveG2SemesterOneShapesFamilies() {
  return G2_1_SHAPES_FAMILY_RECIPES.map((recipe) => {
    const issues: string[] = []
    recipe.cases.forEach((_, variantIndex) => {
      const problem = recipe.generate({ seed: 0, variantIndex })
      if (problem.answer.normalized !== evaluateG2SemesterOneShapesOracle(problem)) issues.push(`oracle:${variantIndex}`)
      if (resolveApplicationVisual(problem.visual, { familyValidator: (scene) => recipe.validateScene(scene, problem.params) }).status !== 'ready') issues.push(`visual:${variantIndex}`)
    })
    return { familyId: recipe.family.familyId, checkedCount: recipe.cases.length, proven: issues.length === 0, issues }
  })
}
