'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Grade1AssetImage } from '@/components/grade1'
import { getUnits } from '@/lib/data'
import { grade1MapAssets, grade1Mascots } from '@/lib/grade1-assets'
import type { Unit } from '@/lib/types'
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
        <div className="mt-4">
          <Link
            href="/review/problems"
            className="inline-flex min-h-[40px] items-center rounded-full border-2 border-primary-600 px-4 py-2 text-sm font-medium text-primary-600 transition hover:bg-primary-50"
          >
            문제 검수 보드
          </Link>
        </div>
      </header>

      <section className="overflow-hidden rounded-[2rem] border-2 border-[#e5e5e5] bg-white shadow-sm">
        <div className="grid gap-0 md:grid-cols-[1fr_260px]">
          <div className="p-6 md:p-8">
            <span className="inline-flex rounded-full bg-[#d7ffb8] px-4 py-2 text-sm font-black text-[#3c3c3c]">
              Beta
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight text-[#3c3c3c]">
              1학년 숫자 탐험섬
            </h2>
            <p className="mt-3 max-w-xl text-gray-600">
              60개 미션을 큰 버튼과 보상 그래픽으로 하나씩 풀어요.
            </p>
            <Link
              href="/grade/1"
              className="mt-5 inline-flex min-h-[56px] items-center rounded-xl bg-[#58cc02] px-6 py-3 text-base font-black text-white shadow-[0_5px_0_#3f8f01] transition hover:bg-[#61d90a] active:translate-y-[3px] active:shadow-[0_2px_0_#3f8f01]"
              data-testid="grade1-entry-link"
            >
              탐험 시작
            </Link>
          </div>
          <div className="relative min-h-[220px] bg-[#f0ffe7]">
            <Grade1AssetImage
              asset={grade1MapAssets.semester1Island}
              className="h-full min-h-[220px] w-full object-cover"
            />
            <Grade1AssetImage
              asset={grade1Mascots.donggeuriCheer}
              className="absolute bottom-3 left-3 h-24 w-24 object-contain"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border-2 border-[#d8e3ef] bg-white shadow-sm">
        <div className="grid gap-0 md:grid-cols-[1fr_260px]">
          <div className="p-6 md:p-8">
            <span className="inline-flex rounded-full bg-[#ffedd5] px-4 py-2 text-sm font-black text-[#9a3412]">
              Beta
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight text-[#0f172a]">
              2학년 탐험섬
            </h2>
            <p className="mt-3 max-w-xl text-gray-600">
              단원을 고르고 72개 자리값, 길이, 시각, 표와 그래프 미션을 한 문제씩 풀어요.
            </p>
            <Link
              href="/grade/2"
              className="mt-5 inline-flex min-h-[56px] items-center rounded-xl bg-[#2563eb] px-6 py-3 text-base font-black text-white shadow-[0_5px_0_#1e40af] transition hover:bg-[#1d4ed8] active:translate-y-[3px] active:shadow-[0_2px_0_#1e40af]"
              data-testid="grade2-entry-link"
            >
              단원 고르기
            </Link>
          </div>
          <div className="grid min-h-[220px] place-items-center bg-[#eff6ff] p-6">
            <div className="grid grid-cols-2 gap-3">
              {['342', '1m', '3:25', '표'].map((item) => (
                <div
                  key={item}
                  className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-white bg-white text-2xl font-black text-[#2563eb] shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border-2 border-[#ccfbf1] bg-white shadow-sm">
        <div className="grid gap-0 md:grid-cols-[1fr_260px]">
          <div className="p-6 md:p-8">
            <span className="inline-flex rounded-full bg-[#ccfbf1] px-4 py-2 text-sm font-black text-[#0f766e]">
              Alpha
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight text-[#0f172a]">
              3학년 탐험섬
            </h2>
            <p className="mt-3 max-w-xl text-gray-600">
              도형, 분수, 측정, 그래프를 조작형 발판과 구조화 입력으로 풀어요.
            </p>
            <Link
              href="/grade/3"
              className="mt-5 inline-flex min-h-[56px] items-center rounded-xl bg-[#0f766e] px-6 py-3 text-base font-black text-white shadow-[0_5px_0_#115e59] transition hover:bg-[#0d9488] active:translate-y-[3px] active:shadow-[0_2px_0_#115e59]"
              data-testid="grade3-entry-link"
            >
              단원 고르기
            </Link>
          </div>
          <div className="grid min-h-[220px] place-items-center bg-[#f0fdfa] p-6">
            <div className="grid grid-cols-2 gap-3">
              {['2/5', '120도', '4cm', '그래프'].map((item) => (
                <div
                  key={item}
                  className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-white bg-white text-xl font-black text-[#0f766e] shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
