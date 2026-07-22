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
  solutionText,
  stableG2LengthCaseIndex,
  validateExactG2LengthScene,
} from './g2-length-scene'

export interface G2LengthRouteTotalCase extends Record<string, JsonValue> {
  longCm: number
  middleCm: number
  lastCm: number
}

const LONG_CM = [110, 130, 150] as const
const MIDDLE_CM = [25, 45, 65] as const
const LAST_CM = [20, 40] as const

export const G2_LENGTH_ROUTE_TOTAL_CASES: readonly G2LengthRouteTotalCase[] = Object.freeze(
  LONG_CM.flatMap((longCm) =>
    MIDDLE_CM.flatMap((middleCm) =>
      LAST_CM.map((lastCm) => Object.freeze({ longCm, middleCm, lastCm })),
    ),
  ),
)

const pendingApproval = Object.freeze({
  ownerStatus: 'pending' as const,
  evidenceRefs: Object.freeze([] as string[]),
  expertStatus: 'not-reviewed' as const,
})

export const G2_LENGTH_ROUTE_TOTAL_FAMILY: ApplicationProblemFamilyV1 =
  parseApplicationProblemFamilyV1({
    schemaVersion: 'application-problem-family-v1',
    familyId: 'g2-length-route-total',
    version: 1,
    packId: 'pack-g2-2-length',
    unitId: 'g2-2-length',
    conceptIds: ['length-equivalent-representation', 'length-context-add-subtract'],
    primaryStandard: '[2수03-13]',
    connectedStandards: ['[2수03-11]'],
    cognitiveDomain: 'applying',
    reasoningPattern: 'representation_shift',
    representations: ['text', 'equation', 'diagram'],
    contextType: 'real_world',
    readingLoad: 'low',
    estimatedSteps: 3,
    modelId: 'length-route-segment-sum-v1',
    unknownRole: 'total-route-length',
    requiredStudentActions: [
      'interpret_context',
      'convert_representation',
      'choose_model',
      'execute_calculation',
      'verify_result',
    ],
    misconceptionRefs: [
      'length-meter-centimeter-place-value',
      'length-operate-before-unit-alignment',
    ],
    visualPolicy: {
      role: 'required',
      semantics: 'quantitative',
      generatorId: 'g2-length-route-bars',
      answerCritical: true,
    },
    proofMode: 'exhaustive',
    runtimeMode: 'deterministic-generator',
    releaseStatus: 'draft',
    approval: pendingApproval,
  })

function routeParams(params: Readonly<Record<string, JsonValue>>): G2LengthRouteTotalCase {
  const longCm = params.longCm
  const middleCm = params.middleCm
  const lastCm = params.lastCm
  if (
    !Number.isSafeInteger(longCm) ||
    !Number.isSafeInteger(middleCm) ||
    !Number.isSafeInteger(lastCm) ||
    !LONG_CM.includes(longCm as (typeof LONG_CM)[number]) ||
    !MIDDLE_CM.includes(middleCm as (typeof MIDDLE_CM)[number]) ||
    !LAST_CM.includes(lastCm as (typeof LAST_CM)[number])
  ) {
    throw new TypeError('route-total parameters are outside the finite Grade 2 domain')
  }
  return { longCm: longCm as number, middleCm: middleCm as number, lastCm: lastCm as number }
}

function routeScene(params: G2LengthRouteTotalCase) {
  const totalCm = params.longCm + params.middleCm + params.lastCm
  return buildG2ConnectedLengthScene({
    lengthsCm: [params.longCm, params.middleCm, params.lastCm],
    labels: [
      givenText(formatG2MixedLength(params.longCm)),
      givenText(`${params.middleCm}cm`),
      givenText(`${params.lastCm}cm`),
    ],
    description: givenText('이어진 세 길이를 cm 크기에 맞게 나타낸 그림'),
    total: {
      lengthCm: totalCm,
      content: solutionText(`${totalCm}cm`),
      disclosure: 'solution',
      emphasis: 'answer',
    },
  })
}

export const G2_LENGTH_ROUTE_TOTAL_GENERATOR: ApplicationProblemFamilyGeneratorV1 = {
  familyId: G2_LENGTH_ROUTE_TOTAL_FAMILY.familyId,
  version: G2_LENGTH_ROUTE_TOTAL_FAMILY.version,
  packId: G2_LENGTH_ROUTE_TOTAL_FAMILY.packId,
  packVersion: 1,
  maxAttempts: 1,
  visualGeneratorVersion: 1,
  sample: ({ seed, variantIndex }) => {
    const selected = G2_LENGTH_ROUTE_TOTAL_CASES[
      stableG2LengthCaseIndex(seed, variantIndex, G2_LENGTH_ROUTE_TOTAL_CASES.length)
    ]
    return { params: selected, mathModel: routeScene(selected) as unknown as JsonValue }
  },
  render: ({ params }) => {
    const model = routeParams(params)
    const totalCm = model.longCm + model.middleCm + model.lastCm
    return {
      prompt: `첫 길은 ${formatG2MixedLength(model.longCm)}, 다음 길은 ${model.middleCm}cm와 ${model.lastCm}cm예요. 세 길이는 모두 몇 cm일까요?`,
      answer: { format: 'number', normalized: String(totalCm) },
      solutionSteps: [
        `${formatG2MixedLength(model.longCm)}는 ${model.longCm}cm예요.`,
        `${model.longCm}+${model.middleCm}+${model.lastCm}=${totalCm}`,
        `세 길이는 모두 ${totalCm}cm예요.`,
      ],
      hintSteps: [
        'm가 있는 길이를 먼저 cm로 바꾸어 보세요.',
        '같은 cm끼리 세 길이를 더해 보세요.',
      ],
    }
  },
}

export function generateG2LengthRouteTotal(input: {
  seed: number
  variantIndex: number
}): GeneratedApplicationProblemV1 {
  return generateApplicationProblem({
    family: G2_LENGTH_ROUTE_TOTAL_FAMILY,
    generator: G2_LENGTH_ROUTE_TOTAL_GENERATOR,
    packVersion: 1,
    seed: input.seed,
    variantIndex: input.variantIndex,
  })
}

export function validateG2LengthRouteTotalScene(
  scene: Readonly<ApplicationVisualSceneV1>,
  params: Readonly<Record<string, JsonValue>>,
): ApplicationVisualValidationIssue[] {
  try {
    return validateExactG2LengthScene(
      scene,
      routeScene(routeParams(params)),
      G2_LENGTH_ROUTE_TOTAL_FAMILY.familyId,
    )
  } catch {
    return [
      {
        code: 'g2_length_route_params_invalid',
        path: 'problem.params',
        message: 'route-total visual parameters must belong to the declared finite domain',
      },
    ]
  }
}
