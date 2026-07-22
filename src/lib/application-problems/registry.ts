import {
  parseApplicationProblemFamilyV1,
  type ApplicationProblemFamilyV1,
  type GeneratedApplicationProblemV1,
} from './contracts'
import type { ApplicationProblemFamilyGeneratorV1 } from './generator'

export type ApplicationProblemRuntimeV1 =
  | {
      kind: 'deterministic-generator'
      generator: ApplicationProblemFamilyGeneratorV1
    }
  | {
      kind: 'static-corpus'
      entries: readonly GeneratedApplicationProblemV1[]
    }

export interface ApplicationProblemRegistryEntryV1 {
  family: ApplicationProblemFamilyV1
  runtime: ApplicationProblemRuntimeV1
}

export interface ApplicationProblemRegistryV1 {
  entries: readonly ApplicationProblemRegistryEntryV1[]
}

export const EMPTY_APPLICATION_PROBLEM_REGISTRY: ApplicationProblemRegistryV1 = Object.freeze({
  entries: Object.freeze([] as ApplicationProblemRegistryEntryV1[]),
})

function hasApprovedOwnerEvidence(family: ApplicationProblemFamilyV1): boolean {
  try {
    const canonical = parseApplicationProblemFamilyV1(family)
    return (
      canonical.releaseStatus === 'approved' &&
      canonical.approval.ownerStatus === 'approved' &&
      canonical.approval.evidenceRefs.length > 0
    )
  } catch {
    return false
  }
}

function runtimeMatchesFamily(entry: ApplicationProblemRegistryEntryV1): boolean {
  if (entry.family.runtimeMode !== entry.runtime.kind) return false
  if (entry.runtime.kind === 'static-corpus') return true
  return (
    entry.runtime.generator.familyId === entry.family.familyId &&
    entry.runtime.generator.version === entry.family.version
  )
}

export function selectApprovedRuntimeCandidates(
  registry: ApplicationProblemRegistryV1,
): ApplicationProblemRegistryEntryV1[] {
  return registry.entries.filter(
    (entry) => hasApprovedOwnerEvidence(entry.family) && runtimeMatchesFamily(entry),
  )
}
