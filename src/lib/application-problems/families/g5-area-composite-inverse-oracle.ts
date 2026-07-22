import type { JsonValue } from '../contracts'
import type { ApplicationProofOracleInputV1 } from '../proof'

interface CompositeParams {
  rectangleWidth: number
  rectangleHeight: number
  squareSide: number
  attachmentPosition: number
  totalArea: number
}

interface Point {
  x: number
  y: number
}

function numeric(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${key} must be finite numeric data`)
  }
  return value
}

function area(points: readonly Point[]): number {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]
    return sum + point.x * next.y - next.x * point.y
  }, 0)) / 2
}

function perimeter(points: readonly Point[]): number {
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]
    return sum + Math.hypot(next.x - point.x, next.y - point.y)
  }, 0)
}

function offset(params: CompositeParams): number {
  if (params.attachmentPosition === 0) return 0
  if (params.attachmentPosition === 1) return (params.squareSide - params.rectangleHeight) / 2
  if (params.attachmentPosition === 2) return params.squareSide - params.rectangleHeight
  throw new TypeError('attachment position is unsupported')
}

function buildUnion(params: CompositeParams): Point[] {
  const side = params.squareSide
  const width = params.rectangleWidth
  const height = params.rectangleHeight
  const start = offset(params)
  if (params.attachmentPosition === 0) {
    return [
      { x: 0, y: 0 }, { x: side + width, y: 0 },
      { x: side + width, y: height }, { x: side, y: height },
      { x: side, y: side }, { x: 0, y: side },
    ]
  }
  if (params.attachmentPosition === 2) {
    return [
      { x: 0, y: 0 }, { x: side, y: 0 },
      { x: side, y: start }, { x: side + width, y: start },
      { x: side + width, y: side }, { x: 0, y: side },
    ]
  }
  return [
    { x: 0, y: 0 }, { x: side, y: 0 },
    { x: side, y: start }, { x: side + width, y: start },
    { x: side + width, y: start + height }, { x: side, y: start + height },
    { x: side, y: side }, { x: 0, y: side },
  ]
}

export function measureCompositeInverseModel(params: CompositeParams) {
  const values = [
    params.rectangleWidth,
    params.rectangleHeight,
    params.squareSide,
    params.totalArea,
  ]
  if (!values.every(Number.isFinite) || values.some((value) => value <= 0)) {
    throw new TypeError('composite dimensions must be positive finite values')
  }
  if (params.rectangleHeight > params.squareSide) {
    throw new TypeError('rectangle cannot attach along a longer edge')
  }
  offset(params)
  const squareArea = params.squareSide * params.squareSide
  const remainingArea = params.totalArea - squareArea
  const inferredWidth = remainingArea / params.rectangleHeight
  if (!Number.isSafeInteger(inferredWidth) || inferredWidth <= 0) {
    throw new TypeError('area data does not infer a natural-number width')
  }
  if (inferredWidth !== params.rectangleWidth) {
    throw new TypeError('declared width contradicts the independently inferred width')
  }
  const square = [
    { x: 0, y: 0 },
    { x: params.squareSide, y: 0 },
    { x: params.squareSide, y: params.squareSide },
    { x: 0, y: params.squareSide },
  ]
  const start = offset(params)
  const rectangle = [
    { x: params.squareSide, y: start },
    { x: params.squareSide + inferredWidth, y: start },
    { x: params.squareSide + inferredWidth, y: start + params.rectangleHeight },
    { x: params.squareSide, y: start + params.rectangleHeight },
  ]
  const union = buildUnion(params)
  const unionArea = area(union)
  const independentlyAddedArea = area(square) + area(rectangle)
  const sharedEdgeLength = Math.min(params.squareSide, start + params.rectangleHeight) - Math.max(0, start)
  const exposedPerimeter = perimeter(square) + perimeter(rectangle) - 2 * sharedEdgeLength
  const boundaryPerimeter = perimeter(union)
  const tolerance = Math.max(1e-9, Math.abs(params.totalArea) * 1e-9)
  if (
    Math.abs(unionArea - params.totalArea) > tolerance ||
    Math.abs(independentlyAddedArea - params.totalArea) > tolerance ||
    Math.abs(boundaryPerimeter - exposedPerimeter) > Math.max(1e-9, exposedPerimeter * 1e-9)
  ) {
    throw new TypeError('independent composite geometry disagrees with the declared model')
  }
  return {
    area: unionArea,
    inferredWidth,
    exposedPerimeter,
    boundaryPerimeter,
    square,
    rectangle,
    union,
  }
}

export function evaluateG5AreaCompositeInverseOracle(
  input: ApplicationProofOracleInputV1,
): string {
  const params = {
    rectangleWidth: numeric(input.params, 'rectangleWidth'),
    rectangleHeight: numeric(input.params, 'rectangleHeight'),
    squareSide: numeric(input.params, 'squareSide'),
    attachmentPosition: numeric(input.params, 'attachmentPosition'),
    totalArea: numeric(input.params, 'totalArea'),
  }
  return String(measureCompositeInverseModel(params).exposedPerimeter)
}
