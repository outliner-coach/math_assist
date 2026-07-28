import {
  parseApplicationProblemFamilyV1,
  parseGeneratedApplicationProblemV1,
  type ApplicationProblemFamilyV1,
} from './contracts'
import type { ApplicationProblemFamilyGeneratorV1 } from './generator'
import type { StaticCorpusEntryV1 } from './proof'
import type { ApplicationProblemSource } from '../types'

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
  /**
   * Immutable release metadata is kept independently from executable runtimes
   * so retired or quarantined historical snapshots remain classifiable after
   * their maker code is removed.
   */
  releaseLedger: readonly ApplicationProblemFamilyV1[]
}

export const EMPTY_APPLICATION_PROBLEM_REGISTRY: ApplicationProblemRegistryV1 = Object.freeze({
  entries: Object.freeze([] as ApplicationProblemRegistryEntryV1[]),
  releaseLedger: Object.freeze([] as ApplicationProblemFamilyV1[]),
})

export function deterministicRegistryEntry(
  family: ApplicationProblemFamilyV1,
  generator: ApplicationProblemFamilyGeneratorV1,
): ApplicationProblemRegistryEntryV1 {
  return Object.freeze({
    family,
    runtime: Object.freeze({ kind: 'deterministic-generator' as const, generator }),
  })
}

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

function canonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJson)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalJson(entry)]),
    )
  }
  return value
}

function sameFamilySnapshot(
  left: ApplicationProblemFamilyV1,
  right: ApplicationProblemFamilyV1,
): boolean {
  try {
    return JSON.stringify(canonicalJson(parseApplicationProblemFamilyV1(left))) ===
      JSON.stringify(canonicalJson(parseApplicationProblemFamilyV1(right)))
  } catch {
    return false
  }
}

function matchingReleaseLedgerEntries(
  registry: ApplicationProblemRegistryV1,
  source: Pick<ApplicationProblemSource, 'familyId' | 'generatorVersion'>,
): readonly ApplicationProblemFamilyV1[] {
  return registry.releaseLedger.filter((family) => (
    family.familyId === source.familyId &&
    family.version === source.generatorVersion
  ))
}

export function selectApprovedRuntimeCandidates(
  registry: ApplicationProblemRegistryV1,
): ApplicationProblemRegistryEntryV1[] {
  const eligible = registry.entries.filter(
    (entry) => {
      if (!hasApprovedOwnerEvidence(entry.family) || !runtimeMatchesFamily(entry)) return false
      const ledgerEntries = matchingReleaseLedgerEntries(registry, {
        familyId: entry.family.familyId,
        generatorVersion: entry.family.version,
      })
      return ledgerEntries.length === 1 &&
        hasApprovedOwnerEvidence(ledgerEntries[0]) &&
        sameFamilySnapshot(entry.family, ledgerEntries[0])
    },
  )
  const identityCounts = new Map<string, number>()
  eligible.forEach((entry) => {
    const identity = `${entry.family.familyId}@${entry.family.version}`
    identityCounts.set(identity, (identityCounts.get(identity) ?? 0) + 1)
  })

  return eligible.filter((entry) => (
    identityCounts.get(`${entry.family.familyId}@${entry.family.version}`) === 1
  ))
}

export function isApplicationProblemSourceQuarantined(
  registry: ApplicationProblemRegistryV1,
  source: Pick<ApplicationProblemSource, 'familyId' | 'generatorVersion'>,
): boolean {
  return getApplicationProblemSourceReleaseStatus(registry, source) === 'quarantined'
}

export type ApplicationProblemSourceReleaseStatus =
  | 'approved'
  | 'draft'
  | 'quarantined'
  | 'retired'
  | 'unknown'

export function getApplicationProblemSourceReleaseStatus(
  registry: ApplicationProblemRegistryV1,
  source: Pick<ApplicationProblemSource, 'familyId' | 'generatorVersion'>,
): ApplicationProblemSourceReleaseStatus {
  const matchingEntries = matchingReleaseLedgerEntries(registry, source)
  if (matchingEntries.length !== 1) return 'unknown'
  const [family] = matchingEntries
  try {
    const canonical = parseApplicationProblemFamilyV1(family)
    if (canonical.releaseStatus !== 'approved') return canonical.releaseStatus
    return hasApprovedOwnerEvidence(canonical) ? 'approved' : 'draft'
  } catch {
    return 'unknown'
  }
}

export function isApplicationProblemSourceInteractionEligible(
  registry: ApplicationProblemRegistryV1,
  source: Pick<ApplicationProblemSource, 'familyId' | 'generatorVersion'>,
): boolean {
  const status = getApplicationProblemSourceReleaseStatus(registry, source)
  return status === 'approved' || status === 'retired'
}
