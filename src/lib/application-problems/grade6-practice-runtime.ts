import type { AdditionalProblemCandidate } from '../problem-generator'
import { GRADE6_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade6-registry'
import { buildApprovedPracticeProblemCandidates } from './practice-runtime'
import type { ApplicationProblemRegistryV1 } from './registry'

export function buildApprovedGrade6PracticeProblemCandidates(input: {
  conceptId: string
  registry?: ApplicationProblemRegistryV1
}): AdditionalProblemCandidate[] {
  return buildApprovedPracticeProblemCandidates({
    grade: 6,
    conceptId: input.conceptId,
    registry: input.registry ?? GRADE6_APPLICATION_PROBLEM_REGISTRY_V1,
  })
}
