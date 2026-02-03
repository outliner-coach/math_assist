'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getConceptById, getUnitById } from '@/lib/data'
import type { Concept, Unit } from '@/lib/types'
import { Button, MathText } from '@/components'

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

  const handleStartPractice = () => {
    router.push(`/practice/${conceptId}`)
  }

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

      {/* 개념 설명 */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-700 mb-3">개념 설명</h2>
        <p className="text-gray-700 leading-relaxed">
          <MathText>{concept.base_explanation}</MathText>
        </p>
      </section>

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

      {/* 연습 시작 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleStartPractice}
            className="w-full"
            size="lg"
          >
            연습 시작 (10문항)
          </Button>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-24" />
    </div>
  )
}
