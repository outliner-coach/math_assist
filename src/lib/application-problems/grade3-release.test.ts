import { describe, expect, it } from 'vitest'

import {
  auditApplicationProblemQuality,
  loadProductionApplicationProblemQualityInput,
} from '../../../scripts/application-problem-quality-core.js'
import {
  getGrade3MissionsByUnit,
  getGrade3MissionSession,
  grade3Units,
} from '../grade3-problems'
import {
  APPLICATION_PROBLEM_AUTHORING_CATALOG_V1,
  GRADE3_APPLICATION_AUTHORING_CATALOG_V1,
} from './authoring-catalog'
import { isGrade3ApplicationMission } from './grade3-adapter'
import { GRADE3_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade3-registry'
import { buildApprovedGrade3PracticeSet } from './grade3-runtime'
import { isApprovedGrade3ApplicationMissionSemanticallyValid } from './grade3-snapshot-validator'
import { getProductionApplicationFamilyEvidence } from './quality-evidence'
import type { ApplicationProblemRegistryV1 } from './registry'

const APPROVED_AT = '2026-08-18T09:24:24Z'
const EVIDENCE_REF = 'docs/reviews/application-problems-grade3-approval.md'

describe('Grade 3 full application release', () => {
  it('promotes exactly the 48 reviewed identities and advances the rollout to Grade 4', () => {
    const reviewedKeys = new Set(GRADE3_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates
      .flatMap(({ familyCandidates }) => familyCandidates)
      .map(({ family }) => `${family.familyId}@${family.version}`))
    const productionByKey = new Map(GRADE3_APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => [
      `${entry.family.familyId}@${entry.family.version}`,
      entry,
    ]))
    const input = loadProductionApplicationProblemQualityInput()

    expect(reviewedKeys.size).toBe(48)
    expect(GRADE3_APPLICATION_PROBLEM_REGISTRY_V1.entries).toHaveLength(48)
    expect(GRADE3_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger).toHaveLength(48)
    reviewedKeys.forEach((key) => {
      expect(productionByKey.get(key)?.family).toMatchObject({
        releaseStatus: 'approved',
        approval: {
          ownerStatus: 'approved',
          ownerId: 'project-owner',
          approvedAt: APPROVED_AT,
          evidenceRefs: [EVIDENCE_REF],
          expertStatus: 'not-reviewed',
        },
      })
    })
    expect(APPLICATION_PROBLEM_AUTHORING_CATALOG_V1.unitCandidates).toEqual([])
    expect(input.rollout).toMatchObject({ releasedThroughGrade: 3, buildingGrade: 4 })
    expect(input.packs.filter((pack: { grade: number; coverageStatus: string }) => (
      pack.grade === 3 && pack.coverageStatus === 'complete'
    ))).toHaveLength(12)
  })

  it.each(grade3Units)('$id places one approved non-knowing application in the stable three-slot practice', (unit) => {
    const seed = 41
    const base = getGrade3MissionSession(unit.id, 'practice', seed)
    const result = buildApprovedGrade3PracticeSet({ unitId: unit.id, seed })

    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.missions).toHaveLength(3)
    expect(result.missions.map(({ id }) => id)).toEqual(base.map(({ id }) => id))
    expect(result.missions.map(({ rewardId }) => rewardId)).toEqual(base.map(({ rewardId }) => rewardId))
    expect(result.missions.map(({ cognitiveDomain }) => cognitiveDomain))
      .toEqual(base.map(({ cognitiveDomain }) => cognitiveDomain))
    const applications = result.missions.filter(isGrade3ApplicationMission)
    expect(applications).toHaveLength(1)
    expect(applications[0].cognitiveDomain).not.toBe('knowing')
  })

  it.each(grade3Units)('$id rotates all four approved families without changing the stable practice identities', (unit) => {
    const base = getGrade3MissionSession(unit.id, 'practice', 20260516)
    const familyIds = new Set<string>()
    for (let applicationRotation = 0; applicationRotation < 16; applicationRotation += 1) {
      const result = buildApprovedGrade3PracticeSet({
        unitId: unit.id,
        seed: 20260516,
        applicationRotation,
      })
      expect(result.status).toBe('ready')
      if (result.status !== 'ready') continue
      expect(result.missions.map(({ id }) => id)).toEqual(base.map(({ id }) => id))
      const application = result.missions.find(isGrade3ApplicationMission)
      expect(application).toBeDefined()
      if (application) familyIds.add(application.applicationSource.familyId)
    }
    expect(familyIds).toHaveLength(4)
  })

  it('fails the entire practice closed when the approved ledger or required visual is corrupted', () => {
    const unitId = grade3Units[0].id
    const forgedLedger: ApplicationProblemRegistryV1 = {
      entries: GRADE3_APPLICATION_PROBLEM_REGISTRY_V1.entries,
      releaseLedger: GRADE3_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger.map((family) => (
        family.unitId === unitId
          ? { ...family, approval: { ...family.approval, ownerId: 'forged-owner' } }
          : family
      )),
    }
    const corruptedVisual: ApplicationProblemRegistryV1 = {
      entries: GRADE3_APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => {
        if (entry.family.unitId !== unitId || entry.runtime.kind !== 'deterministic-generator') return entry
        const original = entry.runtime.generator
        return {
          ...entry,
          runtime: {
            kind: 'deterministic-generator' as const,
            generator: {
              ...original,
              sample: (input: Parameters<typeof original.sample>[0]) => {
                const sampled = original.sample(input)
                return sampled === null
                  ? null
                  : { ...sampled, mathModel: { corrupted: true } }
              },
            },
          },
        }
      }),
      releaseLedger: GRADE3_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger,
    }

    expect(buildApprovedGrade3PracticeSet({ unitId, seed: 0, registry: forgedLedger }))
      .toEqual({ status: 'blocked' })
    expect(buildApprovedGrade3PracticeSet({ unitId, seed: 0, registry: corruptedVisual }))
      .toEqual({ status: 'blocked' })
  })

  it('rejects a consistently forged executable family and release-ledger snapshot', () => {
    const unitId = grade3Units[0].id
    const forge = (family: ApplicationProblemRegistryV1['releaseLedger'][number]) => (
      family.unitId === unitId ? { ...family, primaryStandard: '[4수99-99]' } : family
    )
    const forged: ApplicationProblemRegistryV1 = {
      entries: GRADE3_APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => ({
        ...entry,
        family: forge(entry.family),
      })),
      releaseLedger: GRADE3_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger.map(forge),
    }

    expect(buildApprovedGrade3PracticeSet({ unitId, seed: 0, registry: forged }))
      .toEqual({ status: 'blocked' })
  })

  it('preserves and validates a deep-linked stable mission in the replaced cognitive-domain slot', () => {
    const unitId = grade3Units[0].id
    const seed = 41
    const standard = buildApprovedGrade3PracticeSet({ unitId, seed })
    expect(standard.status).toBe('ready')
    if (standard.status !== 'ready') return
    const standardApplication = standard.missions.find(isGrade3ApplicationMission)
    expect(standardApplication).toBeDefined()
    if (!standardApplication) return
    const standardIds = new Set(getGrade3MissionSession(unitId, 'practice', seed).map(({ id }) => id))
    const preferred = getGrade3MissionsByUnit(unitId, seed).find((mission) => (
      mission.cognitiveDomain === standardApplication.cognitiveDomain
      && !standardIds.has(mission.id)
    ))
    expect(preferred).toBeDefined()
    if (!preferred) return

    const result = buildApprovedGrade3PracticeSet({
      unitId,
      seed,
      preferredMissionId: preferred.id,
    })

    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    const application = result.missions.find(isGrade3ApplicationMission)
    expect(application?.id).toBe(preferred.id)
    expect(application && isApprovedGrade3ApplicationMissionSemanticallyValid(application)).toBe(true)
    expect(application && isApprovedGrade3ApplicationMissionSemanticallyValid({
      ...application,
      unitMissionOrder: 99,
    })).toBe(false)
  })

  it('passes the Grade 3 release audit with executable evidence for all 107 production families', () => {
    const input = loadProductionApplicationProblemQualityInput()
    const release = auditApplicationProblemQuality(
      input,
      { mode: 'release', grade: 3 } as Parameters<typeof auditApplicationProblemQuality>[1],
    )
    const evidence = getProductionApplicationFamilyEvidence()

    expect(release.errors).toEqual([])
    expect(release.unitReports.filter((unit: { grade: number; productionComplete: boolean }) => (
      unit.grade === 3 && unit.productionComplete
    ))).toHaveLength(12)
    expect(evidence.rows).toHaveLength(107)
    expect(evidence.rows.every((row) => row.status === 'passed')).toBe(true)
  })
})
