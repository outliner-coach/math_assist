import { describe, expect, it } from 'vitest'

import grade12Allocation from '../../workstreams/_shared/grade1-2-curriculum-allocation-v1.json'
import {
  auditGrade2MissionVariants,
  getGrade2MissionById,
  getGrade2MissionSet,
  getGrade2Missions,
  getGrade2MissionsByUnit,
  getSafeGrade2Mission,
  grade2MissionTemplates,
  grade2Units,
  normalizeGrade2Mode,
  validateGrade2MissionBank,
} from './grade2-problems'

describe('grade2 mission bank', () => {
  it('provides a 144-template V1 bank across 12 units', () => {
    const missions = getGrade2Missions(42)

    expect(missions).toHaveLength(144)
    expect(grade2Units).toHaveLength(12)
    expect(missions.map((mission) => mission.stageOrder)).toEqual(
      Array.from({ length: 144 }, (_, index) => index + 1)
    )

    for (const unit of grade2Units) {
      const unitMissions = getGrade2MissionsByUnit(unit.id, 42)
      expect(unitMissions).toHaveLength(12)
      expect(unitMissions.map((mission) => mission.unitMissionOrder)).toEqual([
        1, 2, 3, 4, 5, 6,
        1, 2, 3, 4, 5, 6,
      ])
      expect(unitMissions.map((mission) => mission.difficultyStep)).toEqual([
        'easy',
        'medium',
        'applied',
        'easy',
        'medium',
        'applied',
        'easy',
        'medium',
        'applied',
        'easy',
        'medium',
        'applied',
      ])
    }
  })

  it('provides deterministic unlocked basic and practice sets with six authored problems each', () => {
    expect(normalizeGrade2Mode(undefined)).toBe('basic')
    expect(normalizeGrade2Mode('unexpected')).toBe('basic')
    expect(normalizeGrade2Mode('practice')).toBe('practice')

    for (const unit of grade2Units) {
      const basic = getGrade2MissionSet(unit.id, 'basic', 42)
      const practice = getGrade2MissionSet(unit.id, 'practice', 42)

      expect(basic).toHaveLength(6)
      expect(practice).toHaveLength(6)
      expect(basic.every((mission) => mission.mode === 'basic')).toBe(true)
      expect(practice.every((mission) => mission.mode === 'practice')).toBe(true)
      expect(basic.map((mission) => mission.unitMissionOrder)).toEqual([1, 2, 3, 4, 5, 6])
      expect(practice.map((mission) => mission.unitMissionOrder)).toEqual([1, 2, 3, 4, 5, 6])
      expect(practice.every((mission) => mission.id.endsWith('-v1'))).toBe(true)
      expect(getGrade2MissionSet(unit.id, 'practice', 42).map((mission) => mission.id))
        .toEqual(practice.map((mission) => mission.id))
    }
  })

  it('replaces every prefixed repeat with an authored mathematical variant', () => {
    const signatures = grade2MissionTemplates.map((template) => JSON.stringify({
      prompt: template.promptTemplate.replace(/\s+/g, ' ').trim(),
      answer: template.solverRule,
      choices: template.choicesTemplate ?? [],
      visualModel: template.visualModel,
      visualConfig: template.visualConfig,
    }))

    expect(grade2MissionTemplates.filter((template) => template.id.endsWith('-v1'))).toHaveLength(72)
    expect(grade2MissionTemplates.some((template) => template.promptTemplate.startsWith('한 번 더!'))).toBe(false)
    expect(new Set(signatures).size).toBe(144)
  })

  it('directly covers every allocated Grade 2 standard with basic knowing and applying work', () => {
    const allocations = grade12Allocation.allocations.filter((allocation) => allocation.assignedGrade === 2)

    for (const allocation of allocations) {
      const direct = grade2MissionTemplates.filter((template) => (
        template.unitId === allocation.unitId
        && template.curriculumCode === allocation.standardCode
      ))
      expect(
        direct.some((template) => template.mode === 'basic' && template.cognitiveDomain === 'knowing'),
        `${allocation.standardCode} needs basic knowing work in ${allocation.unitId}`,
      ).toBe(true)
      expect(
        direct.some((template) => template.cognitiveDomain === 'applying'),
        `${allocation.standardCode} needs applying work in ${allocation.unitId}`,
      ).toBe(true)
    }

    for (const unit of grade2Units) {
      const missions = grade2MissionTemplates.filter((template) => template.unitId === unit.id)
      const domains = Object.fromEntries(
        ['knowing', 'applying', 'reasoning'].map((domain) => [
          domain,
          missions.filter((mission) => mission.cognitiveDomain === domain).length,
        ]),
      )
      expect(domains).toEqual({ knowing: 5, applying: 5, reasoning: 2 })
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
    const allowedActions = new Set([
      'recognize', 'classify', 'compare', 'calculate', 'measure', 'construct',
      'model', 'interpret', 'explain', 'analyze_error', 'reason',
    ])

    expect(result.errors).toEqual([])
    expect(grade2MissionTemplates.every((template) => template.curriculumCode)).toBe(true)
    expect(grade2MissionTemplates.every((template) => template.answerConfig.kind === template.answerType)).toBe(true)
    expect(grade2MissionTemplates.every((template) =>
      template.taskActions.length > 0
      && template.taskActions.every((action) => allowedActions.has(action))
    )).toBe(true)
    expect(grade2MissionTemplates.every((template) =>
      template.visualSemantics === 'schematic' || template.visualSemantics === 'quantitative'
    )).toBe(true)
  })

  it('uses the answer format requested by the mixed-unit length questions', () => {
    expect(getGrade2MissionById('g2-2-length-03', 42).correctAnswer).toBe('1m20cm')
    expect(getGrade2MissionById('g2-2-length-06', 42).correctAnswer).toBe('2m30cm')
  })

  it('audits every allowed Grade 2 parameter combination', () => {
    const result = auditGrade2MissionVariants()

    expect(result.variantCount).toBe(144)
    expect(result.errors).toEqual([])
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

  it('changes a substantial part of the concrete bank across daily seeds', () => {
    const first = getGrade2Missions(101)
    const second = getGrade2Missions(202)
    const changed = first.filter((mission, index) => (
      JSON.stringify(mission.params) !== JSON.stringify(second[index].params) ||
      JSON.stringify(mission.choices) !== JSON.stringify(second[index].choices)
    ))

    expect(changed.length).toBeGreaterThanOrEqual(30)

    const concreteVariants = new Set(
      Array.from({ length: 200 }, (_, seed) => getGrade2Missions(seed + 1)).flatMap((missions) =>
        missions.map((mission) => `${mission.id}:${mission.prompt}:${JSON.stringify(mission.params)}:${JSON.stringify(mission.choices)}`)
      )
    )
    expect(concreteVariants.size).toBeGreaterThanOrEqual(340)
  })
})
