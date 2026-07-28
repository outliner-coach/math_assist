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
  it('registers exactly the nine owner-approved V1 pilot makers as production candidates', () => {
    expect(APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => entry.family.familyId)).toEqual([
      'g2-length-route-total',
      'g2-length-missing-segment',
      'g2-length-claim-check',
      'g5-perimeter-boundary-rebuild',
      'g5-area-composite-inverse',
      'g5-area-overlap-reconstruction',
      'g6-ratio-part-whole',
      'g6-ratio-relative-comparison',
      'g6-ratio-representation-check',
    ])
    const expectedApproval = {
      ownerStatus: 'approved',
      ownerId: 'project-owner',
      approvedAt: '2026-07-28T09:05:24Z',
      evidenceRefs: ['docs/reviews/application-problems-v1-approval.md'],
      expertStatus: 'not-reviewed',
    }
    expect(APPLICATION_PROBLEM_REGISTRY_V1.entries.every((entry) => (
      entry.family.releaseStatus === 'approved' &&
      JSON.stringify(entry.family.approval) === JSON.stringify(expectedApproval)
    ))).toBe(true)
    expect(APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger).toHaveLength(9)
    expect(APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger.every((family) => (
      family.releaseStatus === 'approved' &&
      JSON.stringify(family.approval) === JSON.stringify(expectedApproval)
    ))).toBe(true)
    const candidates = selectApprovedRuntimeCandidates(APPLICATION_PROBLEM_REGISTRY_V1)
    expect(candidates).toHaveLength(9)
    expect(new Set(candidates.map((entry) => `${entry.family.familyId}@${entry.family.version}`)).size)
      .toBe(9)
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
    expect(selectApprovedRuntimeCandidates(forgedRegistry)).toHaveLength(8)
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

  it('appends three approved Grade 2 missions with stable ids and shell semantics', () => {
    const missions = buildApprovedGrade2ApplicationMissions(42, approvedRegistry([
      'g2-length-route-total',
      'g2-length-missing-segment',
      'g2-length-claim-check',
    ]))

    expect(missions.map((mission) => mission.id)).toEqual([
      'g2-2-length-application-route-total-v1',
      'g2-2-length-application-missing-segment-v1',
      'g2-2-length-application-claim-check-v1',
    ])
    expect(missions.map((mission) => mission.unitMissionOrder)).toEqual([13, 14, 15])
    expect(missions.map((mission) => mission.stageOrder)).toEqual([145, 146, 147])
    expect(missions.every((mission) => mission.rewardId === 'measureTape')).toBe(true)
    expect(missions.slice(0, 2).every((mission) => mission.answerType === 'length')).toBe(true)
    expect(missions[2].answerType).toBe('choice')
    expect(missions[2].choices?.[missions[2].correctChoiceIndex!]).toBe(missions[2].correctAnswer)
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
