'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadResult, clearResult } from '@/lib/session'
import { getConceptById } from '@/lib/data'
import type { SessionResult, Concept, Problem } from '@/lib/types'
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

  const handleRetry = () => {
    if (!result) return
    clearResult()
    router.push(`/practice/${result.conceptId}`)
  }

  const handleHome = () => {
    clearResult()
    router.push('/')
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
  const isGood = percentage >= 70
  const isPerfect = percentage === 100

  // 문제 데이터 복원 (결과에는 저장되지 않음)
  // 실제로는 결과에 문제 데이터도 저장해야 함
  // 여기서는 임시로 결과만 표시

  return (
    <div className="space-y-6 pb-32">
      {/* 헤더 */}
      <header className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {concept?.concept_title || '연습'} 결과
        </h1>
      </header>

      {/* 점수 */}
      <section className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div
          data-testid="score"
          className={`text-6xl font-bold mb-2 ${
            isPerfect ? 'text-yellow-500' : isGood ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {result.score}
        </div>
        <p className="text-gray-500 text-lg">/ {result.total} 문항</p>

        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                isPerfect ? 'bg-yellow-500' : isGood ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{percentage}% 정답률</p>
        </div>

        <div className="mt-6 text-4xl">
          {isPerfect ? '🎉' : isGood ? '👍' : '💪'}
        </div>
        <p className="text-lg font-medium text-gray-700 mt-2">
          {isPerfect
            ? '완벽해요! 대단해요!'
            : isGood
              ? '잘했어요! 조금만 더!'
              : '괜찮아요! 다시 도전해봐요!'}
        </p>
      </section>

      {/* 문항별 결과 */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-4">문항별 결과</h2>
        <div className="space-y-4">
          {result.results.map((r, i) => (
            <div
              key={i}
              className={`
                bg-white rounded-xl p-4 border-l-4
                ${r.correct ? 'border-green-500' : 'border-red-500'}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">문제 {i + 1}</span>
                <span className={`
                  px-3 py-1 rounded-full text-sm font-bold
                  ${r.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                `}>
                  {r.correct ? '정답' : '오답'}
                </span>
              </div>
              {!r.correct && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">내 답: </span>
                  <span className="text-red-600">{r.userAnswer || '미응답'}</span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="text-gray-500">정답: </span>
                  <span className="text-green-600">{r.correctAnswer}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Button
            variant="secondary"
            onClick={handleHome}
            className="flex-1"
          >
            홈으로
          </Button>
          <Button
            onClick={handleRetry}
            className="flex-1"
          >
            다시 풀기
          </Button>
        </div>
      </div>
    </div>
  )
}
