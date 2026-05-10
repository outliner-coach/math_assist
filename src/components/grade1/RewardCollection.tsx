import React from 'react'

import { grade1Rewards } from '@/lib/grade1-assets'
import type { Grade1Mission, Grade1RewardId } from '@/lib/grade1-problems'

import Grade1AssetImage from './Grade1AssetImage'

export type Grade1RewardCounts = Record<Grade1RewardId, number>

export const grade1RewardOrder: Grade1RewardId[] = [
  'numberShard',
  'shapeBadge',
  'clockBadge',
  'patternRibbon',
]

const emptyRewardCounts: Grade1RewardCounts = {
  numberShard: 0,
  shapeBadge: 0,
  clockBadge: 0,
  patternRibbon: 0,
}

export function getGrade1RewardCounts(
  missions: Pick<Grade1Mission, 'id' | 'rewardId'>[],
  completedStageIds: string[]
): Grade1RewardCounts {
  const completed = new Set(completedStageIds)

  return missions.reduce<Grade1RewardCounts>(
    (counts, mission) => {
      if (!completed.has(mission.id)) return counts

      return {
        ...counts,
        [mission.rewardId]: counts[mission.rewardId] + 1,
      }
    },
    { ...emptyRewardCounts }
  )
}

interface RewardCollectionProps {
  missions: Pick<Grade1Mission, 'id' | 'rewardId'>[]
  completedStageIds: string[]
  highlightRewardId?: Grade1RewardId
}

export default function RewardCollection({
  missions,
  completedStageIds,
  highlightRewardId,
}: RewardCollectionProps) {
  const rewardCounts = getGrade1RewardCounts(missions, completedStageIds)

  return (
    <section
      className="rounded-[2rem] border-2 border-[#e5e5e5] bg-white p-5 md:p-6"
      data-testid="reward-collection"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#ffc700]">
            보물 가방
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#3c3c3c]">
            내가 모은 보상
          </h2>
        </div>
        <p className="text-sm font-bold text-[#777777]">
          미션을 열 때마다 보물이 하나씩 쌓여요.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {grade1RewardOrder.map((rewardId) => {
          const reward = grade1Rewards[rewardId]
          const count = rewardCounts[rewardId]
          const locked = count === 0
          const highlighted = highlightRewardId === rewardId && count > 0

          return (
            <div
              key={rewardId}
              className={`relative min-h-[150px] rounded-2xl border-2 bg-[#fbfffa] p-4 text-center ${
                highlighted ? 'border-[#58cc02] shadow-[0_5px_0_#d7ffb8]' : 'border-[#e5e5e5]'
              } ${locked ? 'opacity-60 grayscale' : ''}`}
              data-testid={`reward-tile-${rewardId}`}
              aria-label={`${reward.alt} ${count}개`}
            >
              {highlighted && (
                <span className="absolute right-3 top-3 rounded-full bg-[#58cc02] px-2 py-1 text-[11px] font-black text-white">
                  방금 받았어요
                </span>
              )}
              <Grade1AssetImage
                asset={reward}
                className="mx-auto h-16 w-16 object-contain"
              />
              <p className="mt-3 text-sm font-black text-[#3c3c3c]">
                {reward.alt}
              </p>
              <p
                className="mt-1 text-xl font-black text-[#1cb0f6]"
                data-testid={`reward-count-${rewardId}`}
              >
                {count}개
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
