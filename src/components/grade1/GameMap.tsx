'use client'

import React from 'react'
import { grade1MapAssets, grade1Mascots } from '@/lib/grade1-assets'
import {
  getGrade1IslandById,
  grade1Islands,
  type Grade1Mission,
} from '@/lib/grade1-problems'
import type { Grade1Progress } from '@/lib/grade1-progress'

import Grade1AssetImage from './Grade1AssetImage'
import MascotGuide from './MascotGuide'
import StageNode, { type StageStatus } from './StageNode'

interface GameMapProps {
  missions: Grade1Mission[]
  progress: Grade1Progress
  selectedMissionId: string
  recommendedMissionId: string
  onSelectMission: (missionId: string) => void
}

function isStageUnlocked(missions: Grade1Mission[], progress: Grade1Progress, index: number): boolean {
  if (index === 0) return true
  const previousMission = missions[index - 1]
  return progress.completedStageIds.includes(previousMission.id)
}

function getStageStatus(
  missions: Grade1Mission[],
  progress: Grade1Progress,
  mission: Grade1Mission,
  index: number
): StageStatus {
  if (!isStageUnlocked(missions, progress, index)) return 'locked'
  if (progress.reviewStageIds.includes(mission.id)) return 'review'
  if (progress.completedStageIds.includes(mission.id)) return 'complete'
  return 'open'
}

export default function GameMap({
  missions,
  progress,
  selectedMissionId,
  recommendedMissionId,
  onSelectMission,
}: GameMapProps) {
  return (
    <section
      className="overflow-hidden rounded-[2rem] border-2 border-[#e5e5e5] bg-white"
      data-testid="grade1-game-map"
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="relative min-h-[320px] bg-[#ffffff]">
          <Grade1AssetImage
            asset={grade1MapAssets.adventureMap}
            className="h-full min-h-[320px] w-full object-cover"
            priority
            fallback={
              <div className="flex min-h-[320px] items-center justify-center bg-[#f0ffe7] px-6 text-center text-2xl font-black text-[#3c3c3c]">
                숫자 탐험섬 지도가 열렸어요
              </div>
            }
          />
          <div className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-[#58cc02] ring-2 ring-[#d7ffb8]">
            오늘의 길
          </div>
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 text-sm font-black leading-relaxed text-[#3c3c3c] ring-2 ring-[#e5e5e5]">
            오늘은 {progress.todaySolvedCount}개 미션을 해결했어요.
            {progress.reviewStageIds.length > 0
              ? ` 복습섬에 ${progress.reviewStageIds.length}개가 기다려요.`
              : ' 열린 길을 따라가면 새 보상이 나와요.'}
          </div>
        </div>

        <div className="space-y-4 border-t-2 border-[#e5e5e5] p-4 lg:border-l-2 lg:border-t-0">
          <MascotGuide
            asset={grade1Mascots.donggeuriCheer}
            eyebrow="숫자 탐험섬"
            message="오늘 추천 스테이지를 누르고 한 문제씩 해결해요."
            tone="success"
          />
          <div className="max-h-[620px] space-y-5 overflow-y-auto pr-1">
            {grade1Islands.map((island) => {
              const islandMissions = missions.filter((mission) => mission.islandId === island.id)
              if (islandMissions.length === 0) return null

              return (
                <div key={island.id} className="space-y-3">
                  <div>
                    <h2 className="text-lg font-black leading-tight text-[#3c3c3c]">
                      {island.title}
                    </h2>
                    <p className="text-sm font-bold text-[#777777]">{island.subtitle}</p>
                  </div>
                  <div className="grid gap-3">
                    {islandMissions.map((mission) => {
                      const index = missions.findIndex((item) => item.id === mission.id)
                      const status = getStageStatus(missions, progress, mission, index)
                      const islandLabel = getGrade1IslandById(mission.islandId)?.title ?? island.title
                      return (
                        <StageNode
                          key={mission.id}
                          stageId={mission.id}
                          index={mission.stageOrder}
                          title={`${mission.stageOrder}. ${mission.learnerGoal}`}
                          subtitle={`${islandLabel} · 난이도 ${mission.difficulty}`}
                          status={status}
                          selected={selectedMissionId === mission.id}
                          recommended={recommendedMissionId === mission.id}
                          onSelect={() => {
                            if (status !== 'locked') {
                              onSelectMission(mission.id)
                              document.getElementById('grade1-mission')?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              })
                            }
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
