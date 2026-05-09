'use client'

import React from 'react'
import { grade1Mascots, grade1Rewards } from '@/lib/grade1-assets'
import type { Grade1Mission } from '@/lib/grade1-problems'

import GameButton from './GameButton'
import Grade1AssetImage from './Grade1AssetImage'
import MascotGuide from './MascotGuide'

interface RewardRevealProps {
  visible: boolean
  onReset: () => void
  mission?: Grade1Mission
  reviewRecommended?: boolean
}

const rewards = grade1Rewards

export default function RewardReveal({
  visible,
  onReset,
  mission,
  reviewRecommended = false,
}: RewardRevealProps) {
  if (!visible) {
    return null
  }

  const reward = mission ? rewards[mission.rewardId] : rewards.numberShard

  return (
    <section
      className="rounded-[2rem] border-2 border-[#58cc02] bg-[#f0ffe7] p-5 md:p-6"
      data-testid="reward-reveal"
    >
      <div className="grid gap-5 md:grid-cols-[280px_1fr] md:items-center">
        <MascotGuide
          asset={grade1Mascots.semoriCheer}
          eyebrow="보상 획득"
          message={
            reviewRecommended
              ? '보상을 얻었어요. 복습섬에도 저장해 둘게요.'
              : '보상이 반짝였어요. 다음 스테이지가 열렸어요!'
          }
          tone="success"
        />

        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-white bg-white p-4 shadow-[0_5px_0_#d7ffb8]">
            <Grade1AssetImage
              asset={reward}
              className="mx-auto h-28 w-28 object-contain"
              fallback={
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#ffc700] text-xl font-black text-white">
                  보상
                </div>
              }
            />
            <p className="mt-3 text-center text-lg font-black text-[#3c3c3c]">
              {reward.alt}
            </p>
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
