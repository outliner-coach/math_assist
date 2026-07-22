import {
  parseApplicationProblemFamilyV1,
  parseGeneratedApplicationProblemV1,
  type ApplicationProblemFamilyV1,
} from './contracts'
import type { ApplicationProblemFamilyGeneratorV1 } from './generator'
import type { StaticCorpusEntryV1 } from './proof'

export type ApplicationProblemRuntimeV1 =
  | {
      kind: 'deterministic-generator'
      generator: ApplicationProblemFamilyGeneratorV1
    }
  | {
      kind: 'static-corpus'
      entries: readonly StaticCorpusEntryV1[]
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
  if (entry.runtime.kind === 'static-corpus') {
    if (!Array.isArray(entry.runtime.entries) || entry.runtime.entries.length === 0) return false
    const corpusIds = new Set<string>()
    try {
      return entry.runtime.entries.every((corpusEntry) => {
        const { corpusId, review } = corpusEntry
        if (
          !/^[a-z0-9][a-z0-9-]*$/.test(corpusId) ||
          corpusIds.has(corpusId) ||
          review.status !== 'approved' ||
          typeof review.reviewerId !== 'string' ||
          review.reviewerId.trim() === '' ||
          typeof review.reviewedAt !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(review.reviewedAt) ||
          !Number.isFinite(Date.parse(review.reviewedAt)) ||
          !Array.isArray(review.evidenceRefs) ||
          review.evidenceRefs.length === 0 ||
          review.evidenceRefs.some(
            (reference: unknown) =>
              typeof reference !== 'string' ||
              reference.trim() === '' ||
              reference.startsWith('/') ||
              reference.split('/').includes('..'),
          )
        ) {
          return false
        }
        corpusIds.add(corpusId)
        const problem = parseGeneratedApplicationProblemV1(corpusEntry.problem)
        return (
          problem.familyId === entry.family.familyId &&
          problem.generatorVersion === entry.family.version &&
          problem.packId === entry.family.packId
        )
      })
    } catch {
      return false
    }
  }
  return (
    entry.runtime.generator.familyId === entry.family.familyId &&
    entry.runtime.generator.version === entry.family.version &&
    entry.runtime.generator.packId === entry.family.packId
  )
}

export function selectApprovedRuntimeCandidates(
  registry: ApplicationProblemRegistryV1,
): ApplicationProblemRegistryEntryV1[] {
  return registry.entries.filter(
    (entry) => hasApprovedOwnerEvidence(entry.family) && runtimeMatchesFamily(entry),
  )
}
