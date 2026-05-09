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
  onOpenMap: () => void
  mission?: Grade1Mission
  nextMission?: Pick<Grade1Mission, 'stageOrder' | 'learnerGoal'>
  onNextMission?: () => void
  reviewRecommended?: boolean
}

const rewards = grade1Rewards

export default function RewardReveal({
  visible,
  onReset,
  onOpenMap,
  mission,
  nextMission,
  onNextMission,
  reviewRecommended = false,
}: RewardRevealProps) {
  if (!visible) {
    return null
  }

  const reward = mission ? rewards[mission.rewardId] : rewards.numberShard
  const hasNextMission = Boolean(nextMission && onNextMission)
  const rewardMessage = hasNextMission
    ? reviewRecommended
      ? '복습섬에도 저장했고, 다음 길도 바로 갈 수 있어요.'
      : '보상이 반짝였어요. 다음 스테이지로 바로 이어가요!'
    : '모든 길을 열었어요. 원하는 미션을 다시 풀 수 있어요.'

  return (
    <section
      className="rounded-[2rem] border-2 border-[#58cc02] bg-[#f0ffe7] p-5 md:p-6"
      data-testid="reward-reveal"
    >
      <div className="grid gap-5 md:grid-cols-[280px_1fr] md:items-center">
        <MascotGuide
          asset={grade1Mascots.semoriCheer}
          eyebrow="보상 획득"
          message={rewardMessage}
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

          {hasNextMission && nextMission && (
            <div
              className="rounded-2xl border-2 border-[#1cb0f6] bg-white p-4 text-center"
              data-testid="next-grade1-mission-panel"
            >
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#1cb0f6]">
                다음 길
              </p>
              <p className="mt-1 text-lg font-black leading-tight text-[#3c3c3c]">
                {nextMission.stageOrder}. {nextMission.learnerGoal}
              </p>
            </div>
          )}

          <div className={`grid gap-3 ${hasNextMission ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {hasNextMission && (
              <GameButton
                className="w-full"
                onClick={onNextMission}
                data-testid="next-grade1-mission"
              >
                다음 미션 풀기
              </GameButton>
            )}
            <GameButton
              className="w-full"
              variant={hasNextMission ? 'secondary' : 'primary'}
              onClick={onReset}
            >
              다시 풀기
            </GameButton>
            <GameButton
              className="w-full"
              variant="quiet"
              onClick={onOpenMap}
              data-testid="open-grade1-map"
            >
              지도 보기
            </GameButton>
          </div>
        </div>
      </div>
    </section>
  )
}
