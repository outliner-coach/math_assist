'use client'

import Link from 'next/link'
import { useState } from 'react'

import {
  GameButton,
  GameMap,
  Grade1AssetImage,
  MascotGuide,
  MissionProblemCard,
  RewardReveal,
} from '@/components/grade1'
import { grade1Mascots, grade1Objects } from '@/lib/grade1-assets'

export default function Grade1GameClient() {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const solved = selectedAnswer === 7

  const resetMission = () => {
    setSelectedAnswer(null)
    setShowHint(false)
    document.getElementById('grade1-mission')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <main className="grade1-game-surface -mx-4 -my-6 min-h-screen px-4 py-5 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="grid gap-5 rounded-[2rem] border-2 border-[#e5e5e5] bg-white p-5 md:grid-cols-[1fr_280px] md:items-center md:p-6">
          <div>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-full border-2 border-[#e5e5e5] px-4 text-sm font-black text-[#1cb0f6]"
            >
              홈으로
            </Link>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-[#58cc02]">
              1학년 게임 모드
            </p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-[#3c3c3c] md:text-5xl">
              숫자 탐험섬
            </h1>
            <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#777777]">
              보고, 세고, 눌러서 수학 미션을 해결해요. 문제를 맞히면
              섬 조각과 배지가 열려요.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <GameButton
                onClick={() =>
                  document.getElementById('grade1-mission')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
                data-testid="start-grade1-mission"
              >
                오늘 미션 시작
              </GameButton>
              <GameButton
                variant="secondary"
                onClick={() => setShowHint(true)}
              >
                힌트 먼저 보기
              </GameButton>
            </div>
          </div>

          <MascotGuide
            asset={grade1Mascots.nemoriCheer}
            eyebrow="혼자 10분"
            message="큰 버튼을 누르며 하나씩 해결하면 돼요."
            tone="success"
          />
        </header>

        <GameMap />

        <MissionProblemCard
          selectedAnswer={selectedAnswer}
          showHint={showHint}
          onAnswer={(answer) => {
            setSelectedAnswer(answer)
            if (answer !== 7) setShowHint(true)
          }}
          onShowHint={() => setShowHint(true)}
        />

        <RewardReveal visible={solved} onReset={resetMission} />

        <section className="grid gap-4 rounded-[2rem] border-2 border-[#e5e5e5] bg-white p-5 md:grid-cols-3 md:p-6">
          {[
            {
              title: '그림은 재미 담당',
              body: '캐릭터와 보상은 흥미를 만들고, 정답 판단은 코드로 만든 수학 화면이 맡아요.',
              asset: grade1Mascots.donggeuriHint,
            },
            {
              title: '큰 터치 버튼',
              body: '스테이지와 보기 버튼은 1학년 손가락으로 누르기 쉽게 크게 만들었어요.',
              asset: grade1Objects.star,
            },
            {
              title: '실패는 다시 도전',
              body: '틀리면 점수를 깎기보다 힌트를 열고 같은 미션을 다시 세어볼 수 있어요.',
              asset: grade1Mascots.donggeuriRetry,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border-2 border-[#e5e5e5] bg-[#fbfffa] p-4"
            >
              <div className="mb-3 h-16 w-16">
                <Grade1AssetImage
                  asset={item.asset}
                  className="h-full w-full object-contain"
                />
              </div>
              <h2 className="text-lg font-black text-[#3c3c3c]">{item.title}</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-[#777777]">
                {item.body}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
