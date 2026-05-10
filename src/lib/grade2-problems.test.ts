import { describe, expect, it } from 'vitest'

import {
  getGrade2MissionById,
  getGrade2Missions,
  getGrade2MissionsByUnit,
  getSafeGrade2Mission,
  grade2MissionTemplates,
  grade2Units,
  validateGrade2MissionBank,
} from './grade2-problems'

describe('grade2 mission bank', () => {
  it('provides a 36-template Alpha bank across 12 units', () => {
    const missions = getGrade2Missions(42)

    expect(missions).toHaveLength(36)
    expect(grade2Units).toHaveLength(12)
    expect(missions.map((mission) => mission.stageOrder)).toEqual(
      Array.from({ length: 36 }, (_, index) => index + 1)
    )

    for (const unit of grade2Units) {
      const unitMissions = getGrade2MissionsByUnit(unit.id, 42)
      expect(unitMissions).toHaveLength(3)
      expect(unitMissions.map((mission) => mission.unitMissionOrder)).toEqual([1, 2, 3])
      expect(unitMissions.map((mission) => mission.difficultyStep)).toEqual([
        'easy',
        'medium',
        'applied',
      ])
    }
  })

  it('keeps a simple place-value mission as the safe fallback', () => {
    const mission = getSafeGrade2Mission(42)

    expect(mission.id).toBe('g2-1-place-value-01')
    expect(mission.correctAnswer).toBe('342')
    expect(mission.answerType).toBe('integer')
    expect(mission.visualModel).toBe('place-value-blocks')
  })

  it('falls back to the safe mission for missing ids', () => {
    const mission = getGrade2MissionById('missing-grade2-mission', 42)

    expect(mission.id).toBe('g2-1-place-value-01')
  })

  it('validates metadata, choices, visual configs, and alpha distribution', () => {
    const result = validateGrade2MissionBank()

    expect(result.errors).toEqual([])
    expect(grade2MissionTemplates.every((template) => template.curriculumCode)).toBe(true)
    expect(grade2MissionTemplates.every((template) => template.answerConfig.kind === template.answerType)).toBe(true)
  })

  it('renders choice and label missions with exactly one correct answer', () => {
    for (const seed of [1, 5, 99]) {
      for (const mission of getGrade2Missions(seed)) {
        if (mission.answerType !== 'choice' && mission.answerType !== 'label') continue

        expect(new Set(mission.choices).size).toBe(mission.choices?.length)
        expect(mission.choices?.filter((choice) => choice === mission.correctAnswer)).toHaveLength(1)
        expect(mission.correctChoiceIndex).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('rejects invalid graph count metadata in the validator', () => {
    const invalid = grade2MissionTemplates.map((template) =>
      template.id === 'g2-2-table-graph-02'
        ? {
            ...template,
            visualConfig: { ...template.visualConfig, counts: '3,6' },
          }
        : template
    )

    expect(validateGrade2MissionBank(invalid).errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('graph/classification categories and counts must match'),
      ])
    )
  })
})
