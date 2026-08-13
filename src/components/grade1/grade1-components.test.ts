import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import GameMap from './GameMap'
import MissionProblemCard from './MissionProblemCard'
import RewardCollection from './RewardCollection'
import RewardReveal from './RewardReveal'
import Grade1MissionVisual from './Grade1MissionVisual'
import { createInitialGrade1Progress, recordGrade1Attempt } from '@/lib/grade1-progress'
import { getGrade1MissionById, getGrade1Missions, getSafeGrade1Mission } from '@/lib/grade1-problems'

describe('grade 1 game components', () => {
  it('renders a child-friendly map with stage states', () => {
    const missions = getGrade1Missions(42)
    const progress = recordGrade1Attempt(
      createInitialGrade1Progress(100),
      missions[0],
      true,
      { now: 200 }
    )
    const html = renderToStaticMarkup(
      createElement(GameMap, {
        missions,
        progress,
        selectedMissionId: missions[0].id,
        recommendedMissionId: missions[1].id,
        onSelectMission: vi.fn(),
      })
    )

    expect(html).toContain('숫자 탐험섬')
    expect(html).toContain('수 세기 만')
    expect(html).toContain('순서 다리')
    expect(html).toContain('오늘 추천')
    expect(html).toContain('기본 7문제 · 먼저 추천')
    expect(html).toContain('연습 7문제 · 완주하면 섬 완료')
    expect(html).toContain('data-testid="grade1-basic-count-cove"')
    expect(html).toContain('data-testid="grade1-practice-count-cove"')
    expect(html).not.toContain('disabled=""')
    expect(html).toContain('/assets/grade1/map/adventure-map.png')
  })

  it('renders a deterministic counting mission and hint state', () => {
    const mission = getSafeGrade1Mission(42)
    const html = renderToStaticMarkup(
      createElement(MissionProblemCard, {
        mission,
        selectedAnswer: '6',
        numberAnswer: '',
        showHint: true,
        wrongAttemptCount: 1,
        onAnswer: vi.fn(),
        onNumberAnswerChange: vi.fn(),
        onShowHint: vi.fn(),
      })
    )

    expect(html).toContain('사과는 모두 몇 개일까요?')
    expect(html).toContain('위 줄에는 5개')
    expect(html).toContain('grade1-choice-7')
    expect(html).toContain('/assets/grade1/objects/apple.png')
  })

  it('does not expose a clock answer or target highlight before success', () => {
    const clockMission = getGrade1MissionById('clock-tower-01', 42)
    const hiddenClock = renderToStaticMarkup(
      createElement(Grade1MissionVisual, { mission: clockMission })
    )
    const comparisonMission = getGrade1MissionById('order-bridge-01', 42)
    const hiddenComparison = renderToStaticMarkup(
      createElement(Grade1MissionVisual, { mission: comparisonMission, emphasize: true })
    )

    expect(hiddenClock).toContain('aria-label="시각을 읽는 아날로그 시계"')
    expect(hiddenClock).not.toContain(`${clockMission.correctAnswer} 시계`)
    expect(hiddenComparison).not.toContain('border-[#58cc02]')
  })

  it('uses the source-owned 10-column structure for the two 20-slot counting missions', () => {
    for (const missionId of ['count-cove-04', 'count-cove-09']) {
      const mission = getGrade1MissionById(missionId, 42)
      const html = renderToStaticMarkup(createElement(Grade1MissionVisual, { mission }))

      expect(mission.visualConfig.columns).toBe(10)
      expect(html).toContain('grid-template-columns:repeat(10, minmax(0, 1fr))')
      expect(html.match(/data-testid="grade1-counting-slot"/g)).toHaveLength(20)
    }
  })

  it('keeps the reward reveal hidden until the mission is solved', () => {
    const mission = getSafeGrade1Mission(42)

    expect(
      renderToStaticMarkup(
        createElement(RewardReveal, {
          visible: false,
          mission,
          onReset: vi.fn(),
          onOpenMap: vi.fn(),
        })
      )
    ).toBe('')

    const missions = getGrade1Missions(42)
    const html = renderToStaticMarkup(
      createElement(RewardReveal, {
        visible: true,
        mission,
        nextMission: missions[1],
        rewardCount: 1,
        onReset: vi.fn(),
        onNextMission: vi.fn(),
        onOpenMap: vi.fn(),
      })
    )

    expect(html).toContain('보상 획득')
    expect(html).toContain('/assets/grade1/rewards/number-shard.png')
    expect(html).toContain('숫자 조각 보상, 이제 1개예요.')
    expect(html).toContain('다음 미션 풀기')
    expect(html).toContain('2. 10보다 큰 수를 세어요')
  })

  it('shows collected reward counts without duplicating incomplete rewards', () => {
    const missions = getGrade1Missions(42)
    const html = renderToStaticMarkup(
      createElement(RewardCollection, {
        missions,
        completedStageIds: [missions[0].id, missions[1].id],
        highlightRewardId: 'numberShard',
      })
    )

    expect(html).toContain('보물 가방')
    expect(html).toContain('aria-label="숫자 조각 보상 2개"')
    expect(html).toContain('aria-label="도형 배지 보상 0개"')
    expect(html).toContain('data-testid="reward-count-numberShard"')
    expect(html).toContain('방금 받았어요')
  })
})
