'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import {
  getGrade3Missions,
  grade3Units,
  type Grade3Mission,
  type Grade3Unit,
} from '@/lib/grade3-problems'
import {
  createInitialGrade3Progress,
  dismissGrade3Intro,
  loadGrade3Progress,
  resetGrade3Progress,
  saveGrade3Progress,
  selectGrade3Unit,
  type Grade3Progress,
} from '@/lib/grade3-progress'

const MISSION_SEED = 20260516

function unitMissions(missions: Grade3Mission[], unitId: string): Grade3Mission[] {
  return missions.filter((mission) => mission.unitId === unitId).sort((a, b) => a.unitMissionOrder - b.unitMissionOrder)
}

function rewardName(rewardId: Grade3Mission['rewardId']): string {
  const names: Record<Grade3Mission['rewardId'], string> = {
    calculationTorch: '계산 횃불',
    shapeLens: '도형 렌즈',
    divisionShell: '나눗셈 조개',
    multiplyBridge: '곱셈 다리',
    measureBoots: '측정 장화',
    fractionLantern: '분수 등불',
    circleCompass: '원 컴퍼스',
    unitBottle: '단위 물병',
    graphFlag: '그래프 깃발',
  }
  return names[rewardId]
}

function UnitCard({
  unit,
  missions,
  progress,
  onSelectUnit,
}: {
  unit: Grade3Unit
  missions: Grade3Mission[]
  progress: Grade3Progress
  onSelectUnit: (unitId: string) => void
}) {
  const completed = missions.filter((mission) => progress.completedMissionIds.includes(mission.id)).length
  const review = missions.filter((mission) => progress.reviewMissionIds.includes(mission.id)).length
  return (
    <Link
      href={`/grade/3/mission?unitId=${unit.id}`}
      onClick={() => onSelectUnit(unit.id)}
      data-testid={`grade3-unit-card-${unit.id}`}
      className="grid min-h-[190px] rounded-[2rem] border-2 border-[#ccfbf1] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#14b8a6] hover:shadow-md"
    >
      <span className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">{unit.semester}</span>
      <h2 className="mt-2 text-2xl font-black leading-tight text-[#0f172a]">{unit.title}</h2>
      <p className="mt-2 text-sm font-bold leading-relaxed text-[#64748b]">{unit.subtitle}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
        <span className="rounded-full bg-[#ecfeff] px-3 py-1 text-[#0f766e]">{missions.length}개 미션</span>
        <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-[#166534]">완료 {completed}</span>
        <span className="rounded-full bg-[#fff7e6] px-3 py-1 text-[#9a3412]">복습 {review}</span>
      </div>
      <p className="mt-4 text-sm font-black text-[#0f766e]">{rewardName(unit.rewardId)}</p>
    </Link>
  )
}

export default function Grade3UnitSelectionClient() {
  const missions = useMemo(() => getGrade3Missions(MISSION_SEED), [])
  const [progress, setProgress] = useState<Grade3Progress>(() => createInitialGrade3Progress())
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [storageRecovered, setStorageRecovered] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const result = loadGrade3Progress()
    setProgress(result.progress)
    setStorageAvailable(result.storageAvailable)
    setStorageRecovered(result.recovered)
  }, [])

  const persistProgress = (nextProgress: Grade3Progress) => {
    setProgress(nextProgress)
    setStorageAvailable(saveGrade3Progress(nextProgress))
  }

  const handleSelectUnit = (unitId: string) => {
    setConfirmReset(false)
    persistProgress(dismissGrade3Intro(selectGrade3Unit(progress, unitId)))
  }

  const resetAllProgress = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    const nextProgress = resetGrade3Progress()
    setProgress(nextProgress)
    setStorageAvailable(true)
    setStorageRecovered(false)
    setConfirmReset(false)
  }

  return (
    <main className="grade3-game-surface -mx-4 -my-6 min-h-screen bg-[#f0fdfa] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border-2 border-[#ccfbf1] bg-white p-5 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/" className="inline-flex min-h-[44px] items-center rounded-full border-2 border-[#ccfbf1] px-4 text-sm font-black text-[#0f766e]">
                홈으로
              </Link>
              <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">Alpha</p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-[#0f172a] md:text-5xl">
                3학년 탐험섬
              </h1>
              <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#64748b]">
                도형, 분수, 측정, 그래프를 그림으로 확인하고 답 칸에 나누어 써요.
              </p>
            </div>
            <button
              type="button"
              onClick={resetAllProgress}
              className="min-h-[50px] rounded-xl bg-[#ccfbf1] px-5 py-3 text-base font-black text-[#0f766e] shadow-[0_5px_0_#99f6e4]"
              data-testid="grade3-reset-progress"
            >
              {confirmReset ? '한 번 더 누르면 초기화' : '진행 초기화'}
            </button>
          </div>
        </header>

        {(!storageAvailable || storageRecovered) && (
          <section className="rounded-2xl border-2 border-[#ffb020] bg-[#fff7e6] p-4 text-sm font-black text-[#0f172a]" data-testid="grade3-storage-notice">
            저장 기록을 다시 준비했어요. 지금 푸는 미션은 계속할 수 있어요.
          </section>
        )}

        <section className="rounded-[2rem] border-2 border-[#ccfbf1] bg-white p-5 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">단원 선택</p>
              <h2 className="mt-1 text-2xl font-black text-[#0f172a]">한 단원을 골라 3개 미션을 풀어요</h2>
            </div>
            <p className="text-sm font-black text-[#64748b]">
              오늘 {progress.todaySolvedCount}개 해결 · 다시 볼 미션 {progress.reviewMissionIds.length}개
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="grade3-unit-list">
            {grade3Units.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                missions={unitMissions(missions, unit.id)}
                progress={progress}
                onSelectUnit={handleSelectUnit}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
