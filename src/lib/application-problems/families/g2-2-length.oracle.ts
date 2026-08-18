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

function expectedLengthProblem(problem: GeneratedApplicationProblemV1): G2IndependentProblemExpectation {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-2-length-tool-and-unit': {
      const length = n(p, 'object-length')
      const short = length < 100
      const answer = short ? '30cm 자와 cm' : '1m 자와 m, cm'
      return {
        answer,
        prompt: `${length}cm쯤 되는 물건을 재려고 해요. 알맞은 도구와 단위를 고르세요.`,
        solutionSteps: [short ? '한 자보다 짧아 30cm 자가 알맞아요.' : '1m보다 길어 1m 자로 재고 남은 cm를 봐요.', `알맞은 선택은 ${answer}예요.`],
        hintSteps: ['물건 길이와 도구 길이를 비교하세요.', '100cm가 1m임을 생각하세요.'],
        choices: ['30cm 자와 cm', '1m 자와 m, cm'], visualSurface: 'diagram',
        visualValueKeys: ['object-length', 'ruler-length'], requiredUnitTokens: ['cm'],
      }
    }
    case 'g2-2-length-estimate-check': {
      const estimate = n(p, 'estimate')
      const measured = n(p, 'measured')
      const difference = Math.abs(estimate - measured)
      const answer = difference <= 10 ? '알맞아요' : '너무 달라요'
      return {
        answer,
        prompt: `길이를 ${estimate}cm쯤으로 어림했어요. 재어 보니 ${measured}cm예요. 어림을 어떻게 볼까요?`,
        solutionSteps: ['두 길이의 차를 확인해요.', `${difference}cm 차이이므로 ${answer}.`],
        hintSteps: ['어림값과 잰 값을 비교하세요.', '차이가 작은지 살펴보세요.'],
        choices: ['알맞아요', '너무 달라요'], visualSurface: 'diagram',
        visualValueKeys: ['estimate', 'measured'], requiredUnitTokens: ['cm'],
      }
    }
    case 'g2-2-length-information-check': {
      const whole = n(p, 'whole')
      const known = n(p, 'known')
      const enough = n(p, 'hasUnit') === 1
      const answer = enough ? '구할 수 있어요' : '단위가 더 필요해요'
      return {
        answer,
        prompt: `전체 줄은 ${whole}cm이고 한 부분은 ${known}${enough ? 'cm' : ''}라고 적혀 있어요. 남은 길이를 바로 구할 수 있을까요?`,
        solutionSteps: [enough ? '두 길이의 단위가 모두 cm예요.' : '전체는 cm이지만 한 부분의 단위가 없어 같은 길이인지 알 수 없어요.', answer],
        hintSteps: ['두 수만 보지 말고 단위를 보세요.', '같은 단위인지 확인하세요.'],
        choices: ['구할 수 있어요', '단위가 더 필요해요'], visualSurface: 'diagram',
        visualValueKeys: ['whole', 'known'], requiredUnitTokens: ['cm'],
      }
    }
    case 'g2-2-length-method-compare': {
      const length = n(p, 'object-length')
      const ruler = n(p, 'short-ruler')
      const longMethod = '1m 자로 재고 남은 cm를 잰다'
      const shortMethod = `${ruler}cm 자를 한 번만 댄다`
      const answer = length > ruler ? longMethod : shortMethod
      return {
        answer,
        prompt: `${length}cm쯤 되는 긴 물건을 재는 두 방법 중 알맞은 방법을 고르세요.`,
        solutionSteps: ['물건은 1m보다 길어요.', '1m 자로 큰 묶음을 재고 남은 cm를 재는 방법이 알맞아요.'],
        hintSteps: ['짧은 자를 한 번만 대면 전체를 잴 수 있는지 보세요.', '1m와 남은 cm로 나누어 보세요.'],
        choices: [longMethod, shortMethod], visualSurface: 'diagram',
        visualValueKeys: ['object-length', 'short-ruler'], requiredUnitTokens: ['cm', 'm'],
      }
    }
    default:
      throw new TypeError(`unsupported Grade 2 length draft family ${problem.familyId}`)
  }
}

export function oracleG2LengthDraftProblem(problem: GeneratedApplicationProblemV1): string {
  return expectedLengthProblem(problem).answer
}

export function verifyG2LengthDraftProblem(problem: GeneratedApplicationProblemV1): string[] {
  return verifyIndependentG2Problem(problem, expectedLengthProblem(problem))
}
