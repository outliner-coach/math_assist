'use client'

import React from 'react'
import { geometryOptionIndex } from '@/lib/math'
import type { GeometryVisual, PolygonShape } from '@/lib/types'

interface GeometryProblemVisualProps {
  visual: GeometryVisual
  showAnswer?: boolean
}

const optionLabels = ['가', '나', '다', '라']

function MeasurementLabel({ x, y, value, unit = 'cm' }: { x: number; y: number; value?: number; unit?: string }) {
  if (value === undefined) return null
  return <text x={x} y={y} textAnchor="middle" fontSize="13" fill="#334155">{value}{unit}</text>
}

function PolygonVisual({ visual }: { visual: Extract<GeometryVisual, { type: 'polygon' }> }) {
  const { shape, a, b, c, height, unit = 'cm' } = visual
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
      {shape === 'rectangle' && <rect x="55" y="40" width="190" height="105" rx="3" {...common} />}
      {shape === 'square' && <rect x="85" y="30" width="130" height="130" rx="3" {...common} />}
      {shape === 'parallelogram' && <polygon points="80,145 235,145 210,45 55,45" {...common} />}
      {shape === 'triangle' && <polygon points="45,145 255,145 175,35" {...common} />}
      {shape === 'trapezoid' && <polygon points="50,145 250,145 210,45 90,45" {...common} />}
      {shape === 'rhombus' && <polygon points="150,25 245,95 150,165 55,95" {...common} />}

      {shape === 'rectangle' && <>
        <MeasurementLabel x={150} y={172} value={a} unit={unit} />
        <MeasurementLabel x={266} y={98} value={b} unit={unit} />
      </>}
      {shape === 'square' && <MeasurementLabel x={150} y={180} value={a} unit={unit} />}
      {shape === 'parallelogram' && <>
        <MeasurementLabel x={158} y={172} value={a} unit={unit} />
        <MeasurementLabel x={47} y={100} value={b} unit={unit} />
        <line x1="210" y1="45" x2="210" y2="145" stroke="#64748b" strokeDasharray="5 4" />
        <MeasurementLabel x={230} y={100} value={height} unit={unit} />
      </>}
      {shape === 'triangle' && visual.measurementMode === 'sides' && <>
        <MeasurementLabel x={150} y={172} value={a} unit={unit} />
        <MeasurementLabel x={90} y={88} value={b} unit={unit} />
        <MeasurementLabel x={225} y={92} value={c} unit={unit} />
      </>}
      {shape === 'triangle' && visual.measurementMode !== 'sides' && <>
        <MeasurementLabel x={150} y={172} value={a} unit={unit} />
        <line x1="175" y1="35" x2="175" y2="145" stroke="#64748b" strokeDasharray="5 4" />
        <MeasurementLabel x={196} y={95} value={height} unit={unit} />
      </>}
      {shape === 'trapezoid' && <>
        <MeasurementLabel x={150} y={36} value={a} unit={unit} />
        <MeasurementLabel x={150} y={172} value={b} unit={unit} />
        <line x1="210" y1="45" x2="210" y2="145" stroke="#64748b" strokeDasharray="5 4" />
        <MeasurementLabel x={230} y={100} value={height} unit={unit} />
        <MeasurementLabel x={62} y={100} value={c} unit={unit} />
      </>}
      {shape === 'rhombus' && <>
        <line x1="150" y1="25" x2="150" y2="165" stroke="#64748b" strokeDasharray="5 4" />
        <line x1="55" y1="95" x2="245" y2="95" stroke="#64748b" strokeDasharray="5 4" />
        <MeasurementLabel x={170} y={90} value={a} unit={unit} />
        <MeasurementLabel x={150} y={187} value={b} unit={unit} />
      </>}
    </svg>
  )
}

function CongruenceVisual({ visual, showAnswer }: { visual: Extract<GeometryVisual, { type: 'congruence' }>; showAnswer: boolean }) {
  const answer = geometryOptionIndex(1, visual.variant)
  const left = '55,35 120,55 105,135 35,120'
  const right = '195,35 265,65 245,140 175,115'
  const candidatePositions = [[205,28], [273,63], [250,158], [163,119]]
  const orderedLabels = candidatePositions.map((_, index) => optionLabels[(index + answer - 1) % 4])

  return (
    <svg viewBox="0 0 300 180" className="mx-auto w-full max-w-md" role="img" aria-label="합동인 두 사각형과 대응점">
      <polygon points={left} fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
      <polygon points={right} fill="#dcfce7" stroke="#16a34a" strokeWidth="3" />
      {['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'].map((label, index) => {
        const positions = [[45,28], [126,53], [112,153], [23,124]]
        return <text key={label} x={positions[index][0]} y={positions[index][1]} fontSize="14" fontWeight="700">{label}</text>
      })}
      {orderedLabels.map((label, index) => (
        <text key={`${label}-${index}`} x={candidatePositions[index][0]} y={candidatePositions[index][1]} fontSize="14" fontWeight="700">{label}</text>
      ))}
      <MeasurementLabel x={86} y={37} value={visual.a} unit={visual.unit} />
      <MeasurementLabel x={124} y={101} value={visual.b} unit={visual.unit} />
      <MeasurementLabel x={69} y={145} value={visual.c} unit={visual.unit} />
      <text x="82" y="174" textAnchor="middle" fontSize="12" fill="#475569">도형 1</text>
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

function CuboidVisual({ visual }: { visual: Extract<GeometryVisual, { type: 'cuboid' }> }) {
  const { width, height, depth, unit = 'cm' } = visual
  return (
    <svg viewBox="0 0 310 190" className="mx-auto w-full max-w-sm" role="img" aria-label="직육면체의 가로 세로 높이">
      <rect x="55" y="60" width="165" height="95" fill="#dbeafe" fillOpacity="0.65" stroke="#2563eb" strokeWidth="3" />
      <polygon points="55,60 100,30 265,30 220,60" fill="#eff6ff" stroke="#2563eb" strokeWidth="3" />
      <polygon points="220,60 265,30 265,125 220,155" fill="#bfdbfe" fillOpacity="0.8" stroke="#2563eb" strokeWidth="3" />
      <line x1="55" y1="155" x2="100" y2="125" stroke="#64748b" strokeDasharray="5 4" />
      <line x1="100" y1="125" x2="265" y2="125" stroke="#64748b" strokeDasharray="5 4" />
      <line x1="100" y1="30" x2="100" y2="125" stroke="#64748b" strokeDasharray="5 4" />
      <MeasurementLabel x={138} y={181} value={width} unit={unit} />
      <MeasurementLabel x={34} y={111} value={height} unit={unit} />
      <MeasurementLabel x={258} y={159} value={depth} unit={unit} />
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
      {visual.type === 'polygon' && <PolygonVisual visual={visual} />}
      {visual.type === 'congruence' && <CongruenceVisual visual={visual} showAnswer={showAnswer} />}
      {visual.type === 'symmetry' && <SymmetryVisual visual={visual} showAnswer={showAnswer} />}
      {visual.type === 'cuboid' && <CuboidVisual visual={visual} />}
      {visual.type === 'cuboid-net' && <CuboidNetVisual visual={visual} showAnswer={showAnswer} />}
    </div>
  )
}
