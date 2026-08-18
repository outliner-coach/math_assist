import { describe, expect, it } from 'vitest'

import {
  activateGrade2ApplicationMissionSnapshot,
  createInitialGrade2Progress,
  isGrade2UnitComplete,
  recordGrade2Attempt,
} from '../grade2-progress'
import {
  getGrade2MissionSet,
  grade2Units,
} from '../grade2-problems'
import { isGrade2ApplicationMission } from './grade2-adapter'
import {
  APPLICATION_PROBLEM_AUTHORING_CATALOG_V1,
  GRADE2_APPLICATION_AUTHORING_CATALOG_V1,
  validateAuthoringCatalogSafety,
  validateAuthoringProductionSeparation,
} from './authoring-catalog'
import { GRADE2_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade2-registry'
import { resolveGrade2MissionInteraction } from './grade2-interaction-gate'
import {
  buildApprovedGrade2ApplicationMissions,
  buildGrade2AuthoringPracticeSet,
  buildGrade2MissionCatalog,
} from './grade2-runtime'
import { isGrade2ApplicationMissionSemanticallyValid } from './grade2-snapshot-validator'

function domains(values: readonly { cognitiveDomain: string }[]): string[] {
  return values.map(({ cognitiveDomain }) => cognitiveDomain).sort()
}

describe('Grade 2 review-only authoring connection', () => {
  it('connects all twelve complete draft packs without changing the fixed production ledger', () => {
    expect(GRADE2_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates).toHaveLength(12)
    expect(APPLICATION_PROBLEM_AUTHORING_CATALOG_V1.unitCandidates).toEqual(
      GRADE2_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates,
    )
    expect(validateAuthoringCatalogSafety(GRADE2_APPLICATION_AUTHORING_CATALOG_V1)).toEqual([])
    expect(validateAuthoringProductionSeparation({
      authoringCatalog: GRADE2_APPLICATION_AUTHORING_CATALOG_V1,
      productionRegistries: [GRADE2_APPLICATION_PROBLEM_REGISTRY_V1],
      productionPacks: [{ packId: 'pack-g2-2-length', version: 1 }],
    })).toEqual([])

    expect(GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.entries.map(({ family }) => (
      `${family.familyId}@${family.version}`
    ))).toEqual([
      'g2-length-route-total@1',
      'g2-length-missing-segment@1',
      'g2-length-claim-check@1',
    ])
    expect(GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger).toHaveLength(3)

    for (const unit of GRADE2_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates) {
      expect(unit.pack).toMatchObject({
        grade: 2,
        coverageStatus: 'complete',
        releaseStatus: 'draft',
        approval: { ownerStatus: 'pending', expertStatus: 'not-reviewed' },
      })
      expect(unit.familyCandidates.length).toBeGreaterThanOrEqual(4)
      expect(unit.familyCandidates.every(({ family, proof }) => (
        family.releaseStatus === 'draft' &&
        proof?.proven === true &&
        proof.checkedCount === proof.expectedCount &&
        proof.checkedCount > 0
      ))).toBe(true)
    }
  })

  it.each(grade2Units)('$id builds an atomic six-problem candidate with exactly one application', (unit) => {
    const seed = 41
    const base = getGrade2MissionSet(unit.id, 'practice', seed)
    const result = buildGrade2AuthoringPracticeSet({ unitId: unit.id, seed })

    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.missions).toHaveLength(6)
    expect(result.missions.filter(isGrade2ApplicationMission)).toHaveLength(1)
    expect(result.missions.map(({ id }) => id)).toEqual(base.map(({ id }) => id))
    expect(domains(result.missions)).toEqual(domains(base))
    const replacement = result.missions.find(isGrade2ApplicationMission)!
    expect(replacement.cognitiveDomain).not.toBe('knowing')
    expect(base.find(({ id }) => id === replacement.id)?.cognitiveDomain)
      .toBe(replacement.cognitiveDomain)
  })

  it('rotates every unit family deterministically without permanently starving a candidate', () => {
    for (const unit of GRADE2_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates) {
      const expected = new Set(unit.familyCandidates.map(({ family }) => family.familyId))
      const selected = new Set<string>()
      for (let seed = 0; seed < expected.size * 12; seed += 1) {
        const first = buildGrade2AuthoringPracticeSet({ unitId: unit.pack.unitId, seed })
        const second = buildGrade2AuthoringPracticeSet({ unitId: unit.pack.unitId, seed })
        expect(second).toEqual(first)
        if (first.status !== 'ready') continue
        const mission = first.missions.find(isGrade2ApplicationMission)
        if (mission) selected.add(mission.applicationSource.familyId)
      }
      expect(selected).toEqual(expected)
    }
  })

  it('returns no partial session when the selected draft generator fails', () => {
    const sourceUnit = GRADE2_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates[0]
    const selected = sourceUnit.familyCandidates[0]
    expect(selected.runtime.kind).toBe('deterministic-generator')
    if (selected.runtime.kind !== 'deterministic-generator') return
    const broken = {
      ...GRADE2_APPLICATION_AUTHORING_CATALOG_V1,
      unitCandidates: [{
        ...sourceUnit,
        familyCandidates: [{
          ...selected,
          runtime: {
            kind: 'deterministic-generator' as const,
            generator: {
              ...selected.runtime.generator,
              sample: () => {
                throw new Error('candidate generation failed')
              },
            },
          },
        }],
      }],
    }

    expect(buildGrade2AuthoringPracticeSet({
      unitId: sourceUnit.pack.unitId,
      seed: 0,
      catalog: broken,
    })).toEqual({ status: 'blocked' })
  })

  it('preserves existing practice identities, unit completion, review, and rewards', () => {
    const unitId = 'g2-1-place-value'
    const result = buildGrade2AuthoringPracticeSet({ unitId, seed: 19 })
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    const baseIds = getGrade2MissionSet(unitId, 'practice', 19).map(({ id }) => id)
    const completed = result.missions.reduce((progress, mission, index) => {
      const activated = isGrade2ApplicationMission(mission)
        ? activateGrade2ApplicationMissionSnapshot(progress, mission)
        : progress
      return recordGrade2Attempt(activated, mission, index !== 2, { now: 200 + index })
    }, createInitialGrade2Progress(100))

    expect(result.missions.map(({ id }) => id)).toEqual(baseIds)
    expect(completed.checkedMissionIds).toEqual(baseIds)
    expect(completed.reviewMissionIds).toEqual([baseIds[2]])
    expect(completed.completedUnitIds).toEqual([unitId])
    expect(isGrade2UnitComplete(completed, unitId)).toBe(true)
    expect(completed.xp).toBeGreaterThan(0)
  })

  it('uses the same six-slot replacement boundary for the existing approved pilot', () => {
    const generated = buildApprovedGrade2ApplicationMissions(7)
    expect(generated).toHaveLength(1)
    expect(generated[0]).toMatchObject({
      unitId: 'g2-2-length',
      mode: 'practice',
    })

    const catalog = buildGrade2MissionCatalog(7)
    expect(catalog.status).toBe('ready')
    if (catalog.status !== 'ready') return
    expect(catalog.missions).toHaveLength(144)
    const practice = catalog.missions.filter((mission) => (
      mission.unitId === 'g2-2-length' && mission.mode === 'practice'
    ))
    expect(practice).toHaveLength(6)
    expect(practice.filter(isGrade2ApplicationMission)).toHaveLength(1)
  })

  it('validates replacement snapshots independently and keeps draft candidates interaction-blocked', () => {
    for (const unit of grade2Units) {
      const result = buildGrade2AuthoringPracticeSet({ unitId: unit.id, seed: 17 })
      expect(result.status).toBe('ready')
      if (result.status !== 'ready') continue
      const mission = result.missions.find(isGrade2ApplicationMission)!
      expect(isGrade2ApplicationMissionSemanticallyValid(mission)).toBe(true)
      expect(resolveGrade2MissionInteraction(mission)).toBe('blocked')
    }

    const approved = buildApprovedGrade2ApplicationMissions(17)[0]
    expect(isGrade2ApplicationMissionSemanticallyValid(approved)).toBe(true)
    expect(resolveGrade2MissionInteraction(approved)).toBe('ready')

    const corruptions = [
      { ...approved, correctAnswer: `${approved.correctAnswer}-changed` },
      { ...approved, rewardId: 'clockStar' as const },
      {
        ...approved,
        applicationSource: { ...approved.applicationSource, seed: approved.applicationSource.seed + 1 },
      },
      {
        ...approved,
        applicationVisual: { ...approved.applicationVisual, mathModel: { corrupted: true } },
      },
    ]
    for (const corrupted of corruptions) {
      expect(isGrade2ApplicationMissionSemanticallyValid(corrupted)).toBe(false)
      expect(resolveGrade2MissionInteraction(corrupted)).toBe('blocked')
    }
  })
})
