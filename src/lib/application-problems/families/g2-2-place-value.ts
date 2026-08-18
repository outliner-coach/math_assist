import type { JsonValue } from '../contracts'
import {
  createG2FiniteDraftFamily,
  type G2FiniteDraftFamilyDefinition,
} from './g2-2-content-core'

const PACK_ID = 'pack-g2-2-place-value'
const UNIT_ID = 'g2-2-place-value'
const PLACE_VALUE = 'g2-2-place-value-place-value'
const NUMBER_COMPARISON = 'g2-2-place-value-number-comparison'

function n(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be a safe integer`)
  return value as number
}

function greatestPermutationBelow(digits: number[], limit: number): number {
  const values = new Set<number>()
  const visit = (prefix: number[], remaining: number[]) => {
    if (remaining.length === 0) {
      const value = Number(prefix.join(''))
      if (value < limit) values.add(value)
      return
    }
    remaining.forEach((digit, index) => visit(
      [...prefix, digit],
      remaining.filter((_, candidate) => candidate !== index),
    ))
  }
  visit([], digits)
  const result = Math.max(...Array.from(values))
  if (!Number.isSafeInteger(result)) throw new RangeError('no card arrangement is below the limit')
  return result
}

const definitions: readonly G2FiniteDraftFamilyDefinition[] = [
  {
    familyId: 'g2-2-place-value-shop-order',
    packId: PACK_ID,
    packVersion: 1,
    unitId: UNIT_ID,
    conceptIds: [PLACE_VALUE, NUMBER_COMPARISON],
    primaryStandard: '[2수01-03]',
    connectedStandards: ['[2수01-02]'],
    cognitiveDomain: 'applying',
    reasoningPattern: 'multi_step',
    representations: ['text', 'diagram'],
    modelId: 'g2-place-value-price-order-v1',
    unknownRole: 'greatest-price',
    requiredStudentActions: ['interpret_context', 'choose_model', 'compare_strategies'],
    misconceptionRefs: ['place-value-ignore-highest-place'],
    visualSurface: 'diagram',
    visualValueKeys: ['first', 'second', 'third'],
    cases: [
      { first: 3280, second: 3820, third: 2803 },
      { first: 4912, second: 4192, third: 4921 },
    ],
    render: (params) => {
      const values = [n(params, 'first'), n(params, 'second'), n(params, 'third')]
      const answer = Math.max(...values)
      return {
        prompt: `가격표가 ${values.join(', ')}원이에요. 가장 비싼 물건의 가격은 얼마일까요?`,
        answer: { format: 'number', normalized: String(answer) },
        solutionSteps: ['천의 자리부터 차례로 비교해요.', `가장 큰 수는 ${answer}이에요.`],
        hintSteps: ['천의 자리를 먼저 보세요.', '같으면 백의 자리로 옮겨 보세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-place-value-hidden-hundreds',
    packId: PACK_ID,
    packVersion: 1,
    unitId: UNIT_ID,
    conceptIds: [PLACE_VALUE],
    primaryStandard: '[2수01-02]',
    connectedStandards: ['[2수01-03]'],
    cognitiveDomain: 'reasoning',
    reasoningPattern: 'inverse',
    representations: ['text', 'equation', 'diagram'],
    modelId: 'g2-place-value-hidden-hundreds-v1',
    unknownRole: 'smallest-hundreds-digit',
    requiredStudentActions: ['interpret_context', 'infer_missing_value', 'test_constraint'],
    misconceptionRefs: ['place-value-digit-is-value'],
    visualSurface: 'diagram',
    visualValueKeys: ['thousands', 'threshold-hundreds', 'tens'],
    cases: [
      { thousands: 3, 'threshold-hundreds': 4, tens: 2, ones: 5 },
      { thousands: 6, 'threshold-hundreds': 7, tens: 8, ones: 1 },
    ],
    render: (params) => {
      const thousands = n(params, 'thousands')
      const threshold = n(params, 'threshold-hundreds')
      const tens = n(params, 'tens')
      const ones = n(params, 'ones')
      const answer = threshold + 1
      return {
        prompt: `${thousands}□${tens}${ones}이 ${thousands}${threshold}${tens}${ones}보다 크도록 할 때 □에 넣을 수 있는 가장 작은 수는 무엇일까요?`,
        answer: { format: 'number', normalized: String(answer) },
        solutionSteps: ['천의 자리는 같아요.', `백의 자리에는 ${threshold}보다 큰 가장 작은 수 ${answer}을 넣어요.`],
        hintSteps: ['같은 천의 자리는 지나가요.', '백의 자리끼리 비교하세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-place-value-claim-check',
    packId: PACK_ID,
    packVersion: 1,
    unitId: UNIT_ID,
    conceptIds: [NUMBER_COMPARISON],
    primaryStandard: '[2수01-03]',
    connectedStandards: ['[2수01-02]'],
    cognitiveDomain: 'reasoning',
    reasoningPattern: 'error_analysis',
    representations: ['text', 'diagram'],
    modelId: 'g2-place-value-comparison-claim-v1',
    unknownRole: 'valid-comparison-claim',
    requiredStudentActions: ['compare_strategies', 'evaluate_claim', 'verify_result'],
    misconceptionRefs: ['place-value-ignore-highest-place'],
    visualSurface: 'diagram',
    visualValueKeys: ['first', 'second'],
    cases: [
      { first: 3987, second: 4012 },
      { first: 5729, second: 5801 },
    ],
    render: (params) => {
      const first = n(params, 'first')
      const second = n(params, 'second')
      const choices = ['가', '나']
      const answer = first > second ? '가' : '나'
      return {
        prompt: `가: ${first}이 더 커. 나: ${second}이 더 커. 큰 자리부터 비교했을 때 누구 말이 맞나요?`,
        answer: { format: 'choice', normalized: answer },
        choices,
        correctChoiceIndex: choices.indexOf(answer),
        solutionSteps: ['천의 자리부터 비교해요.', `${Math.max(first, second)}이 더 크므로 ${answer}가 맞아요.`],
        hintSteps: ['일의 자리만 보지 마세요.', '가장 큰 자리부터 확인하세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-place-value-card-constraint',
    packId: PACK_ID,
    packVersion: 1,
    unitId: UNIT_ID,
    conceptIds: [PLACE_VALUE, NUMBER_COMPARISON],
    primaryStandard: '[2수01-03]',
    connectedStandards: ['[2수01-02]'],
    cognitiveDomain: 'reasoning',
    reasoningPattern: 'model_and_check',
    representations: ['text', 'diagram'],
    modelId: 'g2-place-value-digit-card-constraint-v1',
    unknownRole: 'greatest-valid-arrangement',
    requiredStudentActions: ['choose_model', 'test_constraint', 'verify_result'],
    misconceptionRefs: ['place-value-digit-is-value', 'place-value-ignore-highest-place'],
    visualSurface: 'diagram',
    visualValueKeys: ['d1', 'd2', 'd3', 'd4', 'limit'],
    cases: [
      { d1: 1, d2: 3, d3: 5, d4: 7, limit: 7000 },
      { d1: 2, d2: 4, d3: 6, d4: 8, limit: 7000 },
    ],
    render: (params) => {
      const digits = ['d1', 'd2', 'd3', 'd4'].map((key) => n(params, key))
      const limit = n(params, 'limit')
      const answer = greatestPermutationBelow(digits, limit)
      return {
        prompt: `수 카드 ${digits.join(', ')}을 한 번씩 써서 ${limit}보다 작은 가장 큰 네 자리 수를 만드세요.`,
        answer: { format: 'number', normalized: String(answer) },
        solutionSteps: [`${limit}보다 작도록 천의 자리를 고릅니다.`, `남은 카드는 큰 수부터 놓아 ${answer}을 만들어요.`],
        hintSteps: ['먼저 천의 자리 조건을 확인하세요.', '남은 자리는 큰 카드부터 놓아 보세요.'],
      }
    },
  },
]

export const G2_2_PLACE_VALUE_DRAFT_FAMILIES = Object.freeze(
  definitions.map(createG2FiniteDraftFamily),
)
