import { describe, expect, it } from 'vitest'

import {
  G5_PERIMETER_BOUNDARY_REBUILD_FAMILY,
  G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR,
} from './families/grade5-geometry-families'
import {
  selectApprovedRuntimeCandidates,
  type ApplicationProblemRegistryEntryV1,
  type ApplicationProblemRegistryV1,
} from './registry'
import { APPLICATION_PROBLEM_REGISTRY_V1 } from './registered-families'
import { GRADE2_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade2-registry'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade5-registry'
import { GRADE6_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade6-registry'
import { buildApprovedGrade2ApplicationMissions } from './grade2-runtime'
import {
  APPLICATION_PROBLEM_MAX_SEED_ATTEMPTS,
  generateRegisteredApplicationProblemWithRetry,
  selectApprovedPracticeApplicationPlacements,
} from './runtime-integration'

const ownerApproval = {
  ownerStatus: 'approved' as const,
  ownerId: 'integration-test-owner',
  approvedAt: '2026-07-23T00:00:00.000Z',
  evidenceRefs: ['src/lib/application-problems/runtime-integration.test.ts'],
  expertStatus: 'not-reviewed' as const,
}

function approvedRegistry(
  familyIds = APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => entry.family.familyId),
): ApplicationProblemRegistryV1 {
  const approved = new Set(familyIds)
  const approveFamily = <T extends ApplicationProblemRegistryV1['entries'][number]['family']>(
    family: T,
  ): T => approved.has(family.familyId)
    ? {
        ...family,
        releaseStatus: 'approved' as const,
        approval: ownerApproval,
      }
    : {
        ...family,
        releaseStatus: 'draft' as const,
        approval: {
          ownerStatus: 'pending' as const,
          evidenceRefs: [],
          expertStatus: 'not-reviewed' as const,
        },
      }
  return {
    entries: APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => ({
      ...entry,
      family: approveFamily(entry.family),
    })),
    releaseLedger: APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger.map(approveFamily),
  }
}

describe('application runtime integration', () => {
  it('preserves the nine V1 pilots while registering the fifty approved Grade 2 makers', () => {
    const fixedPilotIds = [
      'g2-length-route-total',
      'g2-length-missing-segment',
      'g2-length-claim-check',
      'g5-perimeter-boundary-rebuild',
      'g5-area-composite-inverse',
      'g5-area-overlap-reconstruction',
      'g6-ratio-part-whole',
      'g6-ratio-relative-comparison',
      'g6-ratio-representation-check',
    ]
    expect(APPLICATION_PROBLEM_REGISTRY_V1.entries).toHaveLength(59)
    expect(APPLICATION_PROBLEM_REGISTRY_V1.entries
      .filter((entry) => fixedPilotIds.includes(entry.family.familyId))
      .map((entry) => entry.family.familyId)).toEqual(fixedPilotIds)
    const pilotApproval = {
      ownerStatus: 'approved',
      ownerId: 'project-owner',
      approvedAt: '2026-07-28T09:05:24Z',
      evidenceRefs: ['docs/reviews/application-problems-v1-approval.md'],
      expertStatus: 'not-reviewed',
    }
    expect(APPLICATION_PROBLEM_REGISTRY_V1.entries
      .filter((entry) => fixedPilotIds.includes(entry.family.familyId))
      .every((entry) => JSON.stringify(entry.family.approval) === JSON.stringify(pilotApproval)))
      .toBe(true)
    expect(APPLICATION_PROBLEM_REGISTRY_V1.entries.every((entry) => (
      entry.family.releaseStatus === 'approved' && entry.family.approval.ownerStatus === 'approved'
    ))).toBe(true)
    expect(APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger).toHaveLength(59)
    const candidates = selectApprovedRuntimeCandidates(APPLICATION_PROBLEM_REGISTRY_V1)
    expect(candidates).toHaveLength(59)
    expect(new Set(candidates.map((entry) => `${entry.family.familyId}@${entry.family.version}`)).size)
      .toBe(59)
  })

  it('keeps a deeply frozen release-ledger snapshot independent from every runtime family', () => {
    const runtimeEntry = APPLICATION_PROBLEM_REGISTRY_V1.entries.find(
      (entry) => entry.family.familyId === 'g5-perimeter-boundary-rebuild',
    )
    const ledgerFamily = APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger.find(
      (family) => family.familyId === 'g5-perimeter-boundary-rebuild',
    )

    expect(runtimeEntry).toBeDefined()
    expect(ledgerFamily).toBeDefined()
    if (!runtimeEntry || !ledgerFamily) return

    expect(ledgerFamily).not.toBe(runtimeEntry.family)
    expect(ledgerFamily.approval).not.toBe(runtimeEntry.family.approval)
    expect(ledgerFamily.approval.evidenceRefs).not.toBe(runtimeEntry.family.approval.evidenceRefs)
    expect(Object.isFrozen(ledgerFamily)).toBe(true)
    expect(Object.isFrozen(ledgerFamily.approval)).toBe(true)
    expect(Object.isFrozen(ledgerFamily.approval.evidenceRefs)).toBe(true)

    const forgedRegistry: ApplicationProblemRegistryV1 = {
      entries: APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => (
        entry === runtimeEntry
          ? {
              ...entry,
              family: {
                ...entry.family,
                approval: { ...entry.family.approval, ownerId: 'forged-owner' },
              },
            }
          : entry
      )),
      releaseLedger: APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger,
    }

    expect(ledgerFamily.approval.ownerId).toBe('project-owner')
    expect(selectApprovedRuntimeCandidates(forgedRegistry)).toHaveLength(58)
  })

  it.each([
    ['Grade 2', GRADE2_APPLICATION_PROBLEM_REGISTRY_V1, 53],
    ['Grade 5', GRADE5_APPLICATION_PROBLEM_REGISTRY_V1, 3],
    ['Grade 6', GRADE6_APPLICATION_PROBLEM_REGISTRY_V1, 3],
  ] as const)('keeps the %s learner shard ledger detached and immutable', (_label, registry, expectedCount) => {
    expect(selectApprovedRuntimeCandidates(registry)).toHaveLength(expectedCount)

    for (const entry of registry.entries) {
      const ledgerFamily = registry.releaseLedger.find((family) => (
        family.familyId === entry.family.familyId && family.version === entry.family.version
      ))
      expect(ledgerFamily).toBeDefined()
      if (!ledgerFamily) continue
      expect(ledgerFamily).not.toBe(entry.family)
      expect(ledgerFamily.approval).not.toBe(entry.family.approval)
      expect(ledgerFamily.approval.evidenceRefs).not.toBe(entry.family.approval.evidenceRefs)
      expect(Object.isFrozen(ledgerFamily)).toBe(true)
      expect(Object.isFrozen(ledgerFamily.approval)).toBe(true)
      expect(Object.isFrozen(ledgerFamily.approval.evidenceRefs)).toBe(true)
    }

    const [targetEntry] = registry.entries
    const targetLedger = registry.releaseLedger.find((family) => (
      family.familyId === targetEntry.family.familyId && family.version === targetEntry.family.version
    ))
    const forgedRegistry: ApplicationProblemRegistryV1 = {
      entries: registry.entries.map((entry) => (
        entry === targetEntry
          ? {
              ...entry,
              family: {
                ...entry.family,
                approval: { ...entry.family.approval, ownerId: 'forged-owner' },
              },
            }
          : entry
      )),
      releaseLedger: registry.releaseLedger,
    }

    expect(targetEntry.family.approval.ownerId).toBe('project-owner')
    expect(targetLedger?.approval.ownerId).toBe('project-owner')
    expect(selectApprovedRuntimeCandidates(forgedRegistry)).toHaveLength(expectedCount - 1)
    expect(selectApprovedRuntimeCandidates(registry)).toHaveLength(expectedCount)
  })

  it('maps only owner-approved families with evidence into their Grade 5/6 concepts', () => {
    const registry = approvedRegistry([
      'g5-perimeter-boundary-rebuild',
      'g5-area-composite-inverse',
      'g6-ratio-part-whole',
    ])

    expect(selectApprovedPracticeApplicationPlacements({
      registry,
      grade: 5,
      conceptId: 'perimeter-001',
    }).map(({ entry }) => entry.family.familyId)).toEqual([
      'g5-perimeter-boundary-rebuild',
    ])
    expect(selectApprovedPracticeApplicationPlacements({
      registry,
      grade: 5,
      conceptId: 'area-001',
    }).map(({ entry }) => entry.family.familyId)).toEqual([
      'g5-area-composite-inverse',
    ])
    expect(selectApprovedPracticeApplicationPlacements({
      registry,
      grade: 6,
      conceptId: 'g6ratio-001',
    }).map(({ entry }) => entry.family.familyId)).toEqual([
      'g6-ratio-part-whole',
    ])
    expect(selectApprovedPracticeApplicationPlacements({
      registry: APPLICATION_PROBLEM_REGISTRY_V1,
      grade: 6,
      conceptId: 'g6ratio-001',
    }).map(({ entry }) => entry.family.familyId)).toEqual([
      'g6-ratio-part-whole',
      'g6-ratio-relative-comparison',
      'g6-ratio-representation-check',
    ])
  })

  it('selects the highest approved family version regardless of registry order', () => {
    const version1: ApplicationProblemRegistryEntryV1 = {
      family: {
        ...G5_PERIMETER_BOUNDARY_REBUILD_FAMILY,
        releaseStatus: 'approved',
        approval: ownerApproval,
      },
      runtime: {
        kind: 'deterministic-generator',
        generator: G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR,
      },
    }
    const version2: ApplicationProblemRegistryEntryV1 = {
      family: { ...version1.family, version: 2 },
      runtime: {
        kind: 'deterministic-generator',
        generator: { ...G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR, version: 2 },
      },
    }

    expect(selectApprovedPracticeApplicationPlacements({
      registry: {
        entries: [version2, version1],
        releaseLedger: [version2.family, version1.family],
      },
      grade: 5,
      conceptId: 'perimeter-001',
    }).map(({ entry }) => entry.family.version)).toEqual([2])
  })

  it('fails closed when an approved family version is registered more than once', () => {
    const duplicated: ApplicationProblemRegistryEntryV1 = {
      family: {
        ...G5_PERIMETER_BOUNDARY_REBUILD_FAMILY,
        releaseStatus: 'approved',
        approval: ownerApproval,
      },
      runtime: {
        kind: 'deterministic-generator',
        generator: G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR,
      },
    }

    const duplicatedRegistry = {
      entries: [duplicated, duplicated],
      releaseLedger: [duplicated.family, duplicated.family],
    }
    expect(selectApprovedRuntimeCandidates(duplicatedRegistry)).toEqual([])
    expect(selectApprovedPracticeApplicationPlacements({
      registry: duplicatedRegistry,
      grade: 5,
      conceptId: 'perimeter-001',
    })).toEqual([])
  })

  it('rejects a raw runtime entry that was not selected from the supplied release ledger', () => {
    const registry = approvedRegistry(['g5-perimeter-boundary-rebuild'])
    const selected = selectApprovedRuntimeCandidates(registry)[0]
    const unselectedClone: ApplicationProblemRegistryEntryV1 = {
      ...selected,
      family: { ...selected.family },
    }

    expect(() => generateRegisteredApplicationProblemWithRetry({
      registry,
      entry: unselectedClone,
      seed: 17,
      variantIndex: 0,
    })).toThrow(/not an approved runtime candidate/)
  })

  it('rotates approved Grade 2 families through one stable six-slot replacement', () => {
    const missions = buildApprovedGrade2ApplicationMissions(42, approvedRegistry([
      'g2-length-route-total',
      'g2-length-missing-segment',
      'g2-length-claim-check',
    ]))

    expect(missions).toHaveLength(1)
    expect(missions[0].id).toBe('g2-2-length-06-v1')
    expect(missions[0].unitMissionOrder).toBe(6)
    expect(missions[0].stageOrder).toBe(108)
    expect(missions.every((mission) => mission.rewardId === 'measureTape')).toBe(true)
    expect(missions[0].answerType).toBe('choice')
    expect(missions[0].choices?.[missions[0].correctChoiceIndex!]).toBe(missions[0].correctAnswer)
    expect(missions[0].applicationPlacement).toEqual({
      schemaVersion: 'grade2-application-placement-v1',
      baseMissionId: missions[0].id,
      baseSeed: 42,
    })
    expect(missions.every((mission) => mission.applicationSource.familyId)).toBe(true)
  })

  it('uses the initial seed plus up to three deterministic retry seeds', () => {
    const seenSeeds: number[] = []
    const successfulSeeds = new Set<number>()
    const generator = {
      ...G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR,
      sample(context: Parameters<typeof G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR.sample>[0]) {
        seenSeeds.push(context.seed)
        successfulSeeds.add(context.seed)
        if (successfulSeeds.size < 4) {
          throw new Error('retry this seed')
        }
        return G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR.sample(context)
      },
    }
    const entry: ApplicationProblemRegistryEntryV1 = {
      family: {
        ...G5_PERIMETER_BOUNDARY_REBUILD_FAMILY,
        releaseStatus: 'approved',
        approval: ownerApproval,
      },
      runtime: { kind: 'deterministic-generator', generator },
    }

    const registry = { entries: [entry], releaseLedger: [entry.family] }
    const problem = generateRegisteredApplicationProblemWithRetry({
      registry,
      entry,
      seed: 17,
      variantIndex: 2,
    })
    const distinctSeeds = Array.from(new Set(seenSeeds))

    expect(distinctSeeds).toHaveLength(4)
    expect(problem.seed).toBe(distinctSeeds.at(-1))
    expect(problem.variantIndex).toBe(2)
  })

  it('throws one all-or-nothing failure after the initial seed and three retries', () => {
    const seenSeeds: number[] = []
    const entry: ApplicationProblemRegistryEntryV1 = {
      family: {
        ...G5_PERIMETER_BOUNDARY_REBUILD_FAMILY,
        releaseStatus: 'approved',
        approval: ownerApproval,
      },
      runtime: {
        kind: 'deterministic-generator',
        generator: {
          ...G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR,
          sample(context: Parameters<typeof G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR.sample>[0]) {
            seenSeeds.push(context.seed)
            throw new Error('always fail')
          },
        },
      },
    }

    const registry = { entries: [entry], releaseLedger: [entry.family] }
    expect(() => generateRegisteredApplicationProblemWithRetry({
      registry,
      entry,
      seed: Number.MAX_SAFE_INTEGER,
      variantIndex: 0,
    })).toThrowError(expect.objectContaining({
      name: 'ApplicationProblemRuntimeGenerationError',
      attempts: APPLICATION_PROBLEM_MAX_SEED_ATTEMPTS,
    }))
    expect(new Set(seenSeeds).size).toBe(4)
  })
})
