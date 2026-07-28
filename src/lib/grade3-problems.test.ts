import { describe, expect, it } from 'vitest'

import {
  auditGrade3MissionVariants,
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
    const allowedActions = new Set([
      'recognize', 'classify', 'compare', 'calculate', 'measure', 'construct',
      'model', 'interpret', 'explain', 'analyze_error', 'reason',
    ])

    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(grade3MissionTemplates.every((template) => template.curriculumCode.startsWith('[4수'))).toBe(true)
    expect(grade3MissionTemplates.every((template) => template.answerConfig.kind === template.answerType)).toBe(true)
    expect(grade3MissionTemplates.every((template) =>
      template.taskActions.length > 0
      && template.taskActions.every((action) => allowedActions.has(action))
    )).toBe(true)
    expect(grade3MissionTemplates.every((template) =>
      template.visualSemantics === 'schematic' || template.visualSemantics === 'quantitative'
    )).toBe(true)
  })

  it('audits every published Grade 3 source variant', () => {
    const result = auditGrade3MissionVariants()

    expect(result.variantCount).toBe(40)
    expect(result.errors).toEqual([])
  })

  it('aligns editorial actions and semantics with the actual learner task', () => {
    const circleCenter = grade3MissionTemplates.find((mission) => mission.id === 'g3-2-circle-01')
    const circleCompass = grade3MissionTemplates.find((mission) => mission.id === 'g3-2-circle-03')
    const capacityReader = grade3MissionTemplates.find((mission) => mission.id === 'g3-2-capacity-weight-01')
    const weightReader = grade3MissionTemplates.find((mission) => mission.id === 'g3-2-capacity-weight-02')

    expect(circleCenter?.visualSemantics).toBe('schematic')
    expect(circleCompass?.taskActions).toEqual(['construct'])
    expect(circleCompass?.prompt).toContain('①')
    expect(circleCompass?.prompt).toContain('②')
    expect(circleCompass?.prompt).toContain('컴퍼스')
    expect(circleCompass?.prompt).toContain('원을 그린')
    expect(circleCompass?.prompt).toContain('지름 12cm')
    expect(circleCompass?.prompt).not.toContain('6cm')
    expect(circleCompass?.hintSteps.join(' ')).not.toContain('6cm')
    expect(circleCompass?.learnerGoal).toMatch(/중심.*반지름.*컴퍼스.*구성/)
    expect(circleCompass?.solutionSteps.join(' ')).toMatch(/12cm.*6cm.*가상 컴퍼스.*원 그리기/)
    expect(circleCompass?.correctAnswer).toBe('6')
    expect(circleCompass?.visualConfig).toMatchObject({
      mode: 'construction',
      centerLabel: 'O',
      diameter: 12,
      hideRadiusUntilReveal: true,
    })
    expect(circleCompass?.visualConfig).not.toHaveProperty('radius')

    expect(capacityReader?.taskActions).toEqual(['measure'])
    expect(capacityReader?.prompt).not.toContain('1L 250mL')
    expect(capacityReader?.visualConfig).toMatchObject({
      mode: 'scale-read',
      totalMl: 1250,
      maxTotal: 2000,
      tickStep: 250,
    })

    expect(weightReader?.taskActions).toEqual(['measure'])
    expect(weightReader?.prompt).not.toContain('2kg 300g')
    expect(weightReader?.visualConfig).toMatchObject({
      mode: 'scale-read',
      totalG: 2300,
      maxTotal: 3000,
      tickStep: 100,
    })
  })

  it('rejects curriculum-action drift and answer-copying regressions', () => {
    const calculationCircle = grade3MissionTemplates.map((template) =>
      template.id === 'g3-2-circle-03'
        ? { ...template, taskActions: ['calculate'] as typeof template.taskActions, prompt: '14 ÷ 2는 얼마일까요?' }
        : template
    )
    const answerCopyingCapacity = grade3MissionTemplates.map((template) =>
      template.id === 'g3-2-capacity-weight-01'
        ? { ...template, prompt: '1L 250mL 물의 들이를 읽어 보세요.' }
        : template
    )
    const mismatchedWeightModel = grade3MissionTemplates.map((template) =>
      template.id === 'g3-2-capacity-weight-02'
        ? { ...template, visualConfig: { ...template.visualConfig, totalG: 2200 } }
        : template
    )
    const answerLeakingCompassHint = grade3MissionTemplates.map((template) =>
      template.id === 'g3-2-circle-03'
        ? { ...template, hintSteps: ['컴퍼스 폭은 6 cm예요.', ...template.hintSteps.slice(1)] }
        : template
    )

    expect(validateGrade3MissionBank(calculationCircle).errors).toContain(
      'g3-2-circle-03: [4수03-07] requires a two-stage compass construction activity'
    )
    expect(validateGrade3MissionBank(answerCopyingCapacity).errors).toContain(
      'g3-2-capacity-weight-01: prompt must not copy the capacity answer'
    )
    expect(validateGrade3MissionBank(mismatchedWeightModel).errors).toContain(
      'g3-2-capacity-weight-02: weight scale model must match the rule-based answer'
    )
    expect(validateGrade3MissionBank(answerLeakingCompassHint).errors).toContain(
      'g3-2-circle-03: prompt and hints must not expose the compass-width answer'
    )
  })

  it('keeps choice answers unique and exact', () => {
    const missions = getGrade3Missions(42)
    for (const mission of missions.filter((item) => item.answerType === 'choice' || item.answerType === 'label')) {
      expect(new Set(mission.choices).size).toBe(mission.choices?.length)
      expect(mission.choices?.filter((choice) => choice === mission.correctAnswer)).toHaveLength(1)
    }
  })

  it('keeps g3-1-lines-03 as a right-angle comparison classification activity', () => {
    const mission = getGrade3MissionById('g3-1-lines-03', 42)
    const learningCopy = [
      mission.learnerGoal,
      mission.parentSummaryTag,
      mission.prompt,
      ...mission.hintSteps,
      ...mission.solutionSteps,
      mission.scaffoldConfig.prompt,
    ].join(' ')

    expect(mission.id).toBe('g3-1-lines-03')
    expect(mission.curriculumCode).toBe('[4수03-02]')
    expect(mission.answerType).toBe('label')
    expect(mission.answerConfig).toEqual({ kind: 'label' })
    expect(mission.correctAnswer).toBe('둔각')
    expect(mission.choices).toEqual(['예각', '직각', '둔각'])
    expect(mission.scaffoldConfig.options).toEqual(['직각보다 작다', '직각과 같다', '직각보다 크다'])
    expect(learningCopy).toContain('직각')
    expect(learningCopy).toContain('둔각')
    expect(learningCopy).not.toMatch(/각도기|\d+\s*도|몇 도|눈금/)
    expect(mission.visualConfig).toEqual({
      rayEndX: 34,
      rayEndY: 34,
      showRightAngleGuide: true,
    })
    expect(Number(mission.visualConfig.rayEndX)).toBeLessThan(76)
    expect(Number(mission.visualConfig.rayEndY)).toBeLessThan(100)

    const comparisonActivities = grade3MissionTemplates.filter(
      (template) => template.curriculumCode === '[4수03-02]'
    )
    const comparisonCopy = comparisonActivities
      .flatMap((template) => [
        template.learnerGoal,
        template.prompt,
        ...template.hintSteps,
        ...template.solutionSteps,
        template.scaffoldConfig.prompt,
      ])
      .join(' ')
    expect(comparisonCopy).not.toMatch(/각도기|\d+\s*도|몇 도|눈금/)
  })

  it('falls back to the safe mission for unknown ids', () => {
    expect(getGrade3MissionById('missing-id', 42).id).toBe('g3-1-add-sub-01')
  })
})
