import { parseApplicationProblemFamilyV1 } from './contracts'
import { GRADE3_APPLICATION_AUTHORING_CATALOG_V1 } from './authoring-catalog'
import {
  createImmutableReleaseFamilySnapshot,
  deterministicRegistryEntry,
  type ApplicationProblemRegistryV1,
} from './registry'
import {
  GRADE3_APPROVED_FAMILY_SNAPSHOT_DIGESTS_V1,
  matchesGrade3ApprovedFamilySnapshot,
} from './grade3-approved-snapshots'

export const GRADE3_FULL_RELEASE_APPROVAL_V1 = Object.freeze({
  ownerStatus: 'approved' as const,
  ownerId: 'project-owner',
  approvedAt: '2026-08-18T09:24:24Z',
  evidenceRefs: Object.freeze(['docs/reviews/application-problems-grade3-approval.md']),
  expertStatus: 'not-reviewed' as const,
})

const releasedEntries = GRADE3_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates
  .flatMap(({ familyCandidates }) => familyCandidates)
  .map(({ family, runtime }) => {
    if (runtime.kind !== 'deterministic-generator') {
      throw new TypeError(`Grade 3 release requires deterministic generator: ${family.familyId}`)
    }
    return deterministicRegistryEntry(
      parseApplicationProblemFamilyV1({
        ...family,
        releaseStatus: 'approved',
        approval: GRADE3_FULL_RELEASE_APPROVAL_V1,
      }),
      runtime.generator,
    )
  })

const releasedKeys = new Set(releasedEntries.map(({ family }) => (
  `${family.familyId}@${family.version}`
)))
const approvedKeys = Object.keys(GRADE3_APPROVED_FAMILY_SNAPSHOT_DIGESTS_V1)
if (
  releasedKeys.size !== approvedKeys.length
  || approvedKeys.some((key) => !releasedKeys.has(key))
  || releasedEntries.some(({ family }) => !matchesGrade3ApprovedFamilySnapshot(family))
) {
  throw new TypeError('Grade 3 runtime entries do not match the independent approval snapshot')
}

export const GRADE3_APPLICATION_PROBLEM_REGISTRY_V1: ApplicationProblemRegistryV1 =
  Object.freeze({
    entries: Object.freeze(releasedEntries),
    releaseLedger: Object.freeze(
      releasedEntries.map(({ family }) => createImmutableReleaseFamilySnapshot(family)),
    ),
  })
