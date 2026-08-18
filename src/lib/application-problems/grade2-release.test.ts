import { describe, expect, it } from 'vitest'

import {
  auditApplicationProblemQuality,
  loadProductionApplicationProblemQualityInput,
} from '../../../scripts/application-problem-quality-core.js'
import {
  APPLICATION_PROBLEM_AUTHORING_CATALOG_V1,
  GRADE2_APPLICATION_AUTHORING_CATALOG_V1,
} from './authoring-catalog'
import { isGrade2ApplicationMission } from './grade2-adapter'
import { GRADE2_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade2-registry'
import { buildApprovedGrade2ApplicationMissions, buildGrade2MissionCatalog } from './grade2-runtime'
import { getProductionApplicationFamilyEvidence } from './quality-evidence'

const APPROVED_AT = '2026-08-18T05:48:48Z'
const EVIDENCE_REF = 'docs/reviews/application-problems-grade2-approval.md'

describe('Grade 2 full application release', () => {
  it('promotes exactly the reviewed Grade 2 identities and advances the rollout to Grade 3', () => {
    const reviewedKeys = new Set(GRADE2_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates
      .flatMap(({ familyCandidates }) => familyCandidates)
      .map(({ family }) => `${family.familyId}@${family.version}`))
    const productionByKey = new Map(GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => [
      `${entry.family.familyId}@${entry.family.version}`,
      entry,
    ]))
    const input = loadProductionApplicationProblemQualityInput()

    expect(reviewedKeys.size).toBe(50)
    expect(GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.entries).toHaveLength(53)
    expect(GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger).toHaveLength(53)
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
    expect(APPLICATION_PROBLEM_AUTHORING_CATALOG_V1.unitCandidates).toHaveLength(12)
    expect(APPLICATION_PROBLEM_AUTHORING_CATALOG_V1.unitCandidates.every(({ pack }) => (
      pack.grade === 3 && pack.releaseStatus === 'draft'
    ))).toBe(true)
    expect(input.rollout).toMatchObject({ releasedThroughGrade: 2, buildingGrade: 3 })
    expect(input.packs.filter((pack: { grade: number; coverageStatus: string }) => (
      pack.grade === 2 && pack.coverageStatus === 'complete'
    ))).toHaveLength(12)
  })

  it('places one approved application in every Grade 2 practice without changing 144 identities', () => {
    const applications = buildApprovedGrade2ApplicationMissions(27)
    const catalog = buildGrade2MissionCatalog(27)

    expect(applications).toHaveLength(12)
    expect(new Set(applications.map(({ unitId }) => unitId)).size).toBe(12)
    expect(catalog.status).toBe('ready')
    if (catalog.status !== 'ready') return
    expect(catalog.missions).toHaveLength(144)
    expect(catalog.missions.filter(isGrade2ApplicationMission)).toHaveLength(12)
  })

  it('passes the Grade 2 production release audit with proof evidence for all 59 families', () => {
    const input = loadProductionApplicationProblemQualityInput()
    const release = auditApplicationProblemQuality(input, { mode: 'release', grade: 2 })
    const evidence = getProductionApplicationFamilyEvidence()

    expect(release.errors).toEqual([])
    expect(release.unitReports.filter((unit: { grade: number; productionComplete: boolean }) => (
      unit.grade === 2 && unit.productionComplete
    ))).toHaveLength(12)
    expect(evidence.rows).toHaveLength(59)
    expect(evidence.rows.every((row) => row.status === 'passed')).toBe(true)
  })
})
