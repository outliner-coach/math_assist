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
  const decimalPlaces = number(mission.visualConfig.decimalPlaces)
  if (decimalPlaces === 2 || decimalPlaces === 3) {
    const allPlaces = ['일', '십분의 일', '백분의 일', '천분의 일']
    const allDigits = [
      number(mission.visualConfig.ones),
      number(mission.visualConfig.tenths),
      number(mission.visualConfig.hundredths),
      number(mission.visualConfig.thousandths),
    ]
    const places = allPlaces.slice(0, decimalPlaces + 1)
    const digits = allDigits.slice(0, decimalPlaces + 1)
    const highlightPlace = label(mission.visualConfig.highlightPlace)
    const hideComposite = Boolean(mission.visualConfig.hideCompositeUntilReveal)
    const composite = `${digits[0]}.${digits.slice(1).join('')}`
    return (
      <div data-testid="grade4-visual-place-value-table" className="overflow-hidden rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-4">
        <div className="grid w-full overflow-hidden rounded-2xl border-2 border-[#a5b4fc] bg-white" style={{ gridTemplateColumns: `repeat(${places.length}, minmax(0, 1fr))` }}>
          {places.map((place) => (
            <div key={place} className={`border-r border-[#c7d2fe] p-3 text-center text-xs font-black last:border-r-0 ${highlightPlace === place ? 'bg-[#fef3c7] text-[#92400e]' : 'text-[#4338ca]'}`}>
              {place}
            </div>
          ))}
          {digits.map((digit, index) => (
            <div key={`${places[index]}-${digit}`} className={`border-r border-t border-[#c7d2fe] p-4 text-center text-3xl font-black last:border-r-0 ${highlightPlace === places[index] ? 'bg-[#fff7e6] text-[#92400e]' : 'text-[#0f172a]'}`}>
              {digit}
            </div>
          ))}
        </div>
        {hideComposite && showAnswer && (
          <p data-testid="grade4-decimal-composite-result" data-composite={composite} className="mt-3 text-center text-lg font-black text-[#4338ca]">
            완성된 소수: {composite}
          </p>
        )}
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

function fractionDisplay(numerator: number, denominator: number): string {
  const whole = Math.floor(numerator / denominator)
  const remainder = numerator % denominator
  return whole > 0 && remainder > 0 ? `${whole} ${remainder}/${denominator}` : `${numerator}/${denominator}`
}

function FractionBars({ numerator, denominator, labelText }: { numerator: number; denominator: number; labelText: string }) {
  const barCount = Math.max(1, Math.ceil(numerator / denominator))
  return (
    <div className="min-w-0 rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-center text-xs font-black text-[#6366f1]">{labelText}</p>
      <p className="mt-1 text-center text-xl font-black text-[#0f172a]">{fractionDisplay(numerator, denominator)}</p>
      <div className="mt-3 grid gap-2">
        {Array.from({ length: barCount }, (_, barIndex) => (
          <div key={barIndex} className="grid overflow-hidden rounded-lg border-2 border-[#a5b4fc]" style={{ gridTemplateColumns: `repeat(${denominator}, minmax(0, 1fr))` }}>
            {Array.from({ length: denominator }, (_, cellIndex) => {
              const filled = barIndex * denominator + cellIndex < numerator
              return <span key={cellIndex} aria-hidden="true" className={`h-7 border-r border-[#a5b4fc] last:border-r-0 ${filled ? 'bg-[#818cf8]' : 'bg-white'}`} />
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function FractionStrip({ mission, showAnswer }: { mission: Grade4Mission; showAnswer?: boolean }) {
  const denominator = Math.max(1, number(mission.visualConfig.denominator))
  const firstNumerator = Math.max(0, number(mission.visualConfig.firstNumerator))
  const secondValue = mission.visualConfig.secondNumerator
  const secondNumerator = secondValue === undefined ? null : Math.max(0, number(secondValue))
  const totalValue = mission.visualConfig.totalNumerator
  const totalNumerator = totalValue === undefined ? null : Math.max(0, number(totalValue))
  const operation = label(mission.visualConfig.operation)
  const symbol = operation === 'subtract' ? '−' : '+'

  return (
    <div data-testid="grade4-visual-fraction-strip" data-denominator={denominator} className="overflow-hidden rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-4">
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
        <FractionBars numerator={firstNumerator} denominator={denominator} labelText={label(mission.visualConfig.firstLabel) || '첫 번째 분수'} />
        <span className="text-center text-3xl font-black text-[#f97316]">{symbol}</span>
        {secondNumerator === null ? (
          <div className="rounded-2xl border-2 border-dashed border-[#a5b4fc] bg-white p-6 text-center text-3xl font-black text-[#64748b]" aria-label="구할 분수">□</div>
        ) : (
          <FractionBars numerator={secondNumerator} denominator={denominator} labelText={label(mission.visualConfig.secondLabel) || '두 번째 분수'} />
        )}
      </div>
      {totalNumerator !== null && (
        <p className="mt-3 rounded-2xl bg-white p-3 text-center font-black text-[#4338ca]">
          합은 {fractionDisplay(totalNumerator, denominator)}
        </p>
      )}
      {showAnswer && mission.answerType === 'fraction' && (
        <p data-testid="grade4-fraction-result" data-result={mission.correctAnswer} className="mt-3 rounded-2xl bg-[#dcfce7] p-3 text-center text-lg font-black text-[#166534]">
          답: {mission.correctAnswer}
        </p>
      )}
    </div>
  )
}

function DivisionModel({ mission, showAnswer }: { mission: Grade4Mission; showAnswer?: boolean }) {
  const divisor = number(mission.visualConfig.divisor)
  const dividend = number(mission.visualConfig.dividend)
  const hideDividend = Boolean(mission.visualConfig.hideDividendUntilReveal)
  const givenQuotient = mission.visualConfig.givenQuotient === undefined
    ? null
    : number(mission.visualConfig.givenQuotient)
  const givenRemainder = mission.visualConfig.givenRemainder === undefined
    ? null
    : number(mission.visualConfig.givenRemainder)
  const trialQuotient = mission.visualConfig.trialQuotient === undefined
    ? null
    : number(mission.visualConfig.trialQuotient)
  const quotient = divisor > 0 ? Math.floor(dividend / divisor) : 0
  const remainder = divisor > 0 ? dividend % divisor : 0
  const revealDividend = !hideDividend || showAnswer

  return (
    <div data-testid="grade4-visual-division-model" className="rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-5">
      {givenQuotient !== null && givenRemainder !== null && (
        <div className="mb-4 grid grid-cols-2 gap-3 text-center">
          <span className="rounded-2xl bg-white p-3 font-black text-[#4338ca]">주어진 몫 {givenQuotient}</span>
          <span className="rounded-2xl bg-white p-3 font-black text-[#4338ca]">주어진 나머지 {givenRemainder}</span>
        </div>
      )}
      <div aria-label="두 자리 수 나눗셈 세로 모형" className="mx-auto grid max-w-sm grid-cols-[auto_1fr] items-end gap-x-3">
        <span className="pb-3 text-2xl font-black text-[#4338ca]">{divisor}</span>
        <div className="border-b-4 border-l-4 border-[#4f46e5] px-5 py-3 text-center text-3xl font-black text-[#0f172a]">
          {revealDividend ? (
            <span data-dividend={dividend}>{dividend.toLocaleString('ko-KR')}</span>
          ) : (
            <span aria-label="구할 나누어지는 수">□</span>
          )}
        </div>
      </div>
      {trialQuotient !== null && (
        <p className="mt-4 rounded-2xl bg-white p-3 text-center font-black text-[#9a3412]">시험 몫 {trialQuotient}</p>
      )}
      {showAnswer ? (
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <span data-quotient={quotient} className="rounded-2xl bg-[#dcfce7] p-3 font-black text-[#166534]">몫 {quotient}</span>
          <span data-remainder={remainder} className="rounded-2xl bg-[#dcfce7] p-3 font-black text-[#166534]">나머지 {remainder}</span>
        </div>
      ) : (
        <p className="mt-4 text-center font-black text-[#64748b]">몫 □ · 나머지 □</p>
      )}
    </div>
  )
}

export default function Grade4MissionVisual({ mission, showAnswer = false }: { mission: Grade4Mission; showAnswer?: boolean }) {
  if (mission.visualModel === 'place-value-table') return <PlaceValueTable mission={mission} showAnswer={showAnswer} />
  if (mission.visualModel === 'number-cards') return <NumberCards mission={mission} />
  if (mission.visualModel === 'number-line') return <NumberLine mission={mission} showAnswer={showAnswer} />
  if (mission.visualModel === 'division-model') return <DivisionModel mission={mission} showAnswer={showAnswer} />
  if (mission.visualModel === 'fraction-strip') return <FractionStrip mission={mission} showAnswer={showAnswer} />
  return <Context mission={mission} />
}
