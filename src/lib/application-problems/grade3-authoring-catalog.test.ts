import { describe, expect, it } from 'vitest'

import {
  createInitialGrade3Progress,
  isGrade3UnitComplete,
  recordGrade3Attempt,
  recordGrade3PracticeSession,
} from '../grade3-progress'
import { getGrade3MissionSession, grade3Units } from '../grade3-problems'
import {
  GRADE3_APPLICATION_AUTHORING_CATALOG_V1,
  validateAuthoringCatalogSafety,
} from './authoring-catalog'
import { isGrade3ApplicationMission } from './grade3-adapter'
import { createGrade3AuthoringUnitCandidateValues } from './grade3-authoring-catalog'
import { buildGrade3AuthoringPracticeSet } from './grade3-runtime'
import { isGrade3ApplicationMissionSemanticallyValid } from './grade3-snapshot-validator'

function domains(values: readonly { cognitiveDomain: string }[]): string[] {
  return values.map(({ cognitiveDomain }) => cognitiveDomain)
}

describe('Grade 3 review-only application connection', () => {
  it('publishes exactly twelve complete draft units with executable evidence', () => {
    const units = createGrade3AuthoringUnitCandidateValues()

    expect(units).toHaveLength(12)
    expect(GRADE3_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates).toHaveLength(12)
    expect(validateAuthoringCatalogSafety(GRADE3_APPLICATION_AUTHORING_CATALOG_V1)).toEqual([])
    expect(new Set(units.map(({ pack }) => pack.unitId)))
      .toEqual(new Set(grade3Units.map(({ id }) => id)))
    expect(units.flatMap(({ familyCandidates }) => familyCandidates)).toHaveLength(48)
    for (const unit of units) {
      expect(unit.pack).toMatchObject({
        grade: 3,
        coverageStatus: 'complete',
        releaseStatus: 'draft',
        approval: { ownerStatus: 'pending', expertStatus: 'not-reviewed' },
      })
      expect(unit.familyCandidates).toHaveLength(4)
      expect(unit.familyCandidates.every(({ family, proof }) => (
        family.releaseStatus === 'draft'
        && proof?.proven === true
        && proof.checkedCount === 3
        && proof.expectedCount === 3
      ))).toBe(true)
    }
  })

  it.each(grade3Units)('$id builds one atomic application replacement in the three-slot K/A/R practice', (unit) => {
    const seed = 41
    const base = getGrade3MissionSession(unit.id, 'practice', seed)
    const result = buildGrade3AuthoringPracticeSet({ unitId: unit.id, seed })

    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.missions).toHaveLength(3)
    expect(result.missions.filter(isGrade3ApplicationMission)).toHaveLength(1)
    expect(result.missions.map(({ id }) => id)).toEqual(base.map(({ id }) => id))
    expect(domains(result.missions)).toEqual(domains(base))
    const replacement = result.missions.find(isGrade3ApplicationMission)!
    expect(replacement.cognitiveDomain).not.toBe('knowing')
    expect(isGrade3ApplicationMissionSemanticallyValid(replacement)).toBe(true)
  })

  it('rotates all four families in every unit deterministically', () => {
    for (const unit of GRADE3_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates) {
      const expected = new Set(unit.familyCandidates.map(({ family }) => family.familyId))
      const selected = new Set<string>()
      for (let seed = 0; seed < 64; seed += 1) {
        const first = buildGrade3AuthoringPracticeSet({ unitId: unit.pack.unitId, seed })
        const second = buildGrade3AuthoringPracticeSet({ unitId: unit.pack.unitId, seed })
        expect(second).toEqual(first)
        if (first.status !== 'ready') continue
        const mission = first.missions.find(isGrade3ApplicationMission)
        if (mission) selected.add(mission.applicationSource.familyId)
      }
      expect(selected).toEqual(expected)
    }
  })

  it('blocks the whole candidate session when generation or proof is unsafe', () => {
    const sourceUnit = GRADE3_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates[0]
    const selected = sourceUnit.familyCandidates[0]
    expect(selected.runtime.kind).toBe('deterministic-generator')
    if (selected.runtime.kind !== 'deterministic-generator') return
    const broken = {
      ...GRADE3_APPLICATION_AUTHORING_CATALOG_V1,
      unitCandidates: [{
        ...sourceUnit,
        familyCandidates: [{
          ...selected,
          proof: { ...selected.proof!, proven: false },
          runtime: {
            kind: 'deterministic-generator' as const,
            generator: {
              ...selected.runtime.generator,
              sample: () => { throw new Error('unsafe candidate') },
            },
          },
        }],
      }],
    }

    expect(buildGrade3AuthoringPracticeSet({
      unitId: sourceUnit.pack.unitId,
      seed: 0,
      catalog: broken,
    })).toEqual({ status: 'blocked' })
  })

  it('preserves IDs, completion, review, rewards, and progress semantics', () => {
    const unitId = 'g3-1-add-sub'
    const result = buildGrade3AuthoringPracticeSet({ unitId, seed: 19 })
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    const base = getGrade3MissionSession(unitId, 'practice', 19)
    const initial = recordGrade3PracticeSession(
      createInitialGrade3Progress(100),
      unitId,
      result.missions,
    )
    const completed = result.missions.reduce((progress, mission, index) => (
      recordGrade3Attempt(progress, mission, index !== 1, { now: 200 + index })
    ), initial)

    expect(result.missions.map(({ id }) => id).map((id) => id))
      .toEqual(base.map(({ id }) => id))
    expect(result.missions.map(({ rewardId }) => rewardId))
      .toEqual(base.map(({ rewardId }) => rewardId))
    expect(completed.checkedMissionIds).toEqual(base.map(({ id }) => id))
    expect(completed.reviewMissionIds).toEqual([base[1].id])
    expect(completed.completedUnitIds).toEqual([unitId])
    expect(isGrade3UnitComplete(completed, unitId, 19)).toBe(true)
  })

  it('rejects corrupted answer, source, and visual snapshots', () => {
    const result = buildGrade3AuthoringPracticeSet({ unitId: 'g3-2-graph', seed: 7 })
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    const mission = result.missions.find(isGrade3ApplicationMission)!
    expect(isGrade3ApplicationMissionSemanticallyValid(mission)).toBe(true)

    for (const corrupted of [
      { ...mission, correctAnswer: `${mission.correctAnswer}-changed` },
      { ...mission, applicationSource: { ...mission.applicationSource, seed: mission.applicationSource.seed + 1 } },
      { ...mission, applicationVisual: { ...mission.applicationVisual, mathModel: { corrupted: true } } },
    ]) {
      expect(isGrade3ApplicationMissionSemanticallyValid(corrupted)).toBe(false)
    }
  })
})
