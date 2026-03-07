'use client'

import Link from 'next/link'
import type { Concept, ConceptProgressSummary } from '@/lib/types'

interface ConceptCardProps {
  concept: Concept
  progress?: ConceptProgressSummary | null
}

export default function ConceptCard({ concept, progress }: ConceptCardProps) {
  return (
    <Link href={`/concept/${concept.id}`}>
      <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200 touch-manipulation">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {concept.concept_title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2">
          {concept.friendly_explanation || concept.base_explanation}
        </p>
        {progress && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700">
              최근 {progress.latestScore}점
            </span>
            <span
              className={`rounded-full px-3 py-1 ${
                progress.needsReview
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {progress.needsReview ? '복습 추천' : '진행 양호'}
            </span>
          </div>
        )}
        <div className="mt-4 flex items-center text-primary-600 text-sm font-medium">
          학습하기
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
