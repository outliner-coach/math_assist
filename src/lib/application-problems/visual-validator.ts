import type { GeneratedApplicationVisualV1 } from './contracts'
import {
  ApplicationVisualModelError,
  parseApplicationVisualSceneV1,
  type ApplicationVisualContent,
  type ApplicationVisualDiagramConstraint,
  type ApplicationVisualDiagramSceneV1,
  type ApplicationVisualPoint,
  type ApplicationVisualPrimitive,
  type ApplicationVisualSceneV1,
  type ApplicationVisualTableAddress,
  type ApplicationVisualTableSceneV1,
} from './visual-model'

export interface ApplicationVisualValidationIssue {
  code: string
  path: string
  message: string
}

declare const validatedSceneBrand: unique symbol
export type ValidatedApplicationVisualScene = ApplicationVisualSceneV1 & {
  readonly [validatedSceneBrand]: true
}

export type ApplicationVisualValidationResult =
  | { ok: true; scene: ValidatedApplicationVisualScene }
  | { ok: false; issues: ApplicationVisualValidationIssue[] }

export type ApplicationVisualFamilyValidator = (
  scene: Readonly<ApplicationVisualSceneV1>,
) => readonly ApplicationVisualValidationIssue[]

export interface ResolveApplicationVisualOptions {
  familyValidator?: ApplicationVisualFamilyValidator
}

export type ApplicationVisualResolution =
  | { status: 'none' }
  | { status: 'ready'; scene: ValidatedApplicationVisualScene }
  | {
      status: 'omitted'
      role: 'support'
      semantics?: GeneratedApplicationVisualV1['semantics']
      issues: ApplicationVisualValidationIssue[]
    }
  | {
      status: 'blocked'
      role: 'required'
      semantics?: GeneratedApplicationVisualV1['semantics']
      issues: ApplicationVisualValidationIssue[]
    }

const DEFAULT_EPSILON = 1e-9

function issue(
  issues: ApplicationVisualValidationIssue[],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message })
}

function nearlyEqual(actual: number, expected: number, epsilon = DEFAULT_EPSILON): boolean {
  const tolerance = Math.max(epsilon, epsilon * Math.max(Math.abs(actual), Math.abs(expected), 1))
  return Math.abs(actual - expected) <= tolerance
}

function distance(first: ApplicationVisualPoint, second: ApplicationVisualPoint): number {
  return Math.hypot(second.x - first.x, second.y - first.y)
}

function linePoints(primitive: ApplicationVisualPrimitive): ApplicationVisualPoint[] | null {
  if (primitive.kind === 'line') {
    return [
      { x: primitive.x1, y: primitive.y1 },
      { x: primitive.x2, y: primitive.y2 },
    ]
  }
  if (primitive.kind === 'polyline') return primitive.points
  return null
}

function primitiveLength(primitive: ApplicationVisualPrimitive): number | null {
  const points = linePoints(primitive)
  if (!points) return null
  let total = 0
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1], points[index])
  }
  return total
}

function polygonArea(points: readonly ApplicationVisualPoint[]): number {
  let doubled = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    doubled += current.x * next.y - next.x * current.y
  }
  return Math.abs(doubled) / 2
}

function primitiveArea(primitive: ApplicationVisualPrimitive): number | null {
  if (primitive.kind === 'rect') return primitive.width * primitive.height
  if (primitive.kind === 'circle') return Math.PI * primitive.radius * primitive.radius
  if (primitive.kind === 'polygon') return polygonArea(primitive.points)
  return null
}

function primitivePoints(primitive: ApplicationVisualPrimitive): ApplicationVisualPoint[] {
  if (primitive.kind === 'line') {
    return [
      { x: primitive.x1, y: primitive.y1 },
      { x: primitive.x2, y: primitive.y2 },
    ]
  }
  if (primitive.kind === 'rect') {
    return [
      { x: primitive.x, y: primitive.y },
      { x: primitive.x + primitive.width, y: primitive.y },
      { x: primitive.x + primitive.width, y: primitive.y + primitive.height },
      { x: primitive.x, y: primitive.y + primitive.height },
    ]
  }
  if (primitive.kind === 'circle') {
    return [
      { x: primitive.cx - primitive.radius, y: primitive.cy - primitive.radius },
      { x: primitive.cx + primitive.radius, y: primitive.cy + primitive.radius },
    ]
  }
  return primitive.points
}

function cross(
  first: ApplicationVisualPoint,
  second: ApplicationVisualPoint,
  third: ApplicationVisualPoint,
): number {
  return (second.x - first.x) * (third.y - first.y) - (second.y - first.y) * (third.x - first.x)
}

function pointOnSegment(
  point: ApplicationVisualPoint,
  start: ApplicationVisualPoint,
  end: ApplicationVisualPoint,
): boolean {
  if (Math.abs(cross(start, end, point)) > DEFAULT_EPSILON) return false
  return (
    point.x >= Math.min(start.x, end.x) - DEFAULT_EPSILON &&
    point.x <= Math.max(start.x, end.x) + DEFAULT_EPSILON &&
    point.y >= Math.min(start.y, end.y) - DEFAULT_EPSILON &&
    point.y <= Math.max(start.y, end.y) + DEFAULT_EPSILON
  )
}

function pointInPolygon(
  point: ApplicationVisualPoint,
  polygon: readonly ApplicationVisualPoint[],
  includeBoundary: boolean,
): boolean {
  let inside = false
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const first = polygon[previous]
    const second = polygon[current]
    if (pointOnSegment(point, first, second)) return includeBoundary
    const crosses =
      first.y > point.y !== second.y > point.y &&
      point.x < ((second.x - first.x) * (point.y - first.y)) / (second.y - first.y) + first.x
    if (crosses) inside = !inside
  }
  return inside
}

function containsPoint(primitive: ApplicationVisualPrimitive, point: ApplicationVisualPoint): boolean {
  if (primitive.kind === 'line') {
    return pointOnSegment(
      point,
      { x: primitive.x1, y: primitive.y1 },
      { x: primitive.x2, y: primitive.y2 },
    )
  }
  if (primitive.kind === 'polyline') {
    return primitive.points.slice(1).some((end, index) =>
      pointOnSegment(point, primitive.points[index], end),
    )
  }
  if (primitive.kind === 'rect') {
    return (
      point.x >= primitive.x - DEFAULT_EPSILON &&
      point.x <= primitive.x + primitive.width + DEFAULT_EPSILON &&
      point.y >= primitive.y - DEFAULT_EPSILON &&
      point.y <= primitive.y + primitive.height + DEFAULT_EPSILON
    )
  }
  if (primitive.kind === 'circle') {
    return distance(point, { x: primitive.cx, y: primitive.cy }) <= primitive.radius + DEFAULT_EPSILON
  }
  return pointInPolygon(point, primitive.points, true)
}

type SegmentIntersection = 'none' | 'touch' | 'proper'

function segmentIntersection(
  a: ApplicationVisualPoint,
  b: ApplicationVisualPoint,
  c: ApplicationVisualPoint,
  d: ApplicationVisualPoint,
): SegmentIntersection {
  const abC = cross(a, b, c)
  const abD = cross(a, b, d)
  const cdA = cross(c, d, a)
  const cdB = cross(c, d, b)
  if (
    ((abC > DEFAULT_EPSILON && abD < -DEFAULT_EPSILON) ||
      (abC < -DEFAULT_EPSILON && abD > DEFAULT_EPSILON)) &&
    ((cdA > DEFAULT_EPSILON && cdB < -DEFAULT_EPSILON) ||
      (cdA < -DEFAULT_EPSILON && cdB > DEFAULT_EPSILON))
  ) {
    return 'proper'
  }
  if (
    pointOnSegment(c, a, b) ||
    pointOnSegment(d, a, b) ||
    pointOnSegment(a, c, d) ||
    pointOnSegment(b, c, d)
  ) {
    return 'touch'
  }
  return 'none'
}

function polygonEdges(points: readonly ApplicationVisualPoint[]) {
  return points.map((start, index) => ({ start, end: points[(index + 1) % points.length] }))
}

function validatePrimitiveShape(
  primitive: ApplicationVisualPrimitive,
  path: string,
  issues: ApplicationVisualValidationIssue[],
): void {
  const points = linePoints(primitive)
  if (points) {
    for (let index = 1; index < points.length; index += 1) {
      if (distance(points[index - 1], points[index]) <= DEFAULT_EPSILON) {
        issue(issues, 'zero_geometry', path, `${primitive.key} contains a zero-length segment`)
      }
    }
  }
  if (primitive.kind !== 'polygon') return
  const edges = polygonEdges(primitive.points)
  edges.forEach((edge) => {
    if (distance(edge.start, edge.end) <= DEFAULT_EPSILON) {
      issue(issues, 'zero_geometry', path, `${primitive.key} contains a zero-length edge`)
    }
  })
  for (let first = 0; first < edges.length; first += 1) {
    for (let second = first + 1; second < edges.length; second += 1) {
      const adjacent =
        second === first + 1 ||
        (first === 0 && second === edges.length - 1)
      if (adjacent) continue
      if (
        segmentIntersection(
          edges[first].start,
          edges[first].end,
          edges[second].start,
          edges[second].end,
        ) !== 'none'
      ) {
        issue(
          issues,
          'invalid_polygon',
          path,
          `${primitive.key} must be a simple non-self-intersecting polygon`,
        )
        return
      }
    }
  }
}

function topologyHolds(
  first: ApplicationVisualPrimitive,
  second: ApplicationVisualPrimitive,
  relation: 'disjoint' | 'touching' | 'overlap' | 'contains',
): boolean | null {
  if (
    (first.kind !== 'rect' && first.kind !== 'polygon') ||
    (second.kind !== 'rect' && second.kind !== 'polygon')
  ) {
    return null
  }
  if (first.kind === 'rect' && second.kind === 'rect') {
    const horizontalOverlap =
      Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x)
    const verticalOverlap =
      Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y)
    const overlap = horizontalOverlap > DEFAULT_EPSILON && verticalOverlap > DEFAULT_EPSILON
    const touching =
      !overlap &&
      horizontalOverlap >= -DEFAULT_EPSILON &&
      verticalOverlap >= -DEFAULT_EPSILON
    const disjoint = horizontalOverlap < -DEFAULT_EPSILON || verticalOverlap < -DEFAULT_EPSILON
    const contains =
      second.x >= first.x - DEFAULT_EPSILON &&
      second.y >= first.y - DEFAULT_EPSILON &&
      second.x + second.width <= first.x + first.width + DEFAULT_EPSILON &&
      second.y + second.height <= first.y + first.height + DEFAULT_EPSILON
    return { disjoint, touching, overlap, contains }[relation]
  }
  const firstPolygon = primitivePoints(first)
  const secondPolygon = primitivePoints(second)
  let hasTouch = false
  let hasProper = false
  for (const firstEdge of polygonEdges(firstPolygon)) {
    for (const secondEdge of polygonEdges(secondPolygon)) {
      const intersection = segmentIntersection(
        firstEdge.start,
        firstEdge.end,
        secondEdge.start,
        secondEdge.end,
      )
      if (intersection === 'proper') hasProper = true
      if (intersection === 'touch') hasTouch = true
    }
  }
  const secondStrictlyInsideFirst = secondPolygon.some((point) =>
    pointInPolygon(point, firstPolygon, false),
  )
  const firstStrictlyInsideSecond = firstPolygon.some((point) =>
    pointInPolygon(point, secondPolygon, false),
  )
  const overlap = hasProper || secondStrictlyInsideFirst || firstStrictlyInsideSecond
  const touching = hasTouch && !overlap
  const disjoint = !hasProper && !hasTouch && !secondStrictlyInsideFirst && !firstStrictlyInsideSecond
  const contains = secondPolygon.every((point) => pointInPolygon(point, firstPolygon, true))
  return { disjoint, touching, overlap, contains }[relation]
}

function validateContent(
  content: ApplicationVisualContent,
  semantics: ApplicationVisualSceneV1['semantics'],
  path: string,
  issues: ApplicationVisualValidationIssue[],
): void {
  if (semantics === 'decorative' && content.after) {
    issue(
      issues,
      'decorative_answer_content',
      `${path}.after`,
      'decorative visuals cannot contain answer-only content',
    )
  }
}

function validateDiagram(
  scene: ApplicationVisualDiagramSceneV1,
  issues: ApplicationVisualValidationIssue[],
): void {
  if (scene.viewBox.width <= 0 || scene.viewBox.height <= 0) {
    issue(issues, 'invalid_view_box', 'scene.viewBox', 'viewBox dimensions must be positive')
  }
  if (scene.scale.x <= 0 || scene.scale.y <= 0 || !nearlyEqual(scene.scale.x, scene.scale.y)) {
    issue(issues, 'non_uniform_scale', 'scene.scale', 'diagram scale must be positive and uniform')
  }
  if (scene.description) validateContent(scene.description, scene.semantics, 'scene.description', issues)

  const primitives = new Map<string, ApplicationVisualPrimitive>()
  scene.primitives.forEach((primitive, index) => {
    const path = `scene.primitives[${index}]`
    if (primitives.has(primitive.key)) {
      issue(issues, 'duplicate_reference', `${path}.key`, `duplicate primitive ${primitive.key}`)
    } else {
      primitives.set(primitive.key, primitive)
    }
    const points = primitivePoints(primitive)
    if (
      points.some(
        (point) =>
          point.x < -DEFAULT_EPSILON ||
          point.x > scene.viewBox.width + DEFAULT_EPSILON ||
          point.y < -DEFAULT_EPSILON ||
          point.y > scene.viewBox.height + DEFAULT_EPSILON,
      )
    ) {
      issue(issues, 'geometry_outside_view_box', path, `${primitive.key} is outside the viewBox`)
    }
    const length = primitiveLength(primitive)
    const area = primitiveArea(primitive)
    if ((length !== null && length <= DEFAULT_EPSILON) || (area !== null && area <= DEFAULT_EPSILON)) {
      issue(issues, 'zero_geometry', path, `${primitive.key} must not represent zero geometry`)
    }
    validatePrimitiveShape(primitive, path, issues)
    if (primitive.emphasis === 'answer' && scene.semantics === 'decorative') {
      issue(issues, 'decorative_answer_emphasis', path, 'decorative visuals cannot emphasize answers')
    }
    if (
      scene.semantics === 'decorative' &&
      (primitive.disclosure === 'solution' || primitive.disclosure === 'intermediate')
    ) {
      issue(
        issues,
        'decorative_answer_geometry',
        path,
        'decorative visuals cannot contain answer-only geometry',
      )
    }
  })

  const labels = new Set<string>()
  scene.labels.forEach((label, index) => {
    const path = `scene.labels[${index}]`
    if (labels.has(label.key)) {
      issue(issues, 'duplicate_reference', `${path}.key`, `duplicate label ${label.key}`)
    }
    labels.add(label.key)
    validateContent(label.content, scene.semantics, `${path}.content`, issues)
    if (
      label.x < -DEFAULT_EPSILON ||
      label.x > scene.viewBox.width + DEFAULT_EPSILON ||
      label.y < -DEFAULT_EPSILON ||
      label.y > scene.viewBox.height + DEFAULT_EPSILON
    ) {
      issue(issues, 'label_outside_view_box', path, `${label.key} is outside the viewBox`)
    }
    if (label.targetKey) {
      const target = primitives.get(label.targetKey)
      if (!target) {
        issue(issues, 'unknown_reference', `${path}.targetKey`, `unknown target ${label.targetKey}`)
      } else {
        if (!containsPoint(target, { x: label.x, y: label.y })) {
          issue(
            issues,
            'label_outside_target',
            path,
            `${label.key} must be located inside its target`,
          )
        }
        if (
          label.content.before &&
          (target.disclosure === 'solution' || target.disclosure === 'intermediate')
        ) {
          issue(
            issues,
            'disclosure_mismatch',
            path,
            'public labels cannot target answer-only geometry',
          )
        }
      }
    }
  })

  if (scene.semantics === 'decorative' && scene.constraints.length > 0) {
    issue(
      issues,
      'decorative_math_constraint',
      'scene.constraints',
      'decorative visuals cannot contain mathematical constraints',
    )
  }
  if (scene.semantics === 'quantitative' && scene.constraints.length === 0) {
    issue(
      issues,
      'quantitative_without_constraints',
      'scene.constraints',
      'quantitative diagrams need independently checkable constraints',
    )
  }

  scene.constraints.forEach((constraint, index) => {
    const path = `scene.constraints[${index}]`
    if (
      scene.semantics !== 'quantitative' &&
      constraint.kind !== 'topology'
    ) {
      issue(
        issues,
        'numeric_constraint_requires_quantitative_scene',
        path,
        'numeric constraints require quantitative semantics',
      )
    }
    validateDiagramConstraint(constraint, primitives, path, issues)
  })
}

function validateDiagramConstraint(
  constraint: ApplicationVisualDiagramConstraint,
  primitives: ReadonlyMap<string, ApplicationVisualPrimitive>,
  path: string,
  issues: ApplicationVisualValidationIssue[],
): void {
  if (constraint.kind === 'segment-length' || constraint.kind === 'area') {
    const primitive = primitives.get(constraint.primitiveKey)
    if (!primitive) {
      issue(issues, 'unknown_reference', `${path}.primitiveKey`, 'constraint target is missing')
      return
    }
    const actual =
      constraint.kind === 'segment-length' ? primitiveLength(primitive) : primitiveArea(primitive)
    if (actual === null) {
      issue(issues, 'unsupported_measurement', path, 'primitive does not support this measurement')
    } else if (!nearlyEqual(actual, constraint.expected, constraint.epsilon)) {
      issue(issues, 'measurement_mismatch', path, 'declared value does not match measured geometry')
    }
    return
  }
  if (constraint.kind === 'ratio') {
    const numerator = primitives.get(constraint.numeratorKey)
    const denominator = primitives.get(constraint.denominatorKey)
    if (!numerator || !denominator) {
      issue(issues, 'unknown_reference', path, 'ratio constraint references missing geometry')
      return
    }
    const numeratorValue =
      constraint.metric === 'length' ? primitiveLength(numerator) : primitiveArea(numerator)
    const denominatorValue =
      constraint.metric === 'length' ? primitiveLength(denominator) : primitiveArea(denominator)
    if (numeratorValue === null || denominatorValue === null || denominatorValue <= DEFAULT_EPSILON) {
      issue(issues, 'unsupported_measurement', path, 'ratio operands are not measurable')
    } else if (!nearlyEqual(numeratorValue / denominatorValue, constraint.expected, constraint.epsilon)) {
      issue(issues, 'ratio_mismatch', path, 'declared ratio does not match measured geometry')
    }
    return
  }
  const first = primitives.get(constraint.firstKey)
  const second = primitives.get(constraint.secondKey)
  if (!first || !second) {
    issue(issues, 'unknown_reference', path, 'topology constraint references missing geometry')
    return
  }
  const holds = topologyHolds(first, second, constraint.relation)
  if (holds === null) {
    issue(issues, 'unsupported_topology', path, 'topology is only supported for rectangles and polygons')
  } else if (!holds) {
    issue(issues, 'topology_mismatch', path, 'declared topology does not match geometry')
  }
}

function tableCell(
  scene: ApplicationVisualTableSceneV1,
  address: ApplicationVisualTableAddress,
): ApplicationVisualTableSceneV1['rows'][number]['cells'][number] | undefined {
  return scene.rows.find((row) => row.key === address.rowKey)?.cells[address.columnIndex]
}

function validateTable(
  scene: ApplicationVisualTableSceneV1,
  issues: ApplicationVisualValidationIssue[],
): void {
  validateContent(scene.caption, scene.semantics, 'scene.caption', issues)
  scene.columns.forEach((column, index) =>
    validateContent(column, scene.semantics, `scene.columns[${index}]`, issues),
  )
  const rowKeys = new Set<string>()
  scene.rows.forEach((row, rowIndex) => {
    if (rowKeys.has(row.key)) {
      issue(issues, 'duplicate_reference', `scene.rows[${rowIndex}].key`, `duplicate row ${row.key}`)
    }
    rowKeys.add(row.key)
    if (row.cells.length !== scene.columns.length) {
      issue(
        issues,
        'table_dimension_mismatch',
        `scene.rows[${rowIndex}].cells`,
        'row and column counts must match',
      )
    }
    row.cells.forEach((cell, cellIndex) => {
      validateContent(cell, scene.semantics, `scene.rows[${rowIndex}].cells[${cellIndex}]`, issues)
      if (scene.semantics === 'decorative' && cell.numericValue !== undefined) {
        issue(
          issues,
          'decorative_numeric_value',
          `scene.rows[${rowIndex}].cells[${cellIndex}].numericValue`,
          'decorative tables cannot contain mathematical values',
        )
      }
    })
  })
  if (scene.semantics === 'decorative' && scene.constraints.length > 0) {
    issue(issues, 'decorative_math_constraint', 'scene.constraints', 'decorative tables cannot claim ratios')
  }
  if (scene.semantics === 'quantitative' && scene.constraints.length === 0) {
    issue(
      issues,
      'quantitative_without_constraints',
      'scene.constraints',
      'quantitative tables need independently checkable constraints',
    )
  }
  scene.constraints.forEach((constraint, index) => {
    const path = `scene.constraints[${index}]`
    if (scene.semantics !== 'quantitative') {
      issue(
        issues,
        'numeric_constraint_requires_quantitative_scene',
        path,
        'table ratios require quantitative semantics',
      )
    }
    const numerator = tableCell(scene, constraint.numerator)
    const denominator = tableCell(scene, constraint.denominator)
    if (!numerator || !denominator) {
      issue(issues, 'unknown_reference', path, 'table ratio references a missing cell')
      return
    }
    if (
      numerator.numericValue === undefined ||
      denominator.numericValue === undefined ||
      Math.abs(denominator.numericValue) <= DEFAULT_EPSILON
    ) {
      issue(issues, 'unsupported_measurement', path, 'table ratio cells need numeric values')
      return
    }
    if (
      !nearlyEqual(
        numerator.numericValue / denominator.numericValue,
        constraint.expected,
        constraint.epsilon,
      )
    ) {
      issue(issues, 'ratio_mismatch', path, 'declared table ratio does not match cell values')
    }
  })
}

export function validateApplicationVisualScene(
  scene: ApplicationVisualSceneV1,
): ApplicationVisualValidationResult {
  const issues: ApplicationVisualValidationIssue[] = []
  if (scene.surface === 'diagram') validateDiagram(scene, issues)
  else validateTable(scene, issues)
  if (issues.length > 0) return { ok: false, issues }
  return { ok: true, scene: scene as ValidatedApplicationVisualScene }
}

function blockedOrOmitted(
  visual: GeneratedApplicationVisualV1,
  issues: ApplicationVisualValidationIssue[],
): ApplicationVisualResolution {
  if (visual.role === 'support') {
    return { status: 'omitted', role: 'support', semantics: visual.semantics, issues }
  }
  return { status: 'blocked', role: 'required', semantics: visual.semantics, issues }
}

export function resolveApplicationVisual(
  visual: GeneratedApplicationVisualV1,
  options: ResolveApplicationVisualOptions = {},
): ApplicationVisualResolution {
  if (visual.role === 'none') return { status: 'none' }
  const policyIssues: ApplicationVisualValidationIssue[] = []
  if (!visual.generatorId || !Number.isSafeInteger(visual.generatorVersion) || (visual.generatorVersion ?? 0) < 1) {
    issue(
      policyIssues,
      'invalid_visual_generator',
      'visual.generatorId',
      'renderable visuals need a stable generator and positive version',
    )
  }
  if (visual.role === 'required' && visual.answerCritical !== true) {
    issue(
      policyIssues,
      'required_visual_not_answer_critical',
      'visual.answerCritical',
      'required visuals must be answer-critical',
    )
  }
  if (visual.role === 'support' && visual.answerCritical === true) {
    issue(
      policyIssues,
      'support_visual_is_answer_critical',
      'visual.answerCritical',
      'support visuals must remain optional',
    )
  }
  if (policyIssues.length > 0) return blockedOrOmitted(visual, policyIssues)
  if (visual.mathModel === undefined) {
    return blockedOrOmitted(visual, [
      { code: 'missing_scene', path: 'visual.mathModel', message: 'visual scene is missing' },
    ])
  }

  let scene: ApplicationVisualSceneV1
  try {
    scene = parseApplicationVisualSceneV1(visual.mathModel)
  } catch (error) {
    const issues =
      error instanceof ApplicationVisualModelError
        ? error.issues
        : [{ code: 'invalid_scene', path: 'visual.mathModel', message: 'visual scene is invalid' }]
    return blockedOrOmitted(visual, issues)
  }
  const issues: ApplicationVisualValidationIssue[] = []
  if (scene.semantics !== visual.semantics) {
    issue(
      issues,
      'semantics_mismatch',
      'visual.semantics',
      'visual policy and scene semantics must match',
    )
  }
  const common = validateApplicationVisualScene(scene)
  if (!common.ok) issues.push(...common.issues)
  if (options.familyValidator) {
    try {
      issues.push(...options.familyValidator(scene))
    } catch {
      issue(
        issues,
        'family_validator_failed',
        'visual.mathModel',
        'family visual validation did not complete',
      )
    }
  }
  if (issues.length > 0) return blockedOrOmitted(visual, issues)
  return { status: 'ready', scene: scene as ValidatedApplicationVisualScene }
}

export function createApplicationVisualResolver(
  validators: Readonly<Record<string, ApplicationVisualFamilyValidator>>,
): (visual: GeneratedApplicationVisualV1) => ApplicationVisualResolution {
  return (visual) => {
    if (visual.role === 'none') return { status: 'none' }
    const registered = visual.generatorId ? validators[visual.generatorId] : undefined
    return resolveApplicationVisual(visual, {
      familyValidator:
        registered ??
        (() => [
          {
            code: 'unregistered_family_validator',
            path: 'visual.generatorId',
            message: 'visual generator has no registered family validator',
          },
        ]),
    })
  }
}
