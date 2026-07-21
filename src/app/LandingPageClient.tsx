'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { loadGuestHomeState } from '@/lib/guest-home'

function MascotPreview() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  return (
    <div className="relative mx-auto w-full max-w-[560px]" data-testid="landing-mascot-lineup">
      <div className="absolute inset-x-10 bottom-2 h-28 rounded-full bg-[#d7ffb8] opacity-70 blur-3xl" aria-hidden="true" />
      <Image
        src={`${basePath}/assets/mascots/lineup.png`}
        alt="수달 수리, 부엉이 모아, 여우 루미가 함께 인사하는 모습"
        width={1400}
        height={676}
        priority
        className="relative w-full object-contain drop-shadow-[0_24px_32px_rgba(15,23,42,0.14)]"
      />
      <div className="relative -mt-3 flex justify-center gap-2 text-xs font-black text-[#475569] sm:gap-4 sm:text-sm">
        <span className="rounded-full bg-[#ecfdf5] px-3 py-2">수리 · 탐험</span>
        <span className="rounded-full bg-[#eff6ff] px-3 py-2">모아 · 전략</span>
        <span className="rounded-full bg-[#fff7ed] px-3 py-2">루미 · 도전</span>
      </div>
    </div>
  )
}

export default function LandingPageClient() {
  const [returning, setReturning] = useState(false)

  useEffect(() => {
    const state = loadGuestHomeState()
    setReturning(state.hasAnyProgress || state.activeGrade !== null)
  }, [])

  return (
    <main className="-mx-4 -my-6 min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f7fff1_0%,#ffffff_50%,#eff6ff_100%)] px-4 py-5 md:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="flex min-h-[60px] items-center justify-between" aria-label="주요 메뉴">
          <Link href="/" className="inline-flex items-center gap-3 text-[#3c3c3c]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#58cc02] text-2xl font-black text-white shadow-[0_4px_0_#3f8f01]">+</span>
            <span className="text-xl font-black tracking-tight">수학 연습장</span>
          </Link>
          <Link
            href="/home"
            className="inline-flex min-h-[46px] items-center rounded-full border-2 border-[#d8e3ef] bg-white px-5 text-sm font-black text-[#2563eb] transition hover:border-[#2563eb]"
          >
            학습 홈
          </Link>
        </nav>

        <section className="grid min-h-[620px] items-center gap-8 py-10 md:grid-cols-[1.05fr_0.95fr] md:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-[#166534] shadow-sm ring-2 ring-[#d7ffb8]">
              가입 없이 바로 시작해요
            </span>
            <h1 className="mt-6 text-5xl font-black leading-[1.08] tracking-[-0.045em] text-[#0f172a] md:text-6xl">
              수학을 한 문제씩,
              <span className="block text-[#2563eb]">내 속도로.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-bold leading-8 text-[#64748b] md:text-xl">
              1·2·3·4·5·6학년 수학을 그림으로 이해하고, 짧은 미션과 연습문제로 바로 확인해요.
              틀려도 힌트를 보고 다시 도전할 수 있어요.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/home"
                data-testid="landing-primary-action"
                className="inline-flex min-h-[60px] items-center justify-center rounded-2xl bg-[#58cc02] px-8 py-4 text-lg font-black text-white shadow-[0_6px_0_#3f8f01] transition hover:bg-[#61d90a] active:translate-y-1 active:shadow-[0_2px_0_#3f8f01]"
              >
                {returning ? '이어서 학습하기' : '학습 시작하기'}
              </Link>
              <p className="px-2 text-sm font-bold text-[#64748b]">학습 기록은 이 기기에 자동 저장돼요.</p>
            </div>
          </div>

          <MascotPreview />
        </section>

        <section className="grid gap-4 pb-14 md:grid-cols-3" aria-label="학습 특징">
          {[
            ['그림으로 이해해요', '수와 도형을 눈으로 확인하며 개념을 익혀요.', '◫', '#eff6ff', '#2563eb'],
            ['바로 확인해요', '한 문제씩 풀고 정답과 풀이를 바로 확인해요.', '✓', '#dcfce7', '#166534'],
            ['틀려도 괜찮아요', '점수를 깎기보다 힌트와 복습으로 다시 도전해요.', '↻', '#fff7e6', '#9a3412'],
          ].map(([title, body, icon, background, color]) => (
            <article key={title} className="rounded-[2rem] border-2 border-white bg-white/90 p-6 shadow-sm">
              <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl font-black" style={{ background, color }}>{icon}</span>
              <h2 className="mt-5 text-xl font-black text-[#0f172a]">{title}</h2>
              <p className="mt-2 font-bold leading-7 text-[#64748b]">{body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
