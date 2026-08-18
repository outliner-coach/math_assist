import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'

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

export function oracleG2PlaceValueProblem(problem: GeneratedApplicationProblemV1): string {
  const params = problem.params
  switch (problem.familyId) {
    case 'g2-2-place-value-shop-order':
      return String(Math.max(n(params, 'first'), n(params, 'second'), n(params, 'third')))
    case 'g2-2-place-value-hidden-hundreds':
      return String(n(params, 'threshold-hundreds') + 1)
    case 'g2-2-place-value-claim-check':
      return n(params, 'first') > n(params, 'second') ? '가' : '나'
    case 'g2-2-place-value-card-constraint':
      return String(independentlyArrange(
        ['d1', 'd2', 'd3', 'd4'].map((key) => n(params, key)),
        n(params, 'limit'),
      ))
    default:
      throw new TypeError(`unsupported Grade 2 place-value family ${problem.familyId}`)
  }
}
