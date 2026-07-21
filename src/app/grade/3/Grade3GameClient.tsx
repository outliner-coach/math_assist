'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Grade3MissionCard } from '@/components/grade3'
import { ScratchPad } from '@/components'
import {
  checkGrade3Answer,
  type Grade3StructuredCapacityInput,
  type Grade3StructuredFractionInput,
  type Grade3StructuredLengthInput,
  type Grade3StructuredTimeInput,
  type Grade3StructuredWeightInput,
} from '@/lib/grade3-answer-normalizers'
import { getGrade3Missions, grade3Units, type Grade3Mission } from '@/lib/grade3-problems'
import {
  createInitialGrade3Progress,
  dismissGrade3Intro,
  loadGrade3Progress,
  recordGrade3Attempt,
  resetGrade3Progress,
  saveGrade3Progress,
  selectGrade3Unit,
  type Grade3Progress,
} from '@/lib/grade3-progress'
import { appendMissionAttemptReceipt } from '@/lib/mission-attempt-receipt'
import {
  advanceMissionSketchRun,
  createMissionSketchKey,
  resolveMissionSketchStatus,
} from '@/lib/mission-sketch-identity'
import { dispatchMascotReaction, mascotReactionForAnswer } from '@/lib/mascot'

const MISSION_SEED = 20260516

function unitMissions(missions: Grade3Mission[], unitId: string): Grade3Mission[] {
  return missions.filter((mission) => mission.unitId === unitId).sort((a, b) => a.unitMissionOrder - b.unitMissionOrder)
}

function firstMissionForUnit(missions: Grade3Mission[], unitId: string, progress: Grade3Progress): Grade3Mission {
  const items = unitMissions(missions, unitId)
  return (
    items.find((mission) => progress.reviewMissionIds.includes(mission.id)) ??
    items.find((mission) => !progress.completedMissionIds.includes(mission.id)) ??
    items[0] ??
    missions[0]
  )
}

function nextMissionInUnit(missions: Grade3Mission[], current: Grade3Mission, progress: Grade3Progress): Grade3Mission | null {
  const items = unitMissions(missions, current.unitId)
  return (
    items.find((mission) => mission.unitMissionOrder > current.unitMissionOrder && !progress.completedMissionIds.includes(mission.id)) ??
    items.find((mission) => !progress.completedMissionIds.includes(mission.id)) ??
    null
  )
}

function strongestTag(progress: Grade3Progress): string {
  const entries = Object.entries(progress.skillSummaryByTag)
  if (entries.length === 0) return '아직 시작 전'
  return entries.slice().sort(([, a], [, b]) => b.correct - a.correct || b.attempted - a.attempted)[0][0]
}

function emptyFractionAnswer(): Grade3StructuredFractionInput {
  return { numerator: '', denominator: '' }
}

function emptyLengthAnswer(): Grade3StructuredLengthInput {
  return { kilometers: '', meters: '', centimeters: '', millimeters: '' }
}

function emptyTimeAnswer(): Grade3StructuredTimeInput {
  return { hours: '', minutes: '', seconds: '' }
}

function emptyCapacityAnswer(): Grade3StructuredCapacityInput {
  return { liters: '', milliliters: '' }
}

function emptyWeightAnswer(): Grade3StructuredWeightInput {
  return { kilograms: '', grams: '' }
}

function formatFraction(answer: Grade3StructuredFractionInput): string {
  return `${String(answer.numerator ?? '').trim() || '0'}/${String(answer.denominator ?? '').trim() || '0'}`
}

function formatLength(answer: Grade3StructuredLengthInput, unit?: string): string {
  if (unit === 'km-m') {
    return `${String(answer.kilometers ?? '').trim() || '0'}km ${String(answer.meters ?? '').trim() || '0'}m`
  }
  return `${String(answer.centimeters ?? '').trim() || '0'}cm ${String(answer.millimeters ?? '').trim() || '0'}mm`
}

function formatTime(answer: Grade3StructuredTimeInput, duration: boolean): string {
  const hours = String(answer.hours ?? '').trim() || '0'
  const minutes = String(answer.minutes ?? '').trim() || '0'
  const seconds = String(answer.seconds ?? '').trim() || '0'
  return duration ? `${hours}시간 ${minutes}분 ${seconds}초` : `${hours}시 ${minutes}분 ${seconds}초`
}

function formatCapacity(answer: Grade3StructuredCapacityInput): string {
  return `${String(answer.liters ?? '').trim() || '0'}L ${String(answer.milliliters ?? '').trim() || '0'}mL`
}

function formatWeight(answer: Grade3StructuredWeightInput): string {
  return `${String(answer.kilograms ?? '').trim() || '0'}kg ${String(answer.grams ?? '').trim() || '0'}g`
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

function MissionList({
  missions,
  progress,
  selectedMissionId,
  onSelectMission,
}: {
  missions: Grade3Mission[]
  progress: Grade3Progress
  selectedMissionId: string
  onSelectMission: (missionId: string) => void
}) {
  return (
    <div className="grid gap-3" data-testid="grade3-unit-missions">
      {missions.map((mission) => {
        const complete = progress.completedMissionIds.includes(mission.id)
        const review = progress.reviewMissionIds.includes(mission.id)
        const selected = selectedMissionId === mission.id
        return (
          <button
            key={mission.id}
            type="button"
            onClick={() => onSelectMission(mission.id)}
            data-testid={`grade3-mission-node-${mission.unitMissionOrder}`}
            className={`grid min-h-[76px] grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
              selected
                ? 'border-[#0f766e] bg-[#f0fdfa]'
                : review
                  ? 'border-[#ffb020] bg-[#fff7e6]'
                  : complete
                    ? 'border-[#16a34a] bg-[#dcfce7]'
                    : 'border-[#d8e3ef] bg-white'
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f766e] text-lg font-black text-white">
              {mission.unitMissionOrder}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-black leading-tight text-[#0f172a]">{mission.learnerGoal}</span>
              <span className="mt-1 block text-sm font-bold text-[#64748b]">{mission.curriculumCode}</span>
            </span>
            <span className="text-xs font-black text-[#64748b]">{review ? '복습' : complete ? '완료' : '도전'}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function Grade3GameClient({ initialUnitId }: { initialUnitId: string }) {
  const missions = useMemo(() => getGrade3Missions(MISSION_SEED), [])
  const initialUnit = grade3Units.find((unit) => unit.id === initialUnitId) ?? grade3Units[0]
  const [progress, setProgress] = useState<Grade3Progress>(() => createInitialGrade3Progress())
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [storageRecovered, setStorageRecovered] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnit.id)
  const [selectedMissionId, setSelectedMissionId] = useState(unitMissions(missions, initialUnit.id)[0]?.id ?? 'g3-1-add-sub-01')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [fractionAnswer, setFractionAnswer] = useState<Grade3StructuredFractionInput>(() => emptyFractionAnswer())
  const [lengthAnswer, setLengthAnswer] = useState<Grade3StructuredLengthInput>(() => emptyLengthAnswer())
  const [timeAnswer, setTimeAnswer] = useState<Grade3StructuredTimeInput>(() => emptyTimeAnswer())
  const [capacityAnswer, setCapacityAnswer] = useState<Grade3StructuredCapacityInput>(() => emptyCapacityAnswer())
  const [weightAnswer, setWeightAnswer] = useState<Grade3StructuredWeightInput>(() => emptyWeightAnswer())
  const [scaffoldSelection, setScaffoldSelection] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [wrongAttemptCount, setWrongAttemptCount] = useState(0)
  const [lastSubmissionCorrect, setLastSubmissionCorrect] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [missionRun, setMissionRun] = useState(0)

  const selectedUnit = grade3Units.find((unit) => unit.id === selectedUnitId) ?? grade3Units[0]
  const selectedUnitMissions = unitMissions(missions, selectedUnit.id)
  const selectedMission =
    selectedUnitMissions.find((mission) => mission.id === selectedMissionId) ??
    firstMissionForUnit(missions, selectedUnit.id, progress)
  const solved = lastSubmissionCorrect
  const nextMission = solved ? nextMissionInUnit(missions, selectedMission, progress) : null
  const currentVariantKey = `${selectedMission.id}:seed-${MISSION_SEED}`
  const scratchKey = createMissionSketchKey({
    grade: 3,
    sessionRunKey: `${MISSION_SEED}:run-${missionRun}`,
    missionId: selectedMission.id,
    variantKey: currentVariantKey,
  })

  useEffect(() => {
    const result = loadGrade3Progress()
    const progressForUnit =
      result.progress.selectedUnitId === initialUnit.id ? result.progress : selectGrade3Unit(result.progress, initialUnit.id)
    const recommendedMission = firstMissionForUnit(missions, initialUnit.id, progressForUnit)
    const restoredMission = progressForUnit.missionSketchRunOrdinal > 0
      ? unitMissions(missions, initialUnit.id).find((mission) => mission.id === progressForUnit.latestMissionId) ?? recommendedMission
      : recommendedMission
    setProgress(progressForUnit)
    setMissionRun(progressForUnit.missionSketchRunOrdinal)
    setStorageAvailable(progressForUnit === result.progress ? result.storageAvailable : saveGrade3Progress(progressForUnit))
    setStorageRecovered((wasRecovered) => wasRecovered || result.recovered)
    setSelectedUnitId(initialUnit.id)
    setSelectedMissionId(restoredMission.id)
  }, [initialUnit.id, missions])

  const persistProgress = (nextProgress: Grade3Progress) => {
    setProgress(nextProgress)
    setStorageAvailable(saveGrade3Progress(nextProgress))
  }

  const resetMissionState = () => {
    setSelectedAnswer(null)
    setTextAnswer('')
    setFractionAnswer(emptyFractionAnswer())
    setLengthAnswer(emptyLengthAnswer())
    setTimeAnswer(emptyTimeAnswer())
    setCapacityAnswer(emptyCapacityAnswer())
    setWeightAnswer(emptyWeightAnswer())
    setScaffoldSelection(null)
    setInputError(null)
    setShowHint(false)
    setWrongAttemptCount(0)
    setLastSubmissionCorrect(false)
  }

  const chooseMission = (missionId: string) => {
    setConfirmReset(false)
    const nextProgress = dismissGrade3Intro(progress)
    if (nextProgress !== progress) persistProgress(nextProgress)
    setSelectedMissionId(missionId)
    resetMissionState()
    window.requestAnimationFrame(() => {
      document.getElementById('grade3-mission')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const resetMission = () => {
    const nextProgress = advanceMissionSketchRun(progress)
    persistProgress(nextProgress)
    setMissionRun(nextProgress.missionSketchRunOrdinal)
    resetMissionState()
    document.getElementById('grade3-mission')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const resetAllProgress = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    const nextProgress = {
      ...resetGrade3Progress(),
      missionSketchRunOrdinal: progress.missionSketchRunOrdinal + 1,
    }
    persistProgress(nextProgress)
    setStorageRecovered(false)
    setSelectedUnitId(initialUnit.id)
    setSelectedMissionId(unitMissions(missions, initialUnit.id)[0]?.id ?? 'g3-1-add-sub-01')
    setConfirmReset(false)
    setMissionRun(nextProgress.missionSketchRunOrdinal)
    resetMissionState()
  }

  const submitAnswer = (rawAnswer: Parameters<typeof checkGrade3Answer>[1], displayAnswer: string) => {
    if (solved) return
    const progressWithIntroDismissed = dismissGrade3Intro(progress)
    const result = checkGrade3Answer(selectedMission.answerType, rawAnswer, selectedMission.correctAnswer)
    if (!result.ok) {
      if (progressWithIntroDismissed !== progress) persistProgress(progressWithIntroDismissed)
      setInputError(result.error ?? '답을 다시 확인해요.')
      return
    }

    setInputError(null)
    void appendMissionAttemptReceipt({
      grade: 3,
      mission: selectedMission,
      sessionRunKey: `${MISSION_SEED}:run-${missionRun}`,
      attemptIndex: wrongAttemptCount,
      variantKey: currentVariantKey,
      correct: result.correct,
      usedHint: showHint || wrongAttemptCount > 0,
    }).then((appendResult) => {
      if (appendResult === 'corrupt') {
        console.error('Attempt receipt ledger is corrupt; Grade 3 progress remains authoritative')
      }
    }).catch((error: unknown) => {
      console.error('Failed to append Grade 3 attempt receipt; legacy progress remains authoritative', error)
    })
    setSelectedAnswer(displayAnswer)
    setLastSubmissionCorrect(result.correct)
    dispatchMascotReaction(mascotReactionForAnswer(result.correct))

    if (result.correct) {
      const alreadyCompleted = progressWithIntroDismissed.completedMissionIds.includes(selectedMission.id)
      persistProgress(recordGrade3Attempt(progressWithIntroDismissed, selectedMission, true, {
        hadHint: wrongAttemptCount > 0,
        countSolved: !alreadyCompleted,
      }))
      return
    }

    setWrongAttemptCount((count) => count + 1)
    setShowHint(true)
    persistProgress(recordGrade3Attempt(progressWithIntroDismissed, selectedMission, false))
  }

  return (
    <div className="practice-interaction-surface mx-auto max-w-6xl space-y-6">
      <header className="rounded-[2rem] border-2 border-[#ccfbf1] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/grade/3" className="inline-flex min-h-[44px] items-center rounded-full border-2 border-[#ccfbf1] px-4 text-sm font-black text-[#0f766e]">
              단원 선택
            </Link>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">{selectedUnit.semester} 미션</p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-[#0f172a] md:text-5xl">{selectedUnit.title}</h1>
            <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#64748b]">
              {selectedUnit.subtitle} 그림을 먼저 보고 답 칸에 나누어 써요.
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

      <section className="grid gap-5 rounded-[2rem] border-2 border-[#ccfbf1] bg-white p-5 md:p-6 lg:grid-cols-[320px_1fr]" data-testid="grade3-mission-nav">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">{selectedUnit.semester}</p>
          <h2 className="mt-1 text-2xl font-black text-[#0f172a]">{selectedUnit.title}</h2>
          <p className="mt-2 text-sm font-bold leading-relaxed text-[#64748b]">{selectedUnit.subtitle}</p>
          <p className="mt-4 text-sm font-black text-[#64748b]">
            오늘 {progress.todaySolvedCount}개 해결 · 다시 볼 미션 {progress.reviewMissionIds.length}개
          </p>
        </div>
        <MissionList missions={selectedUnitMissions} progress={progress} selectedMissionId={selectedMission.id} onSelectMission={chooseMission} />
      </section>

      <Grade3MissionCard
        mission={selectedMission}
        selectedAnswer={selectedAnswer}
        textAnswer={textAnswer}
        fractionAnswer={fractionAnswer}
        lengthAnswer={lengthAnswer}
        timeAnswer={timeAnswer}
        capacityAnswer={capacityAnswer}
        weightAnswer={weightAnswer}
        scaffoldSelection={scaffoldSelection}
        showHint={showHint}
        wrongAttemptCount={wrongAttemptCount}
        inputError={inputError}
        solved={solved}
        missionCount={selectedUnitMissions.length}
        onScaffoldSelect={(value) => {
          setScaffoldSelection(value)
          setInputError(null)
        }}
        onChoiceAnswer={(answer) => submitAnswer(answer, answer)}
        onTextAnswerChange={(answer) => {
          setTextAnswer(answer)
          setInputError(null)
        }}
        onFractionAnswerChange={(answer) => {
          setFractionAnswer(answer)
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
        onCapacityAnswerChange={(answer) => {
          setCapacityAnswer(answer)
          setInputError(null)
        }}
        onWeightAnswerChange={(answer) => {
          setWeightAnswer(answer)
          setInputError(null)
        }}
        onSubmitText={() => submitAnswer(textAnswer.trim(), textAnswer.trim())}
        onSubmitFraction={() => submitAnswer(fractionAnswer, formatFraction(fractionAnswer))}
        onSubmitLength={() => submitAnswer(lengthAnswer, formatLength(lengthAnswer, selectedMission.answerConfig.unit))}
        onSubmitTime={() => submitAnswer(timeAnswer, formatTime(timeAnswer, selectedMission.answerType === 'duration'))}
        onSubmitCapacity={() => submitAnswer(capacityAnswer, formatCapacity(capacityAnswer))}
        onSubmitWeight={() => submitAnswer(weightAnswer, formatWeight(weightAnswer))}
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
        <section className="rounded-[2rem] border-2 border-[#16a34a] bg-[#dcfce7] p-5 md:p-6" data-testid="grade3-reward-panel">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#166534]">보상 획득</p>
              <h2 className="mt-1 text-2xl font-black text-[#0f172a]">{rewardName(selectedMission.rewardId)}을 얻었어요.</h2>
              <p className="mt-2 text-sm font-bold text-[#166534]">잘한 영역: {strongestTag(progress)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 md:min-w-[520px]">
              <button
                type="button"
                className="min-h-[56px] rounded-xl bg-[#0f766e] px-4 py-3 text-base font-black text-white shadow-[0_5px_0_#115e59] disabled:bg-[#94a3b8] disabled:shadow-[0_5px_0_#64748b]"
                disabled={!nextMission}
                onClick={() => nextMission && chooseMission(nextMission.id)}
                data-testid="next-grade3-mission"
              >
                같은 단원 다음 미션
              </button>
              <Link href="/grade/3" className="min-h-[56px] rounded-xl border-2 border-[#d8e3ef] bg-white px-4 py-3 text-base font-black text-[#0f766e] shadow-[0_5px_0_#cbd5e1]" data-testid="grade3-back-units">
                다른 단원 고르기
              </Link>
              <button
                type="button"
                className="min-h-[56px] rounded-xl bg-[#ffedd5] px-4 py-3 text-base font-black text-[#9a3412] shadow-[0_5px_0_#fed7aa]"
                onClick={resetMission}
                data-testid="grade3-retry-mission"
              >
                다시 풀기
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
