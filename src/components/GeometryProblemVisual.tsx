'use client'

import React from 'react'
import { geometryOptionIndex } from '@/lib/math'
import type { GeometryVisual, PolygonShape } from '@/lib/types'

interface GeometryProblemVisualProps {
  visual: GeometryVisual
  showAnswer?: boolean
}

const optionLabels = ['가', '나', '다', '라']

function MeasurementLabel({ x, y, value, unit = 'cm', hidden = false, showAnswer = false }: {
  x: number
  y: number
  value?: number
  unit?: string
  hidden?: boolean
  showAnswer?: boolean
}) {
  if (value === undefined) return null
  const displayValue = hidden && !showAnswer ? '?' : value
  return <text x={x} y={y} textAnchor="middle" fontSize="13" fill="#334155">{displayValue}{unit}</text>
}

type PolygonVisualValue = Extract<GeometryVisual, { type: 'polygon' }>
type Point = { x: number; y: number }

export interface PolygonLayout {
  points: Point[]
  width: number
  height: number
}

function positive(value: number | undefined, fallback = 1): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback
}

function maskUnknownMeasurement(
  visual: PolygonVisualValue,
  showAnswer: boolean
): PolygonVisualValue {
  if (showAnswer || !visual.unknownMeasurement) return visual

  const masked = { ...visual }
  const knownA = positive(visual.a)
  const knownB = positive(visual.b)

  if (visual.unknownMeasurement === 'a') {
    masked.a = visual.shape === 'rhombus'
      ? knownB
      : positive(visual.height, knownB) * 1.5
  }
  if (visual.unknownMeasurement === 'b') {
    masked.b = visual.shape === 'trapezoid'
      ? knownA * 1.5
      : knownA * 0.65
  }
  if (visual.unknownMeasurement === 'c') {
    masked.c = Math.max(knownA, knownB)
  }
  if (visual.unknownMeasurement === 'height') {
    masked.height = knownA * 0.6
  }

  return masked
}

function fitPolygonPoints(rawPoints: Point[]): PolygonLayout {
  const xs = rawPoints.map(point => point.x)
  const ys = rawPoints.map(point => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const modelWidth = Math.max(maxX - minX, 0.01)
  const modelHeight = Math.max(maxY - minY, 0.01)
  const scale = Math.min(190 / modelWidth, 110 / modelHeight)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const points = rawPoints.map(point => ({
    x: 150 + (point.x - centerX) * scale,
    y: 88 - (point.y - centerY) * scale,
  }))

  return {
    points,
    width: modelWidth * scale,
    height: modelHeight * scale,
  }
}

export function buildPolygonLayout(
  source: PolygonVisualValue,
  showAnswer = true
): PolygonLayout {
  const visual = maskUnknownMeasurement(source, showAnswer)
  const a = positive(visual.a)
  const b = positive(visual.b, a)
  const height = positive(visual.height, b)
  let rawPoints: Point[]

  if (visual.shape === 'rectangle') {
    rawPoints = [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: b }, { x: 0, y: b }]
  } else if (visual.shape === 'square') {
    rawPoints = [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: a }, { x: 0, y: a }]
  } else if (visual.shape === 'parallelogram') {
    const offset = height * 0.3
    rawPoints = [
      { x: 0, y: 0 },
      { x: a, y: 0 },
      { x: a + offset, y: height },
      { x: offset, y: height },
    ]
  } else if (visual.shape === 'triangle' && visual.measurementMode === 'sides') {
    const c = positive(visual.c, a)
    const apexX = Math.max(0, Math.min(a, (a * a + b * b - c * c) / (2 * a)))
    const apexY = Math.sqrt(Math.max(b * b - apexX * apexX, 0.01))
    rawPoints = [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: apexX, y: apexY }]
  } else if (visual.shape === 'triangle') {
    rawPoints = [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a * 0.58, y: height }]
  } else if (visual.shape === 'trapezoid') {
    const inset = (b - a) / 2
    rawPoints = [
      { x: 0, y: 0 },
      { x: b, y: 0 },
      { x: b - inset, y: height },
      { x: inset, y: height },
    ]
  } else {
    rawPoints = [
      { x: 0, y: a / 2 },
      { x: b / 2, y: 0 },
      { x: 0, y: -a / 2 },
      { x: -b / 2, y: 0 },
    ]
  }

  return fitPolygonPoints(rawPoints)
}

function pointString(points: Point[]): string {
  return points.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')
}

function PolygonVisual({ visual, showAnswer }: {
  visual: PolygonVisualValue
  showAnswer: boolean
}) {
  const { shape, a, b, c, height, unit = 'cm' } = visual
  const layout = buildPolygonLayout(visual, showAnswer)
  const xs = layout.points.map(point => point.x)
  const ys = layout.points.map(point => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const middleX = (minX + maxX) / 2
  const middleY = (minY + maxY) / 2
  const common = { fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 3 }
  const shapeNames: Record<PolygonShape, string> = {
    rectangle: '직사각형',
    square: '정사각형',
    parallelogram: '평행사변형',
    triangle: '삼각형',
    trapezoid: '사다리꼴',
    rhombus: '마름모',
  }

  return (
    <svg viewBox="0 0 300 190" className="mx-auto w-full max-w-sm" role="img" aria-label={`${shapeNames[shape]} 도형`}>
      <polygon points={pointString(layout.points)} {...common} />

      {(shape === 'rectangle' || shape === 'square') && <>
        <MeasurementLabel x={middleX} y={maxY + 20} value={a} unit={unit} hidden={visual.unknownMeasurement === 'a'} showAnswer={showAnswer} />
        {shape === 'rectangle' && <MeasurementLabel x={maxX + 18} y={middleY} value={b} unit={unit} hidden={visual.unknownMeasurement === 'b'} showAnswer={showAnswer} />}
      </>}
      {shape === 'parallelogram' && <>
        <MeasurementLabel x={middleX} y={maxY + 20} value={a} unit={unit} hidden={visual.unknownMeasurement === 'a'} showAnswer={showAnswer} />
        {b !== undefined && <MeasurementLabel x={minX - 14} y={middleY} value={b} unit={unit} hidden={visual.unknownMeasurement === 'b'} showAnswer={showAnswer} />}
        <line x1={layout.points[2].x} y1={minY} x2={layout.points[2].x} y2={maxY} stroke="#64748b" strokeDasharray="5 4" />
        <MeasurementLabel x={layout.points[2].x + 20} y={middleY} value={height} unit={unit} hidden={visual.unknownMeasurement === 'height'} showAnswer={showAnswer} />
      </>}
      {shape === 'triangle' && visual.measurementMode === 'sides' && <>
        <MeasurementLabel x={middleX} y={maxY + 20} value={a} unit={unit} hidden={visual.unknownMeasurement === 'a'} showAnswer={showAnswer} />
        <MeasurementLabel x={(layout.points[0].x + layout.points[2].x) / 2 - 12} y={(layout.points[0].y + layout.points[2].y) / 2} value={b} unit={unit} hidden={visual.unknownMeasurement === 'b'} showAnswer={showAnswer} />
        <MeasurementLabel x={(layout.points[1].x + layout.points[2].x) / 2 + 12} y={(layout.points[1].y + layout.points[2].y) / 2} value={c} unit={unit} hidden={visual.unknownMeasurement === 'c'} showAnswer={showAnswer} />
      </>}
      {shape === 'triangle' && visual.measurementMode !== 'sides' && <>
        <MeasurementLabel x={middleX} y={maxY + 20} value={a} unit={unit} hidden={visual.unknownMeasurement === 'a'} showAnswer={showAnswer} />
        <line x1={layout.points[2].x} y1={minY} x2={layout.points[2].x} y2={maxY} stroke="#64748b" strokeDasharray="5 4" />
        <MeasurementLabel x={layout.points[2].x + 20} y={middleY} value={height} unit={unit} hidden={visual.unknownMeasurement === 'height'} showAnswer={showAnswer} />
      </>}
      {shape === 'trapezoid' && <>
        <MeasurementLabel x={(layout.points[2].x + layout.points[3].x) / 2} y={minY - 8} value={a} unit={unit} hidden={visual.unknownMeasurement === 'a'} showAnswer={showAnswer} />
        <MeasurementLabel x={(layout.points[0].x + layout.points[1].x) / 2} y={maxY + 20} value={b} unit={unit} hidden={visual.unknownMeasurement === 'b'} showAnswer={showAnswer} />
        <line x1={layout.points[2].x} y1={minY} x2={layout.points[2].x} y2={maxY} stroke="#64748b" strokeDasharray="5 4" />
        <MeasurementLabel x={layout.points[2].x + 20} y={middleY} value={height} unit={unit} hidden={visual.unknownMeasurement === 'height'} showAnswer={showAnswer} />
        {c !== undefined && <MeasurementLabel x={minX - 14} y={middleY} value={c} unit={unit} hidden={visual.unknownMeasurement === 'c'} showAnswer={showAnswer} />}
      </>}
      {shape === 'rhombus' && <>
        <line x1={middleX} y1={minY} x2={middleX} y2={maxY} stroke="#64748b" strokeDasharray="5 4" />
        <line x1={minX} y1={middleY} x2={maxX} y2={middleY} stroke="#64748b" strokeDasharray="5 4" />
        <MeasurementLabel x={middleX + 20} y={middleY - 20} value={a} unit={unit} hidden={visual.unknownMeasurement === 'a'} showAnswer={showAnswer} />
        <MeasurementLabel x={middleX} y={maxY + 20} value={b} unit={unit} hidden={visual.unknownMeasurement === 'b'} showAnswer={showAnswer} />
      </>}
    </svg>
  )
}

export interface CongruencePairLayout {
  left: Point[]
  right: Point[]
}

export function buildCongruencePairLayout(
  shape: 'quadrilateral' | 'rectangle' = 'quadrilateral',
  measurements: { a?: number; b?: number; c?: number } = {}
): CongruencePairLayout {
  const a = positive(measurements.a, 8)
  const b = positive(measurements.b, 6)
  const c = positive(measurements.c, 7)
  const rawPoints = shape === 'rectangle'
    ? [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: b }, { x: 0, y: b }]
    : [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: b }, { x: a - c, y: b }]
  const xs = rawPoints.map(point => point.x)
  const ys = rawPoints.map(point => point.y)
  const modelCenter = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  }
  const scale = Math.min(
    80 / Math.max(Math.max(...xs) - Math.min(...xs), 1),
    70 / Math.max(Math.max(...ys) - Math.min(...ys), 1)
  )
  const left = rawPoints.map(point => ({
    x: 73 + (point.x - modelCenter.x) * scale,
    y: 90 + (point.y - modelCenter.y) * scale,
  }))
  const leftXs = left.map(point => point.x)
  const leftYs = left.map(point => point.y)
  const sourceCenter = {
    x: (Math.min(...leftXs) + Math.max(...leftXs)) / 2,
    y: (Math.min(...leftYs) + Math.max(...leftYs)) / 2,
  }
  const targetCenter = { x: 220, y: 90 }
  const right = left.map(point => {
    const dx = point.x - sourceCenter.x
    const dy = point.y - sourceCenter.y
    return {
      x: targetCenter.x - dy,
      y: targetCenter.y + dx,
    }
  })

  return { left, right }
}

function labelOutsidePolygon(point: Point, center: Point, distance = 13): Point {
  const dx = point.x - center.x
  const dy = point.y - center.y
  const length = Math.max(Math.hypot(dx, dy), 1)
  return {
    x: point.x + (dx / length) * distance,
    y: point.y + (dy / length) * distance + 5,
  }
}

function edgeLabelPosition(points: Point[], index: number, distance = 12): Point {
  const next = (index + 1) % points.length
  const midpoint = {
    x: (points[index].x + points[next].x) / 2,
    y: (points[index].y + points[next].y) / 2,
  }
  const center = points.reduce(
    (value, point) => ({
      x: value.x + point.x / points.length,
      y: value.y + point.y / points.length,
    }),
    { x: 0, y: 0 }
  )
  return labelOutsidePolygon(midpoint, center, distance)
}

function CongruenceVisual({ visual, showAnswer }: { visual: Extract<GeometryVisual, { type: 'congruence' }>; showAnswer: boolean }) {
  const answer = geometryOptionIndex(1, visual.variant)
  const shape = visual.shape ?? 'quadrilateral'
  const layout = buildCongruencePairLayout(shape, visual)
  const leftCenter = layout.left.reduce(
    (center, point) => ({
      x: center.x + point.x / layout.left.length,
      y: center.y + point.y / layout.left.length,
    }),
    { x: 0, y: 0 }
  )
  const rightCenter = layout.right.reduce(
    (center, point) => ({
      x: center.x + point.x / layout.right.length,
      y: center.y + point.y / layout.right.length,
    }),
    { x: 0, y: 0 }
  )
  const leftLabelPositions = layout.left.map(point => (
    labelOutsidePolygon(point, leftCenter)
  ))
  const candidatePositions = layout.right.map(point => (
    labelOutsidePolygon(point, rightCenter)
  ))
  const orderedLabels = candidatePositions.map((_, index) => optionLabels[(index + answer - 1) % 4])
  const measurementPositions = [0, 1, 2].map(index => (
    edgeLabelPosition(layout.left, index)
  ))
  const shapeName = shape === 'rectangle' ? '직사각형' : '사각형'

  return (
    <svg viewBox="0 0 300 180" className="mx-auto w-full max-w-md" role="img" aria-label={`합동인 두 ${shapeName}과 대응점`}>
      <polygon points={pointString(layout.left)} fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
      <polygon points={pointString(layout.right)} fill="#dcfce7" stroke="#16a34a" strokeWidth="3" />
      {['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'].map((label, index) => {
        const position = leftLabelPositions[index]
        return <text key={label} x={position.x} y={position.y} textAnchor="middle" fontSize="14" fontWeight="700">{label}</text>
      })}
      {orderedLabels.map((label, index) => (
        <text key={`${label}-${index}`} x={candidatePositions[index].x} y={candidatePositions[index].y} textAnchor="middle" fontSize="14" fontWeight="700">{label}</text>
      ))}
      <MeasurementLabel x={measurementPositions[0].x} y={measurementPositions[0].y} value={visual.a} unit={visual.unit} />
      <MeasurementLabel x={measurementPositions[1].x} y={measurementPositions[1].y} value={visual.b} unit={visual.unit} />
      {shape !== 'rectangle' && <MeasurementLabel x={measurementPositions[2].x} y={measurementPositions[2].y} value={visual.c} unit={visual.unit} />}
      <text x="73" y="174" textAnchor="middle" fontSize="12" fill="#475569">도형 1</text>
      <text x="220" y="174" textAnchor="middle" fontSize="12" fill="#475569">도형 2</text>
      {showAnswer && <text x="150" y="18" textAnchor="middle" fontSize="13" fontWeight="700" fill="#15803d">정답: {optionLabels[answer - 1]}</text>}
    </svg>
  )
}

const axisShapeNames = ['정사각형', '직사각형', '정삼각형', '이등변삼각형', '마름모', '부등변삼각형']

function SymmetryVisual({ visual, showAnswer }: { visual: Extract<GeometryVisual, { type: 'symmetry' }>; showAnswer: boolean }) {
  if (visual.mode === 'line-coordinate' || visual.mode === 'point-coordinate') {
    const x = visual.x ?? 2
    const y = visual.y ?? 3
    const axis = visual.axis ?? 5
    const centerX = visual.centerX ?? 5
    const centerY = visual.centerY ?? 5
    const scale = 22
    const ox = 35
    const oy = 225
    const toX = (value: number) => ox + value * scale
    const toY = (value: number) => oy - value * scale
    const targetX = visual.mode === 'line-coordinate' ? 2 * axis - x : 2 * centerX - x
    const targetY = visual.mode === 'line-coordinate' ? y : 2 * centerY - y

    return (
      <svg viewBox="0 0 300 235" className="mx-auto w-full max-w-md" role="img" aria-label="모눈 위의 대칭점">
        {Array.from({ length: 11 }, (_, index) => <g key={index}>
          <line x1={toX(index)} y1={toY(0)} x2={toX(index)} y2={toY(10)} stroke="#e2e8f0" />
          <line x1={toX(0)} y1={toY(index)} x2={toX(10)} y2={toY(index)} stroke="#e2e8f0" />
        </g>)}
        {visual.mode === 'line-coordinate' ? (
          <line x1={toX(axis)} y1={toY(0)} x2={toX(axis)} y2={toY(10)} stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
        ) : (
          <circle cx={toX(centerX)} cy={toY(centerY)} r="5" fill="#7c3aed" />
        )}
        <circle cx={toX(x)} cy={toY(y)} r="6" fill="#2563eb" />
        <text x={toX(x) + 9} y={toY(y) - 8} fontSize="13">P({x}, {y})</text>
        {showAnswer && <>
          <circle cx={toX(targetX)} cy={toY(targetY)} r="6" fill="#16a34a" />
          <text x={toX(targetX) + 8} y={toY(targetY) - 8} fontSize="13" fill="#15803d">P′({targetX}, {targetY})</text>
        </>}
      </svg>
    )
  }

  const shapeCode = ((Math.abs(Math.floor(visual.variant)) - 1) % 6 + 6) % 6
  return (
    <svg viewBox="0 0 300 175" className="mx-auto w-full max-w-sm" role="img" aria-label={`${axisShapeNames[shapeCode]}의 대칭축`}>
      {shapeCode === 0 && <rect x="85" y="25" width="130" height="130" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />}
      {shapeCode === 1 && <rect x="55" y="45" width="190" height="90" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />}
      {shapeCode === 2 && <polygon points="150,20 245,150 55,150" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />}
      {shapeCode === 3 && <polygon points="150,20 225,150 75,150" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />}
      {shapeCode === 4 && <polygon points="150,20 245,88 150,155 55,88" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />}
      {shapeCode === 5 && <polygon points="45,145 250,145 185,30" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />}
      <text x="150" y="170" textAnchor="middle" fontSize="13" fill="#475569">{axisShapeNames[shapeCode]}</text>
      {showAnswer && shapeCode === 0 && <>
        <line x1="150" y1="15" x2="150" y2="160" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
        <line x1="78" y1="90" x2="222" y2="90" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
        <line x1="82" y1="22" x2="218" y2="158" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
        <line x1="218" y1="22" x2="82" y2="158" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
      </>}
      {showAnswer && shapeCode === 1 && <>
        <line x1="150" y1="38" x2="150" y2="142" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
        <line x1="48" y1="90" x2="252" y2="90" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
      </>}
      {showAnswer && shapeCode === 2 && <>
        <line x1="150" y1="15" x2="150" y2="155" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
        <line x1="48" y1="151" x2="198" y2="83" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
        <line x1="252" y1="151" x2="102" y2="83" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
      </>}
      {showAnswer && shapeCode === 3 && <line x1="150" y1="15" x2="150" y2="155" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />}
      {showAnswer && shapeCode === 4 && <>
        <line x1="150" y1="15" x2="150" y2="160" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
        <line x1="50" y1="88" x2="250" y2="88" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 4" />
      </>}
    </svg>
  )
}

type CuboidVisualValue = Extract<GeometryVisual, { type: 'cuboid' }>

export interface CuboidLayout {
  front: Point[]
  back: Point[]
}

function maskUnknownCuboidMeasurement(
  visual: CuboidVisualValue,
  showAnswer: boolean
): CuboidVisualValue {
  if (showAnswer || !visual.unknownMeasurement) return visual

  const width = positive(visual.width)
  const height = positive(visual.height)
  const depth = positive(visual.depth)
  const masked = { ...visual }

  if (visual.unknownMeasurement === 'width') {
    masked.width = Math.max(height, depth) * 1.35
  }
  if (visual.unknownMeasurement === 'height') {
    masked.height = Math.max(width, depth) * 0.75
  }
  if (visual.unknownMeasurement === 'depth') {
    masked.depth = Math.min(width, height) * 0.7
  }
  return masked
}

export function buildCuboidLayout(
  source: CuboidVisualValue,
  showAnswer = true
): CuboidLayout {
  const visual = maskUnknownCuboidMeasurement(source, showAnswer)
  const width = positive(visual.width)
  const height = positive(visual.height)
  const depth = positive(visual.depth)
  const depthVector = { x: depth * 0.65, y: -depth * 0.45 }
  const rawFront = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ]
  const rawBack = rawFront.map(point => ({
    x: point.x + depthVector.x,
    y: point.y + depthVector.y,
  }))
  const allPoints = [...rawFront, ...rawBack]
  const xs = allPoints.map(point => point.x)
  const ys = allPoints.map(point => point.y)
  const modelCenter = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  }
  const scale = Math.min(
    210 / Math.max(Math.max(...xs) - Math.min(...xs), 1),
    110 / Math.max(Math.max(...ys) - Math.min(...ys), 1)
  )
  const project = (point: Point): Point => ({
    x: 155 + (point.x - modelCenter.x) * scale,
    y: 85 + (point.y - modelCenter.y) * scale,
  })

  return {
    front: rawFront.map(project),
    back: rawBack.map(project),
  }
}

function CuboidVisual({ visual, showAnswer }: {
  visual: CuboidVisualValue
  showAnswer: boolean
}) {
  const { width, height, depth, unit = 'cm' } = visual
  const layout = buildCuboidLayout(visual, showAnswer)
  const [frontTopLeft, frontTopRight, frontBottomRight, frontBottomLeft] = layout.front
  const [backTopLeft, backTopRight, backBottomRight, backBottomLeft] = layout.back
  return (
    <svg viewBox="0 0 310 190" className="mx-auto w-full max-w-sm" role="img" aria-label="직육면체의 가로 세로 높이">
      <polygon points={pointString([frontTopLeft, backTopLeft, backTopRight, frontTopRight])} fill="#eff6ff" stroke="#2563eb" strokeWidth="3" />
      <polygon points={pointString([frontTopRight, backTopRight, backBottomRight, frontBottomRight])} fill="#bfdbfe" fillOpacity="0.8" stroke="#2563eb" strokeWidth="3" />
      <polygon points={pointString(layout.front)} fill="#dbeafe" fillOpacity="0.65" stroke="#2563eb" strokeWidth="3" />
      <line x1={frontBottomLeft.x} y1={frontBottomLeft.y} x2={backBottomLeft.x} y2={backBottomLeft.y} stroke="#64748b" strokeDasharray="5 4" />
      <line x1={backBottomLeft.x} y1={backBottomLeft.y} x2={backBottomRight.x} y2={backBottomRight.y} stroke="#64748b" strokeDasharray="5 4" />
      <line x1={backTopLeft.x} y1={backTopLeft.y} x2={backBottomLeft.x} y2={backBottomLeft.y} stroke="#64748b" strokeDasharray="5 4" />
      <MeasurementLabel x={(frontBottomLeft.x + frontBottomRight.x) / 2} y={frontBottomLeft.y + 22} value={width} unit={unit} hidden={visual.unknownMeasurement === 'width'} showAnswer={showAnswer} />
      <MeasurementLabel x={frontTopLeft.x - 22} y={(frontTopLeft.y + frontBottomLeft.y) / 2} value={height} unit={unit} hidden={visual.unknownMeasurement === 'height'} showAnswer={showAnswer} />
      <MeasurementLabel x={(frontTopRight.x + backTopRight.x) / 2 + 12} y={(frontTopRight.y + backTopRight.y) / 2 - 8} value={depth} unit={unit} hidden={visual.unknownMeasurement === 'depth'} showAnswer={showAnswer} />
    </svg>
  )
}

const validNet = [[1, 1], [0, 1], [2, 1], [1, 0], [1, 2], [1, 3]]
const invalidNets = [
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]],
  [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [2, 2]],
]

type Vector3 = [number, number, number]
type FaceOrientation = { normal: Vector3; right: Vector3; down: Vector3 }

function negateVector(vector: Vector3): Vector3 {
  return [-vector[0], -vector[1], -vector[2]]
}

function sameVector(left: Vector3, right: Vector3): boolean {
  return left.every((value, index) => value === right[index])
}

function foldOrientation(
  orientation: FaceOrientation,
  dx: number,
  dy: number
): FaceOrientation {
  if (dx === 1) {
    return {
      normal: orientation.right,
      right: negateVector(orientation.normal),
      down: orientation.down,
    }
  }
  if (dx === -1) {
    return {
      normal: negateVector(orientation.right),
      right: orientation.normal,
      down: orientation.down,
    }
  }
  if (dy === 1) {
    return {
      normal: orientation.down,
      right: orientation.right,
      down: negateVector(orientation.normal),
    }
  }
  return {
    normal: negateVector(orientation.down),
    right: orientation.right,
    down: orientation.normal,
  }
}

function sameOrientation(left: FaceOrientation, right: FaceOrientation): boolean {
  return sameVector(left.normal, right.normal) &&
    sameVector(left.right, right.right) &&
    sameVector(left.down, right.down)
}

export function isValidCubeNet(cells: number[][]): boolean {
  if (cells.length !== 6) return false
  const keys = cells.map(([x, y]) => `${x},${y}`)
  if (new Set(keys).size !== 6) return false

  const cellsByKey = new Set(keys)
  const orientations = new Map<string, FaceOrientation>()
  const startOrientation: FaceOrientation = {
    normal: [0, 0, 1],
    right: [1, 0, 0],
    down: [0, 1, 0],
  }
  orientations.set(keys[0], startOrientation)
  const queue = [cells[0]]
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]

  while (queue.length > 0) {
    const [x, y] = queue.shift()!
    const orientation = orientations.get(`${x},${y}`)!
    for (const [dx, dy] of directions) {
      const neighborKey = `${x + dx},${y + dy}`
      if (!cellsByKey.has(neighborKey)) continue
      const folded = foldOrientation(orientation, dx, dy)
      const existing = orientations.get(neighborKey)
      if (existing && !sameOrientation(existing, folded)) return false
      if (!existing) {
        orientations.set(neighborKey, folded)
        queue.push([x + dx, y + dy])
      }
    }
  }

  if (orientations.size !== 6) return false
  return new Set(
    Array.from(orientations.values(), ({ normal }) => normal.join(','))
  ).size === 6
}

export function buildCuboidNetOptions(variant: number): {
  answerIndex: number
  layouts: number[][][]
} {
  const answerIndex = geometryOptionIndex(2, variant) - 1
  let invalidIndex = 0
  const layouts = optionLabels.map((_, index) => {
    if (index === answerIndex) return validNet
    const layout = invalidNets[invalidIndex]
    invalidIndex += 1
    return layout
  })
  return { answerIndex, layouts }
}

function NetCells({ cells, x, y, size, labels }: { cells: number[][]; x: number; y: number; size: number; labels?: boolean }) {
  return <>{cells.map(([cx, cy], index) => <g key={`${cx}-${cy}-${index}`}>
    <rect x={x + cx * size} y={y + cy * size} width={size} height={size} fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
    {labels && <text x={x + cx * size + size / 2} y={y + cy * size + size * 0.65} textAnchor="middle" fontSize="12">{index + 1}</text>}
  </g>)}</>
}

function CuboidNetVisual({ visual, showAnswer }: { visual: Extract<GeometryVisual, { type: 'cuboid-net' }>; showAnswer: boolean }) {
  if (visual.mode === 'single') {
    return (
      <svg viewBox="0 0 260 205" className="mx-auto w-full max-w-xs" role="img" aria-label="직육면체 전개도">
        <NetCells cells={validNet} x={70} y={10} size={42} labels />
        <MeasurementLabel x={91} y={110} value={visual.side} unit="cm" />
        {visual.focusFace && <text x="15" y="195" fontSize="12" fill="#475569">기준 면: {visual.focusFace}</text>}
      </svg>
    )
  }

  const { answerIndex, layouts } = buildCuboidNetOptions(visual.variant)
  return (
    <svg viewBox="0 0 360 230" className="mx-auto w-full max-w-lg" role="img" aria-label="직육면체 전개도 보기 네 개">
      {optionLabels.map((label, index) => {
        const col = index % 2
        const row = Math.floor(index / 2)
        const cells = layouts[index]
        return <g key={label} data-net-option={index}>
          <text x={15 + col * 180} y={20 + row * 110} fontWeight="700">{label}</text>
          <NetCells cells={cells} x={35 + col * 180} y={25 + row * 110} size={22} />
          {showAnswer && index === answerIndex && <rect x={8 + col * 180} y={3 + row * 110} width="165" height="103" rx="8" fill="none" stroke="#16a34a" strokeWidth="3" />}
        </g>
      })}
      {showAnswer && <text x="180" y="225" textAnchor="middle" fill="#15803d" fontWeight="700">정답 전개도를 초록색으로 표시했어요.</text>}
    </svg>
  )
}

type PolySolidKind = Extract<GeometryVisual, { type: 'poly-solid' }>['kind']

export interface PolySolidLayout {
  basePolygons: Point[][]
  lateralEdges: Array<[Point, Point]>
  vertices: Point[]
}

function boundedSideCount(value: number): number {
  if (!Number.isFinite(value)) return 3
  return Math.max(3, Math.min(8, Math.round(value)))
}

function regularPolygonPoints(
  sides: number,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  rotation = -Math.PI / 2
): Point[] {
  return Array.from({ length: sides }, (_, index) => {
    const angle = rotation + (index * Math.PI * 2) / sides
    return {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
    }
  })
}

export function buildPolySolidLayout(
  kind: PolySolidKind,
  sourceBaseSides: number
): PolySolidLayout {
  const baseSides = boundedSideCount(sourceBaseSides)
  if (kind === 'prism') {
    const front = regularPolygonPoints(baseSides, 126, 112, 68, 42)
    const back = regularPolygonPoints(baseSides, 174, 70, 68, 42)
    return {
      basePolygons: [back, front],
      lateralEdges: front.map((point, index) => [point, back[index]]),
      vertices: [...back, ...front],
    }
  }

  const base = regularPolygonPoints(baseSides, 150, 122, 78, 43)
  const apex = { x: 150, y: 24 }
  return {
    basePolygons: [base],
    lateralEdges: base.map((point) => [point, apex]),
    vertices: [...base, apex],
  }
}

const polygonPrefixes: Record<number, string> = {
  3: '삼',
  4: '사',
  5: '오',
  6: '육',
  7: '칠',
  8: '팔',
}

function PolySolidVisual({ visual }: {
  visual: Extract<GeometryVisual, { type: 'poly-solid' }>
}) {
  const baseSides = boundedSideCount(visual.baseSides)
  const layout = buildPolySolidLayout(visual.kind, baseSides)
  const solidName = `${polygonPrefixes[baseSides]}각${visual.kind === 'prism' ? '기둥' : '뿔'}`

  return (
    <svg
      viewBox="0 0 300 190"
      className="mx-auto w-full max-w-sm"
      role="img"
      aria-label={`${solidName} 모형`}
    >
      {layout.basePolygons.map((polygon, index) => (
        <polygon
          key={`base-${index}`}
          data-solid-base={index}
          points={pointString(polygon)}
          fill={index === 0 ? '#dbeafe' : '#bfdbfe'}
          fillOpacity={index === 0 ? 0.58 : 0.78}
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      ))}
      {layout.lateralEdges.map(([start, end], index) => (
        <line
          key={`lateral-${index}`}
          data-solid-lateral-edge={index}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke="#1d4ed8"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
      {layout.vertices.map((point, index) => (
        <circle
          key={`vertex-${index}`}
          data-solid-vertex={index}
          cx={point.x}
          cy={point.y}
          r="3.5"
          fill="#1e3a8a"
        />
      ))}
    </svg>
  )
}

export interface PrismNetFace {
  x: number
  y: number
  width: number
  height: number
}

export interface PrismNetLayout {
  lateralFaces: PrismNetFace[]
  basePolygons: Point[][]
}

export function buildPrismNetLayout(
  sourceBaseSides: number,
  sourceLateralFaces = sourceBaseSides,
  sourceBaseCount = 2
): PrismNetLayout {
  const baseSides = boundedSideCount(sourceBaseSides)
  const lateralFaceCount = Math.max(1, Math.min(9, Math.round(sourceLateralFaces)))
  const baseCount = Math.max(0, Math.min(2, Math.round(sourceBaseCount)))
  const faceWidth = Math.min(38, 288 / lateralFaceCount)
  const faceHeight = 60
  const stripWidth = faceWidth * lateralFaceCount
  const stripX = (320 - stripWidth) / 2
  const stripY = 75
  const lateralFaces = Array.from({ length: lateralFaceCount }, (_, index) => ({
    x: stripX + index * faceWidth,
    y: stripY,
    width: faceWidth,
    height: faceHeight,
  }))
  const radiusX = Math.min(30, Math.max(18, faceWidth * 0.78))
  const radiusY = Math.min(26, Math.max(16, faceWidth * 0.62))
  const attachmentIndexes = [
    Math.min(1, lateralFaceCount - 1),
    Math.max(0, lateralFaceCount - 2),
  ]
  const basePolygons = Array.from({ length: baseCount }, (_, index) => {
    const face = lateralFaces[attachmentIndexes[index]]
    return regularPolygonPoints(
      baseSides,
      face.x + face.width / 2,
      index === 0 ? 47 : 163,
      radiusX,
      radiusY
    )
  })

  return { lateralFaces, basePolygons }
}

function PrismNetVisual({ visual }: {
  visual: Extract<GeometryVisual, { type: 'prism-net' }>
}) {
  const baseSides = boundedSideCount(visual.baseSides)
  const layout = buildPrismNetLayout(
    baseSides,
    visual.lateralFaces ?? baseSides,
    visual.baseCount ?? 2
  )
  const solidName = `${polygonPrefixes[baseSides]}각기둥`

  return (
    <svg
      viewBox="0 0 320 210"
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label={`${solidName} 전개도`}
    >
      {layout.lateralFaces.map((face, index) => (
        <rect
          key={`face-${index}`}
          data-net-lateral-face={index}
          x={face.x}
          y={face.y}
          width={face.width}
          height={face.height}
          fill="#e0f2fe"
          stroke="#0284c7"
          strokeWidth="2.5"
        />
      ))}
      {layout.basePolygons.map((polygon, index) => (
        <polygon
          key={`base-${index}`}
          data-net-base={index}
          points={pointString(polygon)}
          fill="#dcfce7"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

type RoundSolidKind = Extract<GeometryVisual, { type: 'round-solid' }>['kind']

export interface RoundSolidCopyLayout {
  x: number
  y: number
  width: number
  height: number
}

export interface RoundSolidLayout {
  kind: RoundSolidKind
  copies: RoundSolidCopyLayout[]
}

function boundedCopyCount(value: number | undefined): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.min(6, Math.round(value!)))
}

function buildCopyBoxes(sourceCopies: number | undefined): RoundSolidCopyLayout[] {
  const copies = boundedCopyCount(sourceCopies)
  if (copies === 1) {
    return [{ x: 80, y: 20, width: 160, height: 160 }]
  }
  if (copies === 2) {
    return [
      { x: 35, y: 45, width: 110, height: 110 },
      { x: 175, y: 45, width: 110, height: 110 },
    ]
  }
  if (copies === 3) {
    return Array.from({ length: 3 }, (_, index) => ({
      x: 12 + index * 107,
      y: 55,
      width: 82,
      height: 90,
    }))
  }
  const columns = Math.min(3, copies)
  const rows = Math.ceil(copies / columns)
  const cellWidth = 96
  const cellHeight = 86
  const totalWidth = columns * cellWidth
  const totalHeight = rows * cellHeight
  const startX = (320 - totalWidth) / 2
  const startY = (200 - totalHeight) / 2

  return Array.from({ length: copies }, (_, index) => ({
    x: startX + (index % columns) * cellWidth + 14,
    y: startY + Math.floor(index / columns) * cellHeight + 8,
    width: 68,
    height: 70,
  }))
}

export function buildRoundSolidLayout(
  kind: RoundSolidKind,
  copies = 1
): RoundSolidLayout {
  return {
    kind,
    copies: buildCopyBoxes(copies),
  }
}

const roundSolidNames: Record<RoundSolidKind, string> = {
  cylinder: '원기둥',
  cone: '원뿔',
  sphere: '구',
}

function RoundSolidGlyph({
  kind,
  copy,
  index,
}: {
  kind: RoundSolidKind
  copy: RoundSolidCopyLayout
  index: number
}) {
  const { x, y, width, height } = copy
  const centerX = x + width / 2

  if (kind === 'cylinder') {
    return (
      <g data-round-copy={index}>
        <rect
          data-round-curved-surface={index}
          x={x + 8}
          y={y + 13}
          width={width - 16}
          height={height - 26}
          fill="#bae6fd"
          stroke="#0284c7"
          strokeWidth="2.5"
        />
        <ellipse
          data-round-base={`${index}-top`}
          cx={centerX}
          cy={y + 13}
          rx={(width - 16) / 2}
          ry="9"
          fill="#e0f2fe"
          stroke="#0284c7"
          strokeWidth="2.5"
        />
        <ellipse
          data-round-base={`${index}-bottom`}
          cx={centerX}
          cy={y + height - 13}
          rx={(width - 16) / 2}
          ry="9"
          fill="#7dd3fc"
          stroke="#0284c7"
          strokeWidth="2.5"
        />
      </g>
    )
  }

  if (kind === 'cone') {
    const apexY = y + 5
    const baseY = y + height - 13
    const radius = (width - 14) / 2
    return (
      <g data-round-copy={index}>
        <path
          data-round-curved-surface={index}
          d={`M ${centerX} ${apexY} L ${centerX - radius} ${baseY} A ${radius} 9 0 0 0 ${centerX + radius} ${baseY} Z`}
          fill="#fed7aa"
          stroke="#ea580c"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <ellipse
          data-round-base={index}
          cx={centerX}
          cy={baseY}
          rx={radius}
          ry="9"
          fill="#ffedd5"
          stroke="#ea580c"
          strokeWidth="2.5"
        />
        <circle
          data-round-vertex={index}
          cx={centerX}
          cy={apexY}
          r="3.5"
          fill="#9a3412"
        />
      </g>
    )
  }

  const radius = Math.min(width, height) / 2 - 5
  const centerY = y + height / 2
  return (
    <g data-round-copy={index}>
      <circle
        data-round-curved-surface={index}
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="#ddd6fe"
        stroke="#7c3aed"
        strokeWidth="2.5"
      />
      <ellipse
        cx={centerX}
        cy={centerY}
        rx={radius}
        ry={radius * 0.34}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="1.8"
        strokeDasharray="4 3"
      />
      <path
        d={`M ${centerX - radius * 0.72} ${centerY - radius * 0.72} A ${radius} ${radius} 0 0 0 ${centerX + radius * 0.72} ${centerY + radius * 0.72}`}
        fill="none"
        stroke="#ede9fe"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>
  )
}

function RoundSolidVisual({ visual }: {
  visual: Extract<GeometryVisual, { type: 'round-solid' }>
}) {
  const layout = buildRoundSolidLayout(visual.kind, visual.copies)
  const countLabel = layout.copies.length === 1 ? '' : ` ${layout.copies.length}개`

  return (
    <svg
      viewBox="0 0 320 200"
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label={`${roundSolidNames[visual.kind]}${countLabel} 모형`}
    >
      {layout.copies.map((copy, index) => (
        <RoundSolidGlyph
          key={`${visual.kind}-${index}`}
          kind={visual.kind}
          copy={copy}
          index={index}
        />
      ))}
    </svg>
  )
}

export interface CylinderNetCircle {
  cx: number
  cy: number
  r: number
  copyIndex: number
}

export interface CylinderNetRectangle {
  x: number
  y: number
  width: number
  height: number
  copyIndex: number
}

export interface CylinderNetLayout {
  copies: RoundSolidCopyLayout[]
  circles: CylinderNetCircle[]
  rectangles: CylinderNetRectangle[]
}

export function buildCylinderNetLayout(
  sourceCopies = 1,
  sourceCircleCount = 2,
  sourceRectangleCount = 1
): CylinderNetLayout {
  const copies = buildCopyBoxes(sourceCopies)
  const circleCount = Math.max(0, Math.min(3, Math.round(sourceCircleCount)))
  const rectangleCount = Math.max(0, Math.min(2, Math.round(sourceRectangleCount)))
  const circles: CylinderNetCircle[] = []
  const rectangles: CylinderNetRectangle[] = []

  copies.forEach((copy, copyIndex) => {
    const centerX = copy.x + copy.width / 2
    const centerY = copy.y + copy.height / 2
    const totalRectangleWidth = Math.min(110, copy.width * 0.72)
    const rectangleWidth = totalRectangleWidth / Math.max(rectangleCount, 1)
    const rectangleHeight = Math.min(55, copy.height * 0.34)
    const rectangleX = centerX - totalRectangleWidth / 2
    const rectangleY = centerY - rectangleHeight / 2
    for (let index = 0; index < rectangleCount; index += 1) {
      rectangles.push({
        x: rectangleX + index * rectangleWidth,
        y: rectangleY,
        width: rectangleWidth,
        height: rectangleHeight,
        copyIndex,
      })
    }
    const circleRadius = Math.min(18, copy.width * 0.12, copy.height * 0.12)
    const circlePositions = [
      { cx: centerX - totalRectangleWidth * 0.24, cy: rectangleY - circleRadius - 3 },
      { cx: centerX + totalRectangleWidth * 0.24, cy: rectangleY + rectangleHeight + circleRadius + 3 },
      { cx: centerX + totalRectangleWidth * 0.46, cy: rectangleY - circleRadius - 3 },
    ]
    for (let index = 0; index < circleCount; index += 1) {
      circles.push({
        ...circlePositions[index],
        r: circleRadius,
        copyIndex,
      })
    }
  })

  return { copies, circles, rectangles }
}

function CylinderNetVisual({ visual }: {
  visual: Extract<GeometryVisual, { type: 'cylinder-net' }>
}) {
  const layout = buildCylinderNetLayout(
    visual.copies,
    visual.circleCount ?? 2,
    visual.rectangleCount ?? 1
  )
  const countLabel = layout.copies.length === 1 ? '' : ` ${layout.copies.length}개`

  return (
    <svg
      viewBox="0 0 320 200"
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label={`원기둥 전개도${countLabel}`}
    >
      {layout.copies.map((copy, index) => (
        <g key={`copy-${index}`} data-cylinder-net-copy={index}>
          {layout.rectangles
            .filter((rectangle) => rectangle.copyIndex === index)
            .map((rectangle, rectangleIndex) => (
              <rect
                key={`rectangle-${rectangleIndex}`}
                data-cylinder-net-rectangle={`${index}-${rectangleIndex}`}
                x={rectangle.x}
                y={rectangle.y}
                width={rectangle.width}
                height={rectangle.height}
                fill="#e0f2fe"
                stroke="#0284c7"
                strokeWidth="2"
              />
            ))}
          {layout.circles
            .filter((circle) => circle.copyIndex === index)
            .map((circle, circleIndex) => (
              <circle
                key={`circle-${circleIndex}`}
                data-cylinder-net-circle={`${index}-${circleIndex}`}
                cx={circle.cx}
                cy={circle.cy}
                r={circle.r}
                fill="#dcfce7"
                stroke="#16a34a"
                strokeWidth="2"
              />
            ))}
        </g>
      ))}
    </svg>
  )
}

type HeightGrid = number[][]

export interface CubeViews {
  totalCubes: number
  topOccupied: boolean[][]
  frontHeights: number[]
  sideHeights: number[]
}

function normalizeHeightGrid(source: HeightGrid): HeightGrid {
  const rowCount = Math.max(1, Math.min(3, source.length || 1))
  const columnCount = Math.max(
    1,
    Math.min(3, ...source.slice(0, rowCount).map((row) => row.length || 1))
  )
  return Array.from({ length: rowCount }, (_, rowIndex) => (
    Array.from({ length: columnCount }, (_, columnIndex) => {
      const value = source[rowIndex]?.[columnIndex]
      return Number.isFinite(value)
        ? Math.max(0, Math.min(6, Math.round(value)))
        : 0
    })
  ))
}

export function deriveCubeViews(source: HeightGrid): CubeViews {
  const heights = normalizeHeightGrid(source)
  const columnCount = heights[0].length
  const totalCubes = heights.flat().reduce((sum, height) => sum + height, 0)
  const topOccupied = heights.map((row) => row.map((height) => height > 0))
  const frontHeights = Array.from({ length: columnCount }, (_, columnIndex) => (
    Math.max(...heights.map((row) => row[columnIndex]))
  ))
  const sideHeights = heights.map((row) => Math.max(...row))
  return { totalCubes, topOccupied, frontHeights, sideHeights }
}

export interface CubeLayoutItem {
  x: number
  y: number
  z: number
  top: Point[]
  left: Point[]
  right: Point[]
}

export interface CubeStackLayout {
  heights: HeightGrid
  cubes: CubeLayoutItem[]
}

export function buildCubeStackLayout(source: HeightGrid): CubeStackLayout {
  const heights = normalizeHeightGrid(source)
  const halfWidth = 22
  const halfHeight = 10
  const vertical = 18
  const cubes: CubeLayoutItem[] = []

  heights.forEach((row, y) => {
    row.forEach((height, x) => {
      for (let z = 0; z < height; z += 1) {
        const centerX = 160 + (x - y) * 24
        const topY = 145 + (x + y) * 10 - (z + 1) * vertical
        const top = [
          { x: centerX, y: topY },
          { x: centerX + halfWidth, y: topY + halfHeight },
          { x: centerX, y: topY + halfHeight * 2 },
          { x: centerX - halfWidth, y: topY + halfHeight },
        ]
        const left = [
          top[3],
          top[2],
          { x: top[2].x, y: top[2].y + vertical },
          { x: top[3].x, y: top[3].y + vertical },
        ]
        const right = [
          top[1],
          top[2],
          { x: top[2].x, y: top[2].y + vertical },
          { x: top[1].x, y: top[1].y + vertical },
        ]
        cubes.push({ x, y, z, top, left, right })
      }
    })
  })
  cubes.sort((left, right) => (
    left.x + left.y - (right.x + right.y) ||
    left.z - right.z ||
    left.y - right.y
  ))
  return { heights, cubes }
}

function CubeStackModel({ heights }: { heights: HeightGrid }) {
  const layout = buildCubeStackLayout(heights)
  return (
    <svg
      viewBox="0 0 320 220"
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label="쌓기나무 입체도형"
    >
      {layout.cubes.map((cube, index) => (
        <g key={`${cube.x}-${cube.y}-${cube.z}`} data-stack-cube={index}>
          <polygon
            points={pointString(cube.left)}
            fill="#93c5fd"
            stroke="#2563eb"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <polygon
            points={pointString(cube.right)}
            fill="#60a5fa"
            stroke="#2563eb"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <polygon
            points={pointString(cube.top)}
            fill="#dbeafe"
            stroke="#2563eb"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </svg>
  )
}

function TopProjection({
  occupied,
  originX,
  originY,
  cellSize,
}: {
  occupied: boolean[][]
  originX: number
  originY: number
  cellSize: number
}) {
  return <>{occupied.flatMap((row, rowIndex) => row.map((isOccupied, columnIndex) => (
    <rect
      key={`${rowIndex}-${columnIndex}`}
      {...(isOccupied ? { 'data-top-occupied': `${rowIndex}-${columnIndex}` } : {})}
      x={originX + columnIndex * cellSize}
      y={originY + rowIndex * cellSize}
      width={cellSize}
      height={cellSize}
      fill={isOccupied ? '#bfdbfe' : '#f8fafc'}
      stroke="#64748b"
      strokeWidth="1.5"
    />
  )))}</>
}

function ElevationProjection({
  heights,
  originX,
  baseY,
  cellSize,
  dataAttribute,
}: {
  heights: number[]
  originX: number
  baseY: number
  cellSize: number
  dataAttribute: 'front' | 'side'
}) {
  return <>{heights.flatMap((height, columnIndex) => (
    Array.from({ length: height }, (_, level) => (
      <rect
        key={`${columnIndex}-${level}`}
        {...(dataAttribute === 'front'
          ? { 'data-front-cell': `${columnIndex}-${level}` }
          : { 'data-side-cell': `${columnIndex}-${level}` })}
        x={originX + columnIndex * cellSize}
        y={baseY - (level + 1) * cellSize}
        width={cellSize}
        height={cellSize}
        fill={dataAttribute === 'front' ? '#bae6fd' : '#ddd6fe'}
        stroke={dataAttribute === 'front' ? '#0284c7' : '#7c3aed'}
        strokeWidth="1.5"
      />
    ))
  ))}</>
}

function CubeViewsVisual({
  heights,
  mode,
}: {
  heights: HeightGrid
  mode: Exclude<Extract<GeometryVisual, { type: 'cube-stack' }>['mode'], 'stack'>
}) {
  const views = deriveCubeViews(heights)
  const panels = mode === 'all-views'
    ? [
        { type: 'top' as const, x: 10, label: '위' },
        { type: 'front' as const, x: 130, label: '앞' },
        { type: 'side' as const, x: 250, label: '옆' },
      ]
    : [{ type: mode, x: 130, label: mode === 'top' ? '위' : mode === 'front' ? '앞' : '옆' }]

  return (
    <svg
      viewBox="0 0 360 180"
      className="mx-auto w-full max-w-lg"
      role="img"
      aria-label={mode === 'all-views' ? '위·앞·옆에서 본 모양' : `${panels[0].label}에서 본 모양`}
    >
      {panels.map((panel) => {
        const cellSize = 22
        const width = panel.type === 'top'
          ? views.topOccupied[0].length * cellSize
          : (panel.type === 'front' ? views.frontHeights.length : views.sideHeights.length) * cellSize
        const originX = panel.x + (100 - width) / 2
        return (
          <g key={panel.type}>
            <text x={panel.x + 50} y="22" textAnchor="middle" fontSize="14" fontWeight="700" fill="#334155">
              {panel.label}
            </text>
            {panel.type === 'top' && (
              <TopProjection
                occupied={views.topOccupied}
                originX={originX}
                originY={48}
                cellSize={cellSize}
              />
            )}
            {panel.type === 'front' && (
              <ElevationProjection
                heights={views.frontHeights}
                originX={originX}
                baseY={150}
                cellSize={cellSize}
                dataAttribute="front"
              />
            )}
            {panel.type === 'side' && (
              <ElevationProjection
                heights={views.sideHeights}
                originX={originX}
                baseY={150}
                cellSize={cellSize}
                dataAttribute="side"
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

function CubeStackVisual({ visual }: {
  visual: Extract<GeometryVisual, { type: 'cube-stack' }>
}) {
  if (visual.mode === 'stack') return <CubeStackModel heights={visual.heights} />
  return <CubeViewsVisual heights={visual.heights} mode={visual.mode} />
}

type CircleMeasurementVisualValue = Extract<GeometryVisual, {
  type: 'circle-measurement'
}>

export interface CircleMeasurementModel {
  radius: number
  diameter: number
  circumference: number
  area: number
  copies: number
  innerRadius?: number
}

function roundCircleValue(value: number): number {
  return Math.round(value * 100) / 100
}

export function buildCircleMeasurementModel(
  visual: CircleMeasurementVisualValue
): CircleMeasurementModel {
  const radius = Math.max(0.5, Math.min(20, positive(visual.radius)))
  const pi = Math.max(3, Math.min(3.2, positive(visual.pi, 3.14)))
  const copies = Math.max(1, Math.min(4, Math.round(positive(visual.copies, 1))))
  const innerRadius = typeof visual.innerRadius === 'number'
    ? Math.max(0, Math.min(radius - 0.25, visual.innerRadius))
    : undefined
  return {
    radius,
    diameter: roundCircleValue(radius * 2),
    circumference: roundCircleValue(radius * 2 * pi),
    area: roundCircleValue(radius * radius * pi),
    copies,
    ...(innerRadius !== undefined ? { innerRadius } : {}),
  }
}

function formatCircleValue(value: number): string {
  return Number.isInteger(value) ? String(value) : String(roundCircleValue(value))
}

function CircleMeasurementVisual({ visual }: {
  visual: CircleMeasurementVisualValue
}) {
  const model = buildCircleMeasurementModel(visual)
  const unit = visual.unit ?? 'cm'
  const positions = model.copies === 1
    ? [{ x: 180, y: 105 }]
    : model.copies === 2
      ? [{ x: 105, y: 105 }, { x: 255, y: 105 }]
      : model.copies === 3
        ? [{ x: 70, y: 105 }, { x: 180, y: 105 }, { x: 290, y: 105 }]
        : [{ x: 105, y: 70 }, { x: 255, y: 70 }, { x: 105, y: 155 }, { x: 255, y: 155 }]
  const pixelRadius = model.copies === 1 ? 62 : model.copies === 2 ? 48 : 36
  const labelRadius = visual.measureLabel === 'radius' || visual.measureLabel === 'both'
  const labelDiameter = visual.measureLabel === 'diameter' || visual.measureLabel === 'both'
  const ariaLabel = visual.focus === 'pi'
    ? '원주율 측정 원'
    : visual.innerRadius !== undefined
      ? '두 원 사이의 영역'
      : visual.focus === 'area'
        ? '넓이를 구할 원'
        : visual.focus === 'circumference'
          ? '원주를 구할 원'
          : '원주와 넓이를 비교할 원'

  return (
    <svg
      viewBox="0 0 360 220"
      className="mx-auto w-full max-w-lg"
      role="img"
      aria-label={ariaLabel}
    >
      {positions.map((position, index) => {
        const innerPixelRadius = model.innerRadius === undefined
          ? undefined
          : pixelRadius * model.innerRadius / model.radius
        return (
          <g key={index} data-circle-copy={index}>
            <circle
              cx={position.x}
              cy={position.y}
              r={pixelRadius}
              fill={visual.focus === 'area' || visual.focus === 'composite' ? '#dbeafe' : '#f8fafc'}
              stroke={visual.focus === 'circumference' || visual.focus === 'pi' ? '#2563eb' : '#0284c7'}
              strokeWidth={visual.focus === 'circumference' || visual.focus === 'pi' ? 5 : 3}
              data-circle-outer=""
            />
            {innerPixelRadius !== undefined && (
              <circle
                cx={position.x}
                cy={position.y}
                r={innerPixelRadius}
                fill="#f8fafc"
                stroke="#7c3aed"
                strokeWidth="3"
                data-circle-inner=""
              />
            )}
            {labelDiameter && index === 0 && (
              <>
                <line
                  x1={position.x - pixelRadius}
                  y1={position.y}
                  x2={position.x + pixelRadius}
                  y2={position.y}
                  stroke="#475569"
                  strokeWidth="2"
                  data-circle-diameter=""
                />
                <text x={position.x} y={position.y - 9} textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">
                  지름 {formatCircleValue(model.diameter)}{unit}
                </text>
              </>
            )}
            {labelRadius && index === 0 && (
              <>
                <line
                  x1={position.x}
                  y1={position.y}
                  x2={position.x + pixelRadius}
                  y2={position.y}
                  stroke="#475569"
                  strokeWidth="2"
                  data-circle-radius=""
                />
                <text x={position.x + pixelRadius / 2} y={position.y - 9} textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">
                  반지름 {formatCircleValue(model.radius)}{unit}
                </text>
              </>
            )}
          </g>
        )
      })}
      {visual.focus === 'pi' && (
        <text x="180" y="205" textAnchor="middle" fontSize="14" fontWeight="700" fill="#334155">
          측정한 원주 {formatCircleValue(model.circumference)}{unit}
        </text>
      )}
      {model.innerRadius !== undefined && (
        <text x="180" y="205" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">
          바깥 반지름 {formatCircleValue(model.radius)}{unit} · 안쪽 반지름 {formatCircleValue(model.innerRadius)}{unit}
        </text>
      )}
      {model.copies > 1 && (
        <text x="180" y="215" textAnchor="middle" fontSize="13" fontWeight="700" fill="#475569">
          같은 크기의 원 {model.copies}개
        </text>
      )}
    </svg>
  )
}

export default function GeometryProblemVisual({ visual, showAnswer = false }: GeometryProblemVisualProps) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid={`geometry-visual-${visual.type}`}>
      {visual.type === 'polygon' && <PolygonVisual visual={visual} showAnswer={showAnswer} />}
      {visual.type === 'congruence' && <CongruenceVisual visual={visual} showAnswer={showAnswer} />}
      {visual.type === 'symmetry' && <SymmetryVisual visual={visual} showAnswer={showAnswer} />}
      {visual.type === 'cuboid' && <CuboidVisual visual={visual} showAnswer={showAnswer} />}
      {visual.type === 'cuboid-net' && <CuboidNetVisual visual={visual} showAnswer={showAnswer} />}
      {visual.type === 'poly-solid' && <PolySolidVisual visual={visual} />}
      {visual.type === 'prism-net' && <PrismNetVisual visual={visual} />}
      {visual.type === 'round-solid' && <RoundSolidVisual visual={visual} />}
      {visual.type === 'cylinder-net' && <CylinderNetVisual visual={visual} />}
      {visual.type === 'cube-stack' && <CubeStackVisual visual={visual} />}
      {visual.type === 'circle-measurement' && <CircleMeasurementVisual visual={visual} />}
    </div>
  )
}
