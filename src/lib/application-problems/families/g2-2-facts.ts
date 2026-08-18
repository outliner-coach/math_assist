import type { JsonValue } from '../contracts'
import { createG2FiniteDraftFamily, type G2FiniteDraftFamilyDefinition } from './g2-2-content-core'

const PACK_ID = 'pack-g2-2-facts'
const UNIT_ID = 'g2-2-facts'
const CONCEPT = 'g2-2-facts-multiplication-facts'

function n(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value) || (value as number) <= 0) throw new TypeError(`${key} must be positive`)
  return value as number
}

const definitions: readonly G2FiniteDraftFamilyDefinition[] = [
  {
    familyId: 'g2-2-facts-two-trays', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수01-11]', connectedStandards: [],
    cognitiveDomain: 'applying', reasoningPattern: 'multi_step',
    representations: ['text', 'diagram'], modelId: 'g2-facts-combined-equal-groups-v1',
    unknownRole: 'combined-object-count',
    requiredStudentActions: ['interpret_context', 'choose_model', 'execute_calculation'],
    misconceptionRefs: ['facts-add-factors'], visualSurface: 'diagram',
    visualValueKeys: ['first-groups', 'second-groups', 'each'],
    cases: [{ 'first-groups': 2, 'second-groups': 3, each: 4 }, { 'first-groups': 4, 'second-groups': 2, each: 7 }],
    render: (params) => {
      const first = n(params, 'first-groups'), second = n(params, 'second-groups'), each = n(params, 'each')
      const answer = (first + second) * each
      return {
        prompt: `쿠키가 한 접시에 ${each}개씩 있어요. 접시 ${first}개와 ${second}개에 있는 쿠키는 모두 몇 개일까요?`,
        answer: { format: 'number', normalized: String(answer) },
        solutionSteps: [`접시는 모두 ${first + second}개예요.`, `${first + second}×${each}=${answer}`],
        hintSteps: ['접시 수를 먼저 모아 보세요.', '같은 수씩 있는 묶음으로 나타내세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-facts-missing-groups', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수01-11]', connectedStandards: [],
    cognitiveDomain: 'reasoning', reasoningPattern: 'inverse',
    representations: ['text', 'equation', 'table'], modelId: 'g2-facts-missing-equal-groups-v1',
    unknownRole: 'missing-group-count',
    requiredStudentActions: ['interpret_context', 'infer_missing_value', 'verify_result'],
    misconceptionRefs: ['facts-add-factors'], visualSurface: 'table', visualValueKeys: ['total', 'each'],
    cases: [{ total: 24, each: 6 }, { total: 56, each: 8 }],
    render: (params) => {
      const total = n(params, 'total'), each = n(params, 'each'), answer = total / each
      return {
        prompt: `구슬 ${total}개를 한 줄에 ${each}개씩 놓으면 몇 줄이 될까요?`,
        answer: { format: 'number', normalized: String(answer) },
        solutionSteps: [`${each}씩 몇 묶음이면 ${total}인지 구해요.`, `${each}×${answer}=${total}`],
        hintSteps: ['곱해서 전체가 되는 수를 찾으세요.', '구구표로 다시 확인하세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-facts-product-error', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수01-11]', connectedStandards: [],
    cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis',
    representations: ['text', 'table'], modelId: 'g2-facts-product-claim-v1',
    unknownRole: 'valid-product-claim',
    requiredStudentActions: ['compare_strategies', 'evaluate_claim', 'verify_result'],
    misconceptionRefs: ['facts-add-factors'], visualSurface: 'table', visualValueKeys: ['dan', 'factor'],
    cases: [{ dan: 4, factor: 7 }, { dan: 8, factor: 6 }],
    render: (params) => {
      const dan = n(params, 'dan'), factor = n(params, 'factor'), product = dan * factor
      const choices = ['가', '나']
      return {
        prompt: `가: ${dan}×${factor}=${dan + factor}. 나: ${dan}×${factor}=${product}. 누구의 계산이 맞나요?`,
        answer: { format: 'choice', normalized: '나' }, choices, correctChoiceIndex: 1,
        solutionSteps: [`${dan}을 ${factor}번 더하면 ${product}예요.`, '나의 계산이 맞아요.'],
        hintSteps: ['두 수를 더한 값과 곱한 값을 구별하세요.', '구구표로 곱을 확인하세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-facts-array-check', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수01-11]', connectedStandards: [],
    cognitiveDomain: 'reasoning', reasoningPattern: 'model_and_check',
    representations: ['text', 'diagram'], modelId: 'g2-facts-array-equivalence-v1',
    unknownRole: 'array-equivalence',
    requiredStudentActions: ['convert_representation', 'test_constraint', 'evaluate_claim'],
    misconceptionRefs: ['facts-rotation-changes-total'], visualSurface: 'diagram',
    visualValueKeys: ['rows-a', 'cols-a', 'rows-b', 'cols-b'],
    cases: [{ 'rows-a': 3, 'cols-a': 7, 'rows-b': 7, 'cols-b': 3 }, { 'rows-a': 4, 'cols-a': 6, 'rows-b': 5, 'cols-b': 4 }],
    render: (params) => {
      const first = n(params, 'rows-a') * n(params, 'cols-a')
      const second = n(params, 'rows-b') * n(params, 'cols-b')
      const answer = first === second ? '같아요' : '달라요'
      const choices = ['같아요', '달라요']
      return {
        prompt: `첫 배열은 ${n(params, 'rows-a')}줄에 ${n(params, 'cols-a')}개, 둘째 배열은 ${n(params, 'rows-b')}줄에 ${n(params, 'cols-b')}개예요. 전체 수가 같을까요?`,
        answer: { format: 'choice', normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer),
        solutionSteps: [`두 배열의 전체 수는 ${first}개와 ${second}개예요.`, `그래서 ${answer}.`],
        hintSteps: ['각 배열을 곱셈식으로 바꾸세요.', '두 곱을 비교하세요.'],
      }
    },
  },
]

export const G2_2_FACTS_DRAFT_FAMILIES = Object.freeze(definitions.map(createG2FiniteDraftFamily))
