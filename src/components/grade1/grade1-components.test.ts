import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import GameMap from './GameMap'
import MissionProblemCard from './MissionProblemCard'
import RewardReveal from './RewardReveal'
import { createInitialGrade1Progress, recordGrade1Attempt } from '@/lib/grade1-progress'
import { getGrade1Missions, getSafeGrade1Mission } from '@/lib/grade1-problems'

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

  it('keeps the reward reveal hidden until the mission is solved', () => {
    const mission = getSafeGrade1Mission(42)

    expect(
      renderToStaticMarkup(
        createElement(RewardReveal, {
          visible: false,
          mission,
          onReset: vi.fn(),
        })
      )
    ).toBe('')

    const html = renderToStaticMarkup(
      createElement(RewardReveal, {
        visible: true,
        mission,
        onReset: vi.fn(),
      })
    )

    expect(html).toContain('보상 획득')
    expect(html).toContain('/assets/grade1/rewards/number-shard.png')
  })
})
