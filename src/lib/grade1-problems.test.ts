import { describe, expect, it } from 'vitest'

import {
  getGrade1MissionById,
  getGrade1Missions,
  getSafeGrade1Mission,
  grade1MissionTemplates,
  validateGrade1MissionBank,
} from './grade1-problems'

describe('grade1 mission bank', () => {
  it('provides a 96-mission V1 deterministic adventure bank', () => {
    const missions = getGrade1Missions(42)

    expect(missions).toHaveLength(96)
    expect(missions.map((mission) => mission.stageOrder)).toEqual(
      Array.from({ length: 96 }, (_, index) => index + 1)
    )
    expect(new Set(missions.map((mission) => mission.islandId)).size).toBe(7)
    expect(Object.fromEntries(
      Array.from(new Set(missions.map((mission) => mission.islandId)), (islandId) => [
        islandId,
        missions.filter((mission) => mission.islandId === islandId).length,
      ])
    )).toEqual({
      'count-cove': 14,
      'order-bridge': 14,
      'orchard-port': 14,
      'river-dock': 14,
      'shape-forest': 14,
      'clock-tower': 13,
      'pattern-cave': 13,
    })
  })

  it('keeps the original apple mission as the safe first mission', () => {
    const mission = getSafeGrade1Mission(42)

    expect(mission.id).toBe('count-cove-01')
    expect(mission.prompt).toBe('사과는 모두 몇 개일까요?')
    expect(mission.correctAnswer).toBe('7')
    expect(mission.choices).toEqual(expect.arrayContaining(['6', '7', '8']))
    expect(mission.hintSteps.length).toBeGreaterThan(0)
    expect(mission.solutionSteps.length).toBeGreaterThan(0)
  })

  it('falls back to the safe mission for bad mission ids', () => {
    const mission = getGrade1MissionById('missing-stage', 42)

    expect(mission.id).toBe('count-cove-01')
    expect(mission.correctAnswer).toBe('7')
  })

  it('validates choices, metadata, rewards, and visual models', () => {
    const result = validateGrade1MissionBank()

    expect(result.errors).toEqual([])
    expect(grade1MissionTemplates.every((template) => template.learnerGoal)).toBe(true)
    expect(grade1MissionTemplates.every((template) => template.parentSummaryTag)).toBe(true)
  })

  it('renders each choice mission with exactly one correct answer across seeds', () => {
    for (const seed of [1, 5, 99]) {
      for (const mission of getGrade1Missions(seed)) {
        if (mission.answerType !== 'choice') continue

        expect(new Set(mission.choices).size).toBe(mission.choices?.length)
        expect(mission.choices?.filter((choice) => choice === mission.correctAnswer)).toHaveLength(1)
        expect(mission.correctChoiceIndex).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('changes a substantial part of the concrete bank across daily seeds', () => {
    const first = getGrade1Missions(101)
    const second = getGrade1Missions(202)
    const changed = first.filter((mission, index) => (
      JSON.stringify(mission.params) !== JSON.stringify(second[index].params) ||
      JSON.stringify(mission.choices) !== JSON.stringify(second[index].choices)
    ))

    expect(changed.length).toBeGreaterThanOrEqual(40)

    const concreteVariants = new Set(
      Array.from({ length: 200 }, (_, seed) => getGrade1Missions(seed + 1)).flatMap((missions) =>
        missions.map((mission) => `${mission.id}:${mission.prompt}:${JSON.stringify(mission.params)}:${JSON.stringify(mission.choices)}`)
      )
    )
    expect(concreteVariants.size).toBeGreaterThanOrEqual(500)
  })
})
