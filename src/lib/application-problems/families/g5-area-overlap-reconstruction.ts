import type { ApplicationProblemFamilyV1, JsonValue } from '../contracts'
import {
  generateApplicationProblem,
  type ApplicationProblemFamilyGeneratorV1,
  type ApplicationProblemRenderContextV1,
} from '../generator'
import type { ApplicationVisualDiagramSceneV1, ApplicationVisualPoint } from '../visual-model'

export const G5_AREA_OVERLAP_RECONSTRUCTION_DOMAIN_SIZE = 243

const A_ONLY_VALUES = [12, 16, 20] as const
const AB_VALUES = [2, 4, 6] as const
const AC_VALUES = [1, 2, 3] as const
const ABC_VALUES = [3, 5, 7] as const
const ZERO_PAIRS = ['bc', 'ac', 'ab'] as const

type ShapeKey = 'A' | 'B' | 'C'
export type PairKey = 'ab' | 'ac' | 'bc'

interface RoleMapping {
  hub: ShapeKey
  upper: ShapeKey
  right: ShapeKey
  knownPair: PairKey
  targetPair: PairKey
}

export interface G5AreaOverlapReconstructionParams {
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

function rolesFor(zeroPair: PairKey): RoleMapping {
  if (zeroPair === 'bc') {
    return { hub: 'A', upper: 'B', right: 'C', knownPair: 'ab', targetPair: 'ac' }
  }
  if (zeroPair === 'ac') {
    return { hub: 'B', upper: 'C', right: 'A', knownPair: 'bc', targetPair: 'ab' }
  }
  if (zeroPair === 'ab') {
    return { hub: 'C', upper: 'A', right: 'B', knownPair: 'ac', targetPair: 'bc' }
  }
  throw new TypeError('zero pair topology is unsupported')
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

function decode(index: number): G5AreaOverlapReconstructionParams {
  let remaining = index
  const zeroPair = ZERO_PAIRS[remaining % ZERO_PAIRS.length]
  remaining = Math.floor(remaining / ZERO_PAIRS.length)
  const abc = ABC_VALUES[remaining % ABC_VALUES.length]
  remaining = Math.floor(remaining / ABC_VALUES.length)
  const ac = AC_VALUES[remaining % AC_VALUES.length]
  remaining = Math.floor(remaining / AC_VALUES.length)
  const ab = AB_VALUES[remaining % AB_VALUES.length]
  remaining = Math.floor(remaining / AB_VALUES.length)
  const aOnly = A_ONLY_VALUES[remaining % A_ONLY_VALUES.length]
  const roles = rolesFor(zeroPair)
  const shapeArea = aOnly + ab + ac + abc
  return {
    aOnly,
    ab,
    ac,
    abc,
    zeroPair,
    shapeArea,
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

export function selectG5AreaOverlapReconstructionParams(
  seed: number,
  variantIndex: number,
): G5AreaOverlapReconstructionParams {
  assertSafeSelection(seed, variantIndex)
  const index = (
    floorMod(seed, G5_AREA_OVERLAP_RECONSTRUCTION_DOMAIN_SIZE) +
    (variantIndex % G5_AREA_OVERLAP_RECONSTRUCTION_DOMAIN_SIZE)
  ) % G5_AREA_OVERLAP_RECONSTRUCTION_DOMAIN_SIZE
  return decode(index)
}

function assertParams(params: G5AreaOverlapReconstructionParams): RoleMapping {
  if (
    !A_ONLY_VALUES.includes(params.aOnly as (typeof A_ONLY_VALUES)[number]) ||
    !AB_VALUES.includes(params.ab as (typeof AB_VALUES)[number]) ||
    !AC_VALUES.includes(params.ac as (typeof AC_VALUES)[number]) ||
    !ABC_VALUES.includes(params.abc as (typeof ABC_VALUES)[number])
  ) {
    throw new TypeError('overlap values must be positive members of the exhaustive domain')
  }
  if (params.targetOverlap <= 0 || params.knownOverlap <= 0 || params.abc <= 0) {
    throw new TypeError('overlap regions must be positive')
  }
  const roles = rolesFor(params.zeroPair)
  if (
    params.hubShape !== roles.hub ||
    params.upperShape !== roles.upper ||
    params.rightShape !== roles.right ||
    params.knownPair !== roles.knownPair ||
    params.targetPair !== roles.targetPair ||
    params.knownOverlap !== params.ab ||
    params.targetOverlap !== params.ac
  ) {
    throw new TypeError('overlap role mapping is inconsistent')
  }
  const shapeArea = params.aOnly + params.ab + params.ac + params.abc
  if (params.shapeArea !== shapeArea) throw new TypeError('shape area is inconsistent')
  const unionArea = 3 * params.aOnly + 2 * params.ab + 2 * params.ac + params.abc
  if (params.unionArea !== unionArea) throw new TypeError('union area is inconsistent')
  if (params.aOnly < (params.ab * params.ac) / params.abc) {
    throw new TypeError('overlap topology does not fit inside the hub shape')
  }
  return roles
}

interface CanonicalGeometry {
  polygons: Record<'hub' | 'upper' | 'right', ApplicationVisualPoint[]>
  anchors: Record<'hubOnly' | 'upperOnly' | 'rightOnly' | 'known' | 'target' | 'triple', ApplicationVisualPoint>
}

function canonicalGeometry(params: G5AreaOverlapReconstructionParams): CanonicalGeometry {
  const shapeArea = params.shapeArea
  const known = params.ab
  const target = params.ac
  const triple = params.abc
  const upperOnly = params.aOnly + target
  const rightOnly = params.aOnly + known
  const stripHeight = (known + triple) / shapeArea
  const stripWidth = triple / stripHeight
  const rightStripHeight = (target + triple) / stripWidth
  if (!(stripHeight > 0 && stripWidth > 0 && rightStripHeight > stripHeight && rightStripHeight <= 1)) {
    throw new TypeError('overlap topology cannot be constructed')
  }
  const rho = 0.5
  const upperDepth = (2 * upperOnly) / (shapeArea * (1 + rho))
  const rightDepth = (2 * rightOnly) / (rightStripHeight * (1 + rho))
  const upperLeft = ((1 - rho) * shapeArea) / 2
  const upperRight = ((1 + rho) * shapeArea) / 2
  const rightTop = ((1 - rho) * rightStripHeight) / 2
  const rightBottom = ((1 + rho) * rightStripHeight) / 2
  return {
    polygons: {
      hub: [
        { x: 0, y: 0 },
        { x: shapeArea, y: 0 },
        { x: shapeArea, y: 1 },
        { x: 0, y: 1 },
      ],
      upper: [
        { x: 0, y: stripHeight },
        { x: 0, y: 0 },
        { x: upperLeft, y: -upperDepth },
        { x: upperRight, y: -upperDepth },
        { x: shapeArea, y: 0 },
        { x: shapeArea, y: stripHeight },
      ],
      right: [
        { x: shapeArea - stripWidth, y: 0 },
        { x: shapeArea, y: 0 },
        { x: shapeArea + rightDepth, y: rightTop },
        { x: shapeArea + rightDepth, y: rightBottom },
        { x: shapeArea, y: rightStripHeight },
        { x: shapeArea - stripWidth, y: rightStripHeight },
      ],
    },
    anchors: {
      hubOnly: { x: (shapeArea - stripWidth) / 2, y: (stripHeight + 1) / 2 },
      upperOnly: { x: shapeArea / 2, y: -upperDepth / 2 },
      rightOnly: { x: shapeArea + rightDepth / 2, y: rightStripHeight / 2 },
      known: { x: (shapeArea - stripWidth) / 2, y: stripHeight / 2 },
      target: { x: shapeArea - stripWidth / 2, y: (stripHeight + rightStripHeight) / 2 },
      triple: { x: shapeArea - stripWidth / 2, y: stripHeight / 2 },
    },
  }
}

function isStrictlyConvex(points: readonly ApplicationVisualPoint[]): boolean {
  let sign = 0
  for (let index = 0; index < points.length; index += 1) {
    const first = points[index]
    const second = points[(index + 1) % points.length]
    const third = points[(index + 2) % points.length]
    const cross = (second.x - first.x) * (third.y - second.y) -
      (second.y - first.y) * (third.x - second.x)
    if (Math.abs(cross) <= 1e-12) continue
    const nextSign = Math.sign(cross)
    if (sign !== 0 && nextSign !== sign) return false
    sign = nextSign
  }
  return sign !== 0
}

function transformGeometry(geometry: CanonicalGeometry, shapeArea: number): CanonicalGeometry & {
  viewBox: { width: number; height: number }
} {
  const scaleX = 1 / Math.sqrt(shapeArea)
  const scaleY = 1 / scaleX
  const allPoints = Object.values(geometry.polygons).flat()
  const scaled = allPoints.map((point) => ({ x: point.x * scaleX, y: point.y * scaleY }))
  const minX = Math.min(...scaled.map((point) => point.x))
  const minY = Math.min(...scaled.map((point) => point.y))
  const maxX = Math.max(...scaled.map((point) => point.x))
  const maxY = Math.max(...scaled.map((point) => point.y))
  const transform = (point: ApplicationVisualPoint) => ({
    x: point.x * scaleX - minX + 2,
    y: point.y * scaleY - minY + 2,
  })
  const polygons = {
    hub: geometry.polygons.hub.map(transform),
    upper: geometry.polygons.upper.map(transform),
    right: geometry.polygons.right.map(transform),
  }
  if (!Object.values(polygons).every(isStrictlyConvex)) {
    throw new TypeError('overlap construction must produce convex closed polygons')
  }
  return {
    polygons,
    anchors: {
      hubOnly: transform(geometry.anchors.hubOnly),
      upperOnly: transform(geometry.anchors.upperOnly),
      rightOnly: transform(geometry.anchors.rightOnly),
      known: transform(geometry.anchors.known),
      target: transform(geometry.anchors.target),
      triple: transform(geometry.anchors.triple),
    },
    viewBox: { width: maxX - minX + 4, height: maxY - minY + 4 },
  }
}

function pairText(pair: PairKey): string {
  return `${pair[0].toUpperCase()}와 ${pair[1].toUpperCase()}`
}

export function buildG5AreaOverlapReconstructionScene(
  params: G5AreaOverlapReconstructionParams,
): ApplicationVisualDiagramSceneV1 {
  const roles = assertParams(params)
  const geometry = transformGeometry(canonicalGeometry(params), params.shapeArea)
  const polygons: Record<ShapeKey, ApplicationVisualPoint[]> = {
    A: [],
    B: [],
    C: [],
  }
  polygons[roles.hub] = geometry.polygons.hub
  polygons[roles.upper] = geometry.polygons.upper
  polygons[roles.right] = geometry.polygons.right
  const styles = { A: 'primary', B: 'secondary', C: 'accent' } as const
  const shapePrimitives = (['A', 'B', 'C'] as const).map((shape) => ({
    kind: 'polygon' as const,
    key: `shape-${shape.toLowerCase()}`,
    points: polygons[shape],
    disclosure: 'identifier' as const,
    styleRole: styles[shape],
    emphasis: 'normal' as const,
  }))
  const identifierAnchors: Record<ShapeKey, ApplicationVisualPoint> = {
    A: geometry.anchors.hubOnly,
    B: geometry.anchors.hubOnly,
    C: geometry.anchors.hubOnly,
  }
  identifierAnchors[roles.hub] = geometry.anchors.hubOnly
  identifierAnchors[roles.upper] = geometry.anchors.upperOnly
  identifierAnchors[roles.right] = geometry.anchors.rightOnly

  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: geometry.viewBox,
    scale: { x: 1, y: 1 },
    description: {
      before: {
        text: `A, B, C의 넓이는 각각 ${params.shapeArea} cm²이고 세 도형이 차지한 전체 넓이는 ${params.unionArea} cm²입니다.`,
        disclosure: 'given',
      },
    },
    primitives: shapePrimitives,
    labels: [
      ...(['A', 'B', 'C'] as const).map((shape) => ({
        key: `shape-${shape.toLowerCase()}-identifier`,
        ...identifierAnchors[shape],
        content: {
          before: {
            text: shape === roles.hub ? `${shape}만 ${params.aOnly} cm²` : `도형 ${shape}`,
            disclosure: shape === roles.hub ? 'given' as const : 'identifier' as const,
          },
        },
        styleRole: styles[shape],
      })),
      {
        key: `region-${params.knownPair}-label`,
        ...geometry.anchors.known,
        content: {
          before: { text: `${pairText(params.knownPair)}만 ${params.knownOverlap} cm²`, disclosure: 'given' },
        },
        styleRole: 'secondary',
      },
      {
        key: 'region-abc-label',
        ...geometry.anchors.triple,
        content: {
          before: { text: `세 도형 공통 ${params.abc} cm²`, disclosure: 'given' },
        },
        styleRole: 'accent',
      },
      {
        key: `region-${params.targetPair}-answer-label`,
        ...geometry.anchors.target,
        content: {
          before: { text: `${pairText(params.targetPair)}만 ?`, disclosure: 'identifier' },
          after: {
            text: `${pairText(params.targetPair)}만 ${params.targetOverlap} cm²`,
            disclosure: 'solution',
          },
        },
        styleRole: 'accent',
      },
    ],
    constraints: [
      ...(['A', 'B', 'C'] as const).map((shape) => ({
        kind: 'area' as const,
        primitiveKey: `shape-${shape.toLowerCase()}`,
        expected: params.shapeArea,
      })),
    ],
  }
}

function numberParam(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (typeof value !== 'number') throw new TypeError(`${key} must be numeric`)
  return value
}

function stringParam<T extends string>(params: Readonly<Record<string, JsonValue>>, key: string): T {
  const value = params[key]
  if (typeof value !== 'string') throw new TypeError(`${key} must be text`)
  return value as T
}

function paramsFromContext(context: ApplicationProblemRenderContextV1): G5AreaOverlapReconstructionParams {
  return {
    aOnly: numberParam(context.params, 'aOnly'),
    ab: numberParam(context.params, 'ab'),
    ac: numberParam(context.params, 'ac'),
    abc: numberParam(context.params, 'abc'),
    zeroPair: stringParam<PairKey>(context.params, 'zeroPair'),
    shapeArea: numberParam(context.params, 'shapeArea'),
    unionArea: numberParam(context.params, 'unionArea'),
    hubShape: stringParam<ShapeKey>(context.params, 'hubShape'),
    upperShape: stringParam<ShapeKey>(context.params, 'upperShape'),
    rightShape: stringParam<ShapeKey>(context.params, 'rightShape'),
    knownPair: stringParam<PairKey>(context.params, 'knownPair'),
    targetPair: stringParam<PairKey>(context.params, 'targetPair'),
    knownOverlap: numberParam(context.params, 'knownOverlap'),
    targetOverlap: numberParam(context.params, 'targetOverlap'),
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
    throw new TypeError('overlap scene does not match sampled parameters')
  }
}

export const G5_AREA_OVERLAP_RECONSTRUCTION_FAMILY = {
  schemaVersion: 'application-problem-family-v1',
  familyId: 'g5-area-overlap-reconstruction',
  version: 1,
  packId: 'pack-unit-5-1-perimeter-area',
  unitId: 'unit-5-1-perimeter-area',
  conceptIds: ['polygon-area-recomposition'],
  primaryStandard: '[6수03-14]',
  connectedStandards: ['[6수03-13]'],
  cognitiveDomain: 'reasoning',
  reasoningPattern: 'model_and_check',
  representations: ['text', 'diagram', 'equation'],
  contextType: 'pure_math',
  readingLoad: 'medium',
  estimatedSteps: 4,
  modelId: 'three-convex-shape-overlap-v1',
  unknownRole: 'missing-pair-only-area',
  requiredStudentActions: [
    'interpret_context',
    'choose_model',
    'infer_missing_value',
    'execute_calculation',
    'verify_result',
  ],
  misconceptionRefs: ['overlap-area-double-count'],
  visualPolicy: {
    role: 'required',
    semantics: 'quantitative',
    generatorId: 'g5-area-overlap-reconstruction-visual',
    answerCritical: true,
  },
  proofMode: 'exhaustive',
  runtimeMode: 'deterministic-generator',
  releaseStatus: 'draft',
  approval: { ownerStatus: 'pending', evidenceRefs: [], expertStatus: 'not-reviewed' },
} as const satisfies ApplicationProblemFamilyV1

export const G5_AREA_OVERLAP_RECONSTRUCTION_GENERATOR = {
  familyId: G5_AREA_OVERLAP_RECONSTRUCTION_FAMILY.familyId,
  version: 1,
  packId: G5_AREA_OVERLAP_RECONSTRUCTION_FAMILY.packId,
  packVersion: 1,
  maxAttempts: 1,
  visualGeneratorVersion: 1,
  sample: ({ seed, variantIndex }) => {
    const params = selectG5AreaOverlapReconstructionParams(seed, variantIndex)
    return {
      params: { ...params },
      mathModel: buildG5AreaOverlapReconstructionScene(params) as unknown as JsonValue,
    }
  },
  render: (context) => {
    const params = paramsFromContext(context)
    const roles = assertParams(params)
    const scene = buildG5AreaOverlapReconstructionScene(params)
    assertScene(context, scene)
    const firstRemainder = params.shapeArea - params.aOnly - params.knownOverlap
    const answer = params.targetOverlap
    return {
      prompt: `넓이가 각각 ${params.shapeArea} cm²인 도형 A, B, C가 겹쳐 있고 전체가 차지한 넓이는 ${params.unionArea} cm²입니다. ${roles.hub}만의 넓이는 ${params.aOnly} cm², ${pairText(params.knownPair)}만 겹친 넓이는 ${params.knownOverlap} cm², 세 도형이 함께 겹친 넓이는 ${params.abc} cm²입니다. ${pairText(params.zeroPair)}만 겹친 부분은 없습니다. ${pairText(params.targetPair)}만 겹친 넓이를 구하세요.`,
      answer: { format: 'choice', normalized: String(answer) },
      choices: [
        String(answer),
        String(answer + params.abc),
        String(answer + params.knownOverlap + params.abc),
        String(params.shapeArea - answer),
      ],
      correctChoiceIndex: 0,
      solutionSteps: [
        `${roles.hub}의 전체 넓이 ${params.shapeArea} cm²는 ${roles.hub}만, 알려진 두 도형만, 세 도형 공통, 구하려는 두 도형만 영역으로 나뉩니다.`,
        `${params.shapeArea}-${params.aOnly}-${params.knownOverlap}=${firstRemainder} cm²입니다.`,
        `여기에서 세 도형 공통 ${params.abc} cm²를 빼면 ${firstRemainder}-${params.abc}=${answer} cm²입니다.`,
        `각 도형의 넓이와 전체 넓이를 영역별로 다시 더해 관계가 맞는지 확인할 수 있습니다.`,
      ],
      hintSteps: [
        `${roles.hub} 안에 들어 있는 서로 겹치지 않는 네 영역을 먼저 찾아보세요.`,
        `${roles.hub}의 전체에서 ${roles.hub}만, 알려진 겹침, 세 도형 공통 넓이를 차례로 빼세요.`,
      ],
    }
  },
} satisfies ApplicationProblemFamilyGeneratorV1

export function generateG5AreaOverlapReconstructionProblem(input: {
  seed: number
  variantIndex: number
}) {
  return generateApplicationProblem({
    family: G5_AREA_OVERLAP_RECONSTRUCTION_FAMILY,
    generator: G5_AREA_OVERLAP_RECONSTRUCTION_GENERATOR,
    packVersion: 1,
    ...input,
  })
}
