import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { createAdventureMastery } from '@/lib/adventure-progression'
import AdventureProgressPanel from './AdventureProgressPanel'

describe('AdventureProgressPanel', () => {
  it('shows level, daily goal, streak, stars, and unlocked achievements', () => {
    const mastery = {
      ...createAdventureMastery(),
      attempted: 3,
      correct: 3,
      firstTryCorrect: 2,
      hintlessCorrect: 2,
      spacedReviewCorrect: 1,
    }
    const html = renderToStaticMarkup(createElement(AdventureProgressPanel, {
      progress: {
        xp: 125,
        todaySolvedCount: 8,
        learningDates: ['2026-07-16', '2026-07-17', '2026-07-18'],
        solvedVariantKeys: ['a:1', 'a:2'],
        masteryByMissionId: { a: mastery },
      },
      totalMissionCount: 10,
      now: Date.UTC(2026, 6, 18),
    }))

    expect(html).toContain('레벨 2 탐험가')
    expect(html).toContain('8/8')
    expect(html).toContain('3일')
    expect(html).toContain('3/30')
    expect(html).toContain('오늘의 보물 획득')
  })
})
