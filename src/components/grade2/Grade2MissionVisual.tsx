'use client'

import React from 'react'

import type { Grade2Mission } from '@/lib/grade2-problems'

interface Grade2MissionVisualProps {
  mission: Grade2Mission
  emphasize?: boolean
}

function asNumber(value: string | number | boolean | undefined, fallback = 0): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function asString(value: string | number | boolean | undefined, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return String(value)
  return fallback
}

function splitList(value: string | number | boolean | undefined): string[] {
  return asString(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function VisualShell({
  children,
  emphasize = false,
  testId,
}: {
  children: React.ReactNode
  emphasize?: boolean
  testId: string
}) {
  return (
    <div
      className={`min-h-[260px] rounded-[1.5rem] border-2 bg-[#f8fbff] p-4 ${
        emphasize ? 'border-[#ffb020] ring-4 ring-[#fff2cf]' : 'border-[#d8e3ef]'
      }`}
      data-testid={testId}
    >
      {children}
    </div>
  )
}

function PlaceValueBlocks({ mission, emphasize }: Grade2MissionVisualProps) {
  const columns = [
    { label: '천', count: asNumber(mission.visualConfig.thousands), color: '#7c3aed' },
    { label: '백', count: asNumber(mission.visualConfig.hundreds), color: '#0ea5e9' },
    { label: '십', count: asNumber(mission.visualConfig.tens), color: '#10b981' },
    { label: '일', count: asNumber(mission.visualConfig.ones), color: '#f97316' },
  ].filter((column) => column.count > 0 || column.label !== '천')

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-place-value-blocks">
      <div className="grid h-full gap-3 sm:grid-cols-4">
        {columns.map((column) => (
          <div key={column.label} className="rounded-2xl border-2 border-white bg-white p-3 shadow-sm">
            <div className="mb-3 text-center text-sm font-black text-[#334155]">{column.label} 자리</div>
            <div className="grid min-h-[150px] grid-cols-3 content-start gap-1">
              {Array.from({ length: Math.max(column.count, 1) }, (_, index) => (
                <span
                  key={index}
                  className="h-8 rounded-md"
                  style={{
                    backgroundColor: index < column.count ? column.color : '#e2e8f0',
                    opacity: index < column.count ? 1 : 0.35,
                  }}
                />
              ))}
            </div>
            <div className="mt-3 text-center text-2xl font-black text-[#0f172a]">{column.count}</div>
          </div>
        ))}
      </div>
    </VisualShell>
  )
}

function ExpandedNumberCards({ mission, emphasize }: Grade2MissionVisualProps) {
  const cards = splitList(mission.visualConfig.cards)
  const parts = splitList(mission.visualConfig.parts)
  const values = cards.length > 0 ? cards : parts
  const target = asString(mission.visualConfig.target)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-expanded-number-cards">
      <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-3">
        {values.map((value, index) => (
          <div
            key={`${value}-${index}`}
            className={`flex min-h-[86px] min-w-[110px] items-center justify-center rounded-2xl border-2 px-5 text-3xl font-black ${
              value === target && emphasize
                ? 'border-[#16a34a] bg-[#dcfce7] text-[#14532d]'
                : 'border-[#cbd5e1] bg-white text-[#0f172a]'
            }`}
          >
            {value}
          </div>
        ))}
        {parts.length > 0 && (
          <div className="basis-full text-center text-4xl font-black text-[#2563eb]">= {target}</div>
        )}
      </div>
    </VisualShell>
  )
}

function VerticalOperation({ mission, emphasize }: Grade2MissionVisualProps) {
  const top = asString(mission.visualConfig.top)
  const bottom = asString(mission.visualConfig.bottom)
  const operator = asString(mission.visualConfig.operator)
  const result = asString(mission.visualConfig.result)
  const carry = asString(mission.visualConfig.carry)
  const borrow = asString(mission.visualConfig.borrow)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-vertical-operation">
      <div className="mx-auto flex max-w-[260px] flex-col items-stretch rounded-2xl bg-white p-6 font-mono text-5xl font-black text-[#0f172a] shadow-sm">
        <div className="h-8 text-right text-xl text-[#f97316]">
          {carry ? `올림 ${carry}` : borrow ? `빌림 ${borrow}` : ''}
        </div>
        <div className="text-right">{top}</div>
        <div className="grid grid-cols-[44px_1fr] items-center">
          <span>{operator}</span>
          <span className="text-right">{bottom}</span>
        </div>
        <div className="mt-2 border-t-4 border-[#334155] pt-2 text-right text-[#2563eb]">
          {result}
        </div>
      </div>
    </VisualShell>
  )
}

function BoxEquation({ mission, emphasize }: Grade2MissionVisualProps) {
  const left = asString(mission.visualConfig.left)
  const right = asString(mission.visualConfig.right)
  const operator = asString(mission.visualConfig.operator)
  const result = asString(mission.visualConfig.result)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-box-equation">
      <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-3 text-4xl font-black text-[#0f172a]">
        <span className="flex h-24 min-w-24 items-center justify-center rounded-2xl border-4 border-[#2563eb] bg-white px-5">
          {left}
        </span>
        <span>{operator}</span>
        <span className="rounded-2xl bg-white px-6 py-5">{right}</span>
        <span>=</span>
        <span className="rounded-2xl bg-[#dcfce7] px-6 py-5 text-[#166534]">{result}</span>
      </div>
    </VisualShell>
  )
}

function ArrayGroups({ mission, emphasize }: Grade2MissionVisualProps) {
  const rows = asNumber(mission.visualConfig.rows, 1)
  const cols = asNumber(mission.visualConfig.cols, 1)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-array-groups">
      <div
        className="mx-auto grid max-w-xl gap-2 rounded-2xl bg-white p-5 shadow-sm"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(28px, 1fr))` }}
      >
        {Array.from({ length: rows * cols }, (_, index) => (
          <span key={index} className="aspect-square rounded-full border-2 border-[#f59e0b] bg-[#fde68a]" />
        ))}
      </div>
    </VisualShell>
  )
}

function MultiplicationTable({ mission, emphasize }: Grade2MissionVisualProps) {
  const dan = asNumber(mission.visualConfig.dan, 1)
  const factor = asNumber(mission.visualConfig.factor, 1)
  const sequence = splitList(mission.visualConfig.sequence)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-multiplication-table">
      {sequence.length > 0 ? (
        <div className="grid min-h-[220px] grid-cols-5 items-center gap-3">
          {sequence.map((item, index) => (
            <div key={`${item}-${index}`} className="flex min-h-[76px] items-center justify-center rounded-2xl border-2 border-[#cbd5e1] bg-white text-3xl font-black text-[#0f172a]">
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }, (_, index) => {
            const current = index + 1
            return (
              <div
                key={current}
                className={`rounded-xl border-2 p-3 text-center text-xl font-black ${
                  current === factor ? 'border-[#2563eb] bg-[#dbeafe]' : 'border-[#cbd5e1] bg-white'
                }`}
              >
                {dan} x {current}
                <div className="text-2xl text-[#0f172a]">{dan * current}</div>
              </div>
            )
          })}
        </div>
      )}
    </VisualShell>
  )
}

function ShapeGlyph({ shape }: { shape: string }) {
  if (shape === '구' || shape === '원') {
    return <span className="h-16 w-16 rounded-full bg-[#38bdf8] shadow-inner" />
  }
  if (shape === '원기둥') {
    return <span className="h-20 w-14 rounded-[50%/18%] border-4 border-[#0ea5e9] bg-[#bae6fd]" />
  }
  if (shape === '직육면체') {
    return <span className="h-16 w-20 skew-y-6 rounded-xl bg-[#fbbf24]" />
  }
  if (shape === '삼각형') {
    return <span className="h-0 w-0 border-x-[34px] border-b-[62px] border-x-transparent border-b-[#f97316]" />
  }
  return <span className="h-16 w-16 rounded-xl bg-[#22c55e]" />
}

function SolidShapeCards({ mission, emphasize }: Grade2MissionVisualProps) {
  const shapes = splitList(mission.visualConfig.shapes)
  const target = asString(mission.visualConfig.target)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-solid-shape-cards">
      <div className="grid min-h-[220px] gap-3 sm:grid-cols-3">
        {shapes.map((shape) => (
          <div
            key={shape}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-white p-4 text-xl font-black text-[#0f172a] ${
              shape === target && emphasize ? 'border-[#16a34a]' : 'border-[#cbd5e1]'
            }`}
          >
            <ShapeGlyph shape={shape} />
            <span>{shape}</span>
          </div>
        ))}
      </div>
    </VisualShell>
  )
}

function StackCubes({ mission, emphasize }: Grade2MissionVisualProps) {
  const bottom = asNumber(mission.visualConfig.bottom)
  const top = asNumber(mission.visualConfig.top)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-stack-cubes">
      <div className="flex min-h-[220px] flex-col items-center justify-end gap-2">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: top }, (_, index) => (
            <span key={`top-${index}`} className="h-16 w-16 rounded-xl border-2 border-[#0369a1] bg-[#7dd3fc] shadow-md" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: bottom }, (_, index) => (
            <span key={`bottom-${index}`} className="h-16 w-16 rounded-xl border-2 border-[#92400e] bg-[#fcd34d] shadow-md" />
          ))}
        </div>
      </div>
    </VisualShell>
  )
}

function RulerLine({ mission, emphasize }: Grade2MissionVisualProps) {
  const start = asNumber(mission.visualConfig.startCm)
  const end = asNumber(mission.visualConfig.endCm)
  const max = asNumber(mission.visualConfig.maxCm, 12)
  const left = (start / max) * 100
  const width = ((end - start) / max) * 100

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-ruler-line">
      <div className="flex min-h-[220px] flex-col justify-center">
        <div className="relative h-20 rounded-2xl bg-white p-4 shadow-sm">
          <div className="absolute bottom-4 left-4 right-4 h-3 rounded-full bg-[#e2e8f0]" />
          <div
            className="absolute bottom-4 h-3 rounded-full bg-[#f97316]"
            style={{ left: `calc(1rem + ${left}%)`, width: `calc(${width}% - 1rem)` }}
          />
          <div className="absolute bottom-8 left-4 right-4 flex justify-between text-xs font-black text-[#64748b]">
            {Array.from({ length: max + 1 }, (_, index) => (
              <span key={index}>{index}</span>
            ))}
          </div>
        </div>
      </div>
    </VisualShell>
  )
}

function LengthBars({ mission, emphasize }: Grade2MissionVisualProps) {
  const leftLabel = asString(mission.visualConfig.leftLabel)
  const rightLabel = asString(mission.visualConfig.rightLabel)
  const leftCm = asNumber(mission.visualConfig.leftCm)
  const rightCm = asNumber(mission.visualConfig.rightCm)
  const max = Math.max(leftCm, rightCm, asNumber(mission.visualConfig.totalCm), 1)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-length-bars">
      <div className="space-y-5 py-8">
        {[
          { label: leftLabel, value: leftCm, color: '#2563eb' },
          { label: rightLabel, value: rightCm, color: '#f97316' },
        ].map((bar) => (
          <div key={bar.label} className="grid grid-cols-[90px_1fr] items-center gap-3">
            <div className="text-right text-lg font-black text-[#334155]">{bar.label}</div>
            <div className="h-12 rounded-full bg-white p-2 shadow-sm">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max((bar.value / max) * 100, 8)}%`, backgroundColor: bar.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </VisualShell>
  )
}

function SingleClock({ hour, minute }: { hour: number; minute: number }) {
  const minuteAngle = minute * 6
  const hourAngle = ((hour % 12) + minute / 60) * 30

  return (
    <svg viewBox="0 0 220 220" role="img" aria-label={`${hour}시 ${minute}분 시계`} className="h-56 w-56 max-w-full">
      <circle cx="110" cy="110" r="96" fill="#ffffff" stroke="#2563eb" strokeWidth="8" />
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index + 1) * 30 - 90
        const radians = (angle * Math.PI) / 180
        const x = 110 + Math.cos(radians) * 76
        const y = 110 + Math.sin(radians) * 76
        return (
          <text key={index} x={x} y={y + 7} textAnchor="middle" className="fill-[#0f172a] text-xl font-black">
            {index + 1}
          </text>
        )
      })}
      <line x1="110" y1="110" x2="110" y2="54" stroke="#f97316" strokeWidth="7" strokeLinecap="round" transform={`rotate(${minuteAngle} 110 110)`} />
      <line x1="110" y1="110" x2="110" y2="72" stroke="#0f172a" strokeWidth="10" strokeLinecap="round" transform={`rotate(${hourAngle} 110 110)`} />
      <circle cx="110" cy="110" r="8" fill="#facc15" />
    </svg>
  )
}

function ClockFace({ mission, emphasize }: Grade2MissionVisualProps) {
  const hour = asNumber(mission.visualConfig.hour, 1)
  const minute = asNumber(mission.visualConfig.minute, 0)
  const endHour = mission.visualConfig.endHour === undefined ? null : asNumber(mission.visualConfig.endHour)
  const endMinute = mission.visualConfig.endMinute === undefined ? null : asNumber(mission.visualConfig.endMinute)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-clock-face">
      <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-5">
        <SingleClock hour={hour} minute={minute} />
        {endHour !== null && endMinute !== null && (
          <>
            <span className="text-4xl font-black text-[#2563eb]">→</span>
            <SingleClock hour={endHour} minute={endMinute} />
          </>
        )}
      </div>
    </VisualShell>
  )
}

function CalendarStrip({ mission, emphasize }: Grade2MissionVisualProps) {
  const days = splitList(mission.visualConfig.days)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-calendar-strip">
      <div className="grid min-h-[220px] grid-cols-7 items-center gap-2">
        {days.map((day, index) => (
          <div key={day} className={`rounded-2xl border-2 p-4 text-center text-2xl font-black ${index >= 5 ? 'border-[#f97316] bg-[#ffedd5]' : 'border-[#cbd5e1] bg-white'}`}>
            {day}
          </div>
        ))}
      </div>
    </VisualShell>
  )
}

function ClassificationTable({ mission, emphasize }: Grade2MissionVisualProps) {
  const categories = splitList(mission.visualConfig.categories)
  const counts = splitList(mission.visualConfig.counts)
  const target = asString(mission.visualConfig.target)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-classification-table">
      <div className="overflow-hidden rounded-2xl border-2 border-[#cbd5e1] bg-white">
        {categories.map((category, index) => (
          <div
            key={category}
            className={`grid grid-cols-[1fr_110px] items-center border-b-2 border-[#e2e8f0] p-4 last:border-b-0 ${
              target.includes(category) && emphasize ? 'bg-[#dcfce7]' : ''
            }`}
          >
            <span className="text-xl font-black text-[#0f172a]">{category}</span>
            <span className="text-center text-3xl font-black text-[#2563eb]">{counts[index]}</span>
          </div>
        ))}
      </div>
    </VisualShell>
  )
}

function MarkGraph({ mission, emphasize }: Grade2MissionVisualProps) {
  const categories = splitList(mission.visualConfig.categories)
  const counts = splitList(mission.visualConfig.counts).map(Number)
  const target = asString(mission.visualConfig.target)
  const max = Math.max(...counts, 1)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-mark-graph">
      <div className="grid min-h-[220px] items-end gap-3 sm:grid-cols-3">
        {categories.map((category, index) => (
          <div key={category} className={`rounded-2xl border-2 bg-white p-3 ${target.includes(category) && emphasize ? 'border-[#16a34a]' : 'border-[#cbd5e1]'}`}>
            <div className="flex min-h-[120px] flex-col justify-end gap-1">
              {Array.from({ length: counts[index] }, (_, markIndex) => (
                <span key={markIndex} className="h-5 rounded-full bg-[#2563eb]" style={{ width: `${Math.max(35, (counts[index] / max) * 100)}%` }} />
              ))}
            </div>
            <div className="mt-3 text-center text-lg font-black text-[#0f172a]">{category}</div>
          </div>
        ))}
      </div>
    </VisualShell>
  )
}

function PatternStrip({ mission, emphasize }: Grade2MissionVisualProps) {
  const tokens = splitList(mission.visualConfig.pattern)

  return (
    <VisualShell emphasize={emphasize} testId="grade2-visual-pattern-strip">
      <div className="grid min-h-[220px] grid-cols-5 items-center gap-3">
        {tokens.map((token, index) => (
          <div key={`${token}-${index}`} className="flex min-h-[86px] items-center justify-center rounded-2xl border-2 border-[#cbd5e1] bg-white text-center text-2xl font-black text-[#0f172a]">
            {token}
          </div>
        ))}
      </div>
    </VisualShell>
  )
}

function FallbackVisual({ mission }: { mission: Grade2Mission }) {
  return (
    <VisualShell testId="grade2-visual-fallback">
      <div className="flex min-h-[220px] items-center justify-center text-center text-xl font-black leading-relaxed text-[#334155]">
        {mission.prompt}
      </div>
    </VisualShell>
  )
}

export default function Grade2MissionVisual({ mission, emphasize = false }: Grade2MissionVisualProps) {
  try {
    switch (mission.visualModel) {
      case 'place-value-blocks':
        return <PlaceValueBlocks mission={mission} emphasize={emphasize} />
      case 'expanded-number-cards':
        return <ExpandedNumberCards mission={mission} emphasize={emphasize} />
      case 'vertical-operation':
        return <VerticalOperation mission={mission} emphasize={emphasize} />
      case 'box-equation':
        return <BoxEquation mission={mission} emphasize={emphasize} />
      case 'array-groups':
        return <ArrayGroups mission={mission} emphasize={emphasize} />
      case 'multiplication-table':
        return <MultiplicationTable mission={mission} emphasize={emphasize} />
      case 'solid-shape-cards':
        return <SolidShapeCards mission={mission} emphasize={emphasize} />
      case 'stack-cubes':
        return <StackCubes mission={mission} emphasize={emphasize} />
      case 'ruler-line':
        return <RulerLine mission={mission} emphasize={emphasize} />
      case 'length-bars':
        return <LengthBars mission={mission} emphasize={emphasize} />
      case 'clock-face':
        return <ClockFace mission={mission} emphasize={emphasize} />
      case 'calendar-strip':
        return <CalendarStrip mission={mission} emphasize={emphasize} />
      case 'classification-table':
        return <ClassificationTable mission={mission} emphasize={emphasize} />
      case 'mark-graph':
        return <MarkGraph mission={mission} emphasize={emphasize} />
      case 'pattern-strip':
        return <PatternStrip mission={mission} emphasize={emphasize} />
      default:
        return <FallbackVisual mission={mission} />
    }
  } catch (error) {
    console.error('Failed to render Grade 2 visual', error)
    return <FallbackVisual mission={mission} />
  }
}
