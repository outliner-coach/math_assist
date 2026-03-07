'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  createRetrySessionFromResult,
  loadResult,
  saveSession
} from '@/lib/session'
import { getConceptById } from '@/lib/data'
import type { Concept, SessionResult } from '@/lib/types'
import { Button, ResultCard } from '@/components'

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<SessionResult | null>(null)
  const [concept, setConcept] = useState<Concept | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const resultData = loadResult()
      if (!resultData) {
        setLoading(false)
        return
      }

      setResult(resultData)
      const conceptData = await getConceptById(resultData.conceptId)
      setConcept(conceptData)
      setLoading(false)
    }

    loadData()
  }, [])

  const handleRetryWrong = () => {
    if (!result) return

    const retrySession = createRetrySessionFromResult(result)
    if (!retrySession) return

    saveSession(retrySession)
    router.push(
      `/practice/${result.conceptId}?set=${result.setId}&mode=retry-wrong&source=${result.sessionId}`
    )
  }

  const handlePracticeMore = () => {
    if (!result) return
    router.push(`/practice/${result.conceptId}?set=${result.setId}`)
  }

  const handleConcept = () => {
    if (!result) return
    router.push(`/concept/${result.conceptId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">결과를 찾을 수 없습니다.</p>
        <Link href="/">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  const percentage = Math.round((result.score / result.total) * 100)
  const isPerfect = percentage === 100
  const wrongResults = result.results.filter((entry) => !entry.correct)
  const correctResults = result.results.filter((entry) => entry.correct)
  const modeLabel = result.mode === 'retry-wrong' ? '오답 다시 풀기 결과' : `세트 ${result.setId} 결과`
  const nextActionLabel = isPerfect
    ? '비슷한 문제 10개 더'
    : '틀린 문제부터 바로 다시'
  const headline = isPerfect
    ? result.mode === 'retry-wrong'
      ? '방금 틀린 문제를 모두 바로잡았어요.'
      : '완벽하게 마쳤어요.'
    : result.mode === 'retry-wrong'
      ? '조금만 더 다듬으면 끝이에요.'
      : '오답부터 다시 잡으면 훨씬 빨리 늘어요.'
  const description = isPerfect
    ? '같은 개념의 새 문제 세트로 감각을 이어가세요.'
    : '점수보다 다음 행동이 중요해요. 지금 바로 오답만 다시 풀 수 있어요.'

  return (
    <div className="space-y-6 pb-44">
      <header className="py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          {modeLabel}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-800">
          {concept?.concept_title || '연습'} 결과
        </h1>
      </header>

      <section className="space-y-6 rounded-3xl bg-white p-8 shadow-lg">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">{headline}</h2>
          <p className="text-gray-600">{description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm font-medium text-gray-500">점수</p>
            <p data-testid="score" className="mt-2 text-4xl font-bold text-gray-800">
              {result.score}
              <span className="ml-2 text-lg font-medium text-gray-400">/ {result.total}</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">{percentage}% 정답률</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm font-medium text-gray-500">오답 수</p>
            <p className="mt-2 text-4xl font-bold text-gray-800">{result.wrongCount}</p>
            <p className="mt-2 text-sm text-gray-500">
              {result.wrongCount === 0 ? '모든 문항을 맞혔어요.' : '지금 바로 다시 볼 수 있어요.'}
            </p>
          </div>
          <div className="rounded-2xl bg-primary-50 p-5">
            <p className="text-sm font-medium text-primary-700">다음 액션</p>
            <p className="mt-2 text-lg font-bold text-primary-900">{nextActionLabel}</p>
            <p className="mt-2 text-sm text-primary-800">
              {isPerfect ? '같은 개념의 새 세트를 풀어보세요.' : '틀린 문제만 짧게 다시 풀고 바로 재채점해요.'}
            </p>
          </div>
        </div>
      </section>

      {wrongResults.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">먼저 다시 볼 문제</h2>
              <p className="text-sm text-gray-500">오답만 모아서 바로 복습할 수 있게 정리했어요.</p>
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              {wrongResults.length}문항
            </span>
          </div>
          <div className="space-y-4" data-testid="wrong-results">
            {wrongResults.map((entry) => (
              <ResultCard key={`${entry.problem.templateId}-${entry.problem.index}`} result={entry} />
            ))}
          </div>
        </section>
      )}

      {correctResults.length > 0 && (
        <details className="rounded-2xl bg-white p-6 shadow-md">
          <summary className="cursor-pointer text-lg font-bold text-gray-700">
            맞은 문제 보기 ({correctResults.length})
          </summary>
          <div className="mt-4 space-y-4" data-testid="correct-results">
            {correctResults.map((entry) => (
              <ResultCard key={`${entry.problem.templateId}-${entry.problem.index}`} result={entry} />
            ))}
          </div>
        </details>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4">
        <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-3">
          {!isPerfect && (
            <Button
              onClick={handleRetryWrong}
              className="w-full"
              data-testid="retry-wrong-button"
            >
              틀린 문제만 다시
            </Button>
          )}
          <Button
            variant={isPerfect ? 'primary' : 'secondary'}
            onClick={handlePracticeMore}
            className="w-full"
            data-testid="practice-more-button"
          >
            비슷한 문제 10개 더
          </Button>
          <Button
            variant="outline"
            onClick={handleConcept}
            className="w-full"
            data-testid="concept-link-button"
          >
            개념으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  )
}
