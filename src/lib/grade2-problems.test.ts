import { describe, expect, it } from 'vitest'

import grade12Allocation from '../../public/data/curriculum-allocations-v1.json'
import { buildCanonicalMathSignature } from '../../scripts/content-inventory-core.js'
import {
  auditGrade2MissionVariants,
  getGrade2MissionById,
  getGrade2MissionSet,
  getGrade2Missions,
  getGrade2MissionsByUnit,
  getSafeGrade2Mission,
  grade2OfficialContentPairs,
  grade2OfficialStandardText,
  grade2MissionTemplates,
  grade2Units,
  normalizeGrade2Mode,
  validateGrade2MissionBank,
} from './grade2-problems'

function canonicalGrade2AuthoredSignature(template: (typeof grade2MissionTemplates)[number]): string {
  return buildCanonicalMathSignature({
    curriculumStandards: [...template.directCurriculumCodes].sort(),
    problemFamily: template.learnerGoal.replace(/ 연습$/u, ''),
    solutionRule: template.solverRule,
    contextType: template.parentSummaryTag,
    representationTypes: [template.answerType, template.visualModel].sort(),
    taskActions: [...template.taskActions].sort(),
    reasoningPattern: '',
  })
}

function canonicalGrade2PairBehaviorSignature(template: (typeof grade2MissionTemplates)[number]): string {
  const config = template.visualConfig
  let visualRelation = Object.keys(config).sort().join(',')
  if (template.visualModel === 'solid-shape-cards') visualRelation += `:${String(config.shapes)}`
  if (template.visualModel === 'box-equation') visualRelation += `:${String(config.operator)}:${String(config.missing)}`
  if (template.visualModel === 'pattern-strip') {
    visualRelation += `:${String(config.pattern).replace(/\d+/g, '#')}`
  }
  if (template.visualModel === 'classification-table' || template.visualModel === 'mark-graph') {
    const target = String(config.target)
    visualRelation += target.includes('-') ? ':difference' : target ? ':category' : ':whole'
  }

  return buildCanonicalMathSignature({
    curriculumStandards: [...template.directCurriculumCodes].sort(),
    problemFamily: '',
    solutionRule: template.solverRule,
    contextType: '',
    representationTypes: [template.answerType, template.visualModel, visualRelation].sort(),
    taskActions: [...template.taskActions].sort(),
    reasoningPattern: '',
  })
}

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
    expect(normalizeGrade2Mode(undefined, 'g2-1-place-value-01-v1')).toBe('practice')
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
    const signatures = grade2MissionTemplates.map(canonicalGrade2AuthoredSignature)

    expect(grade2MissionTemplates.filter((template) => template.id.endsWith('-v1'))).toHaveLength(72)
    expect(grade2MissionTemplates.some((template) => /^(?:생활 연습|그림을 확인하세요|한 번 더|다시)/.test(template.promptTemplate))).toBe(false)
    expect(new Set(signatures).size).toBe(144)

    for (const basic of grade2MissionTemplates.filter((template) => template.mode === 'basic')) {
      const authoredPractice = grade2MissionTemplates.find((template) => template.id === `${basic.id}-v1`)
      expect(
        canonicalGrade2AuthoredSignature(authoredPractice!),
        `${basic.id}-v1 must change the relation, representation, or learner action`,
      ).not.toBe(canonicalGrade2AuthoredSignature(basic))
      expect(
        canonicalGrade2PairBehaviorSignature(authoredPractice!),
        `${basic.id}-v1 must differ in solver, visual relation, or task action`,
      ).not.toBe(canonicalGrade2PairBehaviorSignature(basic))
    }
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

  it('declares each official allocation as a source-faithful knowing and applying pair', () => {
    const allocations = grade12Allocation.allocations.filter((allocation) => allocation.assignedGrade === 2)
    expect(grade2OfficialContentPairs).toHaveLength(27)

    for (const allocation of allocations) {
      const pair = grade2OfficialContentPairs.find((item) => item.standardCode === allocation.standardCode)
      expect(pair).toMatchObject({
        standardCode: allocation.standardCode,
        unitId: allocation.unitId,
        officialText: allocation.officialText,
      })

      const basic = grade2MissionTemplates.find((template) => template.id === pair?.basicMissionId)
      const applying = grade2MissionTemplates.find((template) => template.id === pair?.applyingMissionId)
      expect(basic).toMatchObject({
        mode: 'basic',
        cognitiveDomain: 'knowing',
        directCurriculumCodes: [allocation.standardCode],
        curriculumText: allocation.officialText,
      })
      expect(applying).toMatchObject({
        mode: 'practice',
        cognitiveDomain: 'applying',
        directCurriculumCodes: [allocation.standardCode],
        curriculumText: allocation.officialText,
      })
      expect(grade2OfficialStandardText[allocation.standardCode]).toBe(allocation.officialText)
    }
  })

  it('keeps the three previously missing curriculum behaviors in prompt, solver, and visual', () => {
    for (const id of ['g2-1-add-sub-04', 'g2-1-add-sub-04-v1']) {
      const template = grade2MissionTemplates.find((item) => item.id === id)!
      expect(template.promptTemplate.match(/[+-]/g)).toHaveLength(2)
      expect(template.visualModel).toBe('pattern-strip')
      expect(String(template.visualConfig.pattern).match(/[+-]/g)).toHaveLength(2)
      expect(template.directCurriculumCodes).toEqual(['[2수01-08]'])
    }

    for (const id of ['g2-2-pattern-02', 'g2-2-pattern-04-v1']) {
      const template = grade2MissionTemplates.find((item) => item.id === id)!
      expect(template.promptTemplate).toMatch(/직접 정|내가 고른 규칙/u)
      expect(template.taskActions).toContain('construct')
      expect(template.visualModel).toBe('pattern-strip')
      expect(template.directCurriculumCodes).toEqual(['[2수02-02]'])
    }

    const triangles = grade2MissionTemplates.find((item) => item.id === 'g2-1-shapes-05')!
    expect(triangles.promptTemplate).toMatch(/삼각형 여러 개.*공통/)
    expect(triangles.solverRule).toMatch(/변.*3.*꼭짓점.*3/)
    expect(triangles.visualConfig.shapes).toBe('삼각형,삼각형,삼각형')
    expect(triangles.directCurriculumCodes).toEqual(['[2수03-05]'])

    const quadrilaterals = grade2MissionTemplates.find((item) => item.id === 'g2-1-shapes-05-v1')!
    expect(quadrilaterals.promptTemplate).toMatch(/사각형 여러 개.*공통/)
    expect(quadrilaterals.solverRule).toMatch(/변.*4.*꼭짓점.*4/)
    expect(quadrilaterals.visualConfig.shapes).toBe('사각형,사각형,사각형')
    expect(quadrilaterals.directCurriculumCodes).toEqual(['[2수03-05]'])
    expect([triangles.solverRule, quadrilaterals.solverRule].join('\n')).not.toMatch(/곧은 변/u)
  })

  it('keeps direct curriculum codes aligned to the actual prompt, solver, and visual behavior', () => {
    const expectedCodes = {
      'g2-1-shapes-06': '[2수03-02]',
      'g2-1-length-05': '[2수03-11]',
      'g2-1-length-05-v1': '[2수03-11]',
      'g2-1-length-06': '[2수03-11]',
      'g2-2-time-05': '[2수03-08]',
      'g2-2-time-06': '[2수03-09]',
      'g2-2-table-graph-03': '[2수04-03]',
      'g2-2-table-graph-06': '[2수04-03]',
      'g2-2-pattern-02': '[2수02-02]',
      'g2-2-pattern-05': '[2수02-01]',
    }
    for (const [id, code] of Object.entries(expectedCodes)) {
      expect(grade2MissionTemplates.find((item) => item.id === id)?.directCurriculumCodes, id)
        .toEqual([code])
    }
  })

  it('authors the learner-created rule and raw-data table standards as actual actions', () => {
    for (const id of ['g2-2-pattern-02', 'g2-2-pattern-04-v1']) {
      const template = grade2MissionTemplates.find((item) => item.id === id)!
      expect(template.promptTemplate).toMatch(/직접 정|내가 고른 규칙/u)
      expect(template.promptTemplate).toMatch(/배열.*완성|규칙과 배열/u)
      expect(template.taskActions).toContain('construct')
    }

    for (const id of ['g2-2-table-graph-01', 'g2-2-table-graph-03-v1']) {
      const template = grade2MissionTemplates.find((item) => item.id === id)!
      expect(template.promptTemplate).toMatch(/원자료/u)
      expect(template.promptTemplate).toMatch(/분류/u)
      expect(template.promptTemplate).toMatch(/표.*완성|편리/u)
      expect(template.taskActions).toContain('classify')
    }
  })

  it('uses natural multiplication situations and distinct relation work for flagged pairs', () => {
    const flowerPots = grade2MissionTemplates.find((item) => item.id === 'g2-1-multiplication-01-v1')!
    expect(flowerPots.promptTemplate).toContain('화분이 5개')
    expect(flowerPots.promptTemplate).toContain('화분마다 꽃을 3송이씩')
    expect(flowerPots.promptTemplate).not.toMatch(/화분 5개마다/u)
    expect(flowerPots.taskActions).toContain('explain')

    const windows = grade2MissionTemplates.find((item) => item.id === 'g2-1-multiplication-05-v1')!
    expect(windows.promptTemplate).toMatch(/한 줄에 창문이 5개씩.*4줄/u)
    expect(windows.promptTemplate).not.toMatch(/창문 4줄마다/u)

    const table = grade2MissionTemplates.find((item) => item.id === 'g2-2-table-graph-01-v1')!
    expect(table.taskActions).not.toEqual(
      grade2MissionTemplates.find((item) => item.id === 'g2-2-table-graph-01')!.taskActions,
    )
  })

  it('gives every authored practice a problem-specific hint and justified solution', () => {
    const practices = grade2MissionTemplates.filter((template) => template.mode === 'practice')
    expect(practices).toHaveLength(72)
    for (const template of practices) {
      expect(template.hintStepsTemplate.length, `${template.id} hint`).toBeGreaterThan(0)
      expect(template.solutionStepsTemplate.length, `${template.id} solution`).toBeGreaterThan(0)
      expect(template.hintStepsTemplate.join(' '), `${template.id} generic hint`)
        .not.toContain('문제에서 묻는 관계를 먼저 찾아요')
      expect(template.solutionStepsTemplate.join(' '), `${template.id} fallback solution`)
        .not.toMatch(/정답\s*:/u)
      expect(template.solutionStepsTemplate.join(' ').length, `${template.id} solution detail`).toBeGreaterThan(12)
    }
  })

  it('keeps Korean particles natural across prompts, hints, and solutions', () => {
    const text = grade2MissionTemplates.flatMap((template) => [
      template.promptTemplate,
      ...template.hintStepsTemplate,
      ...template.solutionStepsTemplate,
    ]).join('\n')

    expect(text).not.toMatch(/(?:딸기|포도)은|딸기이|\d+\s*x\s*\d+는/u)
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
    for (const id of [
      'g2-2-length-02-v1',
      'g2-2-length-04-v1',
      'g2-2-length-06-v1',
    ]) {
      const mission = getGrade2MissionById(id, 42)
      expect(mission.answerConfig.unit, id).toBe('cm')
      expect(mission.correctAnswer, id).toMatch(/^\d+cm$/)
    }
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
