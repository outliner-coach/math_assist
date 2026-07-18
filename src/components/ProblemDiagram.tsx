'use client'

import React from 'react'
import type { GeometryVisual, ProblemVisual } from '@/lib/types'

interface ProblemDiagramProps {
  visual: ProblemVisual
}

const stroke = '#334155'
const fill = '#dbeafe'
const accent = '#2563eb'

const problemVisualTypes = new Set<ProblemVisual['type']>([
  'basic_shape',
  'l_shape',
  'overlap_rectangles',
  'rectangle_square',
  'three_shape_overlap'
])

export function isProblemVisual(visual: GeometryVisual): visual is ProblemVisual {
  return problemVisualTypes.has(visual.type as ProblemVisual['type'])
}

function DimensionLabel({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <text x={x} y={y} textAnchor="middle" className="fill-slate-700 text-[14px] font-bold">
      {children}
    </text>
  )
}

export default function ProblemDiagram({ visual }: ProblemDiagramProps) {
  if (visual.type === 'basic_shape') {
    const { shape, width, height, unit } = visual.props
    const scale = Math.min(220 / width, 130 / height)
    const renderedWidth = width * scale
    const renderedHeight = height * scale
    const left = 180 - renderedWidth / 2
    const right = 180 + renderedWidth / 2
    const bottom = 170
    const top = bottom - renderedHeight
    const skew = Math.min(34, renderedWidth * 0.18)
    const shapeNode = shape === 'rectangle'
      ? <rect x={left} y={top} width={renderedWidth} height={renderedHeight} rx="3" fill={fill} stroke={stroke} strokeWidth="3" />
      : shape === 'triangle'
        ? <polygon points={`180,${top} ${left},${bottom} ${right},${bottom}`} fill={fill} stroke={stroke} strokeWidth="3" />
        : <polygon points={`${left + skew},${top} ${right},${top} ${right - skew},${bottom} ${left},${bottom}`} fill={fill} stroke={stroke} strokeWidth="3" />

    return (
      <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid={`problem-diagram-${shape}`}>
        <svg viewBox="0 0 360 220" role="img" aria-label={`${shape}의 밑변 ${width}${unit}, 높이 ${height}${unit}`} className="mx-auto w-full max-w-md">
          {shapeNode}
          {shape !== 'rectangle' && (
            <line x1="180" y1={top} x2="180" y2={bottom} stroke={accent} strokeWidth="2" strokeDasharray="6 5" />
          )}
          <line x1={left} y1="192" x2={right} y2="192" stroke={stroke} strokeWidth="2" />
          <line x1={left - 22} y1={top} x2={left - 22} y2={bottom} stroke={stroke} strokeWidth="2" />
          <DimensionLabel x={180} y={213}>{width} {unit}</DimensionLabel>
          <text x={left - 38} y={(top + bottom) / 2} textAnchor="middle" transform={`rotate(-90 ${left - 38} ${(top + bottom) / 2})`} className="fill-slate-700 text-[14px] font-bold">
            {height} {unit}
          </text>
        </svg>
      </figure>
    )
  }

  if (visual.type === 'l_shape') {
    const { width, height, notchWidth, notchHeight, unit } = visual.props
    const scale = Math.min(215 / width, 145 / height)
    const renderedWidth = width * scale
    const renderedHeight = height * scale
    const renderedNotchWidth = notchWidth * scale
    const renderedNotchHeight = notchHeight * scale
    const left = 75
    const top = 35
    const right = left + renderedWidth
    const bottom = top + renderedHeight
    const notchLeft = right - renderedNotchWidth
    const notchBottom = top + renderedNotchHeight
    return (
      <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid="problem-diagram-l-shape">
        <svg viewBox="0 0 360 230" role="img" aria-label={`가로 ${width}${unit}, 세로 ${height}${unit}인 ㄴ자 도형`} className="mx-auto w-full max-w-md">
          <path d={`M${left} ${top} H${notchLeft} V${notchBottom} H${right} V${bottom} H${left} Z`} fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <line x1={left} y1="205" x2={right} y2="205" stroke={stroke} strokeWidth="2" />
          <line x1="50" y1={top} x2="50" y2={bottom} stroke={stroke} strokeWidth="2" />
          <DimensionLabel x={(left + right) / 2} y={225}>{width} {unit}</DimensionLabel>
          <text x="34" y="108" textAnchor="middle" transform="rotate(-90 34 108)" className="fill-slate-700 text-[14px] font-bold">
            {height} {unit}
          </text>
          <DimensionLabel x={(notchLeft + right) / 2} y={notchBottom - 8}>{notchWidth} {unit}</DimensionLabel>
          <text x={notchLeft + 8} y={(top + notchBottom) / 2} className="fill-slate-500 text-[12px] font-semibold">{notchHeight} {unit}</text>
        </svg>
      </figure>
    )
  }

  if (visual.type === 'overlap_rectangles') {
    const { totalWidth, overlapWidth, overlapArea, unit } = visual.props
    const sheetWidth = (totalWidth + overlapWidth) / 2
    const sheetHeight = overlapArea / overlapWidth
    const scale = Math.min(280 / totalWidth, 120 / sheetHeight)
    const renderedSheetWidth = sheetWidth * scale
    const renderedHeight = sheetHeight * scale
    const renderedOverlap = overlapWidth * scale
    const firstX = 50
    const secondX = firstX + renderedSheetWidth - renderedOverlap
    const top = 50
    return (
      <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid="problem-diagram-overlap-rectangles">
        <svg viewBox="0 0 380 260" role="img" aria-label={`전체 가로 ${totalWidth}${unit}, 겹친 가로 ${overlapWidth}${unit}인 직사각형 두 장`} className="mx-auto w-full max-w-md">
          <rect x={firstX} y={top} width={renderedSheetWidth} height={renderedHeight} fill="#bfdbfe" fillOpacity="0.75" stroke={stroke} strokeWidth="3" />
          <rect x={secondX} y={top} width={renderedSheetWidth} height={renderedHeight} fill="#99f6e4" fillOpacity="0.68" stroke={stroke} strokeWidth="3" />
          <rect x={secondX} y={top} width={renderedOverlap} height={renderedHeight} fill="#fbbf24" fillOpacity="0.55" stroke={accent} strokeWidth="2" strokeDasharray="5 4" />
          <DimensionLabel x={firstX + totalWidth * scale / 2} y={248}>전체 {totalWidth} {unit}</DimensionLabel>
          <DimensionLabel x={secondX + renderedOverlap / 2} y={top - 12}>겹친 가로 {overlapWidth} {unit}</DimensionLabel>
          <line x1={secondX + renderedOverlap / 2} y1={top + renderedHeight} x2={secondX + renderedOverlap / 2} y2={top + renderedHeight + 14} stroke={accent} strokeWidth="2" />
          <text x={secondX + renderedOverlap / 2} y={top + renderedHeight + 32} textAnchor="middle" className="fill-slate-800 text-[13px] font-bold">겹친 넓이 {overlapArea} {unit}²</text>
        </svg>
      </figure>
    )
  }

  if (visual.type === 'rectangle_square') {
    const { totalWidth, rectangleHeight, squareSide, totalArea, unit } = visual.props
    const rectangleWidth = totalWidth !== undefined
      ? totalWidth - squareSide
      : ((totalArea ?? 0) - squareSide * squareSide) / rectangleHeight
    const combinedWidth = rectangleWidth + squareSide
    const scale = Math.min(270 / combinedWidth, 140 / Math.max(rectangleHeight, squareSide))
    const left = 45
    const bottom = 185
    const rectanglePixelWidth = rectangleWidth * scale
    const rectanglePixelHeight = rectangleHeight * scale
    const squarePixelSide = squareSide * scale
    const joinX = left + rectanglePixelWidth
    const right = joinX + squarePixelSide
    return (
      <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid="problem-diagram-rectangle-square">
        <svg viewBox="0 0 380 245" role="img" aria-label={`높이 ${rectangleHeight}${unit}인 직사각형과 한 변 ${squareSide}${unit}인 정사각형을 붙인 도형`} className="mx-auto w-full max-w-md">
          <rect x={left} y={bottom - rectanglePixelHeight} width={rectanglePixelWidth} height={rectanglePixelHeight} fill="#bfdbfe" stroke={stroke} strokeWidth="3" />
          <rect x={joinX} y={bottom - squarePixelSide} width={squarePixelSide} height={squarePixelSide} fill="#ddd6fe" stroke={stroke} strokeWidth="3" />
          <line x1={joinX} y1={bottom - rectanglePixelHeight} x2={joinX} y2={bottom} stroke={accent} strokeWidth="4" />
          {totalWidth !== undefined && <>
            <line x1={left} y1="210" x2={right} y2="210" stroke={stroke} strokeWidth="2" />
            <DimensionLabel x={(left + right) / 2} y={235}>전체 {totalWidth} {unit}</DimensionLabel>
          </>}
          <text x={left - 16} y={bottom - rectanglePixelHeight / 2} textAnchor="middle" transform={`rotate(-90 ${left - 16} ${bottom - rectanglePixelHeight / 2})`} className="fill-slate-700 text-[14px] font-bold">
            {rectangleHeight} {unit}
          </text>
          <line x1={right + 12} y1={bottom - squarePixelSide} x2={right + 12} y2={bottom} stroke={stroke} strokeWidth="2" />
          <text x={right + 30} y={bottom - squarePixelSide / 2} textAnchor="middle" transform={`rotate(-90 ${right + 30} ${bottom - squarePixelSide / 2})`} className="fill-slate-700 text-[14px] font-bold">
            한 변 {squareSide} {unit}
          </text>
          {totalArea !== undefined && (
            <text x={(left + right) / 2} y="22" textAnchor="middle" className="fill-slate-700 text-[14px] font-bold">전체 넓이 {totalArea} {unit}²</text>
          )}
        </svg>
      </figure>
    )
  }

  const { shapeArea, exclusiveAreas, tripleOverlap, unit } = visual.props
  return (
    <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid="problem-diagram-three-shape-overlap">
      <svg viewBox="0 0 400 260" role="img" aria-label={`각 넓이가 ${shapeArea}${unit}²인 세 도형의 겹침`} className="mx-auto w-full max-w-md">
        <polygon points="75,75 215,45 240,185 95,205" fill="#93c5fd" fillOpacity="0.55" stroke={stroke} strokeWidth="3" />
        <polygon points="185,35 325,85 275,220 145,175" fill="#86efac" fillOpacity="0.5" stroke={stroke} strokeWidth="3" />
        <polygon points="75,170 190,70 330,175 205,235" fill="#fca5a5" fillOpacity="0.47" stroke={stroke} strokeWidth="3" />
        <text x="55" y="55" className="fill-slate-700 text-[13px] font-bold">각 도형 {shapeArea} {unit}²</text>
        <DimensionLabel x={105} y={125}>{exclusiveAreas[0]}</DimensionLabel>
        <DimensionLabel x={278} y={126}>{exclusiveAreas[1]}</DimensionLabel>
        <DimensionLabel x={185} y={215}>{exclusiveAreas[2]}</DimensionLabel>
        <circle cx="198" cy="136" r="25" fill="#fef3c7" stroke={accent} strokeWidth="2" />
        <text x="198" y="132" textAnchor="middle" className="fill-slate-700 text-[11px] font-bold">세 도형</text>
        <text x="198" y="149" textAnchor="middle" className="fill-slate-700 text-[12px] font-bold">{tripleOverlap} {unit}²</text>
      </svg>
    </figure>
  )
}
