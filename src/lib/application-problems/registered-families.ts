import { GRADE2_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade2-registry'
import { GRADE3_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade3-registry'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade5-registry'
import { GRADE6_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade6-registry'
import {
  createImmutableReleaseFamilySnapshot,
  type ApplicationProblemRegistryV1,
} from './registry'

/**
 * Complete production catalog for audits and review. Learner routes consume the
 * grade-specific shards so growth in another grade does not inflate their bundle.
 */
export const APPLICATION_PROBLEM_REGISTRY_V1: ApplicationProblemRegistryV1 = Object.freeze({
  entries: Object.freeze([
    ...GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.entries,
    ...GRADE3_APPLICATION_PROBLEM_REGISTRY_V1.entries,
    ...GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries,
    ...GRADE6_APPLICATION_PROBLEM_REGISTRY_V1.entries,
  ]),
  releaseLedger: Object.freeze([
    ...(GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger ?? []),
    ...(GRADE3_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger ?? []),
    ...(GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger ?? []),
    ...(GRADE6_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger ?? []),
  ].map(createImmutableReleaseFamilySnapshot)),
})
