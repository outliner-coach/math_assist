import type {
  ApplicationProblemFamilyV1,
  GeneratedApplicationProblemV1,
  JsonValue,
} from '../contracts'
import {
  ApplicationVisualModelError,
  parseApplicationVisualSceneV1,
  type ApplicationVisualSceneV1,
} from '../visual-model'
import { validateApplicationVisualScene } from '../visual-validator'

export const G6_RATIO_ALLOWED_STANDARD_CODES = ['[6수02-02]', '[6수02-03]'] as const

export interface G6RatioGenerationInput {
  seed: number
  variantIndex: number
}

export interface G6RatioProofDomainEntry {
  caseId: string
  seed: number
  variantIndex: number
}

export interface G6RatioClosureIssue {
  code: string
  path: string
  message: string
}

export type G6RatioClosureResult =
  | { ok: true; issues: [] }
  | { ok: false; issues: G6RatioClosureIssue[] }

export function floorMod(value: number, modulus: number): number {
  if (!Number.isSafeInteger(value)) throw new TypeError('value must be a safe integer')
  if (!Number.isSafeInteger(modulus) || modulus < 1) {
    throw new TypeError('modulus must be a positive safe integer')
  }
  const remainder = value % modulus
  return remainder < 0 ? remainder + modulus : remainder
}

export function selectFiniteCaseIndex(
  seed: number,
  variantIndex: number,
  domainSize: number,
): number {
  if (!Number.isSafeInteger(variantIndex) || variantIndex < 0) {
    throw new TypeError('variantIndex must be a non-negative safe integer')
  }
  return (floorMod(seed, domainSize) + (variantIndex % domainSize)) % domainSize
}

function gcd(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) {
    const remainder = a % b
    a = b
    b = remainder
  }
  return a
}

export function normalizeGeneratorFraction(numerator: number, denominator: number): string {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator)) {
    throw new TypeError('fraction terms must be safe integers')
  }
  if (denominator === 0) throw new RangeError('fraction denominator must not be zero')
  const sign = denominator < 0 ? -1 : 1
  const signedNumerator = numerator * sign
  const positiveDenominator = denominator * sign
  if (signedNumerator === 0) return '0'
  const divisor = gcd(signedNumerator, positiveDenominator)
  const reducedNumerator = signedNumerator / divisor
  const reducedDenominator = positiveDenominator / divisor
  return reducedDenominator === 1
    ? String(reducedNumerator)
    : `${reducedNumerator}/${reducedDenominator}`
}

export function formatFiniteDecimal(numerator: number, denominator: number): string {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator === 0) {
    throw new TypeError('finite decimal terms must be safe integers with a non-zero denominator')
  }
  let remaining = Math.abs(denominator)
  while (remaining % 2 === 0) remaining /= 2
  while (remaining % 5 === 0) remaining /= 5
  if (remaining !== 1) throw new RangeError('fraction does not have a finite decimal expansion')
  return String(numerator / denominator)
}

export function formatGeneratorPercent(
  numerator: number,
  denominator: number,
): { text: string; numericValue: number } {
  if (denominator === 0) throw new RangeError('ratio denominator must not be zero')
  return {
    text: normalizeGeneratorFraction(numerator * 100, denominator),
    numericValue: (numerator * 100) / denominator,
  }
}

export function readSafeInteger(
  params: Readonly<Record<string, JsonValue>>,
  key: string,
): number {
  const value = params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be a safe integer`)
  return value as number
}

export function readString(
  params: Readonly<Record<string, JsonValue>>,
  key: string,
): string {
  const value = params[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${key} must be a non-empty string`)
  }
  return value
}

function canonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJson)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, canonicalJson((value as Record<string, unknown>)[key])]),
    )
  }
  return value
}

export function stableJson(value: unknown): string {
  return JSON.stringify(canonicalJson(value))
}

export function createProofDomain(prefix: string, count: number): readonly G6RatioProofDomainEntry[] {
  return Object.freeze(
    Array.from({ length: count }, (_, index) =>
      Object.freeze({
        caseId: `${prefix}-${String(index + 1).padStart(3, '0')}`,
        seed: index,
        variantIndex: 0,
      }),
    ),
  )
}

export function closureResult(issues: G6RatioClosureIssue[]): G6RatioClosureResult {
  return issues.length === 0 ? { ok: true, issues: [] } : { ok: false, issues }
}

export function addClosureIssue(
  issues: G6RatioClosureIssue[],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message })
}

export function validateSceneClosure(
  actual: JsonValue | undefined,
  expected: ApplicationVisualSceneV1,
  issues: G6RatioClosureIssue[],
): ApplicationVisualSceneV1 | undefined {
  if (actual === undefined) {
    addClosureIssue(issues, 'missing_scene', 'problem.visual.mathModel', 'visual scene is required')
    return undefined
  }
  let parsed: ApplicationVisualSceneV1
  try {
    parsed = parseApplicationVisualSceneV1(actual)
  } catch (error) {
    const message =
      error instanceof ApplicationVisualModelError
        ? error.issues.map((entry) => entry.message).join('; ')
        : 'visual scene is invalid'
    addClosureIssue(issues, 'invalid_scene', 'problem.visual.mathModel', message)
    return undefined
  }
  const common = validateApplicationVisualScene(parsed)
  if (!common.ok) {
    common.issues.forEach((entry) =>
      addClosureIssue(issues, entry.code, entry.path, entry.message),
    )
  }
  if (stableJson(parsed) !== stableJson(expected)) {
    addClosureIssue(
      issues,
      'scene_params_mismatch',
      'problem.visual.mathModel',
      'visual scene must be the exact scene derived from problem params',
    )
  }
  return parsed
}

type ScopeSubject = ApplicationProblemFamilyV1 | GeneratedApplicationProblemV1

const FORBIDDEN_SCOPE_LANGUAGE = ['비례식', '비례배분', '미지항'] as const

export function findG6RatioScopeViolations(subject: ScopeSubject): string[] {
  const standards =
    'curriculumCodes' in subject
      ? subject.curriculumCodes
      : [subject.primaryStandard, ...subject.connectedStandards]
  const allowed = new Set<string>(G6_RATIO_ALLOWED_STANDARD_CODES)
  const violations = standards
    .filter((standard) => !allowed.has(standard))
    .map((standard) => `standard:${standard}`)
  if ('prompt' in subject) {
    const instructionalText = [subject.prompt, ...subject.solutionSteps, ...subject.hintSteps].join('\n')
    for (const term of FORBIDDEN_SCOPE_LANGUAGE) {
      if (instructionalText.includes(term)) violations.push(`language:${term}`)
    }
  }
  return Array.from(new Set(violations))
}
