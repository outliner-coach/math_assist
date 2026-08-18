import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'

function n(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be an integer`)
  return value as number
}

export function oracleG2FactsProblem(problem: GeneratedApplicationProblemV1): string {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-2-facts-two-trays': return String((n(p, 'first-groups') + n(p, 'second-groups')) * n(p, 'each'))
    case 'g2-2-facts-missing-groups': return String(n(p, 'total') / n(p, 'each'))
    case 'g2-2-facts-product-error': return '나'
    case 'g2-2-facts-array-check':
      return n(p, 'rows-a') * n(p, 'cols-a') === n(p, 'rows-b') * n(p, 'cols-b') ? '같아요' : '달라요'
    default: throw new TypeError(`unsupported Grade 2 facts family ${problem.familyId}`)
  }
}
