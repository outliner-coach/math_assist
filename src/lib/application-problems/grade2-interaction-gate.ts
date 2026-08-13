import type { Grade2Mission } from '../grade2-problems'
import {
  hasGrade2ApplicationProblemSource,
  isGrade2ApplicationMission,
} from './grade2-adapter'
import { isGrade2ApplicationMissionSemanticallyValid } from './grade2-snapshot-validator'
import { resolveGrade2ApplicationSnapshotVisualV1 } from './grade2-v1-visual-resolution'
import { GRADE2_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade2-registry'
import {
  isApplicationProblemSourceInteractionEligible,
  type ApplicationProblemRegistryV1,
} from './registry'

export type Grade2MissionInteractionStatus = 'legacy' | 'ready' | 'blocked'

function canonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJson)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, canonicalJson((value as Record<string, unknown>)[key])]),
    )
  }
  return value
}

export function resolveGrade2MissionInteraction(
  mission: Grade2Mission,
  registry: ApplicationProblemRegistryV1 = GRADE2_APPLICATION_PROBLEM_REGISTRY_V1,
): Grade2MissionInteractionStatus {
  if (!hasGrade2ApplicationProblemSource(mission)) return 'legacy'
  if (!isGrade2ApplicationMission(mission)) return 'blocked'
  if (!isGrade2ApplicationMissionSemanticallyValid(mission)) return 'blocked'
  if (!isApplicationProblemSourceInteractionEligible(registry, mission.applicationSource)) {
    return 'blocked'
  }
  return resolveGrade2ApplicationSnapshotVisualV1(
    mission.applicationVisual,
  ).status === 'ready'
    ? 'ready'
    : 'blocked'
}

export function grade2MissionVariantSignature(mission: Grade2Mission): string {
  if (!hasGrade2ApplicationProblemSource(mission)) {
    return JSON.stringify([
      mission.prompt,
      mission.correctAnswer,
      mission.choices,
      mission.visualConfig,
    ])
  }
  return JSON.stringify(canonicalJson([
    mission.prompt,
    mission.correctAnswer,
    mission.choices,
    isGrade2ApplicationMission(mission) ? mission.applicationVisual : null,
  ]))
}
