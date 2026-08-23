import type { JsonValue } from '../contracts'
import type { ApplicationProofOracleInputV1 } from '../proof'

function independentPositiveInteger(
  params: Readonly<Record<string, JsonValue>>,
  key: string,
): number {
  const value = params[key]
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new TypeError(`${key} must be a positive integer number of centimeters`)
  }
  return value as number
}

export function evaluateG2LengthRouteTotalOracle(
  input: ApplicationProofOracleInputV1,
): string {
  const firstMeasuredCm = independentPositiveInteger(input.params, 'longCm')
  const secondMeasuredCm = independentPositiveInteger(input.params, 'middleCm')
  const thirdMeasuredCm = independentPositiveInteger(input.params, 'lastCm')
  const independentlyMeasuredWhole = [
    firstMeasuredCm,
    secondMeasuredCm,
    thirdMeasuredCm,
  ].reduce((whole, measured) => whole + measured, 0)
  if (!Number.isSafeInteger(independentlyMeasuredWhole)) {
    throw new RangeError('independent route total exceeds the safe integer range')
  }
  return String(independentlyMeasuredWhole)
}

export const G2_LENGTH_ROUTE_TOTAL_ORACLE = Object.freeze({
  evaluate: evaluateG2LengthRouteTotalOracle,
})
