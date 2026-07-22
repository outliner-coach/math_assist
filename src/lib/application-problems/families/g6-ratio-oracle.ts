import type { ApplicationProofOracleInputV1 } from '../proof-trust.internal'

function absolute(value: bigint): bigint {
  return value < BigInt(0) ? -value : value
}

function oracleGcd(left: bigint, right: bigint): bigint {
  let a = absolute(left)
  let b = absolute(right)
  while (b !== BigInt(0)) {
    const remainder = a % b
    a = b
    b = remainder
  }
  return a
}

function requireDenominator(value: bigint): void {
  if (value === BigInt(0)) throw new RangeError('oracle denominator must not be zero')
}

export function normalizeOracleFraction(numerator: bigint, denominator: bigint): string {
  requireDenominator(denominator)
  if (numerator === BigInt(0)) return '0'
  const sign = denominator < BigInt(0) ? -BigInt(1) : BigInt(1)
  const signedNumerator = numerator * sign
  const positiveDenominator = denominator * sign
  const divisor = oracleGcd(signedNumerator, positiveDenominator)
  const reducedNumerator = signedNumerator / divisor
  const reducedDenominator = positiveDenominator / divisor
  return reducedDenominator === BigInt(1)
    ? reducedNumerator.toString()
    : `${reducedNumerator}/${reducedDenominator}`
}

export function compareOracleFractions(
  leftNumerator: bigint,
  leftDenominator: bigint,
  rightNumerator: bigint,
  rightDenominator: bigint,
): -1 | 0 | 1 {
  requireDenominator(leftDenominator)
  requireDenominator(rightDenominator)
  const leftSign = leftDenominator < BigInt(0) ? -BigInt(1) : BigInt(1)
  const rightSign = rightDenominator < BigInt(0) ? -BigInt(1) : BigInt(1)
  const left = leftNumerator * leftSign * absolute(rightDenominator)
  const right = rightNumerator * rightSign * absolute(leftDenominator)
  return left === right ? 0 : left > right ? 1 : -1
}

function integerParam(input: ApplicationProofOracleInputV1, key: string): bigint {
  const value = input.params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be a safe integer`)
  return BigInt(value as number)
}

function stringParam(input: ApplicationProofOracleInputV1, key: string): string {
  const value = input.params[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${key} must be a non-empty string`)
  }
  return value
}

export function evaluateG6RatioPartWholeOracle(
  input: ApplicationProofOracleInputV1,
): string {
  return normalizeOracleFraction(integerParam(input, 'missing'), integerParam(input, 'total'))
}

export function evaluateG6RatioRelativeComparisonOracle(
  input: ApplicationProofOracleInputV1,
): string {
  const comparison = compareOracleFractions(
    integerParam(input, 'leftSuccesses'),
    integerParam(input, 'leftTotal'),
    integerParam(input, 'rightSuccesses'),
    integerParam(input, 'rightTotal'),
  )
  if (comparison === 0) return '두 모둠의 성공 비율이 같습니다.'
  const label = comparison > 0 ? stringParam(input, 'leftLabel') : stringParam(input, 'rightLabel')
  return `${label}의 성공 비율이 더 높습니다.`
}

export function evaluateG6RatioRepresentationCheckOracle(
  input: ApplicationProofOracleInputV1,
): string {
  const mode = stringParam(input, 'errorMode')
  const key =
    mode === 'decimal-percent-shift'
      ? 'percentClaim'
      : mode === 'reference-inversion'
        ? 'fractionClaim'
        : mode === 'numerator-only'
          ? 'hundredthsClaim'
          : undefined
  if (!key) throw new TypeError('errorMode is unsupported')
  return stringParam(input, key)
}
