import { describe, expect, it } from 'vitest'

import {
  auditGrade1MissionVariants,
  buildGrade1AuthoredMathSignature,
  getGrade1MissionById,
  getGrade1Missions,
  getGrade1PracticeMissionIds,
  getSafeGrade1Mission,
  grade1AllowedCurriculumCodesByIsland,
  grade1MissionTemplates,
  validateGrade1MissionBank,
} from './grade1-problems'

describe('grade1 mission bank', () => {
  it('provides seven authored basic and seven authored practice missions per island', () => {
    const missions = getGrade1Missions(42)

    expect(missions).toHaveLength(98)
    expect(missions.map((mission) => mission.stageOrder)).toEqual(
      Array.from({ length: 98 }, (_, index) => index + 1)
    )
    expect(new Set(missions.map((mission) => mission.islandId)).size).toBe(7)

    for (const islandId of Array.from(new Set(missions.map((mission) => mission.islandId)))) {
      const islandMissions = missions.filter((mission) => mission.islandId === islandId)
      expect(islandMissions).toHaveLength(14)
      expect(islandMissions.filter((mission) => mission.mode === 'basic')).toHaveLength(7)
      expect(islandMissions.filter((mission) => mission.mode === 'practice')).toHaveLength(7)
      expect(islandMissions.filter((mission) => mission.cognitiveDomain === 'knowing')).toHaveLength(6)
      expect(islandMissions.filter((mission) => mission.cognitiveDomain === 'applying')).toHaveLength(6)
      expect(islandMissions.filter((mission) => mission.cognitiveDomain === 'reasoning')).toHaveLength(2)
      expect(islandMissions
        .filter((mission) => mission.cognitiveDomain === 'reasoning')
        .every((mission) => mission.taskActions.some((action) => (
          action === 'reason' || action === 'explain' || action === 'analyze_error'
        )))
      ).toBe(true)
      expect(getGrade1PracticeMissionIds(islandId)).toHaveLength(7)
    }
  })

  it('owns every expanded id as a materially authored problem instead of a prefixed clone', () => {
    expect(grade1MissionTemplates.every((template) => template.authoredSourceKey === template.id)).toBe(true)
    expect(new Set(grade1MissionTemplates.map((template) => template.problemFamily)).size).toBeLessThan(98)
    expect(new Set(grade1MissionTemplates.map(buildGrade1AuthoredMathSignature))).toHaveLength(98)
    expect(grade1MissionTemplates.some((template) => (
      template.promptTemplate.startsWith('도전 ')
      || template.learnerGoal.startsWith('도전 ')
    ))).toBe(false)
  })

  it('directly links every Grade 1 allocation to basic knowing and applying work', () => {
    for (const code of ['[2수01-01]', '[2수01-04]']) {
      const direct = grade1MissionTemplates.filter((template) =>
        template.directCurriculumCodes.includes(code)
      )
      expect(direct.some((template) => (
        template.mode === 'basic' && template.cognitiveDomain === 'knowing'
      ))).toBe(true)
      expect(direct.some((template) => (
        template.mode === 'basic' && template.cognitiveDomain === 'applying'
      ))).toBe(true)
    }
  })

  it('keeps every curriculum code inside the mathematical scope of its island', () => {
    for (const template of grade1MissionTemplates) {
      expect(grade1AllowedCurriculumCodesByIsland[template.islandId]).toEqual(
        expect.arrayContaining(template.curriculumCodes)
      )
    }
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
    const allowedActions = new Set([
      'recognize', 'classify', 'compare', 'calculate', 'measure', 'construct',
      'model', 'interpret', 'explain', 'analyze_error', 'reason',
    ])

    expect(result.errors).toEqual([])
    expect(grade1MissionTemplates.every((template) => template.learnerGoal)).toBe(true)
    expect(grade1MissionTemplates.every((template) => template.parentSummaryTag)).toBe(true)
    expect(grade1MissionTemplates.every((template) => template.curriculumCodes.length > 0)).toBe(true)
    expect(grade1MissionTemplates.every((template) =>
      template.curriculumCodes.every((code) => /^\[2수\d{2}-\d{2}\]$/.test(code))
    )).toBe(true)
    expect(grade1MissionTemplates.every((template) =>
      template.taskActions.length > 0
      && template.taskActions.every((action) => allowedActions.has(action))
    )).toBe(true)
    expect(grade1MissionTemplates.every((template) =>
      template.visualSemantics === 'schematic' || template.visualSemantics === 'quantitative'
    )).toBe(true)
  })

  it('audits every allowed Grade 1 parameter combination', () => {
    const result = auditGrade1MissionVariants()

    expect(result.variantCount).toBe(1046)
    expect(result.errors).toEqual([])
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
