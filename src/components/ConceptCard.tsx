'use client'

import Link from 'next/link'
import type { Concept } from '@/lib/types'

interface ConceptCardProps {
  concept: Concept
}

export default function ConceptCard({ concept }: ConceptCardProps) {
  return (
    <Link href={`/concept/${concept.id}`}>
      <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200 touch-manipulation">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {concept.concept_title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2">
          {concept.base_explanation}
        </p>
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
