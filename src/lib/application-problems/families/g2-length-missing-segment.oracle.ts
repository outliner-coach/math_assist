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

export function evaluateG2LengthMissingSegmentOracle(
  input: ApplicationProofOracleInputV1,
): string {
  const measuredWholeCm = independentPositiveInteger(input.params, 'totalCm')
  const measuredKnownOneCm = independentPositiveInteger(input.params, 'knownA')
  const measuredKnownTwoCm = independentPositiveInteger(input.params, 'knownB')
  const remainderCm = measuredWholeCm - measuredKnownOneCm - measuredKnownTwoCm
  if (!Number.isSafeInteger(remainderCm) || remainderCm <= 0) {
    throw new RangeError('independent missing segment must be a positive safe integer')
  }
  return String(remainderCm)
}

export const G2_LENGTH_MISSING_SEGMENT_ORACLE = Object.freeze({
  evaluate: evaluateG2LengthMissingSegmentOracle,
})
