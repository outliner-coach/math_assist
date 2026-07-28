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
  formatFiniteDecimal,
  normalizeGeneratorFraction,
  readSafeInteger,
  readString,
  selectFiniteCaseIndex,
  stableJson,
  validateSceneClosure,
  type G6RatioClosureIssue,
  type G6RatioClosureResult,
  type G6RatioGenerationInput,
} from './g6-ratio-common'

export interface G6RatioRepresentationBase {
  baseIndex: number
  numerator: number
  denominator: number
}

const REPRESENTATION_BASE_VALUES = [
  [1, 20],
  [1, 10],
  [3, 20],
  [1, 5],
  [1, 4],
  [3, 10],
  [7, 20],
  [2, 5],
  [1, 2],
  [3, 5],
  [7, 10],
  [3, 4],
  [4, 5],
  [9, 10],
  [19, 20],
] as const

export const G6_RATIO_REPRESENTATION_BASES: readonly G6RatioRepresentationBase[] =
  Object.freeze(
    REPRESENTATION_BASE_VALUES.map(([numerator, denominator], baseIndex) =>
      Object.freeze({ baseIndex, numerator, denominator }),
    ),
  )

export type G6RatioRepresentationErrorMode =
  | 'decimal-percent-shift'
  | 'reference-inversion'
  | 'numerator-only'

const ERROR_MODES: readonly {
  errorMode: G6RatioRepresentationErrorMode
  misconceptionId: string
}[] = [
  {
    errorMode: 'decimal-percent-shift',
    misconceptionId: 'ratio-percent-decimal-place-shift',
  },
  {
    errorMode: 'reference-inversion',
    misconceptionId: 'ratio-denominator-is-selected-part',
  },
  {
    errorMode: 'numerator-only',
    misconceptionId: 'ratio-representation-numerator-only',
  },
]

export interface G6RatioRepresentationCase extends G6RatioRepresentationBase {
  caseIndex: number
  caseId: string
  errorMode: G6RatioRepresentationErrorMode
  misconceptionId: string
}

export const G6_RATIO_REPRESENTATION_CASES: readonly G6RatioRepresentationCase[] =
  Object.freeze(
    G6_RATIO_REPRESENTATION_BASES.flatMap((base) =>
      ERROR_MODES.map((mode) => ({ ...base, ...mode, caseIndex: 0, caseId: '' })),
    ).map((entry, caseIndex) =>
      Object.freeze({
        ...entry,
        caseIndex,
        caseId: `g6-ratio-representation-check-${String(caseIndex + 1).padStart(3, '0')}`,
      }),
    ),
  )

export const G6_RATIO_REPRESENTATION_CHECK_PROOF_DOMAIN = createProofDomain(
  'g6-ratio-representation-check',
  G6_RATIO_REPRESENTATION_CASES.length,
)

export const G6_RATIO_REPRESENTATION_CHECK_FAMILY = parseApplicationProblemFamilyV1({
  schemaVersion: 'application-problem-family-v1',
  familyId: 'g6-ratio-representation-check',
  version: 1,
  packId: 'pack-unit-6-1-ratio',
  unitId: 'unit-6-1-ratio',
  conceptIds: ['ratio-representation-equivalence'],
  primaryStandard: '[6수02-03]',
  connectedStandards: ['[6수02-02]'],
  cognitiveDomain: 'reasoning',
  reasoningPattern: 'error_analysis',
  representations: ['text', 'table'],
  contextType: 'pure_math',
  readingLoad: 'medium',
  estimatedSteps: 3,
  modelId: 'ratio-representation-claim-check',
  unknownRole: 'incorrect-equivalence-claim',
  requiredStudentActions: [
    'convert_representation',
    'evaluate_claim',
    'test_constraint',
    'verify_result',
  ],
  misconceptionRefs: [
    'ratio-percent-decimal-place-shift',
    'ratio-denominator-is-selected-part',
    'ratio-representation-numerator-only',
  ],
  visualPolicy: {
    role: 'required',
    semantics: 'quantitative',
    generatorId: 'g6-ratio-representation-check-visual',
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

interface RepresentationModel extends G6RatioRepresentationCase {
  comparisonQuantity: number
  referenceQuantity: number
  fraction: string
  decimal: string
  percent: number
  fractionClaim: string
  decimalClaim: string
  percentClaim: string
  hundredthsClaim: string
}

function claimsFor(
  entry: G6RatioRepresentationCase,
): Omit<
  RepresentationModel,
  keyof G6RatioRepresentationCase | 'comparisonQuantity' | 'referenceQuantity'
> {
  const fraction = normalizeGeneratorFraction(entry.numerator, entry.denominator)
  const decimal = formatFiniteDecimal(entry.numerator, entry.denominator)
  const percent = (entry.numerator * 100) / entry.denominator
  if (!Number.isSafeInteger(percent)) {
    throw new TypeError('representation bases must have an integral percent numerator')
  }
  const fractionDisplay =
    entry.errorMode === 'reference-inversion'
      ? normalizeGeneratorFraction(entry.denominator, entry.numerator)
      : fraction
  const percentDisplay = entry.errorMode === 'decimal-percent-shift' ? decimal : String(percent)
  const hundredthsNumerator = entry.errorMode === 'numerator-only' ? entry.numerator : percent
  return {
    fraction,
    decimal,
    percent,
    fractionClaim: `분수 주장: 비교하는 양/기준량은 ${fractionDisplay}입니다.`,
    decimalClaim: `소수 주장: 같은 비율은 ${decimal}입니다.`,
    percentClaim: `백분율 주장: 같은 비율은 ${percentDisplay}%입니다.`,
    hundredthsClaim: `분모가 100인 분수 주장: 같은 비율은 ${hundredthsNumerator}/100입니다.`,
  }
}

function modelForCase(entry: G6RatioRepresentationCase): RepresentationModel {
  return {
    ...entry,
    comparisonQuantity: entry.numerator,
    referenceQuantity: entry.denominator,
    ...claimsFor(entry),
  }
}

function caseParams(entry: G6RatioRepresentationCase): Record<string, JsonValue> {
  const model = modelForCase(entry)
  return {
    caseIndex: model.caseIndex,
    caseId: model.caseId,
    baseIndex: model.baseIndex,
    numerator: model.numerator,
    denominator: model.denominator,
    comparisonQuantity: model.comparisonQuantity,
    referenceQuantity: model.referenceQuantity,
    errorMode: model.errorMode,
    misconceptionId: model.misconceptionId,
    fraction: model.fraction,
    decimal: model.decimal,
    percent: model.percent,
    fractionClaim: model.fractionClaim,
    decimalClaim: model.decimalClaim,
    percentClaim: model.percentClaim,
    hundredthsClaim: model.hundredthsClaim,
  }
}

function modelFromParams(params: Readonly<Record<string, JsonValue>>): RepresentationModel {
  const errorMode = readString(params, 'errorMode')
  if (!ERROR_MODES.some((entry) => entry.errorMode === errorMode)) {
    throw new TypeError('errorMode is unsupported')
  }
  const entry: G6RatioRepresentationCase = {
    caseIndex: readSafeInteger(params, 'caseIndex'),
    caseId: readString(params, 'caseId'),
    baseIndex: readSafeInteger(params, 'baseIndex'),
    numerator: readSafeInteger(params, 'numerator'),
    denominator: readSafeInteger(params, 'denominator'),
    errorMode: errorMode as G6RatioRepresentationErrorMode,
    misconceptionId: readString(params, 'misconceptionId'),
  }
  const expectedMisconception = ERROR_MODES.find(
    (mode) => mode.errorMode === entry.errorMode,
  )!.misconceptionId
  const model = modelForCase(entry)
  if (
    entry.numerator < 1 ||
    entry.denominator < 1 ||
    entry.numerator >= entry.denominator ||
    entry.misconceptionId !== expectedMisconception ||
    readSafeInteger(params, 'comparisonQuantity') !== model.comparisonQuantity ||
    readSafeInteger(params, 'referenceQuantity') !== model.referenceQuantity ||
    readString(params, 'fraction') !== model.fraction ||
    readString(params, 'decimal') !== model.decimal ||
    readSafeInteger(params, 'percent') !== model.percent ||
    readString(params, 'fractionClaim') !== model.fractionClaim ||
    readString(params, 'decimalClaim') !== model.decimalClaim ||
    readString(params, 'percentClaim') !== model.percentClaim ||
    readString(params, 'hundredthsClaim') !== model.hundredthsClaim
  ) {
    throw new TypeError('representation params do not form the declared rational claim set')
  }
  return model
}

function incorrectClaim(model: RepresentationModel): string {
  if (model.errorMode === 'decimal-percent-shift') return model.percentClaim
  if (model.errorMode === 'reference-inversion') return model.fractionClaim
  return model.hundredthsClaim
}

function explanationFor(model: RepresentationModel): string {
  if (model.errorMode === 'decimal-percent-shift') {
    return `${model.decimal}은 ${model.percent}%이므로 소수 값을 그대로 퍼센트 기호 앞에 쓰면 안 됩니다.`
  }
  if (model.errorMode === 'reference-inversion') {
    return `비교하는 양 ${model.comparisonQuantity}을 분자, 기준량 ${model.referenceQuantity}을 분모에 두어야 합니다.`
  }
  return `분모를 100으로 바꿀 때에는 분자도 같은 값의 비율을 유지하도록 ${model.percent}로 바꾸어야 합니다.`
}

function hintFor(model: RepresentationModel): string {
  if (model.errorMode === 'decimal-percent-shift') {
    return '소수를 백분율로 바꿀 때 전체 1이 전체 100%라는 기준을 확인하세요.'
  }
  if (model.errorMode === 'reference-inversion') {
    return '비교하는 양/기준량의 순서를 먼저 적고 분자와 분모를 뒤집지 않았는지 확인하세요.'
  }
  return '분모만 100으로 바꾸면 값이 달라집니다. 분자와 분모의 변화를 함께 확인하세요.'
}

function contentFromModel(model: RepresentationModel): ApplicationProblemRenderedContentV1 {
  const choices = [
    model.fractionClaim,
    model.decimalClaim,
    model.percentClaim,
    model.hundredthsClaim,
  ]
  const answer = incorrectClaim(model)
  return {
    prompt: `기준량 ${model.referenceQuantity} 중 비교하는 양이 ${model.comparisonQuantity}일 때, 다음 분수·소수·백분율 관련 주장 중 잘못된 주장 하나를 고르세요.`,
    answer: { format: 'choice', normalized: answer },
    choices,
    correctChoiceIndex: choices.indexOf(answer),
    solutionSteps: [
      `비율은 비교하는 양/기준량이므로 ${model.comparisonQuantity}/${model.referenceQuantity}=${model.fraction}입니다.`,
      `${model.fraction}은 소수 ${model.decimal}, 백분율 ${model.percent}%와 같습니다.`,
      `${explanationFor(model)} 따라서 잘못된 주장은 “${answer}”입니다.`,
    ],
    hintSteps: [
      hintFor(model),
      '분수, 소수, 백분율을 각각 같은 전체 1을 기준으로 바꾸어 서로 같은 값인지 확인하세요.',
      '주장 네 개를 한 번에 추측하지 말고 각 표현을 원래 분수와 하나씩 비교하세요.',
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

function targetCell(text: string, value: number) {
  return {
    before: { text: '?', disclosure: 'identifier' as const },
    after: { text, disclosure: 'solution' as const },
    numericValue: value,
    numericDisclosure: 'solution' as const,
  }
}

export function createG6RatioRepresentationCheckScene(
  params: Readonly<Record<string, JsonValue>>,
): ApplicationVisualSceneV1 {
  const model = modelFromParams(params)
  const rationalValue = model.comparisonQuantity / model.referenceQuantity
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'table',
    semantics: 'quantitative',
    caption: {
      before: { text: '한 비율의 여러 표현 확인표', disclosure: 'given' },
      after: {
        text: `${model.fraction} = ${model.decimal} = ${model.percent}%`,
        disclosure: 'solution',
      },
    },
    columns: [
      { before: { text: '비교하는 양', disclosure: 'identifier' } },
      { before: { text: '기준량', disclosure: 'identifier' } },
      { before: { text: '분수', disclosure: 'identifier' } },
      { before: { text: '소수', disclosure: 'identifier' } },
      { before: { text: '비율 (%)', disclosure: 'identifier' } },
    ],
    rows: [
      {
        key: 'ratio-row',
        cells: [
          numericCell(model.comparisonQuantity),
          numericCell(model.referenceQuantity),
          targetCell(model.fraction, rationalValue),
          targetCell(model.decimal, rationalValue),
          targetCell(String(model.percent), model.percent),
        ],
      },
    ],
    constraints: [
      {
        kind: 'table-ratio',
        numerator: { rowKey: 'ratio-row', columnIndex: 0 },
        denominator: { rowKey: 'ratio-row', columnIndex: 1 },
        expected: rationalValue,
      },
      {
        kind: 'table-ratio',
        numerator: { rowKey: 'ratio-row', columnIndex: 2 },
        denominator: { rowKey: 'ratio-row', columnIndex: 3 },
        expected: 1,
      },
    ],
  }
}

export const validateG6RatioRepresentationCheckVisual: ApplicationVisualFamilyValidator = (
  scene,
) => {
  const issues: ApplicationVisualValidationIssue[] = []
  if (scene.surface !== 'table') {
    return [
      {
        code: 'g6_ratio_surface_mismatch',
        path: 'scene.surface',
        message: 'representation checking requires a quantitative table',
      },
    ]
  }
  if (
    scene.columns.length !== 5 ||
    scene.rows.length !== 1 ||
    scene.rows[0]?.key !== 'ratio-row' ||
    !scene.columns[4]?.before?.text.includes('(%)')
  ) {
    issues.push({
      code: 'g6_ratio_structure_mismatch',
      path: 'scene',
      message: 'representation table must bind quantity, fraction, decimal, and percent cells',
    })
  }
  return issues
}

export const G6_RATIO_REPRESENTATION_CHECK_GENERATOR: ApplicationProblemFamilyGeneratorV1 = {
  familyId: G6_RATIO_REPRESENTATION_CHECK_FAMILY.familyId,
  version: G6_RATIO_REPRESENTATION_CHECK_FAMILY.version,
  packId: G6_RATIO_REPRESENTATION_CHECK_FAMILY.packId,
  packVersion: 1,
  maxAttempts: 1,
  visualGeneratorVersion: 1,
  sample({ seed, variantIndex }) {
    const caseIndex = selectFiniteCaseIndex(
      seed,
      variantIndex,
      G6_RATIO_REPRESENTATION_CASES.length,
    )
    const params = caseParams(G6_RATIO_REPRESENTATION_CASES[caseIndex])
    return {
      params,
      mathModel: createG6RatioRepresentationCheckScene(params) as unknown as JsonValue,
    }
  },
  render({ params }) {
    return contentFromModel(modelFromParams(params))
  },
}

export function generateG6RatioRepresentationCheck(
  input: G6RatioGenerationInput,
): GeneratedApplicationProblemV1 {
  return generateApplicationProblem({
    family: G6_RATIO_REPRESENTATION_CHECK_FAMILY,
    generator: G6_RATIO_REPRESENTATION_CHECK_GENERATOR,
    packVersion: 1,
    ...input,
  })
}

export function validateG6RatioRepresentationCheckClosure(
  problem: GeneratedApplicationProblemV1,
): G6RatioClosureResult {
  const issues: G6RatioClosureIssue[] = []
  if (problem.familyId !== G6_RATIO_REPRESENTATION_CHECK_FAMILY.familyId) {
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
      addClosureIssue(issues, 'choices_params_mismatch', 'problem.choices', 'claims must be derived from params')
    }
    validateSceneClosure(
      problem.visual.mathModel,
      createG6RatioRepresentationCheckScene(problem.params),
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
