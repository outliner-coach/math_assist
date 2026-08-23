import type { ApplicationProblemFamilyV1, JsonValue } from '../contracts'
import {
  generateApplicationProblem,
  type ApplicationProblemFamilyGeneratorV1,
  type ApplicationProblemRenderContextV1,
} from '../generator'
import type { ApplicationVisualDiagramSceneV1, ApplicationVisualPoint } from '../visual-model'

export const G5_AREA_COMPOSITE_INVERSE_DOMAIN_SIZE = 108

const RECTANGLE_WIDTHS = [5, 7, 9, 11] as const
const RECTANGLE_HEIGHTS = [4, 6, 8] as const
const SQUARE_SIDES = [10, 12, 14] as const
const ATTACHMENT_POSITIONS = [0, 1, 2] as const

export interface G5AreaCompositeInverseParams {
  rectangleWidth: number
  rectangleHeight: number
  squareSide: number
  attachmentPosition: 0 | 1 | 2
  totalArea: number
}

function floorMod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus
}

function assertSafeSelection(seed: number, variantIndex: number): void {
  if (!Number.isSafeInteger(seed)) throw new TypeError('seed must be a safe integer')
  if (!Number.isSafeInteger(variantIndex) || variantIndex < 0) {
    throw new TypeError('variantIndex must be a non-negative safe integer')
  }
}

function decode(index: number): G5AreaCompositeInverseParams {
  let remaining = index
  const attachmentPosition = ATTACHMENT_POSITIONS[remaining % ATTACHMENT_POSITIONS.length]
  remaining = Math.floor(remaining / ATTACHMENT_POSITIONS.length)
  const squareSide = SQUARE_SIDES[remaining % SQUARE_SIDES.length]
  remaining = Math.floor(remaining / SQUARE_SIDES.length)
  const rectangleHeight = RECTANGLE_HEIGHTS[remaining % RECTANGLE_HEIGHTS.length]
  remaining = Math.floor(remaining / RECTANGLE_HEIGHTS.length)
  const rectangleWidth = RECTANGLE_WIDTHS[remaining % RECTANGLE_WIDTHS.length]
  return {
    rectangleWidth,
    rectangleHeight,
    squareSide,
    attachmentPosition,
    totalArea: rectangleWidth * rectangleHeight + squareSide * squareSide,
  }
}

export function selectG5AreaCompositeInverseParams(
  seed: number,
  variantIndex: number,
): G5AreaCompositeInverseParams {
  assertSafeSelection(seed, variantIndex)
  const index = (
    floorMod(seed, G5_AREA_COMPOSITE_INVERSE_DOMAIN_SIZE) +
    (variantIndex % G5_AREA_COMPOSITE_INVERSE_DOMAIN_SIZE)
  ) % G5_AREA_COMPOSITE_INVERSE_DOMAIN_SIZE
  return decode(index)
}

function assertParams(params: G5AreaCompositeInverseParams): void {
  if (
    !RECTANGLE_WIDTHS.includes(params.rectangleWidth as (typeof RECTANGLE_WIDTHS)[number]) ||
    !RECTANGLE_HEIGHTS.includes(params.rectangleHeight as (typeof RECTANGLE_HEIGHTS)[number]) ||
    !SQUARE_SIDES.includes(params.squareSide as (typeof SQUARE_SIDES)[number])
  ) {
    throw new TypeError('composite dimensions are outside the exhaustive domain')
  }
  if (!ATTACHMENT_POSITIONS.includes(params.attachmentPosition)) {
    throw new TypeError('attachment position is unsupported')
  }
  if (params.rectangleHeight > params.squareSide) {
    throw new TypeError('attachment edge cannot exceed the square side')
  }
  const expectedArea = params.squareSide ** 2 + params.rectangleWidth * params.rectangleHeight
  if (params.totalArea !== expectedArea) {
    throw new TypeError('total area is inconsistent with the component dimensions')
  }
}

function attachmentOffset(params: G5AreaCompositeInverseParams): number {
  if (params.attachmentPosition === 0) return 0
  if (params.attachmentPosition === 1) {
    return (params.squareSide - params.rectangleHeight) / 2
  }
  return params.squareSide - params.rectangleHeight
}

function unionPolygon(params: G5AreaCompositeInverseParams): ApplicationVisualPoint[] {
  const { squareSide: side, rectangleWidth: width, rectangleHeight: height } = params
  const offset = attachmentOffset(params)
  if (params.attachmentPosition === 0) {
    return [
      { x: 0, y: 0 },
      { x: side + width, y: 0 },
      { x: side + width, y: height },
      { x: side, y: height },
      { x: side, y: side },
      { x: 0, y: side },
    ]
  }
  if (params.attachmentPosition === 2) {
    return [
      { x: 0, y: 0 },
      { x: side, y: 0 },
      { x: side, y: offset },
      { x: side + width, y: offset },
      { x: side + width, y: side },
      { x: 0, y: side },
    ]
  }
  return [
    { x: 0, y: 0 },
    { x: side, y: 0 },
    { x: side, y: offset },
    { x: side + width, y: offset },
    { x: side + width, y: offset + height },
    { x: side, y: offset + height },
    { x: side, y: side },
    { x: 0, y: side },
  ]
}

function translate(point: ApplicationVisualPoint): ApplicationVisualPoint {
  return { x: point.x + 2, y: point.y + 2 }
}

function line(
  key: string,
  start: ApplicationVisualPoint,
  end: ApplicationVisualPoint,
  disclosure: 'given' | 'identifier',
  styleRole: 'primary' | 'secondary' | 'muted',
) {
  return {
    kind: 'line' as const,
    key,
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
    disclosure,
    styleRole,
    emphasis: 'normal' as const,
  }
}

function midpoint(first: ApplicationVisualPoint, second: ApplicationVisualPoint) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
}

export function buildG5AreaCompositeInverseScene(
  params: G5AreaCompositeInverseParams,
): ApplicationVisualDiagramSceneV1 {
  assertParams(params)
  const {
    squareSide: side,
    rectangleWidth: width,
    rectangleHeight: height,
    totalArea,
  } = params
  const offset = attachmentOffset(params)
  const square = [
    { x: 0, y: 0 },
    { x: side, y: 0 },
    { x: side, y: side },
    { x: 0, y: side },
  ].map(translate)
  const rectangle = [
    { x: side, y: offset },
    { x: side + width, y: offset },
    { x: side + width, y: offset + height },
    { x: side, y: offset + height },
  ].map(translate)
  const combined = unionPolygon(params).map(translate)
  const squareSideLine = line('square-side', square[0], square[3], 'given', 'primary')
  const rectangleHeightLine = line(
    'rectangle-height',
    rectangle[1],
    rectangle[2],
    'given',
    'secondary',
  )
  const rectangleWidthLine = line(
    'rectangle-width',
    rectangle[0],
    rectangle[1],
    'identifier',
    'muted',
  )
  const perimeter = 2 * width + 4 * side
  const areaAnchor = translate({ x: side * 0.42, y: side * 0.42 })
  const answerAnchor = translate({ x: side * 0.42, y: side * 0.72 })

  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: side + width + 4, height: side + 4 },
    scale: { x: 1, y: 1 },
    description: {
      before: {
        text: '정사각형의 한 변에 직사각형의 세로 전체가 빈틈없이 붙어 있습니다.',
        disclosure: 'given',
      },
    },
    primitives: [
      {
        kind: 'polygon',
        key: 'square',
        points: square,
        disclosure: 'given',
        styleRole: 'primary',
        emphasis: 'normal',
      },
      {
        kind: 'polygon',
        key: 'rectangle',
        points: rectangle,
        disclosure: 'given',
        styleRole: 'secondary',
        emphasis: 'normal',
      },
      {
        kind: 'polygon',
        key: 'combined-shape',
        points: combined,
        disclosure: 'identifier',
        styleRole: 'accent',
        emphasis: 'normal',
      },
      squareSideLine,
      rectangleHeightLine,
      rectangleWidthLine,
    ],
    labels: [
      {
        key: 'square-side-label',
        targetKey: 'square-side',
        ...midpoint(square[0], square[3]),
        content: { before: { text: `${side} cm`, disclosure: 'given' } },
        styleRole: 'primary',
      },
      {
        key: 'rectangle-height-label',
        targetKey: 'rectangle-height',
        ...midpoint(rectangle[1], rectangle[2]),
        content: { before: { text: `${height} cm`, disclosure: 'given' } },
        styleRole: 'secondary',
      },
      {
        key: 'rectangle-width-label',
        targetKey: 'rectangle-width',
        ...midpoint(rectangle[0], rectangle[1]),
        content: {
          before: { text: '가로 ?', disclosure: 'identifier' },
          after: { text: `가로 ${width} cm`, disclosure: 'intermediate' },
        },
        styleRole: 'muted',
      },
      {
        key: 'total-area-label',
        targetKey: 'combined-shape',
        ...areaAnchor,
        content: { before: { text: `전체 넓이 ${totalArea} cm²`, disclosure: 'given' } },
        styleRole: 'accent',
      },
      {
        key: 'perimeter-answer-label',
        targetKey: 'combined-shape',
        ...answerAnchor,
        content: {
          before: { text: '바깥 둘레 ?', disclosure: 'identifier' },
          after: { text: `바깥 둘레 ${perimeter} cm`, disclosure: 'solution' },
        },
        styleRole: 'accent',
      },
    ],
    constraints: [
      { kind: 'area', primitiveKey: 'square', expected: side * side },
      { kind: 'area', primitiveKey: 'rectangle', expected: width * height },
      { kind: 'area', primitiveKey: 'combined-shape', expected: totalArea },
      { kind: 'segment-length', primitiveKey: 'square-side', expected: side },
      { kind: 'segment-length', primitiveKey: 'rectangle-height', expected: height },
      { kind: 'segment-length', primitiveKey: 'rectangle-width', expected: width },
      { kind: 'topology', firstKey: 'square', secondKey: 'rectangle', relation: 'touching' },
    ],
  }
}

function numberParam(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (typeof value !== 'number') throw new TypeError(`${key} must be numeric`)
  return value
}

function paramsFromContext(context: ApplicationProblemRenderContextV1): G5AreaCompositeInverseParams {
  return {
    rectangleWidth: numberParam(context.params, 'rectangleWidth'),
    rectangleHeight: numberParam(context.params, 'rectangleHeight'),
    squareSide: numberParam(context.params, 'squareSide'),
    attachmentPosition: numberParam(context.params, 'attachmentPosition') as 0 | 1 | 2,
    totalArea: numberParam(context.params, 'totalArea'),
  }
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

function assertScene(context: ApplicationProblemRenderContextV1, expected: ApplicationVisualDiagramSceneV1): void {
  if (JSON.stringify(canonical(context.mathModel)) !== JSON.stringify(canonical(expected))) {
    throw new TypeError('composite scene does not match sampled parameters')
  }
}

const POSITION_TEXT = ['위쪽', '가운데', '아래쪽'] as const

export const G5_AREA_COMPOSITE_INVERSE_FAMILY = {
  schemaVersion: 'application-problem-family-v1',
  familyId: 'g5-area-composite-inverse',
  version: 1,
  packId: 'pack-unit-5-1-perimeter-area',
  unitId: 'unit-5-1-perimeter-area',
  conceptIds: ['rectangle-area-inverse-composition'],
  primaryStandard: '[6수03-13]',
  connectedStandards: ['[6수03-11]'],
  cognitiveDomain: 'reasoning',
  reasoningPattern: 'inverse',
  representations: ['text', 'diagram', 'equation'],
  contextType: 'real_world',
  readingLoad: 'medium',
  estimatedSteps: 4,
  modelId: 'full-edge-square-rectangle-union-v1',
  unknownRole: 'inferred-width-then-perimeter',
  requiredStudentActions: [
    'interpret_context',
    'infer_missing_value',
    'choose_model',
    'execute_calculation',
    'verify_result',
  ],
  misconceptionRefs: ['area-adds-side-lengths', 'area-inverse-uses-subtraction'],
  visualPolicy: {
    role: 'required',
    semantics: 'quantitative',
    generatorId: 'g5-area-composite-inverse-visual',
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
} as const satisfies ApplicationProblemFamilyV1

export const G5_AREA_COMPOSITE_INVERSE_GENERATOR = {
  familyId: G5_AREA_COMPOSITE_INVERSE_FAMILY.familyId,
  version: 1,
  packId: G5_AREA_COMPOSITE_INVERSE_FAMILY.packId,
  packVersion: 1,
  maxAttempts: 1,
  visualGeneratorVersion: 1,
  sample: ({ seed, variantIndex }) => {
    const params = selectG5AreaCompositeInverseParams(seed, variantIndex)
    return {
      params: { ...params },
      mathModel: buildG5AreaCompositeInverseScene(params) as unknown as JsonValue,
    }
  },
  render: (context) => {
    const params = paramsFromContext(context)
    assertParams(params)
    const scene = buildG5AreaCompositeInverseScene(params)
    assertScene(context, scene)
    const squareArea = params.squareSide ** 2
    const rectangleArea = params.totalArea - squareArea
    const perimeter = 2 * params.rectangleWidth + 4 * params.squareSide
    return {
      prompt: `한 변이 ${params.squareSide} cm인 정사각형 오른쪽 변의 ${POSITION_TEXT[params.attachmentPosition]}에 세로 ${params.rectangleHeight} cm인 직사각형의 세로 전체가 빈틈없이 붙어 있습니다. 합친 넓이는 ${params.totalArea} cm²입니다. 직사각형의 빠진 가로를 먼저 구한 뒤 합친 도형의 바깥 둘레를 구하세요.`,
      answer: { format: 'choice', normalized: String(perimeter) },
      choices: [
        String(perimeter),
        String(perimeter + 2 * params.rectangleHeight),
        String(4 * params.squareSide),
        String(2 * params.rectangleWidth + 2 * params.squareSide),
      ],
      correctChoiceIndex: 0,
      solutionSteps: [
        `그림처럼 직사각형의 세로 전체가 정사각형 오른쪽 변의 ${POSITION_TEXT[params.attachmentPosition]}에 붙어 있고, 정사각형의 넓이는 ${params.squareSide}×${params.squareSide}=${squareArea} cm²입니다.`,
        `직사각형의 넓이는 ${params.totalArea}-${squareArea}=${rectangleArea} cm²입니다.`,
        `${rectangleArea}÷${params.rectangleHeight}=${params.rectangleWidth}이므로 직사각형의 가로는 ${params.rectangleWidth} cm입니다.`,
        `붙어 있는 ${params.rectangleHeight} cm 변은 바깥 둘레가 아니므로, 바깥 둘레는 ${perimeter} cm입니다.`,
      ],
      hintSteps: [
        '전체 넓이에서 정사각형 넓이를 빼면 직사각형 넓이를 알 수 있습니다.',
        '직사각형 넓이를 세로로 나누어 빠진 가로를 구한 뒤, 맞닿은 변은 둘레에서 제외하세요.',
      ],
    }
  },
} satisfies ApplicationProblemFamilyGeneratorV1

export function generateG5AreaCompositeInverseProblem(input: {
  seed: number
  variantIndex: number
}) {
  return generateApplicationProblem({
    family: G5_AREA_COMPOSITE_INVERSE_FAMILY,
    generator: G5_AREA_COMPOSITE_INVERSE_GENERATOR,
    packVersion: 1,
    ...input,
  })
}
