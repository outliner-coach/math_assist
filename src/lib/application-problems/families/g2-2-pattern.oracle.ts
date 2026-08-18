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

function expectedPatternProblem(problem: GeneratedApplicationProblemV1): G2IndependentProblemExpectation {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-2-pattern-step-application': {
      const start = n(p, 'start')
      const step = n(p, 'step')
      const position = n(p, 'position')
      const answer = start + step * (position - 1)
      return {
        answer: String(answer),
        prompt: `${start}에서 시작해 ${step}씩 커지는 수 배열의 ${position}번째 수는 무엇일까요?`,
        solutionSteps: [`첫 수 뒤로 ${step}을 ${position - 1}번 더해요.`, `${position}번째 수는 ${answer}이에요.`],
        hintSteps: ['첫 수는 이미 첫 번째예요.', '다음 자리마다 같은 수를 더하세요.'],
        visualSurface: 'table', visualValueKeys: ['start', 'step', 'position'],
      }
    }
    case 'g2-2-pattern-find-start': {
      const step = n(p, 'step')
      const position = n(p, 'position')
      const later = n(p, 'later')
      const answer = later - step * (position - 1)
      return {
        answer: String(answer),
        prompt: `${step}씩 커지는 배열의 ${position}번째 수가 ${later}예요. 첫 수는 무엇일까요?`,
        solutionSteps: [`${later}에서 ${step}을 ${position - 1}번 거꾸로 빼요.`, `첫 수는 ${answer}이에요.`],
        hintSteps: ['뒤에서 앞으로 같은 수를 빼세요.', '다시 커지는 배열을 만들어 확인하세요.'],
        visualSurface: 'table', visualValueKeys: ['step', 'position', 'later'],
      }
    }
    case 'g2-2-pattern-broken-term': {
      const start = n(p, 'start')
      const step = n(p, 'step')
      const position = n(p, 'wrong-position')
      const expected = start + step * (position - 1)
      const shown = expected + 1
      const answer = shown === expected ? '맞아요' : '틀려요'
      return {
        answer,
        prompt: `${start}에서 ${step}씩 커지는 배열의 ${position}번째 수를 ${shown}이라고 했어요. 맞을까요?`,
        solutionSteps: [`같은 수 ${step}을 차례로 더해요.`, `${position}번째는 ${expected}이므로 ${answer}.`],
        hintSteps: ['매번 더한 수가 같은지 보세요.', '처음부터 차례로 적어 보세요.'],
        choices: ['맞아요', '틀려요'], visualSurface: 'diagram',
        visualValueKeys: ['start', 'step', 'wrong-position'],
      }
    }
    case 'g2-2-pattern-far-step': {
      const start = n(p, 'start')
      const step = n(p, 'step')
      const position = n(p, 'position')
      const changes = position - 1
      const answer = start + step * changes
      return {
        answer: String(answer),
        prompt: `첫 수가 ${start}이고 매번 ${step}씩 커져요. 모두 쓰지 않고 ${position}번째 수를 구하세요.`,
        solutionSteps: [`첫 수 뒤에는 ${changes}번 변해요.`, `${start}+${step}×${changes}=${answer}`],
        hintSteps: ['자리 수보다 한 번 적게 변해요.', '같은 변화를 여러 번 묶어 보세요.'],
        visualSurface: 'table', visualValueKeys: ['start', 'step', 'position'],
      }
    }
    default:
      throw new TypeError(`unsupported Grade 2 pattern family ${problem.familyId}`)
  }
}

export function oracleG2PatternProblem(problem: GeneratedApplicationProblemV1): string {
  return expectedPatternProblem(problem).answer
}

export function verifyG2PatternProblem(problem: GeneratedApplicationProblemV1): string[] {
  return verifyIndependentG2Problem(problem, expectedPatternProblem(problem))
}
