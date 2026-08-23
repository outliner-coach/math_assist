import type { JsonValue } from '../contracts'
import type { ApplicationProofOracleInputV1 } from '../proof'

type ShapeKey = 'A' | 'B' | 'C'
type PairKey = 'ab' | 'ac' | 'bc'

interface OverlapParams {
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

interface Point {
  x: number
  y: number
}

function roles(zeroPair: PairKey) {
  if (zeroPair === 'bc') {
    return { hub: 'A' as const, upper: 'B' as const, right: 'C' as const, known: 'ab' as const, target: 'ac' as const }
  }
  if (zeroPair === 'ac') {
    return { hub: 'B' as const, upper: 'C' as const, right: 'A' as const, known: 'bc' as const, target: 'ab' as const }
  }
  if (zeroPair === 'ab') {
    return { hub: 'C' as const, upper: 'A' as const, right: 'B' as const, known: 'ac' as const, target: 'bc' as const }
  }
  throw new TypeError('zero pair topology is unsupported')
}

function signedArea(points: readonly Point[]): number {
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]
    return sum + point.x * next.y - next.x * point.y
  }, 0) / 2
}

function area(points: readonly Point[]): number {
  return Math.abs(signedArea(points))
}

function cross(start: Point, end: Point, point: Point): number {
  return (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x)
}

function lineIntersection(firstStart: Point, firstEnd: Point, secondStart: Point, secondEnd: Point): Point {
  const a1 = firstEnd.y - firstStart.y
  const b1 = firstStart.x - firstEnd.x
  const c1 = a1 * firstStart.x + b1 * firstStart.y
  const a2 = secondEnd.y - secondStart.y
  const b2 = secondStart.x - secondEnd.x
  const c2 = a2 * secondStart.x + b2 * secondStart.y
  const determinant = a1 * b2 - a2 * b1
  if (Math.abs(determinant) <= 1e-12) {
    throw new TypeError('parallel clipping edges do not have a stable intersection')
  }
  return {
    x: (b2 * c1 - b1 * c2) / determinant,
    y: (a1 * c2 - a2 * c1) / determinant,
  }
}

function samePoint(first: Point, second: Point): boolean {
  return Math.hypot(first.x - second.x, first.y - second.y) <= 1e-10
}

function normalizePolygon(points: readonly Point[]): Point[] {
  const result: Point[] = []
  points.forEach((point) => {
    if (!result.length || !samePoint(result[result.length - 1], point)) result.push(point)
  })
  if (result.length > 1 && samePoint(result[0], result[result.length - 1])) result.pop()
  return result
}

export function clipConvexPolygons(subject: readonly Point[], clip: readonly Point[]): Point[] {
  if (subject.length < 3 || clip.length < 3) return []
  const orientation = Math.sign(signedArea(clip))
  if (orientation === 0) throw new TypeError('clip polygon has zero area')
  let output = [...subject]
  for (let edgeIndex = 0; edgeIndex < clip.length; edgeIndex += 1) {
    const clipStart = clip[edgeIndex]
    const clipEnd = clip[(edgeIndex + 1) % clip.length]
    const input = output
    output = []
    if (input.length === 0) break
    let previous = input[input.length - 1]
    let previousInside = orientation * cross(clipStart, clipEnd, previous) >= -1e-10
    for (const current of input) {
      const currentInside = orientation * cross(clipStart, clipEnd, current) >= -1e-10
      if (currentInside !== previousInside) {
        output.push(lineIntersection(previous, current, clipStart, clipEnd))
      }
      if (currentInside) output.push(current)
      previous = current
      previousInside = currentInside
    }
    output = normalizePolygon(output)
  }
  return normalizePolygon(output)
}

export function pointInPolygon(point: Point, polygon: readonly Point[], includeBoundary = true): boolean {
  let inside = false
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const first = polygon[previous]
    const second = polygon[current]
    const onEdge = Math.abs(cross(first, second, point)) <= 1e-9 &&
      point.x >= Math.min(first.x, second.x) - 1e-9 &&
      point.x <= Math.max(first.x, second.x) + 1e-9 &&
      point.y >= Math.min(first.y, second.y) - 1e-9 &&
      point.y <= Math.max(first.y, second.y) + 1e-9
    if (onEdge) return includeBoundary
    const crosses = first.y > point.y !== second.y > point.y &&
      point.x < ((second.x - first.x) * (point.y - first.y)) / (second.y - first.y) + first.x
    if (crosses) inside = !inside
  }
  return inside
}

export function isConvexPolygon(points: readonly Point[]): boolean {
  if (points.length < 3 || area(points) <= 1e-12) return false
  let sign = 0
  for (let index = 0; index < points.length; index += 1) {
    const value = cross(points[index], points[(index + 1) % points.length], points[(index + 2) % points.length])
    if (Math.abs(value) <= 1e-10) continue
    if (sign !== 0 && Math.sign(value) !== sign) return false
    sign = Math.sign(value)
  }
  return sign !== 0
}

function constructPolygons(params: OverlapParams): Record<ShapeKey, Point[]> {
  const mapping = roles(params.zeroPair)
  if (
    mapping.hub !== params.hubShape ||
    mapping.upper !== params.upperShape ||
    mapping.right !== params.rightShape ||
    mapping.known !== params.knownPair ||
    mapping.target !== params.targetPair
  ) {
    throw new TypeError('declared role mapping does not match the zero topology')
  }
  if (
    params.knownOverlap !== params.ab ||
    params.targetOverlap !== params.ac ||
    params.shapeArea !== params.aOnly + params.ab + params.ac + params.abc ||
    params.unionArea !== 3 * params.aOnly + 2 * params.ab + 2 * params.ac + params.abc
  ) {
    throw new TypeError('declared overlap totals contradict the atomic inputs')
  }
  if (
    ![
      params.aOnly,
      params.ab,
      params.ac,
      params.abc,
      params.shapeArea,
      params.unionArea,
    ].every((value) => Number.isFinite(value) && value > 0)
  ) {
    throw new TypeError('overlap areas must be positive finite values')
  }
  const total = params.shapeArea
  const h = (params.ab + params.abc) / total
  const w = params.abc / h
  const q = (params.ac + params.abc) / w
  if (!(h > 0 && w > 0 && q > h && q <= 1)) {
    throw new TypeError('overlap topology cannot be constructed')
  }
  const rho = 0.5
  const upperOnly = params.aOnly + params.ac
  const rightOnly = params.aOnly + params.ab
  const dUpper = (2 * upperOnly) / (total * (1 + rho))
  const dRight = (2 * rightOnly) / (q * (1 + rho))
  const canonical = {
    hub: [
      { x: 0, y: 0 }, { x: total, y: 0 },
      { x: total, y: 1 }, { x: 0, y: 1 },
    ],
    upper: [
      { x: 0, y: h }, { x: 0, y: 0 },
      { x: ((1 - rho) * total) / 2, y: -dUpper },
      { x: ((1 + rho) * total) / 2, y: -dUpper },
      { x: total, y: 0 }, { x: total, y: h },
    ],
    right: [
      { x: total - w, y: 0 }, { x: total, y: 0 },
      { x: total + dRight, y: ((1 - rho) * q) / 2 },
      { x: total + dRight, y: ((1 + rho) * q) / 2 },
      { x: total, y: q }, { x: total - w, y: q },
    ],
  }
  const scaleX = 1 / Math.sqrt(total)
  const scaleY = 1 / scaleX
  const transformed = Object.fromEntries(
    Object.entries(canonical).map(([key, polygon]) => [
      key,
      polygon.map((point) => ({ x: point.x * scaleX, y: point.y * scaleY })),
    ]),
  ) as Record<'hub' | 'upper' | 'right', Point[]>
  if (!Object.values(transformed).every(isConvexPolygon)) {
    throw new TypeError('independent construction did not create convex polygons')
  }
  const result: Record<ShapeKey, Point[]> = { A: [], B: [], C: [] }
  result[mapping.hub] = transformed.hub
  result[mapping.upper] = transformed.upper
  result[mapping.right] = transformed.right
  return result
}

function tolerance(expected: number): number {
  return Math.max(1e-9, Math.abs(expected) * 1e-9)
}

export function measureOverlapPolygons(polygons: Record<ShapeKey, readonly Point[]>) {
  if (!Object.values(polygons).every(isConvexPolygon)) {
    throw new TypeError('overlap measurement requires three convex closed polygons')
  }
  const abPolygon = clipConvexPolygons(polygons.A, polygons.B)
  const acPolygon = clipConvexPolygons(polygons.A, polygons.C)
  const bcPolygon = clipConvexPolygons(polygons.B, polygons.C)
  const abcPolygon = clipConvexPolygons(abPolygon, polygons.C)
  const shapeAreas = { A: area(polygons.A), B: area(polygons.B), C: area(polygons.C) }
  const pairIntersections = {
    ab: area(abPolygon),
    ac: area(acPolygon),
    bc: area(bcPolygon),
  }
  const abc = area(abcPolygon)
  const atomicAreas = {
    a: shapeAreas.A - pairIntersections.ab - pairIntersections.ac + abc,
    b: shapeAreas.B - pairIntersections.ab - pairIntersections.bc + abc,
    c: shapeAreas.C - pairIntersections.ac - pairIntersections.bc + abc,
    ab: pairIntersections.ab - abc,
    ac: pairIntersections.ac - abc,
    bc: pairIntersections.bc - abc,
    abc,
  }
  const unionArea = shapeAreas.A + shapeAreas.B + shapeAreas.C -
    pairIntersections.ab - pairIntersections.ac - pairIntersections.bc + abc
  return { shapeAreas, pairIntersections, atomicAreas, unionArea, polygons: { abPolygon, acPolygon, bcPolygon, abcPolygon } }
}

export function measureOverlapReconstructionModel(params: OverlapParams) {
  const polygons = constructPolygons(params)
  const measured = measureOverlapPolygons(polygons)
  const mapping = roles(params.zeroPair)
  const expectedExclusive: Record<'a' | 'b' | 'c', number> = { a: 0, b: 0, c: 0 }
  expectedExclusive[mapping.hub.toLowerCase() as 'a' | 'b' | 'c'] = params.aOnly
  expectedExclusive[mapping.upper.toLowerCase() as 'a' | 'b' | 'c'] = params.aOnly + params.ac
  expectedExclusive[mapping.right.toLowerCase() as 'a' | 'b' | 'c'] = params.aOnly + params.ab
  const expectedPairs: Record<PairKey, number> = { ab: 0, ac: 0, bc: 0 }
  expectedPairs[params.knownPair] = params.ab
  expectedPairs[params.targetPair] = params.ac
  expectedPairs[params.zeroPair] = 0
  for (const shape of ['A', 'B', 'C'] as const) {
    if (Math.abs(measured.shapeAreas[shape] - params.shapeArea) > tolerance(params.shapeArea)) {
      throw new TypeError(`shape ${shape} area does not match the declared equal-shape total`)
    }
  }
  for (const key of ['a', 'b', 'c'] as const) {
    if (Math.abs(measured.atomicAreas[key] - expectedExclusive[key]) > tolerance(expectedExclusive[key])) {
      throw new TypeError(`exclusive region ${key} does not match the reconstructed model`)
    }
  }
  for (const key of ['ab', 'ac', 'bc'] as const) {
    if (Math.abs(measured.atomicAreas[key] - expectedPairs[key]) > tolerance(expectedPairs[key])) {
      throw new TypeError(`pair-only region ${key} does not match the reconstructed model`)
    }
  }
  if (
    Math.abs(measured.atomicAreas.abc - params.abc) > tolerance(params.abc) ||
    Math.abs(measured.unionArea - params.unionArea) > tolerance(params.unionArea)
  ) {
    throw new TypeError('triple or union area does not match the reconstructed model')
  }
  return { ...measured, sourcePolygons: polygons }
}

function numeric(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${key} must be numeric`)
  return value
}

function text<T extends string>(params: Readonly<Record<string, JsonValue>>, key: string): T {
  const value = params[key]
  if (typeof value !== 'string') throw new TypeError(`${key} must be text`)
  return value as T
}

export function evaluateG5AreaOverlapReconstructionOracle(
  input: ApplicationProofOracleInputV1,
): string {
  const params: OverlapParams = {
    aOnly: numeric(input.params, 'aOnly'),
    ab: numeric(input.params, 'ab'),
    ac: numeric(input.params, 'ac'),
    abc: numeric(input.params, 'abc'),
    zeroPair: text(input.params, 'zeroPair'),
    shapeArea: numeric(input.params, 'shapeArea'),
    unionArea: numeric(input.params, 'unionArea'),
    hubShape: text(input.params, 'hubShape'),
    upperShape: text(input.params, 'upperShape'),
    rightShape: text(input.params, 'rightShape'),
    knownPair: text(input.params, 'knownPair'),
    targetPair: text(input.params, 'targetPair'),
    knownOverlap: numeric(input.params, 'knownOverlap'),
    targetOverlap: numeric(input.params, 'targetOverlap'),
  }
  const measured = measureOverlapReconstructionModel(params).atomicAreas[params.targetPair]
  const natural = Math.round(measured)
  if (!Number.isSafeInteger(natural) || natural <= 0 || Math.abs(measured - natural) > tolerance(natural)) {
    throw new TypeError('independently measured target is not a natural-number area')
  }
  return String(natural)
}
