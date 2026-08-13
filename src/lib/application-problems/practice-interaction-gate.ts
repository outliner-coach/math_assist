import type { PracticeGrade, Problem } from '../types'
import type { ApplicationProblemRegistryV1 } from './registry'
import {
  hasApplicationProblemFootprint,
  hasApplicationProblemSource,
  restoreGeneratedApplicationProblemFromPractice,
} from './template-adapter'

export async function canGradePracticeProblem(
  problem: Problem,
  grade: PracticeGrade,
  registry?: ApplicationProblemRegistryV1,
): Promise<boolean> {
  if (!hasApplicationProblemFootprint(problem)) return true
  if (!hasApplicationProblemSource(problem)) return false
  const generated = restoreGeneratedApplicationProblemFromPractice(problem)
  if (!generated) return false

  if (grade === 5) {
    if (!generated.familyId.startsWith('g5-')) return false
    const {
      isGrade5ApplicationProblemInteractionEligible,
      resolveGrade5ApplicationGeometryVisual,
    } = await import('./grade5-visual-resolution')
    if (!isGrade5ApplicationProblemInteractionEligible(generated, registry)) return false
    return resolveGrade5ApplicationGeometryVisual(generated, registry).status === 'ready'
  }

  if (!generated.familyId.startsWith('g6-')) return false
  const {
    isGrade6ApplicationProblemInteractionEligible,
    resolveGrade6ApplicationRatioProblem,
  } = await import('./grade6-visual-resolution')
  if (!isGrade6ApplicationProblemInteractionEligible(generated, registry)) return false
  return resolveGrade6ApplicationRatioProblem(generated, registry).status === 'ready'
}
