import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'

function n(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be an integer`)
  return value as number
}

export function oracleG2LengthDraftProblem(problem: GeneratedApplicationProblemV1): string {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-2-length-tool-and-unit': return n(p, 'object-length') < 100 ? '30cm 자와 cm' : '1m 자와 m, cm'
    case 'g2-2-length-estimate-check': return Math.abs(n(p, 'estimate') - n(p, 'measured')) <= 10 ? '알맞아요' : '너무 달라요'
    case 'g2-2-length-information-check': return n(p, 'hasUnit') === 1 ? '구할 수 있어요' : '단위가 더 필요해요'
    case 'g2-2-length-method-compare': return '1m 자로 재고 남은 cm를 잰다'
    default: throw new TypeError(`unsupported Grade 2 length draft family ${problem.familyId}`)
  }
}
