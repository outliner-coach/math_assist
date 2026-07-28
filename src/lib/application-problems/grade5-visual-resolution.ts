import type { GeneratedApplicationProblemV1 } from './contracts'
import { validateGrade5ApplicationGeometryProblem } from './families/grade5-geometry-visual-validator'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade5-registry'
import {
  isApplicationProblemSourceInteractionEligible,
  type ApplicationProblemRegistryV1,
} from './registry'
import {
  resolveApplicationVisual,
  type ApplicationVisualResolution,
} from './visual-validator'

const VISUAL_GENERATORS: Readonly<Record<string, string>> = {
  'g5-perimeter-boundary-rebuild': 'g5-perimeter-boundary-rebuild-visual',
  'g5-area-composite-inverse': 'g5-area-composite-inverse-visual',
  'g5-area-overlap-reconstruction': 'g5-area-overlap-reconstruction-visual',
}

export function isGrade5ApplicationProblemInteractionEligible(
  problem: GeneratedApplicationProblemV1,
  registry: ApplicationProblemRegistryV1 = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1,
): boolean {
  return isApplicationProblemSourceInteractionEligible(registry, problem)
}

export function resolveGrade5ApplicationGeometryVisual(
  problem: GeneratedApplicationProblemV1,
  registry: ApplicationProblemRegistryV1 = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1,
): ApplicationVisualResolution {
  if (!isGrade5ApplicationProblemInteractionEligible(problem, registry)) {
    return {
      status: 'blocked',
      role: 'required',
      semantics: problem.visual.semantics,
      issues: [{
        code: 'ineligible_application_problem_version',
        path: 'applicationSource',
        message: 'Only approved or retired application problem versions can be displayed or graded',
      }],
    }
  }
  const expectedGenerator = VISUAL_GENERATORS[problem.familyId]
  if (
    expectedGenerator === undefined ||
    problem.visual.generatorId !== expectedGenerator ||
    problem.visual.generatorVersion !== 1
  ) {
    return {
      status: 'blocked',
      role: 'required',
      semantics: problem.visual.semantics,
      issues: [{
        code: 'unsupported_g5_geometry_visual_generator',
        path: 'visual.generatorId',
        message: 'Grade 5 geometry visual generator does not match the problem family',
      }],
    }
  }
  return resolveApplicationVisual(problem.visual, {
    familyValidator: (scene) => validateGrade5ApplicationGeometryProblem(problem, scene),
  })
}
