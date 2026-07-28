import {
  parseGeneratedApplicationProblemV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from './contracts'
import {
  G5_COMPOSITE_V1_VISUAL_FINGERPRINTS,
  G5_OVERLAP_V1_VISUAL_FINGERPRINTS,
  G5_PERIMETER_V1_VISUAL_FINGERPRINTS,
} from './grade5-v1-visual-fingerprints'
import { resolveApplicationVisual } from './visual-validator'

type JsonRecord = Record<string, JsonValue>
type SupportedFamilyId =
  | 'g5-perimeter-boundary-rebuild'
  | 'g5-area-composite-inverse'
  | 'g5-area-overlap-reconstruction'
type PairKey = 'ab' | 'ac' | 'bc'
type ShapeKey = 'A' | 'B' | 'C'

interface G5PerimeterBoundaryRebuildParams {
  width: number
  height: number
  notchWidth: number
  notchHeight: number
  rotation: 0 | 1 | 2 | 3
}

interface G5AreaCompositeInverseParams {
  rectangleWidth: number
  rectangleHeight: number
  squareSide: number
  attachmentPosition: 0 | 1 | 2
  totalArea: number
}

interface G5AreaOverlapReconstructionParams {
  aOnly: number
  ab: number
  ac: number
  abc: number
  zeroPair: PairKey
  shapeArea: number
  unionArea: number
  hubShape: ShapeKey
  upperShape: ShapeKey
  rightShape: ShapeKey
  knownPair: PairKey
  targetPair: PairKey
  knownOverlap: number
  targetOverlap: number
}

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
  curriculumCodes: string[]
  misconceptionRefs: string[]
  visualGeneratorId: string
}

const FAMILY_IDS = new Set<SupportedFamilyId>([
  'g5-perimeter-boundary-rebuild',
  'g5-area-composite-inverse',
  'g5-area-overlap-reconstruction',
])
const PACK_ID = 'pack-unit-5-1-perimeter-area'
const VERSION = 1
const UINT32_RANGE = 0x1_0000_0000
const MAX_HISTORICAL_DRAWS = 256

const PERIMETER_WIDTHS = [12, 14, 16, 18] as const
const PERIMETER_HEIGHTS = [9, 11, 13, 15] as const
const PERIMETER_NOTCH_WIDTHS = [3, 4, 5, 6] as const
const PERIMETER_NOTCH_HEIGHTS = [2, 3, 4, 5] as const
const PERIMETER_ROTATIONS = [0, 1, 2, 3] as const
const PERIMETER_DOMAIN_SIZE = 1024

const COMPOSITE_WIDTHS = [5, 7, 9, 11] as const
const COMPOSITE_HEIGHTS = [4, 6, 8] as const
const COMPOSITE_SIDES = [10, 12, 14] as const
const COMPOSITE_POSITIONS = [0, 1, 2] as const
const COMPOSITE_POSITION_TEXT = ['위쪽', '가운데', '아래쪽'] as const
const COMPOSITE_DOMAIN_SIZE = 108

const OVERLAP_A_ONLY_VALUES = [12, 16, 20] as const
const OVERLAP_AB_VALUES = [2, 4, 6] as const
const OVERLAP_AC_VALUES = [1, 2, 3] as const
const OVERLAP_ABC_VALUES = [3, 5, 7] as const
const OVERLAP_ZERO_PAIRS = ['bc', 'ac', 'ab'] as const
const OVERLAP_DOMAIN_SIZE = 243

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

function visualFingerprint(value: unknown): string {
  const serialized = JSON.stringify(canonical(value))
  let first = 0x811c9dc5
  let second = 0x9e3779b9
  let third = 0x85ebca6b
  let fourth = 0xc2b2ae35
  for (let index = 0; index < serialized.length; index += 1) {
    const code = serialized.charCodeAt(index)
    first = Math.imul(first ^ code, 0x01000193) >>> 0
    second = Math.imul(second ^ code, 0x85ebca6b) >>> 0
    third = Math.imul(third ^ code, 0xc2b2ae35) >>> 0
    fourth = Math.imul(fourth ^ code, 0x27d4eb2f) >>> 0
  }
  const hex = (value: number): string => value.toString(16).padStart(8, '0')
  return `${serialized.length}:${hex(first)}:${hex(second)}:${hex(third)}:${hex(fourth)}`
}

function expectedVisualFingerprint(
  familyId: SupportedFamilyId,
  seed: number,
  variantIndex: number,
): string | undefined {
  if (familyId === 'g5-perimeter-boundary-rebuild') {
    return G5_PERIMETER_V1_VISUAL_FINGERPRINTS[
      historicalIndex(seed, variantIndex, PERIMETER_DOMAIN_SIZE)
    ]
  }
  if (familyId === 'g5-area-composite-inverse') {
    return G5_COMPOSITE_V1_VISUAL_FINGERPRINTS[
      historicalIndex(seed, variantIndex, COMPOSITE_DOMAIN_SIZE)
    ]
  }
  return G5_OVERLAP_V1_VISUAL_FINGERPRINTS[
    historicalIndex(seed, variantIndex, OVERLAP_DOMAIN_SIZE)
  ]
}

function hasExactKeys(record: Record<string, unknown>, expected: readonly string[]): boolean {
  return sameJson(Object.keys(record).sort(), [...expected].sort())
}

function floorMod(value: number, modulus: number): number {
  const remainder = value % modulus
  return remainder < 0 ? remainder + modulus : remainder
}

function historicalIndex(seed: number, variantIndex: number, domainSize: number): number {
  return (floorMod(seed, domainSize) + (variantIndex % domainSize)) % domainSize
}

function jsonRecord(value: object): JsonRecord {
  return Object.fromEntries(Object.entries(value)) as JsonRecord
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
  const namespace = `${familyId}@1/variant:${variantIndex}/attempt:0/choices`
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

function perimeterParams(seed: number, variantIndex: number): G5PerimeterBoundaryRebuildParams {
  let remaining = historicalIndex(seed, variantIndex, PERIMETER_DOMAIN_SIZE)
  const rotation = PERIMETER_ROTATIONS[remaining % PERIMETER_ROTATIONS.length]
  remaining = Math.floor(remaining / PERIMETER_ROTATIONS.length)
  const notchHeight = PERIMETER_NOTCH_HEIGHTS[remaining % PERIMETER_NOTCH_HEIGHTS.length]
  remaining = Math.floor(remaining / PERIMETER_NOTCH_HEIGHTS.length)
  const notchWidth = PERIMETER_NOTCH_WIDTHS[remaining % PERIMETER_NOTCH_WIDTHS.length]
  remaining = Math.floor(remaining / PERIMETER_NOTCH_WIDTHS.length)
  const height = PERIMETER_HEIGHTS[remaining % PERIMETER_HEIGHTS.length]
  remaining = Math.floor(remaining / PERIMETER_HEIGHTS.length)
  const width = PERIMETER_WIDTHS[remaining % PERIMETER_WIDTHS.length]
  return { width, height, notchWidth, notchHeight, rotation }
}

function perimeterContent(params: G5PerimeterBoundaryRebuildParams): HistoricalContentExpectation {
  const perimeter = 2 * (params.width + params.height)
  const offset = params.notchWidth + params.notchHeight
  return {
    prompt: `가로 ${params.width} cm, 세로 ${params.height} cm인 직사각형 판의 한 모서리에서 가로 ${params.notchWidth} cm, 세로 ${params.notchHeight} cm인 부분을 잘라 냈습니다. 남은 판의 바깥 경계를 다시 따라가 둘레를 구하세요.`,
    answer: String(perimeter),
    canonicalChoices: [
      String(perimeter),
      String(perimeter + offset),
      String(perimeter + 2 * offset),
      String(perimeter - offset),
    ],
    canonicalCorrectChoiceIndex: 0,
    solutionSteps: [
      `잘려 나간 가로 ${params.notchWidth} cm와 세로 ${params.notchHeight} cm 대신 같은 길이의 새 경계가 생깁니다.`,
      `가로 방향 경계의 합은 ${2 * params.width} cm, 세로 방향 경계의 합은 ${2 * params.height} cm입니다.`,
      `따라서 둘레는 ${2 * params.width}+${2 * params.height}=${perimeter} cm입니다.`,
    ],
    hintSteps: [
      '흐린 선은 잘려 나간 선이므로 둘레에 넣지 말고 진한 경계만 한 바퀴 따라가 보세요.',
      '오른쪽과 왼쪽으로 이동한 전체 길이, 위쪽과 아래쪽으로 이동한 전체 길이가 각각 같아야 합니다.',
    ],
  }
}

function compositeParams(seed: number, variantIndex: number): G5AreaCompositeInverseParams {
  let remaining = historicalIndex(seed, variantIndex, COMPOSITE_DOMAIN_SIZE)
  const attachmentPosition = COMPOSITE_POSITIONS[remaining % COMPOSITE_POSITIONS.length]
  remaining = Math.floor(remaining / COMPOSITE_POSITIONS.length)
  const squareSide = COMPOSITE_SIDES[remaining % COMPOSITE_SIDES.length]
  remaining = Math.floor(remaining / COMPOSITE_SIDES.length)
  const rectangleHeight = COMPOSITE_HEIGHTS[remaining % COMPOSITE_HEIGHTS.length]
  remaining = Math.floor(remaining / COMPOSITE_HEIGHTS.length)
  const rectangleWidth = COMPOSITE_WIDTHS[remaining % COMPOSITE_WIDTHS.length]
  return {
    rectangleWidth,
    rectangleHeight,
    squareSide,
    attachmentPosition,
    totalArea: rectangleWidth * rectangleHeight + squareSide * squareSide,
  }
}

function compositeContent(params: G5AreaCompositeInverseParams): HistoricalContentExpectation {
  const squareArea = params.squareSide ** 2
  const rectangleArea = params.totalArea - squareArea
  const perimeter = 2 * params.rectangleWidth + 4 * params.squareSide
  return {
    prompt: `한 변이 ${params.squareSide} cm인 정사각형 오른쪽 변의 ${COMPOSITE_POSITION_TEXT[params.attachmentPosition]}에 세로 ${params.rectangleHeight} cm인 직사각형의 세로 전체가 빈틈없이 붙어 있습니다. 합친 넓이는 ${params.totalArea} cm²입니다. 직사각형의 빠진 가로를 먼저 구한 뒤 합친 도형의 바깥 둘레를 구하세요.`,
    answer: String(perimeter),
    canonicalChoices: [
      String(perimeter),
      String(perimeter + 2 * params.rectangleHeight),
      String(4 * params.squareSide),
      String(2 * params.rectangleWidth + 2 * params.squareSide),
    ],
    canonicalCorrectChoiceIndex: 0,
    solutionSteps: [
      `그림처럼 직사각형의 세로 전체가 정사각형 오른쪽 변의 ${COMPOSITE_POSITION_TEXT[params.attachmentPosition]}에 붙어 있고, 정사각형의 넓이는 ${params.squareSide}×${params.squareSide}=${squareArea} cm²입니다.`,
      `직사각형의 넓이는 ${params.totalArea}-${squareArea}=${rectangleArea} cm²입니다.`,
      `${rectangleArea}÷${params.rectangleHeight}=${params.rectangleWidth}이므로 직사각형의 가로는 ${params.rectangleWidth} cm입니다.`,
      `붙어 있는 ${params.rectangleHeight} cm 변은 바깥 둘레가 아니므로, 바깥 둘레는 ${perimeter} cm입니다.`,
    ],
    hintSteps: [
      '전체 넓이에서 정사각형 넓이를 빼면 직사각형 넓이를 알 수 있습니다.',
      '직사각형 넓이를 세로로 나누어 빠진 가로를 구한 뒤, 맞닿은 변은 둘레에서 제외하세요.',
    ],
  }
}

function overlapRoles(zeroPair: PairKey): {
  hub: 'A' | 'B' | 'C'
  upper: 'A' | 'B' | 'C'
  right: 'A' | 'B' | 'C'
  knownPair: PairKey
  targetPair: PairKey
} {
  if (zeroPair === 'bc') {
    return { hub: 'A', upper: 'B', right: 'C', knownPair: 'ab', targetPair: 'ac' }
  }
  if (zeroPair === 'ac') {
    return { hub: 'B', upper: 'C', right: 'A', knownPair: 'bc', targetPair: 'ab' }
  }
  return { hub: 'C', upper: 'A', right: 'B', knownPair: 'ac', targetPair: 'bc' }
}

function overlapParams(seed: number, variantIndex: number): G5AreaOverlapReconstructionParams {
  let remaining = historicalIndex(seed, variantIndex, OVERLAP_DOMAIN_SIZE)
  const zeroPair = OVERLAP_ZERO_PAIRS[remaining % OVERLAP_ZERO_PAIRS.length]
  remaining = Math.floor(remaining / OVERLAP_ZERO_PAIRS.length)
  const abc = OVERLAP_ABC_VALUES[remaining % OVERLAP_ABC_VALUES.length]
  remaining = Math.floor(remaining / OVERLAP_ABC_VALUES.length)
  const ac = OVERLAP_AC_VALUES[remaining % OVERLAP_AC_VALUES.length]
  remaining = Math.floor(remaining / OVERLAP_AC_VALUES.length)
  const ab = OVERLAP_AB_VALUES[remaining % OVERLAP_AB_VALUES.length]
  remaining = Math.floor(remaining / OVERLAP_AB_VALUES.length)
  const aOnly = OVERLAP_A_ONLY_VALUES[remaining % OVERLAP_A_ONLY_VALUES.length]
  const roles = overlapRoles(zeroPair)
  return {
    aOnly,
    ab,
    ac,
    abc,
    zeroPair,
    shapeArea: aOnly + ab + ac + abc,
    unionArea: 3 * aOnly + 2 * ab + 2 * ac + abc,
    hubShape: roles.hub,
    upperShape: roles.upper,
    rightShape: roles.right,
    knownPair: roles.knownPair,
    targetPair: roles.targetPair,
    knownOverlap: ab,
    targetOverlap: ac,
  }
}

function pairText(pair: PairKey): string {
  return `${pair[0].toUpperCase()}와 ${pair[1].toUpperCase()}`
}

function overlapContent(params: G5AreaOverlapReconstructionParams): HistoricalContentExpectation {
  const firstRemainder = params.shapeArea - params.aOnly - params.knownOverlap
  const answer = params.targetOverlap
  return {
    prompt: `넓이가 각각 ${params.shapeArea} cm²인 도형 A, B, C가 겹쳐 있고 전체가 차지한 넓이는 ${params.unionArea} cm²입니다. ${params.hubShape}만의 넓이는 ${params.aOnly} cm², ${pairText(params.knownPair)}만 겹친 넓이는 ${params.knownOverlap} cm², 세 도형이 함께 겹친 넓이는 ${params.abc} cm²입니다. ${pairText(params.zeroPair)}만 겹친 부분은 없습니다. ${pairText(params.targetPair)}만 겹친 넓이를 구하세요.`,
    answer: String(answer),
    canonicalChoices: [
      String(answer),
      String(answer + params.abc),
      String(answer + params.knownOverlap + params.abc),
      String(params.shapeArea - answer),
    ],
    canonicalCorrectChoiceIndex: 0,
    solutionSteps: [
      `${params.hubShape}의 전체 넓이 ${params.shapeArea} cm²는 ${params.hubShape}만, 알려진 두 도형만, 세 도형 공통, 구하려는 두 도형만 영역으로 나뉩니다.`,
      `${params.shapeArea}-${params.aOnly}-${params.knownOverlap}=${firstRemainder} cm²입니다.`,
      `여기에서 세 도형 공통 ${params.abc} cm²를 빼면 ${firstRemainder}-${params.abc}=${answer} cm²입니다.`,
      '각 도형의 넓이와 전체 넓이를 영역별로 다시 더해 관계가 맞는지 확인할 수 있습니다.',
    ],
    hintSteps: [
      `${params.hubShape} 안에 들어 있는 서로 겹치지 않는 네 영역을 먼저 찾아보세요.`,
      `${params.hubShape}의 전체에서 ${params.hubShape}만, 알려진 겹침, 세 도형 공통 넓이를 차례로 빼세요.`,
    ],
  }
}

function expectationFor(
  problem: Readonly<GeneratedApplicationProblemV1>,
): HistoricalSnapshotExpectation | null {
  const familyId = problem.familyId as SupportedFamilyId
  if (!FAMILY_IDS.has(familyId)) return null

  if (familyId === 'g5-perimeter-boundary-rebuild') {
    const params = perimeterParams(problem.seed, problem.variantIndex)
    return {
      params: jsonRecord(params),
      content: perimeterContent(params),
      curriculumCodes: ['[6수03-11]'],
      misconceptionRefs: [
        'perimeter-counts-internal-segments',
        'perimeter-omits-reconstructed-side',
      ],
      visualGeneratorId: 'g5-perimeter-boundary-rebuild-visual',
    }
  }

  if (familyId === 'g5-area-composite-inverse') {
    const params = compositeParams(problem.seed, problem.variantIndex)
    return {
      params: jsonRecord(params),
      content: compositeContent(params),
      curriculumCodes: ['[6수03-13]', '[6수03-11]'],
      misconceptionRefs: ['area-adds-side-lengths', 'area-inverse-uses-subtraction'],
      visualGeneratorId: 'g5-area-composite-inverse-visual',
    }
  }

  const params = overlapParams(problem.seed, problem.variantIndex)
  return {
    params: jsonRecord(params),
    content: overlapContent(params),
    curriculumCodes: ['[6수03-14]', '[6수03-13]'],
    misconceptionRefs: ['overlap-area-double-count'],
    visualGeneratorId: 'g5-area-overlap-reconstruction-visual',
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

export function isGrade5ApplicationProblemSnapshotV1Valid(
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
    if (resolveApplicationVisual(parsed.visual).status !== 'ready') return false
    if (
      visualFingerprint(parsed.visual.mathModel) !==
      expectedVisualFingerprint(familyId, parsed.seed, parsed.variantIndex)
    ) {
      return false
    }

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
        mathModel: parsed.visual.mathModel,
      },
    }
    return sameJson(parsed, expectedProblem)
  } catch {
    return false
  }
}
