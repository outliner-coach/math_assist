import type { GeneratedApplicationProblemV1, GeneratedApplicationVisualV1 } from './contracts'
import { isGrade6ApplicationProblemSnapshotV1Valid } from './grade6-snapshot-validator'
import {
  resolveApplicationVisual,
  type ApplicationVisualResolution,
} from './visual-validator'
import { GRADE6_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade6-registry'
import {
  isApplicationProblemSourceInteractionEligible,
  type ApplicationProblemRegistryV1,
} from './registry'

export function isGrade6ApplicationProblemInteractionEligible(
  problem: GeneratedApplicationProblemV1,
  registry: ApplicationProblemRegistryV1 = GRADE6_APPLICATION_PROBLEM_REGISTRY_V1,
): boolean {
  return isApplicationProblemSourceInteractionEligible(registry, problem)
}

export function resolveGrade6ApplicationRatioVisual(
  visual: GeneratedApplicationVisualV1,
  source?: { familyId: string; generatorVersion: number },
  registry: ApplicationProblemRegistryV1 = GRADE6_APPLICATION_PROBLEM_REGISTRY_V1,
): ApplicationVisualResolution {
  if (source && !isApplicationProblemSourceInteractionEligible(registry, source)) {
    return {
      status: 'blocked',
      role: 'required',
      semantics: visual.semantics,
      issues: [{
        code: 'ineligible_application_problem_version',
        path: 'applicationSource',
        message: 'Only approved or retired application problem versions can be displayed or graded',
      }],
    }
  }
  return resolveApplicationVisual(visual)
}

export function resolveGrade6ApplicationRatioProblem(
  problem: GeneratedApplicationProblemV1,
  registry: ApplicationProblemRegistryV1 = GRADE6_APPLICATION_PROBLEM_REGISTRY_V1,
): ApplicationVisualResolution {
  if (!isGrade6ApplicationProblemInteractionEligible(problem, registry)) {
    return resolveGrade6ApplicationRatioVisual(problem.visual, problem, registry)
  }
  if (!isGrade6ApplicationProblemSnapshotV1Valid(problem)) {
    return {
      status: 'blocked',
      role: 'required',
      semantics: problem.visual.semantics,
      issues: [{
        code: 'g6_ratio_snapshot_instance_mismatch',
        path: 'problem',
        message: 'Grade 6 ratio snapshot does not match its immutable generated instance',
      }],
    }
  }
  return resolveApplicationVisual(problem.visual)
}
