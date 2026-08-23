import type { GeneratedApplicationProblemV1 } from '../contracts'
import { isGrade5ApplicationProblemSnapshotV1Valid } from '../grade5-snapshot-validator'
import type { ApplicationVisualSceneV1 } from '../visual-model'
import type { ApplicationVisualValidationIssue } from '../visual-validator'

const SUPPORTED_FAMILIES = new Set([
  'g5-perimeter-boundary-rebuild',
  'g5-area-composite-inverse',
  'g5-area-overlap-reconstruction',
])

function canonical(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(canonical)
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonical(entry)]),
  )
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right))
}

export function validateGrade5ApplicationGeometryProblem(
  problem: Readonly<GeneratedApplicationProblemV1>,
  scene: Readonly<ApplicationVisualSceneV1>,
): readonly ApplicationVisualValidationIssue[] {
  if (!SUPPORTED_FAMILIES.has(problem.familyId)) {
    return [{
      code: 'unsupported_grade5_geometry_family',
      path: 'problem.familyId',
      message: 'Grade 5 quantitative geometry family is not registered by this wrapper',
    }]
  }
  if (scene.surface !== 'diagram' || scene.semantics !== 'quantitative') {
    return [{
      code: 'invalid_grade5_geometry_surface',
      path: 'scene',
      message: 'Grade 5 quantitative geometry requires a quantitative diagram',
    }]
  }
  if (!isGrade5ApplicationProblemSnapshotV1Valid(problem)) {
    return [{
      code: 'grade5_snapshot_instance_mismatch',
      path: 'problem',
      message: 'Grade 5 geometry snapshot does not match its immutable historical V1 instance',
    }]
  }
  if (!sameJson(scene, problem.visual.mathModel)) {
    return [{
      code: 'grade5_scene_problem_mismatch',
      path: 'visual.mathModel',
      message: 'The quantitative scene does not exactly match this problem instance',
    }]
  }
  return []
}
