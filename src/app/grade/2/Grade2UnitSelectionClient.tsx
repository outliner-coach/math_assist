'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import {
  getGrade2Missions,
  grade2Units,
  type Grade2Mission,
  type Grade2Unit,
} from '@/lib/grade2-problems'
import {
  createInitialGrade2Progress,
  dismissGrade2Intro,
  loadGrade2Progress,
  resetGrade2Progress,
  saveGrade2Progress,
  selectGrade2Unit,
  type Grade2Progress,
} from '@/lib/grade2-progress'

const MISSION_SEED = 20260510

function unitMissions(missions: Grade2Mission[], unitId: string): Grade2Mission[] {
  return missions
    .filter((mission) => mission.unitId === unitId)
    .sort((a, b) => a.unitMissionOrder - b.unitMissionOrder)
}

function rewardName(rewardId: Grade2Mission['rewardId']): string {
  const names: Record<Grade2Mission['rewardId'], string> = {
    numberGem: '자리값 보석',
    shapeCompass: '도형 나침반',
    operationBadge: '세로셈 배지',
    measureTape: '길이 리본',
    multiplyMedal: '곱셈 메달',
    clockStar: '시계 별',
    graphBadge: '그래프 배지',
    patternKey: '규칙 열쇠',
  }
  return names[rewardId]
}

function strongestTag(progress: Grade2Progress): string {
  const entries = Object.entries(progress.skillSummaryByTag)
  if (entries.length === 0) return '아직 시작 전'
  return entries
    .slice()
    .sort(([, a], [, b]) => b.correct - a.correct || b.attempted - a.attempted)[0][0]
}

function UnitCard({
  unit,
  missions,
  progress,
  selected,
  onSelect,
}: {
  unit: Grade2Unit
  missions: Grade2Mission[]
  progress: Grade2Progress
  selected: boolean
  onSelect: () => void
}) {
  const items = unitMissions(missions, unit.id)
  const completed = items.filter((mission) => progress.completedMissionIds.includes(mission.id)).length
  const review = items.filter((mission) => progress.reviewMissionIds.includes(mission.id)).length

  return (
    <Link
      href={`/grade/2/mission?unitId=${unit.id}`}
      onClick={onSelect}
      data-testid={`grade2-unit-card-${unit.id}`}
      className={`block min-h-[150px] rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 ${
        selected
          ? 'border-[#2563eb] bg-[#eff6ff] ring-4 ring-[#dbeafe]'
          : 'border-[#d8e3ef] bg-white hover:bg-[#f8fbff]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-[#ffedd5] px-3 py-1 text-xs font-black text-[#9a3412]">
          {unit.semester}
        </span>
        <span className="text-sm font-black text-[#2563eb]">{completed}/{items.length}</span>
      </div>
      <h3 className="mt-3 text-xl font-black leading-tight text-[#0f172a]">{unit.title}</h3>
      <p className="mt-2 text-sm font-bold leading-snug text-[#64748b]">{unit.subtitle}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
        <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-[#166534]">
          {rewardName(unit.rewardId)}
        </span>
        {review > 0 && (
          <span className="rounded-full bg-[#fff7e6] px-3 py-1 text-[#9a3412]">
            복습 {review}
          </span>
        )}
      </div>
    </Link>
  )
}

export default function Grade2UnitSelectionClient() {
  const missions = useMemo(() => getGrade2Missions(MISSION_SEED), [])
  const [progress, setProgress] = useState<Grade2Progress>(() => createInitialGrade2Progress())
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [storageRecovered, setStorageRecovered] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const result = loadGrade2Progress()
    setProgress(result.progress)
    setStorageAvailable(result.storageAvailable)
    setStorageRecovered((wasRecovered) => wasRecovered || result.recovered)
  }, [])

  const persistProgress = (nextProgress: Grade2Progress) => {
    setProgress(nextProgress)
    setStorageAvailable(saveGrade2Progress(nextProgress))
  }

  const chooseUnit = (unitId: string) => {
    setConfirmReset(false)
    persistProgress(dismissGrade2Intro(selectGrade2Unit(progress, unitId)))
  }

  const resetAllProgress = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    const nextProgress = resetGrade2Progress()
    setProgress(nextProgress)
    setStorageAvailable(true)
    setStorageRecovered(false)
    setConfirmReset(false)
  }

  return (
    <main className="grade2-game-surface -mx-4 -my-6 min-h-screen bg-[#f1f7fb] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border-2 border-[#d8e3ef] bg-white p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center rounded-full border-2 border-[#d8e3ef] px-4 text-sm font-black text-[#2563eb]"
              >
                홈으로
              </Link>
              <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#f97316]">
                2학년 게임 모드
              </p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-[#0f172a] md:text-5xl">
                2학년 탐험섬
              </h1>
              <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#64748b]">
                오늘 풀 단원만 먼저 고르고, 다음 화면에서 한 문제씩 집중해요.
              </p>
            </div>
            <button
              type="button"
              onClick={resetAllProgress}
              className="min-h-[50px] rounded-xl bg-[#ffedd5] px-5 py-3 text-base font-black text-[#9a3412] shadow-[0_5px_0_#fed7aa]"
              data-testid="grade2-reset-progress"
            >
              {confirmReset ? '한 번 더 누르면 초기화' : '진행 초기화'}
            </button>
          </div>
        </header>

        {(!storageAvailable || storageRecovered) && (
          <section
            className="rounded-2xl border-2 border-[#ffb020] bg-[#fff7e6] p-4 text-sm font-black text-[#0f172a]"
            data-testid="grade2-storage-notice"
          >
            저장 기록을 다시 준비했어요. 지금 푸는 미션은 계속할 수 있어요.
          </section>
        )}

        <section className="grid gap-3 rounded-[2rem] border-2 border-[#d8e3ef] bg-white p-5 md:grid-cols-3 md:p-6">
          <div className="rounded-2xl bg-[#eff6ff] p-4">
            <p className="text-sm font-black text-[#2563eb]">오늘 해결</p>
            <p className="mt-2 text-3xl font-black text-[#0f172a]">{progress.todaySolvedCount}개</p>
          </div>
          <div className="rounded-2xl bg-[#fff7e6] p-4">
            <p className="text-sm font-black text-[#9a3412]">다시 볼 미션</p>
            <p className="mt-2 text-3xl font-black text-[#0f172a]">{progress.reviewMissionIds.length}개</p>
          </div>
          <div className="rounded-2xl bg-[#dcfce7] p-4">
            <p className="text-sm font-black text-[#166534]">잘한 영역</p>
            <p className="mt-2 text-xl font-black text-[#0f172a]">{strongestTag(progress)}</p>
          </div>
        </section>

        <section
          className="rounded-[2rem] border-2 border-[#d8e3ef] bg-white p-5 md:p-6"
          data-testid="grade2-unit-list"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2563eb]">단원 선택</p>
              <h2 className="mt-1 text-2xl font-black text-[#0f172a]">오늘 풀 단원</h2>
            </div>
            <p className="text-sm font-black text-[#64748b]">단원 하나를 고르면 미션 화면으로 이동해요.</p>
          </div>

          <div className="mt-5 space-y-5">
            {(['2-1', '2-2'] as const).map((semester) => (
              <div key={semester} className="space-y-3">
                <h3 className="text-lg font-black text-[#334155]">{semester}</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {grade2Units
                    .filter((unit) => unit.semester === semester)
                    .map((unit) => (
                      <UnitCard
                        key={unit.id}
                        unit={unit}
                        missions={missions}
                        progress={progress}
                        selected={progress.selectedUnitId === unit.id}
                        onSelect={() => chooseUnit(unit.id)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
