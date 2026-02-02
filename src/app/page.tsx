'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getUnits } from '@/lib/data'
import type { Unit } from '@/lib/types'
import { Button } from '@/components'

export default function HomePage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUnits()
      .then(setUnits)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <header className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          수학 연습장
        </h1>
        <p className="text-gray-600">
          초등학교 5학년 수학 개념을 배우고 연습해요
        </p>
      </header>

      {/* 단원 목록 */}
      <section>
        <h2 className="text-xl font-bold text-gray-700 mb-4">단원 선택</h2>
        <div className="grid gap-4">
          {units.map(unit => (
            <Link key={unit.id} href={`/unit/${unit.id}`}>
              <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200 touch-manipulation">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-primary-600 font-medium">
                      {unit.semester}
                    </span>
                    <h3 className="text-xl font-bold text-gray-800 mt-1">
                      {unit.title}
                    </h3>
                    {unit.description && (
                      <p className="text-gray-600 text-sm mt-2">
                        {unit.description}
                      </p>
                    )}
                  </div>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
