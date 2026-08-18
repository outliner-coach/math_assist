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

function expectedFactsProblem(problem: GeneratedApplicationProblemV1): G2IndependentProblemExpectation {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-2-facts-two-trays': {
      const first = n(p, 'first-groups')
      const second = n(p, 'second-groups')
      const each = n(p, 'each')
      const groups = first + second
      const answer = groups * each
      return {
        answer: String(answer),
        prompt: `쿠키가 한 접시에 ${each}개씩 있어요. 접시 ${first}개와 ${second}개에 있는 쿠키는 모두 몇 개일까요?`,
        solutionSteps: [`접시는 모두 ${groups}개예요.`, `${groups}×${each}=${answer}개`],
        hintSteps: ['접시 수를 먼저 모아 보세요.', '같은 수씩 있는 묶음으로 나타내세요.'],
        visualSurface: 'diagram', visualValueKeys: ['first-groups', 'second-groups', 'each'],
        requiredUnitTokens: ['개'],
      }
    }
    case 'g2-2-facts-missing-groups': {
      const total = n(p, 'total')
      const each = n(p, 'each')
      if (total % each !== 0) throw new RangeError('total must be divisible by each')
      const answer = total / each
      return {
        answer: String(answer),
        prompt: `구슬 ${total}개를 한 줄에 ${each}개씩 놓으면 몇 줄이 될까요?`,
        solutionSteps: [`${each}씩 몇 묶음이면 ${total}인지 구해요.`, `${each}×${answer}=${total}이므로 ${answer}줄이에요.`],
        hintSteps: ['곱해서 전체가 되는 수를 찾으세요.', '구구표로 다시 확인하세요.'],
        visualSurface: 'table', visualValueKeys: ['total', 'each'], requiredUnitTokens: ['줄'],
      }
    }
    case 'g2-2-facts-product-error': {
      const dan = n(p, 'dan')
      const factor = n(p, 'factor')
      const product = dan * factor
      const addition = dan + factor
      const answer = addition === product ? '가' : '나'
      return {
        answer,
        prompt: `가: ${dan}×${factor}=${addition}. 나: ${dan}×${factor}=${product}. 누구의 계산이 맞나요?`,
        solutionSteps: [`${dan}을 ${factor}번 더하면 ${product}예요.`, `${answer}의 계산이 맞아요.`],
        hintSteps: ['두 수를 더한 값과 곱한 값을 구별하세요.', '구구표로 곱을 확인하세요.'],
        choices: ['가', '나'], visualSurface: 'table', visualValueKeys: ['dan', 'factor'],
      }
    }
    case 'g2-2-facts-array-check': {
      const rowsA = n(p, 'rows-a')
      const colsA = n(p, 'cols-a')
      const rowsB = n(p, 'rows-b')
      const colsB = n(p, 'cols-b')
      const first = rowsA * colsA
      const second = rowsB * colsB
      const answer = first === second ? '같아요' : '달라요'
      return {
        answer,
        prompt: `첫 배열은 ${rowsA}줄에 ${colsA}개, 둘째 배열은 ${rowsB}줄에 ${colsB}개예요. 전체 수가 같을까요?`,
        solutionSteps: [`두 배열의 전체 수는 ${first}개와 ${second}개예요.`, `그래서 ${answer}.`],
        hintSteps: ['각 배열을 곱셈식으로 바꾸세요.', '두 곱을 비교하세요.'],
        choices: ['같아요', '달라요'], visualSurface: 'diagram',
        visualValueKeys: ['rows-a', 'cols-a', 'rows-b', 'cols-b'], requiredUnitTokens: ['개'],
      }
    }
    default:
      throw new TypeError(`unsupported Grade 2 facts family ${problem.familyId}`)
  }
}

export function oracleG2FactsProblem(problem: GeneratedApplicationProblemV1): string {
  return expectedFactsProblem(problem).answer
}

export function verifyG2FactsProblem(problem: GeneratedApplicationProblemV1): string[] {
  return verifyIndependentG2Problem(problem, expectedFactsProblem(problem))
}
