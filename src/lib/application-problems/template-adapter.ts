import type { ApplicationProblemSource, Problem } from '../types'
import {
  parseGeneratedApplicationProblemV1,
  type GeneratedApplicationProblemV1,
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

  const params = validateLegacyParams(input.mapParams(problem.params))
  const visual = input.mapVisual?.(problem.visual)
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
    ...(visual === undefined ? {} : { visual }),
  }
}

export function hasApplicationProblemSource(
  problem: Problem,
): problem is Problem & { applicationSource: ApplicationProblemSource } {
  return problem.applicationSource?.schemaVersion === 'generated-application-problem-v1'
}
