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
export type G2VisualValueKeys =
  | readonly string[]
  | ((params: Readonly<Record<string, JsonValue>>) => readonly string[])

export interface G2FiniteDomainBoundaryEvidence {
  classId: string
  description: string
  variantIndexes: readonly number[]
  matches(params: G2FiniteCase): boolean
}

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
  visualValueKeys: G2VisualValueKeys
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
    boundaryClassIds: readonly string[]
  }[]
  boundaryEvidence: readonly G2FiniteDomainBoundaryEvidence[]
  domainJustification: string
  generate(input: { seed: number; variantIndex: number }): GeneratedApplicationProblemV1
  visualSurface: 'diagram' | 'table'
  resolveVisualValueKeys(params: G2FiniteCase): readonly string[]
}

const pendingApproval = Object.freeze({
  ownerStatus: 'pending' as const,
  evidenceRefs: Object.freeze([]),
  expertStatus: 'not-reviewed' as const,
})

function positiveMod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function resolveVisualValueKeys(
  definition: Pick<G2FiniteDraftFamilyDefinition, 'visualValueKeys'>,
  params: G2FiniteCase,
): readonly string[] {
  const keys = typeof definition.visualValueKeys === 'function'
    ? definition.visualValueKeys(params)
    : definition.visualValueKeys
  if (keys.length === 0 || new Set(keys).size !== keys.length) {
    throw new TypeError('visual value keys must be a non-empty unique list')
  }
  keys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      throw new TypeError(`visual value key ${key} is missing from the finite case`)
    }
  })
  return Object.freeze([...keys])
}

function finiteBoundaryEvidence(
  familyId: string,
  cases: readonly G2FiniteCase[],
): readonly G2FiniteDomainBoundaryEvidence[] {
  const numericKeys = Array.from(new Set(cases.flatMap((params) => Object.entries(params)
    .filter(([, value]) => Number.isSafeInteger(value))
    .map(([key]) => key)))).sort()

  return Object.freeze(numericKeys.flatMap((key) => {
    const values = cases.map((params) => params[key]).filter(Number.isSafeInteger) as number[]
    if (values.length !== cases.length) return []
    const minimum = Math.min(...values)
    const maximum = Math.max(...values)
    const makeEvidence = (
      suffix: string,
      description: string,
      expected: number,
    ): G2FiniteDomainBoundaryEvidence => Object.freeze({
      classId: `${familyId}-${key}-${suffix}`,
      description,
      variantIndexes: Object.freeze(values.flatMap((value, variantIndex) =>
        value === expected ? [variantIndex] : [])),
      matches: (params: G2FiniteCase) => params[key] === expected,
    })
    if (minimum === maximum) {
      return [makeEvidence(
        'fixed-invariant',
        `${key} is fixed at ${minimum} throughout the finite domain`,
        minimum,
      )]
    }
    return [
      makeEvidence('minimum', `${key} reaches the finite-domain minimum ${minimum}`, minimum),
      makeEvidence('maximum', `${key} reaches the finite-domain maximum ${maximum}`, maximum),
    ]
  }))
}

function representativeVariantIndex(cases: readonly G2FiniteCase[]): number {
  const numericKeys = Array.from(new Set(cases.flatMap((params) => Object.entries(params)
    .filter(([, value]) => Number.isSafeInteger(value))
    .map(([key]) => key))))
  const midpoints = new Map(numericKeys.map((key) => {
    const values = cases.map((params) => params[key]).filter(Number.isSafeInteger) as number[]
    return [key, (Math.min(...values) + Math.max(...values)) / 2] as const
  }))
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY
  cases.forEach((params, variantIndex) => {
    const distance = numericKeys.reduce((total, key) =>
      total + Math.abs(Number(params[key]) - (midpoints.get(key) ?? 0)), 0)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = variantIndex
    }
  })
  return bestIndex
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
    const values = input.valueKeys.map((key) => numericValue(input.params, key))
    const ratioIndexes = input.valueKeys.length > 1
      ? input.valueKeys.slice(1).map((_, index) => index + 1)
      : [0]
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
      constraints: ratioIndexes.map((index) => ({
        kind: 'table-ratio',
        numerator: { rowKey: `given-${input.valueKeys[index]}`, columnIndex: 1 },
        denominator: { rowKey: `given-${input.valueKeys[0]}`, columnIndex: 1 },
        expected: values[index] / values[0],
      })),
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
      x: 20 + values[index] / 2,
      y: 28 + index * 38,
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
  definition.cases.forEach((params) => resolveVisualValueKeys(definition, params))
  const boundaryEvidence = finiteBoundaryEvidence(definition.familyId, definition.cases)
  if (boundaryEvidence.length === 0) {
    throw new TypeError(`${definition.familyId} needs executable finite-domain boundary evidence`)
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
          valueKeys: resolveVisualValueKeys(definition, params),
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
  const representativeIndex = representativeVariantIndex(definition.cases)
  return Object.freeze({
    family,
    generator,
    cases: Object.freeze([...definition.cases]),
    reviewCases: Object.freeze([
      Object.freeze({
        caseId: `${family.familyId}-representative`,
        kind: 'representative' as const,
        seed: 0,
        variantIndex: representativeIndex,
        boundaryClassIds: Object.freeze([]),
      }),
      ...boundaryEvidence.map((boundary) => Object.freeze({
        caseId: `${family.familyId}-boundary-${boundary.classId}`,
        kind: 'boundary' as const,
        seed: 0,
        variantIndex: boundary.variantIndexes[0],
        boundaryClassIds: Object.freeze([boundary.classId]),
      })),
    ]),
    boundaryEvidence,
    domainJustification: `All ${definition.cases.length} static variants are exhausted; every numeric parameter's finite-domain minimum, maximum, or fixed invariant is classified.`,
    generate,
    visualSurface: definition.visualSurface,
    resolveVisualValueKeys: (params: G2FiniteCase) => resolveVisualValueKeys(definition, params),
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
      valueKeys: definition.resolveVisualValueKeys(problem.params),
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
  verify(problem: GeneratedApplicationProblemV1): readonly string[]
}): G2FiniteProofReport[] {
  return input.families.map((draft) => {
    const issues: string[] = []
    const coveredBoundaryClasses = new Set(draft.reviewCases.flatMap((reviewCase) =>
      reviewCase.boundaryClassIds))
    draft.boundaryEvidence.forEach((boundary) => {
      if (!coveredBoundaryClasses.has(boundary.classId)) {
        issues.push(`boundary class ${boundary.classId} has no review case`)
      }
      if (boundary.variantIndexes.length === 0) {
        issues.push(`boundary class ${boundary.classId} has no finite variant`)
      }
      boundary.variantIndexes.forEach((variantIndex) => {
        if (!draft.cases[variantIndex] || !boundary.matches(draft.cases[variantIndex])) {
          issues.push(`boundary class ${boundary.classId} misclassifies case ${variantIndex}`)
        }
      })
    })
    draft.cases.forEach((_, variantIndex) => {
      try {
        const first = draft.generate({ seed: 0, variantIndex })
        const second = draft.generate({ seed: 0, variantIndex })
        if (stableJson(first) !== stableJson(second)) issues.push(`case ${variantIndex} is not deterministic`)
        input.verify(first).forEach((issue) => issues.push(`case ${variantIndex}: ${issue}`))
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
