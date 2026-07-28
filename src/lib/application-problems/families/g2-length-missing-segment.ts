import {
  parseApplicationProblemFamilyV1,
  type ApplicationProblemFamilyV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from '../contracts'
import {
  generateApplicationProblem,
  type ApplicationProblemFamilyGeneratorV1,
} from '../generator'
import type { ApplicationVisualSceneV1 } from '../visual-model'
import type { ApplicationVisualValidationIssue } from '../visual-validator'
import {
  buildG2ConnectedLengthScene,
  formatG2MixedLength,
  givenText,
  identifierThenSolution,
  stableG2LengthCaseIndex,
  validateExactG2LengthScene,
} from './g2-length-scene'

export interface G2LengthMissingSegmentCase extends Record<string, JsonValue> {
  totalCm: number
  knownA: number
  knownB: number
  missingPosition: number
}

const TOTAL_CM = [180, 210, 240] as const
const KNOWN_A = [40, 60] as const
const KNOWN_B = [30, 50, 70] as const
const MISSING_POSITION = [0, 1, 2] as const

export const G2_LENGTH_MISSING_SEGMENT_CASES: readonly G2LengthMissingSegmentCase[] =
  Object.freeze(
    TOTAL_CM.flatMap((totalCm) =>
      KNOWN_A.flatMap((knownA) =>
        KNOWN_B.flatMap((knownB) =>
          MISSING_POSITION.map((missingPosition) =>
            Object.freeze({ totalCm, knownA, knownB, missingPosition }),
          ),
        ),
      ),
    ),
  )

export const G2_LENGTH_MISSING_SEGMENT_FAMILY: ApplicationProblemFamilyV1 =
  parseApplicationProblemFamilyV1({
    schemaVersion: 'application-problem-family-v1',
    familyId: 'g2-length-missing-segment',
    version: 1,
    packId: 'pack-g2-2-length',
    unitId: 'g2-2-length',
    conceptIds: ['length-equivalent-representation', 'length-context-add-subtract'],
    primaryStandard: '[2수03-13]',
    connectedStandards: ['[2수03-11]'],
    cognitiveDomain: 'reasoning',
    reasoningPattern: 'inverse',
    representations: ['text', 'equation', 'diagram'],
    contextType: 'real_world',
    readingLoad: 'low',
    estimatedSteps: 3,
    modelId: 'length-segmented-whole-v1',
    unknownRole: 'missing-segment-length',
    requiredStudentActions: [
      'interpret_context',
      'choose_model',
      'convert_representation',
      'infer_missing_value',
      'execute_calculation',
      'verify_result',
    ],
    misconceptionRefs: [
      'length-meter-centimeter-place-value',
      'length-operate-before-unit-alignment',
      'length-missing-part-addition',
    ],
    visualPolicy: {
      role: 'required',
      semantics: 'quantitative',
      generatorId: 'g2-length-missing-bars',
      answerCritical: true,
    },
    proofMode: 'exhaustive',
    runtimeMode: 'deterministic-generator',
    releaseStatus: 'approved',
    approval: {
      ownerStatus: 'approved',
      ownerId: 'project-owner',
      approvedAt: '2026-07-28T09:05:24Z',
      evidenceRefs: ['docs/reviews/application-problems-v1-approval.md'],
      expertStatus: 'not-reviewed',
    },
  })

function missingParams(
  params: Readonly<Record<string, JsonValue>>,
): G2LengthMissingSegmentCase {
  const totalCm = params.totalCm
  const knownA = params.knownA
  const knownB = params.knownB
  const missingPosition = params.missingPosition
  if (
    !TOTAL_CM.includes(totalCm as (typeof TOTAL_CM)[number]) ||
    !KNOWN_A.includes(knownA as (typeof KNOWN_A)[number]) ||
    !KNOWN_B.includes(knownB as (typeof KNOWN_B)[number]) ||
    !MISSING_POSITION.includes(missingPosition as (typeof MISSING_POSITION)[number])
  ) {
    throw new TypeError('missing-segment parameters are outside the finite Grade 2 domain')
  }
  return {
    totalCm: totalCm as number,
    knownA: knownA as number,
    knownB: knownB as number,
    missingPosition: missingPosition as number,
  }
}

function missingLengths(model: G2LengthMissingSegmentCase): [number, number, number] {
  const missingCm = model.totalCm - model.knownA - model.knownB
  if (missingCm <= 0) throw new TypeError('missing segment must be positive')
  const known = [model.knownA, model.knownB]
  let knownIndex = 0
  return [0, 1, 2].map((position) => {
    if (position === model.missingPosition) return missingCm
    const length = known[knownIndex]
    knownIndex += 1
    return length
  }) as [number, number, number]
}

function missingScene(model: G2LengthMissingSegmentCase) {
  const lengthsCm = missingLengths(model)
  const missingCm = model.totalCm - model.knownA - model.knownB
  const labels = lengthsCm.map((lengthCm, position) =>
    position === model.missingPosition
      ? identifierThenSolution('?', `${missingCm}cm`)
      : givenText(`${lengthCm}cm`),
  ) as [ReturnType<typeof givenText>, ReturnType<typeof givenText>, ReturnType<typeof givenText>]
  return buildG2ConnectedLengthScene({
    lengthsCm,
    labels,
    segmentDisclosures: [0, 1, 2].map((position) =>
      position === model.missingPosition ? 'identifier' : 'given',
    ) as ['given' | 'identifier', 'given' | 'identifier', 'given' | 'identifier'],
    description: givenText('전체와 두 부분을 보고 빠진 길이를 찾는 그림'),
    total: {
      lengthCm: model.totalCm,
      content: givenText(formatG2MixedLength(model.totalCm)),
      disclosure: 'given',
    },
  })
}

export const G2_LENGTH_MISSING_SEGMENT_GENERATOR: ApplicationProblemFamilyGeneratorV1 = {
  familyId: G2_LENGTH_MISSING_SEGMENT_FAMILY.familyId,
  version: G2_LENGTH_MISSING_SEGMENT_FAMILY.version,
  packId: G2_LENGTH_MISSING_SEGMENT_FAMILY.packId,
  packVersion: 1,
  maxAttempts: 1,
  visualGeneratorVersion: 1,
  sample: ({ seed, variantIndex }) => {
    const selected = G2_LENGTH_MISSING_SEGMENT_CASES[
      stableG2LengthCaseIndex(seed, variantIndex, G2_LENGTH_MISSING_SEGMENT_CASES.length)
    ]
    return { params: selected, mathModel: missingScene(selected) as unknown as JsonValue }
  },
  render: ({ params }) => {
    const model = missingParams(params)
    const missingCm = model.totalCm - model.knownA - model.knownB
    return {
      prompt: `세 구간을 이은 전체는 ${formatG2MixedLength(model.totalCm)}예요. 그림의 ? 길이는 몇 cm일까요?`,
      answer: { format: 'number', normalized: String(missingCm) },
      solutionSteps: [
        `${formatG2MixedLength(model.totalCm)}는 ${model.totalCm}cm예요.`,
        `아는 두 길이는 ${model.knownA}+${model.knownB}=${model.knownA + model.knownB}cm예요.`,
        `${model.totalCm}-${model.knownA}-${model.knownB}=${missingCm}`,
        `빠진 길이는 ${missingCm}cm예요.`,
      ],
      hintSteps: [
        '전체 길이를 cm로 바꾸어 보세요.',
        '전체에서 아는 두 길이를 빼 보세요.',
      ],
    }
  },
}

export function generateG2LengthMissingSegment(input: {
  seed: number
  variantIndex: number
}): GeneratedApplicationProblemV1 {
  return generateApplicationProblem({
    family: G2_LENGTH_MISSING_SEGMENT_FAMILY,
    generator: G2_LENGTH_MISSING_SEGMENT_GENERATOR,
    packVersion: 1,
    seed: input.seed,
    variantIndex: input.variantIndex,
  })
}

export function validateG2LengthMissingSegmentScene(
  scene: Readonly<ApplicationVisualSceneV1>,
  params: Readonly<Record<string, JsonValue>>,
): ApplicationVisualValidationIssue[] {
  try {
    return validateExactG2LengthScene(
      scene,
      missingScene(missingParams(params)),
      G2_LENGTH_MISSING_SEGMENT_FAMILY.familyId,
    )
  } catch {
    return [
      {
        code: 'g2_length_missing_params_invalid',
        path: 'problem.params',
        message: 'missing-segment visual parameters must belong to the declared finite domain',
      },
    ]
  }
}
