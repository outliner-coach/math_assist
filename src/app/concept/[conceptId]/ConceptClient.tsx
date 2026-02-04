'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getConceptById, getUnitById } from '@/lib/data'
import type { Concept, Unit } from '@/lib/types'
import { Button, MathText, VisualAid } from '@/components'

export default function ConceptClient() {
  const params = useParams()
  const router = useRouter()
  const conceptId = params.conceptId as string

  const [concept, setConcept] = useState<Concept | null>(null)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getConceptById(conceptId)
      .then(async (conceptData) => {
        setConcept(conceptData)
        if (conceptData) {
          const unitData = await getUnitById(conceptData.unit_id)
          setUnit(unitData)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [conceptId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!concept) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">개념을 찾을 수 없습니다.</p>
        <Link href="/">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <header className="flex items-center gap-4">
        <Link href={unit ? `/unit/${unit.id}` : '/'} className="p-2 -ml-2 touch-manipulation">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          {unit && <span className="text-sm text-primary-600 font-medium">{unit.title}</span>}
          <h1 className="text-2xl font-bold text-gray-800">{concept.concept_title}</h1>
        </div>
      </header>

      {/* 친절한 설명 */}
      <section className="bg-white rounded-2xl shadow-md p-6 space-y-3">
        <h2 className="text-lg font-bold text-gray-700">친절한 설명</h2>
        <p className="text-gray-700 leading-relaxed">
          <MathText>{concept.friendly_explanation}</MathText>
        </p>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">핵심 정리</p>
          <p className="text-gray-700">
            <MathText>{concept.base_explanation}</MathText>
          </p>
        </div>
      </section>

      {/* 핵심 포인트 */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-700 mb-3">핵심 포인트</h2>
        <ul className="space-y-2">
          {concept.key_points.map((point, i) => (
            <li key={i} className="flex items-start text-gray-700">
              <span className="text-primary-600 mr-2">•</span>
              <MathText>{point}</MathText>
            </li>
          ))}
        </ul>
      </section>

      {/* 풀이 순서 */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-700 mb-3">풀이 순서</h2>
        <ol className="space-y-2">
          {concept.steps.map((step, i) => (
            <li key={i} className="flex items-start text-gray-700">
              <span className="text-gray-400 mr-2">{i + 1}.</span>
              <MathText>{step}</MathText>
            </li>
          ))}
        </ol>
      </section>

      {/* 시각 자료 */}
      {concept.visual_aids.length > 0 && (
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-3">시각 자료</h2>
          <div className="space-y-4">
            {concept.visual_aids.map((aid, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <VisualAid aid={aid} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 예시 */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-700 mb-3">예시</h2>
        <ul className="space-y-2">
          {concept.examples.map((example, i) => (
            <li key={i} className="flex items-start text-gray-700">
              <span className="text-primary-600 mr-2">•</span>
              <MathText>{example}</MathText>
            </li>
          ))}
        </ul>
      </section>

      {/* 자주 하는 실수 */}
      <section className="bg-amber-50 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-amber-800 mb-3">자주 하는 실수</h2>
        <ul className="space-y-2">
          {concept.pitfalls.map((pitfall, i) => (
            <li key={i} className="flex items-start text-amber-900">
              <span className="mr-2">•</span>
              {pitfall}
            </li>
          ))}
        </ul>
      </section>

      {/* 미니 확인 문제 */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-700 mb-3">미니 확인</h2>
        <div className="space-y-3">
          {concept.mini_checks.map((check, i) => (
            <details key={i} className="rounded-lg border border-gray-200 p-3">
              <summary className="cursor-pointer text-gray-700 font-medium">
                {check.question}
              </summary>
              <p className="mt-2 text-sm text-gray-600">
                정답: <MathText>{check.answer}</MathText>
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 연습 세트 선택 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto space-y-3">
          <p className="text-sm text-gray-600 text-center">연습 세트를 선택하세요 (각 10문항)</p>
          <div className="grid grid-cols-3 gap-3">
            {(['A', 'B', 'C'] as const).map((set) => (
              <Button
                key={set}
                onClick={() => router.push(`/practice/${conceptId}?set=${set}`)}
                className="w-full"
                size="lg"
              >
                세트 {set}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-32" />
    </div>
  )
}
