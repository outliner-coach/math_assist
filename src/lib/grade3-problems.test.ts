import { describe, expect, it } from 'vitest'

import {
  getGrade3MissionById,
  getGrade3Missions,
  grade3MissionTemplates,
  grade3Units,
  validateGrade3MissionBank,
} from './grade3-problems'

describe('grade3 mission bank', () => {
  it('ships 40 missions and expands the capacity-weight unit to cover every measurement standard', () => {
    const missions = getGrade3Missions(42)

    expect(missions).toHaveLength(40)
    for (const unit of grade3Units) {
      const unitMissions = missions.filter((mission) => mission.unitId === unit.id)
      const expanded = unit.id === 'g3-2-capacity-weight'
      expect(unitMissions).toHaveLength(expanded ? 7 : 3)
      expect(unitMissions.map((mission) => mission.difficultyStep)).toEqual(
        expanded
          ? ['easy', 'easy', 'medium', 'medium', 'medium', 'applied', 'applied']
          : ['easy', 'medium', 'applied']
      )
      expect(unitMissions.map((mission) => mission.unitMissionOrder)).toEqual(
        Array.from({ length: expanded ? 7 : 3 }, (_, index) => index + 1)
      )
    }
  })

  it('covers the complete Grade 3 capacity and weight progression with distinct missions', () => {
    const unit = grade3Units.find((item) => item.id === 'g3-2-capacity-weight')
    const missions = getGrade3Missions(42).filter((mission) => mission.unitId === unit?.id)
    const expectedCodes = Array.from({ length: 7 }, (_, index) => `[4수03-${17 + index}]`)

    expect(unit?.curriculumCodes).toEqual(expectedCodes)
    expect(new Set(missions.map((mission) => mission.curriculumCode))).toEqual(new Set(expectedCodes))
    expect(getGrade3MissionById('g3-2-capacity-weight-03').curriculumCode).toBe('[4수03-19]')
    expect(getGrade3MissionById('g3-2-capacity-weight-06').visualModel).toBe('tonne-scale')
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
