import type { JsonValue } from '../contracts'
import type { ApplicationProofOracleInputV1 } from '../proof'

function integer(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be a safe integer`)
  return value as number
}

export function evaluateG2LengthClaimCheckOracle(
  input: ApplicationProofOracleInputV1,
): string {
  const scenario = input.params.scenario
  let independentlyComputedCm: number
  if (scenario === 'route-total') {
    independentlyComputedCm =
      integer(input.params, 'longCm') +
      integer(input.params, 'middleCm') +
      integer(input.params, 'lastCm')
  } else if (scenario === 'missing-segment') {
    independentlyComputedCm =
      integer(input.params, 'totalCm') -
      integer(input.params, 'knownA') -
      integer(input.params, 'knownB')
  } else {
    throw new TypeError('claim oracle requires a known measurement scenario')
  }
  if (!Number.isSafeInteger(independentlyComputedCm) || independentlyComputedCm <= 0) {
    throw new RangeError('independent claim value must be a positive safe integer')
  }

  const claims = [integer(input.params, 'claimACm'), integer(input.params, 'claimBCm')]
  const evaluations = claims.map((claim) => claim === independentlyComputedCm)
  if (evaluations.filter(Boolean).length !== 1) {
    throw new Error('independent claim evaluation requires exactly one true speaker')
  }
  return evaluations[0] ? '가' : '나'
}

export const G2_LENGTH_CLAIM_CHECK_ORACLE = Object.freeze({
  evaluate: evaluateG2LengthClaimCheckOracle,
})
