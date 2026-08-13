import type { GeneratedApplicationVisualV1 } from './contracts'
import {
  resolveApplicationVisual,
  type ApplicationVisualResolution,
} from './visual-validator'

/**
 * Frozen V1 snapshots have already been matched against their complete
 * historical instance by grade2-snapshot-validator. Rendering therefore uses
 * only the version-neutral scene contract and never calls a live family maker
 * or family validator.
 */
export function resolveGrade2ApplicationSnapshotVisualV1(
  visual: GeneratedApplicationVisualV1,
): ApplicationVisualResolution {
  return resolveApplicationVisual(visual)
}
