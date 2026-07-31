import { describe, expect, it } from 'vitest'

import {
  auditGrade3MissionVariants,
  getGrade3MissionById,
  getGrade3MissionSession,
  getGrade3Missions,
  grade3MissionTemplates,
  grade3Units,
  normalizeGrade3Mode,
  validateGrade3MissionBank,
} from './grade3-problems'

describe('grade3 mission bank', () => {
  it('ships 12 units with 10 authored missions and K/A/R 4/4/2 in every unit', () => {
    const missions = getGrade3Missions(42)

    expect(grade3Units).toHaveLength(12)
    expect(missions).toHaveLength(120)
    for (const unit of grade3Units) {
      const unitMissions = missions.filter((mission) => mission.unitId === unit.id)
      expect(unitMissions).toHaveLength(10)
      expect(unitMissions.filter((mission) => mission.cognitiveDomain === 'knowing')).toHaveLength(4)
      expect(unitMissions.filter((mission) => mission.cognitiveDomain === 'applying')).toHaveLength(4)
      expect(unitMissions.filter((mission) => mission.cognitiveDomain === 'reasoning')).toHaveLength(2)
      expect(unitMissions.map((mission) => mission.unitMissionOrder)).toEqual(
        Array.from({ length: 10 }, (_, index) => index + 1)
      )
    }
    expect(missions.filter((mission) => mission.cognitiveDomain === 'knowing')).toHaveLength(48)
    expect(missions.filter((mission) => mission.cognitiveDomain === 'applying')).toHaveLength(48)
    expect(missions.filter((mission) => mission.cognitiveDomain === 'reasoning')).toHaveLength(24)
  })

  it('preserves every legacy mission id while adding distinct authored sources', () => {
    const legacyIds = [
      ...Array.from({ length: 6 }, (_, unit) =>
        Array.from({ length: 3 }, (_, mission) => `g3-1-${[
          'add-sub', 'lines', 'division', 'multiply', 'length-time', 'fraction-decimal',
        ][unit]}-${String(mission + 1).padStart(2, '0')}`)
      ).flat(),
      ...Array.from({ length: 4 }, (_, unit) =>
        Array.from({ length: 3 }, (_, mission) => `g3-2-${[
          'multiply', 'division', 'circle', 'fraction',
        ][unit]}-${String(mission + 1).padStart(2, '0')}`)
      ).flat(),
      ...Array.from({ length: 7 }, (_, mission) => `g3-2-capacity-weight-${String(mission + 1).padStart(2, '0')}`),
      ...Array.from({ length: 3 }, (_, mission) => `g3-2-graph-${String(mission + 1).padStart(2, '0')}`),
    ]
    const ids = new Set(grade3MissionTemplates.map((mission) => mission.id))

    expect(legacyIds).toHaveLength(40)
    expect(legacyIds.every((id) => ids.has(id))).toBe(true)

    for (const unit of grade3Units) {
      const sources = grade3MissionTemplates.filter((mission) => mission.unitId === unit.id)
      const signatures = sources.map((mission) => [
        mission.prompt.replace(/\d+/g, '#'),
        mission.visualModel,
        mission.taskActions.join(','),
      ].join('|'))
      expect(new Set(signatures).size).toBe(10)
      expect(new Set(sources.map((mission) => mission.authoredSourceKey)).size).toBe(10)
    }
  })

  it('gives every allocated standard a direct knowing and applying mission', () => {
    for (const unit of grade3Units) {
      const missions = grade3MissionTemplates.filter((mission) => mission.unitId === unit.id)
      for (const code of unit.curriculumCodes) {
        expect(
          missions.some((mission) =>
            mission.cognitiveDomain === 'knowing' && mission.directCurriculumCodes.includes(code)
          ),
          `${unit.id} ${code} knowing`,
        ).toBe(true)
        expect(
          missions.some((mission) =>
            mission.cognitiveDomain === 'applying' && mission.directCurriculumCodes.includes(code)
          ),
          `${unit.id} ${code} applying`,
        ).toBe(true)
      }
    }

    const distanceMissions = grade3MissionTemplates.filter((mission) =>
      mission.directCurriculumCodes.includes('[4수03-16]')
    )
    expect(distanceMissions.some((mission) => mission.cognitiveDomain === 'knowing')).toBe(true)
    expect(distanceMissions.some((mission) => mission.cognitiveDomain === 'applying')).toBe(true)
    expect(distanceMissions.every((mission) =>
      mission.prompt.includes('km') && mission.prompt.includes('m')
    )).toBe(true)
  })

  it('builds deterministic unlocked basic and practice sessions with one K, A, and R item', () => {
    expect(normalizeGrade3Mode(undefined)).toBe('basic')
    expect(normalizeGrade3Mode('unexpected')).toBe('basic')
    expect(normalizeGrade3Mode('practice')).toBe('practice')

    for (const unit of grade3Units) {
      const basic = getGrade3MissionSession(unit.id, 'basic', 20260516)
      const repeated = getGrade3MissionSession(unit.id, 'basic', 20260516)
      const practice = getGrade3MissionSession(unit.id, 'practice', 20260516)

      expect(basic).toHaveLength(3)
      expect(practice).toHaveLength(3)
      expect(basic.map((mission) => mission.cognitiveDomain)).toEqual(['knowing', 'applying', 'reasoning'])
      expect(practice.map((mission) => mission.cognitiveDomain)).toEqual(['knowing', 'applying', 'reasoning'])
      expect(repeated.map((mission) => mission.id)).toEqual(basic.map((mission) => mission.id))
      expect(new Set([...basic, ...practice].map((mission) => mission.id)).size).toBe(6)
      expect(basic.map((mission) => mission.unitMissionOrder)).toEqual([1, 2, 3])
      expect(practice.map((mission) => mission.unitMissionOrder)).toEqual([1, 2, 3])
    }
  })

  it('reopens a legacy mission inside an exact three-item K/A/R session', () => {
    const session = getGrade3MissionSession(
      'g3-2-capacity-weight',
      'basic',
      20260516,
      'g3-2-capacity-weight-05',
    )

    expect(session).toHaveLength(3)
    expect(session.map((mission) => mission.cognitiveDomain)).toEqual(['knowing', 'applying', 'reasoning'])
    expect(session.map((mission) => mission.unitMissionOrder)).toEqual([1, 2, 3])
    expect(session.map((mission) => mission.id)).toContain('g3-2-capacity-weight-05')
  })

  it('keeps reviewed missions materially distinct and aligns prompts with their response model', () => {
    const multiply03 = getGrade3MissionById('g3-1-multiply-03', 42)
    const multiply09 = getGrade3MissionById('g3-1-multiply-09', 42)
    const fraction01 = getGrade3MissionById('g3-1-fraction-decimal-01', 42)
    const fraction05 = getGrade3MissionById('g3-1-fraction-decimal-05', 42)
    const fraction10 = getGrade3MissionById('g3-2-fraction-10', 42)
    const capacity09 = getGrade3MissionById('g3-2-capacity-weight-09', 42)

    expect(multiply09.correctAnswer).not.toBe(multiply03.correctAnswer)
    expect(multiply09.visualConfig).not.toEqual(multiply03.visualConfig)
    expect(multiply09.prompt).not.toContain('공')
    expect(multiply09.prompt).not.toContain('상자')

    expect(fraction05.correctAnswer).not.toBe(fraction01.correctAnswer)
    expect(fraction05.visualConfig).not.toEqual(fraction01.visualConfig)
    expect(fraction05.prompt).toContain('색칠하지 않은')

    expect(fraction10.prompt).toContain('누가')
    expect(fraction10.choices).toEqual(['민아', '준호'])
    expect(fraction10.correctAnswer).toBe('준호')

    expect(capacity09.visualConfig).toMatchObject({
      tonnes: 2,
      kilogramsPerTonne: 1000,
      removedKilograms: 500,
    })
    expect(capacity09.scaffoldConfig.prompt).toContain('2t')
    expect(capacity09.scaffoldConfig.options).toEqual(['1번', '2번', '3번'])
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

    expect(result.variantCount).toBe(120)
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
