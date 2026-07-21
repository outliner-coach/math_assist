'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getUnits } from '@/lib/data'
import type { Unit } from '@/lib/types'

export default function Grade5UnitSelectionClient() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUnits()
      .then((items) => setUnits(items.filter((unit) => unit.grade === 5)))
      .catch(() => setUnits([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="-mx-4 -my-6 min-h-screen bg-[#f8fafc] px-4 py-5 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border-2 border-[#ddd6fe] bg-white p-5 md:p-7">
          <Link href="/home" className="inline-flex min-h-[44px] items-center rounded-full border-2 border-[#ddd6fe] px-4 text-sm font-black text-[#7c3aed]">
            학습 홈
          </Link>
          <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#7c3aed]">5학년 개념 연습</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-[#0f172a] md:text-5xl">오늘 공부할 단원을 골라요</h1>
          <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#64748b]">개념을 짧게 읽고 10문제를 풀며 바로 확인해요.</p>
        </header>

        {loading ? (
          <section className="grid min-h-[280px] place-items-center rounded-[2rem] border-2 border-[#e2e8f0] bg-white">
            <p className="font-bold text-[#64748b]">단원을 불러오는 중...</p>
          </section>
        ) : units.length === 0 ? (
          <section className="rounded-[2rem] border-2 border-[#fecaca] bg-[#fef2f2] p-8 text-center">
            <p className="font-black text-[#991b1b]">단원을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
          </section>
        ) : (
          <section className="space-y-6" data-testid="grade5-unit-list">
            {(['5-1', '5-2'] as const).map((semester) => (
              <div key={semester} className="rounded-[2rem] border-2 border-[#e2e8f0] bg-white p-5 md:p-6">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#f5f3ff] px-4 py-2 text-sm font-black text-[#7c3aed]">{semester}</span>
                  <h2 className="text-xl font-black text-[#0f172a]">{semester === '5-1' ? '1학기' : '2학기'} 단원</h2>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {units
                    .filter((unit) => unit.semester === semester)
                    .map((unit) => (
                      <Link
                        key={unit.id}
                        href={`/unit/${unit.id}`}
                        className="group rounded-2xl border-2 border-[#e2e8f0] p-5 transition hover:-translate-y-0.5 hover:border-[#a78bfa] hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-[#7c3aed]">{unit.order}단원</p>
                            <h3 className="mt-2 text-xl font-black leading-tight text-[#0f172a]">{unit.title}</h3>
                            {unit.description && <p className="mt-2 text-sm font-bold leading-6 text-[#64748b]">{unit.description}</p>}
                          </div>
                          <span className="text-2xl font-black text-[#c4b5fd] transition group-hover:translate-x-1 group-hover:text-[#7c3aed]">→</span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
