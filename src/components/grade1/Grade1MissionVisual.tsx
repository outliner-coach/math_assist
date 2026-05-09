'use client'

import React from 'react'

import { grade1Objects, type Grade1Asset } from '@/lib/grade1-assets'
import type { Grade1Mission } from '@/lib/grade1-problems'

import Grade1AssetImage from './Grade1AssetImage'

interface Grade1MissionVisualProps {
  mission: Grade1Mission
  emphasize?: boolean
}

const objectAssets: Record<string, Grade1Asset> = {
  apple: grade1Objects.apple,
  block: grade1Objects.block,
  star: grade1Objects.star,
  pencil: grade1Objects.pencil,
  marble: grade1Objects.marble,
}

const koreanObjectAssets: Record<string, Grade1Asset> = {
  사과: grade1Objects.apple,
  블록: grade1Objects.block,
  별: grade1Objects.star,
  연필: grade1Objects.pencil,
  구슬: grade1Objects.marble,
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
  return fallback
}

function ObjectToken({
  asset,
  faded = false,
}: {
  asset: Grade1Asset
  faded?: boolean
}) {
  return (
    <span
      className={`flex aspect-square min-h-[44px] items-center justify-center rounded-2xl border-2 ${
        faded
          ? 'border-dashed border-[#d1d5db] bg-white opacity-40'
          : 'border-[#ffc700] bg-[#fff8d9]'
      }`}
    >
      <span className="block h-10 w-10">
        <Grade1AssetImage
          asset={{ ...asset, decorative: true, alt: '' }}
          className="h-full w-full object-contain"
          fallback={<span className="block h-8 w-8 rounded-full bg-[#ff6b6b]" />}
        />
      </span>
    </span>
  )
}

function CountingGrid({ mission, emphasize }: Grade1MissionVisualProps) {
  const count = asNumber(mission.visualConfig.count)
  const slots = asNumber(mission.visualConfig.slots, 10)
  const asset = objectAssets[asString(mission.visualConfig.object, 'apple')] ?? grade1Objects.apple

  return (
    <div
      className={`rounded-[1.5rem] border-2 bg-[#fbfffa] p-4 ${
        emphasize ? 'border-[#ffc700] ring-4 ring-[#fff8d9]' : 'border-[#e5e5e5]'
      }`}
      aria-label={`${asset.alt} ${count}개가 놓여 있습니다`}
      data-testid="grade1-visual-counting-grid"
    >
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: slots }, (_, index) => (
          <div
            key={index}
            className={`flex aspect-square min-h-[44px] items-center justify-center rounded-2xl border-2 ${
              index < count
                ? 'border-[#ffc700] bg-[#fff8d9]'
                : 'border-dashed border-[#e5e5e5] bg-white'
            }`}
          >
            {index < count ? (
              <span className="block h-10 w-10">
                <Grade1AssetImage
                  asset={{ ...asset, decorative: true, alt: '' }}
                  className="h-full w-full object-contain"
                  fallback={<span className="block h-8 w-8 rounded-full bg-[#ff6b6b]" />}
                />
              </span>
            ) : (
              <span className="h-3 w-3 rounded-full bg-[#e5e5e5]" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ObjectGroups({ mission, emphasize }: Grade1MissionVisualProps) {
  const operation = asString(mission.visualConfig.operation, 'add')
  const asset = objectAssets[asString(mission.visualConfig.object, 'apple')] ?? grade1Objects.apple
  const left = asNumber(mission.visualConfig.left)
  const right = asNumber(mission.visualConfig.right)
  const total = asNumber(mission.visualConfig.total)
  const take = asNumber(mission.visualConfig.take)
  const addMode = operation === 'add'
  const visibleCount = addMode ? left + right : total

  return (
    <div
      className={`rounded-[1.5rem] border-2 bg-[#fbfffa] p-4 ${
        emphasize ? 'border-[#ffc700] ring-4 ring-[#fff8d9]' : 'border-[#e5e5e5]'
      }`}
      data-testid="grade1-visual-object-groups"
    >
      {addMode ? (
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: left }, (_, index) => (
              <ObjectToken key={`left-${index}`} asset={asset} />
            ))}
          </div>
          <div className="text-center text-4xl font-black text-[#1cb0f6]">+</div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: right }, (_, index) => (
              <ObjectToken key={`right-${index}`} asset={asset} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: visibleCount }, (_, index) => (
            <ObjectToken key={index} asset={asset} faded={index >= total - take} />
          ))}
        </div>
      )}
    </div>
  )
}

function NumberCards({ mission, emphasize }: Grade1MissionVisualProps) {
  const cards = asString(mission.visualConfig.cards)
    .split(',')
    .map((card) => card.trim())
    .filter(Boolean)
  const target = asString(mission.visualConfig.target)

  return (
    <div
      className={`rounded-[1.5rem] border-2 bg-[#fbfffa] p-4 ${
        emphasize ? 'border-[#ffc700] ring-4 ring-[#fff8d9]' : 'border-[#e5e5e5]'
      }`}
      data-testid="grade1-visual-number-cards"
    >
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <div
            key={`${card}-${index}`}
            className={`flex min-h-[72px] items-center justify-center rounded-2xl border-2 text-3xl font-black ${
              card === target && emphasize
                ? 'border-[#58cc02] bg-[#f0ffe7] text-[#3c3c3c]'
                : 'border-[#e5e5e5] bg-white text-[#3c3c3c]'
            }`}
          >
            {card}
          </div>
        ))}
      </div>
    </div>
  )
}

function ShapeGlyph({ shape }: { shape: string }) {
  if (shape === '동그라미') {
    return <span className="h-16 w-16 rounded-full bg-[#1cb0f6]" />
  }
  if (shape === '세모') {
    return (
      <span className="h-0 w-0 border-x-[34px] border-b-[62px] border-x-transparent border-b-[#ffc700]" />
    )
  }
  return <span className="h-16 w-16 rounded-xl bg-[#58cc02]" />
}

function PatternGlyph({ token }: { token: string }) {
  const asset = koreanObjectAssets[token]
  if (asset) {
    return (
      <span className="block h-14 w-14">
        <Grade1AssetImage
          asset={{ ...asset, decorative: true, alt: '' }}
          className="h-full w-full object-contain"
          fallback={<span className="block h-12 w-12 rounded-xl bg-[#58cc02]" />}
        />
      </span>
    )
  }

  return <ShapeGlyph shape={token} />
}

function ShapeCards({ mission, emphasize }: Grade1MissionVisualProps) {
  const shapes = asString(mission.visualConfig.shapes)
    .split(',')
    .map((shape) => shape.trim())
    .filter(Boolean)
  const target = asString(mission.visualConfig.target)

  return (
    <div
      className={`rounded-[1.5rem] border-2 bg-[#fbfffa] p-4 ${
        emphasize ? 'border-[#ffc700] ring-4 ring-[#fff8d9]' : 'border-[#e5e5e5]'
      }`}
      data-testid="grade1-visual-shape-cards"
    >
      <div className="grid grid-cols-3 gap-3">
        {shapes.map((shape) => (
          <div
            key={shape}
            className={`flex min-h-[116px] flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-white font-black text-[#3c3c3c] ${
              shape === target && emphasize ? 'border-[#58cc02]' : 'border-[#e5e5e5]'
            }`}
          >
            <ShapeGlyph shape={shape} />
            <span>{shape}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ClockFace({ mission, emphasize }: Grade1MissionVisualProps) {
  const hour = asNumber(mission.visualConfig.hour, 1)
  const minute = asNumber(mission.visualConfig.minute, 0)
  const minuteAngle = minute * 6
  const hourAngle = ((hour % 12) + minute / 60) * 30

  return (
    <div
      className={`rounded-[1.5rem] border-2 bg-[#fbfffa] p-4 ${
        emphasize ? 'border-[#ffc700] ring-4 ring-[#fff8d9]' : 'border-[#e5e5e5]'
      }`}
      data-testid="grade1-visual-clock-face"
    >
      <svg viewBox="0 0 220 220" role="img" aria-label={`${mission.correctAnswer} 시계`} className="mx-auto h-64 max-h-[65vw] w-64 max-w-full">
        <circle cx="110" cy="110" r="96" fill="#ffffff" stroke="#1cb0f6" strokeWidth="8" />
        {[...Array(12)].map((_, index) => {
          const angle = (index + 1) * 30 - 90
          const radians = (angle * Math.PI) / 180
          const x = 110 + Math.cos(radians) * 76
          const y = 110 + Math.sin(radians) * 76
          return (
            <text
              key={index}
              x={x}
              y={y + 7}
              textAnchor="middle"
              className="fill-[#3c3c3c] text-xl font-black"
            >
              {index + 1}
            </text>
          )
        })}
        <line
          x1="110"
          y1="110"
          x2="110"
          y2="56"
          stroke="#58cc02"
          strokeWidth="8"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 110 110)`}
        />
        <line
          x1="110"
          y1="110"
          x2="110"
          y2="72"
          stroke="#3c3c3c"
          strokeWidth="10"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 110 110)`}
        />
        <circle cx="110" cy="110" r="8" fill="#ffc700" />
      </svg>
    </div>
  )
}

function PatternStrip({ mission, emphasize }: Grade1MissionVisualProps) {
  const tokens = asString(mission.visualConfig.pattern)
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)

  return (
    <div
      className={`rounded-[1.5rem] border-2 bg-[#fbfffa] p-4 ${
        emphasize ? 'border-[#ffc700] ring-4 ring-[#fff8d9]' : 'border-[#e5e5e5]'
      }`}
      data-testid="grade1-visual-pattern-strip"
    >
      <div className="grid grid-cols-6 gap-3">
        {tokens.map((token, index) => (
          <div
            key={`${token}-${index}`}
            className="flex min-h-[88px] items-center justify-center rounded-2xl border-2 border-[#e5e5e5] bg-white text-center text-lg font-black text-[#3c3c3c]"
          >
            {token === '?' ? <span className="text-4xl text-[#1cb0f6]">?</span> : <PatternGlyph token={token} />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Grade1MissionVisual({ mission, emphasize = false }: Grade1MissionVisualProps) {
  switch (mission.visualModel) {
    case 'counting-grid':
      return <CountingGrid mission={mission} emphasize={emphasize} />
    case 'object-groups':
      return <ObjectGroups mission={mission} emphasize={emphasize} />
    case 'number-cards':
      return <NumberCards mission={mission} emphasize={emphasize} />
    case 'shape-cards':
      return <ShapeCards mission={mission} emphasize={emphasize} />
    case 'clock-face':
      return <ClockFace mission={mission} emphasize={emphasize} />
    case 'pattern-strip':
      return <PatternStrip mission={mission} emphasize={emphasize} />
    default:
      return null
  }
}
