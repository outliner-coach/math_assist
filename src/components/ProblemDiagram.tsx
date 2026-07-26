'use client'

import React from 'react'
import { buildThreeShapeOverlapModel } from '@/lib/three-shape-overlap'
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
  'three_shape_overlap',
  'ratio_table',
  'ratio_graph',
  'number_range',
  'fraction_comparison',
  'area_unit_square',
  'possibility_trials'
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

type OverlapRegionKey = keyof ReturnType<typeof buildThreeShapeOverlapModel>['regions']

type RatioGraphProps = Extract<ProblemVisual, { type: 'ratio_graph' }>['props']

export interface RatioGraphSegmentModel {
  label: string
  percent: number
  startPercent: number
  endPercent: number
  color: string
}

export interface RatioGraphModel {
  kind: RatioGraphProps['kind']
  caption: string
  maskedValueIndex?: number
  segments: RatioGraphSegmentModel[]
}

const ratioGraphColors = ['#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#fb7185']

export function buildRatioGraphModel(props: RatioGraphProps): RatioGraphModel {
  const safeValues = props.segments.map((segment) => (
    Number.isFinite(segment.percent) && segment.percent > 0 ? segment.percent : 0
  ))
  const total = safeValues.reduce((sum, value) => sum + value, 0) || 1
  let cursor = 0
  const segments = props.segments.map((segment, index) => {
    const percent = safeValues[index] * 100 / total
    const startPercent = cursor
    cursor += percent
    return {
      label: segment.label,
      percent,
      startPercent,
      endPercent: cursor,
      color: ratioGraphColors[index % ratioGraphColors.length],
    }
  })

  return {
    kind: props.kind,
    caption: props.caption,
    maskedValueIndex: props.maskedValueIndex,
    segments,
  }
}

function ratioGraphPoint(cx: number, cy: number, radius: number, percent: number) {
  const angle = (percent * 3.6 - 90) * Math.PI / 180
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  }
}

function ratioGraphSectorPath(
  cx: number,
  cy: number,
  radius: number,
  startPercent: number,
  endPercent: number,
) {
  const start = ratioGraphPoint(cx, cy, radius, startPercent)
  const end = ratioGraphPoint(cx, cy, radius, endPercent)
  const largeArc = endPercent - startPercent > 50 ? 1 : 0
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

type OverlapRegionDefinition = {
  key: OverlapRegionKey
  tier: number
  column: number
  label: string
  symbol: string
  fill: string
  given: boolean
}

type OverlapRegionLayout = OverlapRegionDefinition & {
  area: number
  columns: number
  rows: number
  centerX: number
  calloutY: number
  cellsY: number
}

type ThreeShapeOverlapLayout = {
  width: number
  height: number
  cellSize: number
  pitch: number
  calloutWidth: number
  calloutHeight: number
  labelFontSize: number
  noteFontSize: number
  noteY: number
  regions: OverlapRegionLayout[]
}

const overlapRegionDefinitions: OverlapRegionDefinition[] = [
  {
    key: 'aOnly', tier: 0, column: 0,
    label: 'A만', symbol: '●', fill: '#93c5fd', given: true,
  },
  {
    key: 'abOnly', tier: 0, column: 1,
    label: 'A∩B만', symbol: '●▲', fill: '#67e8f9', given: false,
  },
  {
    key: 'bOnly', tier: 0, column: 2,
    label: 'B만', symbol: '▲', fill: '#86efac', given: true,
  },
  {
    key: 'acOnly', tier: 1, column: 0,
    label: 'A∩C만', symbol: '●■', fill: '#c4b5fd', given: false,
  },
  {
    key: 'abc', tier: 1, column: 1,
    label: 'A∩B∩C', symbol: '●▲■', fill: '#fcd34d', given: true,
  },
  {
    key: 'bcOnly', tier: 1, column: 2,
    label: 'B∩C만', symbol: '▲■', fill: '#fdba74', given: false,
  },
  {
    key: 'cOnly', tier: 2, column: 1,
    label: 'C만', symbol: '■', fill: '#fca5a5', given: true,
  },
]

export function buildThreeShapeOverlapLayout(
  regions: Record<OverlapRegionKey, number>,
): ThreeShapeOverlapLayout {
  const width = 360
  const horizontalPadding = 12
  const columnsPerTier = 3
  const slotWidth = (width - horizontalPadding * 2) / columnsPerTier
  const cellSize = 11
  const pitch = 12
  const calloutWidth = 102
  const calloutHeight = 52
  const labelFontSize = 17
  const noteFontSize = 16
  const connectorGap = 12
  const tierGap = 22
  const contentStartY = 72
  const tierStarts: number[] = []
  let nextTierY = contentStartY

  for (let tier = 0; tier < 3; tier += 1) {
    tierStarts[tier] = nextTierY
    const tierDefinitions = overlapRegionDefinitions.filter(definition => definition.tier === tier)
    const maximumRows = Math.max(
      1,
      ...tierDefinitions.map(definition => {
        const area = regions[definition.key]
        if (area === 0) return 0
        const columns = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(area))))
        return Math.ceil(area / columns)
      }),
    )
    const maximumBlockHeight = maximumRows * pitch - (pitch - cellSize)
    nextTierY += calloutHeight + connectorGap + maximumBlockHeight + tierGap
  }

  const noteY = nextTierY - tierGap + 26
  const height = noteY + 42
  const layouts = overlapRegionDefinitions.map(definition => {
    const area = regions[definition.key]
    const columns = area === 0
      ? 0
      : Math.min(5, Math.max(1, Math.ceil(Math.sqrt(area))))
    const rows = columns === 0 ? 0 : Math.ceil(area / columns)
    return {
      ...definition,
      area,
      columns,
      rows,
      centerX: horizontalPadding + slotWidth * (definition.column + 0.5),
      calloutY: tierStarts[definition.tier],
      cellsY: tierStarts[definition.tier] + calloutHeight + connectorGap,
    }
  })

  return {
    width,
    height,
    cellSize,
    pitch,
    calloutWidth,
    calloutHeight,
    labelFontSize,
    noteFontSize,
    noteY,
    regions: layouts,
  }
}

function OverlapRegionCells({
  region,
  layout,
  unit,
}: {
  region: OverlapRegionLayout
  layout: ThreeShapeOverlapLayout
  unit: string
}) {
  const {
    key: regionKey,
    area,
    columns,
    centerX,
    calloutY,
    cellsY,
    label,
    symbol,
    fill,
    given,
  } = region
  if (area === 0) return null

  const {
    pitch,
    cellSize,
    calloutWidth,
    calloutHeight,
    labelFontSize,
  } = layout
  const blockWidth = columns * pitch - (pitch - cellSize)
  const startX = centerX - blockWidth / 2
  const startY = cellsY
  const calloutX = centerX - calloutWidth / 2
  const lineStart = { x: centerX, y: calloutY + calloutHeight }
  const lineEnd = { x: centerX, y: startY - 3 }

  return (
    <>
      <g data-region={regionKey} aria-hidden="true">
        {Array.from({ length: area }, (_, index) => (
          <rect
            key={index}
            data-cell-region={regionKey}
            x={startX + (index % columns) * pitch}
            y={startY + Math.floor(index / columns) * pitch}
            width={cellSize}
            height={cellSize}
            rx="1.5"
            fill={fill}
            stroke="#475569"
            strokeWidth="1"
          />
        ))}
      </g>
      <g
        data-region-callout={regionKey}
        data-region-symbol={symbol}
        data-given-value={given ? area : undefined}
        aria-hidden="true"
      >
        <line
          x1={lineStart.x}
          y1={lineStart.y}
          x2={lineEnd.x}
          y2={lineEnd.y}
          stroke="#475569"
          strokeWidth="2"
          data-callout-link={regionKey}
        />
        <circle cx={lineEnd.x} cy={lineEnd.y} r="3" fill="#475569" />
        <rect
          x={calloutX}
          y={calloutY}
          width={calloutWidth}
          height={calloutHeight}
          rx="10"
          fill="white"
          stroke={fill}
          strokeWidth="2.5"
        />
        <text
          x={calloutX + calloutWidth / 2}
          y={calloutY + 19}
          textAnchor="middle"
          fontSize={labelFontSize}
          fontWeight="800"
          fill="#0f172a"
          data-overlap-label={regionKey}
        >
          <tspan x={centerX}>{label}</tspan>
          <tspan x={centerX} dy="21" fontWeight="800">
            {symbol}{given ? ` · ${area} ${unit}²` : ''}
          </tspan>
        </text>
      </g>
    </>
  )
}

export default function ProblemDiagram({ visual }: ProblemDiagramProps) {
  if (visual.type === 'possibility_trials') {
    const { caption, rows } = visual.props
    const height = 55 + rows.length * 72

    return (
      <figure
        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3"
        data-testid="problem-diagram-possibility-trials"
      >
        <figcaption className="pb-2 text-center text-base font-extrabold text-slate-800">
          {caption}
        </figcaption>
        <svg
          viewBox={`0 0 360 ${height}`}
          role="img"
          aria-label={`${caption}: ${rows.map(row => `${row.label} ${row.total}번 중 ${row.favorable}번`).join(', ')}`}
          className="mx-auto w-full max-w-md"
        >
          {rows.map((row, rowIndex) => {
            const x = 72
            const y = 22 + rowIndex * 72
            const width = 254
            const cellWidth = width / Math.max(1, row.total)
            return (
              <g
                key={`${row.label}-${rowIndex}`}
                data-possibility-row={rowIndex}
                data-favorable={row.favorable}
                data-total={row.total}
              >
                <text x="36" y={y + 23} textAnchor="middle" fontSize="14" fontWeight="800" fill="#334155">
                  {row.label}
                </text>
                {Array.from({ length: row.total }, (_, index) => (
                  <rect
                    key={index}
                    x={x + index * cellWidth}
                    y={y}
                    width={cellWidth}
                    height="34"
                    fill={index < row.favorable ? '#34d399' : '#ffffff'}
                    stroke="#475569"
                    strokeWidth="1"
                    data-trial-outcome={index < row.favorable ? 'favorable' : 'other'}
                  />
                ))}
                <text x="199" y={y + 54} textAnchor="middle" fontSize="12" fontWeight="700" fill="#475569">
                  전체 {row.total}번 · 사건 {row.favorable}번
                </text>
              </g>
            )
          })}
        </svg>
      </figure>
    )
  }

  if (visual.type === 'area_unit_square') {
    const { caption, largerLengthUnit, smallerLengthUnit } = visual.props
    const sideScale = largerLengthUnit === 'm' && smallerLengthUnit === 'cm'
      ? 100
      : 1000
    const sideRelation = `1${largerLengthUnit} = ${sideScale}${smallerLengthUnit}`

    return (
      <figure
        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3"
        data-testid="problem-diagram-area-unit-square"
        data-area-side-scale={sideScale}
      >
        <figcaption className="pb-2 text-center text-base font-extrabold text-slate-800">
          {caption}
        </figcaption>
        <svg
          viewBox="0 0 360 245"
          role="img"
          aria-label={`한 변이 1${largerLengthUnit}인 정사각형, 가로와 세로 각각 ${sideRelation}`}
          className="mx-auto w-full max-w-md"
        >
          <defs>
            <pattern id={`area-unit-grid-${sideScale}`} width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#bfdbfe" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="82" y="24" width="196" height="196" rx="4" fill="#eff6ff" stroke={stroke} strokeWidth="3" />
          <rect x="82" y="24" width="196" height="196" rx="4" fill={`url(#area-unit-grid-${sideScale})`} aria-hidden="true" />
          <line x1="82" y1="230" x2="278" y2="230" stroke={accent} strokeWidth="2" />
          <line x1="68" y1="24" x2="68" y2="220" stroke={accent} strokeWidth="2" />
          <text x="180" y="242" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1e3a8a">
            {sideRelation}
          </text>
          <text x="48" y="122" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1e3a8a" transform="rotate(-90 48 122)">
            {sideRelation}
          </text>
          <text x="180" y="112" textAnchor="middle" fontSize="18" fontWeight="900" fill="#1e40af">
            1{largerLengthUnit}²
          </text>
          <text x="180" y="140" textAnchor="middle" fontSize="13" fontWeight="700" fill="#475569">
            {sideScale}{smallerLengthUnit} × {sideScale}{smallerLengthUnit}
          </text>
        </svg>
      </figure>
    )
  }

  if (visual.type === 'fraction_comparison') {
    const { caption, left, right } = visual.props
    const rows = [left, right]

    return (
      <figure
        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3"
        data-testid="problem-diagram-fraction-comparison"
      >
        <figcaption className="pb-2 text-center text-base font-extrabold text-slate-800">
          {caption}
        </figcaption>
        <svg
          viewBox="0 0 360 180"
          role="img"
          aria-label={`${caption}: ${left.label} ${left.numerator}/${left.denominator}, ${right.label} ${right.numerator}/${right.denominator}`}
          className="mx-auto w-full max-w-md"
        >
          {rows.map((fraction, rowIndex) => {
            const x = 58
            const y = 34 + rowIndex * 76
            const width = 270
            const height = 40
            const partWidth = width / fraction.denominator
            return (
              <g
                key={fraction.label}
                data-fraction-side={rowIndex === 0 ? 'left' : 'right'}
                data-fraction-numerator={fraction.numerator}
                data-fraction-denominator={fraction.denominator}
              >
                <text x="26" y={y + 25} textAnchor="middle" fontSize="15" fontWeight="800" fill="#334155">
                  {fraction.label}
                </text>
                {Array.from({ length: fraction.denominator }, (_, index) => (
                  <rect
                    key={index}
                    x={x + index * partWidth}
                    y={y}
                    width={partWidth}
                    height={height}
                    fill={index < fraction.numerator ? '#60a5fa' : '#ffffff'}
                    stroke="#475569"
                    strokeWidth="1.5"
                    data-fraction-part={rowIndex === 0 ? 'left' : 'right'}
                    data-fraction-filled={String(index < fraction.numerator)}
                  />
                ))}
                <text x="193" y={y + 59} textAnchor="middle" fontSize="13" fontWeight="700" fill="#475569">
                  {fraction.numerator}/{fraction.denominator}
                </text>
              </g>
            )
          })}
        </svg>
      </figure>
    )
  }

  if (visual.type === 'number_range') {
    const { caption, start, end, lower, upper, unit = '' } = visual.props
    const range = Math.max(1, end - start)
    const xFor = (value: number) => 30 + ((value - start) / range) * 300
    const tickValues = range <= 12
      ? Array.from({ length: range + 1 }, (_, index) => start + index)
      : Array.from({ length: 6 }, (_, index) => Math.round(start + range * index / 5))
    const lowerX = lower === undefined ? 30 : xFor(lower)
    const upperX = upper === undefined ? 330 : xFor(upper)

    return (
      <figure
        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3"
        data-testid="problem-diagram-number-range"
      >
        <figcaption className="pb-2 text-center text-base font-extrabold text-slate-800">
          {caption}
        </figcaption>
        <svg
          viewBox="0 0 360 145"
          role="img"
          aria-label={`${caption} 수직선`}
          className="mx-auto w-full max-w-md"
        >
          <line x1="24" y1="62" x2="336" y2="62" stroke="#64748b" strokeWidth="3" />
          <line
            x1={lowerX}
            y1="62"
            x2={upperX}
            y2="62"
            stroke={accent}
            strokeWidth="9"
            strokeLinecap="round"
            data-range-segment="true"
          />
          {lower === undefined && <path d="M 24 62 L 38 53 L 38 71 Z" fill={accent} data-range-left-arrow="true" />}
          {upper === undefined && <path d="M 336 62 L 322 53 L 322 71 Z" fill={accent} data-range-right-arrow="true" />}
          {tickValues.map((value) => {
            const x = xFor(value)
            return (
              <g key={value}>
                <line x1={x} y1="52" x2={x} y2="72" stroke="#475569" strokeWidth="2" />
                <text x={x} y="98" textAnchor="middle" fontSize="12" fontWeight="700" fill="#475569">
                  {value}{unit}
                </text>
              </g>
            )
          })}
          {lower !== undefined && (
            <circle
              cx={lowerX}
              cy="62"
              r="8"
              fill={visual.props.lowerInclusive ? accent : 'white'}
              stroke={accent}
              strokeWidth="4"
              data-range-lower-inclusive={String(Boolean(visual.props.lowerInclusive))}
            />
          )}
          {upper !== undefined && (
            <circle
              cx={upperX}
              cy="62"
              r="8"
              fill={visual.props.upperInclusive ? accent : 'white'}
              stroke={accent}
              strokeWidth="4"
              data-range-upper-inclusive={String(Boolean(visual.props.upperInclusive))}
            />
          )}
          <text x="180" y="127" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
            ● 포함 · ○ 포함하지 않음
          </text>
        </svg>
      </figure>
    )
  }

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

  if (visual.type === 'ratio_table') {
    const { caption, columns, rows } = visual.props
    return (
      <figure
        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3"
        data-testid="problem-diagram-ratio-table"
      >
        <table className="w-full table-fixed border-collapse text-center text-sm md:text-base">
          <caption className="px-2 pb-3 text-base font-extrabold text-slate-800">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="border border-slate-300 bg-sky-100 px-2 py-3 font-extrabold text-slate-800">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="border border-slate-300 bg-white px-2 py-3 font-extrabold text-slate-800">{row.label}</th>
                {row.values.map((value, index) => (
                  <td key={`${row.label}-${index}`} className="border border-slate-300 bg-white px-2 py-3 font-bold text-slate-700">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    )
  }

  if (visual.type === 'ratio_graph') {
    const model = buildRatioGraphModel(visual.props)
    const displayValue = (segment: RatioGraphSegmentModel, index: number) => (
      model.maskedValueIndex === index ? '?' : `${Math.round(segment.percent)}%`
    )

    return (
      <figure
        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3"
        data-testid="problem-diagram-ratio-graph"
      >
        <figcaption className="pb-2 text-center text-base font-extrabold text-slate-800">
          {model.caption}
        </figcaption>
        {model.kind === 'band' ? (
          <svg
            viewBox="0 0 360 150"
            role="img"
            aria-label={`${model.caption} 띠그래프`}
            className="mx-auto w-full max-w-md"
          >
            {model.segments.map((segment, index) => {
              const x = 20 + segment.startPercent * 3.2
              const width = (segment.endPercent - segment.startPercent) * 3.2
              const middle = x + width / 2
              return (
                <g key={`${segment.label}-${index}`}>
                  <rect
                    x={x}
                    y="28"
                    width={width}
                    height="70"
                    fill={segment.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    data-ratio-band-segment={index}
                  />
                  <text x={middle} y="58" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">
                    {segment.label}
                  </text>
                  <text x={middle} y="80" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">
                    {displayValue(segment, index)}
                  </text>
                </g>
              )
            })}
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={tick}>
                <line x1={20 + tick * 3.2} y1="101" x2={20 + tick * 3.2} y2="108" stroke="#475569" />
                <text x={20 + tick * 3.2} y="126" textAnchor="middle" fontSize="11" fill="#475569">
                  {tick}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <svg
            viewBox="0 0 360 220"
            role="img"
            aria-label={`${model.caption} 원그래프`}
            className="mx-auto w-full max-w-md"
          >
            {model.segments.map((segment, index) => {
              const middlePercent = (segment.startPercent + segment.endPercent) / 2
              const labelPoint = ratioGraphPoint(180, 103, 48, middlePercent)
              return (
                <g key={`${segment.label}-${index}`}>
                  <path
                    d={ratioGraphSectorPath(180, 103, 82, segment.startPercent, segment.endPercent)}
                    fill={segment.color}
                    stroke="#ffffff"
                    strokeWidth="3"
                    data-ratio-circle-segment={index}
                  />
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y - 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#0f172a"
                  >
                    <tspan x={labelPoint.x}>{segment.label}</tspan>
                    <tspan x={labelPoint.x} dy="16" fontWeight="800">
                      {displayValue(segment, index)}
                    </tspan>
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </figure>
    )
  }

  const { shapeArea, exclusiveAreas, tripleOverlap, unit } = visual.props
  const model = visual.model ?? buildThreeShapeOverlapModel(visual.props)
  const layout = buildThreeShapeOverlapLayout(model.regions)
  return (
    <figure
      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3"
      data-testid="problem-diagram-three-shape-overlap"
    >
      <figcaption className="space-y-1 text-center">
        <div className="text-base font-extrabold text-slate-900">
          영역 분해도
        </div>
        <div className="text-sm font-bold text-slate-700">
          세 도형을 먼저 A, B, C라고 부릅니다.
        </div>
        <div className="text-xs font-semibold text-slate-600">
          A = 파랑 ● · B = 초록 ▲ · C = 분홍 ■
        </div>
      </figcaption>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label={`영역 분해도. A는 파랑 원 기호, B는 초록 세모 기호, C는 분홍 네모 기호입니다. A, B, C의 넓이는 각각 ${shapeArea} ${unit}²입니다. A만 ${exclusiveAreas[0]} ${unit}², B만 ${exclusiveAreas[1]} ${unit}², C만 ${exclusiveAreas[2]} ${unit}², 세 도형 공통부분 ${tripleOverlap} ${unit}²입니다.`}
        className="mx-auto w-full max-w-md"
        data-overlap-layout-width={layout.width}
        data-overlap-layout-height={layout.height}
      >
        <text x={layout.width / 2} y="24" textAnchor="middle" className="fill-slate-800 text-[18px] font-bold">
          A · B · C의 넓이: 각각 {shapeArea} {unit}²
        </text>
        <text x={layout.width / 2} y="50" textAnchor="middle" className="fill-slate-600 text-[16px] font-semibold">
          한 칸 = 1 {unit}²
        </text>
        {layout.regions.map(region => (
          <OverlapRegionCells
            key={region.key}
            region={region}
            layout={layout}
            unit={unit}
          />
        ))}
        <text
          x={layout.width / 2}
          y={layout.noteY}
          textAnchor="middle"
          data-overlap-note="pairwise-values-hidden"
          fontSize={layout.noteFontSize}
          className="fill-slate-500 font-semibold"
        >
          <tspan x={layout.width / 2}>A∩B만 · A∩C만 · B∩C만은</tspan>
          <tspan x={layout.width / 2} dy="19">풀이 전 수치를 따로 적지 않아요.</tspan>
        </text>
      </svg>
    </figure>
  )
}
