import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import GameMap from './GameMap'
import MissionProblemCard from './MissionProblemCard'
import RewardReveal from './RewardReveal'

describe('grade 1 game components', () => {
  it('renders a child-friendly map with stage states', () => {
    const html = renderToStaticMarkup(createElement(GameMap))

    expect(html).toContain('숫자 탐험섬')
    expect(html).toContain('9까지의 수')
    expect(html).toContain('덧셈과 뺄셈')
    expect(html).toContain('복습 추천')
    expect(html).toContain('/assets/grade1/map/adventure-map.png')
  })

  it('renders a deterministic counting mission and hint state', () => {
    const html = renderToStaticMarkup(
      createElement(MissionProblemCard, {
        selectedAnswer: 6,
        showHint: true,
        onAnswer: vi.fn(),
        onShowHint: vi.fn(),
      })
    )

    expect(html).toContain('사과는 모두 몇 개일까요?')
    expect(html).toContain('위 줄에는 5개')
    expect(html).toContain('grade1-choice-7')
    expect(html).toContain('/assets/grade1/objects/apple.png')
  })

  it('keeps the reward reveal hidden until the mission is solved', () => {
    expect(
      renderToStaticMarkup(
        createElement(RewardReveal, {
          visible: false,
          onReset: vi.fn(),
        })
      )
    ).toBe('')

    const html = renderToStaticMarkup(
      createElement(RewardReveal, {
        visible: true,
        onReset: vi.fn(),
      })
    )

    expect(html).toContain('보상 획득')
    expect(html).toContain('/assets/grade1/rewards/number-shard.png')
  })
})
