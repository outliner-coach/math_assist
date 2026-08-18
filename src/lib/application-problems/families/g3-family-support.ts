import type {
  ApplicationProblemFamilyV1,
  ApplicationReasoningPattern,
  GeneratedApplicationProblemV1,
  JsonValue,
  RequiredStudentAction,
} from '../contracts'
import { parseApplicationProblemFamilyV1 } from '../contracts'
import {
  generateApplicationProblem,
  type ApplicationProblemFamilyGeneratorV1,
} from '../generator'
import type { ApplicationProblemRuntimeV1 } from '../registry'
import type { ProblemRepresentation } from '../../types'
import { renderGrade3ApplicationContent } from './g3-content-renderer'
import {
  evaluateGrade3ApplicationOracle,
  verifyGrade3ApplicationProblem,
} from './g3-independent-verifier'
import { buildGrade3ApplicationScene, type G3VisualMode } from './g3-visual'

export type G3ApplicationCase = Readonly<Record<string, JsonValue>>

export interface G3ApplicationProofEvidence {
  authorityId: string
  mode: 'exhaustive'
  expectedCount: number
  checkedCount: number
  proven: boolean
  issues: readonly string[]
  verify(problem: GeneratedApplicationProblemV1): readonly string[]
}

export interface G3ApplicationFamilyRecipe {
  family: ApplicationProblemFamilyV1
  cases: readonly G3ApplicationCase[]
  generator: ApplicationProblemFamilyGeneratorV1
  runtime: ApplicationProblemRuntimeV1
  generate(input: { seed: number; variantIndex: number }): GeneratedApplicationProblemV1
  oracle(problem: GeneratedApplicationProblemV1): string
  verify(problem: GeneratedApplicationProblemV1): readonly string[]
  visualValidator(problem: GeneratedApplicationProblemV1): boolean
  proof: G3ApplicationProofEvidence
}

export interface G3ApplicationUnitContent {
  unitId: string
  pack: unknown
  coreConceptIds: readonly string[]
  requiredRepresentations: readonly ProblemRepresentation[]
  recipes: readonly G3ApplicationFamilyRecipe[]
}

export interface G3ApplicationFamilyDefinition {
  familyId: string
  packId: string
  unitId: string
  conceptIds: readonly string[]
  primaryStandard: string
  connectedStandards?: readonly string[]
  cognitiveDomain: 'applying' | 'reasoning'
  reasoningPattern: ApplicationReasoningPattern
  representations: readonly ProblemRepresentation[]
  estimatedSteps: number
  modelId: string
  unknownRole: string
  requiredStudentActions: readonly RequiredStudentAction[]
  misconceptionRefs: readonly string[]
  visualMode: G3VisualMode
  visualGeneratorId: string
  visualDescription: string
  cases: readonly G3ApplicationCase[]
}

const PENDING_APPROVAL = Object.freeze({
  ownerStatus: 'pending' as const,
  evidenceRefs: Object.freeze([]),
  expertStatus: 'not-reviewed' as const,
})

function stableIndex(seed: number, variantIndex: number, length: number): number {
  const seedIndex = ((seed % length) + length) % length
  return (seedIndex + ((variantIndex % length) + length) % length) % length
}

export function createGrade3ApplicationFamilyRecipe(
  definition: G3ApplicationFamilyDefinition,
): G3ApplicationFamilyRecipe {
  if (definition.cases.length < 3) {
    throw new RangeError(`${definition.familyId} must provide representative and boundary cases`)
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
    contextType: 'real_world',
    readingLoad: 'medium',
    estimatedSteps: definition.estimatedSteps,
    modelId: definition.modelId,
    unknownRole: definition.unknownRole,
    requiredStudentActions: [...definition.requiredStudentActions],
    misconceptionRefs: [...definition.misconceptionRefs],
    visualPolicy: {
      role: 'required',
      semantics: 'quantitative',
      generatorId: definition.visualGeneratorId,
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
      const rendered = renderGrade3ApplicationContent(family.familyId, params)
      return {
        params: { ...params },
        mathModel: buildGrade3ApplicationScene({
          familyId: family.familyId,
          params,
          answer: rendered.answer.normalized,
          mode: definition.visualMode,
          description: definition.visualDescription,
        }) as unknown as JsonValue,
      }
    },
    render: ({ params }) => renderGrade3ApplicationContent(family.familyId, params),
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
  const proofIssues: string[] = []
  let checkedCount = 0
  definition.cases.forEach((_, variantIndex) => {
    try {
      const first = generate({ seed: 0, variantIndex })
      const second = generate({ seed: 0, variantIndex })
      if (JSON.stringify(first) !== JSON.stringify(second)) {
        proofIssues.push(`${variantIndex}: generation is not deterministic`)
        return
      }
      const issues = verifyGrade3ApplicationProblem(first)
      if (issues.length > 0) {
        proofIssues.push(...issues.map((issue) => `${variantIndex}: ${issue}`))
        return
      }
      checkedCount += 1
    } catch (error) {
      proofIssues.push(`${variantIndex}: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
  const proof: G3ApplicationProofEvidence = Object.freeze({
    authorityId: `${family.familyId}-exhaustive-proof-v1`,
    mode: 'exhaustive' as const,
    expectedCount: definition.cases.length,
    checkedCount,
    proven: proofIssues.length === 0 && checkedCount === definition.cases.length,
    issues: Object.freeze(proofIssues),
    verify: (problem: GeneratedApplicationProblemV1) => verifyGrade3ApplicationProblem(problem),
  })
  return Object.freeze({
    family,
    cases: Object.freeze([...definition.cases]),
    generator,
    runtime,
    generate,
    oracle: evaluateGrade3ApplicationOracle,
    verify: verifyGrade3ApplicationProblem,
    visualValidator: (problem: GeneratedApplicationProblemV1) =>
      verifyGrade3ApplicationProblem(problem).every((issue) => (
        !issue.includes('visual')
        && !issue.includes('answer-only')
        && !issue.includes('disclosure')
      )),
    proof,
  })
}
