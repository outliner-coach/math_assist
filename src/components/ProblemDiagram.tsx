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
    const { shape, width, height } = visual.props
    const shapeNode = shape === 'rectangle'
      ? <rect x="70" y="40" width="220" height="125" rx="3" fill={fill} stroke={stroke} strokeWidth="3" />
      : shape === 'triangle'
        ? <polygon points="180,35 65,170 295,170" fill={fill} stroke={stroke} strokeWidth="3" />
        : <polygon points="110,40 300,40 255,165 65,165" fill={fill} stroke={stroke} strokeWidth="3" />

    return (
      <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid={`problem-diagram-${shape}`}>
        <svg viewBox="0 0 360 220" role="img" aria-label={`${shape}의 밑변 ${width}cm, 높이 ${height}cm`} className="mx-auto w-full max-w-md">
          {shapeNode}
          {shape !== 'rectangle' && (
            <line x1="180" y1="38" x2="180" y2="170" stroke={accent} strokeWidth="2" strokeDasharray="6 5" />
          )}
          <line x1="70" y1="192" x2="290" y2="192" stroke={stroke} strokeWidth="2" />
          <line x1="48" y1="45" x2="48" y2="165" stroke={stroke} strokeWidth="2" />
          <DimensionLabel x={180} y={213}>{width} cm</DimensionLabel>
          <text x="35" y="105" textAnchor="middle" transform="rotate(-90 35 105)" className="fill-slate-700 text-[14px] font-bold">
            {height} cm
          </text>
        </svg>
      </figure>
    )
  }

  if (visual.type === 'l_shape') {
    const { width, height, notchWidth, notchHeight } = visual.props
    return (
      <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid="problem-diagram-l-shape">
        <svg viewBox="0 0 360 230" role="img" aria-label={`가로 ${width}cm, 세로 ${height}cm인 ㄴ자 도형`} className="mx-auto w-full max-w-md">
          <path d="M75 35 H190 V100 H290 V180 H75 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <line x1="75" y1="205" x2="290" y2="205" stroke={stroke} strokeWidth="2" />
          <line x1="50" y1="35" x2="50" y2="180" stroke={stroke} strokeWidth="2" />
          <DimensionLabel x={182} y={225}>{width} cm</DimensionLabel>
          <text x="34" y="108" textAnchor="middle" transform="rotate(-90 34 108)" className="fill-slate-700 text-[14px] font-bold">
            {height} cm
          </text>
          <DimensionLabel x={241} y={92}>{notchWidth} cm</DimensionLabel>
          <text x="202" y="70" className="fill-slate-500 text-[12px] font-semibold">{notchHeight} cm</text>
        </svg>
      </figure>
    )
  }

  if (visual.type === 'overlap_rectangles') {
    const { totalWidth, overlapWidth, overlapArea } = visual.props
    return (
      <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid="problem-diagram-overlap-rectangles">
        <svg viewBox="0 0 380 230" role="img" aria-label={`전체 가로 ${totalWidth}cm, 겹친 가로 ${overlapWidth}cm인 직사각형 두 장`} className="mx-auto w-full max-w-md">
          <rect x="45" y="45" width="190" height="115" fill="#bfdbfe" fillOpacity="0.75" stroke={stroke} strokeWidth="3" />
          <rect x="145" y="70" width="190" height="115" fill="#99f6e4" fillOpacity="0.68" stroke={stroke} strokeWidth="3" />
          <rect x="145" y="70" width="90" height="90" fill="#fbbf24" fillOpacity="0.55" stroke={accent} strokeWidth="2" strokeDasharray="5 4" />
          <DimensionLabel x={190} y={215}>전체 {totalWidth} cm</DimensionLabel>
          <DimensionLabel x={190} y={63}>겹친 가로 {overlapWidth} cm</DimensionLabel>
          <text x="190" y="112" textAnchor="middle" className="fill-slate-800 text-[13px] font-bold">겹친 넓이</text>
          <text x="190" y="132" textAnchor="middle" className="fill-slate-800 text-[13px] font-bold">{overlapArea} cm²</text>
        </svg>
      </figure>
    )
  }

  if (visual.type === 'rectangle_square') {
    const { totalWidth, rectangleHeight, totalArea } = visual.props
    return (
      <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid="problem-diagram-rectangle-square">
        <svg viewBox="0 0 380 235" role="img" aria-label={`직사각형과 정사각형을 붙인 전체 가로 ${totalWidth}cm인 도형`} className="mx-auto w-full max-w-md">
          <rect x="45" y="80" width="135" height="95" fill="#bfdbfe" stroke={stroke} strokeWidth="3" />
          <rect x="180" y="45" width="130" height="130" fill="#ddd6fe" stroke={stroke} strokeWidth="3" />
          <line x1="45" y1="205" x2="310" y2="205" stroke={stroke} strokeWidth="2" />
          <DimensionLabel x={178} y={228}>전체 {totalWidth} cm</DimensionLabel>
          <text x="30" y="130" textAnchor="middle" transform="rotate(-90 30 130)" className="fill-slate-700 text-[14px] font-bold">
            {rectangleHeight} cm
          </text>
          <text x="177" y="25" textAnchor="middle" className="fill-slate-700 text-[14px] font-bold">전체 넓이 {totalArea} cm²</text>
          <text x="245" y="115" textAnchor="middle" className="fill-slate-500 text-[24px] font-black">?</text>
        </svg>
      </figure>
    )
  }

  const { shapeArea, exclusiveAreas, tripleOverlap } = visual.props
  return (
    <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid="problem-diagram-three-shape-overlap">
      <svg viewBox="0 0 400 260" role="img" aria-label={`각 넓이가 ${shapeArea}제곱센티미터인 세 도형의 겹침`} className="mx-auto w-full max-w-md">
        <polygon points="75,75 215,45 240,185 95,205" fill="#93c5fd" fillOpacity="0.55" stroke={stroke} strokeWidth="3" />
        <polygon points="185,35 325,85 275,220 145,175" fill="#86efac" fillOpacity="0.5" stroke={stroke} strokeWidth="3" />
        <polygon points="75,170 190,70 330,175 205,235" fill="#fca5a5" fillOpacity="0.47" stroke={stroke} strokeWidth="3" />
        <text x="55" y="55" className="fill-slate-700 text-[13px] font-bold">각 도형 {shapeArea} cm²</text>
        <DimensionLabel x={105} y={125}>{exclusiveAreas[0]}</DimensionLabel>
        <DimensionLabel x={278} y={126}>{exclusiveAreas[1]}</DimensionLabel>
        <DimensionLabel x={185} y={215}>{exclusiveAreas[2]}</DimensionLabel>
        <circle cx="198" cy="136" r="25" fill="#fef3c7" stroke={accent} strokeWidth="2" />
        <text x="198" y="132" textAnchor="middle" className="fill-slate-700 text-[11px] font-bold">세 도형</text>
        <text x="198" y="149" textAnchor="middle" className="fill-slate-700 text-[12px] font-bold">{tripleOverlap} cm²</text>
      </svg>
    </figure>
  )
}
