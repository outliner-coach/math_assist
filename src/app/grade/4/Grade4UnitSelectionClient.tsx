'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { grade4Units } from '@/lib/grade4-problems'
import {
  createInitialGrade4Progress,
  loadGrade4Progress,
  projectGrade4UnitCompletion,
  resetGrade4Progress,
  saveGrade4Progress,
  selectGrade4Unit,
  type Grade4Progress,
} from '@/lib/grade4-progress'
import type { LearningSetMode } from '@/lib/learning-activity'

export default function Grade4UnitSelectionClient() {
  const [progress, setProgress] = useState<Grade4Progress>(() => createInitialGrade4Progress())
  const [storageNotice, setStorageNotice] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const result = loadGrade4Progress()
    setProgress(result.progress)
    setStorageNotice(!result.storageAvailable || result.recovered)
  }, [])

  const chooseUnit = (unitId: string, mode: LearningSetMode) => {
    const next = selectGrade4Unit(progress, unitId, mode)
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
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#6366f1]">Bridge · Released</p>
              <h1 className="mt-2 text-4xl font-black text-[#0f172a] md:text-5xl">4학년 수학 다리</h1>
              <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#64748b]">검증된 단원에서 알기·적용·추론 문제를 한 개씩 풀며 다음 개념으로 건너가요.</p>
            </div>
            <button type="button" onClick={reset} data-testid="grade4-reset-progress" className="min-h-[50px] rounded-xl bg-[#e0e7ff] px-5 py-3 text-base font-black text-[#4338ca] shadow-[0_5px_0_#c7d2fe]">
              {confirmReset ? '한 번 더 누르면 초기화' : '진행 초기화'}
            </button>
          </div>
        </header>

        {storageNotice && <p data-testid="grade4-storage-notice" className="rounded-2xl border-2 border-[#f59e0b] bg-[#fffbeb] p-4 text-sm font-black text-[#92400e]">4학년 저장 기록만 다시 준비했어요. 다른 학년 기록은 그대로예요.</p>}

        <section className="rounded-[2rem] border-2 border-[#c7d2fe] bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-sm font-black text-[#6366f1]">현재 공개 범위</p><h2 className="mt-1 text-2xl font-black text-[#0f172a]">검증된 단원 {grade4Units.length}개</h2></div>
            <p className="text-sm font-black text-[#64748b]">오늘 {progress.todaySolvedCount}개 해결 · 복습 {progress.reviewVariantKeys.length}개</p>
          </div>
          <div className="mt-5 grid gap-4">
            {grade4Units.map((unit) => {
              const completion = projectGrade4UnitCompletion(progress, unit.id)
              return (
                <article key={unit.id} className="rounded-[2rem] border-2 border-[#a5b4fc] bg-[#eef2ff] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#6366f1]">{unit.semester} · {unit.curriculumCodes.join(' · ')}</p>
                    {completion.isComplete && <span className="rounded-full bg-[#dcfce7] px-3 py-2 text-sm font-black text-[#166534]">단원 완료</span>}
                  </div>
                  <h3 className="mt-2 text-3xl font-black text-[#0f172a]">{unit.title}</h3>
                  <p className="mt-2 font-bold leading-relaxed text-[#64748b]">{unit.subtitle}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm font-black text-[#4338ca]">
                    <span className="rounded-full bg-white px-3 py-2">10개 문제 틀</span>
                    <span className="rounded-full bg-white px-3 py-2">각 활동 3문제</span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link
                      href={`/grade/4/mission?unitId=${unit.id}&mode=basic`}
                      onClick={() => chooseUnit(unit.id, 'basic')}
                      data-testid={`grade4-unit-card-${unit.id}`}
                      className="flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-[#4f46e5] bg-white px-4 py-3 text-center font-black text-[#4338ca]"
                    >
                      기본 3문제 {completion.recommendedMode === 'basic' ? '· 추천' : ''}
                    </Link>
                    <Link
                      href={`/grade/4/mission?unitId=${unit.id}&mode=practice`}
                      onClick={() => chooseUnit(unit.id, 'practice')}
                      data-testid={`grade4-practice-unit-card-${unit.id}`}
                      className="flex min-h-[56px] items-center justify-center rounded-2xl bg-[#4f46e5] px-4 py-3 text-center font-black text-white shadow-[0_5px_0_#3730a3]"
                    >
                      연습 3문제 {completion.recommendedMode === 'practice' ? '· 추천' : ''}
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
          <p className="mt-5 rounded-2xl bg-[#f8fafc] p-4 text-sm font-bold leading-relaxed text-[#64748b]">처음에는 기본 3문제를 추천해요. 연습 3문제는 언제든 바로 선택할 수 있고, 모두 확인하면 단원을 완료해요.</p>
        </section>
      </div>
    </main>
  )
}
