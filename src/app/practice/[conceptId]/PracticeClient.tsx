'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getConceptById, getTemplatesByConceptId } from '@/lib/data'
import { generateProblems } from '@/lib/problem-generator'
import { canGradePracticeProblem } from '@/lib/application-problems/practice-interaction-gate'
import { replaceBlockedApplicationProblemsInSession } from '@/lib/application-problems/practice-session-recovery'
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
import { resolveContentReleaseId } from '@/lib/content-release'
import {
  saveSession,
  loadSession,
  clearSession,
  createSessionTiming,
  createSessionId,
  createRetrySessionFromResult,
  getSessionStorageStatus,
  markAnswerChecked,
  persistRecoveredPracticeSession,
  resetGrade6SessionStorage,
  resetGrade5SessionStorage,
  resolvePracticeItemCount,
  updateAnswer,
  updateCurrentIndex,
  loadResult,
  isSessionExpired,
  matchesSessionRequest
} from '@/lib/session'
import type { Concept, PracticeMode, PracticeSession } from '@/lib/types'
import { AnswerFeedback, Button, GradeReleaseBlocked, ProblemCard, ProgressIndicator, MathText, ScratchPad } from '@/components'

function isAnswered(answer: string | null): boolean {
  return typeof answer === 'string' && answer.trim() !== ''
}

function problemVariantKey(problem: PracticeSession['problems'][number]): string {
  const params = Object.entries(problem.params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(',')
  return `${problem.templateId}:${params}`
}

function practiceHrefForSession(session: PracticeSession, grade: 5 | 6): string {
  const search = new URLSearchParams({ set: session.setId })
  search.set('count', String(session.itemCount ?? (grade === 6 ? 5 : 10)))
  if (session.mode === 'retry-wrong') {
    search.set('mode', 'retry-wrong')
    if (session.sourceResultId) search.set('source', session.sourceResultId)
  }
  return `/practice/${encodeURIComponent(session.conceptId)}?${search.toString()}`
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
  const rawItemCount = searchParams.get('count')
  const requestedItemCount = resolvePracticeItemCount(
    rawItemCount === '5' ? 5 : rawItemCount === '10' ? 10 : undefined,
    practiceGrade,
  )

  const [concept, setConcept] = useState<Concept | null>(null)
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [inputError, setInputError] = useState<string | null>(null)
  const [releaseBlocked, setReleaseBlocked] = useState(false)
  const [storageRecoveryNeeded, setStorageRecoveryNeeded] = useState(false)
  const [blockedApplicationSession, setBlockedApplicationSession] = useState<PracticeSession | null>(null)
  const [applicationRecoveryError, setApplicationRecoveryError] = useState<string | null>(null)
  const [replacingApplicationProblem, setReplacingApplicationProblem] = useState(false)
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
        let existingSession = loadSession(practiceGrade)
        if (existingSession) {
          const eligibility = await Promise.all(
            existingSession.problems.map((problem) => (
              canGradePracticeProblem(problem, practiceGrade)
            )),
          )
          if (!active) return
          if (eligibility.some((eligible) => !eligible)) {
            setBlockedApplicationSession(existingSession)
            setApplicationRecoveryError(null)
            return
          }
          if (isSessionExpired(existingSession)) {
            clearSession(practiceGrade)
            existingSession = null
          }
        }

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
            result.setId === setId &&
            resolvePracticeItemCount(result.itemCount, practiceGrade) === requestedItemCount
          ) {
            const retrySession = createRetrySessionFromResult(result)
            if (retrySession) {
              const eligibility = await Promise.all(
                retrySession.problems.map((problem) => (
                  canGradePracticeProblem(problem, practiceGrade)
                )),
              )
              if (!active) return
              if (eligibility.some((eligible) => !eligible)) {
                const originalSaved = saveSession(retrySession)
                setBlockedApplicationSession(retrySession)
                setApplicationRecoveryError(originalSaved
                  ? null
                  : '원래 문제 저장을 보존할 수 없어 아직 새 문제로 바꾸지 않았어요.')
                return
              }
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

        const additionalCandidates = practiceGrade === 5
          ? (await import('@/lib/application-problems/grade5-practice-runtime'))
              .buildApprovedGrade5PracticeProblemCandidates({ conceptId })
          : (await import('@/lib/application-problems/grade6-practice-runtime'))
              .buildApprovedGrade6PracticeProblemCandidates({ conceptId })
        if (!active) return

        const problems = additionalCandidates.length > 0
          ? generateProblems(templates, {
              count: requestedItemCount,
              setId,
              difficultyMix: requestedItemCount === 5
                ? { 1: 2, 2: 2, 3: 1 }
                : { 1: 4, 2: 4, 3: 2 },
              additionalCandidates,
            })
          : generateProblems(templates, {
              count: requestedItemCount,
              setId,
              cognitiveDomainMix: requestedItemCount === 5
                ? { knowing: 2, applying: 2, reasoning: 1 }
                : { knowing: 4, applying: 4, reasoning: 2 },
            })
        const timing = createSessionTiming()

        const newSession: PracticeSession = {
          sessionId: createSessionId(Date.now(), practiceGrade),
          conceptId,
          setId,
          mode: 'standard',
          grade: practiceGrade,
          itemCount: requestedItemCount,
          problems,
          answers: Array(problems.length).fill(null),
          checkedAnswers: Array(problems.length).fill(null),
          currentIndex: 0,
          ...timing
        }

        const eligibility = await Promise.all(
          newSession.problems.map((problem) => canGradePracticeProblem(problem, practiceGrade)),
        )
        if (!active) return
        if (eligibility.some((eligible) => !eligible)) {
          throw new Error('generated session contains an ineligible application problem')
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

  const handleReplaceBlockedApplicationSession = useCallback(async () => {
    if (!blockedApplicationSession || replacingApplicationProblem) return
    setReplacingApplicationProblem(true)
    setApplicationRecoveryError(null)
    try {
      const candidates = practiceGrade === 5
        ? (await import('@/lib/application-problems/grade5-practice-runtime'))
            .buildApprovedGrade5PracticeProblemCandidates({
              conceptId: blockedApplicationSession.conceptId,
            })
        : (await import('@/lib/application-problems/grade6-practice-runtime'))
            .buildApprovedGrade6PracticeProblemCandidates({
              conceptId: blockedApplicationSession.conceptId,
            })
      const recovered = await replaceBlockedApplicationProblemsInSession({
        session: blockedApplicationSession,
        grade: practiceGrade,
        candidates,
      })
      if (
        !recovered ||
        !persistRecoveredPracticeSession(blockedApplicationSession, recovered)
      ) {
        setApplicationRecoveryError(
          '지금은 승인된 새 문제로 안전하게 바꿀 수 없어요. 원래 저장 기록은 그대로 두었어요.',
        )
        return
      }
      if (
        !matchesSessionRequest(recovered, {
          conceptId,
          setId,
          mode: requestedMode,
          sourceResultId,
          grade: practiceGrade,
          itemCount: requestedItemCount,
        })
      ) {
        setBlockedApplicationSession(null)
        setHintLevel(0)
        setInputError(null)
        router.push(practiceHrefForSession(recovered, practiceGrade))
        return
      }
      setSession(recovered)
      setBlockedApplicationSession(null)
      setHintLevel(0)
      setInputError(null)
    } catch {
      setApplicationRecoveryError(
        '지금은 승인된 새 문제로 안전하게 바꿀 수 없어요. 원래 저장 기록은 그대로 두었어요.',
      )
    } finally {
      setReplacingApplicationProblem(false)
    }
  }, [
    blockedApplicationSession,
    conceptId,
    practiceGrade,
    replacingApplicationProblem,
    requestedItemCount,
    requestedMode,
    router,
    setId,
    sourceResultId,
  ])

  const handleResetBlockedApplicationSession = useCallback(() => {
    if (practiceGrade === 6) resetGrade6SessionStorage()
    else resetGrade5SessionStorage()
    setBlockedApplicationSession(null)
    setApplicationRecoveryError(null)
    setSession(null)
    setLoading(true)
    setInitializationAttempt((attempt) => attempt + 1)
  }, [practiceGrade])

  // 답안 변경
  const handleAnswer = useCallback((answer: string) => {
    if (!session) return

    setInputError(null)
    const updatedSession = updateAnswer(session, session.currentIndex, answer)
    setSession(updatedSession)
    saveSession(updatedSession)
  }, [session])

  // 현재 문제 즉시 채점
  const handleCheckAnswer = useCallback(async () => {
    if (!session) return
    const index = session.currentIndex
    if (!isAnswered(session.answers[index]) || session.checkedAnswers[index] !== null) return

    const problem = session.problems[index]
    if (!await canGradePracticeProblem(problem, practiceGrade)) {
      setInputError('필수 그림을 확인할 수 없어 이 문제를 채점하지 않았어요. 문제를 다시 불러와 주세요.')
      return
    }
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
      contentReleaseId: resolveContentReleaseId(practiceGrade, conceptId),
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
  }, [conceptId, hintLevel, practiceGrade, session])

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

    const gradeable = await Promise.all(
      session.problems.map((problem) => canGradePracticeProblem(problem, practiceGrade)),
    )
    if (gradeable.some((ready) => !ready)) {
      setInputError('필수 그림을 확인할 수 없어 결과를 저장하지 않았어요. 문제를 다시 불러와 주세요.')
      return
    }

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

  if (blockedApplicationSession) {
    return (
      <main className="mx-auto max-w-2xl py-10" data-testid="blocked-application-session-recovery">
        <section className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 text-center md:p-8" role="alert">
          <p className="text-sm font-black text-amber-800">응용 문제 안전 확인</p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">이 문제는 새 문제로 바꿔야 해요</h1>
          <p className="mt-3 font-bold leading-7 text-slate-700">
            문제 문장과 답안은 표시하지 않았어요. 새 문제로 바꿀 때에도 원래 문제 기록은 확인할 수 있도록 함께 보존해요.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              onClick={handleReplaceBlockedApplicationSession}
              disabled={replacingApplicationProblem}
              data-testid="replace-blocked-application-session"
            >
              {replacingApplicationProblem ? '새 문제 확인 중...' : '안전한 새 문제 받기'}
            </Button>
            <Button
              type="button"
              onClick={handleResetBlockedApplicationSession}
              data-testid="reset-blocked-application-session"
            >
              이 문제 저장 초기화
            </Button>
          </div>
          {applicationRecoveryError && (
            <p className="mt-4 font-black text-amber-900">{applicationRecoveryError}</p>
          )}
          <Link href="/home" className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 font-black text-slate-700">
            학습 홈으로
          </Link>
        </section>
      </main>
    )
  }

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
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 pr-12 md:pr-80"
        data-testid="practice-navigation-actions"
      >
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
