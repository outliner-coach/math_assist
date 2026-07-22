import type { JsonValue } from '../contracts'
import type { ApplicationProofOracleInputV1 } from '../proof'

interface BoundaryParams {
  width: number
  height: number
  notchWidth: number
  notchHeight: number
  rotation: number
}

function numeric(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${key} must be finite numeric data`)
  }
  return value
}

function rotate(point: { x: number; y: number }, rotation: number) {
  if (rotation === 1) return { x: -point.y, y: point.x }
  if (rotation === 2) return { x: -point.x, y: -point.y }
  if (rotation === 3) return { x: point.y, y: -point.x }
  if (rotation !== 0) throw new TypeError('rotation is unsupported')
  return point
}

export function measureBoundaryRebuildModel(params: BoundaryParams) {
  const { width, height, notchWidth, notchHeight, rotation } = params
  if (
    ![width, height, notchWidth, notchHeight].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0 ||
    notchWidth <= 0 ||
    notchHeight <= 0 ||
    notchWidth >= width ||
    notchHeight >= height
  ) {
    throw new TypeError('boundary dimensions are impossible')
  }
  const polygon = [
    { x: 0, y: 0 },
    { x: width - notchWidth, y: 0 },
    { x: width - notchWidth, y: notchHeight },
    { x: width, y: notchHeight },
    { x: width, y: height },
    { x: 0, y: height },
  ].map((point) => rotate(point, rotation))
  const perimeter = polygon.reduce((total, point, index) => {
    const next = polygon[(index + 1) % polygon.length]
    return total + Math.abs(next.x - point.x) + Math.abs(next.y - point.y)
  }, 0)
  const doubledArea = polygon.reduce((total, point, index) => {
    const next = polygon[(index + 1) % polygon.length]
    return total + point.x * next.y - next.x * point.y
  }, 0)
  const area = Math.abs(doubledArea) / 2
  const expectedArea = width * height - notchWidth * notchHeight
  if (perimeter !== 2 * (width + height) || area !== expectedArea) {
    throw new TypeError('independent boundary measurement disagrees with the declared model')
  }
  return { polygon, perimeter, area }
}

export function evaluateG5PerimeterBoundaryRebuildOracle(
  input: ApplicationProofOracleInputV1,
): string {
  const params = {
    width: numeric(input.params, 'width'),
    height: numeric(input.params, 'height'),
    notchWidth: numeric(input.params, 'notchWidth'),
    notchHeight: numeric(input.params, 'notchHeight'),
    rotation: numeric(input.params, 'rotation'),
  }
  return String(measureBoundaryRebuildModel(params).perimeter)
}
