import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  GRADE4_ACTIVITY_ITEM_COUNT,
  GRADE4_ANGLE_MEASUREMENT_UNIT_ID,
  GRADE4_DECIMAL_UNIT_ID,
  GRADE4_DECIMAL_ADD_SUB_UNIT_ID,
  GRADE4_ESTIMATION_UNIT_ID,
  GRADE4_EQUALITY_UNIT_ID,
  GRADE4_FRACTION_ADD_SUB_UNIT_ID,
  GRADE4_LINE_GRAPHS_UNIT_ID,
  GRADE4_PATTERNS_UNIT_ID,
  GRADE4_PERPENDICULAR_PARALLEL_UNIT_ID,
  GRADE4_POLYGONS_UNIT_ID,
  GRADE4_QUADRILATERALS_UNIT_ID,
  GRADE4_SHAPE_TRANSFORMATIONS_UNIT_ID,
  GRADE4_TRIANGLES_UNIT_ID,
  correctGrade4NumericParticles,
  getGrade4Activity,
  getGrade4MissionBank,
  grade4MissionTemplates,
  grade4Units,
  validateGrade4MissionBank,
} from './grade4-problems'

const ledger = JSON.parse(readFileSync(join(process.cwd(), 'public/data/curriculum-allocations-v1.json'), 'utf8'))
const reviewCore = require('../../scripts/problem-review-catalog-core.js')
const numericConnectiveRegressionTemplateIds = new Set([
  'g4-big-10',
  'g4-div-03', 'g4-div-04', 'g4-div-07', 'g4-div-08', 'g4-div-10',
  'g4-est-04', 'g4-est-08',
  'g4-dec-08', 'g4-dec-09', 'g4-dec-10',
  'g4-frac-01', 'g4-frac-02',
  'g4-dop-07',
  'g4-pat-01', 'g4-pat-02', 'g4-pat-03', 'g4-pat-09', 'g4-pat-10',
  'g4-eq-01', 'g4-eq-02', 'g4-eq-03', 'g4-eq-05',
  'g4-move-05',
])
const fractionParticleRegressionTemplateIds = new Set([
  'g4-frac-01',
  'g4-frac-02',
  'g4-frac-03',
  'g4-frac-07',
  'g4-frac-09',
  'g4-frac-10',
])

describe('Grade 4 Bridge release bank', () => {
  it('requires source-owned editorial actions and visual semantics for every template', () => {
    const allowedActions = new Set([
      'recognize', 'classify', 'compare', 'calculate', 'measure', 'construct',
      'model', 'interpret', 'explain', 'analyze_error', 'reason',
    ])
    const allowedVisualSemantics = new Set(['decorative', 'schematic', 'quantitative'])

    for (const template of grade4MissionTemplates) {
      const quality = template as typeof template & {
        taskActions?: string[]
        visualSemantics?: string
      }

      expect(quality.taskActions, `${template.id} taskActions`).toBeDefined()
      expect(quality.taskActions?.length, `${template.id} taskActions`).toBeGreaterThan(0)
      expect(
        quality.taskActions?.every((action) => allowedActions.has(action)),
        `${template.id} taskActions`,
      ).toBe(true)
      expect(
        allowedVisualSemantics.has(quality.visualSemantics ?? ''),
        `${template.id} visualSemantics`,
      ).toBe(true)
    }
  })

  it('matches reviewed geometry actions to the actual prompt and answer behavior', () => {
    const expected = new Map<string, string[]>([
      ['g4-line-01', ['calculate', 'classify']],
      ['g4-line-02', ['classify', 'compare']],
      ['g4-line-03', ['recognize']],
      ['g4-line-04', ['reason']],
      ['g4-line-05', ['calculate', 'classify']],
      ['g4-line-06', ['classify', 'compare']],
      ['g4-line-07', ['compare', 'reason']],
      ['g4-line-08', ['calculate']],
      ['g4-line-09', ['analyze_error', 'compare']],
      ['g4-line-10', ['reason']],
      ['g4-tri-01', ['classify']],
      ['g4-tri-02', ['classify']],
      ['g4-tri-03', ['classify']],
      ['g4-tri-04', ['classify']],
      ['g4-tri-05', ['classify']],
      ['g4-tri-06', ['classify', 'reason']],
      ['g4-tri-07', ['classify']],
      ['g4-tri-08', ['classify', 'reason']],
      ['g4-tri-09', ['analyze_error', 'explain']],
      ['g4-tri-10', ['classify', 'reason']],
      ['g4-quad-01', ['classify']],
      ['g4-quad-02', ['classify']],
      ['g4-quad-03', ['classify']],
      ['g4-quad-04', ['classify']],
      ['g4-quad-05', ['classify']],
      ['g4-quad-06', ['classify']],
      ['g4-quad-07', ['classify', 'reason']],
      ['g4-quad-08', ['classify', 'reason']],
      ['g4-quad-09', ['analyze_error', 'reason']],
      ['g4-quad-10', ['classify', 'reason']],
    ])
    const byId = new Map(grade4MissionTemplates.map((template) => [template.id, template]))

    for (const [id, actions] of expected) {
      const template = byId.get(id)!
      const mission = template.build(1, 1)
      expect(template.taskActions, `${id}: ${mission.prompt} → ${mission.correctAnswer}`).toEqual(actions)
    }

    expect(
      grade4MissionTemplates.filter((template) => template.taskActions.includes('construct')),
      'Grade 4 currently has choice/text answers, not a drawing or construction response',
    ).toEqual([])
    const measured = grade4MissionTemplates.filter((template) => template.taskActions.includes('measure'))
    expect(measured.map((template) => template.id)).toEqual(['g4-ang-01'])
    const protractorReading = measured[0].build(1, 1)
    expect(protractorReading.prompt).toContain('가리키는 각도')
    expect(protractorReading.visualConfig.showProtractor).toBe(true)
  })

  it('ties every declared action to generated prompt or answer evidence', () => {
    const interpretedRepresentations = new Set([
      'number-line', 'pattern-table', 'shape-transformation',
      'tiling-model', 'line-graph-model', 'data-table-model',
    ])

    for (const template of grade4MissionTemplates) {
      const mission = template.build(1, 1)
      const text = [
        template.promptTemplate,
        mission.prompt,
        mission.correctAnswer,
        ...mission.solutionSteps,
      ].join(' ')

      for (const action of template.taskActions) {
        if (action === 'recognize') {
          expect(mission.correctAnswer.trim(), `${template.id} recognize answer`).not.toBe('')
        } else if (action === 'classify') {
          expect(template.answerType, `${template.id} classify response`).toBe('choice')
          expect(text, `${template.id} classify wording`).toMatch(/이름|분류|관계|이동|도형|다각형|각/)
        } else if (action === 'compare') {
          expect(text, `${template.id} compare wording`).toMatch(/비교|크|작|차|같|사이|가까|평행/)
        } else if (action === 'calculate') {
          expect(mission.solutionSteps.join(' '), `${template.id} calculate steps`).toMatch(
            /[+\-×÷<>=]|계산|구하|더|빼|곱|나누|차|합|몫|나머지|칸|좌표|옮겨/,
          )
        } else if (action === 'measure') {
          expect(template.id).toBe('g4-ang-01')
          expect(mission.visualConfig.showProtractor).toBe(true)
        } else if (action === 'construct') {
          throw new Error(`${template.id}: no Grade 4 response surface accepts a construction`)
        } else if (action === 'model') {
          expect(text, `${template.id} model wording`).toMatch(/식|수로 쓰|나타내/)
        } else if (action === 'interpret') {
          expect(
            interpretedRepresentations.has(template.representation)
              || /표|그래프|눈금|자료|규칙|회전|방향/.test(text),
            `${template.id} interpret evidence`,
          ).toBe(true)
        } else if (action === 'explain') {
          expect(mission.correctAnswer, `${template.id} explain answer`).toMatch(/입니다|습니다|때문|까닭|므로/)
        } else if (action === 'analyze_error') {
          expect(text, `${template.id} error-analysis wording`).toMatch(/말했|라고 했|주장|오류|잘못|고치|멈췄|틀|시험|너무/)
        } else if (action === 'reason') {
          expect(mission.solutionSteps.length, `${template.id} reasoning steps`).toBeGreaterThanOrEqual(2)
        }
      }
    }
  })

  it('declares only support tools the Grade 4 UI actually provides', () => {
    expect(new Set(grade4MissionTemplates.map((template) => template.supportTool))).toEqual(
      new Set(['none', 'grid']),
    )
    const protractorReading = grade4MissionTemplates.find((template) => template.id === 'g4-ang-01')!
    expect(protractorReading.supportTool).toBe('none')
    expect(protractorReading.build(1, 1).visualConfig.showProtractor).toBe(true)
  })

  it('corrects complete numeric particles from an independent Korean corpus', () => {
    const cases = [
      ['1는 첫 번째 수입니다.', '1은 첫 번째 수입니다.'],
      ['2은 두 번째 수입니다.', '2는 두 번째 수입니다.'],
      ['3가 남습니다.', '3이 남습니다.'],
      ['4이 남습니다.', '4가 남습니다.'],
      ['6를 더합니다.', '6을 더합니다.'],
      ['9을 더합니다.', '9를 더합니다.'],
      ['7와 9를 비교합니다.', '7과 9를 비교합니다.'],
      ['5과 2를 비교합니다.', '5와 2를 비교합니다.'],
      ['분모가 6로 같습니다.', '분모가 6으로 같습니다.'],
      ['5으로 늘어나므로 답을 구합니다.', '5로 늘어나므로 답을 구합니다.'],
      ['1으로 이동합니다.', '1로 이동합니다.'],
      ['7으로 이동합니다.', '7로 이동합니다.'],
      ['8으로 이동합니다.', '8로 이동합니다.'],
      ['2.710가 가장 큽니다.', '2.710이 가장 큽니다.'],
      ['6.19 L이 남았습니다.', '6.19 L가 남았습니다.'],
      ['3 kg로 나타냅니다.', '3 kg으로 나타냅니다.'],
      ['5 cm으로 옮깁니다.', '5 cm로 옮깁니다.'],
      ['1/8 + 4/8을 계산합니다.', '1/8 + 4/8를 계산합니다.'],
      ['10/8로 고칩니다.', '10/8으로 고칩니다.'],
      ['19/8을 대분수로 고칩니다.', '19/8를 대분수로 고칩니다.'],
      ['5/18이 더 큽니다.', '5/18가 더 큽니다.'],
      ['6/8를 선택합니다.', '6/8을 선택합니다.'],
      ['2 1/8을 더합니다.', '2 1/8을 더합니다.'],
      ['5이므로 다음 단계로 갑니다.', '5이므로 다음 단계로 갑니다.'],
      ['5이면 조건을 만족합니다.', '5이면 조건을 만족합니다.'],
      ['5이다.', '5이다.'],
      ['5이라서 계산합니다.', '5이라서 계산합니다.'],
      ['https://example.test/grade/1/8을 엽니다.', 'https://example.test/grade/1/8을 엽니다.'],
      ['12 / 5으로 나눕니다.', '12 / 5으로 나눕니다.'],
      ['12/5으로 나눕니다.', '12/5으로 나눕니다.'],
    ] as const

    for (const [input, expected] of cases) {
      expect(correctGrade4NumericParticles(input), input).toBe(expected)
    }
  })

  it('audits all generated surfaces with independent connective and fraction corpora', () => {
    const expectedFractionParticles = {
      '0': { topic: '은', subject: '이', object: '을', join: '과', direction: '으로' },
      '1': { topic: '은', subject: '이', object: '을', join: '과', direction: '로' },
      '2': { topic: '는', subject: '가', object: '를', join: '와', direction: '로' },
      '3': { topic: '은', subject: '이', object: '을', join: '과', direction: '으로' },
      '4': { topic: '는', subject: '가', object: '를', join: '와', direction: '로' },
      '5': { topic: '는', subject: '가', object: '를', join: '와', direction: '로' },
      '6': { topic: '은', subject: '이', object: '을', join: '과', direction: '으로' },
      '7': { topic: '은', subject: '이', object: '을', join: '과', direction: '로' },
      '8': { topic: '은', subject: '이', object: '을', join: '과', direction: '로' },
      '9': { topic: '는', subject: '가', object: '를', join: '와', direction: '로' },
    } as const
    const historicalDefects = [
      ['g4-frac-01', 2, 'prompt', '4/8을', '4/8를'],
      ['g4-frac-01', 3, 'prompt', '2/6을', '2/6를'],
      ['g4-frac-01', 5, 'prompt', '4/8을', '4/8를'],
      ['g4-frac-01', 6, 'prompt', '2/6을', '2/6를'],
      ['g4-frac-01', 8, 'prompt', '4/8을', '4/8를'],
      ['g4-frac-01', 9, 'prompt', '2/6을', '2/6를'],
      ['g4-frac-02', 1, 'prompt', '2/8을', '2/8를'],
      ['g4-frac-02', 4, 'prompt', '2/8을', '2/8를'],
      ['g4-frac-02', 7, 'prompt', '2/8을', '2/8를'],
      ['g4-frac-03', 1, 'prompt', '1 2/7을', '1 2/7를'],
      ['g4-frac-03', 2, 'prompt', '1 2/8을', '1 2/8를'],
      ['g4-frac-03', 2, 'step1', '10/8로', '10/8으로'],
      ['g4-frac-03', 2, 'step2', '19/8을', '19/8를'],
      ['g4-frac-03', 3, 'prompt', '1 2/9을', '1 2/9를'],
      ['g4-frac-03', 3, 'step2', '22/9을', '22/9를'],
      ['g4-frac-03', 4, 'prompt', '1 2/6을', '1 2/6를'],
      ['g4-frac-03', 4, 'step2', '15/6을', '15/6를'],
      ['g4-frac-03', 5, 'prompt', '1 2/7을', '1 2/7를'],
      ['g4-frac-03', 6, 'prompt', '1 2/8을', '1 2/8를'],
      ['g4-frac-03', 6, 'step1', '10/8로', '10/8으로'],
      ['g4-frac-03', 6, 'step2', '19/8을', '19/8를'],
      ['g4-frac-03', 7, 'prompt', '1 2/9을', '1 2/9를'],
      ['g4-frac-03', 7, 'step2', '22/9을', '22/9를'],
      ['g4-frac-03', 8, 'prompt', '1 2/6을', '1 2/6를'],
      ['g4-frac-03', 8, 'step2', '15/6을', '15/6를'],
      ['g4-frac-03', 9, 'prompt', '1 2/7을', '1 2/7를'],
      ['g4-frac-07', 1, 'step1', '3/8로', '3/8으로'],
      ['g4-frac-07', 4, 'step1', '3/8로', '3/8으로'],
      ['g4-frac-07', 7, 'step1', '3/8로', '3/8으로'],
      ['g4-frac-09', 2, 'choice1', '5/18이', '5/18가'],
      ['g4-frac-09', 2, 'choice1', '2/18이', '2/18가'],
      ['g4-frac-09', 2, 'choice4', '5/18이', '5/18가'],
      ['g4-frac-09', 4, 'choice2', '5/16이', '5/16가'],
      ['g4-frac-09', 4, 'choice3', '5/16이', '5/16가'],
      ['g4-frac-09', 4, 'choice3', '2/16이', '2/16가'],
      ['g4-frac-09', 6, 'choice1', '5/14이', '5/14가'],
      ['g4-frac-09', 6, 'choice1', '2/14이', '2/14가'],
      ['g4-frac-09', 6, 'choice4', '5/14이', '5/14가'],
      ['g4-frac-09', 8, 'choice2', '5/18이', '5/18가'],
      ['g4-frac-09', 8, 'choice3', '5/18이', '5/18가'],
      ['g4-frac-09', 8, 'choice3', '2/18이', '2/18가'],
      ['g4-frac-10', 1, 'choice3', '6/8를', '6/8을'],
      ['g4-frac-10', 2, 'choice2', '7/9를', '7/9을'],
      ['g4-frac-10', 4, 'choice4', '6/8를', '6/8을'],
      ['g4-frac-10', 5, 'choice3', '7/9를', '7/9을'],
      ['g4-frac-10', 7, 'choice1', '6/8를', '6/8을'],
      ['g4-frac-10', 8, 'choice4', '7/9를', '7/9을'],
    ] as const
    const fractionPattern = /(?<![/\dA-Za-z])(?:\d[\d,]*\s+)?(\d[\d,]*)\/(\d[\d,]*)(으로|로|은|는|이|가|을|를|과|와)(?=$|[\s.,!?…;:)\]}'"”’])/g
    const fractionDefects: string[] = []
    const generatedSurfaces = new Map<string, string>()
    const connectiveTemplateIds = new Set<string>()
    let connectiveSurfaceCount = 0
    let fractionParticleCount = 0
    let auditedSurfaceCount = 0
    for (const template of grade4MissionTemplates) {
      for (let variant = 1; variant <= 9; variant += 1) {
        const mission = template.build(variant, 2_026_072_600 + variant)
        const surfaces = [
          ['prompt', mission.prompt],
          ...template.hintSteps.map((text, index) => [`hint${index + 1}`, text]),
          ...mission.solutionSteps.map((text, index) => [`step${index + 1}`, text]),
          ...mission.choices?.map((text, index) => [`choice${index + 1}`, text]) ?? [],
        ]
        for (const [surface, text] of surfaces) {
          auditedSurfaceCount += 1
          generatedSurfaces.set(`${template.id}:${variant}:${surface}`, text)
          for (const match of text.matchAll(fractionPattern)) {
            fractionParticleCount += 1
            const [, numerator, , particle] = match
            const finalDigit = numerator.replaceAll(',', '').at(-1) as keyof typeof expectedFractionParticles
            const pair = particle === '은' || particle === '는' ? 'topic'
              : particle === '이' || particle === '가' ? 'subject'
                : particle === '을' || particle === '를' ? 'object'
                  : particle === '과' || particle === '와' ? 'join'
                    : 'direction'
            const expected = expectedFractionParticles[finalDigit][pair]
            if (particle !== expected) {
              fractionDefects.push(`${template.id} v${variant} ${surface}: ${match[0]}→${expected}`)
            }
          }
          if (
            numericConnectiveRegressionTemplateIds.has(template.id)
            && /[2459](?:이므로|이면)/.test(text)
          ) {
            connectiveTemplateIds.add(template.id)
            connectiveSurfaceCount += 1
          }
          expect(text, `${template.id} v${variant} ${surface}`).not.toMatch(/\d(?:가므로|가면)/)
        }
      }
    }

    expect(auditedSurfaceCount).toBe(10_026)
    expect(fractionParticleCount).toBe(144)
    expect(fractionDefects).toEqual([])
    expect(connectiveTemplateIds).toEqual(numericConnectiveRegressionTemplateIds)
    expect(connectiveSurfaceCount).toBe(127)
    expect(historicalDefects).toHaveLength(47)
    expect(new Set(historicalDefects.map(([templateId]) => templateId))).toEqual(
      fractionParticleRegressionTemplateIds,
    )
    for (const [templateId, variant, surface, forbidden, expected] of historicalDefects) {
      const text = generatedSurfaces.get(`${templateId}:${variant}:${surface}`)!
      expect(text, `${templateId} v${variant} ${surface}`).not.toContain(forbidden)
      expect(text, `${templateId} v${variant} ${surface}`).toContain(expected)
    }
  })

  it('gives graph-01 a readable focused scale without exposing its answer as text', () => {
    const template = grade4MissionTemplates.find((item) => item.id === 'g4-graph-01')!

    for (let variant = 1; variant <= 9; variant += 1) {
      const mission = template.build(variant, variant)
      const values = String(mission.visualConfig.valuesCsv).split(',').map(Number)
      const yMin = Number(mission.visualConfig.yMin)
      const yMax = Number(mission.visualConfig.yMax)

      expect(yMin, `variant ${variant}`).toBeLessThanOrEqual(Math.min(...values))
      expect(yMax, `variant ${variant}`).toBeGreaterThanOrEqual(Math.max(...values))
      expect(yMax - yMin, `variant ${variant}`).toBeLessThanOrEqual(25)
      expect(mission.visualConfig.yStep).toBe(5)
      expect(mission.visualConfig.yMinorStep).toBe(1)
      expect(mission.visualConfig.focusGuide).toBe(true)
      expect(mission.visualConfig).not.toHaveProperty('focusValueLabel')
    }
  })

  it('audits every allowed variant with deterministic editorial choice seeds', () => {
    for (const template of grade4MissionTemplates) {
      for (let variant = 1; variant <= 9; variant += 1) {
        const choiceSeed = 2_026_072_600 + variant
        const mission = template.build(variant, choiceSeed)
        const repeated = template.build(variant, choiceSeed)

        expect(mission, `${template.id} variant ${variant}`).toEqual(repeated)
        expect(mission.prompt.trim(), `${template.id} variant ${variant} prompt`).not.toBe('')
        expect(mission.correctAnswer.trim(), `${template.id} variant ${variant} answer`).not.toBe('')
        expect(mission.solutionSteps.length, `${template.id} variant ${variant} solution`).toBeGreaterThan(0)
        expect(mission.solutionSteps.every((step) => step.trim().length > 0)).toBe(true)
        expect(mission.visualModel.trim(), `${template.id} variant ${variant} visual`).not.toBe('')
        if (template.representation !== 'context') {
          expect(mission.visualModel, `${template.id} variant ${variant} visual`).toBe(template.representation)
        }
        expect(Object.keys(mission.visualConfig).length, `${template.id} variant ${variant} visualConfig`).toBeGreaterThan(0)
        if (mission.choices) {
          expect(mission.choices, `${template.id} variant ${variant} choices`).toHaveLength(4)
          expect(new Set(mission.choices).size, `${template.id} variant ${variant} unique choices`).toBe(4)
          expect(
            mission.choices.filter((choice) => choice === mission.correctAnswer),
            `${template.id} variant ${variant} answer occurrence`,
          ).toHaveLength(1)
        }
      }
    }
  })

  it('keeps reviewed wording, grade-level explanations, and graph contexts unambiguous', () => {
    const byId = new Map(grade4MissionTemplates.map((template) => [template.id, template]))

    for (let variant = 1; variant <= 9; variant += 1) {
      const patternClaim = byId.get('g4-pat-09')!.build(variant, variant)
      expect(patternClaim.prompt).toContain('위 수에')

      const rightTriangle = byId.get('g4-tri-03')!.build(variant, variant)
      expect(rightTriangle.solutionSteps.join(' ')).toContain('직각')
      expect(rightTriangle.solutionSteps.join(' ')).not.toContain('²')

      for (const id of ['g4-graph-01', 'g4-graph-07']) {
        const temperature = byId.get(id)!.build(variant, variant)
        const values = String(temperature.visualConfig.valuesCsv).split(',').map(Number)
        expect(Math.max(...values), `${id} variant ${variant} temperature`).toBeLessThanOrEqual(40)
      }

      for (const id of ['g4-graph-03', 'g4-graph-09']) {
        const changingHeight = byId.get(id)!.build(variant, variant)
        expect(String(changingHeight.visualConfig.title)).toContain('물')
      }
    }
  })

  it('records every Grade 4 review exactly once with complete browser evidence', () => {
    const catalog = reviewCore.buildCatalog(
      reviewCore.loadActualSources(process.cwd()).filter(
        (source: { grade: number }) => source.grade === 4,
      ),
    )
    const finalReceipt = JSON.parse(
      readFileSync(
        join(process.cwd(), 'docs/tracking/problem-editorial-review-v1.json'),
        'utf8',
      ),
    )
    const receipt = {
      ...finalReceipt,
      items: finalReceipt.items.filter(
        (item: { reviewId: string }) => item.reviewId.startsWith('4:'),
      ),
    }
    const expectedReviewIds = catalog.items.map((item: { reviewId: string }) => item.reviewId)
    const actualReviewIds = receipt.items.map((item: { reviewId: string }) => item.reviewId)
    const catalogById = new Map(
      catalog.items.map((item: { reviewId: string; contentHash: string }) => (
        [item.reviewId, item]
      ))
    )

    expect(actualReviewIds).toEqual(expectedReviewIds)
    expect(new Set(actualReviewIds).size).toBe(grade4MissionTemplates.length)
    expect(new Set(receipt.items.map((item: { note: string }) => item.note)).size).toBe(
      grade4MissionTemplates.length,
    )
    for (const item of receipt.items) {
      expect(item.contentHash, `${item.reviewId} contentHash`).toBe(
        catalogById.get(item.reviewId)?.contentHash
      )
      const templateId = item.reviewId.replace('4:mission:', '')
      expect(item.status, item.reviewId).toBe('pass')
      expect(item.findingCategories, item.reviewId).toEqual([])
      expect(item.note, item.reviewId).toContain('variants 1..9')
      expect(item.note, item.reviewId).toContain('taskActions=')
      expect(item.note, item.reviewId).toContain('supportTool=')
      expect(item.note, item.reviewId).toContain('Browser evidence remains separate and blocked')
      expect(item.note, item.reviewId).toContain('브라우저 증거 차단 사유를 해소함')
      expect(item.note, item.reviewId).not.toContain('Korean-particle checks passed')
      expect(item.evidence, item.reviewId).toMatchObject({
        editorialRead: true,
        variantAudit: true,
        preAnswer: true,
        hint: true,
        revealed: true,
        mobile: true,
        tablet: true,
        artifacts: ['docs/tracking/problem-visual-browser-evidence-v1.json'],
      })
    }
    for (const templateId of numericConnectiveRegressionTemplateIds) {
      const reviewed = receipt.items.find(
        (item: { reviewId: string }) => item.reviewId === `4:mission:${templateId}`,
      )
      expect(reviewed?.note, templateId).toContain('24-template/127-surface regression')
    }
    for (const templateId of fractionParticleRegressionTemplateIds) {
      const reviewed = receipt.items.find(
        (item: { reviewId: string }) => item.reviewId === `4:mission:${templateId}`,
      )
      expect(reviewed?.note, templateId).toContain('Pre-fix finding: korean_particle')
      expect(reviewed?.note, templateId).toContain('47 incorrect fraction-particle surfaces')
      expect(reviewed?.note, templateId).toContain('Resolution:')
      expect(reviewed?.findingCategories, templateId).toEqual([])
    }
    for (let index = 1; index <= 10; index += 1) {
      const templateId = `g4-frac-${String(index).padStart(2, '0')}`
      const reviewed = receipt.items.find(
        (item: { reviewId: string }) => item.reviewId === `4:mission:${templateId}`,
      )
      expect(reviewed?.note, templateId).toContain('144 fraction-particle occurrences')
    }
    const graphReview = receipt.items.find(
      (item: { reviewId: string }) => item.reviewId === '4:mission:g4-graph-01',
    )
    expect(graphReview?.findingCategories).toEqual([])
    expect(graphReview?.note).toContain('answer-only text/attribute')

    const errors = reviewCore.loadContractModule().validateEditorialLedger(catalog, receipt)
    expect(errors).toEqual([])
  })

  it('keeps every reviewed unit at ten K4/A4/R2 templates', () => {
    const result = validateGrade4MissionBank(ledger)

    expect(result.errors).toEqual([])
    expect(grade4Units).toHaveLength(15)
    expect(grade4Units.map((unit) => unit.id)).toEqual([
      'unit-4-1-large-numbers',
      'unit-4-1-multiplication-division',
      'unit-4-1-arithmetic-estimation',
      'unit-4-2-decimals',
      'unit-4-2-fraction-add-sub',
      'unit-4-2-decimal-add-sub',
      'unit-4-2-patterns',
      'unit-4-2-equality',
      'unit-4-1-perpendicular-parallel',
      'unit-4-1-shape-transformations',
      'unit-4-2-triangles',
      'unit-4-2-quadrilaterals',
      'unit-4-2-polygons',
      'unit-4-1-angle-measurement',
      'unit-4-2-line-graphs',
    ])
    expect(grade4MissionTemplates).toHaveLength(150)
    expect(result.summary).toMatchObject({
      unitCount: 15,
      templateCount: 150,
      knowingCount: 60,
      applyingCount: 60,
      reasoningCount: 30,
      reasoningFamilyCount: 30,
      representationCount: 19,
    })

    for (const unit of grade4Units) {
      expect(unit.releaseStatus).toBe('released')
      const templates = grade4MissionTemplates.filter((item) => item.unitId === unit.id)
      expect(templates).toHaveLength(10)
      expect(templates.filter((item) => item.cognitiveDomain === 'knowing')).toHaveLength(4)
      expect(templates.filter((item) => item.cognitiveDomain === 'applying')).toHaveLength(4)
      expect(templates.filter((item) => item.cognitiveDomain === 'reasoning')).toHaveLength(2)
      expect(new Set(templates.map((item) => item.problemFamily)).size).toBe(10)
      expect(new Set(templates.map((item) => item.representation)).size).toBeGreaterThanOrEqual(2)
    }
  })

  it('builds a deterministic three-item activity with K/A/R coverage', () => {
    const first = getGrade4Activity('unit-4-1-large-numbers', 20260721, 0)
    const repeated = getGrade4Activity('unit-4-1-large-numbers', 20260721, 0)

    expect(first).toEqual(repeated)
    expect(first).toHaveLength(GRADE4_ACTIVITY_ITEM_COUNT)
    expect(first.map((mission) => mission.cognitiveDomain).sort()).toEqual(['applying', 'knowing', 'reasoning'])
    expect(new Set(first.map((mission) => mission.id)).size).toBe(first.length)
  })

  it('varies concrete prompts across activity runs while keeping choice integrity', () => {
    const first = getGrade4MissionBank(20260721)
    const later = getGrade4MissionBank(20260729)
    const changed = first.filter((mission, index) => (
      mission.prompt !== later[index].prompt || mission.correctAnswer !== later[index].correctAnswer
    ))

    expect(changed.length).toBeGreaterThanOrEqual(7)
    for (const mission of first.filter((item) => item.answerType === 'choice')) {
      expect(mission.choices).toHaveLength(4)
      expect(new Set(mission.choices).size).toBe(4)
      expect(mission.choices.filter((choice) => choice === mission.correctAnswer)).toHaveLength(1)
    }
  })

  it('solves every constraint-digit variant and keeps all choices unique and non-negative', () => {
    const template = grade4MissionTemplates.find((item) => item.id === 'g4-big-09')!

    for (let variant = 1; variant <= 9; variant += 1) {
      const mission = template.build(variant, variant)
      const boundary = 460_000 + variant * 1_000
      const validDigits = Array.from({ length: 10 }, (_, digit) => digit)
        .filter((digit) => 405_000 + digit * 10_000 < boundary)
      const expected = Math.max(...validDigits)
      const choices = (mission.choices ?? []).map(Number)

      expect(Number(mission.correctAnswer), `variant ${variant}`).toBe(expected)
      expect(new Set(choices).size, `variant ${variant}`).toBe(4)
      expect(choices.filter((choice) => choice === expected), `variant ${variant}`).toHaveLength(1)
      expect(choices.every((choice) => Number.isInteger(choice) && choice >= 0), `variant ${variant}`).toBe(true)
    }
  })

  it('keeps every two-digit division variant mathematically consistent', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === 'unit-4-1-multiplication-division')
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-div-01', 'g4-div-02', 'g4-div-03', 'g4-div-04', 'g4-div-05',
      'g4-div-06', 'g4-div-07', 'g4-div-08', 'g4-div-09', 'g4-div-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else {
          expect(Number.isSafeInteger(Number(mission.correctAnswer)), `${template.id} variant ${variant}`).toBe(true)
          expect(Number(mission.correctAnswer), `${template.id} variant ${variant}`).toBeGreaterThanOrEqual(0)
        }
      }

      const exact = templates.get('g4-div-01')!.build(variant, variant)
      expect(Number(exact.visualConfig.dividend) % Number(exact.visualConfig.divisor)).toBe(0)
      expect(Number(exact.correctAnswer)).toBe(
        Number(exact.visualConfig.dividend) / Number(exact.visualConfig.divisor),
      )

      for (const id of ['g4-div-02', 'g4-div-03', 'g4-div-07', 'g4-div-10']) {
        const mission = templates.get(id)!.build(variant, variant)
        const dividend = Number(mission.visualConfig.dividend)
        const divisor = Number(mission.visualConfig.divisor)
        expect(divisor).toBeGreaterThanOrEqual(10)
        expect(dividend % divisor).toBeGreaterThan(0)
        expect(dividend % divisor).toBeLessThan(divisor)
      }

      const capacity = templates.get('g4-div-06')!.build(variant, variant)
      expect(Number(capacity.correctAnswer)).toBe(
        Math.ceil(Number(capacity.visualConfig.left) / Number(capacity.visualConfig.right)),
      )

      const inverse = templates.get('g4-div-08')!.build(variant, variant)
      expect(Number(inverse.correctAnswer)).toBe(
        Number(inverse.visualConfig.divisor) * Number(inverse.visualConfig.givenQuotient)
        + Number(inverse.visualConfig.givenRemainder),
      )

      const trial = templates.get('g4-div-10')!.build(variant, variant)
      expect(Number(trial.correctAnswer)).toBe(
        Number(trial.visualConfig.divisor) * Number(trial.visualConfig.trialQuotient)
        - Number(trial.visualConfig.dividend),
      )
    }
  })

  it('derives every arithmetic estimate from the displayed operands', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_ESTIMATION_UNIT_ID)
        .map((item) => [item.id, item]),
    )
    const nearest = (value: number, place: number) => Math.round(value / place) * place

    expect(Array.from(templates.keys())).toEqual([
      'g4-est-01', 'g4-est-02', 'g4-est-03', 'g4-est-04', 'g4-est-05',
      'g4-est-06', 'g4-est-07', 'g4-est-08', 'g4-est-09', 'g4-est-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else {
          expect(Number.isSafeInteger(Number(mission.correctAnswer)), `${template.id} variant ${variant}`).toBe(true)
          expect(Number(mission.correctAnswer), `${template.id} variant ${variant}`).toBeGreaterThanOrEqual(0)
        }
      }

      for (const id of ['g4-est-01', 'g4-est-05']) {
        const addition = templates.get(id)!.build(variant, variant)
        expect(Number(addition.correctAnswer)).toBe(
          nearest(Number(addition.visualConfig.left), 100) + nearest(Number(addition.visualConfig.right), 100),
        )
      }

      const subtraction = templates.get('g4-est-02')!.build(variant, variant)
      expect(Number(subtraction.correctAnswer)).toBe(
        nearest(Number(subtraction.visualConfig.left), 100) - nearest(Number(subtraction.visualConfig.right), 100),
      )

      for (const id of ['g4-est-03', 'g4-est-07']) {
        const multiplication = templates.get(id)!.build(variant, variant)
        expect(Number(multiplication.correctAnswer)).toBe(
          nearest(Number(multiplication.visualConfig.left), 10) * Number(multiplication.visualConfig.right),
        )
      }

      for (const id of ['g4-est-04', 'g4-est-08']) {
        const division = templates.get(id)!.build(variant, variant)
        expect(Number(division.correctAnswer)).toBe(
          nearest(Number(division.visualConfig.left), 100) / Number(division.visualConfig.right),
        )
      }

      const budget = templates.get('g4-est-06')!.build(variant, variant)
      expect(Number(budget.correctAnswer)).toBe(
        nearest(Number(budget.visualConfig.left), 1_000) - nearest(Number(budget.visualConfig.right), 1_000),
      )

      const strategy = templates.get('g4-est-10')!.build(variant, variant)
      const factor = Number(strategy.visualConfig.left)
      const count = Number(strategy.visualConfig.right)
      const tensError = Math.abs(factor * count - nearest(factor, 10) * count)
      const hundredsError = Math.abs(factor * count - nearest(factor, 100) * count)
      expect(tensError).toBeLessThan(hundredsError)
      expect(strategy.correctAnswer).toContain('십 단위')

      const correction = templates.get('g4-est-09')!.build(variant, variant)
      const correctedEstimate = nearest(Number(correction.visualConfig.left), 100)
        + nearest(Number(correction.visualConfig.right), 100)
      expect(correction.correctAnswer).toContain(correctedEstimate.toLocaleString('ko-KR'))

      for (const id of ['g4-est-01', 'g4-est-02', 'g4-est-05', 'g4-est-09']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Number(mission.visualConfig.left) % 100, `${id} left variant ${variant}`).not.toBe(50)
        expect(Number(mission.visualConfig.right) % 100, `${id} right variant ${variant}`).not.toBe(50)
      }
      for (const id of ['g4-est-04', 'g4-est-08']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Number(mission.visualConfig.left) % 100, `${id} variant ${variant}`).not.toBe(50)
      }
      for (const id of ['g4-est-03', 'g4-est-07', 'g4-est-10']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Number(mission.visualConfig.left) % 10, `${id} variant ${variant}`).not.toBe(5)
      }
      expect(Number(budget.visualConfig.left) % 1_000, `g4-est-06 left variant ${variant}`).not.toBe(500)
      expect(Number(budget.visualConfig.right) % 1_000, `g4-est-06 right variant ${variant}`).not.toBe(500)
    }
  })

  it('keeps every two- and three-place decimal variant exact and unambiguous', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_DECIMAL_UNIT_ID)
        .map((item) => [item.id, item]),
    )
    const fromParts = (config: Record<string, string | number | boolean>) => (
      Number(config.ones)
      + Number(config.tenths) / 10
      + Number(config.hundredths) / 100
      + Number(config.thousandths) / 1_000
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-dec-01', 'g4-dec-02', 'g4-dec-03', 'g4-dec-04', 'g4-dec-05',
      'g4-dec-06', 'g4-dec-07', 'g4-dec-08', 'g4-dec-09', 'g4-dec-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else if (template.answerType === 'decimal') {
          expect(mission.correctAnswer, `${template.id} variant ${variant}`).toMatch(/^\d+\.\d+$/)
        } else {
          expect(Number.isSafeInteger(Number(mission.correctAnswer)), `${template.id} variant ${variant}`).toBe(true)
        }
      }

      for (const id of ['g4-dec-01', 'g4-dec-03']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Number(mission.correctAnswer)).toBeCloseTo(fromParts(mission.visualConfig), 10)
      }

      const placeValue = templates.get('g4-dec-02')!.build(variant, variant)
      expect(Number(placeValue.correctAnswer)).toBe(Number(placeValue.visualConfig.hundredths) / 100)

      const comparison = templates.get('g4-dec-04')!.build(variant, variant)
      const expectedSymbol = Number(comparison.visualConfig.left) < Number(comparison.visualConfig.right) ? '<' : '>'
      expect(comparison.correctAnswer).toBe(expectedSymbol)

      const greatest = templates.get('g4-dec-07')!.build(variant, variant)
      const digits = [
        Number(greatest.visualConfig.card1),
        Number(greatest.visualConfig.card2),
        Number(greatest.visualConfig.card3),
      ].sort((a, b) => b - a)
      expect(greatest.correctAnswer).toBe(`0.${digits.join('')}`)

      const missingDigit = templates.get('g4-dec-10')!.build(variant, variant)
      expect(Number(missingDigit.correctAnswer)).toBe(Number(missingDigit.visualConfig.thresholdDigit) - 1)
    }
  })

  it('keeps every like-denominator fraction operation exact and answer-safe', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_FRACTION_ADD_SUB_UNIT_ID)
        .map((item) => [item.id, item]),
    )
    const parse = (value: string) => {
      const match = value.match(/^(?:(\d+) )?(\d+)\/(\d+)$/)
      if (!match) throw new Error(`invalid test fraction ${value}`)
      return {
        numerator: Number(match[1] ?? 0) * Number(match[3]) + Number(match[2]),
        denominator: Number(match[3]),
      }
    }

    expect(Array.from(templates.keys())).toEqual([
      'g4-frac-01', 'g4-frac-02', 'g4-frac-03', 'g4-frac-04', 'g4-frac-05',
      'g4-frac-06', 'g4-frac-07', 'g4-frac-08', 'g4-frac-09', 'g4-frac-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else {
          const parsed = parse(mission.correctAnswer)
          expect(parsed.denominator, `${template.id} variant ${variant}`).toBeGreaterThan(0)
          expect(parsed.numerator, `${template.id} variant ${variant}`).toBeGreaterThan(0)
        }
      }

      for (const id of ['g4-frac-01', 'g4-frac-03', 'g4-frac-05']) {
        const mission = templates.get(id)!.build(variant, variant)
        const answer = parse(mission.correctAnswer)
        expect(answer.denominator).toBe(Number(mission.visualConfig.denominator))
        expect(answer.numerator).toBe(
          Number(mission.visualConfig.firstNumerator) + Number(mission.visualConfig.secondNumerator),
        )
      }

      for (const id of ['g4-frac-02', 'g4-frac-04', 'g4-frac-06']) {
        const mission = templates.get(id)!.build(variant, variant)
        const answer = parse(mission.correctAnswer)
        expect(answer.denominator).toBe(Number(mission.visualConfig.denominator))
        expect(answer.numerator).toBe(
          Number(mission.visualConfig.firstNumerator) - Number(mission.visualConfig.secondNumerator),
        )
      }

      const missing = templates.get('g4-frac-07')!.build(variant, variant)
      expect(parse(missing.correctAnswer).numerator).toBe(
        Number(missing.visualConfig.totalNumerator) - Number(missing.visualConfig.firstNumerator),
      )
      expect(missing.visualConfig).not.toHaveProperty('resultNumerator')
    }
  })

  it('derives every hundredths decimal operation from aligned integer place values', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_DECIMAL_ADD_SUB_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-dop-01', 'g4-dop-02', 'g4-dop-03', 'g4-dop-04', 'g4-dop-05',
      'g4-dop-06', 'g4-dop-07', 'g4-dop-08', 'g4-dop-09', 'g4-dop-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else {
          expect(mission.correctAnswer, `${template.id} variant ${variant}`).toMatch(/^\d+\.\d{2}$/)
        }
        expect(mission.visualConfig).not.toHaveProperty('resultScaled')
      }

      for (const id of ['g4-dop-01', 'g4-dop-02', 'g4-dop-05']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Math.round(Number(mission.correctAnswer) * 100)).toBe(
          Number(mission.visualConfig.leftScaled) + Number(mission.visualConfig.rightScaled),
        )
      }
      for (const id of ['g4-dop-03', 'g4-dop-04', 'g4-dop-06']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Math.round(Number(mission.correctAnswer) * 100)).toBe(
          Number(mission.visualConfig.leftScaled) - Number(mission.visualConfig.rightScaled),
        )
      }
      const missing = templates.get('g4-dop-07')!.build(variant, variant)
      expect(Math.round(Number(missing.correctAnswer) * 100)).toBe(
        Number(missing.visualConfig.totalScaled) - Number(missing.visualConfig.leftScaled),
      )
    }
  })

  it('derives every missing pattern value from the visible sequence, table, or calculation rows', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_PATTERNS_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-pat-01', 'g4-pat-02', 'g4-pat-03', 'g4-pat-04', 'g4-pat-05',
      'g4-pat-06', 'g4-pat-07', 'g4-pat-08', 'g4-pat-09', 'g4-pat-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else {
          expect(mission.correctAnswer, `${template.id} variant ${variant}`).toMatch(/^\d+$/)
        }
        expect(mission.visualConfig).not.toHaveProperty('answer')
        expect(mission.visualConfig).not.toHaveProperty('result')
        expect(mission.visualConfig).not.toHaveProperty('targetValue')
      }

      const sequence = templates.get('g4-pat-01')!.build(variant, variant)
      expect(Number(sequence.correctAnswer)).toBe(
        Number(sequence.visualConfig.value4)
        + (Number(sequence.visualConfig.value2) - Number(sequence.visualConfig.value1)),
      )

      const correspondence = templates.get('g4-pat-02')!.build(variant, variant)
      const inputStep = Number(correspondence.visualConfig.input2) - Number(correspondence.visualConfig.input1)
      const outputStep = Number(correspondence.visualConfig.output2) - Number(correspondence.visualConfig.output1)
      expect(Number(correspondence.correctAnswer)).toBe(
        Number(correspondence.visualConfig.output3) + outputStep / inputStep,
      )

      const stage = templates.get('g4-pat-05')!.build(variant, variant)
      const stageStep = Number(stage.visualConfig.value2) - Number(stage.visualConfig.value1)
      expect(Number(stage.correctAnswer)).toBe(
        Number(stage.visualConfig.value1)
        + (Number(stage.visualConfig.requestedPosition) - 1) * stageStep,
      )

      const calculation = templates.get('g4-pat-07')!.build(variant, variant)
      expect(Number(calculation.correctAnswer)).toBe(
        Number(calculation.visualConfig.factor) * Number(calculation.visualConfig.requestedPosition),
      )
    }
  })

  it('derives every missing equality quantity from the two displayed sides', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_EQUALITY_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-eq-01', 'g4-eq-02', 'g4-eq-03', 'g4-eq-04', 'g4-eq-05',
      'g4-eq-06', 'g4-eq-07', 'g4-eq-08', 'g4-eq-09', 'g4-eq-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else {
          expect(mission.correctAnswer, `${template.id} variant ${variant}`).toMatch(/^\d+$/)
        }
        expect(mission.visualConfig).not.toHaveProperty('missingValue')
        expect(mission.visualConfig).not.toHaveProperty('result')
      }

      const missingAddend = templates.get('g4-eq-01')!.build(variant, variant)
      expect(Number(missingAddend.correctAnswer)).toBe(
        Number(missingAddend.visualConfig.rightTotal) - Number(missingAddend.visualConfig.leftKnown),
      )

      const missingMinuend = templates.get('g4-eq-02')!.build(variant, variant)
      expect(Number(missingMinuend.correctAnswer)).toBe(
        Number(missingMinuend.visualConfig.rightTotal) + Number(missingMinuend.visualConfig.leftKnown),
      )

      const balancedBags = templates.get('g4-eq-05')!.build(variant, variant)
      expect(Number(balancedBags.correctAnswer)).toBe(
        Number(balancedBags.visualConfig.leftTotal) - Number(balancedBags.visualConfig.rightKnown),
      )
    }
  })

  it('keeps every line relationship consistent with its shared angle model', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_PERPENDICULAR_PARALLEL_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-line-01', 'g4-line-02', 'g4-line-03', 'g4-line-04', 'g4-line-05',
      'g4-line-06', 'g4-line-07', 'g4-line-08', 'g4-line-09', 'g4-line-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        }
        expect(mission.visualConfig).not.toHaveProperty('answer')
        expect(mission.visualConfig).not.toHaveProperty('correctPair')
      }

      for (const id of ['g4-line-01', 'g4-line-05', 'g4-line-08']) {
        const mission = templates.get(id)!.build(variant, variant)
        const difference = Math.abs(Number(mission.visualConfig.angleA) - Number(mission.visualConfig.angleB)) % 180
        expect(difference).toBe(90)
      }
      for (const id of ['g4-line-02', 'g4-line-06', 'g4-line-07']) {
        const mission = templates.get(id)!.build(variant, variant)
        const difference = Math.abs(Number(mission.visualConfig.angleA) - Number(mission.visualConfig.angleB)) % 180
        expect(difference).toBe(0)
      }
    }
  })

  it('derives every moved point and shape from one transformation model', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_SHAPE_TRANSFORMATIONS_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-move-01', 'g4-move-02', 'g4-move-03', 'g4-move-04', 'g4-move-05',
      'g4-move-06', 'g4-move-07', 'g4-move-08', 'g4-move-09', 'g4-move-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        }
        expect(mission.visualConfig).not.toHaveProperty('answer')
        expect(mission.visualConfig).not.toHaveProperty('endX')
        expect(mission.visualConfig).not.toHaveProperty('endY')
      }

      const slide = templates.get('g4-move-05')!.build(variant, variant)
      expect(slide.correctAnswer).toBe(
        `(${Number(slide.visualConfig.startX) + Number(slide.visualConfig.deltaX)}, ${Number(slide.visualConfig.startY) + Number(slide.visualConfig.deltaY)})`,
      )

      const flip = templates.get('g4-move-06')!.build(variant, variant)
      expect(flip.correctAnswer).toBe(
        `(${2 * Number(flip.visualConfig.axisX) - Number(flip.visualConfig.startX)}, ${Number(flip.visualConfig.startY)})`,
      )

      const rotation = templates.get('g4-move-07')!.build(variant, variant)
      const dx = Number(rotation.visualConfig.startX) - Number(rotation.visualConfig.centerX)
      const dy = Number(rotation.visualConfig.startY) - Number(rotation.visualConfig.centerY)
      expect(rotation.correctAnswer).toBe(
        `(${Number(rotation.visualConfig.centerX) + dy}, ${Number(rotation.visualConfig.centerY) - dx})`,
      )
    }
  })

  it('keeps every triangle classification consistent with its three side lengths', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_TRIANGLES_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-tri-01', 'g4-tri-02', 'g4-tri-03', 'g4-tri-04', 'g4-tri-05',
      'g4-tri-06', 'g4-tri-07', 'g4-tri-08', 'g4-tri-09', 'g4-tri-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        const sides = ['sideA', 'sideB', 'sideC'].map((key) => Number(mission.visualConfig[key])).sort((a, b) => a - b)
        expect(sides[0] + sides[1], `${template.id} variant ${variant}`).toBeGreaterThan(sides[2])
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        }
      }

      const equilateral = templates.get('g4-tri-01')!.build(variant, variant)
      expect(new Set(['sideA', 'sideB', 'sideC'].map((key) => equilateral.visualConfig[key])).size).toBe(1)

      const isosceles = templates.get('g4-tri-02')!.build(variant, variant)
      expect(Number(isosceles.visualConfig.sideA)).toBe(Number(isosceles.visualConfig.sideB))

      const right = templates.get('g4-tri-03')!.build(variant, variant)
      const rightSides = ['sideA', 'sideB', 'sideC'].map((key) => Number(right.visualConfig[key])).sort((a, b) => a - b)
      expect(rightSides[0] ** 2 + rightSides[1] ** 2).toBeCloseTo(rightSides[2] ** 2)

      const obtuse = templates.get('g4-tri-04')!.build(variant, variant)
      const obtuseSides = ['sideA', 'sideB', 'sideC'].map((key) => Number(obtuse.visualConfig[key])).sort((a, b) => a - b)
      expect(obtuseSides[0] ** 2 + obtuseSides[1] ** 2).toBeLessThan(obtuseSides[2] ** 2)
    }
  })

  it('derives every quadrilateral classification from its displayed properties', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_QUADRILATERALS_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-quad-01', 'g4-quad-02', 'g4-quad-03', 'g4-quad-04', 'g4-quad-05',
      'g4-quad-06', 'g4-quad-07', 'g4-quad-08', 'g4-quad-09', 'g4-quad-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        }
      }

      const rectangle = templates.get('g4-quad-01')!.build(variant, variant)
      expect(rectangle.visualConfig).toMatchObject({ shapeType: 'rectangle', rightAngles: 4, parallelPairs: 2 })
      expect(Number(rectangle.visualConfig.width)).not.toBe(Number(rectangle.visualConfig.height))

      const square = templates.get('g4-quad-02')!.build(variant, variant)
      expect(square.visualConfig).toMatchObject({ shapeType: 'square', rightAngles: 4, parallelPairs: 2, equalSides: 4 })
      expect(Number(square.visualConfig.width)).toBe(Number(square.visualConfig.height))

      const trapezoid = templates.get('g4-quad-03')!.build(variant, variant)
      expect(trapezoid.visualConfig).toMatchObject({ shapeType: 'trapezoid', parallelPairs: 1 })

      const parallelogram = templates.get('g4-quad-04')!.build(variant, variant)
      expect(parallelogram.visualConfig).toMatchObject({ shapeType: 'parallelogram', parallelPairs: 2 })

      const rhombus = templates.get('g4-quad-06')!.build(variant, variant)
      expect(rhombus.visualConfig).toMatchObject({ shapeType: 'rhombus', equalSides: 4, parallelPairs: 2 })

      const oneRightAngle = templates.get('g4-quad-08')!.build(variant, variant)
      expect(oneRightAngle.visualConfig).toMatchObject({ shapeType: 'rectangle', rightAngles: 1, parallelPairs: 2 })
    }
  })

  it('derives polygon names, diagonals, and filling counts from one geometry model', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_POLYGONS_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-poly-01', 'g4-poly-02', 'g4-poly-03', 'g4-poly-04', 'g4-poly-05',
      'g4-poly-06', 'g4-poly-07', 'g4-poly-08', 'g4-poly-09', 'g4-poly-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        }
        expect(mission.visualConfig).not.toHaveProperty('answer')
        expect(mission.visualConfig).not.toHaveProperty('result')
        expect(mission.visualConfig).not.toHaveProperty('tileCount')
      }

      const diagonal = templates.get('g4-poly-04')!.build(variant, variant)
      expect(diagonal.correctAnswer).toBe(`${Number(diagonal.visualConfig.sideCount) - 3}개`)

      const regularPerimeter = templates.get('g4-poly-05')!.build(variant, variant)
      expect(Number(regularPerimeter.correctAnswer)).toBe(
        Number(regularPerimeter.visualConfig.sideCount) * Number(regularPerimeter.visualConfig.sideLength),
      )

      const squareFill = templates.get('g4-poly-07')!.build(variant, variant)
      expect(squareFill.correctAnswer).toBe(
        `${Number(squareFill.visualConfig.rows) * Number(squareFill.visualConfig.columns)}개`,
      )

      const equalSidesOnly = templates.get('g4-poly-09')!.build(variant, variant)
      expect(equalSidesOnly.visualConfig).toMatchObject({ sideCount: 4, regular: false, equalSides: true })

      const gap = templates.get('g4-poly-10')!.build(variant, variant)
      expect(gap.visualConfig).toMatchObject({ tileShape: 'pentagon', columns: 3, hasGap: true })
    }
  })

  it('derives angle measures and polygon vertices from the same angle data', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_ANGLE_MEASUREMENT_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-ang-01', 'g4-ang-02', 'g4-ang-03', 'g4-ang-04', 'g4-ang-05',
      'g4-ang-06', 'g4-ang-07', 'g4-ang-08', 'g4-ang-09', 'g4-ang-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        }
        expect(mission.visualConfig).not.toHaveProperty('answer')
        expect(mission.visualConfig).not.toHaveProperty('missingAngle')
      }

      const measured = templates.get('g4-ang-01')!.build(variant, variant)
      expect(measured.correctAnswer).toBe(`${measured.visualConfig.angle}°`)

      const triangle = templates.get('g4-ang-05')!.build(variant, variant)
      expect(Number(triangle.correctAnswer)).toBe(
        180 - Number(triangle.visualConfig.angleA) - Number(triangle.visualConfig.angleB),
      )

      const quadrilateral = templates.get('g4-ang-06')!.build(variant, variant)
      expect(Number(quadrilateral.correctAnswer)).toBe(
        360
          - Number(quadrilateral.visualConfig.angleA)
          - Number(quadrilateral.visualConfig.angleB)
          - Number(quadrilateral.visualConfig.angleC),
      )

      const reversedScale = templates.get('g4-ang-09')!.build(variant, variant)
      expect(Number(reversedScale.visualConfig.wrongReading)).toBe(180 - Number(reversedScale.visualConfig.angle))
      expect(reversedScale.visualConfig).not.toHaveProperty('correctReading')
    }
  })

  it('derives line-graph answers, scales, and deliberate errors from one data model', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_LINE_GRAPHS_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-graph-01', 'g4-graph-02', 'g4-graph-03', 'g4-graph-04', 'g4-graph-05',
      'g4-graph-06', 'g4-graph-07', 'g4-graph-08', 'g4-graph-09', 'g4-graph-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        }
        expect(mission.visualConfig).not.toHaveProperty('answer')
        expect(mission.visualConfig).not.toHaveProperty('result')
        expect(mission.visualConfig).not.toHaveProperty('target')
        if (mission.visualModel === 'line-graph-model') {
          const values = String(mission.visualConfig.valuesCsv).split(',').map(Number)
          const yMin = Number(mission.visualConfig.yMin)
          const yMax = Number(mission.visualConfig.yMax)
          expect(values.every((value) => value >= yMin && value <= yMax), `${template.id} variant ${variant}`).toBe(true)
          if (mission.visualConfig.yMinorStep !== undefined) {
            const minorStep = Number(mission.visualConfig.yMinorStep)
            expect(values.every((value) => (value - yMin) % minorStep === 0), `${template.id} variant ${variant}`).toBe(true)
          }
        }
      }

      const readPoint = templates.get('g4-graph-01')!.build(variant, variant)
      const readValues = String(readPoint.visualConfig.valuesCsv).split(',').map(Number)
      expect(Number(readPoint.correctAnswer)).toBe(readValues[Number(readPoint.visualConfig.focusIndex)])

      const largestChange = templates.get('g4-graph-02')!.build(variant, variant)
      const changeLabels = String(largestChange.visualConfig.labelsCsv).split(',')
      const changeValues = String(largestChange.visualConfig.valuesCsv).split(',').map(Number)
      const differences = changeValues.slice(1).map((value, index) => Math.abs(value - changeValues[index]))
      const largestIndex = differences.indexOf(Math.max(...differences))
      expect(largestChange.correctAnswer).toBe(`${changeLabels[largestIndex]}과 ${changeLabels[largestIndex + 1]} 사이`)

      const range = templates.get('g4-graph-06')!.build(variant, variant)
      const rangeValues = String(range.visualConfig.valuesCsv).split(',').map(Number)
      expect(Number(range.correctAnswer)).toBe(Math.max(...rangeValues) - Math.min(...rangeValues))

      const missingTable = templates.get('g4-graph-08')!.build(variant, variant)
      const tableValues = String(missingTable.visualConfig.valuesCsv).split(',').map(Number)
      expect(Number(missingTable.correctAnswer)).toBe(tableValues[Number(missingTable.visualConfig.hiddenIndex)])

      const plottedError = templates.get('g4-graph-09')!.build(variant, variant)
      const sourceValues = String(plottedError.visualConfig.tableValuesCsv).split(',').map(Number)
      const plottedValues = String(plottedError.visualConfig.valuesCsv).split(',').map(Number)
      const mismatchIndices = sourceValues.flatMap((value, index) => value === plottedValues[index] ? [] : [index])
      expect(mismatchIndices).toHaveLength(1)
      expect(plottedError.correctAnswer).toBe(String(plottedError.visualConfig.labelsCsv).split(',')[mismatchIndices[0]])
    }
  })

  it('rejects a Grade 4 unit whose ledger entry is still planned', () => {
    const plannedLedger = {
      ...ledger,
      allocations: ledger.allocations.map((allocation: { standardCode: string }) => (
        allocation.standardCode === '[4수01-07]'
          ? { ...allocation, reviewStatus: 'curriculum-reviewed', coverageStatus: 'planned', existingContentRefs: [] }
          : allocation
      )),
    }

    expect(validateGrade4MissionBank(plannedLedger).errors).toContain(
      'unit-4-1-multiplication-division: ledger release mismatch for [4수01-07]',
    )
  })
})
