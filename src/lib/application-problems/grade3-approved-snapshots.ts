import approvedSnapshots from '../../../public/data/application-problems/grade3-approved-family-snapshots-v1.json'

import type { ApplicationProblemFamilyV1, JsonValue } from './contracts'
import { createApplicationProofManifestDigest } from './proof-trust.internal'

const familyDigests = Object.freeze({ ...approvedSnapshots.familyDigests })

export const GRADE3_APPROVED_FAMILY_SNAPSHOT_DIGESTS_V1: Readonly<Record<string, string>> =
  familyDigests

export function grade3ApprovedFamilySnapshotDigest(
  family: ApplicationProblemFamilyV1,
): string {
  return createApplicationProofManifestDigest(family as unknown as JsonValue)
}

export function matchesGrade3ApprovedFamilySnapshot(
  family: ApplicationProblemFamilyV1,
): boolean {
  const key = `${family.familyId}@${family.version}`
  return familyDigests[key as keyof typeof familyDigests]
    === grade3ApprovedFamilySnapshotDigest(family)
}
