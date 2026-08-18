import {
  parseApplicationProblemFamilyV1,
  type ApplicationProblemFamilyV1,
  type ApplicationReasoningPattern,
  type GeneratedApplicationProblemV1,
  type JsonValue,
  type RequiredStudentAction,
} from '../contracts'
import {
  generateApplicationProblem,
  type ApplicationProblemFamilyGeneratorV1,
  type ApplicationProblemRenderedContentV1,
} from '../generator'
import type { ApplicationProblemRuntimeV1 } from '../registry'
import type { ApplicationVisualSceneV1 } from '../visual-model'
import type { ApplicationVisualValidationIssue } from '../visual-validator'
import type {
  ProblemContextType,
  ProblemRepresentation,
  ReadingLoad,
  VisualSemantics,
} from '../../types'
import { verifyIndependentG2SemesterOneProblem } from './g2-1-independent-verifier'
import type { G2ContractIssue } from './g2-1-contract-support'

export type G2SemesterOneCase = Readonly<Record<string, JsonValue>>

export interface G2SemesterOneFamilyRecipe {
  family: ApplicationProblemFamilyV1
  cases: readonly G2SemesterOneCase[]
  generator: ApplicationProblemFamilyGeneratorV1
  runtime: ApplicationProblemRuntimeV1
  generate(input: { seed: number; variantIndex: number }): GeneratedApplicationProblemV1
  validateScene(
    scene: Readonly<ApplicationVisualSceneV1>,
    params: Readonly<Record<string, JsonValue>>,
  ): ApplicationVisualValidationIssue[]
  validateContract(problem: GeneratedApplicationProblemV1): G2ContractIssue[]
  proofEvidence: G2SemesterOneProofEvidence
}

export interface G2SemesterOneProofEvidence {
  exhaustive: true
  boundaryClasses: readonly string[]
  invariants: readonly string[]
  cases: readonly { variantIndex: number; classes: readonly string[] }[]
}

export interface G2SemesterOneFamilyDefinition {
  familyId: string
  packId: string
  unitId: string
  conceptIds: readonly string[]
  primaryStandard: string
  connectedStandards?: readonly string[]
  cognitiveDomain: 'applying' | 'reasoning'
  reasoningPattern: ApplicationReasoningPattern
  representations: readonly ProblemRepresentation[]
  contextType?: ProblemContextType
  readingLoad?: ReadingLoad
  estimatedSteps: number
  modelId: string
  unknownRole: string
  requiredStudentActions: readonly RequiredStudentAction[]
  misconceptionRefs: readonly string[]
  visual: {
    semantics: VisualSemantics
    generatorId: string
  }
  cases: readonly G2SemesterOneCase[]
  render(params: Readonly<Record<string, JsonValue>>): ApplicationProblemRenderedContentV1
  scene(
    params: Readonly<Record<string, JsonValue>>,
    rendered: ApplicationProblemRenderedContentV1,
  ): ApplicationVisualSceneV1
}

const PENDING_APPROVAL = Object.freeze({
  ownerStatus: 'pending' as const,
  evidenceRefs: Object.freeze([]),
  expertStatus: 'not-reviewed' as const,
})

function stableIndex(seed: number, variantIndex: number, length: number): number {
  const seedIndex = ((seed % length) + length) % length
  return (seedIndex + (variantIndex % length)) % length
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function buildProofEvidence(
  familyId: string,
  cases: readonly G2SemesterOneCase[],
): G2SemesterOneProofEvidence {
  const keys = Array.from(new Set(cases.flatMap((reviewedCase) => Object.keys(reviewedCase)))).sort()
  const classesByCase = cases.map(() => new Set<string>())
  const boundaryClasses: string[] = []
  for (const key of keys) {
    const values = cases.map((reviewedCase) => reviewedCase[key])
    if (values.every(Number.isSafeInteger)) {
      const numericValues = values as number[]
      const minimum = Math.min(...numericValues)
      const maximum = Math.max(...numericValues)
      for (const [suffix, target] of minimum === maximum
        ? [['fixed', minimum] as const]
        : [['minimum', minimum] as const, ['maximum', maximum] as const]) {
        const classId = `${familyId}-${key}-${suffix}`
        boundaryClasses.push(classId)
        numericValues.forEach((value, index) => {
          if (value === target) classesByCase[index].add(classId)
        })
      }
      continue
    }
    const distinctValues = Array.from(new Set(values.map((value) => stableJson(value))))
    distinctValues.forEach((value) => {
      const classId = `${familyId}-${key}-${value.replace(/[^a-zA-Z0-9가-힣]+/g, '-').slice(0, 24)}`
      boundaryClasses.push(classId)
      values.forEach((candidate, index) => {
        if (stableJson(candidate) === value) classesByCase[index].add(classId)
      })
    })
  }
  cases.forEach((_, index) => {
    if (classesByCase[index].size === 0) classesByCase[index].add(`${familyId}-finite-case-${index}`)
  })
  return Object.freeze({
    exhaustive: true as const,
    boundaryClasses: Object.freeze(Array.from(new Set(boundaryClasses))),
    invariants: Object.freeze([
      `${familyId} uses exactly ${cases.length} reviewed static variants`,
      'familyId, version, seed, and variant reproduce the same normalized problem',
      'independent raw-parameter verification covers prompt, answer, choices, solution, hints, and visual',
    ]),
    cases: Object.freeze(classesByCase.map((classes, variantIndex) => Object.freeze({
      variantIndex,
      classes: Object.freeze(Array.from(classes)),
    }))),
  })
}

export function createG2SemesterOneFamilyRecipe(
  definition: G2SemesterOneFamilyDefinition,
): G2SemesterOneFamilyRecipe {
  if (definition.cases.length < 3) {
    throw new RangeError(`${definition.familyId} must declare representative and boundary cases`)
  }
  const family = parseApplicationProblemFamilyV1({
    schemaVersion: 'application-problem-family-v1',
    familyId: definition.familyId,
    version: 1,
    packId: definition.packId,
    unitId: definition.unitId,
    conceptIds: [...definition.conceptIds],
    primaryStandard: definition.primaryStandard,
    connectedStandards: [...(definition.connectedStandards ?? [])],
    cognitiveDomain: definition.cognitiveDomain,
    reasoningPattern: definition.reasoningPattern,
    representations: [...definition.representations],
    contextType: definition.contextType ?? 'real_world',
    readingLoad: definition.readingLoad ?? 'low',
    estimatedSteps: definition.estimatedSteps,
    modelId: definition.modelId,
    unknownRole: definition.unknownRole,
    requiredStudentActions: [...definition.requiredStudentActions],
    misconceptionRefs: [...definition.misconceptionRefs],
    visualPolicy: {
      role: 'required',
      semantics: definition.visual.semantics,
      generatorId: definition.visual.generatorId,
      answerCritical: true,
    },
    proofMode: 'exhaustive',
    runtimeMode: 'deterministic-generator',
    releaseStatus: 'draft',
    approval: PENDING_APPROVAL,
  })
  const generator: ApplicationProblemFamilyGeneratorV1 = {
    familyId: family.familyId,
    version: family.version,
    packId: family.packId,
    packVersion: 1,
    maxAttempts: 1,
    visualGeneratorVersion: 1,
    sample: ({ seed, variantIndex }) => {
      const params = definition.cases[stableIndex(seed, variantIndex, definition.cases.length)]
      const rendered = definition.render(params)
      return { params: { ...params }, mathModel: definition.scene(params, rendered) as unknown as JsonValue }
    },
    render: ({ params }) => definition.render(params),
  }
  const generate = (input: { seed: number; variantIndex: number }) =>
    generateApplicationProblem({
      family,
      generator,
      packVersion: 1,
      seed: input.seed,
      variantIndex: input.variantIndex,
    })
  const runtime: ApplicationProblemRuntimeV1 = Object.freeze({
    kind: 'deterministic-generator' as const,
    generator,
  })
  const proofEvidence = buildProofEvidence(family.familyId, definition.cases)
  return Object.freeze({
    family,
    cases: Object.freeze([...definition.cases]),
    generator,
    runtime,
    generate,
    proofEvidence,
    validateContract: verifyIndependentG2SemesterOneProblem,
    validateScene: (
      scene: Readonly<ApplicationVisualSceneV1>,
      params: Readonly<Record<string, JsonValue>>,
    ) => {
      try {
        const rendered = definition.render(params)
        const expected = definition.scene(params, rendered)
        return stableJson(scene) === stableJson(expected)
          ? []
          : [{
              code: 'g2_semester_one_scene_mismatch',
              path: 'problem.visual.mathModel',
              message: `${family.familyId} visual must be derived from its exact problem parameters`,
            }]
      } catch {
        return [{
          code: 'g2_semester_one_scene_invalid_params',
          path: 'problem.params',
          message: `${family.familyId} visual parameters are outside the reviewed finite domain`,
        }]
      }
    },
  })
}

export function numberParam(
  params: Readonly<Record<string, JsonValue>>,
  key: string,
): number {
  const value = params[key]
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new TypeError(`${key} must be a non-negative safe integer`)
  }
  return value as number
}

export function stringParam(
  params: Readonly<Record<string, JsonValue>>,
  key: string,
): string {
  const value = params[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${key} must be a non-empty string`)
  }
  return value
}
