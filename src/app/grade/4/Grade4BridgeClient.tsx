'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import ScratchPad from '@/components/ScratchPad'
import { Grade4MissionCard } from '@/components/grade4'
import { checkGrade4Answer } from '@/lib/grade4-answer-normalizers'
import { appendGrade4AttemptReceipt } from '@/lib/grade4-attempt-receipt'
import { resolveExperiencePreset } from '@/lib/experience-preset'
import { getGrade4Activity, grade4Units, SAFE_GRADE4_UNIT_ID } from '@/lib/grade4-problems'
import {
  advanceGrade4Activity,
  createInitialGrade4Progress,
  loadGrade4Progress,
  recordGrade4Attempt,
  saveGrade4Progress,
  selectGrade4Unit,
  setGrade4ActiveItem,
  type Grade4Progress,
} from '@/lib/grade4-progress'

const ACTIVITY_SEED = 20260721

export default function Grade4BridgeClient({ initialUnitId }: { initialUnitId: string }) {
  const unitId = grade4Units.some((unit) => unit.id === initialUnitId) ? initialUnitId : SAFE_GRADE4_UNIT_ID
  const unit = grade4Units.find((item) => item.id === unitId) ?? grade4Units[0]
  const preset = resolveExperiencePreset(4)
  const [progress, setProgress] = useState<Grade4Progress>(() => selectGrade4Unit(createInitialGrade4Progress(), unitId))
  const [storageNotice, setStorageNotice] = useState(false)
  const [textAnswer, setTextAnswer] = useState('')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [wrongAttemptCount, setWrongAttemptCount] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [solved, setSolved] = useState(false)
  const [activityComplete, setActivityComplete] = useState(false)

  useEffect(() => {
    const result = loadGrade4Progress()
    const next = selectGrade4Unit(result.progress, unitId)
    setProgress(next)
    setStorageNotice(!result.storageAvailable || result.recovered || !saveGrade4Progress(next))
  }, [unitId])

  const activity = useMemo(() => getGrade4Activity(unitId, ACTIVITY_SEED, progress.activityRun), [progress.activityRun, unitId])
  const mission = activity[Math.min(progress.activeItemIndex, activity.length - 1)]
  const activityNumber = progress.activityRun + 1

  const persist = (next: Grade4Progress) => {
    setProgress(next)
    if (!saveGrade4Progress(next)) setStorageNotice(true)
  }

  const clearAnswerState = () => {
    setTextAnswer('')
    setSelectedAnswer(null)
    setInputError(null)
    setWrongAttemptCount(0)
    setShowHint(false)
    setSolved(false)
  }

  const submit = (answer: string) => {
    if (solved) return
    const result = checkGrade4Answer(mission.answerType, answer, mission.correctAnswer)
    if (!result.ok) {
      setInputError(result.error)
      return
    }
    setInputError(null)
    const usedHint = showHint || wrongAttemptCount > 0
    void appendGrade4AttemptReceipt({
      mission,
      activityRun: progress.activityRun,
      attemptOrdinal: wrongAttemptCount,
      correct: result.correct,
      usedHint,
    }).then((appendResult) => {
      if (appendResult === 'corrupt') console.error('Attempt receipt ledger is corrupt; Grade 4 progress remains authoritative')
    }).catch((error: unknown) => {
      console.error('Failed to append Grade 4 attempt receipt; Grade 4 progress remains authoritative', error)
    })
    const next = recordGrade4Attempt(progress, {
      missionId: mission.id,
      variantKey: mission.variantKey,
      unitId,
      skillTag: mission.skillTag,
      correct: result.correct,
      usedHint,
    })
    persist(next)
    if (result.correct) setSolved(true)
    else setWrongAttemptCount((count) => count + 1)
  }

  const nextMission = () => {
    if (progress.activeItemIndex >= activity.length - 1) {
      setActivityComplete(true)
      return
    }
    persist(setGrade4ActiveItem(progress, progress.activeItemIndex + 1))
    clearAnswerState()
  }

  const nextActivity = () => {
    persist(advanceGrade4Activity(progress))
    setActivityComplete(false)
    clearAnswerState()
  }

  return (
    <main className="practice-interaction-surface -mx-4 -my-6 min-h-screen bg-[#eef2ff] px-4 py-5 md:px-6" data-testid="grade4-mission-page">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-[2rem] border-2 border-[#c7d2fe] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/grade/4" className="inline-flex min-h-[44px] items-center rounded-full border-2 border-[#c7d2fe] px-4 text-sm font-black text-[#4338ca]">단원으로</Link>
            <p className="text-sm font-black text-[#64748b]">활동 {activityNumber} · {progress.activeItemIndex + 1}/{preset.defaultItems}</p>
          </div>
          <h1 className="mt-4 text-3xl font-black text-[#0f172a]">{unit.title}</h1>
          <p className="mt-2 font-bold text-[#64748b]">기록은 이 기기에 저장돼요. 한 활동은 알기·적용·추론 3문제예요.</p>
        </header>

        {storageNotice && <p data-testid="grade4-storage-notice" className="rounded-2xl border-2 border-[#f59e0b] bg-[#fffbeb] p-4 text-sm font-black text-[#92400e]">기기 저장을 확인할 수 없지만 지금 활동은 계속할 수 있어요.</p>}

        {activityComplete ? (
          <section data-testid="grade4-activity-complete" className="rounded-[2rem] border-2 border-[#86efac] bg-white p-7 text-center">
            <p className="text-sm font-black text-[#16a34a]">Chapter complete</p>
            <h2 className="mt-2 text-3xl font-black text-[#0f172a]">큰 수 다리를 건넜어요!</h2>
            <p className="mt-3 font-bold text-[#64748b]">오늘 해결한 문제 {progress.todaySolvedCount}개 · 복습할 문제 {progress.reviewVariantKeys.length}개</p>
            <button type="button" onClick={nextActivity} data-testid="grade4-next-activity" className="mt-6 min-h-[56px] rounded-xl bg-[#4f46e5] px-7 font-black text-white shadow-[0_5px_0_#3730a3]">새 숫자로 한 번 더</button>
          </section>
        ) : (
          <>
            <Grade4MissionCard mission={mission} selectedAnswer={selectedAnswer} textAnswer={textAnswer} inputError={inputError} wrongAttemptCount={wrongAttemptCount} showHint={showHint} solved={solved}
              onChoiceAnswer={(answer) => { setSelectedAnswer(answer); submit(answer) }} onTextAnswerChange={setTextAnswer} onSubmitText={() => submit(textAnswer)} onShowHint={() => setShowHint(true)} />
            {mission.supportTool === 'grid' && <aside data-testid="grade4-support-grid" className="rounded-2xl border-2 border-[#a5b4fc] bg-white p-4 text-sm font-black text-[#4338ca]">보조 도구 1개 · 자릿수를 맞춰 쓸 수 있는 모눈을 풀이장에서 사용해요.</aside>}
            <ScratchPad learnerId={null} sessionId={`grade4:${unitId}:activity-${progress.activityRun}`} itemId={mission.variantKey} sessionStatus={solved ? 'completed' : 'active'} />
            {solved && <button type="button" data-testid="grade4-next-mission" onClick={nextMission} className="min-h-[58px] w-full rounded-xl bg-[#16a34a] px-6 text-lg font-black text-white shadow-[0_5px_0_#166534]">{progress.activeItemIndex === activity.length - 1 ? '활동 마치기' : '다음 문제'}</button>}
          </>
        )}
      </div>
    </main>
  )
}
