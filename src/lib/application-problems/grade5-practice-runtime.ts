import type { AdditionalProblemCandidate } from '../problem-generator'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade5-registry'
import { buildApprovedPracticeProblemCandidates } from './practice-runtime'
import type { ApplicationProblemRegistryV1 } from './registry'

export function buildApprovedGrade5PracticeProblemCandidates(input: {
  conceptId: string
  registry?: ApplicationProblemRegistryV1
}): AdditionalProblemCandidate[] {
  return buildApprovedPracticeProblemCandidates({
    grade: 5,
    conceptId: input.conceptId,
    registry: input.registry ?? GRADE5_APPLICATION_PROBLEM_REGISTRY_V1,
  })
}
