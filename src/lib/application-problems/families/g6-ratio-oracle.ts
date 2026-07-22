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

function reducedOracleTerms(
  numerator: bigint,
  denominator: bigint,
): { numerator: bigint; denominator: bigint } {
  requireDenominator(denominator)
  const sign = denominator < BigInt(0) ? -BigInt(1) : BigInt(1)
  const signedNumerator = numerator * sign
  const positiveDenominator = denominator * sign
  if (signedNumerator === BigInt(0)) {
    return { numerator: BigInt(0), denominator: BigInt(1) }
  }
  const divisor = oracleGcd(signedNumerator, positiveDenominator)
  return {
    numerator: signedNumerator / divisor,
    denominator: positiveDenominator / divisor,
  }
}

export function normalizeOracleFraction(numerator: bigint, denominator: bigint): string {
  const reduced = reducedOracleTerms(numerator, denominator)
  return reduced.denominator === BigInt(1)
    ? reduced.numerator.toString()
    : `${reduced.numerator}/${reduced.denominator}`
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

function bigintPower(base: bigint, exponent: number): bigint {
  let result = BigInt(1)
  for (let index = 0; index < exponent; index += 1) result *= base
  return result
}

function finiteOracleDecimal(numerator: bigint, denominator: bigint): string {
  const reduced = reducedOracleTerms(numerator, denominator)
  let remaining = reduced.denominator
  let twos = 0
  let fives = 0
  while (remaining % BigInt(2) === BigInt(0)) {
    remaining /= BigInt(2)
    twos += 1
  }
  while (remaining % BigInt(5) === BigInt(0)) {
    remaining /= BigInt(5)
    fives += 1
  }
  if (remaining !== BigInt(1)) {
    throw new TypeError('representation denominator must have a finite decimal expansion')
  }
  const scale = Math.max(twos, fives)
  const scaledNumerator =
    reduced.numerator *
    bigintPower(BigInt(2), scale - twos) *
    bigintPower(BigInt(5), scale - fives)
  if (scale === 0) return scaledNumerator.toString()
  const sign = scaledNumerator < BigInt(0) ? '-' : ''
  const digits = absolute(scaledNumerator).toString().padStart(scale + 1, '0')
  const integerPart = digits.slice(0, -scale)
  const fractionalPart = digits.slice(-scale).replace(/0+$/, '')
  return fractionalPart ? `${sign}${integerPart}.${fractionalPart}` : `${sign}${integerPart}`
}

interface OracleRational {
  numerator: bigint
  denominator: bigint
}

function parseOracleDecimal(value: string, claimKey: string): OracleRational {
  const match = value.match(/^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/)
  if (!match) throw new TypeError(`${claimKey} claim contains a non-canonical number`)
  const fractional = match[3] ?? ''
  const denominator = bigintPower(BigInt(10), fractional.length)
  const combined = BigInt(`${match[2]}${fractional}`)
  return {
    numerator: match[1] === '-' ? -combined : combined,
    denominator,
  }
}

function parseOracleFraction(value: string, claimKey: string): OracleRational {
  const [numeratorText, denominatorText] = value.split('/')
  if (denominatorText === undefined) {
    return parseOracleDecimal(numeratorText, claimKey)
  }
  if (!/^-?(?:0|[1-9]\d*)$/.test(numeratorText) || !/^[1-9]\d*$/.test(denominatorText)) {
    throw new TypeError(`${claimKey} claim contains a non-canonical fraction`)
  }
  return { numerator: BigInt(numeratorText), denominator: BigInt(denominatorText) }
}

function parseRepresentationClaim(key: string, claim: string): OracleRational {
  const patterns: Record<string, RegExp> = {
    fractionClaim: /^분수 주장: 비교하는 양\/기준량은 (.+)입니다\.$/,
    decimalClaim: /^소수 주장: 같은 비율은 (.+)입니다\.$/,
    percentClaim: /^백분율 주장: 같은 비율은 (.+)%입니다\.$/,
    hundredthsClaim: /^분모가 100인 분수 주장: 같은 비율은 (.+)\/100입니다\.$/,
  }
  const match = claim.match(patterns[key])
  if (!match) throw new TypeError(`${key} claim has an invalid form`)
  if (key === 'fractionClaim') return parseOracleFraction(match[1], key)
  const parsed = parseOracleDecimal(match[1], key)
  if (key === 'percentClaim' || key === 'hundredthsClaim') {
    return { numerator: parsed.numerator, denominator: parsed.denominator * BigInt(100) }
  }
  return parsed
}

function assertCanonicalClaim(key: string, claim: string, allowed: readonly string[]): void {
  if (!allowed.includes(claim)) {
    throw new TypeError(`${key} claim is not a canonical Grade 6 representation claim`)
  }
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
  const numerator = integerParam(input, 'numerator')
  const denominator = integerParam(input, 'denominator')
  requireDenominator(denominator)
  if (numerator <= BigInt(0) || denominator <= BigInt(0) || numerator >= denominator) {
    throw new RangeError('representation ratio must be a positive proper fraction')
  }

  const fraction = normalizeOracleFraction(numerator, denominator)
  const invertedFraction = normalizeOracleFraction(denominator, numerator)
  const decimal = finiteOracleDecimal(numerator, denominator)
  const percent = normalizeOracleFraction(numerator * BigInt(100), denominator)
  if (percent.includes('/')) {
    throw new TypeError('representation percent must be integral in the finite proof domain')
  }

  const claims = [
    {
      key: 'fractionClaim',
      value: stringParam(input, 'fractionClaim'),
      allowed: [
        `분수 주장: 비교하는 양/기준량은 ${fraction}입니다.`,
        `분수 주장: 비교하는 양/기준량은 ${invertedFraction}입니다.`,
      ],
    },
    {
      key: 'decimalClaim',
      value: stringParam(input, 'decimalClaim'),
      allowed: [`소수 주장: 같은 비율은 ${decimal}입니다.`],
    },
    {
      key: 'percentClaim',
      value: stringParam(input, 'percentClaim'),
      allowed: [
        `백분율 주장: 같은 비율은 ${percent}%입니다.`,
        `백분율 주장: 같은 비율은 ${decimal}%입니다.`,
      ],
    },
    {
      key: 'hundredthsClaim',
      value: stringParam(input, 'hundredthsClaim'),
      allowed: [
        `분모가 100인 분수 주장: 같은 비율은 ${percent}/100입니다.`,
        `분모가 100인 분수 주장: 같은 비율은 ${numerator}/100입니다.`,
      ],
    },
  ] as const

  const erroneousClaims: string[] = []
  for (const claim of claims) {
    assertCanonicalClaim(claim.key, claim.value, claim.allowed)
    const represented = parseRepresentationClaim(claim.key, claim.value)
    if (
      compareOracleFractions(
        represented.numerator,
        represented.denominator,
        numerator,
        denominator,
      ) !== 0
    ) {
      erroneousClaims.push(claim.value)
    }
  }
  if (erroneousClaims.length !== 1) {
    throw new TypeError('representation claims must contain exactly one erroneous claim')
  }
  return erroneousClaims[0]
}
