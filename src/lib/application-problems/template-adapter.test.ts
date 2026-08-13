import { describe, expect, it } from 'vitest'
import type { Problem } from '../types'
import type { GeneratedApplicationProblemV1 } from './contracts'
import {
  adaptGeneratedApplicationProblemToPractice,
  hasApplicationProblemSource,
} from './template-adapter'

function generatedProblem(): GeneratedApplicationProblemV1 {
  return {
    schemaVersion: 'generated-application-problem-v1',
    instanceId: 'g5-area-composite-inverse@3:42:2',
    familyId: 'g5-area-composite-inverse',
    generatorVersion: 3,
    packId: 'pack-unit-5-1-perimeter-area',
    packVersion: 2,
    seed: 42,
    variantIndex: 2,
    curriculumCodes: ['[5수03-13]'],
    params: {
      rectangle: { width: 7, height: 4 },
      squareSide: 10,
      attachment: ['left', { offset: 2 }],
    },
    prompt: '겹치지 않게 붙인 두 도형의 넓이로 직사각형의 너비를 구하세요.',
    answer: { format: 'number', normalized: '7' },
    solutionSteps: ['전체 넓이에서 정사각형의 넓이를 뺍니다.', '남은 넓이를 높이로 나눕니다.'],
    hintSteps: ['두 도형의 넓이를 따로 생각해 보세요.'],
    misconceptionRefs: ['area-perimeter-confusion', 'inverse-operation-order'],
    visual: {
      role: 'required',
      semantics: 'quantitative',
      generatorId: 'composite-area-diagram-v1',
      answerCritical: true,
      generatorVersion: 4,
      mathModel: {
        kind: 'rectangle-square-composite',
        rectangle: { width: 7, height: 4 },
        square: { side: 10 },
        boundary: [
          [0, 0],
          [17, 0],
          [17, 10],
        ],
      },
    },
  }
}

const placement = {
  index: 4,
  templateId: 'application-g5-area-composite-inverse-v1',
  setId: 'B' as const,
  difficulty: 2 as const,
}

describe('adaptGeneratedApplicationProblemToPractice', () => {
  it('preserves the complete canonical application snapshot through JSON storage', () => {
    const generated = generatedProblem()
    const adapted = adaptGeneratedApplicationProblemToPractice({
      problem: generated,
      placement,
      mapParams: () => ({ rectangleWidth: 7, rectangleHeight: 4, squareSide: 10 }),
    })

    const restored = JSON.parse(JSON.stringify(adapted)) as typeof adapted

    expect({
      params: restored.applicationParams,
      misconceptionRefs: restored.applicationMisconceptionRefs,
      visual: restored.applicationVisual,
    }).toEqual({
      params: generated.params,
      misconceptionRefs: generated.misconceptionRefs,
      visual: generated.visual,
    })
    expect(restored.applicationVisual).toMatchObject({
      role: 'required',
      semantics: 'quantitative',
      generatorVersion: 4,
      mathModel: generated.visual.mathModel,
    })
  })

  it('isolates the saved snapshot from later input and callback-output mutation', () => {
    const generated = generatedProblem()
    const mappedParams = { rectangleWidth: 7, rectangleHeight: 4, squareSide: 10 }
    const mappedVisual = {
      type: 'basic_shape' as const,
      props: {
        shape: 'rectangle' as const,
        width: 7,
        height: 4,
        unit: 'cm' as const,
      },
    }
    const adapted = adaptGeneratedApplicationProblemToPractice({
      problem: generated,
      placement,
      mapParams: () => mappedParams,
      mapVisual: () => mappedVisual,
    })

    const generatedRectangle = generated.params.rectangle as { width: number }
    const generatedMathModel = generated.visual.mathModel as {
      rectangle: { width: number }
    }
    generatedRectangle.width = 99
    generated.misconceptionRefs[0] = 'mutated-misconception'
    generatedMathModel.rectangle.width = 99
    mappedParams.rectangleWidth = 99
    mappedVisual.props.width = 99

    expect(adapted.applicationParams).toEqual({
      attachment: ['left', { offset: 2 }],
      rectangle: { height: 4, width: 7 },
      squareSide: 10,
    })
    expect(adapted.applicationMisconceptionRefs).toEqual([
      'area-perimeter-confusion',
      'inverse-operation-order',
    ])
    expect(adapted.applicationVisual.mathModel).toMatchObject({
      rectangle: { height: 4, width: 7 },
    })
    expect(adapted.params.rectangleWidth).toBe(7)
    expect(adapted.visual).toMatchObject({ props: { width: 7 } })
  })

  it('keeps legacy Problem snapshots valid and unchanged without application fields', () => {
    const legacy: Problem = {
      index: 0,
      templateId: 'legacy-template',
      setId: 'A',
      params: { n: 3 },
      prompt: '3을 쓰세요.',
      type: 'number',
      correctAnswer: '3',
      solutionSteps: ['3입니다.'],
    }
    const before = JSON.stringify(legacy)

    expect(hasApplicationProblemSource(legacy)).toBe(false)
    expect(JSON.stringify(legacy)).toBe(before)
    expect(legacy).not.toHaveProperty('applicationParams')
    expect(legacy).not.toHaveProperty('applicationMisconceptionRefs')
    expect(legacy).not.toHaveProperty('applicationVisual')
  })
})
