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

function CuboidVisual({ visual, showAnswer }: {
  visual: Extract<GeometryVisual, { type: 'cuboid' }>
  showAnswer: boolean
}) {
  const { width, height, depth, unit = 'cm' } = visual
  return (
    <svg viewBox="0 0 310 190" className="mx-auto w-full max-w-sm" role="img" aria-label="직육면체의 가로 세로 높이">
      <rect x="55" y="60" width="165" height="95" fill="#dbeafe" fillOpacity="0.65" stroke="#2563eb" strokeWidth="3" />
      <polygon points="55,60 100,30 265,30 220,60" fill="#eff6ff" stroke="#2563eb" strokeWidth="3" />
      <polygon points="220,60 265,30 265,125 220,155" fill="#bfdbfe" fillOpacity="0.8" stroke="#2563eb" strokeWidth="3" />
      <line x1="55" y1="155" x2="100" y2="125" stroke="#64748b" strokeDasharray="5 4" />
      <line x1="100" y1="125" x2="265" y2="125" stroke="#64748b" strokeDasharray="5 4" />
      <line x1="100" y1="30" x2="100" y2="125" stroke="#64748b" strokeDasharray="5 4" />
      <MeasurementLabel x={138} y={181} value={width} unit={unit} hidden={visual.unknownMeasurement === 'width'} showAnswer={showAnswer} />
      <MeasurementLabel x={34} y={111} value={height} unit={unit} hidden={visual.unknownMeasurement === 'height'} showAnswer={showAnswer} />
      <MeasurementLabel x={258} y={159} value={depth} unit={unit} hidden={visual.unknownMeasurement === 'depth'} showAnswer={showAnswer} />
    </svg>
  )
}

const validNet = [[1, 1], [0, 1], [2, 1], [1, 0], [1, 2], [1, 3]]
const invalidNets = [
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]],
  [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [2, 2]],
]

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
        {visual.focusFace && <text x="15" y="195" fontSize="12" fill="#475569">기준 면: {visual.focusFace}</text>}
      </svg>
    )
  }

  const answer = geometryOptionIndex(2, visual.variant)
  return (
    <svg viewBox="0 0 360 230" className="mx-auto w-full max-w-lg" role="img" aria-label="직육면체 전개도 보기 네 개">
      {optionLabels.map((label, index) => {
        const col = index % 2
        const row = Math.floor(index / 2)
        const cells = index + 1 === answer ? validNet : invalidNets[index % invalidNets.length]
        return <g key={label}>
          <text x={15 + col * 180} y={20 + row * 110} fontWeight="700">{label}</text>
          <NetCells cells={cells} x={35 + col * 180} y={25 + row * 110} size={22} />
          {showAnswer && index + 1 === answer && <rect x={8 + col * 180} y={3 + row * 110} width="165" height="103" rx="8" fill="none" stroke="#16a34a" strokeWidth="3" />}
        </g>
      })}
      {showAnswer && <text x="180" y="225" textAnchor="middle" fill="#15803d" fontWeight="700">정답 전개도를 초록색으로 표시했어요.</text>}
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
    </div>
  )
}
