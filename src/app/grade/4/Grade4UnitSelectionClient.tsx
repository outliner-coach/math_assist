'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { grade4Units } from '@/lib/grade4-problems'
import {
  createInitialGrade4Progress,
  loadGrade4Progress,
  resetGrade4Progress,
  saveGrade4Progress,
  selectGrade4Unit,
  type Grade4Progress,
} from '@/lib/grade4-progress'

export default function Grade4UnitSelectionClient() {
  const [progress, setProgress] = useState<Grade4Progress>(() => createInitialGrade4Progress())
  const [storageNotice, setStorageNotice] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const result = loadGrade4Progress()
    setProgress(result.progress)
    setStorageNotice(!result.storageAvailable || result.recovered)
  }, [])

  const chooseUnit = (unitId: string) => {
    const next = selectGrade4Unit(progress, unitId)
    setProgress(next)
    setStorageNotice(!saveGrade4Progress(next))
  }

  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    setProgress(resetGrade4Progress())
    setConfirmReset(false)
    setStorageNotice(false)
  }

  return (
    <main className="-mx-4 -my-6 min-h-screen bg-[#eef2ff] px-4 py-5 md:px-6" data-testid="grade4-unit-page">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-[2rem] border-2 border-[#c7d2fe] bg-white p-5 md:p-7">
          <Link href="/home" className="inline-flex min-h-[44px] items-center rounded-full border-2 border-[#c7d2fe] px-4 text-sm font-black text-[#4338ca]">홈으로</Link>
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#6366f1]">Bridge · Release candidate</p>
              <h1 className="mt-2 text-4xl font-black text-[#0f172a] md:text-5xl">4학년 큰 수 다리</h1>
              <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#64748b]">큰 수를 자리표와 수직선으로 확인하고, 알기·적용·추론 문제를 한 개씩 풀어요.</p>
            </div>
            <button type="button" onClick={reset} data-testid="grade4-reset-progress" className="min-h-[50px] rounded-xl bg-[#e0e7ff] px-5 py-3 text-base font-black text-[#4338ca] shadow-[0_5px_0_#c7d2fe]">
              {confirmReset ? '한 번 더 누르면 초기화' : '진행 초기화'}
            </button>
          </div>
        </header>

        {storageNotice && <p data-testid="grade4-storage-notice" className="rounded-2xl border-2 border-[#f59e0b] bg-[#fffbeb] p-4 text-sm font-black text-[#92400e]">4학년 저장 기록만 다시 준비했어요. 다른 학년 기록은 그대로예요.</p>}

        <section className="rounded-[2rem] border-2 border-[#c7d2fe] bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-sm font-black text-[#6366f1]">현재 공개 준비 범위</p><h2 className="mt-1 text-2xl font-black text-[#0f172a]">검증된 단원 1개</h2></div>
            <p className="text-sm font-black text-[#64748b]">오늘 {progress.todaySolvedCount}개 해결 · 복습 {progress.reviewVariantKeys.length}개</p>
          </div>
          <div className="mt-5 grid gap-4">
            {grade4Units.map((unit) => (
              <Link key={unit.id} href={`/grade/4/mission?unitId=${unit.id}`} onClick={() => chooseUnit(unit.id)} data-testid={`grade4-unit-card-${unit.id}`}
                className="rounded-[2rem] border-2 border-[#a5b4fc] bg-[#eef2ff] p-5 transition hover:-translate-y-1 hover:border-[#4f46e5]">
                <p className="text-sm font-black text-[#6366f1]">{unit.semester} · {unit.curriculumCodes.join(' · ')}</p>
                <h3 className="mt-2 text-3xl font-black text-[#0f172a]">{unit.title}</h3>
                <p className="mt-2 font-bold leading-relaxed text-[#64748b]">{unit.subtitle}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm font-black text-[#4338ca]"><span className="rounded-full bg-white px-3 py-2">10개 문제 틀</span><span className="rounded-full bg-white px-3 py-2">한 활동 3문제</span><span className="rounded-full bg-white px-3 py-2">시작하기 →</span></div>
              </Link>
            ))}
          </div>
          <p className="mt-5 rounded-2xl bg-[#f8fafc] p-4 text-sm font-bold leading-relaxed text-[#64748b]">나머지 4학년 성취기준은 아직 문제·회귀 검증 전이라 이 화면에서 열지 않습니다.</p>
        </section>
      </div>
    </main>
  )
}
