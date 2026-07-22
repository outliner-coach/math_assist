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
import type { ApplicationVisualContent, ApplicationVisualSceneV1 } from '../visual-model'
import type { ApplicationVisualValidationIssue } from '../visual-validator'
import {
  buildG2ConnectedLengthScene,
  formatG2MixedLength,
  givenText,
  identifierThenSolution,
  stableG2LengthCaseIndex,
  validateExactG2LengthScene,
} from './g2-length-scene'

export type G2LengthWrongClaimStrategy =
  | 'meter-tenfold-add'
  | 'mixed-concat-add'
  | 'operate-before-alignment'
  | 'missing-addition'

interface RouteClaimBase extends Record<string, JsonValue> {
  baseCaseId: string
  scenario: 'route-total'
  wrongStrategy: Exclude<G2LengthWrongClaimStrategy, 'missing-addition'>
  longCm: number
  middleCm: number
  lastCm: number
}

interface MissingClaimBase extends Record<string, JsonValue> {
  baseCaseId: string
  scenario: 'missing-segment'
  wrongStrategy: 'missing-addition'
  totalCm: number
  knownA: number
  knownB: number
  missingPosition: number
}

export type G2LengthClaimCheckBaseCase = RouteClaimBase | MissingClaimBase

export type G2LengthClaimCheckCase = G2LengthClaimCheckBaseCase & {
  correctClaimPosition: 0 | 1
  claimACm: number
  claimBCm: number
}

export const G2_LENGTH_CLAIM_CHECK_BASE_CASES: readonly G2LengthClaimCheckBaseCase[] =
  Object.freeze([
    { baseCaseId: 'meter-1', scenario: 'route-total', wrongStrategy: 'meter-tenfold-add', longCm: 110, middleCm: 25, lastCm: 20 },
    { baseCaseId: 'meter-2', scenario: 'route-total', wrongStrategy: 'meter-tenfold-add', longCm: 130, middleCm: 45, lastCm: 20 },
    { baseCaseId: 'meter-3', scenario: 'route-total', wrongStrategy: 'meter-tenfold-add', longCm: 150, middleCm: 25, lastCm: 40 },
    { baseCaseId: 'meter-4', scenario: 'route-total', wrongStrategy: 'meter-tenfold-add', longCm: 110, middleCm: 65, lastCm: 40 },
    { baseCaseId: 'concat-1', scenario: 'route-total', wrongStrategy: 'mixed-concat-add', longCm: 205, middleCm: 30, lastCm: 20 },
    { baseCaseId: 'concat-2', scenario: 'route-total', wrongStrategy: 'mixed-concat-add', longCm: 207, middleCm: 40, lastCm: 30 },
    { baseCaseId: 'concat-3', scenario: 'route-total', wrongStrategy: 'mixed-concat-add', longCm: 305, middleCm: 20, lastCm: 40 },
    { baseCaseId: 'concat-4', scenario: 'route-total', wrongStrategy: 'mixed-concat-add', longCm: 309, middleCm: 50, lastCm: 20 },
    { baseCaseId: 'align-1', scenario: 'route-total', wrongStrategy: 'operate-before-alignment', longCm: 130, middleCm: 40, lastCm: 20 },
    { baseCaseId: 'align-2', scenario: 'route-total', wrongStrategy: 'operate-before-alignment', longCm: 150, middleCm: 30, lastCm: 40 },
    { baseCaseId: 'align-3', scenario: 'route-total', wrongStrategy: 'operate-before-alignment', longCm: 110, middleCm: 60, lastCm: 30 },
    { baseCaseId: 'align-4', scenario: 'route-total', wrongStrategy: 'operate-before-alignment', longCm: 140, middleCm: 20, lastCm: 50 },
    { baseCaseId: 'missing-1', scenario: 'missing-segment', wrongStrategy: 'missing-addition', totalCm: 180, knownA: 40, knownB: 30, missingPosition: 0 },
    { baseCaseId: 'missing-2', scenario: 'missing-segment', wrongStrategy: 'missing-addition', totalCm: 210, knownA: 60, knownB: 50, missingPosition: 1 },
    { baseCaseId: 'missing-3', scenario: 'missing-segment', wrongStrategy: 'missing-addition', totalCm: 240, knownA: 70, knownB: 30, missingPosition: 2 },
    { baseCaseId: 'missing-4', scenario: 'missing-segment', wrongStrategy: 'missing-addition', totalCm: 180, knownA: 60, knownB: 70, missingPosition: 1 },
  ].map((entry) => Object.freeze(entry)) as G2LengthClaimCheckBaseCase[])

function trueClaimValue(base: G2LengthClaimCheckBaseCase): number {
  return base.scenario === 'route-total'
    ? base.longCm + base.middleCm + base.lastCm
    : base.totalCm - base.knownA - base.knownB
}

function falseClaimValue(base: G2LengthClaimCheckBaseCase): number {
  if (base.scenario === 'missing-segment') return base.totalCm + base.knownA + base.knownB
  const meters = Math.floor(base.longCm / 100)
  const centimeters = base.longCm % 100
  if (base.wrongStrategy === 'meter-tenfold-add') {
    return meters * 10 + centimeters + base.middleCm + base.lastCm
  }
  if (base.wrongStrategy === 'mixed-concat-add') {
    return Number(`${meters}${centimeters}`) + base.middleCm + base.lastCm
  }
  return meters + centimeters + base.middleCm + base.lastCm
}

export const G2_LENGTH_CLAIM_CHECK_CASES: readonly G2LengthClaimCheckCase[] = Object.freeze(
  G2_LENGTH_CLAIM_CHECK_BASE_CASES.flatMap((base) => {
    const correctCm = trueClaimValue(base)
    const wrongCm = falseClaimValue(base)
    if (correctCm === wrongCm) throw new Error(`${base.baseCaseId} does not have a false claim`)
    return ([0, 1] as const).map((correctClaimPosition) =>
      Object.freeze({
        ...base,
        correctClaimPosition,
        claimACm: correctClaimPosition === 0 ? correctCm : wrongCm,
        claimBCm: correctClaimPosition === 1 ? correctCm : wrongCm,
      }),
    )
  }),
)

export const G2_LENGTH_CLAIM_CHECK_FAMILY: ApplicationProblemFamilyV1 =
  parseApplicationProblemFamilyV1({
    schemaVersion: 'application-problem-family-v1',
    familyId: 'g2-length-claim-check',
    version: 1,
    packId: 'pack-g2-2-length',
    unitId: 'g2-2-length',
    conceptIds: ['length-equivalent-representation', 'length-context-add-subtract'],
    primaryStandard: '[2수03-13]',
    connectedStandards: ['[2수03-11]'],
    cognitiveDomain: 'reasoning',
    reasoningPattern: 'error_analysis',
    representations: ['text', 'equation', 'diagram'],
    contextType: 'real_world',
    readingLoad: 'medium',
    estimatedSteps: 4,
    modelId: 'length-claim-validity-v1',
    unknownRole: 'valid-speaker',
    requiredStudentActions: [
      'interpret_context',
      'convert_representation',
      'choose_model',
      'evaluate_claim',
      'verify_result',
    ],
    misconceptionRefs: [
      'length-meter-centimeter-place-value',
      'length-mixed-unit-concatenation',
      'length-operate-before-unit-alignment',
      'length-missing-part-addition',
    ],
    visualPolicy: {
      role: 'required',
      semantics: 'quantitative',
      generatorId: 'g2-length-claim-bars',
      answerCritical: true,
    },
    proofMode: 'exhaustive',
    runtimeMode: 'deterministic-generator',
    releaseStatus: 'draft',
    approval: {
      ownerStatus: 'pending',
      evidenceRefs: [],
      expertStatus: 'not-reviewed',
    },
  })

function sameCase(left: G2LengthClaimCheckCase, right: Readonly<Record<string, JsonValue>>): boolean {
  return Object.entries(left).every(([key, value]) => right[key] === value)
}

function claimParams(params: Readonly<Record<string, JsonValue>>): G2LengthClaimCheckCase {
  const selected = G2_LENGTH_CLAIM_CHECK_CASES.find((entry) => sameCase(entry, params))
  if (!selected) throw new TypeError('claim-check parameters are outside the finite Grade 2 domain')
  return selected
}

function disclosureDescription(speaker: '가' | '나'): ApplicationVisualContent {
  return {
    before: { text: '문제에 주어진 길이만 크기에 맞게 나타낸 그림', disclosure: 'given' },
    after: { text: `맞는 말은 ${speaker}예요.`, disclosure: 'solution' },
  }
}

function claimSpeaker(model: G2LengthClaimCheckCase): '가' | '나' {
  const correctCm = trueClaimValue(model)
  const truth = [model.claimACm === correctCm, model.claimBCm === correctCm]
  if (truth.filter(Boolean).length !== 1) throw new TypeError('exactly one length claim must be true')
  return truth[0] ? '가' : '나'
}

function claimScene(model: G2LengthClaimCheckCase) {
  const speaker = claimSpeaker(model)
  if (model.scenario === 'route-total') {
    return buildG2ConnectedLengthScene({
      lengthsCm: [model.longCm, model.middleCm, model.lastCm],
      labels: [
        givenText(formatG2MixedLength(model.longCm)),
        givenText(`${model.middleCm}cm`),
        givenText(`${model.lastCm}cm`),
      ],
      description: disclosureDescription(speaker),
    })
  }

  const missingCm = model.totalCm - model.knownA - model.knownB
  const known = [model.knownA, model.knownB]
  let knownIndex = 0
  const lengthsCm = [0, 1, 2].map((position) => {
    if (position === model.missingPosition) return missingCm
    const length = known[knownIndex]
    knownIndex += 1
    return length
  }) as [number, number, number]
  const labels = lengthsCm.map((lengthCm, position) =>
    position === model.missingPosition
      ? identifierThenSolution('?', `${missingCm}cm`)
      : givenText(`${lengthCm}cm`),
  ) as [ApplicationVisualContent, ApplicationVisualContent, ApplicationVisualContent]
  return buildG2ConnectedLengthScene({
    lengthsCm,
    labels,
    segmentDisclosures: [0, 1, 2].map((position) =>
      position === model.missingPosition ? 'identifier' : 'given',
    ) as ['given' | 'identifier', 'given' | 'identifier', 'given' | 'identifier'],
    description: disclosureDescription(speaker),
    total: {
      lengthCm: model.totalCm,
      content: givenText(formatG2MixedLength(model.totalCm)),
      disclosure: 'given',
    },
  })
}

function strategyCorrection(strategy: G2LengthWrongClaimStrategy): string {
  if (strategy === 'meter-tenfold-add') return '1m는 10cm가 아니라 100cm로 바꾸어요.'
  if (strategy === 'mixed-concat-add') return 'm와 cm의 수를 붙이지 말고 m를 100cm씩 바꾸어요.'
  if (strategy === 'operate-before-alignment') return '보이는 수부터 더하지 말고 모두 cm로 맞추어요.'
  return '전체와 부분을 더하지 말고 전체에서 아는 부분을 빼어요.'
}

export const G2_LENGTH_CLAIM_CHECK_GENERATOR: ApplicationProblemFamilyGeneratorV1 = {
  familyId: G2_LENGTH_CLAIM_CHECK_FAMILY.familyId,
  version: G2_LENGTH_CLAIM_CHECK_FAMILY.version,
  packId: G2_LENGTH_CLAIM_CHECK_FAMILY.packId,
  packVersion: 1,
  maxAttempts: 1,
  visualGeneratorVersion: 1,
  sample: ({ seed, variantIndex }) => {
    const selected = G2_LENGTH_CLAIM_CHECK_CASES[
      stableG2LengthCaseIndex(seed, variantIndex, G2_LENGTH_CLAIM_CHECK_CASES.length)
    ]
    return { params: selected, mathModel: claimScene(selected) as unknown as JsonValue }
  },
  render: ({ params }) => {
    const model = claimParams(params)
    const correctCm = trueClaimValue(model)
    const speaker = claimSpeaker(model)
    const situation = model.scenario === 'route-total'
      ? `세 길이는 ${formatG2MixedLength(model.longCm)}, ${model.middleCm}cm, ${model.lastCm}cm예요.`
      : `전체는 ${formatG2MixedLength(model.totalCm)}이고 아는 두 부분은 ${model.knownA}cm, ${model.knownB}cm예요.`
    const claimSubject = model.scenario === 'route-total' ? '모두' : '?의 길이는'
    return {
      prompt: `${situation} 가: ${claimSubject} ${model.claimACm}cm야. 나: ${claimSubject} ${model.claimBCm}cm야. 누구 말이 맞나요?`,
      answer: { format: 'choice', normalized: speaker },
      choices: ['가', '나'],
      correctChoiceIndex: speaker === '가' ? 0 : 1,
      solutionSteps: [
        model.scenario === 'route-total'
          ? `세 길이를 모두 cm로 바꾸어 더하면 ${correctCm}cm예요.`
          : `전체에서 아는 두 부분을 빼면 ${correctCm}cm예요.`,
        `가의 말은 ${model.claimACm}cm, 나의 말은 ${model.claimBCm}cm예요.`,
        `${correctCm}cm라고 말한 ${speaker}가 맞아요.`,
        strategyCorrection(model.wrongStrategy),
      ],
      hintSteps: [
        '문제의 길이를 모두 cm로 나타내 보세요.',
        '가와 나의 수를 하나씩 확인해 보세요.',
      ],
    }
  },
}

export function generateG2LengthClaimCheck(input: {
  seed: number
  variantIndex: number
}): GeneratedApplicationProblemV1 {
  return generateApplicationProblem({
    family: G2_LENGTH_CLAIM_CHECK_FAMILY,
    generator: G2_LENGTH_CLAIM_CHECK_GENERATOR,
    packVersion: 1,
    seed: input.seed,
    variantIndex: input.variantIndex,
  })
}

export function validateG2LengthClaimCheckScene(
  scene: Readonly<ApplicationVisualSceneV1>,
  params: Readonly<Record<string, JsonValue>>,
): ApplicationVisualValidationIssue[] {
  try {
    return validateExactG2LengthScene(
      scene,
      claimScene(claimParams(params)),
      G2_LENGTH_CLAIM_CHECK_FAMILY.familyId,
    )
  } catch {
    return [
      {
        code: 'g2_length_claim_params_invalid',
        path: 'problem.params',
        message: 'claim-check visual parameters must belong to the declared finite domain',
      },
    ]
  }
}
