import type { JsonValue } from '../contracts'
import type { ApplicationProblemRenderedContentV1 } from '../generator'
import { createG2SemesterOneFamilyRecipe, numberParam } from './g2-1-family-support'
import { buildG2SemesterOnePlaceValueScene } from './g2-1-place-value-visual'

const PACK_ID = 'pack-g2-1-place-value'
const UNIT_ID = 'g2-1-place-value'
const PLACE = 'g2-1-place-value-place-value'
const COMPARE = 'g2-1-place-value-number-comparison'
const ZERO = 'g2-place-value-zero-placeholder'
const DIGIT = 'g2-place-value-digit-value'
const LAST = 'g2-place-value-compare-last-digit'

function numberAnswer(value: number): ApplicationProblemRenderedContentV1['answer'] {
  return { format: 'number', normalized: String(value) }
}

function choice(answer: string, choices: string[]) {
  return { answer: { format: 'choice' as const, normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer) }
}

const definitions = [
  {
    familyId: 'g2-1-place-value-build-number', conceptIds: [PLACE], primaryStandard: '[2수01-02]',
    cognitiveDomain: 'applying' as const, reasoningPattern: 'representation_shift' as const,
    representations: ['text', 'diagram'] as const, estimatedSteps: 2,
    modelId: 'g2-place-value-block-build-v1', unknownRole: 'three-digit-number',
    requiredStudentActions: ['interpret_context', 'convert_representation', 'execute_calculation'] as const,
    misconceptionRefs: [ZERO, DIGIT],
    cases: [{ hundreds: 3, tens: 4, ones: 2 }, { hundreds: 4, tens: 0, ones: 7 }, { hundreds: 8, tens: 6, ones: 0 }],
    render: (params: Readonly<Record<string, JsonValue>>) => {
      const h = numberParam(params, 'hundreds'); const t = numberParam(params, 'tens'); const o = numberParam(params, 'ones')
      const total = h * 100 + t * 10 + o
      return { prompt: `백 ${h}개, 십 ${t}개, 일 ${o}개인 수는 얼마일까요?`, answer: numberAnswer(total), solutionSteps: [`${h}00+${t}0+${o}=${total}`, `만든 수는 ${total}이에요.`], hintSteps: ['백, 십, 일 자리를 차례로 놓아요.', '없는 자리에는 0을 써요.'] }
    },
  },
  {
    familyId: 'g2-1-place-value-compare-orders', conceptIds: [COMPARE], primaryStandard: '[2수01-03]',
    cognitiveDomain: 'applying' as const, reasoningPattern: 'multi_step' as const,
    representations: ['text', 'diagram'] as const, estimatedSteps: 2,
    modelId: 'g2-place-value-left-to-right-compare-v1', unknownRole: 'larger-number',
    requiredStudentActions: ['interpret_context', 'choose_model', 'execute_calculation'] as const,
    misconceptionRefs: [LAST],
    cases: [{ left: 382, right: 417 }, { left: 561, right: 516 }, { left: 708, right: 780 }],
    render: (params: Readonly<Record<string, JsonValue>>) => {
      const left = numberParam(params, 'left'); const right = numberParam(params, 'right'); const answer = String(Math.max(left, right)); const choices = [String(left), String(right), '같아요']
      return { prompt: `${left}명인 팀과 ${right}명인 팀 중 사람이 더 많은 팀의 수는 무엇일까요?`, ...choice(answer, choices), solutionSteps: ['백의 자리부터 차례로 비교해요.', `${answer}가 더 큰 수예요.`], hintSteps: ['일의 자리부터 보지 않아요.', '백의 자리가 같으면 십의 자리를 보아요.'] }
    },
  },
  {
    familyId: 'g2-1-place-value-missing-digit', conceptIds: [PLACE], primaryStandard: '[2수01-02]',
    cognitiveDomain: 'reasoning' as const, reasoningPattern: 'inverse' as const,
    representations: ['text', 'equation', 'diagram'] as const, estimatedSteps: 3,
    modelId: 'g2-place-value-hidden-tens-digit-v1', unknownRole: 'tens-digit',
    requiredStudentActions: ['interpret_context', 'infer_missing_value', 'convert_representation', 'verify_result'] as const,
    misconceptionRefs: [ZERO, DIGIT],
    cases: [{ hundreds: 4, tens: 6, ones: 7 }, { hundreds: 7, tens: 2, ones: 5 }, { hundreds: 9, tens: 8, ones: 1 }],
    render: (params: Readonly<Record<string, JsonValue>>) => {
      const h = numberParam(params, 'hundreds'); const t = numberParam(params, 'tens'); const o = numberParam(params, 'ones'); const total = h * 100 + t * 10 + o
      return { prompt: `${total}에서 가린 십의 자리 숫자는 무엇일까요?`, answer: numberAnswer(t), solutionSteps: [`${total}=${h}00+${t}0+${o}`, `십의 자리 숫자는 ${t}예요.`], hintSteps: ['백, 십, 일 자리로 나누어요.', '십이 몇 묶음인지 확인해요.'] }
    },
  },
  {
    familyId: 'g2-1-place-value-claim-check', conceptIds: [PLACE, COMPARE], primaryStandard: '[2수01-02]', connectedStandards: ['[2수01-03]'],
    cognitiveDomain: 'reasoning' as const, reasoningPattern: 'error_analysis' as const,
    representations: ['text', 'equation', 'diagram'] as const, estimatedSteps: 3,
    modelId: 'g2-place-value-expanded-claim-v1', unknownRole: 'valid-speaker',
    requiredStudentActions: ['interpret_context', 'evaluate_claim', 'convert_representation', 'verify_result'] as const,
    misconceptionRefs: [ZERO, DIGIT],
    cases: [{ number: 407, aValue: 407, bValue: 47 }, { number: 560, aValue: 56, bValue: 560 }, { number: 803, aValue: 803, bValue: 83 }],
    render: (params: Readonly<Record<string, JsonValue>>) => {
      const number = numberParam(params, 'number'); const aValue = numberParam(params, 'aValue'); const bValue = numberParam(params, 'bValue'); const answer = aValue === number ? '가' : '나'
      const claims = [`가: ${aValue}`, `나: ${bValue}`]
      return { prompt: `${number}을 바르게 쓴 친구는 누구일까요? ${claims.join(', ')}`, ...choice(answer, ['가', '나']), solutionSteps: ['빈 자리에 0이 있는지 확인해요.', `${answer}의 수가 ${number}와 같아요.`], hintSteps: ['백, 십, 일 자리를 모두 보아요.', '0인 자리도 남겨야 해요.'] }
    },
  },
  {
    familyId: 'g2-1-place-value-between-check', conceptIds: [COMPARE], primaryStandard: '[2수01-03]',
    cognitiveDomain: 'reasoning' as const, reasoningPattern: 'model_and_check' as const,
    representations: ['text', 'diagram'] as const, estimatedSteps: 3,
    modelId: 'g2-place-value-between-constraints-v1', unknownRole: 'number-between-bounds',
    requiredStudentActions: ['select_relevant_data', 'test_constraint', 'compare_strategies', 'verify_result'] as const,
    misconceptionRefs: [LAST],
    cases: [{ low: 320, candidate: 352, high: 390 }, { low: 506, candidate: 560, high: 605 }, { low: 781, candidate: 807, high: 830 }],
    render: (params: Readonly<Record<string, JsonValue>>) => {
      const low = numberParam(params, 'low'); const candidate = numberParam(params, 'candidate'); const high = numberParam(params, 'high'); const answer = String(candidate); const choices = [answer, String(low - 1), String(high + 1)]
      return { prompt: `${low}보다 크고 ${high}보다 작은 수를 고르세요.`, ...choice(answer, choices), solutionSteps: [`${candidate}는 ${low}보다 커요.`, `${candidate}는 ${high}보다 작아요.`], hintSteps: ['두 조건을 모두 확인해요.', '백의 자리부터 비교해요.'] }
    },
  },
] as const

export const G2_1_PLACE_VALUE_FAMILY_RECIPES = definitions.map((definition) =>
  createG2SemesterOneFamilyRecipe({
    ...definition,
    packId: PACK_ID,
    unitId: UNIT_ID,
    conceptIds: [...definition.conceptIds],
    connectedStandards: 'connectedStandards' in definition ? [...definition.connectedStandards] : [],
    representations: [...definition.representations],
    requiredStudentActions: [...definition.requiredStudentActions],
    cases: definition.cases,
    visual: { semantics: 'quantitative', generatorId: 'g2-place-value-bars' },
    render: definition.render,
    scene: (params, rendered) => buildG2SemesterOnePlaceValueScene(definition.familyId, params, rendered),
  }),
)
