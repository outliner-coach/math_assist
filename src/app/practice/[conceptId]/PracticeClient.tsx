'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getConceptById, getTemplatesByConceptId } from '@/lib/data'
import { generateProblems } from '@/lib/problem-generator'
import { gradeSession } from '@/lib/grader'
import { recordConceptProgress } from '@/lib/progress'
import {
  buildSessionResult,
  saveSession,
  loadSession,
  clearSession,
  createSessionTiming,
  createSessionId,
  createRetrySessionFromResult,
  updateAnswer,
  updateCurrentIndex,
  saveResult,
  loadResult,
  matchesSessionRequest
} from '@/lib/session'
import type { Concept, PracticeMode, PracticeSession } from '@/lib/types'
import { Button, ProblemCard, ProgressIndicator, MathText } from '@/components'

function isAnswered(answer: string | null): boolean {
  return typeof answer === 'string' && answer.trim() !== ''
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

  const [concept, setConcept] = useState<Concept | null>(null)
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)

  // 세션 초기화 또는 복구
  useEffect(() => {
    const initSession = async () => {
      try {
        // 개념 로드
        const conceptData = await getConceptById(conceptId)
        if (!conceptData) {
          setLoading(false)
          return
        }
        setConcept(conceptData)

        // 기존 세션 확인
        const existingSession = loadSession()
        if (
          existingSession &&
          matchesSessionRequest(existingSession, {
            conceptId,
            setId,
            mode: requestedMode,
            sourceResultId
          })
        ) {
          setSession(existingSession)
          setLoading(false)
          return
        }

        if (requestedMode === 'retry-wrong') {
          const result = loadResult()
          if (
            result &&
            result.sessionId === sourceResultId &&
            result.conceptId === conceptId &&
            result.setId === setId
          ) {
            const retrySession = createRetrySessionFromResult(result)
            if (retrySession) {
              saveSession(retrySession)
              setSession(retrySession)
            }
          }
          setLoading(false)
          return
        }

        // 새 세션 생성
        const templates = await getTemplatesByConceptId(conceptId)
        if (templates.length === 0) {
          console.error('No templates found for concept:', conceptId)
          setLoading(false)
          return
        }

        const problems = generateProblems(templates, { count: 10, setId })
        const timing = createSessionTiming()

        const newSession: PracticeSession = {
          sessionId: createSessionId(),
          conceptId,
          setId,
          mode: 'standard',
          problems,
          answers: Array(problems.length).fill(null),
          currentIndex: 0,
          ...timing
        }

        saveSession(newSession)
        setSession(newSession)
      } catch (error) {
        console.error('Failed to init session:', error)
      } finally {
        setLoading(false)
      }
    }

    initSession()
  }, [conceptId, requestedMode, setId, sourceResultId])

  // 답안 변경
  const handleAnswer = useCallback((answer: string) => {
    if (!session) return

    const updatedSession = updateAnswer(session, session.currentIndex, answer)
    setSession(updatedSession)
    saveSession(updatedSession)
  }, [session])

  // 문제 이동
  const handleNavigate = useCallback((index: number) => {
    if (!session || index < 0 || index >= session.problems.length) return

    const updatedSession = updateCurrentIndex(session, index)
    setSession(updatedSession)
    saveSession(updatedSession)
  }, [session])

  // 제출
  const handleSubmit = useCallback(async () => {
    if (!session) return

    setSubmitting(true)

    try {
      const results = gradeSession(session.problems, session.answers)
      const sessionResult = buildSessionResult(session, results)

      saveResult(sessionResult)
      recordConceptProgress(sessionResult)

      clearSession()
      router.push('/result')
    } catch (error) {
      console.error('Failed to submit:', error)
      setSubmitting(false)
    }
  }, [session, router])

  useEffect(() => {
    setHintLevel(0)
  }, [session?.currentIndex])

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
        <Link href="/">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  const currentProblem = session.problems[session.currentIndex]
  const currentAnswer = session.answers[session.currentIndex]
  const allAnswered = session.answers.every(isAnswered)
  const answeredCount = session.answers.filter(isAnswered).length
  const hintSteps = currentProblem.hintSteps ?? []
  const modeLabel = session.mode === 'retry-wrong' ? '오답 다시 풀기' : `세트 ${session.setId}`

  return (
    <div className="space-y-6 pb-32">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/concept/${conceptId}`} className="p-2 -ml-2 touch-manipulation">
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
          {answeredCount} / {session.problems.length}
        </span>
      </header>

      {/* 진행률 */}
      <ProgressIndicator
        total={session.problems.length}
        current={session.currentIndex}
        answers={session.answers}
        onSelect={handleNavigate}
      />

      {/* 문제 카드 */}
      <ProblemCard
        problem={currentProblem}
        answer={currentAnswer}
        onAnswer={handleAnswer}
      />

      {/* 힌트 */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-700">단계 힌트</h2>
          <Button
            variant="secondary"
            onClick={() => setHintLevel(prev => Math.min(prev + 1, hintSteps.length))}
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

          {session.currentIndex < session.problems.length - 1 ? (
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
              disabled={!allAnswered || submitting}
              className="flex-1"
              data-testid="submit-button"
            >
              {submitting
                ? '제출 중...'
                : allAnswered
                  ? '제출하기'
                  : `${answeredCount}/${session.problems.length} 완료`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
