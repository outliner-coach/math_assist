'use client'

import React from 'react'

import type { Grade3Mission } from '@/lib/grade3-problems'

function asNumber(value: unknown, fallback = 0): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function MaskedValue({ value, showAnswer, testId }: { value: string | number; showAnswer?: boolean; testId: string }) {
  return (
    <span data-testid={testId} className="inline-flex min-w-[3ch] justify-center rounded-lg bg-white px-2 py-1 font-black text-[#0f172a]">
      {showAnswer ? value : '□'}
    </span>
  )
}

function VerticalOperation({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const top = asNumber(mission.visualConfig.top)
  const bottom = asNumber(mission.visualConfig.bottom)
  const operator = asString(mission.visualConfig.operator, '+')
  const result = asNumber(mission.visualConfig.result)
  return (
    <div data-testid="grade3-visual-vertical-operation" className="grid place-items-center rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-6">
      <div className="w-56 rounded-2xl bg-white p-5 text-right font-mono text-4xl font-black text-[#0f172a] shadow-sm">
        <div>{top}</div>
        <div>{operator} {bottom}</div>
        <div className="my-2 border-t-4 border-[#0f172a]" />
        <div><MaskedValue value={result} showAnswer={showAnswer} testId="grade3-vertical-result" /></div>
      </div>
    </div>
  )
}

function LineAngleCards({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const cards = asString(mission.visualConfig.cards, '예각,직각,둔각').split(',')
  const angle = asNumber(mission.visualConfig.angle, 90)
  const answerVisible = showAnswer || !mission.visualConfig.hideAngleUntilReveal
  return (
    <div data-testid="grade3-visual-line-angle-cards" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card} className="rounded-2xl border-2 border-white bg-white p-4 text-center text-xl font-black text-[#2563eb] shadow-sm">
            {card}
          </div>
        ))}
      </div>
      <div className="mt-5 grid place-items-center rounded-2xl bg-white p-5">
        <div className="relative h-28 w-36">
          <div className="absolute bottom-4 left-6 h-2 w-28 origin-left rounded bg-[#0f172a]" />
          <div
            className="absolute bottom-4 left-6 h-2 w-28 origin-left rounded bg-[#f97316]"
            style={{ transform: `rotate(${-Math.min(angle, 160)}deg)` }}
          />
        </div>
        <p className="text-sm font-black text-[#64748b]">
          각도: <MaskedValue value={`${angle}도`} showAnswer={answerVisible} testId="grade3-angle-value" />
        </p>
      </div>
    </div>
  )
}

function DivisionGroups({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const total = asNumber(mission.visualConfig.total)
  const groups = asNumber(mission.visualConfig.groups, 1)
  const each = asNumber(mission.visualConfig.each, Math.floor(total / groups))
  const remainder = asNumber(mission.visualConfig.remainder)
  return (
    <div data-testid="grade3-visual-division-groups" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <p className="mb-3 text-sm font-black text-[#2563eb]">같은 묶음으로 나누어 보기</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: groups }).map((_, groupIndex) => (
          <div key={groupIndex} className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: Math.min(each, 10) }).map((__, index) => (
                <span key={index} className="h-5 w-5 rounded-full bg-[#2563eb]" />
              ))}
            </div>
          </div>
        ))}
      </div>
      {remainder > 0 && (
        <p className="mt-4 text-base font-black text-[#0f172a]">
          남는 것: <MaskedValue value={remainder} showAnswer={showAnswer} testId="grade3-division-remainder" />
        </p>
      )}
    </div>
  )
}

function ArrayArea({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const rows = Math.min(asNumber(mission.visualConfig.rows, 1), 12)
  const cols = Math.min(asNumber(mission.visualConfig.cols, 1), 24)
  const product = asNumber(mission.visualConfig.product)
  return (
    <div data-testid="grade3-visual-array-area" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <div className="grid gap-1 overflow-hidden rounded-2xl bg-white p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(8px, 1fr))` }}>
        {Array.from({ length: rows * cols }).map((_, index) => (
          <span key={index} className="aspect-square rounded-sm bg-[#60a5fa]" />
        ))}
      </div>
      <p className="mt-4 text-center text-base font-black text-[#0f172a]">
        모두 <MaskedValue value={product} showAnswer={showAnswer} testId="grade3-array-product" />개
      </p>
    </div>
  )
}

function RulerMm({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const centimeters = asNumber(mission.visualConfig.centimeters)
  const millimeters = asNumber(mission.visualConfig.millimeters)
  return (
    <div data-testid="grade3-visual-ruler-mm" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <div className="rounded-2xl bg-[#fef3c7] p-4">
        <div className="flex h-20 items-end gap-1">
          {Array.from({ length: 61 }).map((_, index) => (
            <span key={index} className={`w-1 rounded-t bg-[#92400e] ${index % 10 === 0 ? 'h-16' : 'h-8'}`} />
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-base font-black text-[#0f172a]">
        길이 <MaskedValue value={`${centimeters}cm ${millimeters}mm`} showAnswer={showAnswer} testId="grade3-ruler-result" />
      </p>
    </div>
  )
}

function ClockSeconds({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const hour = asNumber(mission.visualConfig.hour)
  const minute = asNumber(mission.visualConfig.minute)
  const second = asNumber(mission.visualConfig.second)
  const durationResult = asNumber(mission.visualConfig.durationResult)
  return (
    <div data-testid="grade3-visual-clock-seconds" className="grid place-items-center rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <div className="grid h-56 w-56 place-items-center rounded-full border-8 border-[#2563eb] bg-white">
        <div className="text-center">
          <div className="text-3xl font-black text-[#0f172a]">{hour ? `${hour}:${String(minute).padStart(2, '0')}` : '시간 계산'}</div>
          <div className="mt-2 text-lg font-black text-[#f97316]">
            초: <MaskedValue value={second || durationResult} showAnswer={showAnswer || Boolean(second)} testId="grade3-clock-seconds" />
          </div>
        </div>
      </div>
    </div>
  )
}

function FractionStrip({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const total = asNumber(mission.visualConfig.totalParts, 6)
  const shaded = asNumber(mission.visualConfig.shadedParts, 0)
  const compareA = asString(mission.visualConfig.compareA)
  const compareB = asString(mission.visualConfig.compareB)
  const parts = total > 0 ? total : 6
  return (
    <div data-testid="grade3-visual-fraction-strip" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      {compareA && compareB ? (
        <div className="space-y-3">
          {[compareA, compareB].map((fraction) => {
            const [num, den] = fraction.split('/').map(Number)
            return (
              <div key={fraction} className="grid grid-cols-[56px_1fr] items-center gap-3">
                <span className="font-black text-[#0f172a]">{fraction}</span>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${den}, minmax(20px, 1fr))` }}>
                  {Array.from({ length: den }).map((_, index) => (
                    <span key={index} className={`h-10 rounded ${index < num ? 'bg-[#f97316]' : 'bg-white'}`} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${parts}, minmax(28px, 1fr))` }}>
          {Array.from({ length: parts }).map((_, index) => (
            <span key={index} className={`h-16 rounded-xl ${index < shaded ? 'bg-[#f97316]' : 'bg-white'}`} />
          ))}
        </div>
      )}
      <p className="mt-4 text-center text-base font-black text-[#0f172a]">
        분수 <MaskedValue value={mission.correctAnswer} showAnswer={showAnswer} testId="grade3-fraction-result" />
      </p>
    </div>
  )
}

function DecimalGrid({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const total = asNumber(mission.visualConfig.totalParts, 10)
  const shaded = asNumber(mission.visualConfig.shadedParts, 0)
  return (
    <div data-testid="grade3-visual-decimal-grid" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <div className="grid grid-cols-10 gap-1 rounded-2xl bg-white p-4">
        {Array.from({ length: total }).map((_, index) => (
          <span key={index} className={`h-14 rounded ${index < shaded ? 'bg-[#2563eb]' : 'bg-[#dbeafe]'}`} />
        ))}
      </div>
      <p className="mt-4 text-center text-base font-black text-[#0f172a]">
        소수 <MaskedValue value={mission.correctAnswer} showAnswer={showAnswer} testId="grade3-decimal-result" />
      </p>
    </div>
  )
}

function CircleParts({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const radius = asNumber(mission.visualConfig.radius)
  const diameter = asNumber(mission.visualConfig.diameter)
  return (
    <div data-testid="grade3-visual-circle-parts" className="grid place-items-center rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <div className="relative h-56 w-56 rounded-full border-8 border-[#2563eb] bg-white">
        <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f97316]" />
        <span className="absolute left-1/2 top-1/2 h-1 w-[92px] -translate-y-1/2 bg-[#f97316]" />
        <span className="absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 bg-[#0f172a]" />
      </div>
      <p className="mt-4 text-base font-black text-[#0f172a]">
        반지름 <MaskedValue value={`${radius}cm`} showAnswer={showAnswer || !mission.visualConfig.hideRadiusUntilReveal} testId="grade3-circle-radius" />
        <span className="mx-2" />
        지름 <MaskedValue value={`${diameter}cm`} showAnswer={showAnswer || !mission.visualConfig.hideDiameterUntilReveal} testId="grade3-circle-diameter" />
      </p>
    </div>
  )
}

function UnitVisual({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const isWeight = mission.visualModel === 'weight-scale'
  const label = isWeight ? `${asNumber(mission.visualConfig.kilograms)}kg ${asNumber(mission.visualConfig.grams)}g` : `${asNumber(mission.visualConfig.liters)}L ${asNumber(mission.visualConfig.milliliters)}mL`
  return (
    <div data-testid={`grade3-visual-${mission.visualModel}`} className="grid place-items-center rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <div className={`grid h-48 w-40 place-items-center rounded-b-3xl rounded-t-lg border-4 ${isWeight ? 'border-[#64748b]' : 'border-[#38bdf8]'} bg-white`}>
        <span className="text-5xl">{isWeight ? '⚖' : 'L'}</span>
      </div>
      <p className="mt-4 text-base font-black text-[#0f172a]">
        값 <MaskedValue value={label} showAnswer={showAnswer} testId="grade3-unit-result" />
      </p>
    </div>
  )
}

function BarGraph({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const categories = asString(mission.visualConfig.categories).split(',')
  const counts = asString(mission.visualConfig.counts).split(',').map(Number)
  const max = Math.max(...counts, 1)
  return (
    <div data-testid="grade3-visual-bar-graph" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <p className="mb-3 text-sm font-black text-[#2563eb]">눈금 한 칸 = {asNumber(mission.visualConfig.unitScale, 1)}</p>
      <div className="grid grid-cols-3 items-end gap-3 rounded-2xl bg-white p-4">
        {categories.map((category, index) => (
          <div key={category} className="grid gap-2 text-center">
            <div className="flex h-40 items-end justify-center">
              <div className="w-12 rounded-t-xl bg-[#2563eb]" style={{ height: `${Math.max(12, (counts[index] / max) * 100)}%` }} />
            </div>
            <span className="text-sm font-black text-[#0f172a]">{category}</span>
            <MaskedValue value={counts[index]} showAnswer={showAnswer} testId={`grade3-graph-count-${index}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

function renderVisual(mission: Grade3Mission, showAnswer?: boolean) {
  switch (mission.visualModel) {
    case 'vertical-operation':
      return <VerticalOperation mission={mission} showAnswer={showAnswer} />
    case 'line-angle-cards':
      return <LineAngleCards mission={mission} showAnswer={showAnswer} />
    case 'division-groups':
      return <DivisionGroups mission={mission} showAnswer={showAnswer} />
    case 'array-area':
      return <ArrayArea mission={mission} showAnswer={showAnswer} />
    case 'ruler-mm':
      return <RulerMm mission={mission} showAnswer={showAnswer} />
    case 'clock-seconds':
      return <ClockSeconds mission={mission} showAnswer={showAnswer} />
    case 'fraction-strip':
      return <FractionStrip mission={mission} showAnswer={showAnswer} />
    case 'decimal-grid':
      return <DecimalGrid mission={mission} showAnswer={showAnswer} />
    case 'circle-parts':
      return <CircleParts mission={mission} showAnswer={showAnswer} />
    case 'capacity-beaker':
    case 'weight-scale':
      return <UnitVisual mission={mission} showAnswer={showAnswer} />
    case 'bar-graph':
      return <BarGraph mission={mission} showAnswer={showAnswer} />
    default:
      return null
  }
}

export default function Grade3MissionVisual({
  mission,
  emphasize = false,
  showAnswer = false,
}: {
  mission: Grade3Mission
  emphasize?: boolean
  showAnswer?: boolean
}) {
  try {
    return (
      <div className={emphasize ? 'rounded-[2rem] ring-4 ring-[#ffb020]' : ''}>
        {renderVisual(mission, showAnswer)}
      </div>
    )
  } catch (error) {
    console.error('Failed to render Grade 3 visual', error)
    return (
      <div data-testid="grade3-visual-fallback" className="rounded-3xl border-2 border-[#ef4444] bg-[#fee2e2] p-5 text-center font-black text-[#0f172a]">
        그림을 다시 준비하고 있어요. 문제와 입력은 계속 사용할 수 있어요.
      </div>
    )
  }
}
