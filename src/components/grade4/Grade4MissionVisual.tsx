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

function DecimalDigits({ scaled }: { scaled: number }) {
  const whole = Math.floor(scaled / 100)
  const tenths = Math.floor((scaled % 100) / 10)
  const hundredths = scaled % 10
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)_minmax(0,1fr)] text-center text-2xl font-black text-[#0f172a]">
      <span className="p-2">{whole}</span>
      <span aria-label="소수점" className="p-2 text-[#f97316]">.</span>
      <span className="border-l border-[#c7d2fe] p-2">{tenths}</span>
      <span className="border-l border-[#c7d2fe] p-2">{hundredths}</span>
    </div>
  )
}

function decimalText(scaled: number): string {
  return `${Math.floor(scaled / 100)}.${String(scaled % 100).padStart(2, '0')}`
}

function DecimalOperationRow({ scaled, operator = '' }: { scaled: number; operator?: string }) {
  const whole = Math.floor(scaled / 100)
  const tenths = Math.floor((scaled % 100) / 10)
  const hundredths = scaled % 10
  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)_minmax(0,1fr)] items-center text-center text-2xl font-black text-[#0f172a]">
      <span className={operator ? 'text-[#f97316]' : 'text-[#94a3b8]'}>{operator || '\u00a0'}</span>
      <span className="p-2">{whole}</span>
      <span aria-label="소수점" className="p-2 text-[#f97316]">.</span>
      <span className="border-l border-[#c7d2fe] p-2">{tenths}</span>
      <span className="border-l border-[#c7d2fe] p-2">{hundredths}</span>
    </div>
  )
}

function DecimalOperation({ mission, showAnswer }: { mission: Grade4Mission; showAnswer?: boolean }) {
  const leftScaled = number(mission.visualConfig.leftScaled)
  const rightValue = mission.visualConfig.rightScaled
  const rightScaled = rightValue === undefined ? null : number(rightValue)
  const totalValue = mission.visualConfig.totalScaled
  const totalScaled = totalValue === undefined ? null : number(totalValue)
  const operation = label(mission.visualConfig.operation)
  const isMissingAddend = operation === 'missing-addend'
  const symbol = operation === 'subtract' ? '−' : '+'
  const calculatedResult = showAnswer && mission.answerType === 'decimal'
    ? (isMissingAddend ? (totalScaled ?? 0) - leftScaled : symbol === '−' ? leftScaled - (rightScaled ?? 0) : leftScaled + (rightScaled ?? 0))
    : null

  if (isMissingAddend && totalScaled !== null) {
    return (
      <div data-testid="grade4-visual-decimal-operation" className="overflow-hidden rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-4">
        <p className="mb-3 text-center text-xs font-black text-[#4338ca]">소수점을 맞추어 같은 자리끼리 계산해요</p>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
          <div className="rounded-2xl bg-white p-2 shadow-sm"><DecimalDigits scaled={leftScaled} /></div>
          <span className="text-center text-2xl font-black text-[#f97316]">+</span>
          <div aria-label="구할 소수" className="rounded-2xl border-2 border-dashed border-[#a5b4fc] bg-white p-4 text-center text-3xl font-black text-[#64748b]">□</div>
          <span className="text-center text-2xl font-black text-[#f97316]">=</span>
          <div className="rounded-2xl bg-white p-2 shadow-sm"><DecimalDigits scaled={totalScaled} /></div>
        </div>
        {calculatedResult !== null && (
          <p data-testid="grade4-decimal-operation-result" data-result={decimalText(calculatedResult)} className="mt-3 rounded-2xl bg-[#dcfce7] p-3 text-center text-lg font-black text-[#166534]">
            답: {decimalText(calculatedResult)}
          </p>
        )}
      </div>
    )
  }

  return (
    <div data-testid="grade4-visual-decimal-operation" className="overflow-hidden rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-4">
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border-2 border-[#a5b4fc] bg-white shadow-sm">
        <div className="grid grid-cols-[2rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)_minmax(0,1fr)] border-b border-[#c7d2fe] bg-[#e0e7ff] text-center text-[11px] font-black text-[#4338ca]">
          <span aria-hidden="true" className="p-2" />
          <span className="p-2">일</span>
          <span className="whitespace-nowrap p-2">소수점</span>
          <span className="p-2">십분의 일</span>
          <span className="p-2">백분의 일</span>
        </div>
        <div className="border-b border-[#c7d2fe]"><DecimalOperationRow scaled={leftScaled} /></div>
        {rightScaled === null
          ? <span className="block p-4 text-center text-3xl font-black text-[#64748b]">□</span>
          : <DecimalOperationRow scaled={rightScaled} operator={symbol} />}
      </div>
      {calculatedResult !== null && (
        <p data-testid="grade4-decimal-operation-result" data-result={decimalText(calculatedResult)} className="mx-auto mt-3 max-w-md rounded-2xl bg-[#dcfce7] p-3 text-center text-lg font-black text-[#166534]">
          답: {decimalText(calculatedResult)}
        </p>
      )}
    </div>
  )
}

function PatternTable({ mission, showAnswer }: { mission: Grade4Mission; showAnswer?: boolean }) {
  const mode = label(mission.visualConfig.mode)
  const requestedPosition = number(mission.visualConfig.requestedPosition)
  const revealResult = showAnswer && mission.answerType === 'integer'
  const result = revealResult ? mission.correctAnswer : null

  if (mode === 'sequence' || mode === 'stages') {
    const values = [1, 2, 3, 4]
      .map((index) => mission.visualConfig[`value${index}`])
      .filter((value) => value !== undefined)
      .map(number)
    const positions = values.map((_, index) => index + 1)
    const itemLabel = label(mission.visualConfig.itemLabel) || '수'
    return (
      <div data-testid="grade4-visual-pattern-table" className="overflow-hidden rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-4">
        <div className="overflow-x-auto rounded-2xl border-2 border-[#a5b4fc] bg-white">
          <div className="grid min-w-[300px]" style={{ gridTemplateColumns: `repeat(${positions.length + 1}, minmax(0, 1fr))` }}>
            {[...positions, requestedPosition].map((position, index) => (
              <span key={`position-${position}-${index}`} className="border-r border-[#c7d2fe] bg-[#e0e7ff] p-2 text-center text-xs font-black text-[#4338ca] last:border-r-0">
                {position}단계
              </span>
            ))}
            {[...values, null].map((value, index) => (
              <span key={`value-${index}`} className="border-r border-t border-[#c7d2fe] p-3 text-center text-2xl font-black text-[#0f172a] last:border-r-0">
                {value ?? '□'}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-2 text-center text-xs font-black text-[#64748b]">{itemLabel}의 변화</p>
        {result !== null && <p data-testid="grade4-pattern-result" data-result={result} className="mt-3 rounded-2xl bg-[#dcfce7] p-3 text-center text-lg font-black text-[#166534]">답: {result}</p>}
      </div>
    )
  }

  if (mode === 'addition' || mode === 'subtraction') {
    const symbol = mode === 'addition' ? '+' : '−'
    const rows = [1, 2, 3].map((index) => ({
      left: number(mission.visualConfig[`left${index}`]),
      right: number(mission.visualConfig[`right${index}`]),
      output: number(mission.visualConfig[`output${index}`]),
    }))
    const requestedLeft = number(mission.visualConfig.requestedLeft)
    const requestedRight = number(mission.visualConfig.requestedRight)
    return (
      <div data-testid="grade4-visual-pattern-table" className="rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-4">
        <div className="grid gap-2">
          {rows.map((row, index) => <p key={index} className="rounded-xl bg-white p-3 text-center text-lg font-black text-[#0f172a]">{row.left} {symbol} {row.right} = {row.output}</p>)}
          <p className="rounded-xl border-2 border-dashed border-[#a5b4fc] bg-white p-3 text-center text-lg font-black text-[#0f172a]">{requestedLeft} {symbol} {requestedRight} = □</p>
        </div>
        {result !== null && <p data-testid="grade4-pattern-result" data-result={result} className="mt-3 rounded-2xl bg-[#dcfce7] p-3 text-center text-lg font-black text-[#166534]">답: {result}</p>}
      </div>
    )
  }

  const inputLabel = label(mission.visualConfig.inputLabel) || (mode === 'multiplication' || mode === 'multiply-add' ? '곱하는 수' : '위 수')
  const outputLabel = label(mission.visualConfig.outputLabel) || '아래 수'
  const inputs = [1, 2, 3].map((index) => number(mission.visualConfig[`input${index}`]))
  const outputs = [1, 2, 3].map((index) => number(mission.visualConfig[`output${index}`]))
  const factor = number(mission.visualConfig.factor)
  return (
    <div data-testid="grade4-visual-pattern-table" className="overflow-hidden rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-4">
      <div className="grid grid-cols-[5rem_repeat(4,minmax(0,1fr))] overflow-hidden rounded-2xl border-2 border-[#a5b4fc] bg-white text-center">
        <span className="bg-[#e0e7ff] p-2 text-xs font-black text-[#4338ca]">{inputLabel}</span>
        {[...inputs, requestedPosition].map((value, index) => <span key={`input-${index}`} className="border-l border-[#c7d2fe] bg-[#e0e7ff] p-2 font-black text-[#0f172a]">{value}</span>)}
        <span className="border-t border-[#c7d2fe] p-2 text-xs font-black text-[#4338ca]">{outputLabel}</span>
        {[...outputs, null].map((value, index) => <span key={`output-${index}`} className="border-l border-t border-[#c7d2fe] p-2 text-lg font-black text-[#0f172a]">{value ?? '□'}</span>)}
      </div>
      {(mode === 'multiplication' || mode === 'multiply-add') && (
        <p className="mt-2 text-center text-xs font-black text-[#64748b]">
          {mode === 'multiply-add' ? `${factor}×(곱하는 수)+(곱하는 수)` : `${factor}×(곱하는 수)`}
        </p>
      )}
      {result !== null && <p data-testid="grade4-pattern-result" data-result={result} className="mt-3 rounded-2xl bg-[#dcfce7] p-3 text-center text-lg font-black text-[#166534]">답: {result}</p>}
    </div>
  )
}

function EquationBalance({ mission, showAnswer }: { mission: Grade4Mission; showAnswer?: boolean }) {
  const leftText = label(mission.visualConfig.leftText)
  const rightText = label(mission.visualConfig.rightText)
  const leftLabel = label(mission.visualConfig.leftLabel) || '왼쪽 양'
  const rightLabel = label(mission.visualConfig.rightLabel) || '오른쪽 양'
  const revealResult = showAnswer && mission.answerType === 'integer'

  return (
    <div data-testid="grade4-visual-equation-balance" className="rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-4">
      <p className="mb-3 text-center text-sm font-black text-[#4338ca]">등호로 연결한 두 양이 같아요</p>
      <div className="grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] items-end gap-2">
        <div className="min-w-0">
          <p className="mb-2 text-center text-xs font-black text-[#6366f1]">{leftLabel}</p>
          <div className="rounded-2xl border-2 border-[#a5b4fc] bg-white p-4 text-center text-xl font-black text-[#0f172a] shadow-sm">{leftText}</div>
        </div>
        <div aria-hidden="true" className="flex flex-col items-center">
          <span className="text-3xl font-black text-[#f97316]">=</span>
          <span className="h-2 w-full rounded-full bg-[#4f46e5]" />
          <span className="h-8 w-1 bg-[#4f46e5]" />
          <span className="h-2 w-10 rounded-full bg-[#4f46e5]" />
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-center text-xs font-black text-[#6366f1]">{rightLabel}</p>
          <div className="rounded-2xl border-2 border-[#a5b4fc] bg-white p-4 text-center text-xl font-black text-[#0f172a] shadow-sm">{rightText}</div>
        </div>
      </div>
      {revealResult && (
        <p data-testid="grade4-equality-result" data-result={mission.correctAnswer} className="mt-3 rounded-2xl bg-[#dcfce7] p-3 text-center text-lg font-black text-[#166534]">
          답: {mission.correctAnswer}
        </p>
      )}
    </div>
  )
}

interface Point {
  x: number
  y: number
}

function direction(angle: number): Point {
  const radians = angle * Math.PI / 180
  return { x: Math.cos(radians), y: -Math.sin(radians) }
}

function lineEndpoints(center: Point, angle: number, halfLength: number): [Point, Point] {
  const unit = direction(angle)
  return [
    { x: center.x - unit.x * halfLength, y: center.y - unit.y * halfLength },
    { x: center.x + unit.x * halfLength, y: center.y + unit.y * halfLength },
  ]
}

function LineRelationship({ mission }: { mission: Grade4Mission }) {
  const angleA = number(mission.visualConfig.angleA)
  const angleB = number(mission.visualConfig.angleB)
  const mode = label(mission.visualConfig.mode)
  const offset = Math.max(42, number(mission.visualConfig.offset) || 54)
  const isParallel = mode === 'parallel' || mode === 'parallel-through-point'
  const isSeparate = mode === 'separate-nonparallel'
  const normal = direction(angleA + 90)
  const center: Point = { x: 160, y: 95 }
  const centerA = isParallel
    ? { x: center.x - normal.x * offset / 2, y: center.y - normal.y * offset / 2 }
    : isSeparate ? { x: 120, y: 70 } : center
  const centerB = isParallel
    ? { x: center.x + normal.x * offset / 2, y: center.y + normal.y * offset / 2 }
    : isSeparate ? { x: 200, y: 120 } : center
  const halfLength = isSeparate ? 62 : 125
  const [a1, a2] = lineEndpoints(centerA, angleA, halfLength)
  const [b1, b2] = lineEndpoints(centerB, angleB, halfLength)
  const rightAngleSize = 17
  const unitA = direction(angleA)
  const unitB = direction(angleB)
  const rightStart = {
    x: center.x + unitA.x * rightAngleSize,
    y: center.y + unitA.y * rightAngleSize,
  }
  const rightCorner = {
    x: rightStart.x + unitB.x * rightAngleSize,
    y: rightStart.y + unitB.y * rightAngleSize,
  }
  const rightEnd = {
    x: center.x + unitB.x * rightAngleSize,
    y: center.y + unitB.y * rightAngleSize,
  }
  const showRightAngle = Boolean(mission.visualConfig.showRightAngle)
  const pointLabel = label(mission.visualConfig.pointLabel)
  const distanceLabel = label(mission.visualConfig.distanceLabel)

  return (
    <div data-testid="grade4-visual-line-relationship" className="overflow-hidden rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-3">
      <svg
        viewBox="0 0 320 190"
        role="img"
        aria-label={`${label(mission.visualConfig.labelA) || '직선 가'}와 ${label(mission.visualConfig.labelB) || '직선 나'}의 방향 관계`}
        data-angle-a={angleA}
        data-angle-b={angleB}
        className="h-auto w-full"
      >
        <rect x="4" y="4" width="312" height="182" rx="22" fill="#ffffff" />
        <line x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} stroke="#4f46e5" strokeWidth="6" strokeLinecap="round" />
        <line x1={b1.x} y1={b1.y} x2={b2.x} y2={b2.y} stroke="#f97316" strokeWidth="6" strokeLinecap="round" />
        <text x={a1.x + 4} y={a1.y - 9} fill="#3730a3" fontSize="12" fontWeight="800">
          {label(mission.visualConfig.labelA) || '직선 가'}
        </text>
        <text x={b2.x - 4} y={b2.y - 9} fill="#9a3412" fontSize="12" fontWeight="800" textAnchor="end">
          {label(mission.visualConfig.labelB) || '직선 나'}
        </text>
        {showRightAngle && (
          <path
            data-testid="grade4-right-angle-mark"
            d={`M ${rightStart.x} ${rightStart.y} L ${rightCorner.x} ${rightCorner.y} L ${rightEnd.x} ${rightEnd.y}`}
            fill="none"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        )}
        {pointLabel && (
          <>
            <circle cx={centerB.x} cy={centerB.y} r="5" fill="#0f172a" />
            <text x={centerB.x + 10} y={centerB.y - 10} fill="#0f172a" fontSize="13" fontWeight="900">{pointLabel}</text>
          </>
        )}
        {distanceLabel && isParallel && (
          <>
            <line
              x1={centerA.x}
              y1={centerA.y}
              x2={centerB.x}
              y2={centerB.y}
              stroke="#0f172a"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            <text x={center.x + 8} y={center.y - 6} fill="#0f172a" fontSize="12" fontWeight="900">{distanceLabel}</text>
          </>
        )}
      </svg>
    </div>
  )
}

function transformedPoint(mission: Grade4Mission): Point {
  const mode = label(mission.visualConfig.mode)
  const startX = number(mission.visualConfig.startX)
  const startY = number(mission.visualConfig.startY)
  if (mode === 'slide') {
    return {
      x: startX + number(mission.visualConfig.deltaX),
      y: startY + number(mission.visualConfig.deltaY),
    }
  }
  if (mode === 'flip-vertical') {
    return { x: 2 * number(mission.visualConfig.axisX) - startX, y: startY }
  }
  if (mode === 'rotate-clockwise') {
    const centerX = number(mission.visualConfig.centerX)
    const centerY = number(mission.visualConfig.centerY)
    let point = { x: startX, y: startY }
    const turns = Math.max(1, number(mission.visualConfig.quarterTurns))
    for (let index = 0; index < turns; index += 1) {
      point = {
        x: centerX + (point.y - centerY),
        y: centerY - (point.x - centerX),
      }
    }
    return point
  }
  if (mode === 'slide-then-flip') {
    const afterSlideX = startX + number(mission.visualConfig.deltaX)
    return {
      x: 2 * number(mission.visualConfig.axisX) - afterSlideX,
      y: startY + number(mission.visualConfig.deltaY),
    }
  }
  return { x: startX, y: startY }
}

function transformationPolygon(anchor: Point, operation: string): string {
  const source = [
    { x: -0.65, y: -0.42 }, { x: 0.15, y: -0.42 }, { x: 0.15, y: -0.78 },
    { x: 0.78, y: 0 }, { x: 0.15, y: 0.78 }, { x: 0.15, y: 0.42 },
    { x: -0.65, y: 0.42 },
  ]
  const transformed = source.map((point) => {
    if (operation === 'flip-vertical' || operation === 'slide-then-flip') {
      return { x: -point.x, y: point.y }
    }
    if (operation === 'rotate-clockwise') {
      return { x: point.y, y: -point.x }
    }
    return point
  })
  const mapX = (value: number) => 30 + value * 25
  const mapY = (value: number) => 180 - value * 15
  return transformed
    .map((point) => `${mapX(anchor.x) + point.x * 13},${mapY(anchor.y) - point.y * 13}`)
    .join(' ')
}

function ShapeTransformation({ mission, showAnswer }: { mission: Grade4Mission; showAnswer?: boolean }) {
  const mode = label(mission.visualConfig.mode)
  const start = { x: number(mission.visualConfig.startX), y: number(mission.visualConfig.startY) }
  const target = transformedPoint(mission)
  const showTarget = Boolean(mission.visualConfig.showTargetBeforeAnswer) || Boolean(showAnswer)
  const axisX = number(mission.visualConfig.axisX)
  const center = { x: number(mission.visualConfig.centerX), y: number(mission.visualConfig.centerY) }
  const mapX = (value: number) => 30 + value * 25
  const mapY = (value: number) => 180 - value * 15
  const targetVector = { x: mapX(target.x) - mapX(start.x), y: mapY(target.y) - mapY(start.y) }
  const targetDistance = Math.hypot(targetVector.x, targetVector.y) || 1
  const indicatorLength = showTarget ? targetDistance : Math.min(32, targetDistance)
  const arrowEnd = {
    x: mapX(start.x) + targetVector.x / targetDistance * indicatorLength,
    y: mapY(start.y) + targetVector.y / targetDistance * indicatorLength,
  }
  const intermediate = mode === 'double-flip'
    ? { x: 2 * axisX - start.x, y: start.y }
    : null

  return (
    <div data-testid="grade4-visual-shape-transformation" className="overflow-hidden rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-3">
      <svg viewBox="0 0 320 210" role="img" aria-label="격자에서 도형과 점의 이동" className="h-auto w-full">
        <rect x="4" y="4" width="312" height="202" rx="22" fill="#ffffff" />
        {Array.from({ length: 11 }, (_, index) => (
          <React.Fragment key={`grid-${index}`}>
            <line x1={mapX(index)} y1={mapY(0)} x2={mapX(index)} y2={mapY(10)} stroke="#e0e7ff" strokeWidth="1" />
            <line x1={mapX(0)} y1={mapY(index)} x2={mapX(10)} y2={mapY(index)} stroke="#e0e7ff" strokeWidth="1" />
          </React.Fragment>
        ))}
        <line x1={mapX(0)} y1={mapY(0)} x2={mapX(10)} y2={mapY(0)} stroke="#64748b" strokeWidth="2" />
        <line x1={mapX(0)} y1={mapY(0)} x2={mapX(0)} y2={mapY(10)} stroke="#64748b" strokeWidth="2" />
        {[0, 5, 10].map((value) => (
          <React.Fragment key={`axis-label-${value}`}>
            <text x={mapX(value)} y="198" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="700">{value}</text>
            {value > 0 && <text x="18" y={mapY(value) + 4} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="700">{value}</text>}
          </React.Fragment>
        ))}
        {(mode === 'flip-vertical' || mode === 'slide-then-flip' || mode === 'double-flip') && (
          <line x1={mapX(axisX)} y1={mapY(0)} x2={mapX(axisX)} y2={mapY(10)} stroke="#0f172a" strokeWidth="2" strokeDasharray="6 4" />
        )}
        {mode === 'rotate-clockwise' && (
          <>
            <circle cx={mapX(center.x)} cy={mapY(center.y)} r="5" fill="#0f172a" />
            <text x={mapX(center.x) + 9} y={mapY(center.y) - 8} fill="#0f172a" fontSize="11" fontWeight="900">O</text>
          </>
        )}
        <polygon points={transformationPolygon(start, 'start')} fill="#818cf8" stroke="#3730a3" strokeWidth="2" />
        <circle cx={mapX(start.x)} cy={mapY(start.y)} r="4" fill="#312e81" />
        <text x={mapX(start.x) - 8} y={mapY(start.y) - 15} textAnchor="end" fill="#3730a3" fontSize="11" fontWeight="900">
          {label(mission.visualConfig.startLabel) || '처음'}
        </text>
        <line
          data-testid="grade4-movement-arrow"
          x1={mapX(start.x)}
          y1={mapY(start.y)}
          x2={arrowEnd.x}
          y2={arrowEnd.y}
          stroke="#f97316"
          strokeWidth="3"
          strokeDasharray={showTarget ? undefined : '5 4'}
        />
        <circle cx={arrowEnd.x} cy={arrowEnd.y} r="3" fill="#f97316" />
        {intermediate && (
          <polygon points={transformationPolygon(intermediate, 'flip-vertical')} fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="5 4" />
        )}
        {showTarget && (
          <g
            data-testid="grade4-transformation-result"
            data-result-x={target.x}
            data-result-y={target.y}
          >
            <polygon points={transformationPolygon(target, mode)} fill="#fed7aa" stroke="#c2410c" strokeWidth="2" />
            <circle cx={mapX(target.x)} cy={mapY(target.y)} r="4" fill="#c2410c" />
            <text x={mapX(target.x) + 8} y={mapY(target.y) - 15} fill="#9a3412" fontSize="11" fontWeight="900">
              {label(mission.visualConfig.targetLabel) || '옮긴 뒤'}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

function TriangleModel({ mission }: { mission: Grade4Mission }) {
  const sideA = Math.max(0.1, number(mission.visualConfig.sideA))
  const sideB = Math.max(0.1, number(mission.visualConfig.sideB))
  const sideC = Math.max(0.1, number(mission.visualConfig.sideC))
  const rawX = (sideB ** 2 + sideC ** 2 - sideA ** 2) / (2 * sideC)
  const rawY = Math.sqrt(Math.max(0.01, sideB ** 2 - rawX ** 2))
  const scale = Math.min(220 / sideC, 125 / rawY)
  const horizontalOffset = (320 - sideC * scale) / 2
  const a: Point = { x: horizontalOffset, y: 170 }
  const b: Point = { x: horizontalOffset + sideC * scale, y: 170 }
  const c: Point = { x: horizontalOffset + rawX * scale, y: 170 - rawY * scale }
  const tolerance = 1e-6
  const squared = { a: sideA ** 2, b: sideB ** 2, c: sideC ** 2 }
  const rightVertex = Math.abs(squared.a + squared.b - squared.c) < tolerance ? c
    : Math.abs(squared.a + squared.c - squared.b) < tolerance ? b
      : Math.abs(squared.b + squared.c - squared.a) < tolerance ? a
        : null
  const rightNeighbors = rightVertex === c ? [a, b] : rightVertex === b ? [a, c] : [b, c]
  const unitFrom = (origin: Point, target: Point) => {
    const distance = Math.hypot(target.x - origin.x, target.y - origin.y) || 1
    return { x: (target.x - origin.x) / distance, y: (target.y - origin.y) / distance }
  }
  const firstUnit = rightVertex ? unitFrom(rightVertex, rightNeighbors[0]) : { x: 0, y: 0 }
  const secondUnit = rightVertex ? unitFrom(rightVertex, rightNeighbors[1]) : { x: 0, y: 0 }
  const markSize = 15
  const markStart = rightVertex ? { x: rightVertex.x + firstUnit.x * markSize, y: rightVertex.y + firstUnit.y * markSize } : null
  const markCorner = markStart ? { x: markStart.x + secondUnit.x * markSize, y: markStart.y + secondUnit.y * markSize } : null
  const markEnd = rightVertex ? { x: rightVertex.x + secondUnit.x * markSize, y: rightVertex.y + secondUnit.y * markSize } : null
  const formatSide = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1)
  const centroid = { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 }
  const sideLabel = (first: Point, second: Point, value: number) => {
    const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
    const dx = second.x - first.x
    const dy = second.y - first.y
    const distance = Math.hypot(dx, dy) || 1
    const normal = { x: -dy / distance, y: dx / distance }
    const candidates = [
      { x: midpoint.x + normal.x * 17, y: midpoint.y + normal.y * 17 },
      { x: midpoint.x - normal.x * 17, y: midpoint.y - normal.y * 17 },
    ]
    const outside = candidates.sort((left, right) => (
      Math.hypot(right.x - centroid.x, right.y - centroid.y)
      - Math.hypot(left.x - centroid.x, left.y - centroid.y)
    ))[0]
    return { ...outside, value }
  }
  const labels = [
    sideLabel(b, c, sideA),
    sideLabel(a, c, sideB),
    sideLabel(a, b, sideC),
  ]

  return (
    <div data-testid="grade4-visual-triangle-model" className="overflow-hidden rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-3">
      <svg
        viewBox="0 0 320 210"
        role="img"
        aria-label="세 변의 길이에서 그린 삼각형"
        data-side-a={sideA}
        data-side-b={sideB}
        data-side-c={sideC}
        className="h-auto w-full"
      >
        <rect x="4" y="4" width="312" height="202" rx="22" fill="#ffffff" />
        {label(mission.visualConfig.contextLabel) && (
          <text x="160" y="24" textAnchor="middle" fill="#4338ca" fontSize="12" fontWeight="900">
            {label(mission.visualConfig.contextLabel)}
          </text>
        )}
        <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`} fill="#e0e7ff" stroke="#4f46e5" strokeWidth="5" strokeLinejoin="round" />
        {labels.map((item, index) => (
          <text key={index} x={item.x} y={item.y} textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900">
            {formatSide(item.value)} cm
          </text>
        ))}
        {rightVertex && markStart && markCorner && markEnd && (
          <path
            data-testid="grade4-triangle-right-angle"
            d={`M ${markStart.x} ${markStart.y} L ${markCorner.x} ${markCorner.y} L ${markEnd.x} ${markEnd.y}`}
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
          />
        )}
      </svg>
    </div>
  )
}

function QuadrilateralModel({ mission }: { mission: Grade4Mission }) {
  const shapeType = label(mission.visualConfig.shapeType)
  const width = Math.max(1, number(mission.visualConfig.width))
  const height = Math.max(1, number(mission.visualConfig.height))
  const topWidth = Math.max(1, number(mission.visualConfig.topWidth) || width * 0.6)
  const slant = Math.max(1, number(mission.visualConfig.slant) || width * 0.25)
  const rightAngles = number(mission.visualConfig.rightAngles)
  const parallelPairs = number(mission.visualConfig.parallelPairs)
  const equalSides = number(mission.visualConfig.equalSides)
  const rawPoints: Point[] = shapeType === 'trapezoid'
    ? [{ x: (width - topWidth) / 2, y: 0 }, { x: (width + topWidth) / 2, y: 0 }, { x: width, y: height }, { x: 0, y: height }]
    : shapeType === 'parallelogram'
      ? [{ x: slant, y: 0 }, { x: width + slant, y: 0 }, { x: width, y: height }, { x: 0, y: height }]
      : shapeType === 'rhombus'
        ? [{ x: width / 2, y: 0 }, { x: width, y: height / 2 }, { x: width / 2, y: height }, { x: 0, y: height / 2 }]
        : [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }]
  const minX = Math.min(...rawPoints.map((point) => point.x))
  const maxX = Math.max(...rawPoints.map((point) => point.x))
  const minY = Math.min(...rawPoints.map((point) => point.y))
  const maxY = Math.max(...rawPoints.map((point) => point.y))
  const scale = Math.min(220 / Math.max(1, maxX - minX), 125 / Math.max(1, maxY - minY))
  const offsetX = (320 - (maxX - minX) * scale) / 2 - minX * scale
  const offsetY = 42 - minY * scale
  const points = rawPoints.map((point) => ({ x: offsetX + point.x * scale, y: offsetY + point.y * scale }))
  const pointString = points.map((point) => `${point.x},${point.y}`).join(' ')
  const midpoint = (first: Point, second: Point) => ({ x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 })
  const unit = (from: Point, to: Point) => {
    const distance = Math.hypot(to.x - from.x, to.y - from.y) || 1
    return { x: (to.x - from.x) / distance, y: (to.y - from.y) / distance }
  }
  const parallelMark = (first: Point, second: Point, count: number) => {
    const middle = midpoint(first, second)
    const direction = unit(first, second)
    const normal = { x: -direction.y, y: direction.x }
    return Array.from({ length: count }, (_, index) => {
      const shift = (index - (count - 1) / 2) * 10
      const center = { x: middle.x + direction.x * shift, y: middle.y + direction.y * shift }
      return `${center.x - direction.x * 6 - normal.x * 4},${center.y - direction.y * 6 - normal.y * 4} ${center.x},${center.y} ${center.x - direction.x * 6 + normal.x * 4},${center.y - direction.y * 6 + normal.y * 4}`
    })
  }
  const rightAnglePath = (index: number) => {
    const vertex = points[index]
    const previous = points[(index + 3) % 4]
    const next = points[(index + 1) % 4]
    const towardPrevious = unit(vertex, previous)
    const towardNext = unit(vertex, next)
    const size = 14
    const first = { x: vertex.x + towardPrevious.x * size, y: vertex.y + towardPrevious.y * size }
    const corner = { x: first.x + towardNext.x * size, y: first.y + towardNext.y * size }
    const last = { x: vertex.x + towardNext.x * size, y: vertex.y + towardNext.y * size }
    return `M ${first.x} ${first.y} L ${corner.x} ${corner.y} L ${last.x} ${last.y}`
  }
  const equalMark = (index: number) => {
    const first = points[index]
    const second = points[(index + 1) % 4]
    const middle = midpoint(first, second)
    const direction = unit(first, second)
    const normal = { x: -direction.y, y: direction.x }
    return {
      x1: middle.x - normal.x * 7,
      y1: middle.y - normal.y * 7,
      x2: middle.x + normal.x * 7,
      y2: middle.y + normal.y * 7,
    }
  }

  return (
    <div data-testid="grade4-visual-quadrilateral-model" className="overflow-hidden rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-3">
      <svg
        viewBox="0 0 320 205"
        role="img"
        aria-label="평행한 변과 직각과 같은 변을 표시한 사각형"
        data-shape-type={shapeType}
        data-right-angles={rightAngles}
        data-parallel-pairs={parallelPairs}
        data-equal-sides={equalSides}
        className="h-auto w-full"
      >
        <rect x="4" y="4" width="312" height="197" rx="22" fill="#ffffff" />
        {label(mission.visualConfig.contextLabel) && (
          <text x="160" y="25" textAnchor="middle" fill="#4338ca" fontSize="12" fontWeight="900">
            {label(mission.visualConfig.contextLabel)}
          </text>
        )}
        <polygon points={pointString} fill="#e0e7ff" stroke="#4f46e5" strokeWidth="5" strokeLinejoin="round" />
        {points.slice(0, Math.max(0, Math.min(4, rightAngles))).map((_, index) => (
          <path key={`right-${index}`} data-testid="grade4-quadrilateral-right-angle" d={rightAnglePath(index)} fill="none" stroke="#f97316" strokeWidth="3" />
        ))}
        {parallelPairs >= 1 && [0, 2].flatMap((sideIndex) => (
          parallelMark(points[sideIndex], points[(sideIndex + 1) % 4], 1).map((mark, index) => (
            <polyline key={`parallel-one-${sideIndex}-${index}`} data-testid="grade4-quadrilateral-parallel-mark" points={mark} fill="none" stroke="#0f766e" strokeWidth="3" />
          ))
        ))}
        {parallelPairs >= 2 && [1, 3].flatMap((sideIndex) => (
          parallelMark(points[sideIndex], points[(sideIndex + 1) % 4], 2).map((mark, index) => (
            <polyline key={`parallel-two-${sideIndex}-${index}`} data-testid="grade4-quadrilateral-parallel-mark" points={mark} fill="none" stroke="#0f766e" strokeWidth="3" />
          ))
        ))}
        {equalSides === 4 && points.map((_, index) => {
          const mark = equalMark(index)
          return <line key={`equal-${index}`} data-testid="grade4-quadrilateral-equal-side" {...mark} stroke="#be123c" strokeWidth="4" strokeLinecap="round" />
        })}
      </svg>
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
  if (mission.visualModel === 'decimal-operation') return <DecimalOperation mission={mission} showAnswer={showAnswer} />
  if (mission.visualModel === 'pattern-table') return <PatternTable mission={mission} showAnswer={showAnswer} />
  if (mission.visualModel === 'equation-balance') return <EquationBalance mission={mission} showAnswer={showAnswer} />
  if (mission.visualModel === 'line-relationship') return <LineRelationship mission={mission} />
  if (mission.visualModel === 'shape-transformation') return <ShapeTransformation mission={mission} showAnswer={showAnswer} />
  if (mission.visualModel === 'triangle-model') return <TriangleModel mission={mission} />
  if (mission.visualModel === 'quadrilateral-model') return <QuadrilateralModel mission={mission} />
  return <Context mission={mission} />
}
