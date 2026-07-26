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

function LineAngleCards({ mission }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const cards = mission.choices?.length
    ? mission.choices
    : asString(mission.visualConfig.cards).split(',').filter(Boolean)
  const rayEndX = Number(mission.visualConfig.rayEndX)
  const rayEndY = Number(mission.visualConfig.rayEndY)
  const hasAngleRays = Number.isFinite(rayEndX) && Number.isFinite(rayEndY)
  return (
    <div data-testid="grade3-visual-line-angle-cards" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card} className="rounded-2xl border-2 border-white bg-white p-4 text-center text-xl font-black text-[#2563eb] shadow-sm">
            {card}
          </div>
        ))}
      </div>
      {hasAngleRays && (
        <div className="mt-5 grid place-items-center rounded-2xl bg-white p-5">
          <svg
            viewBox="0 0 180 130"
            role="img"
            aria-label="직각과 비교할 두 반직선"
            className="h-36 w-full max-w-64"
          >
            <defs>
              <marker id="grade3-ray-arrow-dark" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a" />
              </marker>
              <marker id="grade3-ray-arrow-orange" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
              </marker>
            </defs>
            {mission.visualConfig.showRightAngleGuide && (
              <g data-testid="grade3-right-angle-guide" aria-hidden="true">
                <line x1="76" y1="100" x2="76" y2="24" stroke="#94a3b8" strokeWidth="3" strokeDasharray="7 6" />
                <path d="M 76 82 L 94 82 L 94 100" fill="none" stroke="#94a3b8" strokeWidth="3" />
              </g>
            )}
            <line
              data-testid="grade3-angle-ray-base"
              x1="76"
              y1="100"
              x2="154"
              y2="100"
              stroke="#0f172a"
              strokeWidth="7"
              strokeLinecap="round"
              markerEnd="url(#grade3-ray-arrow-dark)"
            />
            <line
              data-testid="grade3-angle-ray-compare"
              x1="76"
              y1="100"
              x2={rayEndX}
              y2={rayEndY}
              stroke="#f97316"
              strokeWidth="7"
              strokeLinecap="round"
              markerEnd="url(#grade3-ray-arrow-orange)"
            />
            <circle cx="76" cy="100" r="6" fill="#2563eb" />
          </svg>
          <p className="text-sm font-black text-[#64748b]">점선 직각과 표시한 각을 비교해 보세요.</p>
        </div>
      )}
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
  const rows = Math.max(1, Math.floor(asNumber(mission.visualConfig.rows, 1)))
  const cols = Math.max(1, Math.floor(asNumber(mission.visualConfig.cols, 1)))
  const product = asNumber(mission.visualConfig.product)
  const columnGroups: number[] = []
  for (let remaining = cols; remaining > 0; remaining -= 10) {
    columnGroups.push(Math.min(remaining, 10))
  }

  return (
    <div data-testid="grade3-visual-array-area" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        role="img"
        aria-label={`${rows}줄, ${cols}칸을 10칸씩 나누어 나타낸 점 배열`}
      >
        {columnGroups.map((groupColumns, groupIndex) => (
          <div
            key={groupIndex}
            data-testid="grade3-array-group"
            className="rounded-2xl border-2 border-[#bfdbfe] bg-white p-3 shadow-sm"
          >
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${groupColumns}, minmax(0, 1fr))` }}
              aria-hidden="true"
            >
              {Array.from({ length: rows * groupColumns }).map((_, index) => (
                <span
                  key={index}
                  data-testid="grade3-array-cell"
                  className="aspect-square min-h-2 rounded-sm bg-[#60a5fa]"
                />
              ))}
            </div>
            <p className="mt-2 text-center text-xs font-black text-[#64748b]">{groupColumns}칸 묶음</p>
          </div>
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
  const maxMm = Math.max(10, Math.floor(asNumber(mission.visualConfig.maxMm, 60)))
  const objectLengthMm = centimeters * 10 + millimeters
  const rulerStartX = 30
  const rulerWidth = 560
  const rulerX = (millimeter: number) =>
    Number((rulerStartX + (millimeter / maxMm) * rulerWidth).toFixed(2))
  const objectEndX = rulerX(objectLengthMm)

  return (
    <div data-testid="grade3-visual-ruler-mm" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <svg
        viewBox="0 0 620 190"
        role="img"
        aria-label="0부터 6센티미터까지 센티미터와 밀리미터 눈금, 물체의 시작점과 끝점이 표시된 자"
        className="h-auto w-full rounded-2xl bg-[#fef3c7]"
      >
        <line x1={rulerStartX} y1="130" x2={rulerStartX + rulerWidth} y2="130" stroke="#92400e" strokeWidth="5" />
        {Array.from({ length: maxMm + 1 }).map((_, millimeter) => {
          const isCentimeter = millimeter % 10 === 0
          const isHalfCentimeter = millimeter % 5 === 0
          const tickTop = isCentimeter ? 56 : isHalfCentimeter ? 76 : 92
          return (
            <g key={millimeter}>
              <line
                data-testid="grade3-ruler-tick"
                x1={rulerX(millimeter)}
                y1={tickTop}
                x2={rulerX(millimeter)}
                y2="130"
                stroke="#92400e"
                strokeWidth={isCentimeter ? 4 : 2}
              />
              {isCentimeter && (
                <text
                  data-testid="grade3-ruler-label"
                  x={rulerX(millimeter)}
                  y="42"
                  textAnchor="middle"
                  className="fill-[#78350f] text-2xl font-black"
                >
                  {millimeter / 10}
                </text>
              )}
            </g>
          )
        })}
        <text x="596" y="42" textAnchor="end" className="fill-[#78350f] text-lg font-black">cm</text>
        <line
          data-testid="grade3-ruler-object"
          x1={rulerStartX}
          y1="158"
          x2={objectEndX}
          y2="158"
          stroke="#2563eb"
          strokeWidth="12"
          strokeLinecap="round"
          aria-hidden="true"
        />
        <circle cx={rulerStartX} cy="158" r="8" fill="#1d4ed8" aria-hidden="true" />
        <circle cx={objectEndX} cy="158" r="10" fill="#f97316" aria-hidden="true" />
      </svg>
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
  const mode = asString(mission.visualConfig.mode)
  const centerLabel = asString(mission.visualConfig.centerLabel, 'O')
  const centerOnly = asString(mission.visualConfig.target) === '원의 중심'

  if (mode === 'construction') {
    const displayRadius = Math.min(72, Math.max(54, diameter * 5))
    const centerX = 105
    const centerY = 112
    const answerRadius = diameter / 2

    return (
      <div data-testid="grade3-visual-circle-parts" className="grid place-items-center rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
        <svg
          viewBox="0 0 210 215"
          role="img"
          aria-label={`중심점 O와 지름 ${diameter}센티미터가 표시된 원 구성 자료`}
          className="h-auto w-full max-w-72 rounded-2xl bg-white"
        >
          <circle
            data-testid="grade3-construction-given-circle"
            cx={centerX}
            cy={centerY}
            r={displayRadius}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="4"
          />
          <line
            data-testid="grade3-construction-given-diameter"
            x1={centerX - displayRadius}
            y2={centerY}
            x2={centerX + displayRadius}
            y1={centerY}
            stroke="#0f172a"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle
            data-testid={`grade3-compass-center-${centerLabel}`}
            cx={centerX}
            cy={centerY}
            r="7"
            fill="#2563eb"
          />
          <text x={centerX - 15} y={centerY + 24} className="fill-[#0f172a] text-lg font-black">
            {centerLabel}
          </text>
          <text x={centerX} y={200} textAnchor="middle" className="fill-[#0f172a] text-base font-black">
            지름 {diameter}cm
          </text>
        </svg>
        <p className="mt-4 text-center text-base font-black text-[#0f172a]">
          구성에 사용한 컴퍼스 폭{' '}
          <MaskedValue
            value={`${answerRadius}cm`}
            showAnswer={showAnswer}
            testId="grade3-compass-radius-result"
          />
        </p>
      </div>
    )
  }

  if (centerOnly) {
    return (
      <div data-testid="grade3-visual-circle-parts" className="grid place-items-center rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
        <div
          role="img"
          aria-label="테두리와 가운데 점이 표시된 원"
          className="relative h-56 w-56 rounded-full border-8 border-[#2563eb] bg-white"
        >
          <span
            data-testid="grade3-circle-center-point"
            className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f97316]"
          />
        </div>
      </div>
    )
  }

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

function formatMixedMeasure(total: number, majorSize: number, majorUnit: string, minorUnit: string): string {
  const major = Math.floor(total / majorSize)
  const minor = total % majorSize
  if (major === 0) return `${minor}${minorUnit}`
  if (minor === 0) return `${major}${majorUnit}`
  return `${major}${majorUnit} ${minor}${minorUnit}`
}

function CapacityScaleRead({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const totalMl = asNumber(mission.visualConfig.totalMl)
  const maxTotal = Math.max(1, asNumber(mission.visualConfig.maxTotal, 2000))
  const tickStep = Math.max(1, asNumber(mission.visualConfig.tickStep, 250))
  const labelStep = Math.max(tickStep, asNumber(mission.visualConfig.labelStep, 500))
  const chartTop = 22
  const chartBottom = 266
  const chartHeight = chartBottom - chartTop
  const yFor = (value: number) =>
    Number((chartBottom - (value / maxTotal) * chartHeight).toFixed(2))
  const ticks = Array.from(
    { length: Math.floor(maxTotal / tickStep) + 1 },
    (_, index) => index * tickStep
  )

  return (
    <div data-testid="grade3-visual-capacity-beaker" className="grid place-items-center rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <svg
        viewBox="0 0 300 300"
        role="img"
        aria-label={`0부터 ${maxTotal / 1000}리터까지 ${tickStep}밀리리터 간격 눈금과 물 높이가 있는 용기`}
        className="h-auto w-full max-w-80 rounded-2xl bg-white"
      >
        <path d="M 76 22 L 76 266 Q 76 282 92 282 L 174 282 Q 190 282 190 266 L 190 22" fill="none" stroke="#0284c7" strokeWidth="7" />
        <rect
          data-testid="grade3-capacity-water-level"
          x="81"
          y={yFor(totalMl)}
          width="104"
          height={Number((chartBottom - yFor(totalMl)).toFixed(2))}
          fill="#7dd3fc"
          opacity="0.85"
        />
        {ticks.map((tick) => {
          const y = yFor(tick)
          const isLabel = tick % labelStep === 0
          return (
            <g key={tick}>
              <line
                data-testid="grade3-capacity-scale-tick"
                x1="190"
                y1={y}
                x2={isLabel ? 216 : 205}
                y2={y}
                stroke="#0f172a"
                strokeWidth={isLabel ? 4 : 2}
              />
              {isLabel && (
                <text x="222" y={y + 5} className="fill-[#0f172a] text-sm font-black">
                  {formatMixedMeasure(tick, 1000, 'L', 'mL')}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <p className="mt-3 text-sm font-black text-[#0369a1]">작은 눈금 한 칸 = {tickStep}mL</p>
      <p className="mt-3 text-center text-base font-black text-[#0f172a]">
        측정한 들이{' '}
        <MaskedValue
          value={formatMixedMeasure(totalMl, 1000, 'L', 'mL')}
          showAnswer={showAnswer}
          testId="grade3-unit-result"
        />
      </p>
    </div>
  )
}

function WeightScaleRead({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const totalG = asNumber(mission.visualConfig.totalG)
  const maxTotal = Math.max(1, asNumber(mission.visualConfig.maxTotal, 3000))
  const tickStep = Math.max(1, asNumber(mission.visualConfig.tickStep, 100))
  const labelStep = Math.max(tickStep, asNumber(mission.visualConfig.labelStep, 500))
  const ticks = Array.from(
    { length: Math.floor(maxTotal / tickStep) + 1 },
    (_, index) => index * tickStep
  )
  const angleFor = (value: number) => -120 + (value / maxTotal) * 240
  const polar = (angle: number, radius: number) => {
    const radians = ((angle - 90) * Math.PI) / 180
    return {
      x: Number((150 + Math.cos(radians) * radius).toFixed(2)),
      y: Number((146 + Math.sin(radians) * radius).toFixed(2)),
    }
  }

  return (
    <div data-testid="grade3-visual-weight-scale" className="grid place-items-center rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <svg
        viewBox="0 0 300 285"
        role="img"
        aria-label={`0부터 ${maxTotal / 1000}킬로그램까지 ${tickStep}그램 간격 눈금과 바늘이 있는 저울`}
        className="h-auto w-full max-w-80 rounded-2xl bg-white"
      >
        <circle cx="150" cy="146" r="126" fill="#f8fafc" stroke="#64748b" strokeWidth="7" />
        {ticks.map((tick) => {
          const angle = angleFor(tick)
          const outer = polar(angle, 112)
          const isLabel = tick % labelStep === 0
          const inner = polar(angle, isLabel ? 88 : 98)
          const label = polar(angle, 70)
          return (
            <g key={tick}>
              <line
                data-testid="grade3-weight-scale-tick"
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#0f172a"
                strokeWidth={isLabel ? 4 : 2}
              />
              {isLabel && (
                <text
                  x={label.x}
                  y={label.y + 5}
                  textAnchor="middle"
                  className="fill-[#0f172a] text-xs font-black"
                >
                  {formatMixedMeasure(tick, 1000, 'kg', 'g')}
                </text>
              )}
            </g>
          )
        })}
        <line
          data-testid="grade3-weight-scale-pointer"
          x1="150"
          y1="146"
          x2="150"
          y2="68"
          stroke="#f97316"
          strokeWidth="8"
          strokeLinecap="round"
          transform={`rotate(${angleFor(totalG)} 150 146)`}
        />
        <circle cx="150" cy="146" r="12" fill="#facc15" stroke="#0f172a" strokeWidth="4" />
        <path d="M 76 238 Q 150 268 224 238" fill="none" stroke="#64748b" strokeWidth="12" strokeLinecap="round" />
      </svg>
      <p className="mt-3 text-sm font-black text-[#475569]">작은 눈금 한 칸 = {tickStep}g</p>
      <p className="mt-3 text-center text-base font-black text-[#0f172a]">
        측정한 무게{' '}
        <MaskedValue
          value={formatMixedMeasure(totalG, 1000, 'kg', 'g')}
          showAnswer={showAnswer}
          testId="grade3-unit-result"
        />
      </p>
    </div>
  )
}

function UnitVisual({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const isWeight = mission.visualModel === 'weight-scale'
  const mode = asString(mission.visualConfig.mode, 'measure')
  const majorUnit = isWeight ? 'kg' : 'L'
  const minorUnit = isWeight ? 'g' : 'mL'
  const majorValue = asNumber(isWeight ? mission.visualConfig.kilograms : mission.visualConfig.liters)
  const minorValue = asNumber(isWeight ? mission.visualConfig.grams : mission.visualConfig.milliliters)
  const leftTotal = asNumber(isWeight ? mission.visualConfig.leftG : mission.visualConfig.leftMl)
  const rightTotal = asNumber(isWeight ? mission.visualConfig.rightG : mission.visualConfig.rightMl)
  const operator = asString(mission.visualConfig.operator, '+')
  const label = `${majorValue}${majorUnit} ${minorValue}${minorUnit}`

  if (mode === 'scale-read') {
    return isWeight
      ? <WeightScaleRead mission={mission} showAnswer={showAnswer} />
      : <CapacityScaleRead mission={mission} showAnswer={showAnswer} />
  }

  if (mode === 'operation') {
    return (
      <div data-testid={`grade3-visual-${mission.visualModel}`} className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="rounded-2xl bg-white p-4 text-center text-xl font-black text-[#0f172a] shadow-sm">
            {formatMixedMeasure(leftTotal, 1000, majorUnit, minorUnit)}
          </div>
          <span className="text-3xl font-black text-[#0f766e]">{operator}</span>
          <div className="rounded-2xl bg-white p-4 text-center text-xl font-black text-[#0f172a] shadow-sm">
            {formatMixedMeasure(rightTotal, 1000, majorUnit, minorUnit)}
          </div>
        </div>
        <p className="mt-4 text-center text-base font-black text-[#0f172a]">
          계산 결과 <MaskedValue value={mission.correctAnswer} showAnswer={showAnswer} testId="grade3-unit-result" />
        </p>
      </div>
    )
  }

  if (mode === 'conversion') {
    return (
      <div data-testid={`grade3-visual-${mission.visualModel}`} className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
        <p className="rounded-2xl bg-white p-5 text-center text-2xl font-black text-[#0f172a] shadow-sm">{label}</p>
        <p className="mt-4 text-center text-base font-black text-[#0f172a]">
          {minorUnit}로 <MaskedValue value={`${mission.correctAnswer}${minorUnit}`} showAnswer={showAnswer} testId="grade3-unit-result" />
        </p>
      </div>
    )
  }

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

function TonneScale({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const tonnes = Math.max(1, Math.floor(asNumber(mission.visualConfig.tonnes, 1)))
  const kilogramsPerTonne = asNumber(mission.visualConfig.kilogramsPerTonne, 1000)
  return (
    <div data-testid="grade3-visual-tonne-scale" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <p className="text-center text-base font-black text-[#0f766e]">1t = {kilogramsPerTonne}kg</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: tonnes }).map((_, index) => (
          <div
            key={index}
            data-tonne-block="true"
            className="grid min-h-24 place-items-center rounded-2xl border-4 border-[#64748b] bg-white text-2xl font-black text-[#0f172a] shadow-sm"
          >
            1t
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-base font-black text-[#0f172a]">
        모두 <MaskedValue value={`${mission.correctAnswer}kg`} showAnswer={showAnswer} testId="grade3-tonne-result" />
      </p>
    </div>
  )
}

function BarGraph({ mission, showAnswer }: { mission: Grade3Mission; showAnswer?: boolean }) {
  const categories = asString(mission.visualConfig.categories).split(',')
  const counts = asString(mission.visualConfig.counts).split(',').map(Number)
  const unitScale = Math.max(1, asNumber(mission.visualConfig.unitScale, 1))
  const unitLabel = asString(mission.visualConfig.unitLabel, '개')
  const max = Math.max(...counts, unitScale)
  const topTick = Math.ceil(max / unitScale) * unitScale
  const ticks = Array.from({ length: topTick / unitScale + 1 }, (_, index) => index * unitScale)
  const chartLeft = 46
  const chartRight = 348
  const chartTop = 18
  const chartBottom = 214
  const chartHeight = chartBottom - chartTop
  const slotWidth = (chartRight - chartLeft) / categories.length
  const barWidth = Math.min(52, slotWidth * 0.48)
  const yForValue = (value: number) =>
    Number((chartBottom - (value / topTick) * chartHeight).toFixed(2))

  return (
    <div data-testid="grade3-visual-bar-graph" className="rounded-3xl border-2 border-[#d8e3ef] bg-[#f8fbff] p-5">
      <p className="mb-3 text-sm font-black text-[#2563eb]">눈금 한 칸 = {unitScale}{unitLabel}</p>
      <div className="rounded-2xl bg-white p-2 sm:p-4">
        <svg
          viewBox="0 0 360 260"
          role="img"
          aria-label="세로축 눈금, 가로축 항목, 격자와 막대가 있는 막대그래프"
          className="h-auto w-full"
        >
          {ticks.map((tick) => {
            const y = yForValue(tick)
            return (
              <g key={tick}>
                <line
                  data-testid="grade3-graph-gridline"
                  x1={chartLeft}
                  y1={y}
                  x2={chartRight}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                <text
                  data-testid="grade3-graph-y-tick"
                  x={chartLeft - 10}
                  y={y + 5}
                  textAnchor="end"
                  className="fill-[#475569] text-sm font-black"
                >
                  {tick}
                </text>
              </g>
            )
          })}
          <line
            data-testid="grade3-graph-y-axis"
            x1={chartLeft}
            y1={chartTop}
            x2={chartLeft}
            y2={chartBottom}
            stroke="#0f172a"
            strokeWidth="3"
          />
          <line
            data-testid="grade3-graph-x-axis"
            x1={chartLeft}
            y1={chartBottom}
            x2={chartRight}
            y2={chartBottom}
            stroke="#0f172a"
            strokeWidth="3"
          />
          {categories.map((category, index) => {
            const centerX = chartLeft + slotWidth * (index + 0.5)
            const barTop = yForValue(counts[index])
            return (
              <g key={category}>
                <rect
                  data-testid={`grade3-graph-bar-${index}`}
                  x={Number((centerX - barWidth / 2).toFixed(2))}
                  y={barTop}
                  width={Number(barWidth.toFixed(2))}
                  height={Number((chartBottom - barTop).toFixed(2))}
                  rx="8"
                  fill="#2563eb"
                />
                <text
                  x={Number(centerX.toFixed(2))}
                  y="242"
                  textAnchor="middle"
                  className="fill-[#0f172a] text-sm font-black"
                >
                  {category}
                </text>
              </g>
            )
          })}
        </svg>
        <div className="mt-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}>
          {categories.map((category, index) => (
            <div key={category} className="text-center">
              <MaskedValue value={counts[index]} showAnswer={showAnswer} testId={`grade3-graph-count-${index}`} />
            </div>
          ))}
        </div>
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
    case 'tonne-scale':
      return <TonneScale mission={mission} showAnswer={showAnswer} />
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
