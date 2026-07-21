'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getConceptById, getTemplatesByConceptId } from '@/lib/data'
import { generateProblems } from '@/lib/problem-generator'
import { getNumberAnswerInputError, gradeSession } from '@/lib/grader'
import {
  LocalAttemptReceiptStore,
  createAttemptReceipt,
  createContentDedupeKey,
} from '@/lib/attempt-receipt'
import { resolveExperiencePreset } from '@/lib/experience-preset'
import { isCurriculumGradeReleased } from '@/lib/grade-release'
import { persistCompletedPractice } from '@/lib/practice-completion'
import { dispatchMascotReaction, mascotReactionForAnswer } from '@/lib/mascot'
import {
  saveSession,
  loadSession,
  createSessionTiming,
  createSessionId,
  createRetrySessionFromResult,
  getSessionStorageStatus,
  markAnswerChecked,
  resetGrade6SessionStorage,
  updateAnswer,
  updateCurrentIndex,
  loadResult,
  matchesSessionRequest
} from '@/lib/session'
import type { Concept, PracticeMode, PracticeSession } from '@/lib/types'
import { AnswerFeedback, Button, GradeReleaseBlocked, ProblemCard, ProgressIndicator, MathText, ScratchPad } from '@/components'

function isAnswered(answer: string | null): boolean {
  return typeof answer === 'string' && answer.trim() !== ''
}

const CONTENT_RELEASE_IDS = {
  5: 'grade5-static-v1',
  6: 'grade6-ratio-v1',
} as const

function problemVariantKey(problem: PracticeSession['problems'][number]): string {
  const params = Object.entries(problem.params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(',')
  return `${problem.templateId}:${params}`
}

export default function PracticeClient() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const conceptId = params.conceptId as string
  const rawSet = searchParams.get('set')
  const setId = rawSet === 'B' || rawSet === 'C' ? rawSet : 'A'
  const requestedMode: PracticeMode =
    searchParams.get('mode') === 'retry-wrong' ? 'retry-wrong' : 'standard'
  const sourceResultId = searchParams.get('source') ?? undefined
  const practiceGrade = conceptId.startsWith('g6') ? 6 : 5
  const experiencePreset = resolveExperiencePreset(practiceGrade)
  const requestedItemCount: 5 | 10 = practiceGrade === 6 && searchParams.get('count') !== '10'
    ? (experiencePreset.defaultItems === 5 ? 5 : 10)
    : 10

  const [concept, setConcept] = useState<Concept | null>(null)
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [inputError, setInputError] = useState<string | null>(null)
  const [releaseBlocked, setReleaseBlocked] = useState(false)
  const [storageRecoveryNeeded, setStorageRecoveryNeeded] = useState(false)
  const [initializationAttempt, setInitializationAttempt] = useState(0)

  // 세션 초기화 또는 복구
  useEffect(() => {
    let active = true

    const initSession = async () => {
      try {
        if (practiceGrade === 6) {
          const released = await isCurriculumGradeReleased(6)
          if (!active) return
          if (!released) {
            setReleaseBlocked(true)
            return
          }
        }

        // 개념 로드
        const conceptData = await getConceptById(conceptId)
        if (!active) return
        if (!conceptData) {
          return
        }
        setConcept(conceptData)

        if (practiceGrade === 6 && getSessionStorageStatus(6) === 'corrupt') {
          setStorageRecoveryNeeded(true)
          return
        }

        // 기존 세션 확인
        const existingSession = loadSession(practiceGrade)
        if (
          existingSession &&
          matchesSessionRequest(existingSession, {
            conceptId,
            setId,
            mode: requestedMode,
            sourceResultId,
            grade: practiceGrade,
            itemCount: requestedItemCount,
          })
        ) {
          setSession(existingSession)
          return
        }

        if (requestedMode === 'retry-wrong') {
          const result = loadResult(practiceGrade)
          if (
            result &&
            result.sessionId === sourceResultId &&
            result.conceptId === conceptId &&
            result.setId === setId
          ) {
            const retrySession = createRetrySessionFromResult(result)
            if (retrySession) {
              if (!saveSession(retrySession)) {
                setStorageRecoveryNeeded(true)
                return
              }
              setSession(retrySession)
            }
          }
          return
        }

        // 새 세션 생성
        const templates = await getTemplatesByConceptId(conceptId)
        if (!active) return
        if (templates.length === 0) {
          console.error('No templates found for concept:', conceptId)
          return
        }

        const problems = generateProblems(templates, {
          count: requestedItemCount,
          setId,
          difficultyMix: requestedItemCount === 5 ? { 1: 2, 2: 2, 3: 1 } : { 1: 4, 2: 4, 3: 2 },
        })
        const timing = createSessionTiming()

        const newSession: PracticeSession = {
          sessionId: createSessionId(Date.now(), practiceGrade),
          conceptId,
          setId,
          mode: 'standard',
          grade: practiceGrade === 6 ? 6 : undefined,
          itemCount: practiceGrade === 6 ? requestedItemCount : undefined,
          problems,
          answers: Array(problems.length).fill(null),
          checkedAnswers: Array(problems.length).fill(null),
          currentIndex: 0,
          ...timing
        }

        if (!saveSession(newSession)) {
          if (practiceGrade === 6) setStorageRecoveryNeeded(true)
          return
        }
        setSession(newSession)
      } catch (error) {
        if (active) console.error('Failed to init session:', error)
      } finally {
        if (active) setLoading(false)
      }
    }

    initSession()

    return () => {
      active = false
    }
  }, [conceptId, initializationAttempt, practiceGrade, requestedItemCount, requestedMode, setId, sourceResultId])

  const handleResetCorruptGrade6Session = useCallback(() => {
    resetGrade6SessionStorage()
    setStorageRecoveryNeeded(false)
    setSession(null)
    setLoading(true)
    setInitializationAttempt((attempt) => attempt + 1)
  }, [])

  // 답안 변경
  const handleAnswer = useCallback((answer: string) => {
    if (!session) return

    setInputError(null)
    const updatedSession = updateAnswer(session, session.currentIndex, answer)
    setSession(updatedSession)
    saveSession(updatedSession)
  }, [session])

  // 현재 문제 즉시 채점
  const handleCheckAnswer = useCallback(() => {
    if (!session) return
    const index = session.currentIndex
    if (!isAnswered(session.answers[index]) || session.checkedAnswers[index] !== null) return

    const problem = session.problems[index]
    if (problem.type === 'number') {
      const error = getNumberAnswerInputError(session.answers[index] ?? '')
      if (error) {
        setInputError(error)
        return
      }
    }

    const result = gradeSession(session.problems, session.answers)[index]
    setInputError(null)
    const updatedSession = markAnswerChecked(session, index, result.correct)
    setSession(updatedSession)
    saveSession(updatedSession)
    dispatchMascotReaction(mascotReactionForAnswer(result.correct))

    const checkedAt = Date.now()
    const receipt = createAttemptReceipt({
      learnerId: null,
      sessionId: session.sessionId,
      activityId: session.conceptId,
      grade: practiceGrade,
      itemId: `${problem.index}:${problem.templateId}`,
      attemptOrdinal: 0,
      variantKey: problemVariantKey(problem),
      contentReleaseId: CONTENT_RELEASE_IDS[practiceGrade],
      responseStatus: 'checked',
      correct: result.correct,
      usedHint: hintLevel > 0,
      checkedAt,
      dedupeKey: createContentDedupeKey({
        prompt: problem.prompt,
        correctAnswer: problem.correctAnswer,
        choices: problem.choices,
        visual: problem.visual,
      }),
    })
    if (receipt) {
      void new LocalAttemptReceiptStore().append(receipt).then((appendResult) => {
        if (appendResult === 'corrupt') {
          console.error('Attempt receipt ledger is corrupt; legacy progress remains unchanged')
        }
      }).catch((error: unknown) => {
        console.error('Failed to append attempt receipt; legacy progress remains unchanged', error)
      })
    }
  }, [hintLevel, practiceGrade, session])

  // 문제 이동
  const handleNavigate = useCallback((index: number) => {
    if (!session || index < 0 || index >= session.problems.length) return

    setInputError(null)
    const updatedSession = updateCurrentIndex(session, index)
    setSession(updatedSession)
    saveSession(updatedSession)
    dispatchMascotReaction('think')
  }, [session])

  // 제출
  const handleSubmit = useCallback(async () => {
    if (!session || session.checkedAnswers.some(value => value === null)) return

    setSubmitting(true)

    try {
      const results = gradeSession(session.problems, session.answers)
      const completionWrite = persistCompletedPractice(session, results)
      if (completionWrite.status !== 'completed') {
        throw new Error(`${completionWrite.target} storage is corrupt; original data was preserved`)
      }
      router.push(practiceGrade === 6 ? '/result?grade=6' : '/result')
    } catch (error) {
      console.error('Failed to submit:', error)
      setSubmitting(false)
    }
  }, [practiceGrade, session, router])

  useEffect(() => {
    setHintLevel(0)
  }, [session?.currentIndex])

  if (releaseBlocked) return <GradeReleaseBlocked grade={6} />

  if (storageRecoveryNeeded) {
    return (
      <main className="mx-auto max-w-2xl py-10" data-testid="grade6-session-recovery">
        <section className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 text-center md:p-8">
          <p className="text-sm font-black text-amber-800">6학년 문제 저장 확인</p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">저장된 문제를 복구해야 해요</h1>
          <p className="mt-3 font-bold leading-7 text-slate-700">
            손상된 원문은 자동으로 덮어쓰지 않았어요. 이 6학년 문제 저장만 초기화하면 새 문제를 시작할 수 있어요.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button type="button" onClick={handleResetCorruptGrade6Session} data-testid="reset-grade6-session">
              6학년 문제 저장 초기화
            </Button>
            <Link href="/home" className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 font-black text-slate-700">
              학습 홈으로
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!concept || !session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">문제를 불러올 수 없습니다.</p>
        <Link href="/home">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  const currentProblem = session.problems[session.currentIndex]
  const currentAnswer = session.answers[session.currentIndex]
  const checkedCount = session.checkedAnswers.filter(value => value !== null).length
  const allChecked = checkedCount === session.problems.length
  const currentChecked = session.checkedAnswers[session.currentIndex]
  const currentResult = currentChecked === null
    ? null
    : gradeSession(session.problems, session.answers)[session.currentIndex]
  const hintSteps = currentProblem.hintSteps ?? []
  const modeLabel = session.mode === 'retry-wrong' ? '오답 다시 풀기' : `세트 ${session.setId}`

  return (
    <div
      className="practice-interaction-surface space-y-6 pb-32"
      data-experience-preset={experiencePreset.ageBand}
      data-testid="practice-session"
    >
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/concept/${conceptId}`} aria-label="개념으로 돌아가기" className="-ml-2 inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full touch-manipulation">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
              {modeLabel}
            </p>
            <h1 className="text-lg font-bold text-gray-800">{concept.concept_title}</h1>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {checkedCount} / {session.problems.length} 확인
        </span>
      </header>

      {/* 진행률 */}
      <ProgressIndicator
        total={session.problems.length}
        current={session.currentIndex}
        answers={session.answers}
        checkedAnswers={session.checkedAnswers}
        onSelect={handleNavigate}
      />

      {/* 문제와 태블릿용 임시 풀이장 */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          <ProblemCard
            problem={currentProblem}
            answer={currentAnswer}
            onAnswer={handleAnswer}
            checked={currentChecked !== null}
          />
          {inputError && currentChecked === null && (
            <div
              role="alert"
              data-testid="number-input-error"
              className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-center text-sm font-bold text-amber-900"
            >
              {inputError}
            </div>
          )}
          {currentResult && <AnswerFeedback result={currentResult} />}
        </div>
        <div className="lg:sticky lg:top-4">
          <ScratchPad
            learnerId={null}
            sessionId={session.sessionId}
            itemId={`${currentProblem.index}:${currentProblem.templateId}`}
            sessionStatus="active"
          />
        </div>
      </div>

      {/* 힌트 */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-700">단계 힌트</h2>
          <Button
            variant="secondary"
            onClick={() => {
              setHintLevel(prev => Math.min(prev + 1, hintSteps.length))
              dispatchMascotReaction('hint')
            }}
            disabled={hintSteps.length === 0 || hintLevel >= hintSteps.length}
          >
            {hintSteps.length === 0
              ? '힌트 없음'
              : hintLevel >= hintSteps.length
                ? '모두 열람'
                : `힌트 보기 (${hintLevel + 1}/${hintSteps.length})`}
          </Button>
        </div>
        {hintSteps.length === 0 ? (
          <p className="text-sm text-gray-500">이 문제는 힌트가 준비되지 않았어요.</p>
        ) : (
          <ol className="space-y-2 text-sm text-gray-700">
            {hintSteps.slice(0, hintLevel).map((step, i) => (
              <li key={i} className="flex">
                <span className="text-gray-400 mr-2">{i + 1}.</span>
                <MathText>{step}</MathText>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Button
            variant="secondary"
            onClick={() => handleNavigate(session.currentIndex - 1)}
            disabled={session.currentIndex === 0}
            className="flex-1"
            data-testid="previous-button"
          >
            이전
          </Button>

          {currentChecked === null ? (
            <Button
              onClick={handleCheckAnswer}
              disabled={!isAnswered(currentAnswer)}
              className="flex-1"
              data-testid="check-answer-button"
            >
              정답 확인
            </Button>
          ) : session.currentIndex < session.problems.length - 1 ? (
            <Button
              onClick={() => handleNavigate(session.currentIndex + 1)}
              className="flex-1"
              data-testid="next-button"
            >
              다음
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allChecked || submitting}
              className="flex-1"
              data-testid="submit-button"
            >
              {submitting
                ? '제출 중...'
                : allChecked
                  ? '결과 보기'
                  : `${checkedCount}/${session.problems.length} 확인`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
