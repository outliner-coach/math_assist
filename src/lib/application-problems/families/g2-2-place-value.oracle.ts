import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'
import {
  verifyIndependentG2Problem,
  type G2IndependentProblemExpectation,
} from './g2-2-independent-verifier'

function n(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be a safe integer`)
  return value as number
}

function independentlyArrange(digits: number[], limit: number): number {
  let best = -1
  for (const a of digits) for (const b of digits) for (const c of digits) for (const d of digits) {
    if (new Set([a, b, c, d]).size !== digits.length) continue
    const candidate = a * 1000 + b * 100 + c * 10 + d
    if (candidate < limit && candidate > best) best = candidate
  }
  if (best < 0) throw new RangeError('no independent arrangement satisfies the limit')
  return best
}

function expectedPlaceValueProblem(
  problem: GeneratedApplicationProblemV1,
): G2IndependentProblemExpectation {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-2-place-value-shop-order': {
      const values = [n(p, 'first'), n(p, 'second'), n(p, 'third')]
      const answer = Math.max(...values)
      return {
        answer: String(answer),
        prompt: `가격표가 ${values.join(', ')}원이에요. 가장 비싼 물건의 가격은 얼마일까요?`,
        solutionSteps: ['천의 자리부터 차례로 비교해요.', `가장 큰 가격은 ${answer}원이에요.`],
        hintSteps: ['천의 자리를 먼저 보세요.', '같으면 백의 자리로 옮겨 보세요.'],
        visualSurface: 'diagram', visualValueKeys: ['first', 'second', 'third'],
        requiredUnitTokens: ['원'],
      }
    }
    case 'g2-2-place-value-hidden-hundreds': {
      const thousands = n(p, 'thousands')
      const threshold = n(p, 'threshold-hundreds')
      const tens = n(p, 'tens')
      const ones = n(p, 'ones')
      const answer = threshold + 1
      return {
        answer: String(answer),
        prompt: `${thousands}□${tens}${ones}이 ${thousands}${threshold}${tens}${ones}보다 크도록 할 때 □에 넣을 수 있는 가장 작은 수는 무엇일까요?`,
        solutionSteps: ['천의 자리는 같아요.', `백의 자리에는 ${threshold}보다 큰 가장 작은 수 ${answer}을 넣어요.`],
        hintSteps: ['같은 천의 자리는 지나가요.', '백의 자리끼리 비교하세요.'],
        visualSurface: 'diagram', visualValueKeys: ['thousands', 'threshold-hundreds', 'tens'],
      }
    }
    case 'g2-2-place-value-claim-check': {
      const first = n(p, 'first')
      const second = n(p, 'second')
      const answer = first > second ? '가' : '나'
      return {
        answer,
        prompt: `가: ${first}이 더 커. 나: ${second}이 더 커. 큰 자리부터 비교했을 때 누구 말이 맞나요?`,
        solutionSteps: ['천의 자리부터 비교해요.', `${Math.max(first, second)}이 더 크므로 ${answer}가 맞아요.`],
        hintSteps: ['일의 자리만 보지 마세요.', '가장 큰 자리부터 확인하세요.'],
        choices: ['가', '나'], visualSurface: 'diagram', visualValueKeys: ['first', 'second'],
      }
    }
    case 'g2-2-place-value-card-constraint': {
      const digits = ['d1', 'd2', 'd3', 'd4'].map((key) => n(p, key))
      const limit = n(p, 'limit')
      const answer = independentlyArrange(digits, limit)
      return {
        answer: String(answer),
        prompt: `수 카드 ${digits.join(', ')}을 한 번씩 써서 ${limit}보다 작은 가장 큰 네 자리 수를 만드세요.`,
        solutionSteps: [`${limit}보다 작도록 천의 자리를 고릅니다.`, `남은 카드는 큰 수부터 놓아 ${answer}을 만들어요.`],
        hintSteps: ['먼저 천의 자리 조건을 확인하세요.', '남은 자리는 큰 카드부터 놓아 보세요.'],
        visualSurface: 'diagram', visualValueKeys: ['d1', 'd2', 'd3', 'd4', 'limit'],
      }
    }
    default:
      throw new TypeError(`unsupported Grade 2 place-value family ${problem.familyId}`)
  }
}

export function oracleG2PlaceValueProblem(problem: GeneratedApplicationProblemV1): string {
  return expectedPlaceValueProblem(problem).answer
}

export function verifyG2PlaceValueProblem(problem: GeneratedApplicationProblemV1): string[] {
  return verifyIndependentG2Problem(problem, expectedPlaceValueProblem(problem))
}
