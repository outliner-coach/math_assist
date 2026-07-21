'use client'

import React from 'react'

import type { Grade4Mission } from '@/lib/grade4-problems'

function number(value: unknown): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function label(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function PlaceValueTable({ mission, showAnswer }: { mission: Grade4Mission; showAnswer?: boolean }) {
  const leftPattern = label(mission.visualConfig.leftPattern)
  if (leftPattern) {
    const displayPattern = leftPattern === '4□5000' ? '4□5,000' : leftPattern
    return (
      <div data-testid="grade4-visual-place-value-table" className="grid gap-3 rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <span className="rounded-2xl bg-white p-5 text-center text-3xl font-black text-[#0f172a]">{displayPattern}</span>
        <span className="text-center text-3xl font-black text-[#f97316]">&lt;</span>
        <span className="rounded-2xl bg-white p-5 text-center text-3xl font-black text-[#0f172a]">{number(mission.visualConfig.right).toLocaleString('ko-KR')}</span>
      </div>
    )
  }
  const places = ['십만', '만', '천', '백', '십', '일']
  const configuredDigits = [
    mission.visualConfig.hundredThousands,
    mission.visualConfig.tenThousands,
    mission.visualConfig.thousands,
    mission.visualConfig.hundreds,
    mission.visualConfig.tens,
    mission.visualConfig.ones,
  ]
  const digits = configuredDigits.every((value) => value !== undefined)
    ? configuredDigits.map(number)
    : String(number(mission.visualConfig.number)).padStart(6, '0').split('').map(Number)
  const highlightPlace = label(mission.visualConfig.highlightPlace)
  const hideComposite = Boolean(mission.visualConfig.hideCompositeUntilReveal)
  const visibleDigits = hideComposite && !showAnswer ? digits.map(() => '□') : digits
  const composite = digits.join('')

  return (
    <div data-testid="grade4-visual-place-value-table" className="overflow-x-auto rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-4">
      <div className="grid min-w-[520px] grid-cols-6 overflow-hidden rounded-2xl border-2 border-[#a5b4fc] bg-white">
        {places.map((place) => (
          <div key={place} className={`border-r border-[#c7d2fe] p-3 text-center text-sm font-black last:border-r-0 ${highlightPlace === place ? 'bg-[#fef3c7] text-[#92400e]' : 'text-[#4338ca]'}`}>
            {place}
          </div>
        ))}
        {visibleDigits.map((digit, index) => (
          <div key={`${places[index]}-${digit}`} className={`border-r border-t border-[#c7d2fe] p-4 text-center text-3xl font-black last:border-r-0 ${highlightPlace === places[index] ? 'bg-[#fff7e6] text-[#92400e]' : 'text-[#0f172a]'}`}>
            {digit}
          </div>
        ))}
      </div>
      {hideComposite && showAnswer && <p data-testid="grade4-composite-result" data-composite={composite} className="mt-3 text-center text-lg font-black text-[#4338ca]">완성된 수: {Number(composite).toLocaleString('ko-KR')}</p>}
    </div>
  )
}

function NumberCards({ mission }: { mission: Grade4Mission }) {
  const entries = Object.entries(mission.visualConfig)
    .filter(([key, value]) => ['left', 'right'].includes(key) || key.startsWith('card'))
    .map(([, value]) => number(value))
  return (
    <div data-testid="grade4-visual-number-cards" className="grid gap-3 rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-5 sm:grid-cols-2">
      {entries.map((value, index) => (
        <div key={`${value}-${index}`} className="rounded-2xl bg-white p-5 text-center text-2xl font-black text-[#0f172a] shadow-sm">
          {value.toLocaleString('ko-KR')}
        </div>
      ))}
    </div>
  )
}

function NumberLine({ mission, showAnswer }: { mission: Grade4Mission; showAnswer?: boolean }) {
  const start = number(mission.visualConfig.start)
  const end = mission.visualConfig.end === undefined ? start + number(mission.visualConfig.step) : number(mission.visualConfig.end)
  return (
    <div data-testid="grade4-visual-number-line" className="rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-6">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <span className="rounded-xl bg-white px-3 py-2 text-sm font-black text-[#0f172a]">{start.toLocaleString('ko-KR')}</span>
        <div className="relative h-2 rounded-full bg-[#4f46e5]"><span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#f97316]" /></div>
        <span data-testid="grade4-number-line-end" className="rounded-xl bg-white px-3 py-2 text-sm font-black text-[#0f172a]">
          {mission.visualConfig.unknownEnd && !showAnswer ? '□' : end.toLocaleString('ko-KR')}
        </span>
      </div>
      {mission.visualConfig.unknownMiddle && <p className="mt-4 text-center text-lg font-black text-[#4338ca]">두 수 사이: □</p>}
    </div>
  )
}

function Context({ mission }: { mission: Grade4Mission }) {
  const left = number(mission.visualConfig.left)
  const right = number(mission.visualConfig.right)
  return (
    <div data-testid="grade4-visual-context" className="grid gap-3 rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-5 sm:grid-cols-2">
      {[{ title: label(mission.visualConfig.leftLabel) || '첫 번째 수', value: left }, { title: label(mission.visualConfig.rightLabel) || '두 번째 수', value: right }].map((item) => (
        <div key={item.title} className="rounded-2xl bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-black text-[#6366f1]">{item.title}</p>
          <p className="mt-2 text-2xl font-black text-[#0f172a]">{item.value.toLocaleString('ko-KR')}</p>
        </div>
      ))}
    </div>
  )
}

export default function Grade4MissionVisual({ mission, showAnswer = false }: { mission: Grade4Mission; showAnswer?: boolean }) {
  if (mission.visualModel === 'place-value-table') return <PlaceValueTable mission={mission} showAnswer={showAnswer} />
  if (mission.visualModel === 'number-cards') return <NumberCards mission={mission} />
  if (mission.visualModel === 'number-line') return <NumberLine mission={mission} showAnswer={showAnswer} />
  return <Context mission={mission} />
}
