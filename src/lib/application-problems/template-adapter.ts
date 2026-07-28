import type { ApplicationProblemSource, Problem } from '../types'
import {
  parseGeneratedApplicationProblemV1,
  type GeneratedApplicationProblemV1,
  type GeneratedApplicationVisualV1,
  type JsonValue,
} from './contracts'

export interface ApplicationPracticePlacementV1 {
  index: number
  templateId: string
  setId: 'A' | 'B' | 'C'
  difficulty: 1 | 2 | 3
}

export type ApplicationPracticeProblemV1 = Problem & {
  placementDifficulty: 1 | 2 | 3
  applicationSource: ApplicationProblemSource
  applicationParams: Record<string, JsonValue>
  applicationMisconceptionRefs: string[]
  applicationVisual: GeneratedApplicationVisualV1
}

export interface AdaptApplicationProblemToPracticeInputV1 {
  problem: GeneratedApplicationProblemV1
  placement: ApplicationPracticePlacementV1
  mapParams(params: Readonly<Record<string, JsonValue>>): Record<string, number>
  mapVisual?(visual: GeneratedApplicationProblemV1['visual']): Problem['visual']
}

export function applicationProblemSourceOf(
  problem: GeneratedApplicationProblemV1,
): ApplicationProblemSource {
  return {
    schemaVersion: 'generated-application-problem-v1',
    instanceId: problem.instanceId,
    familyId: problem.familyId,
    generatorVersion: problem.generatorVersion,
    packId: problem.packId,
    packVersion: problem.packVersion,
    seed: problem.seed,
    variantIndex: problem.variantIndex,
    curriculumCodes: [...problem.curriculumCodes],
  }
}

function validatePlacement(placement: ApplicationPracticePlacementV1): void {
  if (!Number.isSafeInteger(placement.index) || placement.index < 0) {
    throw new RangeError('placement.index must be a non-negative safe integer')
  }
  if (typeof placement.templateId !== 'string' || placement.templateId.trim() === '') {
    throw new TypeError('placement.templateId must be a non-empty string')
  }
  if (!['A', 'B', 'C'].includes(placement.setId)) {
    throw new TypeError('placement.setId must be A, B, or C')
  }
  if (![1, 2, 3].includes(placement.difficulty)) {
    throw new TypeError('placement.difficulty must be 1, 2, or 3')
  }
}

function validateLegacyParams(params: Record<string, number>): Record<string, number> {
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    throw new TypeError('mapParams must return a numeric params object')
  }
  Object.entries(params).forEach(([key, value]) => {
    if (key.trim() === '' || typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError('mapParams must return finite numeric values with non-empty keys')
    }
  })
  return { ...params }
}

function canonicalJsonCopy(value: unknown, seen = new Set<object>()): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value as JsonValue
  }
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('application snapshots must contain only JSON-safe values')
  }
  if (seen.has(value)) {
    throw new TypeError('application snapshots must not contain cycles')
  }

  seen.add(value)
  if (Array.isArray(value)) {
    const result = value.map((entry) => canonicalJsonCopy(entry, seen))
    seen.delete(value)
    return result
  }

  const result: Record<string, JsonValue> = {}
  Object.keys(value as Record<string, unknown>)
    .sort((left, right) => left.localeCompare(right))
    .forEach((key) => {
      result[key] = canonicalJsonCopy((value as Record<string, unknown>)[key], seen)
    })
  seen.delete(value)
  return result
}

function canonicalApplicationParams(
  params: Readonly<Record<string, JsonValue>>,
): Record<string, JsonValue> {
  return canonicalJsonCopy(params) as Record<string, JsonValue>
}

function canonicalApplicationVisual(
  visual: GeneratedApplicationVisualV1,
): GeneratedApplicationVisualV1 {
  return canonicalJsonCopy(visual) as unknown as GeneratedApplicationVisualV1
}

function canonicalPracticeVisual(
  visual: NonNullable<Problem['visual']>,
): NonNullable<Problem['visual']> {
  return canonicalJsonCopy(visual) as unknown as NonNullable<Problem['visual']>
}

export function adaptGeneratedApplicationProblemToPractice(
  input: AdaptApplicationProblemToPracticeInputV1,
): ApplicationPracticeProblemV1 {
  const problem = parseGeneratedApplicationProblemV1(input.problem)
  validatePlacement(input.placement)
  if (typeof input.mapParams !== 'function') {
    throw new TypeError('mapParams callback is required')
  }
  if (problem.answer.format === 'text') {
    throw new TypeError('text application answers cannot use the numeric practice shell')
  }

  const applicationParams = canonicalApplicationParams(problem.params)
  const applicationMisconceptionRefs = [...problem.misconceptionRefs]
  const applicationVisual = canonicalApplicationVisual(problem.visual)
  const params = validateLegacyParams(input.mapParams(problem.params))
  const mappedVisual = input.mapVisual?.(problem.visual)
  const visual = mappedVisual === undefined ? undefined : canonicalPracticeVisual(mappedVisual)
  const choice = problem.answer.format === 'choice'

  return {
    index: input.placement.index,
    templateId: input.placement.templateId,
    setId: input.placement.setId,
    placementDifficulty: input.placement.difficulty,
    params,
    prompt: problem.prompt,
    type: choice ? 'choice' : 'number',
    ...(choice ? { choices: [...problem.choices!] } : {}),
    correctAnswer: problem.answer.normalized,
    ...(choice ? { correctChoiceIndex: problem.correctChoiceIndex } : {}),
    solutionSteps: [...problem.solutionSteps],
    hintSteps: [...problem.hintSteps],
    problemFamily: problem.familyId,
    applicationSource: applicationProblemSourceOf(problem),
    applicationParams,
    applicationMisconceptionRefs,
    applicationVisual,
    ...(visual === undefined ? {} : { visual }),
  }
}

export function hasApplicationProblemSource(
  problem: Problem,
): problem is Problem & { applicationSource: ApplicationProblemSource } {
  return Boolean(problem) && typeof problem === 'object' &&
    problem.applicationSource?.schemaVersion === 'generated-application-problem-v1'
}

/**
 * Distinguishes a genuinely legacy practice snapshot from a damaged application
 * snapshot whose provenance was removed. Every application adapter writes all of
 * these markers; retaining any one of them must keep the problem on the strict
 * validation path.
 */
export function hasApplicationProblemFootprint(problem: Problem): boolean {
  if (!problem || typeof problem !== 'object' || Array.isArray(problem)) return true
  const candidate = problem as unknown as Record<string, unknown>
  return (
    problem.templateId.startsWith('application-') ||
    (typeof problem.problemFamily === 'string' && /^g[56]-/.test(problem.problemFamily)) ||
    'applicationSource' in candidate ||
    'applicationParams' in candidate ||
    'applicationMisconceptionRefs' in candidate ||
    'applicationVisual' in candidate ||
    'placementDifficulty' in candidate
  )
}

export function isApplicationPracticeProblem(
  problem: Problem,
): problem is ApplicationPracticeProblemV1 {
  const candidate = problem as Partial<ApplicationPracticeProblemV1>
  return (
    hasApplicationProblemSource(problem) &&
    typeof candidate.applicationParams === 'object' &&
    candidate.applicationParams !== null &&
    !Array.isArray(candidate.applicationParams) &&
    Array.isArray(candidate.applicationMisconceptionRefs) &&
    typeof candidate.applicationVisual === 'object' &&
    candidate.applicationVisual !== null &&
    [1, 2, 3].includes(candidate.placementDifficulty as number)
  )
}

/** Rebuilds the common immutable problem view from a saved Grade 5/6 shell. */
export function restoreGeneratedApplicationProblemFromPractice(
  problem: Problem,
): GeneratedApplicationProblemV1 | null {
  if (!isApplicationPracticeProblem(problem)) return null
  try {
    return parseGeneratedApplicationProblemV1({
      ...problem.applicationSource,
      params: problem.applicationParams,
      prompt: problem.prompt,
      answer: {
        format: problem.type === 'choice' ? 'choice' : 'number',
        normalized: problem.correctAnswer,
      },
      ...(problem.type === 'choice'
        ? {
            choices: problem.choices,
            correctChoiceIndex: problem.correctChoiceIndex,
          }
        : {}),
      solutionSteps: problem.solutionSteps,
      hintSteps: problem.hintSteps ?? [],
      misconceptionRefs: problem.applicationMisconceptionRefs,
      visual: problem.applicationVisual,
    })
  } catch {
    return null
  }
}
