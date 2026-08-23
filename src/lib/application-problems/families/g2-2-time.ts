import type { JsonValue } from '../contracts'
import { createG2FiniteDraftFamily, type G2FiniteDraftFamilyDefinition } from './g2-2-content-core'

const PACK_ID = 'pack-g2-2-time'
const UNIT_ID = 'g2-2-time'
const CONCEPT = 'g2-2-time-time'

function n(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value) || (value as number) <= 0) throw new TypeError(`${key} must be positive`)
  return value as number
}

function clockText(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60) % 12 || 12
  return `${hour}시 ${totalMinutes % 60}분`
}

const definitions: readonly G2FiniteDraftFamilyDefinition[] = [
  {
    familyId: 'g2-2-time-finish-time', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수03-08]', connectedStandards: ['[2수03-07]'],
    cognitiveDomain: 'applying', reasoningPattern: 'multi_step',
    representations: ['text', 'diagram'], modelId: 'g2-time-start-elapsed-end-v1', unknownRole: 'finish-time',
    requiredStudentActions: ['interpret_context', 'choose_model', 'execute_calculation'],
    misconceptionRefs: ['time-hour-minute-no-regroup'], visualSurface: 'diagram', visualValueKeys: ['start-hour', 'start-minute', 'elapsed'],
    cases: [{ 'start-hour': 3, 'start-minute': 35, elapsed: 50 }, { 'start-hour': 8, 'start-minute': 45, elapsed: 35 }],
    render: (params) => {
      const start = n(params, 'start-hour') * 60 + n(params, 'start-minute'), elapsed = n(params, 'elapsed')
      const answer = clockText(start + elapsed)
      return {
        prompt: `${clockText(start)}에 시작해 ${elapsed}분 동안 했어요. 끝난 시각은 언제일까요?`,
        answer: { format: 'text', normalized: answer },
        solutionSteps: [`시작 시각에 ${elapsed}분을 더해요.`, `60분이 되면 1시간으로 바꾸어 ${answer}이에요.`],
        hintSteps: ['분부터 더해 보세요.', '60분을 1시간으로 바꾸세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-time-find-start', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수03-08]', connectedStandards: ['[2수03-07]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'inverse',
    representations: ['text', 'diagram'], modelId: 'g2-time-end-elapsed-start-v1', unknownRole: 'start-time',
    requiredStudentActions: ['interpret_context', 'infer_missing_value', 'verify_result'],
    misconceptionRefs: ['time-hour-minute-no-regroup'], visualSurface: 'diagram', visualValueKeys: ['end-hour', 'end-minute', 'elapsed'],
    cases: [{ 'end-hour': 5, 'end-minute': 20, elapsed: 45 }, { 'end-hour': 10, 'end-minute': 15, elapsed: 35 }],
    render: (params) => {
      const end = n(params, 'end-hour') * 60 + n(params, 'end-minute'), elapsed = n(params, 'elapsed')
      const answer = clockText(end - elapsed)
      return {
        prompt: `${elapsed}분 동안 한 일이 ${clockText(end)}에 끝났어요. 시작한 시각은 언제일까요?`,
        answer: { format: 'text', normalized: answer },
        solutionSteps: [`끝난 시각에서 ${elapsed}분을 거꾸로 가요.`, `시작한 시각은 ${answer}이에요.`],
        hintSteps: ['끝난 시각에서 걸린 시간을 빼세요.', '구한 시각에 다시 더해 확인하세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-time-clock-reading-error', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수03-07]', connectedStandards: ['[2수03-08]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis',
    representations: ['text', 'diagram'], modelId: 'g2-time-minute-hand-claim-v1', unknownRole: 'valid-clock-reading',
    requiredStudentActions: ['convert_representation', 'evaluate_claim', 'verify_result'],
    misconceptionRefs: ['time-clock-number-is-minute'], visualSurface: 'diagram', visualValueKeys: ['hour', 'minute-hand-number'],
    cases: [{ hour: 4, 'minute-hand-number': 6 }, { hour: 7, 'minute-hand-number': 9 }],
    render: (params) => {
      const hour = n(params, 'hour'), hand = n(params, 'minute-hand-number'), minutes = hand * 5
      const choices = ['가', '나']
      return {
        prompt: `분침이 ${hand}, 시침이 ${hour}와 ${hour + 1} 사이예요. 가: ${hour}시 ${hand}분. 나: ${hour}시 ${minutes}분. 누구 말이 맞나요?`,
        answer: { format: 'choice', normalized: '나' }, choices, correctChoiceIndex: 1,
        solutionSteps: [`분침 숫자 한 칸은 5분이에요.`, `${hand}×5=${minutes}분이므로 나가 맞아요.`],
        hintSteps: ['분침 숫자를 그대로 분으로 읽지 마세요.', '5분씩 세어 보세요.'],
      }
    },
  },
  {
    familyId: 'g2-2-time-calendar-check', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수03-09]', connectedStandards: ['[2수03-08]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'model_and_check',
    representations: ['text', 'diagram'], modelId: 'g2-time-week-day-claim-v1', unknownRole: 'valid-week-day-claim',
    requiredStudentActions: ['convert_representation', 'test_constraint', 'evaluate_claim'],
    misconceptionRefs: ['time-week-five-days'], visualSurface: 'diagram', visualValueKeys: ['weeks', 'claimed-days'],
    cases: [{ weeks: 2, 'claimed-days': 10 }, { weeks: 4, 'claimed-days': 28 }],
    render: (params) => {
      const weeks = n(params, 'weeks'), claim = n(params, 'claimed-days'), actual = weeks * 7
      const answer = claim === actual ? '맞아요' : '틀려요'
      const choices = ['맞아요', '틀려요']
      return {
        prompt: `${weeks}주를 ${claim}일이라고 한 말이 맞을까요?`,
        answer: { format: 'choice', normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer),
        solutionSteps: [`1주는 7일이므로 ${weeks}주는 ${actual}일이에요.`, `따라서 ${answer}.`],
        hintSteps: ['주말도 한 주에 들어가요.', '7일씩 묶어 보세요.'],
      }
    },
  },
]

export const G2_2_TIME_DRAFT_FAMILIES = Object.freeze(definitions.map(createG2FiniteDraftFamily))
