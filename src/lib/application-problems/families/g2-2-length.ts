import type { JsonValue } from '../contracts'
import { createG2FiniteDraftFamily, type G2FiniteDraftFamilyDefinition } from './g2-2-content-core'

const PACK_ID = 'pack-g2-2-length'
const UNIT_ID = 'g2-2-length'
const CONCEPT = 'g2-2-length-length'

function n(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value) || (value as number) <= 0) throw new TypeError(`${key} must be positive`)
  return value as number
}

const definitions: readonly G2FiniteDraftFamilyDefinition[] = [
  {
    familyId: 'g2-2-length-tool-and-unit', packId: PACK_ID, packVersion: 2, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수03-10]', connectedStandards: ['[2수03-11]', '[2수03-12]'],
    cognitiveDomain: 'applying', reasoningPattern: 'multi_step',
    representations: ['text', 'diagram'], modelId: 'g2-length-tool-unit-choice-v1', unknownRole: 'suitable-tool-and-unit',
    requiredStudentActions: ['interpret_context', 'choose_model', 'test_constraint'],
    misconceptionRefs: ['length-tool-unit-mismatch'], visualSurface: 'diagram', visualValueKeys: ['object-length', 'ruler-length'],
    cases: [{ 'object-length': 18, 'ruler-length': 30 }, { 'object-length': 145, 'ruler-length': 100 }],
    render: (params) => {
      const length = n(params, 'object-length')
      const short = length < 100
      const answer = short ? '30cm 자와 cm' : '1m 자와 m, cm'
      const choices = ['30cm 자와 cm', '1m 자와 m, cm']
      return {
        prompt: `${length}cm쯤 되는 물건을 재려고 해요. 알맞은 도구와 단위를 고르세요.`,
        answer: { format: 'choice', normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer),
        solutionSteps: [short ? '한 자보다 짧아 30cm 자가 알맞아요.' : '1m보다 길어 1m 자로 재고 남은 cm를 봐요.', `알맞은 선택은 ${answer}예요.`],
        hintSteps: ['물건 길이와 도구 길이를 비교하세요.', '100cm가 1m임을 생각하세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-length-estimate-check', packId: PACK_ID, packVersion: 2, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수03-12]', connectedStandards: ['[2수03-10]', '[2수03-11]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'model_and_check',
    representations: ['text', 'diagram'], modelId: 'g2-length-estimate-measure-check-v1', unknownRole: 'reasonable-estimate-claim',
    requiredStudentActions: ['interpret_context', 'evaluate_claim', 'verify_result'],
    misconceptionRefs: ['length-estimate-as-exact'], visualSurface: 'diagram', visualValueKeys: ['estimate', 'measured'],
    cases: [{ estimate: 100, measured: 96 }, { estimate: 200, measured: 128 }],
    render: (params) => {
      const estimate = n(params, 'estimate'), measured = n(params, 'measured')
      const answer = Math.abs(estimate - measured) <= 10 ? '알맞아요' : '너무 달라요'
      const choices = ['알맞아요', '너무 달라요']
      return {
        prompt: `길이를 ${estimate}cm쯤으로 어림했어요. 재어 보니 ${measured}cm예요. 어림을 어떻게 볼까요?`,
        answer: { format: 'choice', normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer),
        solutionSteps: [`두 길이의 차를 확인해요.`, `${Math.abs(estimate - measured)}cm 차이이므로 ${answer}.`],
        hintSteps: ['어림값과 잰 값을 비교하세요.', '차이가 작은지 살펴보세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-length-information-check', packId: PACK_ID, packVersion: 2, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수03-13]', connectedStandards: ['[2수03-10]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'data_sufficiency',
    representations: ['text', 'diagram'], modelId: 'g2-length-missing-measurement-data-v1', unknownRole: 'sufficient-length-data',
    requiredStudentActions: ['select_relevant_data', 'test_constraint', 'evaluate_claim'],
    misconceptionRefs: ['length-tool-unit-mismatch'], visualSurface: 'diagram', visualValueKeys: ['whole', 'known'],
    cases: [{ whole: 180, known: 70, hasUnit: 1 }, { whole: 240, known: 90, hasUnit: 2 }],
    render: (params) => {
      const whole = n(params, 'whole'), known = n(params, 'known'), hasUnit = n(params, 'hasUnit')
      const enough = hasUnit === 1
      const answer = enough ? '구할 수 있어요' : '단위가 더 필요해요'
      const choices = ['구할 수 있어요', '단위가 더 필요해요']
      return {
        prompt: `전체 줄은 ${whole}cm이고 한 부분은 ${known}${enough ? 'cm' : ''}라고 적혀 있어요. 남은 길이를 바로 구할 수 있을까요?`,
        answer: { format: 'choice', normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer),
        solutionSteps: [enough ? '두 길이의 단위가 모두 cm예요.' : '전체는 cm이지만 한 부분의 단위가 없어 같은 길이인지 알 수 없어요.', answer],
        hintSteps: ['두 수만 보지 말고 단위를 보세요.', '같은 단위인지 확인하세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-length-method-compare', packId: PACK_ID, packVersion: 2, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수03-10]', connectedStandards: ['[2수03-12]', '[2수03-13]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'compare_methods',
    representations: ['text', 'diagram'], modelId: 'g2-length-measurement-method-compare-v1', unknownRole: 'more-suitable-measurement-method',
    requiredStudentActions: ['choose_model', 'compare_strategies', 'verify_result'],
    misconceptionRefs: ['length-tool-unit-mismatch', 'length-estimate-as-exact'], visualSurface: 'diagram', visualValueKeys: ['object-length', 'short-ruler'],
    cases: [{ 'object-length': 160, 'short-ruler': 20 }, { 'object-length': 230, 'short-ruler': 30 }],
    render: (params) => {
      const length = n(params, 'object-length'), ruler = n(params, 'short-ruler')
      const choices = ['1m 자로 재고 남은 cm를 잰다', `${ruler}cm 자를 한 번만 댄다`]
      return {
        prompt: `${length}cm쯤 되는 긴 물건을 재는 두 방법 중 알맞은 방법을 고르세요.`,
        answer: { format: 'choice', normalized: choices[0] }, choices, correctChoiceIndex: 0,
        solutionSteps: ['물건은 1m보다 길어요.', '1m 자로 큰 묶음을 재고 남은 cm를 재는 방법이 알맞아요.'],
        hintSteps: ['짧은 자를 한 번만 대면 전체를 잴 수 있는지 보세요.', '1m와 남은 cm로 나누어 보세요.'],
      }
    },
  },
]

export const G2_2_LENGTH_DRAFT_FAMILIES = Object.freeze(definitions.map(createG2FiniteDraftFamily))
