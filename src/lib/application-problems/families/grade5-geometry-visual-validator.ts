import type { GeneratedApplicationProblemV1 } from '../contracts'
import type {
  ApplicationVisualDiagramSceneV1,
  ApplicationVisualPoint,
  ApplicationVisualPrimitive,
  ApplicationVisualSceneV1,
} from '../visual-model'
import type { ApplicationVisualValidationIssue } from '../visual-validator'
import {
  measureOverlapPolygons,
  pointInPolygon,
} from './g5-area-overlap-reconstruction-oracle'
import {
  buildG5AreaCompositeInverseScene,
  generateG5AreaCompositeInverseProblem,
  type G5AreaCompositeInverseParams,
} from './g5-area-composite-inverse'
import {
  buildG5AreaOverlapReconstructionScene,
  generateG5AreaOverlapReconstructionProblem,
  type G5AreaOverlapReconstructionParams,
} from './g5-area-overlap-reconstruction'
import {
  buildG5PerimeterBoundaryRebuildScene,
  generateG5PerimeterBoundaryRebuildProblem,
  type G5PerimeterBoundaryRebuildParams,
} from './g5-perimeter-boundary-rebuild'

const EPSILON = 1e-9
const SUPPORTED_FAMILIES = new Set([
  'g5-perimeter-boundary-rebuild',
  'g5-area-composite-inverse',
  'g5-area-overlap-reconstruction',
])
const DECLARED_PARAM_KEYS: Readonly<Record<string, readonly string[]>> = {
  'g5-perimeter-boundary-rebuild': [
    '__generation',
    'width',
    'height',
    'notchWidth',
    'notchHeight',
    'rotation',
  ],
  'g5-area-composite-inverse': [
    '__generation',
    'rectangleWidth',
    'rectangleHeight',
    'squareSide',
    'attachmentPosition',
    'totalArea',
  ],
  'g5-area-overlap-reconstruction': [
    '__generation',
    'aOnly',
    'ab',
    'ac',
    'abc',
    'zeroPair',
    'shapeArea',
    'unionArea',
    'hubShape',
    'upperShape',
    'rightShape',
    'knownPair',
    'targetPair',
    'knownOverlap',
    'targetOverlap',
  ],
}

function issue(
  issues: ApplicationVisualValidationIssue[],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message })
}

function close(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= Math.max(EPSILON, Math.abs(expected) * 1e-9)
}

function numericParam(
  params: Readonly<Record<string, unknown>>,
  key: string,
): number {
  const value = params[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${key} must be finite numeric data`)
  }
  return value
}

function textParam<T extends string>(
  params: Readonly<Record<string, unknown>>,
  key: string,
): T {
  const value = params[key]
  if (typeof value !== 'string') throw new TypeError(`${key} must be text data`)
  return value as T
}

function expectedSceneForProblem(
  problem: Readonly<GeneratedApplicationProblemV1>,
): ApplicationVisualDiagramSceneV1 {
  const params = problem.params
  if (problem.familyId === 'g5-perimeter-boundary-rebuild') {
    return buildG5PerimeterBoundaryRebuildScene({
      width: numericParam(params, 'width'),
      height: numericParam(params, 'height'),
      notchWidth: numericParam(params, 'notchWidth'),
      notchHeight: numericParam(params, 'notchHeight'),
      rotation: numericParam(params, 'rotation') as G5PerimeterBoundaryRebuildParams['rotation'],
    })
  }
  if (problem.familyId === 'g5-area-composite-inverse') {
    return buildG5AreaCompositeInverseScene({
      rectangleWidth: numericParam(params, 'rectangleWidth'),
      rectangleHeight: numericParam(params, 'rectangleHeight'),
      squareSide: numericParam(params, 'squareSide'),
      attachmentPosition: numericParam(params, 'attachmentPosition') as G5AreaCompositeInverseParams['attachmentPosition'],
      totalArea: numericParam(params, 'totalArea'),
    })
  }
  if (problem.familyId === 'g5-area-overlap-reconstruction') {
    return buildG5AreaOverlapReconstructionScene({
      aOnly: numericParam(params, 'aOnly'),
      ab: numericParam(params, 'ab'),
      ac: numericParam(params, 'ac'),
      abc: numericParam(params, 'abc'),
      zeroPair: textParam<G5AreaOverlapReconstructionParams['zeroPair']>(params, 'zeroPair'),
      shapeArea: numericParam(params, 'shapeArea'),
      unionArea: numericParam(params, 'unionArea'),
      hubShape: textParam<G5AreaOverlapReconstructionParams['hubShape']>(params, 'hubShape'),
      upperShape: textParam<G5AreaOverlapReconstructionParams['upperShape']>(params, 'upperShape'),
      rightShape: textParam<G5AreaOverlapReconstructionParams['rightShape']>(params, 'rightShape'),
      knownPair: textParam<G5AreaOverlapReconstructionParams['knownPair']>(params, 'knownPair'),
      targetPair: textParam<G5AreaOverlapReconstructionParams['targetPair']>(params, 'targetPair'),
      knownOverlap: numericParam(params, 'knownOverlap'),
      targetOverlap: numericParam(params, 'targetOverlap'),
    })
  }
  throw new TypeError('unsupported Grade 5 geometry family')
}

function replayCanonicalProblem(
  problem: Readonly<GeneratedApplicationProblemV1>,
): GeneratedApplicationProblemV1 {
  const input = { seed: problem.seed, variantIndex: problem.variantIndex }
  if (problem.familyId === 'g5-perimeter-boundary-rebuild') {
    return generateG5PerimeterBoundaryRebuildProblem(input)
  }
  if (problem.familyId === 'g5-area-composite-inverse') {
    return generateG5AreaCompositeInverseProblem(input)
  }
  if (problem.familyId === 'g5-area-overlap-reconstruction') {
    return generateG5AreaOverlapReconstructionProblem(input)
  }
  throw new TypeError('unsupported Grade 5 geometry family')
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

function stableJson(value: unknown): string {
  return JSON.stringify(canonical(value))
}

function rejectUndeclaredKeys(
  actual: readonly { key: string }[],
  expected: readonly { key: string }[],
  collection: 'primitive' | 'label',
  issues: ApplicationVisualValidationIssue[],
): void {
  const expectedKeys = new Set(expected.map((entry) => entry.key))
  const actualKeys = new Set(actual.map((entry) => entry.key))
  actual.forEach((entry, index) => {
    if (!expectedKeys.has(entry.key)) {
      issue(
        issues,
        `undeclared_${collection}`,
        `scene.${collection}s[${index}]`,
        `${entry.key} is not declared by this problem instance`,
      )
    }
  })
  expected.forEach((entry) => {
    if (!actualKeys.has(entry.key)) {
      issue(
        issues,
        `missing_declared_${collection}`,
        `scene.${collection}s`,
        `${entry.key} is required by this problem instance`,
      )
    }
  })
}

function rejectUndeclaredConstraints(
  scene: ApplicationVisualDiagramSceneV1,
  expected: ApplicationVisualDiagramSceneV1,
  issues: ApplicationVisualValidationIssue[],
): void {
  const remaining = new Map<string, number>()
  expected.constraints.forEach((constraint) => {
    const signature = stableJson(constraint)
    remaining.set(signature, (remaining.get(signature) ?? 0) + 1)
  })
  scene.constraints.forEach((constraint, index) => {
    const signature = stableJson(constraint)
    const count = remaining.get(signature) ?? 0
    if (count === 0) {
      issue(
        issues,
        'undeclared_constraint',
        `scene.constraints[${index}]`,
        'constraint is not declared by this problem instance',
      )
      return
    }
    remaining.set(signature, count - 1)
  })
  if (Array.from(remaining.values()).some((count) => count > 0)) {
    issue(
      issues,
      'missing_declared_constraint',
      'scene.constraints',
      'the problem instance is missing a declared constraint',
    )
  }
}

function validateDeclaredParams(
  problem: Readonly<GeneratedApplicationProblemV1>,
  issues: ApplicationVisualValidationIssue[],
): void {
  const expectedKeys = new Set(DECLARED_PARAM_KEYS[problem.familyId] ?? [])
  const actualKeys = new Set(Object.keys(problem.params))
  actualKeys.forEach((key) => {
    if (!expectedKeys.has(key)) {
      issue(
        issues,
        'undeclared_grade5_geometry_param',
        `problem.params.${key}`,
        `${key} is not declared by this Grade 5 problem family`,
      )
    }
  })
  expectedKeys.forEach((key) => {
    if (!actualKeys.has(key)) {
      issue(
        issues,
        'missing_grade5_geometry_param',
        `problem.params.${key}`,
        `${key} is required by this Grade 5 problem family`,
      )
    }
  })
}

function naturalAnswer(value: number): string {
  const rounded = Math.round(value)
  if (!Number.isSafeInteger(rounded) || rounded <= 0 || !close(value, rounded)) {
    throw new TypeError('the measured model answer must be a positive safe integer')
  }
  return String(rounded)
}

function measuredAnswer(
  problem: Readonly<GeneratedApplicationProblemV1>,
  scene: ApplicationVisualDiagramSceneV1,
): string {
  const primitives = primitiveMap(scene)
  if (problem.familyId === 'g5-perimeter-boundary-rebuild') {
    const polygon = pointsOf(primitives.get('remaining-board'))
    if (!polygon) throw new TypeError('remaining-board polygon is required')
    return naturalAnswer(length(polygon, true))
  }
  if (problem.familyId === 'g5-area-composite-inverse') {
    const polygon = pointsOf(primitives.get('combined-shape'))
    if (!polygon) throw new TypeError('combined-shape polygon is required')
    return naturalAnswer(length(polygon, true))
  }
  const polygons = {
    A: pointsOf(primitives.get('shape-a')),
    B: pointsOf(primitives.get('shape-b')),
    C: pointsOf(primitives.get('shape-c')),
  }
  if (!polygons.A || !polygons.B || !polygons.C) {
    throw new TypeError('three overlap polygons are required')
  }
  const targetPair = textParam<'ab' | 'ac' | 'bc'>(problem.params, 'targetPair')
  if (!['ab', 'ac', 'bc'].includes(targetPair)) {
    throw new TypeError('targetPair is unsupported')
  }
  const measured = measureOverlapPolygons(
    polygons as Record<'A' | 'B' | 'C', ApplicationVisualPoint[]>,
  )
  return naturalAnswer(measured.atomicAreas[targetPair])
}

function immutableProvenance(problem: Readonly<GeneratedApplicationProblemV1>) {
  return {
    schemaVersion: problem.schemaVersion,
    instanceId: problem.instanceId,
    familyId: problem.familyId,
    generatorVersion: problem.generatorVersion,
    packId: problem.packId,
    packVersion: problem.packVersion,
    seed: problem.seed,
    variantIndex: problem.variantIndex,
    curriculumCodes: problem.curriculumCodes,
  }
}

function immutableVisualPolicy(problem: Readonly<GeneratedApplicationProblemV1>) {
  return {
    role: problem.visual.role,
    semantics: problem.visual.semantics,
    generatorId: problem.visual.generatorId,
    generatorVersion: problem.visual.generatorVersion,
    answerCritical: problem.visual.answerCritical,
  }
}

function validateProblemBinding(
  problem: Readonly<GeneratedApplicationProblemV1>,
  scene: ApplicationVisualDiagramSceneV1,
): ApplicationVisualValidationIssue[] {
  const issues: ApplicationVisualValidationIssue[] = []
  validateDeclaredParams(problem, issues)
  let canonicalProblem: GeneratedApplicationProblemV1
  let expected: ApplicationVisualDiagramSceneV1
  try {
    canonicalProblem = replayCanonicalProblem(problem)
    expected = expectedSceneForProblem(canonicalProblem)
  } catch {
    issue(
      issues,
      'invalid_grade5_geometry_params',
      'problem.params',
      'problem parameters do not define a supported Grade 5 quantitative model',
    )
    return issues
  }

  if (stableJson(problem.params) !== stableJson(canonicalProblem.params)) {
    issue(
      issues,
      'grade5_params_instance_mismatch',
      'problem.params',
      'problem parameters and generator provenance do not match family, seed, and variant',
    )
  }
  if (stableJson(immutableProvenance(problem)) !== stableJson(immutableProvenance(canonicalProblem))) {
    issue(
      issues,
      'grade5_problem_provenance_mismatch',
      'problem',
      'problem identity and provenance do not match its canonical Grade 5 generated instance',
    )
  }
  if (
    stableJson(immutableVisualPolicy(problem)) !==
    stableJson(immutableVisualPolicy(canonicalProblem))
  ) {
    issue(
      issues,
      'grade5_visual_policy_mismatch',
      'problem.visual',
      'visual policy does not match its canonical Grade 5 generated instance',
    )
  }

  rejectUndeclaredKeys(scene.primitives, expected.primitives, 'primitive', issues)
  rejectUndeclaredKeys(scene.labels, expected.labels, 'label', issues)
  rejectUndeclaredConstraints(scene, expected, issues)
  if (stableJson(scene) !== stableJson(expected)) {
    issue(
      issues,
      'grade5_scene_problem_mismatch',
      'visual.mathModel',
      'the quantitative scene does not exactly match this problem instance',
    )
  }

  try {
    const expectedAnswer = measuredAnswer(canonicalProblem, scene)
    if (problem.answer.format !== 'choice' || problem.answer.normalized !== expectedAnswer) {
      issue(
        issues,
        'grade5_answer_model_mismatch',
        'problem.answer.normalized',
        'the normalized answer does not close over the measured quantitative model',
      )
    }
  } catch {
    issue(
      issues,
      'grade5_answer_model_unmeasurable',
      'problem.answer.normalized',
      'the quantitative model cannot independently close the answer',
    )
  }
  return issues
}

function pointsOf(primitive: ApplicationVisualPrimitive | undefined): ApplicationVisualPoint[] | null {
  if (!primitive) return null
  if (primitive.kind === 'polygon' || primitive.kind === 'polyline') return primitive.points
  if (primitive.kind === 'line') {
    return [{ x: primitive.x1, y: primitive.y1 }, { x: primitive.x2, y: primitive.y2 }]
  }
  if (primitive.kind === 'rect') {
    return [
      { x: primitive.x, y: primitive.y },
      { x: primitive.x + primitive.width, y: primitive.y },
      { x: primitive.x + primitive.width, y: primitive.y + primitive.height },
      { x: primitive.x, y: primitive.y + primitive.height },
    ]
  }
  return null
}

function length(points: readonly ApplicationVisualPoint[], closed = false): number {
  const count = closed ? points.length : points.length - 1
  let total = 0
  for (let index = 0; index < count; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    total += Math.hypot(next.x - current.x, next.y - current.y)
  }
  return total
}

function polygonArea(points: readonly ApplicationVisualPoint[]): number {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]
    return sum + point.x * next.y - next.x * point.y
  }, 0)) / 2
}

function primitiveMap(scene: ApplicationVisualDiagramSceneV1) {
  return new Map(scene.primitives.map((primitive) => [primitive.key, primitive]))
}

function constraintExpected(
  scene: ApplicationVisualDiagramSceneV1,
  primitiveKey: string,
  kind: 'area' | 'segment-length',
): number | undefined {
  const constraint = scene.constraints.find(
    (entry) => entry.kind === kind && entry.primitiveKey === primitiveKey,
  )
  return constraint?.kind === kind ? constraint.expected : undefined
}

function validateBoundary(scene: ApplicationVisualDiagramSceneV1) {
  const issues: ApplicationVisualValidationIssue[] = []
  const primitives = primitiveMap(scene)
  const polygon = pointsOf(primitives.get('remaining-board'))
  if (!polygon || polygon.length !== 6) {
    issue(issues, 'invalid_boundary_polygon', 'scene.primitives', 'remaining board must be a six-edge corner-notch polygon')
    return issues
  }
  let perimeter = 0
  for (let index = 0; index < 6; index += 1) {
    const segment = pointsOf(primitives.get(`boundary-${index}`))
    if (!segment || segment.length !== 2) {
      issue(issues, 'missing_boundary_segment', 'scene.primitives', `boundary-${index} is required`)
      continue
    }
    if (
      !close(segment[0].x, polygon[index].x) ||
      !close(segment[0].y, polygon[index].y) ||
      !close(segment[1].x, polygon[(index + 1) % polygon.length].x) ||
      !close(segment[1].y, polygon[(index + 1) % polygon.length].y)
    ) {
      issue(issues, 'open_boundary', `scene.primitives.boundary-${index}`, 'boundary segments must form the polygon in order')
    }
    const dx = Math.abs(segment[1].x - segment[0].x)
    const dy = Math.abs(segment[1].y - segment[0].y)
    if (dx > EPSILON && dy > EPSILON) {
      issue(issues, 'non_orthogonal_boundary', `scene.primitives.boundary-${index}`, 'corner-notch boundary must be orthogonal')
    }
    perimeter += dx + dy
  }
  const width = constraintExpected(scene, 'boundary-4', 'segment-length')
  const height = constraintExpected(scene, 'boundary-5', 'segment-length')
  if (width === undefined || height === undefined || !close(perimeter, 2 * (width + height))) {
    issue(issues, 'boundary_reconstruction_mismatch', 'scene.constraints', 'measured boundary must equal twice the outer width plus height')
  }
  for (const key of ['cut-width', 'cut-height']) {
    const points = pointsOf(primitives.get(key))
    const expected = constraintExpected(scene, key, 'segment-length')
    if (!points || expected === undefined || !close(length(points), expected)) {
      issue(issues, 'cut_guide_mismatch', `scene.primitives.${key}`, 'cut guide must independently match its given length')
    }
  }
  return issues
}

function edgeLengths(points: readonly ApplicationVisualPoint[]) {
  return points.map((point, index) => Math.hypot(
    points[(index + 1) % points.length].x - point.x,
    points[(index + 1) % points.length].y - point.y,
  ))
}

function isRightAngledQuadrilateral(points: readonly ApplicationVisualPoint[]): boolean {
  if (points.length !== 4) return false
  return points.every((point, index) => {
    const previous = points[(index + points.length - 1) % points.length]
    const next = points[(index + 1) % points.length]
    const first = { x: previous.x - point.x, y: previous.y - point.y }
    const second = { x: next.x - point.x, y: next.y - point.y }
    return Math.abs(first.x * second.x + first.y * second.y) <= EPSILON
  })
}

function collinearOverlap(
  firstStart: ApplicationVisualPoint,
  firstEnd: ApplicationVisualPoint,
  secondStart: ApplicationVisualPoint,
  secondEnd: ApplicationVisualPoint,
): number {
  const firstVertical = Math.abs(firstStart.x - firstEnd.x) <= EPSILON
  const secondVertical = Math.abs(secondStart.x - secondEnd.x) <= EPSILON
  if (firstVertical !== secondVertical) return 0
  if (firstVertical) {
    if (!close(firstStart.x, secondStart.x)) return 0
    return Math.max(0, Math.min(
      Math.max(firstStart.y, firstEnd.y),
      Math.max(secondStart.y, secondEnd.y),
    ) -
      Math.max(Math.min(firstStart.y, firstEnd.y), Math.min(secondStart.y, secondEnd.y)))
  }
  if (!close(firstStart.y, firstEnd.y) || Math.abs(firstStart.y - firstEnd.y) > EPSILON || Math.abs(secondStart.y - secondEnd.y) > EPSILON) return 0
  return Math.max(0, Math.min(Math.max(firstStart.x, firstEnd.x), Math.max(secondStart.x, secondEnd.x)) -
    Math.max(Math.min(firstStart.x, firstEnd.x), Math.min(secondStart.x, secondEnd.x)))
}

function sharedBoundary(first: readonly ApplicationVisualPoint[], second: readonly ApplicationVisualPoint[]): number {
  let total = 0
  first.forEach((start, firstIndex) => {
    const end = first[(firstIndex + 1) % first.length]
    second.forEach((otherStart, secondIndex) => {
      total += collinearOverlap(start, end, otherStart, second[(secondIndex + 1) % second.length])
    })
  })
  return total
}

function validateComposite(scene: ApplicationVisualDiagramSceneV1) {
  const issues: ApplicationVisualValidationIssue[] = []
  const primitives = primitiveMap(scene)
  const square = pointsOf(primitives.get('square'))
  const rectangle = pointsOf(primitives.get('rectangle'))
  const combined = pointsOf(primitives.get('combined-shape'))
  if (!square || !rectangle || !combined) {
    issue(issues, 'missing_composite_polygon', 'scene.primitives', 'square, rectangle, and combined boundary are required')
    return issues
  }
  const squareLengths = edgeLengths(square)
  if (!isRightAngledQuadrilateral(square) || squareLengths.some((value) => !close(value, squareLengths[0]))) {
    issue(issues, 'invalid_named_square', 'scene.primitives.square', 'the named square must have four right angles and four equal sides')
  }
  const rectangleLengths = edgeLengths(rectangle)
  if (
    !isRightAngledQuadrilateral(rectangle) ||
    !close(rectangleLengths[0], rectangleLengths[2]) ||
    !close(rectangleLengths[1], rectangleLengths[3])
  ) {
    issue(issues, 'invalid_named_rectangle', 'scene.primitives.rectangle', 'the named rectangle must have four right angles and equal opposite sides')
  }
  const shared = sharedBoundary(square, rectangle)
  const attachedHeight = constraintExpected(scene, 'rectangle-height', 'segment-length')
  if (attachedHeight === undefined || !close(shared, attachedHeight)) {
    issue(issues, 'partial_edge_attachment', 'scene.primitives', 'the rectangle full height must be the shared attachment edge')
  }
  const addedArea = polygonArea(square) + polygonArea(rectangle)
  if (!close(polygonArea(combined), addedArea)) {
    issue(issues, 'composite_area_mismatch', 'scene.primitives.combined-shape', 'combined polygon area must equal both component areas')
  }
  const exposed = length(square, true) + length(rectangle, true) - 2 * shared
  if (!close(length(combined, true), exposed)) {
    issue(issues, 'exposed_perimeter_mismatch', 'scene.primitives.combined-shape', 'combined boundary must match independently exposed edges')
  }
  return issues
}

function numericText(text: string | undefined): number | undefined {
  if (!text) return undefined
  const matches = Array.from(text.matchAll(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s*cm)/g))
  return matches.length ? Number(matches[matches.length - 1][1]) : undefined
}

function membership(point: ApplicationVisualPoint, polygons: Record<'A' | 'B' | 'C', ApplicationVisualPoint[]>): string {
  return (['A', 'B', 'C'] as const)
    .filter((shape) => pointInPolygon(point, polygons[shape], false))
    .map((shape) => shape.toLowerCase())
    .join('')
}

function validateOverlap(scene: ApplicationVisualDiagramSceneV1) {
  const issues: ApplicationVisualValidationIssue[] = []
  const primitives = primitiveMap(scene)
  const polygons = {
    A: pointsOf(primitives.get('shape-a')),
    B: pointsOf(primitives.get('shape-b')),
    C: pointsOf(primitives.get('shape-c')),
  }
  if (!polygons.A || !polygons.B || !polygons.C) {
    issue(issues, 'missing_overlap_shape', 'scene.primitives', 'three closed overlap polygons are required')
    return issues
  }
  let measured: ReturnType<typeof measureOverlapPolygons>
  try {
    measured = measureOverlapPolygons(polygons as Record<'A' | 'B' | 'C', ApplicationVisualPoint[]>)
  } catch {
    issue(issues, 'unsupported_overlap_topology', 'scene.primitives', 'overlap polygons must be convex and independently measurable')
    return issues
  }
  const knownLabel = scene.labels.find((label) => /^region-(?:ab|ac|bc)-label$/.test(label.key))
  const targetLabel = scene.labels.find((label) => /^region-(?:ab|ac|bc)-answer-label$/.test(label.key))
  const tripleLabel = scene.labels.find((label) => label.key === 'region-abc-label')
  const knownPair = knownLabel?.key.match(/^region-(ab|ac|bc)-label$/)?.[1] as 'ab' | 'ac' | 'bc' | undefined
  const targetPair = targetLabel?.key.match(/^region-(ab|ac|bc)-answer-label$/)?.[1] as 'ab' | 'ac' | 'bc' | undefined
  const zeroPair = (['ab', 'ac', 'bc'] as const).find((pair) => pair !== knownPair && pair !== targetPair)
  const knownValue = numericText(knownLabel?.content.before?.text)
  const targetValue = numericText(targetLabel?.content.after?.text)
  const tripleValue = numericText(tripleLabel?.content.before?.text)
  if (!knownPair || !targetPair || !zeroPair || knownValue === undefined || targetValue === undefined || tripleValue === undefined) {
    issue(issues, 'incomplete_overlap_labels', 'scene.labels', 'known, target, and triple region labels are required')
    return issues
  }
  if (
    !close(measured.atomicAreas[knownPair], knownValue) ||
    !close(measured.atomicAreas[targetPair], targetValue) ||
    !close(measured.atomicAreas.abc, tripleValue) ||
    !close(measured.atomicAreas[zeroPair], 0)
  ) {
    issue(issues, 'overlap_measurement_mismatch', 'scene.primitives', 'clipped atomic regions must match every declared area and exact zero topology')
  }
  if (scene.labels.some((label) => {
    const pair = label.key.match(/^region-(ab|ac|bc)-(?:answer-)?label$/)?.[1]
    return pair === zeroPair
  })) {
    issue(issues, 'zero_region_serialized', 'scene.labels', 'the exact zero pair-only region must be absent')
  }
  for (const label of scene.labels) {
    const shapeMatch = label.key.match(/^shape-([abc])-identifier$/)
    const pairMatch = label.key.match(/^region-(ab|ac|bc)-(?:answer-)?label$/)
    const expectedMembership = shapeMatch?.[1] ?? pairMatch?.[1] ?? (label.key === 'region-abc-label' ? 'abc' : undefined)
    if (expectedMembership && membership({ x: label.x, y: label.y }, polygons as Record<'A' | 'B' | 'C', ApplicationVisualPoint[]>) !== expectedMembership) {
      issue(issues, 'label_outside_atomic_region', `scene.labels.${label.key}`, 'label anchor must be strictly inside its declared atomic region')
    }
  }
  const shapeArea = constraintExpected(scene, 'shape-a', 'area')
  if (
    shapeArea === undefined ||
    !close(measured.shapeAreas.A, shapeArea) ||
    !close(measured.shapeAreas.B, shapeArea) ||
    !close(measured.shapeAreas.C, shapeArea)
  ) {
    issue(issues, 'unequal_shape_area', 'scene.constraints', 'all three measured shape areas must equal the declared total')
  }
  const descriptionNumbers = Array.from(
    (scene.description?.before?.text ?? '').matchAll(/(\d+(?:\.\d+)?)\s*cm²/g),
  ).map((match) => Number(match[1]))
  const unionArea = descriptionNumbers[1]
  if (unionArea === undefined || !close(measured.unionArea, unionArea)) {
    issue(issues, 'union_area_mismatch', 'scene.description', 'independently measured union area must match the given whole')
  }
  return issues
}

export function validateGrade5ApplicationGeometryProblem(
  problem: Readonly<GeneratedApplicationProblemV1>,
  scene: Readonly<ApplicationVisualSceneV1>,
): readonly ApplicationVisualValidationIssue[] {
  const familyId = problem.familyId
  if (!SUPPORTED_FAMILIES.has(familyId)) {
    return [{
      code: 'unsupported_grade5_geometry_family',
      path: 'problem.familyId',
      message: 'Grade 5 quantitative geometry family is not registered by this wrapper',
    }]
  }
  if (scene.surface !== 'diagram' || scene.semantics !== 'quantitative') {
    return [{
      code: 'invalid_grade5_geometry_surface',
      path: 'scene',
      message: 'Grade 5 quantitative geometry requires a quantitative diagram',
    }]
  }
  const issues = validateProblemBinding(problem, scene)
  if (familyId === 'g5-perimeter-boundary-rebuild') issues.push(...validateBoundary(scene))
  else if (familyId === 'g5-area-composite-inverse') issues.push(...validateComposite(scene))
  else issues.push(...validateOverlap(scene))
  return issues
}
