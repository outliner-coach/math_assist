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

function expectedTableGraphProblem(
  problem: GeneratedApplicationProblemV1,
): G2IndependentProblemExpectation {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-2-table-graph-survey-difference': {
      const values = [n(p, 'apple'), n(p, 'grape'), n(p, 'melon')]
      const answer = Math.max(...values) - Math.min(...values)
      return {
        answer: String(answer),
        prompt: `사과 ${values[0]}명, 포도 ${values[1]}명, 수박 ${values[2]}명인 표가 있어요. 가장 많은 것과 적은 것의 차는 몇 명일까요?`,
        solutionSteps: ['가장 큰 수와 작은 수를 찾아요.', `두 수의 차는 ${answer}명이에요.`],
        hintSteps: ['종류와 수를 맞춰 읽으세요.', '가장 큰 수에서 가장 작은 수를 빼세요.'],
        visualSurface: 'table', visualValueKeys: ['apple', 'grape', 'melon'], requiredUnitTokens: ['명'],
      }
    }
    case 'g2-2-table-graph-missing-category': {
      const total = n(p, 'total')
      const first = n(p, 'first')
      const second = n(p, 'second')
      const known = first + second
      const answer = total - known
      return {
        answer: String(answer),
        prompt: `세 종류를 조사한 수는 모두 ${total}개예요. 두 종류가 ${first}개와 ${second}개라면 나머지는 몇 개일까요?`,
        solutionSteps: [`알려진 두 수는 ${known}개예요.`, `${total}-${first}-${second}=${answer}개`],
        hintSteps: ['전체에서 알려진 두 종류를 빼세요.', '세 수를 더해 전체인지 확인하세요.'],
        visualSurface: 'table', visualValueKeys: ['total', 'first', 'second'], requiredUnitTokens: ['개'],
      }
    }
    case 'g2-2-table-graph-claim-error': {
      const entries = [
        ['축구', n(p, 'soccer')],
        ['야구', n(p, 'baseball')],
        ['피구', n(p, 'dodgeball')],
      ] as const
      const actual = entries.reduce((largest, entry) => entry[1] > largest[1] ? entry : largest)[0]
      const incorrect = entries.find(([name]) => name !== actual)?.[0]
      if (!incorrect) throw new RangeError('a distinct incorrect graph category is required')
      const answer = incorrect === actual ? '가' : '나'
      return {
        answer,
        prompt: `가: 표식 수를 세면 ${incorrect}가 가장 많아. 나: 표식 수를 세면 ${actual}가 가장 많아. 누구 말이 맞나요?`,
        solutionSteps: ['각 종목의 표식 수를 세어요.', `${actual}의 수가 가장 커서 ${answer}가 맞아요.`],
        hintSteps: ['줄의 위치만 보지 마세요.', '각 줄의 표식 수를 비교하세요.'],
        choices: ['가', '나'], visualSurface: 'diagram',
        visualValueKeys: ['soccer', 'baseball', 'dodgeball'],
      }
    }
    case 'g2-2-table-graph-key-sufficiency': {
      const marks = n(p, 'marks')
      const perMark = n(p, 'per-mark')
      const hasKey = n(p, 'has-key') === 1
      const answer = hasKey ? '구할 수 있어요' : '표식 한 개의 뜻이 필요해요'
      return {
        answer,
        prompt: `표식이 ${marks}개예요.${hasKey ? ` 표식 한 개는 ${perMark}명을 뜻해요.` : ''} 사람 수를 구할 수 있을까요?`,
        solutionSteps: [hasKey ? '표식 수와 한 개의 뜻이 모두 있어요.' : '표식 수만 있고 한 개가 몇 명인지 없어요.', answer],
        hintSteps: ['표식 한 개가 몇 명인지 보세요.', '필요한 정보가 모두 있는지 확인하세요.'],
        choices: ['구할 수 있어요', '표식 한 개의 뜻이 필요해요'], visualSurface: 'diagram',
        visualValueKeys: hasKey ? ['marks', 'per-mark'] : ['marks'],
        requiredUnitTokens: ['개'],
      }
    }
    default:
      throw new TypeError(`unsupported Grade 2 table-graph family ${problem.familyId}`)
  }
}

export function oracleG2TableGraphProblem(problem: GeneratedApplicationProblemV1): string {
  return expectedTableGraphProblem(problem).answer
}

export function verifyG2TableGraphProblem(problem: GeneratedApplicationProblemV1): string[] {
  return verifyIndependentG2Problem(problem, expectedTableGraphProblem(problem))
}
