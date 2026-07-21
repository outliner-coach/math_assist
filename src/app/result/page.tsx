'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  createRetrySessionFromResult,
  getResultStorageStatus,
  loadResult,
  resetGrade6ResultStorage,
  resolvePracticeGrade,
  resolvePracticeItemCount,
  saveSession
} from '@/lib/session'
import { getConceptById } from '@/lib/data'
import { isCurriculumGradeReleased } from '@/lib/grade-release'
import type { Concept, SessionResult } from '@/lib/types'
import { Button, GradeReleaseBlocked, ResultCard } from '@/components'

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<SessionResult | null>(null)
  const [concept, setConcept] = useState<Concept | null>(null)
  const [loading, setLoading] = useState(true)
  const [releaseBlocked, setReleaseBlocked] = useState(false)
  const [storageRecoveryNeeded, setStorageRecoveryNeeded] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const requestedGrade = new URLSearchParams(window.location.search).get('grade') === '6' ? 6 : 5
      if (requestedGrade === 6 && !await isCurriculumGradeReleased(6)) {
        setReleaseBlocked(true)
        setLoading(false)
        return
      }
      if (requestedGrade === 6 && getResultStorageStatus(6) === 'corrupt') {
        setStorageRecoveryNeeded(true)
        setLoading(false)
        return
      }
      const resultData = loadResult(requestedGrade)
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

  if (releaseBlocked) return <GradeReleaseBlocked grade={6} />

  if (storageRecoveryNeeded) {
    return (
      <main className="mx-auto max-w-2xl py-10" data-testid="grade6-result-recovery">
        <section className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 text-center md:p-8">
          <h1 className="text-2xl font-black text-slate-900">6학년 결과 저장을 복구해야 해요</h1>
          <p className="mt-3 font-bold leading-7 text-slate-700">손상된 원문을 자동으로 덮어쓰지 않았어요. 결과 저장만 초기화한 뒤 새 연습을 시작할 수 있어요.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              onClick={() => {
                resetGrade6ResultStorage()
                router.push('/grade/6')
              }}
              data-testid="reset-grade6-result"
            >
              6학년 결과 저장 초기화
            </Button>
            <Link href="/home"><Button variant="outline" className="w-full">학습 홈으로</Button></Link>
          </div>
        </section>
      </main>
    )
  }

  const handleRetryWrong = () => {
    if (!result) return

    const retrySession = createRetrySessionFromResult(result)
    if (!retrySession) return

    saveSession(retrySession)
    const grade = resolvePracticeGrade(result.grade)
    const count = resolvePracticeItemCount(result.itemCount, grade)
    router.push(
      `/practice/${result.conceptId}?set=${result.setId}&count=${count}&mode=retry-wrong&source=${result.sessionId}`
    )
  }

  const handlePracticeMore = () => {
    if (!result) return
    const grade = resolvePracticeGrade(result.grade)
    const count = resolvePracticeItemCount(result.itemCount, grade)
    router.push(`/practice/${result.conceptId}?set=${result.setId}&count=${count}`)
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
        <Link href="/home">
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
  const practiceItemCount = resolvePracticeItemCount(result.itemCount, resolvePracticeGrade(result.grade))
  const nextActionLabel = isPerfect
    ? `비슷한 문제 ${practiceItemCount}개 더`
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
            비슷한 문제 {practiceItemCount}개 더
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
