'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getConceptById, getTemplatesByConceptId } from '@/lib/data'
import { generateProblems, generateSessionId } from '@/lib/problem-generator'
import { gradeSession, calculateScore } from '@/lib/grader'
import {
  saveSession,
  loadSession,
  clearSession,
  createSessionTiming,
  updateAnswer,
  updateCurrentIndex,
  saveResult,
  isSessionExpired
} from '@/lib/session'
import type { Concept, PracticeSession, Problem } from '@/lib/types'
import { Button, ProblemCard, ProgressIndicator } from '@/components'

export default function PracticeClient() {
  const params = useParams()
  const router = useRouter()
  const conceptId = params.conceptId as string

  const [concept, setConcept] = useState<Concept | null>(null)
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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
        if (existingSession && existingSession.conceptId === conceptId && !isSessionExpired(existingSession)) {
          setSession(existingSession)
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

        const problems = generateProblems(templates, 10)
        const timing = createSessionTiming()

        const newSession: PracticeSession = {
          sessionId: generateSessionId(),
          conceptId,
          problems,
          answers: Array(10).fill(null),
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
  }, [conceptId])

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
      const score = calculateScore(results)

      saveResult({
        sessionId: session.sessionId,
        conceptId: session.conceptId,
        score,
        total: session.problems.length,
        results,
        completedAt: Date.now()
      })

      clearSession()
      router.push('/result')
    } catch (error) {
      console.error('Failed to submit:', error)
      setSubmitting(false)
    }
  }, [session, router])

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
  const allAnswered = session.answers.every(a => a !== null)
  const answeredCount = session.answers.filter(a => a !== null).length

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
          <h1 className="text-lg font-bold text-gray-800">{concept.concept_title}</h1>
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

      {/* 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Button
            variant="secondary"
            onClick={() => handleNavigate(session.currentIndex - 1)}
            disabled={session.currentIndex === 0}
            className="flex-1"
          >
            이전
          </Button>

          {session.currentIndex < session.problems.length - 1 ? (
            <Button
              onClick={() => handleNavigate(session.currentIndex + 1)}
              className="flex-1"
            >
              다음
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="flex-1"
            >
              {submitting ? '제출 중...' : allAnswered ? '제출하기' : `${answeredCount}/10 완료`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
