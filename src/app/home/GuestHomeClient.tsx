'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { getUnits } from '@/lib/data'
import {
  loadGuestHomeState,
  saveActiveGrade,
  SUPPORTED_GRADES,
  type GuestHomeState,
  type SupportedGrade,
} from '@/lib/guest-home'
import { grade2Units } from '@/lib/grade2-problems'
import { grade3Units } from '@/lib/grade3-problems'
import { grade4Units } from '@/lib/grade4-problems'
import type { Unit } from '@/lib/types'

const gradeStyles: Record<SupportedGrade, {
  accent: string
  border: string
  pale: string
  shadow: string
  name: string
  symbol: string
}> = {
  1: { accent: '#58cc02', border: '#d7ffb8', pale: '#f0ffe7', shadow: '#3f8f01', name: '1학년', symbol: '●' },
  2: { accent: '#2563eb', border: '#bfdbfe', pale: '#eff6ff', shadow: '#1e40af', name: '2학년', symbol: '◆' },
  3: { accent: '#0f766e', border: '#99f6e4', pale: '#f0fdfa', shadow: '#115e59', name: '3학년', symbol: '▲' },
  4: { accent: '#4f46e5', border: '#c7d2fe', pale: '#eef2ff', shadow: '#3730a3', name: '4학년', symbol: '■' },
  5: { accent: '#7c3aed', border: '#ddd6fe', pale: '#f5f3ff', shadow: '#5b21b6', name: '5학년', symbol: '✦' },
  6: { accent: '#0369a1', border: '#bae6fd', pale: '#f0f9ff', shadow: '#075985', name: '6학년', symbol: '✺' },
}

function GradePicker({ onSelect }: { onSelect: (grade: SupportedGrade) => void }) {
  return (
    <section className="mx-auto max-w-4xl py-8 text-center" data-testid="grade-picker">
      <span className="inline-flex rounded-full bg-[#d7ffb8] px-4 py-2 text-sm font-black text-[#166534]">처음 오셨나요?</span>
      <h1 className="mt-5 text-4xl font-black tracking-tight text-[#0f172a] md:text-5xl">어느 학년 수학을 공부할까요?</h1>
      <p className="mt-4 text-lg font-bold text-[#64748b]">가입하지 않아도 괜찮아요. 학년은 나중에 언제든 바꿀 수 있어요.</p>
      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {SUPPORTED_GRADES.map((grade) => {
          const style = gradeStyles[grade]
          return (
            <button
              key={grade}
              type="button"
              onClick={() => onSelect(grade)}
              data-testid={`choose-grade-${grade}`}
              className="group min-h-[170px] rounded-[2rem] border-2 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: style.border }}
            >
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl text-3xl font-black" style={{ backgroundColor: style.pale, color: style.accent }}>
                {style.symbol}
              </span>
              <span className="mt-4 block text-2xl font-black text-[#0f172a]">{style.name}</span>
              <span className="mt-1 block text-sm font-bold" style={{ color: style.accent }}>선택하기</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function LearningLinks({ grade, grade5Units }: { grade: SupportedGrade; grade5Units: Unit[] }) {
  const links = useMemo(() => {
    if (grade === 1) {
      return [
        { title: '숫자 탐험 지도', body: '열린 길과 다음 미션을 확인해요.', href: '/grade/1', badge: '96개 미션' },
        { title: '다시 도전하기', body: '힌트를 본 문제를 탐험 지도에서 다시 풀어요.', href: '/grade/1', badge: '복습' },
        { title: '보상 모음 보기', body: '미션에서 모은 별과 탐험 보상을 확인해요.', href: '/grade/1', badge: '보상' },
      ]
    }
    if (grade === 2) {
      return grade2Units.slice(0, 4).map((unit) => ({
        title: unit.title,
        body: unit.subtitle,
        href: `/grade/2/mission?unitId=${unit.id}`,
        badge: unit.semester,
      }))
    }
    if (grade === 3) {
      return grade3Units.slice(0, 4).map((unit) => ({
        title: unit.title,
        body: unit.subtitle,
        href: `/grade/3/mission?unitId=${unit.id}`,
        badge: unit.semester,
      }))
    }
    if (grade === 4) {
      return grade4Units.map((unit) => ({
        title: unit.title,
        body: unit.subtitle,
        href: `/grade/4/mission?unitId=${unit.id}`,
        badge: `${unit.semester} · Bridge`,
      }))
    }
    return grade5Units.filter((unit) => unit.grade === grade).slice(0, 4).map((unit) => ({
      title: unit.title,
      body: unit.description ?? '개념을 읽고 10문제로 연습해요.',
      href: `/unit/${unit.id}`,
      badge: unit.semester,
    }))
  }, [grade, grade5Units])

  const allHref = grade === 1 ? '/grade/1' : `/grade/${grade}`
  const style = gradeStyles[grade]

  return (
    <section className="rounded-[2rem] border-2 border-[#e2e8f0] bg-white p-5 md:p-7" data-testid="home-learning-links">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black" style={{ color: style.accent }}>학습 둘러보기</p>
          <h2 className="mt-1 text-2xl font-black text-[#0f172a]">{style.name}에서 공부할 것</h2>
        </div>
        <Link href={allHref} className="font-black" style={{ color: style.accent }}>
          전체 보기 →
        </Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {links.map((item) => (
          <Link
            key={`${item.href}-${item.title}`}
            href={item.href}
            className="rounded-2xl border-2 border-[#e2e8f0] p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: style.pale, color: style.accent }}>{item.badge}</span>
            <h3 className="mt-3 text-xl font-black text-[#0f172a]">{item.title}</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-[#64748b]">{item.body}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function GuestHomeClient() {
  const [homeState, setHomeState] = useState<GuestHomeState | null>(null)
  const [showGradePicker, setShowGradePicker] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [grade5Units, setGrade5Units] = useState<Unit[]>([])

  useEffect(() => {
    setHomeState(loadGuestHomeState())
    getUnits().then(setGrade5Units).catch(() => setGrade5Units([]))
  }, [])

  const chooseGrade = (grade: SupportedGrade) => {
    const saved = saveActiveGrade(grade)
    setStorageAvailable(saved)
    setHomeState((current) => current ? { ...current, activeGrade: grade } : loadGuestHomeState())
    setShowGradePicker(false)
  }

  if (!homeState) {
    return (
      <main className="-mx-4 -my-6 grid min-h-screen place-items-center bg-[#f8fafc] px-4" data-testid="home-loading">
        <p className="font-bold text-[#64748b]">학습 기록을 불러오는 중...</p>
      </main>
    )
  }

  const activeGrade = homeState.activeGrade

  return (
    <main className="-mx-4 -my-6 min-h-screen bg-[#f8fafc] px-4 py-5 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex min-h-[64px] items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 text-[#0f172a]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#58cc02] text-2xl font-black text-white shadow-[0_4px_0_#3f8f01]">+</span>
            <span className="hidden text-xl font-black sm:inline">수학 연습장</span>
          </Link>
          {activeGrade !== null && (
            <button
              type="button"
              onClick={() => setShowGradePicker((current) => !current)}
              data-testid="change-grade"
              className="inline-flex min-h-[48px] items-center gap-3 rounded-full border-2 bg-white px-5 text-base font-black shadow-sm"
              style={{ borderColor: gradeStyles[activeGrade].border, color: gradeStyles[activeGrade].accent }}
            >
              <span>{gradeStyles[activeGrade].symbol}</span>
              {gradeStyles[activeGrade].name}
              <span aria-hidden="true">⌄</span>
            </button>
          )}
        </header>

        {(activeGrade === null || showGradePicker) ? (
          <GradePicker onSelect={chooseGrade} />
        ) : (
          <>
            {(() => {
              const summary = homeState.summaries[activeGrade]
              const style = gradeStyles[activeGrade]
              return (
                <>
                  <section
                    className="overflow-hidden rounded-[2.25rem] border-2 bg-white shadow-sm"
                    style={{ borderColor: style.border }}
                    data-testid="home-continue-card"
                  >
                    <div className="grid md:grid-cols-[1fr_270px]">
                      <div className="p-6 md:p-8">
                        <p className="text-sm font-black" style={{ color: style.accent }}>
                          {summary.hasProgress ? '다시 만났네요!' : '오늘의 첫걸음'}
                        </p>
                        <h1 className="mt-3 text-3xl font-black leading-tight text-[#0f172a] md:text-4xl">{summary.continueTitle}</h1>
                        <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-[#64748b]">{summary.continueDescription}</p>
                        <Link
                          href={summary.continueHref}
                          data-testid="home-primary-action"
                          className="mt-6 inline-flex min-h-[58px] items-center justify-center rounded-2xl px-7 py-4 text-lg font-black text-white transition active:translate-y-1"
                          style={{ backgroundColor: style.accent, boxShadow: `0 6px 0 ${style.shadow}` }}
                        >
                          {summary.continueLabel}
                        </Link>
                        <p className="mt-4 text-sm font-bold text-[#94a3b8]">이 기기에 자동 저장돼요.</p>
                      </div>
                      <div className="grid min-h-[210px] place-items-center p-6" style={{ backgroundColor: style.pale }} aria-hidden="true">
                        <div className="text-center">
                          <span className="mx-auto grid h-28 w-28 place-items-center rounded-[2rem] bg-white text-6xl font-black shadow-sm" style={{ color: style.accent }}>{style.symbol}</span>
                          <p className="mt-4 text-lg font-black" style={{ color: style.accent }}>{style.name} 수학</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {summary.hasProgress ? (
                    <section className="grid gap-4 md:grid-cols-3" data-testid="home-progress-summary">
                      <article className="rounded-2xl border-2 border-[#e2e8f0] bg-white p-5">
                        <p className="text-sm font-black text-[#64748b]">완료한 학습</p>
                        <p className="mt-2 text-3xl font-black text-[#0f172a]">{summary.completedCount}개</p>
                      </article>
                      <article className="rounded-2xl border-2 border-[#fed7aa] bg-[#fff7e6] p-5">
                        <p className="text-sm font-black text-[#9a3412]">다시 볼 학습</p>
                        <p className="mt-2 text-3xl font-black text-[#0f172a]">{summary.reviewCount}개</p>
                      </article>
                      <article className="rounded-2xl border-2 border-[#d7ffb8] bg-[#f0ffe7] p-5">
                        <p className="text-sm font-black text-[#166534]">{summary.todaySolvedCount === null ? '저장 위치' : '오늘 해결'}</p>
                        <p className="mt-2 text-3xl font-black text-[#0f172a]">{summary.todaySolvedCount === null ? '이 기기' : `${summary.todaySolvedCount}개`}</p>
                      </article>
                    </section>
                  ) : (
                    <section className="rounded-2xl border-2 border-[#dbeafe] bg-[#eff6ff] p-5 text-center" data-testid="home-first-step-note">
                      <p className="font-black text-[#1e40af]">첫 학습을 마치면 여기에 완료 기록과 복습할 문제가 보여요.</p>
                    </section>
                  )}

                  {!storageAvailable && (
                    <section className="rounded-2xl border-2 border-[#fecaca] bg-[#fef2f2] p-4 text-sm font-black text-[#991b1b]" data-testid="home-storage-warning">
                      이 브라우저에서는 학년 선택을 저장하지 못했어요. 학습은 계속할 수 있지만 다시 방문하면 학년을 다시 골라야 할 수 있어요.
                    </section>
                  )}

                  <LearningLinks grade={activeGrade} grade5Units={grade5Units} />

                  <section className="rounded-[2rem] border-2 border-dashed border-[#cbd5e1] bg-white p-5 md:flex md:items-center md:justify-between md:p-6">
                    <div>
                      <h2 className="text-lg font-black text-[#0f172a]">로그인 없이 사용하는 학습 홈</h2>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#64748b]">학습 기록은 현재 브라우저에 저장돼요. 브라우저 데이터를 지우거나 다른 기기를 사용하면 기록이 이어지지 않을 수 있어요.</p>
                    </div>
                    <button type="button" onClick={() => setShowGradePicker(true)} className="mt-4 min-h-[46px] rounded-xl border-2 border-[#d8e3ef] px-5 font-black text-[#475569] md:mt-0">
                      학년 바꾸기
                    </button>
                  </section>
                </>
              )
            })()}
          </>
        )}
      </div>
    </main>
  )
}
