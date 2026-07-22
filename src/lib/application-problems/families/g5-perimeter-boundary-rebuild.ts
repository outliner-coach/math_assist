import type { ApplicationVisualDiagramSceneV1, ApplicationVisualPoint } from '../visual-model'
import {
  generateApplicationProblem,
  type ApplicationProblemFamilyGeneratorV1,
  type ApplicationProblemRenderContextV1,
} from '../generator'
import type { ApplicationProblemFamilyV1, JsonValue } from '../contracts'

export const G5_PERIMETER_BOUNDARY_REBUILD_DOMAIN_SIZE = 1024

const WIDTHS = [12, 14, 16, 18] as const
const HEIGHTS = [9, 11, 13, 15] as const
const NOTCH_WIDTHS = [3, 4, 5, 6] as const
const NOTCH_HEIGHTS = [2, 3, 4, 5] as const
const ROTATIONS = [0, 1, 2, 3] as const

export interface G5PerimeterBoundaryRebuildParams {
  width: number
  height: number
  notchWidth: number
  notchHeight: number
  rotation: 0 | 1 | 2 | 3
}

function assertSafeSelection(seed: number, variantIndex: number): void {
  if (!Number.isSafeInteger(seed)) throw new TypeError('seed must be a safe integer')
  if (!Number.isSafeInteger(variantIndex) || variantIndex < 0) {
    throw new TypeError('variantIndex must be a non-negative safe integer')
  }
}

function floorMod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus
}

function decode(index: number): G5PerimeterBoundaryRebuildParams {
  let remaining = index
  const rotation = ROTATIONS[remaining % ROTATIONS.length]
  remaining = Math.floor(remaining / ROTATIONS.length)
  const notchHeight = NOTCH_HEIGHTS[remaining % NOTCH_HEIGHTS.length]
  remaining = Math.floor(remaining / NOTCH_HEIGHTS.length)
  const notchWidth = NOTCH_WIDTHS[remaining % NOTCH_WIDTHS.length]
  remaining = Math.floor(remaining / NOTCH_WIDTHS.length)
  const height = HEIGHTS[remaining % HEIGHTS.length]
  remaining = Math.floor(remaining / HEIGHTS.length)
  const width = WIDTHS[remaining % WIDTHS.length]
  return { width, height, notchWidth, notchHeight, rotation }
}

export function selectG5PerimeterBoundaryRebuildParams(
  seed: number,
  variantIndex: number,
): G5PerimeterBoundaryRebuildParams {
  assertSafeSelection(seed, variantIndex)
  const index = (
    floorMod(seed, G5_PERIMETER_BOUNDARY_REBUILD_DOMAIN_SIZE) +
    (variantIndex % G5_PERIMETER_BOUNDARY_REBUILD_DOMAIN_SIZE)
  ) % G5_PERIMETER_BOUNDARY_REBUILD_DOMAIN_SIZE
  return decode(index)
}

function assertParams(params: G5PerimeterBoundaryRebuildParams): void {
  if (params.notchWidth >= params.width || params.notchHeight >= params.height) {
    throw new TypeError('notch dimensions must be smaller than the outer rectangle')
  }
  const valid =
    WIDTHS.includes(params.width as (typeof WIDTHS)[number]) &&
    HEIGHTS.includes(params.height as (typeof HEIGHTS)[number]) &&
    NOTCH_WIDTHS.includes(params.notchWidth as (typeof NOTCH_WIDTHS)[number]) &&
    NOTCH_HEIGHTS.includes(params.notchHeight as (typeof NOTCH_HEIGHTS)[number]) &&
    ROTATIONS.includes(params.rotation)
  if (!valid) throw new TypeError('boundary parameters are outside the exhaustive domain')
}

function rotate(point: ApplicationVisualPoint, quarterTurns: number): ApplicationVisualPoint {
  if (quarterTurns === 1) return { x: -point.y, y: point.x }
  if (quarterTurns === 2) return { x: -point.x, y: -point.y }
  if (quarterTurns === 3) return { x: point.y, y: -point.x }
  return { ...point }
}

function transformFactory(points: readonly ApplicationVisualPoint[], rotation: number) {
  const rotated = points.map((point) => rotate(point, rotation))
  const minX = Math.min(...rotated.map((point) => point.x))
  const minY = Math.min(...rotated.map((point) => point.y))
  return {
    width: Math.max(...rotated.map((point) => point.x)) - minX + 4,
    height: Math.max(...rotated.map((point) => point.y)) - minY + 4,
    point: (point: ApplicationVisualPoint) => {
      const value = rotate(point, rotation)
      return { x: value.x - minX + 2, y: value.y - minY + 2 }
    },
  }
}

function line(
  key: string,
  start: ApplicationVisualPoint,
  end: ApplicationVisualPoint,
  styleRole: 'primary' | 'muted',
) {
  return {
    kind: 'line' as const,
    key,
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
    disclosure: 'given' as const,
    styleRole,
    emphasis: 'normal' as const,
  }
}

function midpoint(first: ApplicationVisualPoint, second: ApplicationVisualPoint) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
}

export function buildG5PerimeterBoundaryRebuildScene(
  params: G5PerimeterBoundaryRebuildParams,
): ApplicationVisualDiagramSceneV1 {
  assertParams(params)
  const { width, height, notchWidth, notchHeight, rotation } = params
  const base = [
    { x: 0, y: 0 },
    { x: width - notchWidth, y: 0 },
    { x: width - notchWidth, y: notchHeight },
    { x: width, y: notchHeight },
    { x: width, y: height },
    { x: 0, y: height },
  ]
  const removedCorner = { x: width, y: 0 }
  const transform = transformFactory([...base, removedCorner], rotation)
  const polygon = base.map(transform.point)
  const corner = transform.point(removedCorner)
  const boundaryLengths = [
    width - notchWidth,
    notchHeight,
    notchWidth,
    height - notchHeight,
    width,
    height,
  ]
  const boundary = polygon.map((start, index) =>
    line(`boundary-${index}`, start, polygon[(index + 1) % polygon.length], 'primary'),
  )
  const cutWidth = line('cut-width', polygon[1], corner, 'muted')
  const cutHeight = line('cut-height', corner, polygon[3], 'muted')
  const boardAnchor = transform.point({ x: width * 0.28, y: height * 0.48 })
  const perimeter = 2 * (width + height)

  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: transform.width, height: transform.height },
    scale: { x: 1, y: 1 },
    description: {
      before: {
        text: '진한 선은 남은 판의 바깥 경계이고, 흐린 선은 잘려 나가 둘레에 포함되지 않는 선입니다.',
        disclosure: 'given',
      },
    },
    primitives: [
      {
        kind: 'polygon',
        key: 'remaining-board',
        points: polygon,
        disclosure: 'identifier',
        styleRole: 'secondary',
        emphasis: 'normal',
      },
      ...boundary,
      cutWidth,
      cutHeight,
    ],
    labels: [
      {
        key: 'outer-width-label',
        targetKey: 'boundary-4',
        ...midpoint(polygon[4], polygon[5]),
        content: { before: { text: `${width} cm`, disclosure: 'given' } },
        styleRole: 'primary',
      },
      {
        key: 'outer-height-label',
        targetKey: 'boundary-5',
        ...midpoint(polygon[5], polygon[0]),
        content: { before: { text: `${height} cm`, disclosure: 'given' } },
        styleRole: 'primary',
      },
      {
        key: 'notch-width-label',
        targetKey: 'cut-width',
        ...midpoint(polygon[1], corner),
        content: { before: { text: `${notchWidth} cm`, disclosure: 'given' } },
        styleRole: 'muted',
      },
      {
        key: 'notch-height-label',
        targetKey: 'cut-height',
        ...midpoint(corner, polygon[3]),
        content: { before: { text: `${notchHeight} cm`, disclosure: 'given' } },
        styleRole: 'muted',
      },
      {
        key: 'perimeter-answer-label',
        targetKey: 'remaining-board',
        ...boardAnchor,
        content: {
          before: { text: '둘레 ?', disclosure: 'identifier' },
          after: { text: `둘레 ${perimeter} cm`, disclosure: 'solution' },
        },
        styleRole: 'accent',
      },
    ],
    constraints: [
      ...boundaryLengths.map((expected, index) => ({
        kind: 'segment-length' as const,
        primitiveKey: `boundary-${index}`,
        expected,
      })),
      { kind: 'segment-length', primitiveKey: 'cut-width', expected: notchWidth },
      { kind: 'segment-length', primitiveKey: 'cut-height', expected: notchHeight },
      {
        kind: 'area',
        primitiveKey: 'remaining-board',
        expected: width * height - notchWidth * notchHeight,
      },
    ],
  }
}

function numberParam(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (typeof value !== 'number') throw new TypeError(`${key} must be numeric`)
  return value
}

function paramsFromContext(context: ApplicationProblemRenderContextV1): G5PerimeterBoundaryRebuildParams {
  return {
    width: numberParam(context.params, 'width'),
    height: numberParam(context.params, 'height'),
    notchWidth: numberParam(context.params, 'notchWidth'),
    notchHeight: numberParam(context.params, 'notchHeight'),
    rotation: numberParam(context.params, 'rotation') as 0 | 1 | 2 | 3,
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
    throw new TypeError('boundary scene does not match sampled parameters')
  }
}

export const G5_PERIMETER_BOUNDARY_REBUILD_FAMILY = {
  schemaVersion: 'application-problem-family-v1',
  familyId: 'g5-perimeter-boundary-rebuild',
  version: 1,
  packId: 'pack-unit-5-1-perimeter-area',
  unitId: 'unit-5-1-perimeter-area',
  conceptIds: ['perimeter-boundary-reconstruction'],
  primaryStandard: '[6수03-11]',
  connectedStandards: [],
  cognitiveDomain: 'applying',
  reasoningPattern: 'representation_shift',
  representations: ['text', 'diagram'],
  contextType: 'real_world',
  readingLoad: 'medium',
  estimatedSteps: 3,
  modelId: 'orthogonal-corner-notch-v1',
  unknownRole: 'reconstructed-perimeter',
  requiredStudentActions: [
    'interpret_context',
    'convert_representation',
    'execute_calculation',
    'verify_result',
  ],
  misconceptionRefs: [
    'perimeter-counts-internal-segments',
    'perimeter-omits-reconstructed-side',
  ],
  visualPolicy: {
    role: 'required',
    semantics: 'quantitative',
    generatorId: 'g5-perimeter-boundary-rebuild-visual',
    answerCritical: true,
  },
  proofMode: 'exhaustive',
  runtimeMode: 'deterministic-generator',
  releaseStatus: 'draft',
  approval: { ownerStatus: 'pending', evidenceRefs: [], expertStatus: 'not-reviewed' },
} as const satisfies ApplicationProblemFamilyV1

export const G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR = {
  familyId: G5_PERIMETER_BOUNDARY_REBUILD_FAMILY.familyId,
  version: 1,
  packId: G5_PERIMETER_BOUNDARY_REBUILD_FAMILY.packId,
  packVersion: 1,
  maxAttempts: 1,
  visualGeneratorVersion: 1,
  sample: ({ seed, variantIndex }) => {
    const params = selectG5PerimeterBoundaryRebuildParams(seed, variantIndex)
    return {
      params: { ...params },
      mathModel: buildG5PerimeterBoundaryRebuildScene(params) as unknown as JsonValue,
    }
  },
  render: (context) => {
    const params = paramsFromContext(context)
    assertParams(params)
    const scene = buildG5PerimeterBoundaryRebuildScene(params)
    assertScene(context, scene)
    const perimeter = 2 * (params.width + params.height)
    const offset = params.notchWidth + params.notchHeight
    return {
      prompt: `가로 ${params.width} cm, 세로 ${params.height} cm인 직사각형 판의 한 모서리에서 가로 ${params.notchWidth} cm, 세로 ${params.notchHeight} cm인 부분을 잘라 냈습니다. 남은 판의 바깥 경계를 다시 따라가 둘레를 구하세요.`,
      answer: { format: 'choice', normalized: String(perimeter) },
      choices: [
        String(perimeter),
        String(perimeter + offset),
        String(perimeter + 2 * offset),
        String(perimeter - offset),
      ],
      correctChoiceIndex: 0,
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
  },
} satisfies ApplicationProblemFamilyGeneratorV1

export function generateG5PerimeterBoundaryRebuildProblem(input: {
  seed: number
  variantIndex: number
}) {
  return generateApplicationProblem({
    family: G5_PERIMETER_BOUNDARY_REBUILD_FAMILY,
    generator: G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR,
    packVersion: 1,
    ...input,
  })
}
