'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getUnits } from '@/lib/data'
import { isCurriculumGradeReleased } from '@/lib/grade-release'
import type { Unit } from '@/lib/types'
import { GradeReleaseBlocked } from '@/components'

export default function Grade6UnitSelectionClient() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [releaseBlocked, setReleaseBlocked] = useState(false)

  useEffect(() => {
    const loadReleasedUnits = async () => {
      if (!await isCurriculumGradeReleased(6)) {
        setReleaseBlocked(true)
        setLoading(false)
        return
      }
      try {
        const items = await getUnits()
        setUnits(items.filter((unit) => unit.grade === 6))
      } catch {
        setUnits([])
      } finally {
        setLoading(false)
      }
    }
    void loadReleasedUnits()
  }, [])

  if (releaseBlocked) return <GradeReleaseBlocked grade={6} />

  return (
    <main className="-mx-4 -my-6 min-h-screen bg-[#f8fafc] px-4 py-5 md:px-8" data-testid="grade6-study-home">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border-2 border-[#bae6fd] bg-white p-5 md:p-7">
          <Link href="/home" className="inline-flex min-h-[48px] items-center rounded-full border-2 border-[#bae6fd] px-4 text-sm font-black text-[#0369a1]">
            학습 홈
          </Link>
          <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#0369a1]">6학년 Study</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-[#0f172a] md:text-5xl">비와 비율을 차근차근 연습해요</h1>
          <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#64748b]">
            개념을 확인한 뒤 5문제로 가볍게 시작하거나 10문제로 집중 연습해요.
          </p>
        </header>

        {loading ? (
          <section className="grid min-h-[280px] place-items-center rounded-[2rem] border-2 border-[#e2e8f0] bg-white">
            <p className="font-bold text-[#64748b]">단원을 불러오는 중...</p>
          </section>
        ) : units.length === 0 ? (
          <section className="rounded-[2rem] border-2 border-[#fecaca] bg-[#fef2f2] p-8 text-center">
            <p className="font-black text-[#991b1b]">현재 공개된 6학년 단원을 불러오지 못했어요.</p>
          </section>
        ) : (
          <section className="space-y-6" data-testid="grade6-unit-list">
            {(['6-1', '6-2'] as const).map((semester) => {
              const semesterUnits = units.filter((unit) => unit.semester === semester)
              if (semesterUnits.length === 0) return null
              return (
                <div key={semester} className="rounded-[2rem] border-2 border-[#e2e8f0] bg-white p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#e0f2fe] px-4 py-2 text-sm font-black text-[#0369a1]">{semester}</span>
                    <h2 className="text-xl font-black text-[#0f172a]">{semester === '6-1' ? '1학기' : '2학기'} 단원</h2>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {semesterUnits.map((unit) => (
                      <Link
                        key={unit.id}
                        href={`/unit/${unit.id}`}
                        data-testid={`grade6-unit-${unit.id}`}
                        className="group rounded-2xl border-2 border-[#e2e8f0] p-5 transition hover:-translate-y-0.5 hover:border-[#38bdf8] hover:shadow-md"
                      >
                        <p className="text-sm font-black text-[#0369a1]">{unit.order}단원</p>
                        <div className="mt-2 flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-black leading-tight text-[#0f172a]">{unit.title}</h3>
                            {unit.description && <p className="mt-2 text-sm font-bold leading-6 text-[#64748b]">{unit.description}</p>}
                          </div>
                          <span className="text-2xl font-black text-[#7dd3fc] transition group-hover:translate-x-1 group-hover:text-[#0369a1]">→</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}
