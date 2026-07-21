'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getUnitById, getConceptsByUnit } from '@/lib/data'
import { loadConceptProgressMap } from '@/lib/progress'
import { isCurriculumGradeReleased } from '@/lib/grade-release'
import type { Unit, Concept, ConceptProgressMap } from '@/lib/types'
import { ConceptCard, Button, GradeReleaseBlocked } from '@/components'

export default function UnitClient() {
  const params = useParams()
  const unitId = params.unitId as string

  const [unit, setUnit] = useState<Unit | null>(null)
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [progressMap, setProgressMap] = useState<ConceptProgressMap>({})
  const [loading, setLoading] = useState(true)
  const [releaseBlocked, setReleaseBlocked] = useState(false)

  useEffect(() => {
    const loadReleasedUnit = async () => {
      try {
        const unitData = await getUnitById(unitId)
        if (unitData?.grade === 6 && !await isCurriculumGradeReleased(6)) {
          setReleaseBlocked(true)
          return
        }
        const conceptsData = await getConceptsByUnit(unitId)
        setUnit(unitData)
        setConcepts(conceptsData)
        setProgressMap(loadConceptProgressMap(unitData?.grade === 6 ? 6 : 5))
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    void loadReleasedUnit()
  }, [unitId])

  if (releaseBlocked) return <GradeReleaseBlocked grade={6} />

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!unit) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">단원을 찾을 수 없습니다.</p>
        <Link href="/home">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <header className="flex items-center gap-4">
        <Link href={`/grade/${unit.grade === 6 ? 6 : 5}`} aria-label="학년 단원으로 돌아가기" className="-ml-2 inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full touch-manipulation">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <span className="text-sm text-primary-600 font-medium">{unit.semester}</span>
          <h1 className="text-2xl font-bold text-gray-800">{unit.title}</h1>
        </div>
      </header>

      {/* 개념 목록 */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-4">
          개념 선택 ({concepts.length}개)
        </h2>
        <div className="grid gap-4">
          {concepts.map(concept => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              progress={progressMap[concept.id] ?? null}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
