import {
  parseApplicationProblemFamilyV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from '../contracts'
import {
  generateApplicationProblem,
  type ApplicationProblemFamilyGeneratorV1,
  type ApplicationProblemRenderedContentV1,
} from '../generator'
import type { ApplicationVisualSceneV1 } from '../visual-model'
import type {
  ApplicationVisualFamilyValidator,
  ApplicationVisualValidationIssue,
} from '../visual-validator'
import {
  addClosureIssue,
  closureResult,
  createProofDomain,
  formatGeneratorPercent,
  readSafeInteger,
  readString,
  selectFiniteCaseIndex,
  stableJson,
  validateSceneClosure,
  type G6RatioClosureIssue,
  type G6RatioClosureResult,
  type G6RatioGenerationInput,
} from './g6-ratio-common'

const BASE_RATIO_PAIRS = [
  [[3, 4], [2, 3]],
  [[4, 5], [3, 4]],
  [[7, 10], [3, 5]],
  [[3, 5], [1, 2]],
  [[2, 3], [3, 5]],
  [[9, 10], [4, 5]],
] as const

const HIGHER_MULTIPLIERS = [2, 3, 4] as const
const LOWER_MULTIPLIERS = [3, 4, 5, 6, 7, 8] as const

const CONTEXTS = [
  { contextId: 'free-throws', trialName: '자유투', successName: '성공' },
  { contextId: 'quiz-rounds', trialName: '퀴즈', successName: '정답' },
  { contextId: 'seed-germination', trialName: '씨앗', successName: '발아' },
] as const

export interface G6RatioRelativeComparisonBaseCase {
  baseCaseIndex: number
  pairIndex: number
  higherNumerator: number
  higherDenominator: number
  lowerNumerator: number
  lowerDenominator: number
  higherMultiplier: number
  lowerMultiplier: number
  higherSuccesses: number
  higherTotal: number
  lowerSuccesses: number
  lowerTotal: number
}

const retainedBaseCases = BASE_RATIO_PAIRS.flatMap(
  ([[higherNumerator, higherDenominator], [lowerNumerator, lowerDenominator]], pairIndex) =>
    HIGHER_MULTIPLIERS.flatMap((higherMultiplier) =>
      LOWER_MULTIPLIERS.map((lowerMultiplier) => ({
        pairIndex,
        higherNumerator,
        higherDenominator,
        lowerNumerator,
        lowerDenominator,
        higherMultiplier,
        lowerMultiplier,
        higherSuccesses: higherNumerator * higherMultiplier,
        higherTotal: higherDenominator * higherMultiplier,
        lowerSuccesses: lowerNumerator * lowerMultiplier,
        lowerTotal: lowerDenominator * lowerMultiplier,
      })),
    ),
).filter(
  (entry) =>
    entry.lowerSuccesses > entry.higherSuccesses &&
    entry.higherTotal <= 60 &&
    entry.lowerTotal <= 60,
)

if (retainedBaseCases.length !== 55) {
  throw new Error(
    `Grade 6 relative-comparison filter must derive 55 cases, received ${retainedBaseCases.length}`,
  )
}

export const G6_RATIO_RELATIVE_COMPARISON_BASE_CASES: readonly G6RatioRelativeComparisonBaseCase[] =
  Object.freeze(
    retainedBaseCases.map((entry, baseCaseIndex) => Object.freeze({ ...entry, baseCaseIndex })),
  )

export type G6RatioHigherPlacement = 'left' | 'right'

export interface G6RatioRelativeComparisonCase extends G6RatioRelativeComparisonBaseCase {
  caseIndex: number
  caseId: string
  higherPlacement: G6RatioHigherPlacement
  contextIndex: number
  contextId: string
  trialName: string
  successName: string
  leftLabel: string
  rightLabel: string
  leftSuccesses: number
  leftTotal: number
  rightSuccesses: number
  rightTotal: number
}

export const G6_RATIO_RELATIVE_COMPARISON_CASES: readonly G6RatioRelativeComparisonCase[] =
  Object.freeze(
    G6_RATIO_RELATIVE_COMPARISON_BASE_CASES.flatMap((base) =>
      (['left', 'right'] as const).map((higherPlacement) => {
        const contextIndex = base.baseCaseIndex % CONTEXTS.length
        const context = CONTEXTS[contextIndex]
        const higherOnLeft = higherPlacement === 'left'
        return {
          ...base,
          caseIndex: 0,
          caseId: '',
          higherPlacement,
          contextIndex,
          ...context,
          leftLabel: '가 모둠',
          rightLabel: '나 모둠',
          leftSuccesses: higherOnLeft ? base.higherSuccesses : base.lowerSuccesses,
          leftTotal: higherOnLeft ? base.higherTotal : base.lowerTotal,
          rightSuccesses: higherOnLeft ? base.lowerSuccesses : base.higherSuccesses,
          rightTotal: higherOnLeft ? base.lowerTotal : base.higherTotal,
        }
      }),
    ).map((entry, caseIndex) =>
      Object.freeze({
        ...entry,
        caseIndex,
        caseId: `g6-ratio-relative-comparison-${String(caseIndex + 1).padStart(3, '0')}`,
      }),
    ),
  )

export const G6_RATIO_RELATIVE_COMPARISON_PROOF_DOMAIN = createProofDomain(
  'g6-ratio-relative-comparison',
  G6_RATIO_RELATIVE_COMPARISON_CASES.length,
)

export const G6_RATIO_RELATIVE_COMPARISON_FAMILY = parseApplicationProblemFamilyV1({
  schemaVersion: 'application-problem-family-v1',
  familyId: 'g6-ratio-relative-comparison',
  version: 1,
  packId: 'pack-unit-6-1-ratio',
  unitId: 'unit-6-1-ratio',
  conceptIds: ['ratio-relative-comparison'],
  primaryStandard: '[6수02-03]',
  connectedStandards: ['[6수02-02]'],
  cognitiveDomain: 'reasoning',
  reasoningPattern: 'compare_methods',
  representations: ['text', 'table'],
  contextType: 'real_world',
  readingLoad: 'medium',
  estimatedSteps: 3,
  modelId: 'relative-ratio-cross-comparison',
  unknownRole: 'larger-relative-ratio',
  requiredStudentActions: [
    'interpret_context',
    'choose_model',
    'compare_strategies',
    'verify_result',
  ],
  misconceptionRefs: [
    'ratio-compares-absolute-difference',
    'ratio-denominator-is-selected-part',
  ],
  visualPolicy: {
    role: 'required',
    semantics: 'quantitative',
    generatorId: 'g6-ratio-relative-comparison-visual',
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

function caseParams(entry: G6RatioRelativeComparisonCase): Record<string, JsonValue> {
  return {
    caseIndex: entry.caseIndex,
    caseId: entry.caseId,
    baseCaseIndex: entry.baseCaseIndex,
    pairIndex: entry.pairIndex,
    higherNumerator: entry.higherNumerator,
    higherDenominator: entry.higherDenominator,
    lowerNumerator: entry.lowerNumerator,
    lowerDenominator: entry.lowerDenominator,
    higherMultiplier: entry.higherMultiplier,
    lowerMultiplier: entry.lowerMultiplier,
    higherSuccesses: entry.higherSuccesses,
    higherTotal: entry.higherTotal,
    lowerSuccesses: entry.lowerSuccesses,
    lowerTotal: entry.lowerTotal,
    higherPlacement: entry.higherPlacement,
    contextIndex: entry.contextIndex,
    contextId: entry.contextId,
    trialName: entry.trialName,
    successName: entry.successName,
    leftLabel: entry.leftLabel,
    rightLabel: entry.rightLabel,
    leftSuccesses: entry.leftSuccesses,
    leftTotal: entry.leftTotal,
    rightSuccesses: entry.rightSuccesses,
    rightTotal: entry.rightTotal,
  }
}

function modelFromParams(
  params: Readonly<Record<string, JsonValue>>,
): G6RatioRelativeComparisonCase {
  const placement = readString(params, 'higherPlacement')
  if (placement !== 'left' && placement !== 'right') {
    throw new TypeError('higherPlacement must be left or right')
  }
  const model: G6RatioRelativeComparisonCase = {
    caseIndex: readSafeInteger(params, 'caseIndex'),
    caseId: readString(params, 'caseId'),
    baseCaseIndex: readSafeInteger(params, 'baseCaseIndex'),
    pairIndex: readSafeInteger(params, 'pairIndex'),
    higherNumerator: readSafeInteger(params, 'higherNumerator'),
    higherDenominator: readSafeInteger(params, 'higherDenominator'),
    lowerNumerator: readSafeInteger(params, 'lowerNumerator'),
    lowerDenominator: readSafeInteger(params, 'lowerDenominator'),
    higherMultiplier: readSafeInteger(params, 'higherMultiplier'),
    lowerMultiplier: readSafeInteger(params, 'lowerMultiplier'),
    higherSuccesses: readSafeInteger(params, 'higherSuccesses'),
    higherTotal: readSafeInteger(params, 'higherTotal'),
    lowerSuccesses: readSafeInteger(params, 'lowerSuccesses'),
    lowerTotal: readSafeInteger(params, 'lowerTotal'),
    higherPlacement: placement,
    contextIndex: readSafeInteger(params, 'contextIndex'),
    contextId: readString(params, 'contextId'),
    trialName: readString(params, 'trialName'),
    successName: readString(params, 'successName'),
    leftLabel: readString(params, 'leftLabel'),
    rightLabel: readString(params, 'rightLabel'),
    leftSuccesses: readSafeInteger(params, 'leftSuccesses'),
    leftTotal: readSafeInteger(params, 'leftTotal'),
    rightSuccesses: readSafeInteger(params, 'rightSuccesses'),
    rightTotal: readSafeInteger(params, 'rightTotal'),
  }
  const higherOnLeft = model.higherPlacement === 'left'
  const leftMatches =
    model.leftSuccesses === (higherOnLeft ? model.higherSuccesses : model.lowerSuccesses) &&
    model.leftTotal === (higherOnLeft ? model.higherTotal : model.lowerTotal)
  const rightMatches =
    model.rightSuccesses === (higherOnLeft ? model.lowerSuccesses : model.higherSuccesses) &&
    model.rightTotal === (higherOnLeft ? model.lowerTotal : model.higherTotal)
  const higherCross = model.higherSuccesses * model.lowerTotal
  const lowerCross = model.lowerSuccesses * model.higherTotal
  if (
    model.higherDenominator < 1 ||
    model.lowerDenominator < 1 ||
    model.higherSuccesses !== model.higherNumerator * model.higherMultiplier ||
    model.higherTotal !== model.higherDenominator * model.higherMultiplier ||
    model.lowerSuccesses !== model.lowerNumerator * model.lowerMultiplier ||
    model.lowerTotal !== model.lowerDenominator * model.lowerMultiplier ||
    model.lowerSuccesses <= model.higherSuccesses ||
    model.higherTotal > 60 ||
    model.lowerTotal > 60 ||
    higherCross <= lowerCross ||
    !leftMatches ||
    !rightMatches
  ) {
    throw new TypeError('comparison params do not form an allowed cross-comparison model')
  }
  return model
}

function compareModelSides(model: G6RatioRelativeComparisonCase): -1 | 0 | 1 {
  const leftCross = model.leftSuccesses * model.rightTotal
  const rightCross = model.rightSuccesses * model.leftTotal
  return leftCross === rightCross ? 0 : leftCross > rightCross ? 1 : -1
}

function answerFor(model: G6RatioRelativeComparisonCase): string {
  const comparison = compareModelSides(model)
  if (comparison === 0) return '두 모둠의 성공 비율이 같습니다.'
  return `${comparison > 0 ? model.leftLabel : model.rightLabel}의 성공 비율이 더 높습니다.`
}

function contentFromModel(
  model: G6RatioRelativeComparisonCase,
): ApplicationProblemRenderedContentV1 {
  const correct = answerFor(model)
  const leftChoice = `${model.leftLabel}의 성공 비율이 더 높습니다.`
  const rightChoice = `${model.rightLabel}의 성공 비율이 더 높습니다.`
  const choices = [
    leftChoice,
    rightChoice,
    '두 모둠의 성공 비율이 같습니다.',
    '주어진 수로는 성공 비율을 비교할 수 없습니다.',
  ]
  const leftCross = model.leftSuccesses * model.rightTotal
  const rightCross = model.rightSuccesses * model.leftTotal
  return {
    prompt: `${model.leftLabel}은 ${model.trialName} ${model.leftTotal}번 중 ${model.successName} ${model.leftSuccesses}번, ${model.rightLabel}은 ${model.trialName} ${model.rightTotal}번 중 ${model.successName} ${model.rightSuccesses}번이었습니다. 어느 모둠의 성공 비율이 더 높은가요?`,
    answer: { format: 'choice', normalized: correct },
    choices,
    correctChoiceIndex: choices.indexOf(correct),
    solutionSteps: [
      `${model.leftLabel}의 비율은 ${model.leftSuccesses}/${model.leftTotal}, ${model.rightLabel}의 비율은 ${model.rightSuccesses}/${model.rightTotal}입니다.`,
      `같은 기준으로 비교하려고 ${model.leftSuccesses}×${model.rightTotal}=${leftCross}, ${model.rightSuccesses}×${model.leftTotal}=${rightCross}을 비교합니다.`,
      `${Math.max(leftCross, rightCross)}이 더 크므로 ${correct}`,
    ],
    hintSteps: [
      '성공 횟수가 더 많아도 전체 횟수까지 함께 보아야 성공 비율이 더 큰 것은 아닙니다.',
      '분자는 성공 횟수이고 분모는 기준이 되는 전체 횟수입니다. 둘을 뒤집지 마세요.',
      '두 분수를 비교할 때 왼쪽 분자×오른쪽 분모와 오른쪽 분자×왼쪽 분모를 비교해 보세요.',
    ],
  }
}

function numericCell(value: number) {
  return {
    before: { text: String(value), disclosure: 'given' as const },
    numericValue: value,
    numericDisclosure: 'given' as const,
  }
}

function targetPercentCell(numerator: number, denominator: number) {
  const percent = formatGeneratorPercent(numerator, denominator)
  return {
    before: { text: '?', disclosure: 'identifier' as const },
    after: { text: percent.text, disclosure: 'solution' as const },
    numericValue: percent.numericValue,
    numericDisclosure: 'solution' as const,
  }
}

export function createG6RatioRelativeComparisonScene(
  params: Readonly<Record<string, JsonValue>>,
): ApplicationVisualSceneV1 {
  const model = modelFromParams(params)
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'table',
    semantics: 'quantitative',
    caption: {
      before: { text: '성공 횟수와 전체 횟수 비교표', disclosure: 'given' },
      after: { text: answerFor(model), disclosure: 'solution' },
    },
    columns: [
      { before: { text: '모둠', disclosure: 'identifier' } },
      { before: { text: `${model.successName} 횟수`, disclosure: 'identifier' } },
      { before: { text: `전체 ${model.trialName} 횟수`, disclosure: 'identifier' } },
      { before: { text: '성공 비율 (%)', disclosure: 'identifier' } },
    ],
    rows: [
      {
        key: 'left-group',
        cells: [
          { before: { text: model.leftLabel, disclosure: 'identifier' } },
          numericCell(model.leftSuccesses),
          numericCell(model.leftTotal),
          targetPercentCell(model.leftSuccesses, model.leftTotal),
        ],
      },
      {
        key: 'right-group',
        cells: [
          { before: { text: model.rightLabel, disclosure: 'identifier' } },
          numericCell(model.rightSuccesses),
          numericCell(model.rightTotal),
          targetPercentCell(model.rightSuccesses, model.rightTotal),
        ],
      },
    ],
    constraints: [
      {
        kind: 'table-ratio',
        numerator: { rowKey: 'left-group', columnIndex: 1 },
        denominator: { rowKey: 'left-group', columnIndex: 2 },
        expected: model.leftSuccesses / model.leftTotal,
      },
      {
        kind: 'table-ratio',
        numerator: { rowKey: 'right-group', columnIndex: 1 },
        denominator: { rowKey: 'right-group', columnIndex: 2 },
        expected: model.rightSuccesses / model.rightTotal,
      },
    ],
  }
}

export const validateG6RatioRelativeComparisonVisual: ApplicationVisualFamilyValidator = (
  scene,
) => {
  const issues: ApplicationVisualValidationIssue[] = []
  if (scene.surface !== 'table') {
    return [
      {
        code: 'g6_ratio_surface_mismatch',
        path: 'scene.surface',
        message: 'relative comparison requires a quantitative table',
      },
    ]
  }
  if (
    scene.columns.length !== 4 ||
    scene.rows.length !== 2 ||
    scene.rows[0]?.key !== 'left-group' ||
    scene.rows[1]?.key !== 'right-group' ||
    !scene.columns[3]?.before?.text.includes('(%)')
  ) {
    issues.push({
      code: 'g6_ratio_structure_mismatch',
      path: 'scene',
      message: 'comparison table must contain two ratio rows and a labeled percent column',
    })
  }
  return issues
}

export const G6_RATIO_RELATIVE_COMPARISON_GENERATOR: ApplicationProblemFamilyGeneratorV1 = {
  familyId: G6_RATIO_RELATIVE_COMPARISON_FAMILY.familyId,
  version: G6_RATIO_RELATIVE_COMPARISON_FAMILY.version,
  packId: G6_RATIO_RELATIVE_COMPARISON_FAMILY.packId,
  packVersion: 1,
  maxAttempts: 1,
  visualGeneratorVersion: 1,
  sample({ seed, variantIndex }) {
    const caseIndex = selectFiniteCaseIndex(
      seed,
      variantIndex,
      G6_RATIO_RELATIVE_COMPARISON_CASES.length,
    )
    const params = caseParams(G6_RATIO_RELATIVE_COMPARISON_CASES[caseIndex])
    return {
      params,
      mathModel: createG6RatioRelativeComparisonScene(params) as unknown as JsonValue,
    }
  },
  render({ params }) {
    return contentFromModel(modelFromParams(params))
  },
}

export function generateG6RatioRelativeComparison(
  input: G6RatioGenerationInput,
): GeneratedApplicationProblemV1 {
  return generateApplicationProblem({
    family: G6_RATIO_RELATIVE_COMPARISON_FAMILY,
    generator: G6_RATIO_RELATIVE_COMPARISON_GENERATOR,
    packVersion: 1,
    ...input,
  })
}

export function validateG6RatioRelativeComparisonClosure(
  problem: GeneratedApplicationProblemV1,
): G6RatioClosureResult {
  const issues: G6RatioClosureIssue[] = []
  if (problem.familyId !== G6_RATIO_RELATIVE_COMPARISON_FAMILY.familyId) {
    addClosureIssue(issues, 'family_mismatch', 'problem.familyId', 'problem belongs to another family')
  }
  try {
    const model = modelFromParams(problem.params)
    const expectedContent = contentFromModel(model)
    if (problem.answer.format !== 'choice' || problem.answer.normalized !== expectedContent.answer.normalized) {
      addClosureIssue(issues, 'answer_params_mismatch', 'problem.answer', 'answer must be derived from params')
    }
    if (
      !problem.choices ||
      new Set(problem.choices).size !== 4 ||
      stableJson([...problem.choices].sort()) !== stableJson([...expectedContent.choices!].sort())
    ) {
      addClosureIssue(issues, 'choices_params_mismatch', 'problem.choices', 'choices must be derived from params')
    }
    validateSceneClosure(
      problem.visual.mathModel,
      createG6RatioRelativeComparisonScene(problem.params),
      issues,
    )
  } catch (error) {
    addClosureIssue(
      issues,
      'invalid_params',
      'problem.params',
      error instanceof Error ? error.message : 'params are invalid',
    )
  }
  return closureResult(issues)
}
