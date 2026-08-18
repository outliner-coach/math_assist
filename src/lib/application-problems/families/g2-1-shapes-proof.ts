import { G2_1_SHAPES_FAMILY_RECIPES } from './g2-1-shapes'

export function proveG2SemesterOneShapesFamilies() {
  return G2_1_SHAPES_FAMILY_RECIPES.map((recipe) => {
    const issues: string[] = []
    recipe.cases.forEach((_, variantIndex) => {
      recipe.validateContract(recipe.generate({ seed: 0, variantIndex }))
        .forEach((entry) => issues.push(`${variantIndex}:${entry.surface}:${entry.code}`))
    })
    return { familyId: recipe.family.familyId, checkedCount: recipe.cases.length, proven: issues.length === 0, issues }
  })
}
