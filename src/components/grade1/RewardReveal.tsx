'use client'

import React from 'react'
import { grade1Mascots, grade1Rewards } from '@/lib/grade1-assets'

import GameButton from './GameButton'
import Grade1AssetImage from './Grade1AssetImage'
import MascotGuide from './MascotGuide'

interface RewardRevealProps {
  visible: boolean
  onReset: () => void
}

const rewards = [
  grade1Rewards.numberShard,
  grade1Rewards.shapeBadge,
  grade1Rewards.clockBadge,
]

export default function RewardReveal({ visible, onReset }: RewardRevealProps) {
  if (!visible) {
    return null
  }

  return (
    <section
      className="rounded-[2rem] border-2 border-[#58cc02] bg-[#f0ffe7] p-5 md:p-6"
      data-testid="reward-reveal"
    >
      <div className="grid gap-5 md:grid-cols-[280px_1fr] md:items-center">
        <MascotGuide
          asset={grade1Mascots.semoriCheer}
          eyebrow="보상 획득"
          message="숫자 조각이 반짝였어요. 다음 스테이지가 열렸어요!"
          tone="success"
        />

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {rewards.map((reward) => (
              <div
                key={reward.src}
                className="rounded-2xl border-2 border-white bg-white p-3 shadow-[0_5px_0_#d7ffb8]"
              >
                <Grade1AssetImage
                  asset={reward}
                  className="mx-auto h-24 w-24 object-contain"
                  fallback={
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#ffc700] text-xl font-black text-white">
                      별
                    </div>
                  }
                />
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <GameButton className="w-full" onClick={onReset}>
              다시 풀기
            </GameButton>
            <GameButton
              className="w-full"
              variant="secondary"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              지도로 가기
            </GameButton>
          </div>
        </div>
      </div>
    </section>
  )
}
