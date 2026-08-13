import {
  parseGeneratedApplicationProblemV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from './contracts'

type JsonRecord = Record<string, JsonValue>
type SupportedFamilyId =
  | 'g6-ratio-part-whole'
  | 'g6-ratio-relative-comparison'
  | 'g6-ratio-representation-check'

interface HistoricalContentExpectation {
  prompt: string
  answer: string
  canonicalChoices: string[]
  canonicalCorrectChoiceIndex: number
  solutionSteps: string[]
  hintSteps: string[]
}

interface HistoricalSnapshotExpectation {
  params: JsonRecord
  content: HistoricalContentExpectation
  mathModel: JsonValue
  curriculumCodes: string[]
  misconceptionRefs: string[]
  visualGeneratorId: string
}

interface HistoricalPartWholeCase {
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

interface HistoricalRelativeComparisonBaseCase {
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

interface HistoricalRelativeComparisonCase extends HistoricalRelativeComparisonBaseCase {
  caseIndex: number
  caseId: string
  higherPlacement: 'left' | 'right'
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

type HistoricalRepresentationErrorMode =
  | 'decimal-percent-shift'
  | 'reference-inversion'
  | 'numerator-only'

interface HistoricalRepresentationCase {
  baseIndex: number
  numerator: number
  denominator: number
  caseIndex: number
  caseId: string
  errorMode: HistoricalRepresentationErrorMode
  misconceptionId: string
}

interface RepresentationModel extends HistoricalRepresentationCase {
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

const FAMILY_IDS = new Set<SupportedFamilyId>([
  'g6-ratio-part-whole',
  'g6-ratio-relative-comparison',
  'g6-ratio-representation-check',
])
const PACK_ID = 'pack-unit-6-1-ratio'
const VERSION = 1
const UINT32_RANGE = 0x1_0000_0000
const MAX_HISTORICAL_DRAWS = 256

const HISTORICAL_PART_WHOLE_FRACTIONS = [
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
const HISTORICAL_PART_WHOLE_SCALES = [2, 3, 4, 5] as const
const HISTORICAL_PART_WHOLE_CONTEXTS = [
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
const HISTORICAL_PART_WHOLE_CASES: readonly HistoricalPartWholeCase[] = Object.freeze(
  HISTORICAL_PART_WHOLE_FRACTIONS.flatMap(([numerator, denominator]) =>
    HISTORICAL_PART_WHOLE_SCALES.flatMap((scale) =>
      HISTORICAL_PART_WHOLE_CONTEXTS.map((context, contextIndex) => ({
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

const HISTORICAL_COMPARISON_RATIO_PAIRS = [
  [[3, 4], [2, 3]],
  [[4, 5], [3, 4]],
  [[7, 10], [3, 5]],
  [[3, 5], [1, 2]],
  [[2, 3], [3, 5]],
  [[9, 10], [4, 5]],
] as const
const HISTORICAL_COMPARISON_HIGHER_MULTIPLIERS = [2, 3, 4] as const
const HISTORICAL_COMPARISON_LOWER_MULTIPLIERS = [3, 4, 5, 6, 7, 8] as const
const HISTORICAL_COMPARISON_CONTEXTS = [
  { contextId: 'free-throws', trialName: '자유투', successName: '성공' },
  { contextId: 'quiz-rounds', trialName: '퀴즈', successName: '정답' },
  { contextId: 'seed-germination', trialName: '씨앗', successName: '발아' },
] as const
const HISTORICAL_COMPARISON_BASE_CASES: readonly HistoricalRelativeComparisonBaseCase[] =
  Object.freeze(
    HISTORICAL_COMPARISON_RATIO_PAIRS.flatMap(
      (
        [[higherNumerator, higherDenominator], [lowerNumerator, lowerDenominator]],
        pairIndex,
      ) =>
        HISTORICAL_COMPARISON_HIGHER_MULTIPLIERS.flatMap((higherMultiplier) =>
          HISTORICAL_COMPARISON_LOWER_MULTIPLIERS.map((lowerMultiplier) => ({
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
    )
      .filter(
        (entry) =>
          entry.lowerSuccesses > entry.higherSuccesses &&
          entry.higherTotal <= 60 &&
          entry.lowerTotal <= 60,
      )
      .map((entry, baseCaseIndex) => Object.freeze({ ...entry, baseCaseIndex })),
  )
const HISTORICAL_COMPARISON_CASES: readonly HistoricalRelativeComparisonCase[] =
  Object.freeze(
    HISTORICAL_COMPARISON_BASE_CASES.flatMap((base) =>
      (['left', 'right'] as const).map((higherPlacement) => {
        const contextIndex = base.baseCaseIndex % HISTORICAL_COMPARISON_CONTEXTS.length
        const context = HISTORICAL_COMPARISON_CONTEXTS[contextIndex]
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

const HISTORICAL_REPRESENTATION_BASES = [
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
const HISTORICAL_REPRESENTATION_ERROR_MODES: readonly {
  errorMode: HistoricalRepresentationErrorMode
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
const HISTORICAL_REPRESENTATION_CASES: readonly HistoricalRepresentationCase[] =
  Object.freeze(
    HISTORICAL_REPRESENTATION_BASES.flatMap(([numerator, denominator], baseIndex) =>
      HISTORICAL_REPRESENTATION_ERROR_MODES.map((mode) => ({
        baseIndex,
        numerator,
        denominator,
        ...mode,
        caseIndex: 0,
        caseId: '',
      })),
    ).map((entry, caseIndex) =>
      Object.freeze({
        ...entry,
        caseIndex,
        caseId: `g6-ratio-representation-check-${String(caseIndex + 1).padStart(3, '0')}`,
      }),
    ),
  )

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function canonical(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(canonical)
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonical(entry)]),
  )
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right))
}

function hasExactKeys(record: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(record).sort()
  return sameJson(actual, [...expected].sort())
}

function floorMod(value: number, modulus: number): number {
  const remainder = value % modulus
  return remainder < 0 ? remainder + modulus : remainder
}

function finiteCaseIndex(seed: number, variantIndex: number, domainSize: number): number {
  return (floorMod(seed, domainSize) + (variantIndex % domainSize)) % domainSize
}

function jsonRecord(value: object): JsonRecord {
  return Object.fromEntries(Object.entries(value)) as JsonRecord
}

function absoluteBigInt(value: bigint): bigint {
  return value < BigInt(0) ? -value : value
}

function historicalGcd(left: bigint, right: bigint): bigint {
  let a = absoluteBigInt(left)
  let b = absoluteBigInt(right)
  while (b !== BigInt(0)) {
    const remainder = a % b
    a = b
    b = remainder
  }
  return a
}

function normalizeHistoricalFraction(numerator: number, denominator: number): string {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator)) {
    throw new TypeError('historical fraction terms must be safe integers')
  }
  if (denominator === 0) {
    throw new RangeError('historical fraction denominator must not be zero')
  }
  const numeratorBigInt = BigInt(numerator)
  const denominatorBigInt = BigInt(denominator)
  const sign = denominatorBigInt < BigInt(0) ? -BigInt(1) : BigInt(1)
  const signedNumerator = numeratorBigInt * sign
  const positiveDenominator = denominatorBigInt * sign
  if (signedNumerator === BigInt(0)) return '0'
  const divisor = historicalGcd(signedNumerator, positiveDenominator)
  const reducedNumerator = signedNumerator / divisor
  const reducedDenominator = positiveDenominator / divisor
  return reducedDenominator === BigInt(1)
    ? reducedNumerator.toString()
    : `${reducedNumerator}/${reducedDenominator}`
}

function historicalComparisonAnswer(model: HistoricalRelativeComparisonCase): string {
  const leftCross = model.leftSuccesses * model.rightTotal
  const rightCross = model.rightSuccesses * model.leftTotal
  if (leftCross === rightCross) return '두 모둠의 성공 비율이 같습니다.'
  return `${
    leftCross > rightCross ? model.leftLabel : model.rightLabel
  }의 성공 비율이 더 높습니다.`
}

function historicalNumericCell(value: number) {
  return {
    before: { text: String(value), disclosure: 'given' as const },
    numericValue: value,
    numericDisclosure: 'given' as const,
  }
}

function historicalTargetCell(text: string, value: number) {
  return {
    before: { text: '?', disclosure: 'identifier' as const },
    after: { text, disclosure: 'solution' as const },
    numericValue: value,
    numericDisclosure: 'solution' as const,
  }
}

function historicalPartWholeScene(model: HistoricalPartWholeCase): JsonValue {
  const barX = 30
  const barY = 42
  const barWidth = 300
  const barHeight = 52
  const missingWidth = (barWidth * model.missing) / model.total
  const knownWidth = barWidth - missingWidth
  const answer = normalizeHistoricalFraction(model.missing, model.total)
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

function historicalRelativeComparisonScene(
  model: HistoricalRelativeComparisonCase,
): JsonValue {
  const percentCell = (numerator: number, denominator: number) =>
    historicalTargetCell(
      normalizeHistoricalFraction(numerator * 100, denominator),
      (numerator * 100) / denominator,
    )
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'table',
    semantics: 'quantitative',
    caption: {
      before: { text: '성공 횟수와 전체 횟수 비교표', disclosure: 'given' },
      after: { text: historicalComparisonAnswer(model), disclosure: 'solution' },
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
          historicalNumericCell(model.leftSuccesses),
          historicalNumericCell(model.leftTotal),
          percentCell(model.leftSuccesses, model.leftTotal),
        ],
      },
      {
        key: 'right-group',
        cells: [
          { before: { text: model.rightLabel, disclosure: 'identifier' } },
          historicalNumericCell(model.rightSuccesses),
          historicalNumericCell(model.rightTotal),
          percentCell(model.rightSuccesses, model.rightTotal),
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

function historicalRepresentationScene(model: RepresentationModel): JsonValue {
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
          historicalNumericCell(model.comparisonQuantity),
          historicalNumericCell(model.referenceQuantity),
          historicalTargetCell(model.fraction, rationalValue),
          historicalTargetCell(model.decimal, rationalValue),
          historicalTargetCell(String(model.percent), model.percent),
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

function strictPermutation(value: unknown, size: number): number[] | null {
  if (
    !Array.isArray(value) ||
    value.length !== size ||
    value.some(
      (entry) =>
        !Number.isSafeInteger(entry) ||
        (entry as number) < 0 ||
        (entry as number) >= size,
    )
  ) {
    return null
  }
  const order = value as number[]
  return new Set(order).size === size ? [...order] : null
}

function hashTextV1(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

function historicalChoiceProvenance(
  familyId: SupportedFamilyId,
  seed: number,
  variantIndex: number,
): { choiceOrder: number[]; draws: number[] } {
  const namespace =
    `${familyId}@1/variant:${variantIndex}/attempt:0/choices`
  let state = hashTextV1(`${seed}:${namespace}`)
  const draws: number[] = []
  const nextUint32 = (): number => {
    if (draws.length >= MAX_HISTORICAL_DRAWS) {
      throw new RangeError('historical choice draw limit exceeded')
    }
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    const result = (value ^ (value >>> 14)) >>> 0
    draws.push(result)
    return result
  }
  const intInclusive = (minimum: number, maximum: number): number => {
    const span = maximum - minimum + 1
    const acceptedRange = Math.floor(UINT32_RANGE / span) * span
    let value = nextUint32()
    while (value >= acceptedRange) value = nextUint32()
    return minimum + (value % span)
  }
  const choiceOrder = [0, 1, 2, 3]
  for (let index = choiceOrder.length - 1; index > 0; index -= 1) {
    const swapIndex = intInclusive(0, index)
    ;[choiceOrder[index], choiceOrder[swapIndex]] = [
      choiceOrder[swapIndex],
      choiceOrder[index],
    ]
  }
  return { choiceOrder, draws }
}

function validGenerationProvenance(
  value: JsonValue | undefined,
  familyId: SupportedFamilyId,
  seed: number,
  variantIndex: number,
): { record: JsonRecord; choiceOrder: number[] } | null {
  if (!isRecord(value) || !hasExactKeys(value, ['attempt', 'randomDraws', 'choiceOrder'])) {
    return null
  }
  if (value.attempt !== 0 || !isRecord(value.randomDraws)) return null
  if (!hasExactKeys(value.randomDraws, ['model', 'params', 'choices'])) return null
  if (
    !Array.isArray(value.randomDraws.model) ||
    value.randomDraws.model.length !== 0 ||
    !Array.isArray(value.randomDraws.params) ||
    value.randomDraws.params.length !== 0
  ) {
    return null
  }
  const choiceOrder = strictPermutation(value.choiceOrder, 4)
  if (!choiceOrder) return null
  const historical = historicalChoiceProvenance(familyId, seed, variantIndex)
  if (
    !sameJson(choiceOrder, historical.choiceOrder) ||
    !sameJson(value.randomDraws.choices, historical.draws)
  ) {
    return null
  }
  return { record: value as JsonRecord, choiceOrder }
}

function partWholeContent(
  model: HistoricalPartWholeCase,
): HistoricalContentExpectation {
  const correct = normalizeHistoricalFraction(model.missing, model.total)
  const canonicalChoices = [
    correct,
    normalizeHistoricalFraction(model.total, model.missing),
    normalizeHistoricalFraction(model.missing, model.known),
    normalizeHistoricalFraction(model.known, model.total),
  ]
  return {
    prompt: `${model.opening} 전체 ${model.total}${model.unit} 중 ${model.knownName}은 ${model.known}${model.unit}입니다. 나머지 ${model.missingName} 수와 전체 수의 비율을 기약분수로 나타내세요.`,
    answer: correct,
    canonicalChoices,
    canonicalCorrectChoiceIndex: 0,
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

function relativeComparisonContent(
  model: HistoricalRelativeComparisonCase,
): HistoricalContentExpectation {
  const correct = historicalComparisonAnswer(model)
  const canonicalChoices = [
    `${model.leftLabel}의 성공 비율이 더 높습니다.`,
    `${model.rightLabel}의 성공 비율이 더 높습니다.`,
    '두 모둠의 성공 비율이 같습니다.',
    '주어진 수로는 성공 비율을 비교할 수 없습니다.',
  ]
  const leftCross = model.leftSuccesses * model.rightTotal
  const rightCross = model.rightSuccesses * model.leftTotal
  return {
    prompt: `${model.leftLabel}은 ${model.trialName} ${model.leftTotal}번 중 ${model.successName} ${model.leftSuccesses}번, ${model.rightLabel}은 ${model.trialName} ${model.rightTotal}번 중 ${model.successName} ${model.rightSuccesses}번이었습니다. 어느 모둠의 성공 비율이 더 높은가요?`,
    answer: correct,
    canonicalChoices,
    canonicalCorrectChoiceIndex: canonicalChoices.indexOf(correct),
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

function representationModel(model: HistoricalRepresentationCase): RepresentationModel {
  const fraction = normalizeHistoricalFraction(model.numerator, model.denominator)
  const decimal = String(model.numerator / model.denominator)
  const percent = (model.numerator * 100) / model.denominator
  const fractionDisplay =
    model.errorMode === 'reference-inversion'
      ? normalizeHistoricalFraction(model.denominator, model.numerator)
      : fraction
  const percentDisplay =
    model.errorMode === 'decimal-percent-shift' ? decimal : String(percent)
  const hundredthsNumerator =
    model.errorMode === 'numerator-only' ? model.numerator : percent
  return {
    ...model,
    comparisonQuantity: model.numerator,
    referenceQuantity: model.denominator,
    fraction,
    decimal,
    percent,
    fractionClaim: `분수 주장: 비교하는 양/기준량은 ${fractionDisplay}입니다.`,
    decimalClaim: `소수 주장: 같은 비율은 ${decimal}입니다.`,
    percentClaim: `백분율 주장: 같은 비율은 ${percentDisplay}%입니다.`,
    hundredthsClaim: `분모가 100인 분수 주장: 같은 비율은 ${hundredthsNumerator}/100입니다.`,
  }
}

function representationParams(model: RepresentationModel): JsonRecord {
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

function representationExplanation(model: RepresentationModel): string {
  if (model.errorMode === 'decimal-percent-shift') {
    return `${model.decimal}은 ${model.percent}%이므로 소수 값을 그대로 퍼센트 기호 앞에 쓰면 안 됩니다.`
  }
  if (model.errorMode === 'reference-inversion') {
    return `비교하는 양 ${model.comparisonQuantity}을 분자, 기준량 ${model.referenceQuantity}을 분모에 두어야 합니다.`
  }
  return `분모를 100으로 바꿀 때에는 분자도 같은 값의 비율을 유지하도록 ${model.percent}로 바꾸어야 합니다.`
}

function representationHint(model: RepresentationModel): string {
  if (model.errorMode === 'decimal-percent-shift') {
    return '소수를 백분율로 바꿀 때 전체 1이 전체 100%라는 기준을 확인하세요.'
  }
  if (model.errorMode === 'reference-inversion') {
    return '비교하는 양/기준량의 순서를 먼저 적고 분자와 분모를 뒤집지 않았는지 확인하세요.'
  }
  return '분모만 100으로 바꾸면 값이 달라집니다. 분자와 분모의 변화를 함께 확인하세요.'
}

function representationContent(
  model: RepresentationModel,
): HistoricalContentExpectation {
  const correct =
    model.errorMode === 'decimal-percent-shift'
      ? model.percentClaim
      : model.errorMode === 'reference-inversion'
        ? model.fractionClaim
        : model.hundredthsClaim
  const canonicalChoices = [
    model.fractionClaim,
    model.decimalClaim,
    model.percentClaim,
    model.hundredthsClaim,
  ]
  return {
    prompt: `기준량 ${model.referenceQuantity} 중 비교하는 양이 ${model.comparisonQuantity}일 때, 다음 분수·소수·백분율 관련 주장 중 잘못된 주장 하나를 고르세요.`,
    answer: correct,
    canonicalChoices,
    canonicalCorrectChoiceIndex: canonicalChoices.indexOf(correct),
    solutionSteps: [
      `비율은 비교하는 양/기준량이므로 ${model.comparisonQuantity}/${model.referenceQuantity}=${model.fraction}입니다.`,
      `${model.fraction}은 소수 ${model.decimal}, 백분율 ${model.percent}%와 같습니다.`,
      `${representationExplanation(model)} 따라서 잘못된 주장은 “${correct}”입니다.`,
    ],
    hintSteps: [
      representationHint(model),
      '분수, 소수, 백분율을 각각 같은 전체 1을 기준으로 바꾸어 서로 같은 값인지 확인하세요.',
      '주장 네 개를 한 번에 추측하지 말고 각 표현을 원래 분수와 하나씩 비교하세요.',
    ],
  }
}

function expectationFor(
  problem: Readonly<GeneratedApplicationProblemV1>,
): HistoricalSnapshotExpectation | null {
  const familyId = problem.familyId as SupportedFamilyId
  if (!FAMILY_IDS.has(familyId)) return null

  if (familyId === 'g6-ratio-part-whole') {
    const model =
      HISTORICAL_PART_WHOLE_CASES[
        finiteCaseIndex(
          problem.seed,
          problem.variantIndex,
          HISTORICAL_PART_WHOLE_CASES.length,
        )
      ]
    const params = jsonRecord(model)
    const mathModel = historicalPartWholeScene(model)
    return {
      params,
      content: partWholeContent(model),
      mathModel,
      curriculumCodes: ['[6수02-02]', '[6수02-03]'],
      misconceptionRefs: [
        'ratio-part-whole-order-reversal',
        'ratio-part-part-confused-with-part-whole',
      ],
      visualGeneratorId: 'g6-ratio-part-whole-visual',
    }
  }

  if (familyId === 'g6-ratio-relative-comparison') {
    const model =
      HISTORICAL_COMPARISON_CASES[
        finiteCaseIndex(
          problem.seed,
          problem.variantIndex,
          HISTORICAL_COMPARISON_CASES.length,
        )
      ]
    const params = jsonRecord(model)
    const mathModel = historicalRelativeComparisonScene(model)
    return {
      params,
      content: relativeComparisonContent(model),
      mathModel,
      curriculumCodes: ['[6수02-03]', '[6수02-02]'],
      misconceptionRefs: [
        'ratio-compares-absolute-difference',
        'ratio-denominator-is-selected-part',
      ],
      visualGeneratorId: 'g6-ratio-relative-comparison-visual',
    }
  }

  const model =
    HISTORICAL_REPRESENTATION_CASES[
      finiteCaseIndex(
        problem.seed,
        problem.variantIndex,
        HISTORICAL_REPRESENTATION_CASES.length,
      )
    ]
  const historicalModel = representationModel(model)
  const params = representationParams(historicalModel)
  const mathModel = historicalRepresentationScene(historicalModel)
  return {
    params,
    content: representationContent(historicalModel),
    mathModel,
    curriculumCodes: ['[6수02-03]', '[6수02-02]'],
    misconceptionRefs: [
      'ratio-percent-decimal-place-shift',
      'ratio-denominator-is-selected-part',
      'ratio-representation-numerator-only',
    ],
    visualGeneratorId: 'g6-ratio-representation-check-visual',
  }
}

function sourceIsV1(
  problem: Readonly<GeneratedApplicationProblemV1>,
  familyId: SupportedFamilyId,
  expectation: HistoricalSnapshotExpectation,
): boolean {
  return (
    problem.schemaVersion === 'generated-application-problem-v1' &&
    problem.familyId === familyId &&
    problem.generatorVersion === VERSION &&
    problem.packId === PACK_ID &&
    problem.packVersion === VERSION &&
    Number.isSafeInteger(problem.seed) &&
    Number.isSafeInteger(problem.variantIndex) &&
    problem.variantIndex >= 0 &&
    problem.instanceId === `${familyId}@${VERSION}:${problem.seed}:${problem.variantIndex}` &&
    sameJson(problem.curriculumCodes, expectation.curriculumCodes)
  )
}

function recordAt(value: unknown, index: number): Record<string, unknown> | null {
  if (!Array.isArray(value)) return null
  const entry = value[index]
  return isRecord(entry) ? entry : null
}

function keyedRecord(value: unknown, key: string): Record<string, unknown> | null {
  if (!Array.isArray(value)) return null
  const entry = value.find((candidate) => isRecord(candidate) && candidate.key === key)
  return isRecord(entry) ? entry : null
}

function numericCellValue(row: Record<string, unknown> | null, index: number): number | null {
  if (!row) return null
  const cell = recordAt(row.cells, index)
  return cell && typeof cell.numericValue === 'number' ? cell.numericValue : null
}

function historicalPartWholeClosureIsValid(
  problem: GeneratedApplicationProblemV1,
  expectation: HistoricalSnapshotExpectation,
): boolean {
  const model = expectation.params as unknown as HistoricalPartWholeCase
  if (
    model.numerator < 1 ||
    model.denominator < 1 ||
    model.numerator >= model.denominator ||
    model.scale < 1 ||
    model.total !== model.denominator * model.scale ||
    model.missing !== model.numerator * model.scale ||
    model.known !== model.total - model.missing ||
    problem.answer.normalized !== normalizeHistoricalFraction(model.missing, model.total)
  ) {
    return false
  }
  const scene = problem.visual.mathModel
  if (!isRecord(scene) || !sameJson(scene, historicalPartWholeScene(model))) return false
  const whole = keyedRecord(scene.primitives, 'whole-bar')
  const missing = keyedRecord(scene.primitives, 'missing-part')
  const known = keyedRecord(scene.primitives, 'known-part')
  const ratioConstraint = recordAt(scene.constraints, 1)
  return (
    scene.surface === 'diagram' &&
    scene.semantics === 'quantitative' &&
    whole?.width === 300 &&
    missing?.width === (300 * model.missing) / model.total &&
    known?.width === (300 * model.known) / model.total &&
    ratioConstraint?.kind === 'ratio' &&
    ratioConstraint.expected === model.missing / model.total
  )
}

function historicalComparisonClosureIsValid(
  problem: GeneratedApplicationProblemV1,
  expectation: HistoricalSnapshotExpectation,
): boolean {
  const model = expectation.params as unknown as HistoricalRelativeComparisonCase
  const higherOnLeft = model.higherPlacement === 'left'
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
    model.leftSuccesses !==
      (higherOnLeft ? model.higherSuccesses : model.lowerSuccesses) ||
    model.leftTotal !== (higherOnLeft ? model.higherTotal : model.lowerTotal) ||
    model.rightSuccesses !==
      (higherOnLeft ? model.lowerSuccesses : model.higherSuccesses) ||
    model.rightTotal !== (higherOnLeft ? model.lowerTotal : model.higherTotal) ||
    problem.answer.normalized !== historicalComparisonAnswer(model)
  ) {
    return false
  }
  const scene = problem.visual.mathModel
  if (!isRecord(scene) || !sameJson(scene, historicalRelativeComparisonScene(model))) {
    return false
  }
  const leftRow = keyedRecord(scene.rows, 'left-group')
  const rightRow = keyedRecord(scene.rows, 'right-group')
  const leftConstraint = recordAt(scene.constraints, 0)
  const rightConstraint = recordAt(scene.constraints, 1)
  return (
    scene.surface === 'table' &&
    scene.semantics === 'quantitative' &&
    numericCellValue(leftRow, 1) === model.leftSuccesses &&
    numericCellValue(leftRow, 2) === model.leftTotal &&
    numericCellValue(rightRow, 1) === model.rightSuccesses &&
    numericCellValue(rightRow, 2) === model.rightTotal &&
    leftConstraint?.expected === model.leftSuccesses / model.leftTotal &&
    rightConstraint?.expected === model.rightSuccesses / model.rightTotal
  )
}

function historicalRepresentationClosureIsValid(
  problem: GeneratedApplicationProblemV1,
  expectation: HistoricalSnapshotExpectation,
): boolean {
  const model = expectation.params as unknown as RepresentationModel
  const expectedMisconception = HISTORICAL_REPRESENTATION_ERROR_MODES.find(
    (entry) => entry.errorMode === model.errorMode,
  )?.misconceptionId
  const expectedAnswer =
    model.errorMode === 'decimal-percent-shift'
      ? model.percentClaim
      : model.errorMode === 'reference-inversion'
        ? model.fractionClaim
        : model.hundredthsClaim
  if (
    model.numerator < 1 ||
    model.denominator < 1 ||
    model.numerator >= model.denominator ||
    model.comparisonQuantity !== model.numerator ||
    model.referenceQuantity !== model.denominator ||
    model.fraction !== normalizeHistoricalFraction(model.numerator, model.denominator) ||
    model.decimal !== String(model.numerator / model.denominator) ||
    model.percent !== (model.numerator * 100) / model.denominator ||
    !Number.isSafeInteger(model.percent) ||
    model.misconceptionId !== expectedMisconception ||
    problem.answer.normalized !== expectedAnswer
  ) {
    return false
  }
  const scene = problem.visual.mathModel
  if (!isRecord(scene) || !sameJson(scene, historicalRepresentationScene(model))) {
    return false
  }
  const row = keyedRecord(scene.rows, 'ratio-row')
  const ratioConstraint = recordAt(scene.constraints, 0)
  return (
    scene.surface === 'table' &&
    scene.semantics === 'quantitative' &&
    numericCellValue(row, 0) === model.comparisonQuantity &&
    numericCellValue(row, 1) === model.referenceQuantity &&
    numericCellValue(row, 2) === model.comparisonQuantity / model.referenceQuantity &&
    numericCellValue(row, 3) === model.comparisonQuantity / model.referenceQuantity &&
    numericCellValue(row, 4) === model.percent &&
    ratioConstraint?.expected === model.comparisonQuantity / model.referenceQuantity
  )
}

function historicalClosureIsValid(
  problem: GeneratedApplicationProblemV1,
  expectation: HistoricalSnapshotExpectation,
): boolean {
  if (problem.familyId === 'g6-ratio-part-whole') {
    return historicalPartWholeClosureIsValid(problem, expectation)
  }
  if (problem.familyId === 'g6-ratio-relative-comparison') {
    return historicalComparisonClosureIsValid(problem, expectation)
  }
  if (problem.familyId === 'g6-ratio-representation-check') {
    return historicalRepresentationClosureIsValid(problem, expectation)
  }
  return false
}

export function isGrade6ApplicationProblemSnapshotV1Valid(
  problem: Readonly<GeneratedApplicationProblemV1>,
): boolean {
  try {
    const parsed = parseGeneratedApplicationProblemV1(problem)
    const familyId = parsed.familyId as SupportedFamilyId
    if (!FAMILY_IDS.has(familyId)) return false
    const expectation = expectationFor(parsed)
    if (!expectation || !sourceIsV1(parsed, familyId, expectation)) return false
    const provenance = validGenerationProvenance(
      parsed.params.__generation,
      familyId,
      parsed.seed,
      parsed.variantIndex,
    )
    if (!provenance) return false

    const orderedChoices = provenance.choiceOrder.map(
      (index) => expectation.content.canonicalChoices[index],
    )
    const correctChoiceIndex = provenance.choiceOrder.indexOf(
      expectation.content.canonicalCorrectChoiceIndex,
    )
    const expectedProblem: GeneratedApplicationProblemV1 = {
      schemaVersion: 'generated-application-problem-v1',
      instanceId: `${familyId}@${VERSION}:${parsed.seed}:${parsed.variantIndex}`,
      familyId,
      generatorVersion: VERSION,
      packId: PACK_ID,
      packVersion: VERSION,
      seed: parsed.seed,
      variantIndex: parsed.variantIndex,
      curriculumCodes: expectation.curriculumCodes,
      params: {
        ...expectation.params,
        __generation: provenance.record,
      },
      prompt: expectation.content.prompt,
      answer: {
        format: 'choice',
        normalized: expectation.content.answer,
      },
      choices: orderedChoices,
      correctChoiceIndex,
      solutionSteps: expectation.content.solutionSteps,
      hintSteps: expectation.content.hintSteps,
      misconceptionRefs: expectation.misconceptionRefs,
      visual: {
        role: 'required',
        semantics: 'quantitative',
        generatorId: expectation.visualGeneratorId,
        answerCritical: true,
        generatorVersion: VERSION,
        mathModel: expectation.mathModel,
      },
    }
    return sameJson(parsed, expectedProblem) && historicalClosureIsValid(parsed, expectation)
  } catch {
    return false
  }
}
