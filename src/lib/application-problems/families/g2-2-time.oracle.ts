import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'
import {
  verifyIndependentG2Problem,
  type G2IndependentProblemExpectation,
} from './g2-2-independent-verifier'

function n(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be an integer`)
  return value as number
}

function clockText(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 12 || 12
  return `${hour}시 ${minutes % 60}분`
}

function expectedTimeProblem(problem: GeneratedApplicationProblemV1): G2IndependentProblemExpectation {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-2-time-finish-time': {
      const start = n(p, 'start-hour') * 60 + n(p, 'start-minute')
      const elapsed = n(p, 'elapsed')
      const answer = clockText(start + elapsed)
      return {
        answer,
        prompt: `${clockText(start)}에 시작해 ${elapsed}분 동안 했어요. 끝난 시각은 언제일까요?`,
        solutionSteps: [`시작 시각에 ${elapsed}분을 더해요.`, `60분이 되면 1시간으로 바꾸어 ${answer}이에요.`],
        hintSteps: ['분부터 더해 보세요.', '60분을 1시간으로 바꾸세요.'],
        visualSurface: 'diagram', visualValueKeys: ['start-hour', 'start-minute', 'elapsed'],
        requiredUnitTokens: ['시', '분'],
      }
    }
    case 'g2-2-time-find-start': {
      const end = n(p, 'end-hour') * 60 + n(p, 'end-minute')
      const elapsed = n(p, 'elapsed')
      const answer = clockText(end - elapsed)
      return {
        answer,
        prompt: `${elapsed}분 동안 한 일이 ${clockText(end)}에 끝났어요. 시작한 시각은 언제일까요?`,
        solutionSteps: [`끝난 시각에서 ${elapsed}분을 거꾸로 가요.`, `시작한 시각은 ${answer}이에요.`],
        hintSteps: ['끝난 시각에서 걸린 시간을 빼세요.', '구한 시각에 다시 더해 확인하세요.'],
        visualSurface: 'diagram', visualValueKeys: ['end-hour', 'end-minute', 'elapsed'],
        requiredUnitTokens: ['시', '분'],
      }
    }
    case 'g2-2-time-clock-reading-error': {
      const hour = n(p, 'hour')
      const hand = n(p, 'minute-hand-number')
      const minutes = hand * 5
      const answer = hand === minutes ? '가' : '나'
      return {
        answer,
        prompt: `분침이 ${hand}, 시침이 ${hour}와 ${hour + 1} 사이예요. 가: ${hour}시 ${hand}분. 나: ${hour}시 ${minutes}분. 누구 말이 맞나요?`,
        solutionSteps: ['분침 숫자 한 칸은 5분이에요.', `${hand}×5=${minutes}분이므로 ${answer}가 맞아요.`],
        hintSteps: ['분침 숫자를 그대로 분으로 읽지 마세요.', '5분씩 세어 보세요.'],
        choices: ['가', '나'], visualSurface: 'diagram', visualValueKeys: ['hour', 'minute-hand-number'],
        requiredUnitTokens: ['분'],
      }
    }
    case 'g2-2-time-calendar-check': {
      const weeks = n(p, 'weeks')
      const claimedDays = n(p, 'claimed-days')
      const actual = weeks * 7
      const answer = actual === claimedDays ? '맞아요' : '틀려요'
      return {
        answer,
        prompt: `${weeks}주를 ${claimedDays}일이라고 한 말이 맞을까요?`,
        solutionSteps: [`1주는 7일이므로 ${weeks}주는 ${actual}일이에요.`, `따라서 ${answer}.`],
        hintSteps: ['주말도 한 주에 들어가요.', '7일씩 묶어 보세요.'],
        choices: ['맞아요', '틀려요'], visualSurface: 'diagram', visualValueKeys: ['weeks', 'claimed-days'],
        requiredUnitTokens: ['주', '일'],
      }
    }
    default:
      throw new TypeError(`unsupported Grade 2 time family ${problem.familyId}`)
  }
}

export function oracleG2TimeProblem(problem: GeneratedApplicationProblemV1): string {
  return expectedTimeProblem(problem).answer
}

export function verifyG2TimeProblem(problem: GeneratedApplicationProblemV1): string[] {
  return verifyIndependentG2Problem(problem, expectedTimeProblem(problem))
}
