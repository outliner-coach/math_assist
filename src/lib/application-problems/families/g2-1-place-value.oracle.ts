import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'

function value(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const candidate = params[key]
  if (!Number.isSafeInteger(candidate)) throw new TypeError(`${key} must be an integer`)
  return candidate as number
}

export function evaluateG2SemesterOnePlaceValueOracle(problem: GeneratedApplicationProblemV1): string {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-1-place-value-build-number':
      return String(value(p, 'hundreds') * 100 + value(p, 'tens') * 10 + value(p, 'ones'))
    case 'g2-1-place-value-compare-orders':
      return String(value(p, 'left') > value(p, 'right') ? value(p, 'left') : value(p, 'right'))
    case 'g2-1-place-value-missing-digit': {
      const whole = value(p, 'hundreds') * 100 + value(p, 'tens') * 10 + value(p, 'ones')
      return String(Math.floor((whole % 100) / 10))
    }
    case 'g2-1-place-value-claim-check':
      return value(p, 'aValue') === value(p, 'number') ? '가' : '나'
    case 'g2-1-place-value-between-check': {
      const low = value(p, 'low'); const candidate = value(p, 'candidate'); const high = value(p, 'high')
      if (!(low < candidate && candidate < high)) throw new RangeError('candidate must satisfy both bounds')
      return String(candidate)
    }
    default:
      throw new TypeError(`unknown Grade 2 place-value family ${problem.familyId}`)
  }
}
