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
  normalizeGeneratorFraction,
  readSafeInteger,
  readString,
  selectFiniteCaseIndex,
  stableJson,
  validateSceneClosure,
  type G6RatioClosureResult,
  type G6RatioClosureIssue,
  type G6RatioGenerationInput,
} from './g6-ratio-common'

const FRACTIONS = [
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [2, 5],
  [3, 5],
  [1, 6],
  [5, 6],
  [3, 8],
  [5, 8],
  [3, 10],
  [7, 10],
] as const

const SCALES = [2, 3, 4, 5] as const

const CONTEXTS = [
  {
    contextId: 'bead-box',
    opening: '구슬 상자에',
    wholeName: '구슬',
    knownName: '파란 구슬',
    missingName: '빨간 구슬',
    unit: '개',
  },
  {
    contextId: 'reading-plan',
    opening: '오늘 읽기로 한 책에서',
    wholeName: '쪽',
    knownName: '아직 읽지 않은 쪽',
    missingName: '읽은 쪽',
    unit: '쪽',
  },
  {
    contextId: 'seedling-tray',
    opening: '모종판에서',
    wholeName: '모종',
    knownName: '아직 싹이 나지 않은 모종',
    missingName: '싹이 난 모종',
    unit: '개',
  },
] as const

export interface G6RatioPartWholeCase {
  caseIndex: number
  caseId: string
  numerator: number
  denominator: number
  scale: number
  contextIndex: number
  contextId: string
  opening: string
  wholeName: string
  knownName: string
  missingName: string
  unit: string
  total: number
  missing: number
  known: number
}

export const G6_RATIO_PART_WHOLE_CASES: readonly G6RatioPartWholeCase[] = Object.freeze(
  FRACTIONS.flatMap(([numerator, denominator]) =>
    SCALES.flatMap((scale) =>
      CONTEXTS.map((context, contextIndex) => ({
        caseIndex: 0,
        caseId: '',
        numerator,
        denominator,
        scale,
        contextIndex,
        ...context,
        total: denominator * scale,
        missing: numerator * scale,
        known: (denominator - numerator) * scale,
      })),
    ),
  ).map((entry, caseIndex) =>
    Object.freeze({
      ...entry,
      caseIndex,
      caseId: `g6-ratio-part-whole-${String(caseIndex + 1).padStart(3, '0')}`,
    }),
  ),
)

export const G6_RATIO_PART_WHOLE_PROOF_DOMAIN = createProofDomain(
  'g6-ratio-part-whole',
  G6_RATIO_PART_WHOLE_CASES.length,
)

export const G6_RATIO_PART_WHOLE_FAMILY = parseApplicationProblemFamilyV1({
  schemaVersion: 'application-problem-family-v1',
  familyId: 'g6-ratio-part-whole',
  version: 1,
  packId: 'pack-unit-6-1-ratio',
  unitId: 'unit-6-1-ratio',
  conceptIds: ['ratio-part-whole-model'],
  primaryStandard: '[6수02-02]',
  connectedStandards: ['[6수02-03]'],
  cognitiveDomain: 'applying',
  reasoningPattern: 'multi_step',
  representations: ['text', 'diagram'],
  contextType: 'real_world',
  readingLoad: 'medium',
  estimatedSteps: 3,
  modelId: 'missing-part-to-whole-ratio',
  unknownRole: 'missing-part-ratio',
  requiredStudentActions: [
    'interpret_context',
    'infer_missing_value',
    'choose_model',
    'execute_calculation',
  ],
  misconceptionRefs: [
    'ratio-part-whole-order-reversal',
    'ratio-part-part-confused-with-part-whole',
  ],
  visualPolicy: {
    role: 'required',
    semantics: 'quantitative',
    generatorId: 'g6-ratio-part-whole-visual',
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

function caseParams(entry: G6RatioPartWholeCase): Record<string, JsonValue> {
  return {
    caseIndex: entry.caseIndex,
    caseId: entry.caseId,
    numerator: entry.numerator,
    denominator: entry.denominator,
    scale: entry.scale,
    contextIndex: entry.contextIndex,
    contextId: entry.contextId,
    opening: entry.opening,
    wholeName: entry.wholeName,
    knownName: entry.knownName,
    missingName: entry.missingName,
    unit: entry.unit,
    total: entry.total,
    missing: entry.missing,
    known: entry.known,
  }
}

function modelFromParams(params: Readonly<Record<string, JsonValue>>): G6RatioPartWholeCase {
  const caseIndex = readSafeInteger(params, 'caseIndex')
  const model: G6RatioPartWholeCase = {
    caseIndex,
    caseId: readString(params, 'caseId'),
    numerator: readSafeInteger(params, 'numerator'),
    denominator: readSafeInteger(params, 'denominator'),
    scale: readSafeInteger(params, 'scale'),
    contextIndex: readSafeInteger(params, 'contextIndex'),
    contextId: readString(params, 'contextId'),
    opening: readString(params, 'opening'),
    wholeName: readString(params, 'wholeName'),
    knownName: readString(params, 'knownName'),
    missingName: readString(params, 'missingName'),
    unit: readString(params, 'unit'),
    total: readSafeInteger(params, 'total'),
    missing: readSafeInteger(params, 'missing'),
    known: readSafeInteger(params, 'known'),
  }
  if (
    model.denominator < 1 ||
    model.numerator < 1 ||
    model.numerator >= model.denominator ||
    model.scale < 1 ||
    model.total !== model.denominator * model.scale ||
    model.missing !== model.numerator * model.scale ||
    model.known !== model.total - model.missing
  ) {
    throw new TypeError('part-whole params do not form the declared rational model')
  }
  return model
}

function contentFromModel(model: G6RatioPartWholeCase): ApplicationProblemRenderedContentV1 {
  const correct = normalizeGeneratorFraction(model.missing, model.total)
  const reversed = normalizeGeneratorFraction(model.total, model.missing)
  const missingToKnown = normalizeGeneratorFraction(model.missing, model.known)
  const knownToTotal = normalizeGeneratorFraction(model.known, model.total)
  return {
    prompt: `${model.opening} 전체 ${model.total}${model.unit} 중 ${model.knownName}은 ${model.known}${model.unit}입니다. 나머지 ${model.missingName} 수와 전체 수의 비율을 기약분수로 나타내세요.`,
    answer: { format: 'choice', normalized: correct },
    choices: [correct, reversed, missingToKnown, knownToTotal],
    correctChoiceIndex: 0,
    solutionSteps: [
      `나머지 ${model.missingName} 수는 ${model.total}-${model.known}=${model.missing}${model.unit}입니다.`,
      `${model.missingName} 수를 비교하는 양, 전체 ${model.wholeName} 수를 기준량으로 두어 ${model.missing}/${model.total}로 나타냅니다.`,
      `${model.missing}/${model.total}을 기약분수로 나타내면 ${correct}입니다.`,
    ],
    hintSteps: [
      `먼저 전체 ${model.total}${model.unit}에서 알려진 ${model.known}${model.unit}를 빼서 나머지를 구하세요.`,
      '부분과 전체의 비율은 부분/전체 순서입니다. 전체/부분으로 뒤집지 마세요.',
      '나머지 부분과 알려진 부분의 비가 아니라, 나머지 부분과 전체의 비율을 찾습니다.',
    ],
  }
}

export function createG6RatioPartWholeScene(
  params: Readonly<Record<string, JsonValue>>,
): ApplicationVisualSceneV1 {
  const model = modelFromParams(params)
  const barX = 30
  const barY = 42
  const barWidth = 300
  const barHeight = 52
  const missingWidth = (barWidth * model.missing) / model.total
  const knownWidth = barWidth - missingWidth
  const answer = normalizeGeneratorFraction(model.missing, model.total)
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: 360, height: 150 },
    scale: { x: 1, y: 1 },
    description: {
      before: {
        text: `전체 막대에서 ${model.knownName}의 양은 주어지고 나머지는 물음표로 표시됩니다.`,
        disclosure: 'given',
      },
      after: {
        text: `나머지 ${model.missingName}은 ${model.missing}${model.unit}이고 전체에 대한 비율은 ${answer}입니다.`,
        disclosure: 'solution',
      },
    },
    primitives: [
      {
        key: 'whole-bar',
        kind: 'rect',
        x: barX,
        y: barY,
        width: barWidth,
        height: barHeight,
        disclosure: 'given',
        styleRole: 'muted',
        emphasis: 'normal',
      },
      {
        key: 'missing-part',
        kind: 'rect',
        x: barX,
        y: barY,
        width: missingWidth,
        height: barHeight,
        disclosure: 'given',
        styleRole: 'accent',
        emphasis: 'normal',
      },
      {
        key: 'known-part',
        kind: 'rect',
        x: barX + missingWidth,
        y: barY,
        width: knownWidth,
        height: barHeight,
        disclosure: 'given',
        styleRole: 'secondary',
        emphasis: 'normal',
      },
    ],
    labels: [
      {
        key: 'whole-label',
        x: 180,
        y: 22,
        content: {
          before: { text: `전체 ${model.total}${model.unit}`, disclosure: 'given' },
        },
        styleRole: 'muted',
      },
      {
        key: 'missing-label',
        targetKey: 'missing-part',
        x: barX + missingWidth / 2,
        y: barY + barHeight / 2,
        content: {
          before: { text: '?', disclosure: 'identifier' },
          after: { text: `${model.missing}${model.unit}`, disclosure: 'intermediate' },
        },
        styleRole: 'accent',
      },
      {
        key: 'known-label',
        targetKey: 'known-part',
        x: barX + missingWidth + knownWidth / 2,
        y: barY + barHeight / 2,
        content: {
          before: { text: `${model.known}${model.unit}`, disclosure: 'given' },
        },
        styleRole: 'secondary',
      },
      {
        key: 'ratio-label',
        x: 180,
        y: 125,
        content: {
          before: { text: '나머지 부분 / 전체', disclosure: 'identifier' },
          after: { text: `${model.missingName}의 비율 ${answer}`, disclosure: 'solution' },
        },
        styleRole: 'primary',
      },
    ],
    constraints: [
      {
        kind: 'area',
        primitiveKey: 'whole-bar',
        expected: barWidth * barHeight,
      },
      {
        kind: 'ratio',
        numeratorKey: 'missing-part',
        denominatorKey: 'whole-bar',
        metric: 'area',
        expected: model.missing / model.total,
      },
      {
        kind: 'topology',
        firstKey: 'whole-bar',
        secondKey: 'missing-part',
        relation: 'contains',
      },
      {
        kind: 'topology',
        firstKey: 'whole-bar',
        secondKey: 'known-part',
        relation: 'contains',
      },
    ],
  }
}

export const validateG6RatioPartWholeVisual: ApplicationVisualFamilyValidator = (scene) => {
  const issues: ApplicationVisualValidationIssue[] = []
  if (scene.surface !== 'diagram') {
    issues.push({
      code: 'g6_ratio_surface_mismatch',
      path: 'scene.surface',
      message: 'part-whole ratios require a proportional diagram',
    })
    return issues
  }
  const keys = new Set(scene.primitives.map((primitive) => primitive.key))
  for (const key of ['whole-bar', 'missing-part', 'known-part']) {
    if (!keys.has(key)) {
      issues.push({
        code: 'g6_ratio_structure_mismatch',
        path: 'scene.primitives',
        message: `part-whole diagram is missing ${key}`,
      })
    }
  }
  return issues
}

export const G6_RATIO_PART_WHOLE_GENERATOR: ApplicationProblemFamilyGeneratorV1 = {
  familyId: G6_RATIO_PART_WHOLE_FAMILY.familyId,
  version: G6_RATIO_PART_WHOLE_FAMILY.version,
  packId: G6_RATIO_PART_WHOLE_FAMILY.packId,
  packVersion: 1,
  maxAttempts: 1,
  visualGeneratorVersion: 1,
  sample({ seed, variantIndex }) {
    const caseIndex = selectFiniteCaseIndex(
      seed,
      variantIndex,
      G6_RATIO_PART_WHOLE_CASES.length,
    )
    const params = caseParams(G6_RATIO_PART_WHOLE_CASES[caseIndex])
    return {
      params,
      mathModel: createG6RatioPartWholeScene(params) as unknown as JsonValue,
    }
  },
  render({ params }) {
    return contentFromModel(modelFromParams(params))
  },
}

export function generateG6RatioPartWhole(
  input: G6RatioGenerationInput,
): GeneratedApplicationProblemV1 {
  return generateApplicationProblem({
    family: G6_RATIO_PART_WHOLE_FAMILY,
    generator: G6_RATIO_PART_WHOLE_GENERATOR,
    packVersion: 1,
    ...input,
  })
}

export function validateG6RatioPartWholeClosure(
  problem: GeneratedApplicationProblemV1,
): G6RatioClosureResult {
  const issues: G6RatioClosureIssue[] = []
  if (problem.familyId !== G6_RATIO_PART_WHOLE_FAMILY.familyId) {
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
    validateSceneClosure(problem.visual.mathModel, createG6RatioPartWholeScene(problem.params), issues)
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
