import type { PracticeGrade } from '../types'
import type { AdditionalProblemCandidate } from '../problem-generator'
import type { ApplicationProblemRegistryV1 } from './registry'
import {
  buildPracticeApplicationProblem,
  selectApprovedPracticeApplicationPlacements,
} from './runtime-integration'

export function buildApprovedPracticeProblemCandidates(input: {
  grade: PracticeGrade
  conceptId: string
  registry?: ApplicationProblemRegistryV1
}): AdditionalProblemCandidate[] {
  const registry = input.registry
  if (!registry) return []
  return selectApprovedPracticeApplicationPlacements({
    registry,
    grade: input.grade,
    conceptId: input.conceptId,
  }).map(({ placement, entry }) => ({
    id: `${entry.family.familyId}@${entry.family.version}`,
    difficulty: placement.difficulty,
    generate: ({ seed, variantIndex, index, setId }) => buildPracticeApplicationProblem({
      registry,
      placement,
      entry,
      seed,
      variantIndex,
      index,
      setId,
    }),
  }))
}
