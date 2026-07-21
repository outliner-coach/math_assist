'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Grade2MissionCard } from '@/components/grade2'
import { AdventureProgressPanel } from '@/components/adventure'
import { ScratchPad } from '@/components'
import {
  checkGrade2Answer,
  type Grade2StructuredLengthInput,
  type Grade2StructuredTimeInput,
} from '@/lib/grade2-answer-normalizers'
import {
  getGrade2Missions,
  grade2Units,
  type Grade2Mission,
} from '@/lib/grade2-problems'
import {
  createInitialGrade2Progress,
  dismissGrade2Intro,
  loadGrade2Progress,
  recordGrade2Attempt,
  resetGrade2Progress,
  saveGrade2Progress,
  selectGrade2Unit,
  type Grade2Progress,
} from '@/lib/grade2-progress'
import {
  getAdventureLevel,
  getAdventureVariantKey,
  getDailyAdventureSeed,
  getMasteryStars,
} from '@/lib/adventure-progression'
import { appendMissionAttemptReceipt } from '@/lib/mission-attempt-receipt'
import {
  advanceMissionSketchRun,
  createMissionSketchKey,
  resolveMissionSketchStatus,
} from '@/lib/mission-sketch-identity'
import { dispatchMascotReaction, mascotReactionForAnswer } from '@/lib/mascot'

function unitMissions(missions: Grade2Mission[], unitId: string): Grade2Mission[] {
  return missions
    .filter((mission) => mission.unitId === unitId)
    .sort((a, b) => a.unitMissionOrder - b.unitMissionOrder)
}

function firstMissionForUnit(
  missions: Grade2Mission[],
  unitId: string,
  progress: Grade2Progress
): Grade2Mission {
  const items = unitMissions(missions, unitId)
  return (
    items.find((mission) => progress.reviewMissionIds.includes(mission.id)) ??
    items.find((mission) => !progress.completedMissionIds.includes(mission.id)) ??
    items[0] ??
    missions[0]
  )
}

function nextMissionInUnit(
  missions: Grade2Mission[],
  current: Grade2Mission,
  progress: Grade2Progress
): Grade2Mission | null {
  const items = unitMissions(missions, current.unitId)
  return (
    items.find(
      (mission) =>
        mission.unitMissionOrder > current.unitMissionOrder &&
        !progress.completedMissionIds.includes(mission.id)
    ) ??
    items.find((mission) => !progress.completedMissionIds.includes(mission.id)) ??
    null
  )
}

function strongestTag(progress: Grade2Progress): string {
  const entries = Object.entries(progress.skillSummaryByTag)
  if (entries.length === 0) return '아직 시작 전'
  return entries
    .slice()
    .sort(([, a], [, b]) => b.correct - a.correct || b.attempted - a.attempted)[0][0]
}

function emptyLengthAnswer(): Grade2StructuredLengthInput {
  return { meters: '', centimeters: '' }
}

function emptyTimeAnswer(): Grade2StructuredTimeInput {
  return { hours: '', minutes: '' }
}

function formatStructuredLength(answer: Grade2StructuredLengthInput, unit: 'cm' | 'm-cm' = 'm-cm'): string {
  const meters = String(answer.meters ?? '').trim()
  const centimeters = String(answer.centimeters ?? '').trim()
  if (unit === 'cm') return `${centimeters || '0'}cm`
  return `${meters || '0'}m ${centimeters || '0'}cm`
}

function formatStructuredTime(answer: Grade2StructuredTimeInput, suffix: '시' | '시간'): string {
  const hours = String(answer.hours ?? '').trim()
  const minutes = String(answer.minutes ?? '').trim()
  return `${hours || '0'}${suffix} ${minutes || '0'}분`
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

const grade2RewardOrder: Grade2Mission['rewardId'][] = [
  'numberGem',
  'shapeCompass',
  'operationBadge',
  'measureTape',
  'multiplyMedal',
  'clockStar',
  'graphBadge',
  'patternKey',
]

function MissionList({
  missions,
  progress,
  selectedMissionId,
  onSelectMission,
}: {
  missions: Grade2Mission[]
  progress: Grade2Progress
  selectedMissionId: string
  onSelectMission: (missionId: string) => void
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2" data-testid="grade2-unit-missions">
      {missions.map((mission) => {
        const complete = progress.completedMissionIds.includes(mission.id)
        const review = progress.reviewMissionIds.includes(mission.id)
        const selected = selectedMissionId === mission.id
        return (
          <button
            key={mission.id}
            type="button"
            onClick={() => onSelectMission(mission.id)}
            data-testid={`grade2-mission-node-${mission.unitMissionOrder}`}
            className={`grid min-h-[76px] grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
              selected
                ? 'border-[#2563eb] bg-[#eff6ff]'
                : review
                  ? 'border-[#ffb020] bg-[#fff7e6]'
                  : complete
                    ? 'border-[#16a34a] bg-[#dcfce7]'
                    : 'border-[#d8e3ef] bg-white'
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2563eb] text-lg font-black text-white">
              {mission.unitMissionOrder}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-black leading-tight text-[#0f172a]">
                {mission.learnerGoal}
              </span>
              <span className="mt-1 block text-sm font-bold text-[#64748b]">
                {mission.curriculumCode}
              </span>
            </span>
            <span className="text-xs font-black text-[#64748b]">
              <span className="block">{review ? '복습' : complete ? '완료' : '도전'}</span>
              <span className="mt-1 block text-[#f59e0b]" aria-label={`숙련도 별 ${getMasteryStars(progress.masteryByMissionId[mission.id])}개`}>
                {'★'.repeat(getMasteryStars(progress.masteryByMissionId[mission.id]))}
                {'☆'.repeat(3 - getMasteryStars(progress.masteryByMissionId[mission.id]))}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

interface Grade2GameClientProps {
  initialUnitId: string
}

export default function Grade2GameClient({ initialUnitId }: Grade2GameClientProps) {
  const [replayRound, setReplayRound] = useState(0)
  const missionSeed = useMemo(
    () => getDailyAdventureSeed('grade2', Date.now(), replayRound),
    [replayRound]
  )
  const missions = useMemo(() => getGrade2Missions(missionSeed), [missionSeed])
  const initialUnit = grade2Units.find((unit) => unit.id === initialUnitId) ?? grade2Units[0]
  const [progress, setProgress] = useState<Grade2Progress>(() => createInitialGrade2Progress())
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [storageRecovered, setStorageRecovered] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnit.id)
  const [selectedMissionId, setSelectedMissionId] = useState(
    unitMissions(missions, initialUnit.id)[0]?.id ?? 'g2-1-place-value-01'
  )
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [lengthAnswer, setLengthAnswer] = useState<Grade2StructuredLengthInput>(() => emptyLengthAnswer())
  const [timeAnswer, setTimeAnswer] = useState<Grade2StructuredTimeInput>(() => emptyTimeAnswer())
  const [inputError, setInputError] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [wrongAttemptCount, setWrongAttemptCount] = useState(0)
  const [lastSubmissionCorrect, setLastSubmissionCorrect] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const selectedUnit = grade2Units.find((unit) => unit.id === selectedUnitId) ?? grade2Units[0]
  const selectedUnitMissions = unitMissions(missions, selectedUnit.id)
  const selectedMission =
    selectedUnitMissions.find((mission) => mission.id === selectedMissionId) ??
    firstMissionForUnit(missions, selectedUnit.id, progress)
  const solved = lastSubmissionCorrect
  const nextMission = solved ? nextMissionInUnit(missions, selectedMission, progress) : null
  const currentVariantKey = getAdventureVariantKey(selectedMission.id, JSON.stringify([
    selectedMission.prompt,
    selectedMission.correctAnswer,
    selectedMission.choices,
    selectedMission.visualConfig,
  ]))
  const scratchKey = createMissionSketchKey({
    grade: 2,
    sessionRunKey: missionSeed,
    missionId: selectedMission.id,
    variantKey: currentVariantKey,
  })
  const rewardCounts = Object.fromEntries(grade2RewardOrder.map((rewardId) => [
    rewardId,
    missions.filter((mission) => (
      mission.rewardId === rewardId && progress.completedMissionIds.includes(mission.id)
    )).length,
  ])) as Record<Grade2Mission['rewardId'], number>

  useEffect(() => {
    const result = loadGrade2Progress()
    const progressForUnit =
      result.progress.selectedUnitId === initialUnit.id
        ? result.progress
        : selectGrade2Unit(result.progress, initialUnit.id)
    const recommendedMission = firstMissionForUnit(missions, initialUnit.id, progressForUnit)
    const restoredMission = progressForUnit.missionSketchRunOrdinal > 0
      ? unitMissions(missions, initialUnit.id).find((mission) => mission.id === progressForUnit.latestMissionId) ?? recommendedMission
      : recommendedMission
    setProgress(progressForUnit)
    setReplayRound(progressForUnit.missionSketchRunOrdinal)
    setStorageAvailable(
      progressForUnit === result.progress ? result.storageAvailable : saveGrade2Progress(progressForUnit)
    )
    setStorageRecovered((wasRecovered) => wasRecovered || result.recovered)
    setSelectedUnitId(initialUnit.id)
    setSelectedMissionId(restoredMission.id)
  }, [initialUnit.id, missions])

  useEffect(() => {
    if (typeof window === 'undefined') return
    ;(window as unknown as { render_game_to_text?: () => string }).render_game_to_text = () =>
      JSON.stringify({
        selectedUnitId,
        selectedMissionId,
        selectedPrompt: selectedMission.prompt,
        solved,
        wrongAttemptCount,
        todaySolvedCount: progress.todaySolvedCount,
        completedCount: progress.completedMissionIds.length,
        reviewCount: progress.reviewMissionIds.length,
        xp: progress.xp,
        level: getAdventureLevel(progress.xp),
        masteryStars: getMasteryStars(progress.masteryByMissionId[selectedMission.id]),
        missionSeed,
      })
  }, [missionSeed, progress.completedMissionIds.length, progress.masteryByMissionId, progress.reviewMissionIds.length, progress.todaySolvedCount, progress.xp, selectedMission.id, selectedMission.prompt, selectedMissionId, selectedUnitId, solved, wrongAttemptCount])

  const persistProgress = (nextProgress: Grade2Progress) => {
    setProgress(nextProgress)
    const saved = saveGrade2Progress(nextProgress)
    setStorageAvailable(saved)
  }

  const resetMissionState = () => {
    setSelectedAnswer(null)
    setTextAnswer('')
    setLengthAnswer(emptyLengthAnswer())
    setTimeAnswer(emptyTimeAnswer())
    setInputError(null)
    setShowHint(false)
    setWrongAttemptCount(0)
    setLastSubmissionCorrect(false)
  }

  const chooseMission = (missionId: string) => {
    setConfirmReset(false)
    const nextProgress = dismissGrade2Intro(progress)
    if (nextProgress !== progress) persistProgress(nextProgress)
    setSelectedMissionId(missionId)
    resetMissionState()
    window.requestAnimationFrame(() => {
      document.getElementById('grade2-mission')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const resetMission = () => {
    const nextProgress = advanceMissionSketchRun(progress)
    persistProgress(nextProgress)
    setReplayRound(nextProgress.missionSketchRunOrdinal)
    resetMissionState()
    document.getElementById('grade2-mission')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const resetAllProgress = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    const nextProgress = {
      ...resetGrade2Progress(),
      missionSketchRunOrdinal: progress.missionSketchRunOrdinal + 1,
    }
    persistProgress(nextProgress)
    setReplayRound(nextProgress.missionSketchRunOrdinal)
    setStorageRecovered(false)
    setSelectedUnitId(initialUnit.id)
    setSelectedMissionId(unitMissions(missions, initialUnit.id)[0]?.id ?? 'g2-1-place-value-01')
    setConfirmReset(false)
    resetMissionState()
  }

  const submitAnswer = (
    rawAnswer: string | Grade2StructuredLengthInput | Grade2StructuredTimeInput,
    displayAnswer: string
  ) => {
    if (solved) return

    const progressWithIntroDismissed = dismissGrade2Intro(progress)
    const result = checkGrade2Answer(selectedMission.answerType, rawAnswer, selectedMission.correctAnswer)
    if (!result.ok) {
      if (progressWithIntroDismissed !== progress) persistProgress(progressWithIntroDismissed)
      setInputError(result.error ?? '답을 다시 확인해요.')
      return
    }

    setInputError(null)
    void appendMissionAttemptReceipt({
      grade: 2,
      mission: selectedMission,
      sessionRunKey: missionSeed,
      attemptIndex: wrongAttemptCount,
      variantKey: currentVariantKey,
      correct: result.correct,
      usedHint: showHint || wrongAttemptCount > 0,
    }).then((appendResult) => {
      if (appendResult === 'corrupt') {
        console.error('Attempt receipt ledger is corrupt; Grade 2 progress remains authoritative')
      }
    }).catch((error: unknown) => {
      console.error('Failed to append Grade 2 attempt receipt; legacy progress remains authoritative', error)
    })
    setSelectedAnswer(displayAnswer)
    setLastSubmissionCorrect(result.correct)
    dispatchMascotReaction(mascotReactionForAnswer(result.correct))

    if (result.correct) {
      const nextProgress = recordGrade2Attempt(progressWithIntroDismissed, selectedMission, true, {
        hadHint: wrongAttemptCount > 0,
        wrongAttempts: wrongAttemptCount,
        variantKey: currentVariantKey,
        difficultyBonus: selectedMission.difficultyStep === 'applied' ? 5 : 0,
      })
      persistProgress(nextProgress)
      return
    }

    const nextWrongAttemptCount = wrongAttemptCount + 1
    setWrongAttemptCount(nextWrongAttemptCount)
    setShowHint(true)
    persistProgress(recordGrade2Attempt(progressWithIntroDismissed, selectedMission, false, {
      variantKey: currentVariantKey,
      wrongAttempts: nextWrongAttemptCount,
    }))
  }

  return (
    <main className="practice-interaction-surface grade2-game-surface -mx-4 -my-6 min-h-screen bg-[#f1f7fb] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border-2 border-[#d8e3ef] bg-white p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Link
                href="/grade/2"
                className="inline-flex min-h-[44px] items-center rounded-full border-2 border-[#d8e3ef] px-4 text-sm font-black text-[#2563eb]"
              >
                단원 선택
              </Link>
              <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#f97316]">
                {selectedUnit.semester} 미션
              </p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-[#0f172a] md:text-5xl">
                {selectedUnit.title}
              </h1>
              <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#64748b]">
                {selectedUnit.subtitle} 한 단원에 집중해서 한 문제씩 차례로 풀어요.
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

        <AdventureProgressPanel
          progress={progress}
          totalMissionCount={missions.length}
          tone="blue"
        />

        <section
          className="grid gap-5 rounded-[2rem] border-2 border-[#d8e3ef] bg-white p-5 md:p-6 lg:grid-cols-[320px_1fr]"
          data-testid="grade2-mission-nav"
        >
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f97316]">
              {selectedUnit.semester}
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#0f172a]">{selectedUnit.title}</h2>
            <p className="mt-2 text-sm font-bold leading-relaxed text-[#64748b]">{selectedUnit.subtitle}</p>
            <p className="mt-4 text-sm font-black text-[#64748b]">
              오늘 {progress.todaySolvedCount}개 해결 · 다시 볼 미션 {progress.reviewMissionIds.length}개
            </p>
          </div>
          <MissionList
            missions={selectedUnitMissions}
            progress={progress}
            selectedMissionId={selectedMission.id}
            onSelectMission={chooseMission}
          />
        </section>

        <Grade2MissionCard
          mission={selectedMission}
          selectedAnswer={selectedAnswer}
          textAnswer={textAnswer}
          lengthAnswer={lengthAnswer}
          timeAnswer={timeAnswer}
          showHint={showHint}
          wrongAttemptCount={wrongAttemptCount}
          inputError={inputError}
          solved={solved}
          missionCount={selectedUnitMissions.length}
          onChoiceAnswer={(answer) => submitAnswer(answer, answer)}
          onTextAnswerChange={(answer) => {
            setTextAnswer(answer)
            setInputError(null)
          }}
          onLengthAnswerChange={(answer) => {
            setLengthAnswer(answer)
            setInputError(null)
          }}
          onTimeAnswerChange={(answer) => {
            setTimeAnswer(answer)
            setInputError(null)
          }}
          onSubmitText={() => submitAnswer(textAnswer.trim(), textAnswer.trim())}
          onSubmitLength={() => {
            const lengthUnit = selectedMission.answerConfig.unit === 'cm' ? 'cm' : 'm-cm'
            const displayAnswer = formatStructuredLength(lengthAnswer, lengthUnit)
            submitAnswer(lengthUnit === 'cm' ? displayAnswer : lengthAnswer, displayAnswer)
          }}
          onSubmitTime={() =>
            submitAnswer(
              timeAnswer,
              formatStructuredTime(timeAnswer, selectedMission.answerType === 'duration' ? '시간' : '시')
            )
          }
          onShowHint={() => {
            setShowHint(true)
            dispatchMascotReaction('hint')
          }}
        />

        <ScratchPad
          {...scratchKey}
          sessionStatus={resolveMissionSketchStatus({ completed: solved })}
        />

        {solved && (
          <section className="rounded-[2rem] border-2 border-[#16a34a] bg-[#dcfce7] p-5 md:p-6" data-testid="grade2-reward-panel">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#166534]">보상 획득</p>
                <h2 className="mt-1 text-2xl font-black text-[#0f172a]">
                  {rewardName(selectedMission.rewardId)}을 얻었어요.
                </h2>
                <p className="mt-2 text-sm font-bold text-[#166534]">
                  잘한 영역: {strongestTag(progress)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 md:min-w-[520px]">
                <button
                  type="button"
                  className="min-h-[56px] rounded-xl bg-[#2563eb] px-4 py-3 text-base font-black text-white shadow-[0_5px_0_#1e40af] disabled:bg-[#94a3b8] disabled:shadow-[0_5px_0_#64748b]"
                  disabled={!nextMission}
                  onClick={() => nextMission && chooseMission(nextMission.id)}
                  data-testid="next-grade2-mission"
                >
                  같은 단원 다음 미션
                </button>
                <Link
                  href="/grade/2"
                  className="min-h-[56px] rounded-xl border-2 border-[#d8e3ef] bg-white px-4 py-3 text-base font-black text-[#2563eb] shadow-[0_5px_0_#cbd5e1]"
                  data-testid="grade2-back-units"
                >
                  다른 단원 고르기
                </Link>
                <button
                  type="button"
                  className="min-h-[56px] rounded-xl bg-[#ffedd5] px-4 py-3 text-base font-black text-[#9a3412] shadow-[0_5px_0_#fed7aa]"
                  onClick={resetMission}
                  data-testid="grade2-retry-mission"
                >
                  한 번 더 풀기
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-[2rem] border-2 border-[#d8e3ef] bg-white p-5 md:p-6" data-testid="grade2-reward-collection">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f97316]">보상 컬렉션</p>
            <h2 className="mt-1 text-2xl font-black text-[#0f172a]">단원 보물을 모아요</h2>
            <p className="mt-2 text-sm font-bold text-[#64748b]">새 미션을 해결할 때마다 관련 보상이 하나씩 열려요.</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {grade2RewardOrder.map((rewardId) => {
              const count = rewardCounts[rewardId]
              return (
                <div
                  key={rewardId}
                  className={`rounded-2xl border-2 p-4 text-center ${count > 0 ? 'border-[#93c5fd] bg-[#eff6ff]' : 'border-[#e5e7eb] bg-[#f8fafc] opacity-60 grayscale'}`}
                  data-testid={`grade2-reward-${rewardId}`}
                  aria-label={`${rewardName(rewardId)} ${count}개`}
                >
                  <p className="text-3xl" aria-hidden="true">{count > 0 ? '🏅' : '🔒'}</p>
                  <p className="mt-2 text-sm font-black text-[#0f172a]">{rewardName(rewardId)}</p>
                  <p className="mt-1 text-xl font-black text-[#2563eb]">{count}개</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
