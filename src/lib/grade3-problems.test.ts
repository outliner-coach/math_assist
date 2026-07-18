import { describe, expect, it } from 'vitest'

import {
  getGrade3MissionById,
  getGrade3Missions,
  grade3MissionTemplates,
  grade3Units,
  validateGrade3MissionBank,
} from './grade3-problems'

describe('grade3 mission bank', () => {
  it('ships a 36-mission Alpha with one easy, medium, and applied mission per unit', () => {
    const missions = getGrade3Missions(42)

    expect(missions).toHaveLength(36)
    for (const unit of grade3Units) {
      const unitMissions = missions.filter((mission) => mission.unitId === unit.id)
      expect(unitMissions).toHaveLength(3)
      expect(unitMissions.map((mission) => mission.difficultyStep)).toEqual([
        'easy',
        'medium',
        'applied',
      ])
      expect(unitMissions.map((mission) => mission.unitMissionOrder)).toEqual([1, 2, 3])
    }
  })

  it('keeps curriculum traceability, answer configs, and validator clean', () => {
    const result = validateGrade3MissionBank()

    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(grade3MissionTemplates.every((template) => template.curriculumCode.startsWith('[4수'))).toBe(true)
    expect(grade3MissionTemplates.every((template) => template.answerConfig.kind === template.answerType)).toBe(true)
  })

  it('keeps choice answers unique and exact', () => {
    const missions = getGrade3Missions(42)
    for (const mission of missions.filter((item) => item.answerType === 'choice' || item.answerType === 'label')) {
      expect(new Set(mission.choices).size).toBe(mission.choices?.length)
      expect(mission.choices?.filter((choice) => choice === mission.correctAnswer)).toHaveLength(1)
    }
  })

  it('falls back to the safe mission for unknown ids', () => {
    expect(getGrade3MissionById('missing-id', 42).id).toBe('g3-1-add-sub-01')
  })
})
