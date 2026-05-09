'use client'

import React from 'react'
import { grade1MapAssets, grade1Mascots } from '@/lib/grade1-assets'

import Grade1AssetImage from './Grade1AssetImage'
import MascotGuide from './MascotGuide'
import StageNode from './StageNode'

const stages = [
  {
    title: '9까지의 수',
    subtitle: '보고, 세고, 수를 골라요',
    status: 'complete' as const,
  },
  {
    title: '덧셈과 뺄셈',
    subtitle: '사과를 합치고 덜어내요',
    status: 'open' as const,
  },
  {
    title: '모양 찾기',
    subtitle: '동그라미와 세모를 찾아요',
    status: 'review' as const,
  },
  {
    title: '시계와 규칙',
    subtitle: '바늘과 패턴을 맞춰요',
    status: 'locked' as const,
  },
]

export default function GameMap() {
  return (
    <section
      className="overflow-hidden rounded-[2rem] border-2 border-[#e5e5e5] bg-white"
      data-testid="grade1-game-map"
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="relative min-h-[320px] bg-[#ffffff]">
          <Grade1AssetImage
            asset={grade1MapAssets.adventureMap}
            className="h-full min-h-[320px] w-full object-cover"
            fallback={
              <div className="flex min-h-[320px] items-center justify-center bg-[#f0ffe7] px-6 text-center text-2xl font-black text-[#3c3c3c]">
                숫자 탐험섬 지도가 열렸어요
              </div>
            }
          />
          <div className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-[#58cc02] ring-2 ring-[#d7ffb8]">
            오늘의 길
          </div>
        </div>

        <div className="space-y-4 border-t-2 border-[#e5e5e5] p-4 lg:border-l-2 lg:border-t-0">
          <MascotGuide
            asset={grade1Mascots.donggeuriCheer}
            eyebrow="숫자 탐험섬"
            message="열린 스테이지를 눌러 오늘의 미션을 시작해요."
            tone="success"
          />
          <div className="grid gap-3">
            {stages.map((stage, index) => (
              <StageNode
                key={stage.title}
                index={index + 1}
                title={stage.title}
                subtitle={stage.subtitle}
                status={stage.status}
                onSelect={() => {
                  document.getElementById('grade1-mission')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
