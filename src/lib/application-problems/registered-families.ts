import { GRADE2_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade2-registry'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade5-registry'
import { GRADE6_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade6-registry'
import {
  parseApplicationProblemFamilyV1,
  type ApplicationProblemFamilyV1,
} from './contracts'
import type { ApplicationProblemRegistryV1 } from './registry'

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((entry) => {
      deepFreeze(entry)
    })
    Object.freeze(value)
  }
  return value
}

/**
 * The release ledger is an immutable historical approval snapshot, not an
 * alias of executable runtime metadata. JSON cloning deliberately keeps the
 * payload data-only before the contract parser canonicalizes and freezes it.
 */
function immutableReleaseSnapshot(
  family: ApplicationProblemFamilyV1,
): ApplicationProblemFamilyV1 {
  return deepFreeze(parseApplicationProblemFamilyV1(JSON.parse(JSON.stringify(family))))
}

/**
 * Complete production catalog for audits and review. Learner routes consume the
 * grade-specific shards so growth in another grade does not inflate their bundle.
 */
export const APPLICATION_PROBLEM_REGISTRY_V1: ApplicationProblemRegistryV1 = Object.freeze({
  entries: Object.freeze([
    ...GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.entries,
    ...GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries,
    ...GRADE6_APPLICATION_PROBLEM_REGISTRY_V1.entries,
  ]),
  releaseLedger: Object.freeze([
    ...(GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger ?? []),
    ...(GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger ?? []),
    ...(GRADE6_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger ?? []),
  ].map(immutableReleaseSnapshot)),
})
