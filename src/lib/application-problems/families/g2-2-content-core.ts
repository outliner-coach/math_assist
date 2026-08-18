import {
  parseApplicationProblemFamilyV1,
  type ApplicationProblemFamilyV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
  type RequiredStudentAction,
} from '../contracts'
import {
  generateApplicationProblem,
  type ApplicationProblemFamilyGeneratorV1,
  type ApplicationProblemRenderedContentV1,
} from '../generator'
import {
  parseApplicationVisualSceneV1,
  type ApplicationVisualSceneV1,
} from '../visual-model'

export type G2FiniteCase = Readonly<Record<string, JsonValue>>

export interface G2FiniteDraftFamilyDefinition {
  familyId: string
  packId: string
  packVersion: number
  unitId: string
  conceptIds: readonly string[]
  primaryStandard: string
  connectedStandards: readonly string[]
  cognitiveDomain: 'applying' | 'reasoning'
  reasoningPattern:
    | 'inverse'
    | 'constraint'
    | 'multi_step'
    | 'representation_shift'
    | 'compare_methods'
    | 'error_analysis'
    | 'pattern_generalization'
    | 'systematic_counting'
    | 'optimization'
    | 'data_sufficiency'
    | 'model_and_check'
  representations: readonly ('text' | 'equation' | 'table' | 'diagram' | 'graph' | 'manipulative')[]
  modelId: string
  unknownRole: string
  requiredStudentActions: readonly RequiredStudentAction[]
  misconceptionRefs: readonly string[]
  visualSurface: 'diagram' | 'table'
  visualValueKeys: readonly string[]
  cases: readonly G2FiniteCase[]
  render(params: Readonly<Record<string, JsonValue>>): ApplicationProblemRenderedContentV1
}

export interface G2FiniteDraftFamily {
  family: ApplicationProblemFamilyV1
  generator: ApplicationProblemFamilyGeneratorV1
  cases: readonly G2FiniteCase[]
  reviewCases: readonly {
    caseId: string
    kind: 'representative' | 'boundary'
    seed: number
    variantIndex: number
  }[]
  generate(input: { seed: number; variantIndex: number }): GeneratedApplicationProblemV1
  visualSurface: 'diagram' | 'table'
  visualValueKeys: readonly string[]
}

const pendingApproval = Object.freeze({
  ownerStatus: 'pending' as const,
  evidenceRefs: Object.freeze([]),
  expertStatus: 'not-reviewed' as const,
})

function positiveMod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function publicText(text: string) {
  return { before: { text, disclosure: 'given' as const } }
}

const KOREAN_VISUAL_LABELS: Readonly<Record<string, string>> = Object.freeze({
  first: '첫째 수', second: '둘째 수', third: '셋째 수',
  thousands: '천의 자리', 'threshold-hundreds': '기준 백의 자리', tens: '십의 자리',
  d1: '수 카드 1', d2: '수 카드 2', d3: '수 카드 3', d4: '수 카드 4', limit: '기준 수',
  'first-groups': '첫 접시 묶음', 'second-groups': '둘째 접시 묶음', each: '한 묶음의 수',
  total: '전체', dan: '단', factor: '곱하는 수',
  'rows-a': '첫 배열의 줄', 'cols-a': '첫 배열의 한 줄', 'rows-b': '둘째 배열의 줄', 'cols-b': '둘째 배열의 한 줄',
  'object-length': '물건 길이', 'ruler-length': '도구 길이', estimate: '어림한 길이', measured: '잰 길이',
  whole: '전체 길이', known: '아는 길이', 'has-unit': '단위 정보', 'short-ruler': '짧은 자 길이',
  'start-hour': '시작 시', 'start-minute': '시작 분', elapsed: '걸린 분',
  'end-hour': '끝난 시', 'end-minute': '끝난 분', hour: '시침', 'minute-hand-number': '분침 숫자',
  weeks: '주 수', 'claimed-days': '말한 날 수',
  apple: '사과', grape: '포도', melon: '수박', soccer: '축구', baseball: '야구', dodgeball: '피구',
  marks: '표식 수', 'per-mark': '표식 한 개의 수', 'has-key': '표식 뜻 정보',
  start: '첫 수', step: '변화량', position: '자리', later: '뒤의 수', 'wrong-position': '확인할 자리',
})

function visualLabel(key: string): string {
  return KOREAN_VISUAL_LABELS[key] ?? '주어진 수'
}

function numericValue(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new TypeError(`${key} must be a positive safe integer for the visual model`)
  }
  return value as number
}

export function buildG2DraftVisualScene(input: {
  familyId: string
  surface: 'diagram' | 'table'
  valueKeys: readonly string[]
  params: Readonly<Record<string, JsonValue>>
}): ApplicationVisualSceneV1 {
  if (input.surface === 'table') {
    return {
      schemaVersion: 'application-visual-v1',
      surface: 'table',
      semantics: 'quantitative',
      caption: publicText('문제에 주어진 수를 표로 나타냈어요.'),
      columns: [publicText('항목'), publicText('주어진 수')],
      rows: input.valueKeys.map((key) => ({
        key: `given-${key}`,
        cells: [
          publicText(visualLabel(key)),
          {
            ...publicText(String(input.params[key])),
            numericValue: numericValue(input.params, key),
            numericDisclosure: 'given',
          },
        ],
      })),
      constraints: [],
    }
  }

  const values = input.valueKeys.map((key) => numericValue(input.params, key))
  const maxValue = Math.max(...values)
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: maxValue + 80, height: input.valueKeys.length * 38 + 30 },
    scale: { x: 1, y: 1 },
    description: publicText('문제에 주어진 양만 길이에 맞게 나타낸 그림'),
    primitives: input.valueKeys.map((key, index) => ({
      key: `given-${key}`,
      kind: 'line',
      x1: 20,
      y1: 28 + index * 38,
      x2: 20 + values[index],
      y2: 28 + index * 38,
      disclosure: 'given',
      styleRole: index % 2 === 0 ? 'primary' : 'secondary',
      emphasis: 'normal',
    })),
    labels: input.valueKeys.map((key, index) => ({
      key: `label-${key}`,
      targetKey: `given-${key}`,
      x: 25 + values[index],
      y: 20 + index * 38,
      content: publicText(`${visualLabel(key)} ${values[index]}`),
      styleRole: index % 2 === 0 ? 'primary' : 'secondary',
    })),
    constraints: input.valueKeys.map((key, index) => ({
      kind: 'segment-length',
      primitiveKey: `given-${key}`,
      expected: values[index],
    })),
  } as ApplicationVisualSceneV1
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value) ?? 'undefined'
}

export function createG2FiniteDraftFamily(
  definition: G2FiniteDraftFamilyDefinition,
): G2FiniteDraftFamily {
  if (definition.cases.length < 2) {
    throw new TypeError(`${definition.familyId} needs representative and boundary finite cases`)
  }
  const family = parseApplicationProblemFamilyV1({
    schemaVersion: 'application-problem-family-v1',
    familyId: definition.familyId,
    version: 1,
    packId: definition.packId,
    unitId: definition.unitId,
    conceptIds: definition.conceptIds,
    primaryStandard: definition.primaryStandard,
    connectedStandards: definition.connectedStandards,
    cognitiveDomain: definition.cognitiveDomain,
    reasoningPattern: definition.reasoningPattern,
    representations: definition.representations,
    contextType: 'real_world',
    readingLoad: 'low',
    estimatedSteps: definition.cognitiveDomain === 'reasoning' ? 3 : 2,
    modelId: definition.modelId,
    unknownRole: definition.unknownRole,
    requiredStudentActions: definition.requiredStudentActions,
    misconceptionRefs: definition.misconceptionRefs,
    visualPolicy: {
      role: 'required',
      semantics: 'quantitative',
      generatorId: `${definition.familyId}-visual`,
      answerCritical: true,
    },
    proofMode: 'exhaustive',
    runtimeMode: 'deterministic-generator',
    releaseStatus: 'draft',
    approval: pendingApproval,
  })
  const generator: ApplicationProblemFamilyGeneratorV1 = {
    familyId: family.familyId,
    version: family.version,
    packId: family.packId,
    packVersion: definition.packVersion,
    maxAttempts: 1,
    visualGeneratorVersion: 1,
    sample: ({ seed, variantIndex }) => {
      const index = (positiveMod(seed, definition.cases.length) +
        positiveMod(variantIndex, definition.cases.length)) % definition.cases.length
      const params = definition.cases[index]
      return {
        params: { ...params },
        mathModel: buildG2DraftVisualScene({
          familyId: family.familyId,
          surface: definition.visualSurface,
          valueKeys: definition.visualValueKeys,
          params,
        }) as unknown as JsonValue,
      }
    },
    render: ({ params }) => definition.render(params),
  }
  const generate = (input: { seed: number; variantIndex: number }) =>
    generateApplicationProblem({
      family,
      generator,
      packVersion: definition.packVersion,
      seed: input.seed,
      variantIndex: input.variantIndex,
    })
  return Object.freeze({
    family,
    generator,
    cases: Object.freeze([...definition.cases]),
    reviewCases: Object.freeze([
      Object.freeze({
        caseId: `${family.familyId}-representative`,
        kind: 'representative' as const,
        seed: 0,
        variantIndex: 0,
      }),
      Object.freeze({
        caseId: `${family.familyId}-boundary`,
        kind: 'boundary' as const,
        seed: 0,
        variantIndex: definition.cases.length - 1,
      }),
    ]),
    generate,
    visualSurface: definition.visualSurface,
    visualValueKeys: Object.freeze([...definition.visualValueKeys]),
  })
}

export function validateG2FiniteDraftVisual(
  problem: GeneratedApplicationProblemV1,
  families: readonly G2FiniteDraftFamily[],
): boolean {
  const definition = families.find(({ family }) => family.familyId === problem.familyId)
  if (!definition || problem.generatorVersion !== 1 || !problem.visual.mathModel) return false
  try {
    const parsed = parseApplicationVisualSceneV1(problem.visual.mathModel)
    const expected = buildG2DraftVisualScene({
      familyId: problem.familyId,
      surface: definition.visualSurface,
      valueKeys: definition.visualValueKeys,
      params: problem.params,
    })
    return stableJson(parsed) === stableJson(expected)
  } catch {
    return false
  }
}

export interface G2FiniteProofReport {
  familyId: string
  checkedCount: number
  proven: boolean
  issues: readonly string[]
}

export function proveG2FiniteDraftFamilies(input: {
  families: readonly G2FiniteDraftFamily[]
  oracle(problem: GeneratedApplicationProblemV1): string
  validateVisual(problem: GeneratedApplicationProblemV1): boolean
}): G2FiniteProofReport[] {
  return input.families.map((draft) => {
    const issues: string[] = []
    draft.cases.forEach((_, variantIndex) => {
      try {
        const first = draft.generate({ seed: 0, variantIndex })
        const second = draft.generate({ seed: 0, variantIndex })
        if (stableJson(first) !== stableJson(second)) issues.push(`case ${variantIndex} is not deterministic`)
        if (input.oracle(first) !== first.answer.normalized) issues.push(`case ${variantIndex} oracle mismatch`)
        if (!input.validateVisual(first)) issues.push(`case ${variantIndex} visual mismatch`)
      } catch (error) {
        issues.push(`case ${variantIndex} failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    })
    return Object.freeze({
      familyId: draft.family.familyId,
      checkedCount: draft.cases.length,
      proven: issues.length === 0,
      issues: Object.freeze(issues),
    })
  })
}
