import { describe, expect, it } from 'vitest'

import {
  createAdventureState,
  getAdventureAchievements,
  getAdventureLevel,
  getAdventureVariantKey,
  getDailyAdventureSeed,
  getLearningStreak,
  getMasteryStars,
  recordAdventureAttempt,
} from './adventure-progression'

describe('adventure progression', () => {
  it('creates stable daily seeds and distinct replay variants', () => {
    const morning = new Date(2026, 6, 18, 1).getTime()
    const evening = new Date(2026, 6, 18, 22).getTime()

    expect(getDailyAdventureSeed('grade1', morning)).toBe(getDailyAdventureSeed('grade1', evening))
    expect(getDailyAdventureSeed('grade1', morning)).not.toBe(getDailyAdventureSeed('grade2', morning))
    expect(getDailyAdventureSeed('grade1', morning, 1)).not.toBe(getDailyAdventureSeed('grade1', morning, 0))
    expect(getAdventureVariantKey('mission-1', 42)).toBe('mission-1:42')
    expect(getAdventureVariantKey('mission-1', 'same rendered problem'))
      .toBe(getAdventureVariantKey('mission-1', 'same rendered problem'))
    expect(getAdventureVariantKey('mission-1', 'same rendered problem'))
      .not.toBe(getAdventureVariantKey('mission-1', 'different rendered problem'))
  })

  it('changes daily seeds at the learner device local midnight', () => {
    const beforeMidnight = new Date(2026, 6, 18, 23, 59).getTime()
    const afterMidnight = new Date(2026, 6, 19, 0, 1).getTime()

    expect(getDailyAdventureSeed('grade1', beforeMidnight))
      .not.toBe(getDailyAdventureSeed('grade1', afterMidnight))
  })

  it('awards xp once per concrete variant without punishing hint use', () => {
    const initial = createAdventureState()
    const hinted = recordAdventureAttempt(initial, 'mission-1', true, {
      variantKey: 'mission-1:1',
      hadHint: true,
      wrongAttempts: 1,
      now: Date.UTC(2026, 6, 18),
    })
    const duplicate = recordAdventureAttempt(hinted, 'mission-1', true, {
      variantKey: 'mission-1:1',
      now: Date.UTC(2026, 6, 18, 1),
    })
    const firstTry = recordAdventureAttempt(duplicate, 'mission-1', true, {
      variantKey: 'mission-1:2',
      now: Date.UTC(2026, 6, 18, 2),
    })

    expect(hinted.xp).toBe(10)
    expect(duplicate.xp).toBe(10)
    expect(firstTry.xp).toBe(25)
    expect(firstTry.solvedVariantKeys).toEqual(['mission-1:1', 'mission-1:2'])
    expect(firstTry.masteryByMissionId['mission-1']).toMatchObject({ correct: 2, firstTryCorrect: 1 })
  })

  it('turns a due spaced review into the third mastery star', () => {
    const day = 24 * 60 * 60 * 1000
    const first = recordAdventureAttempt(createAdventureState(), 'mission-1', true, {
      variantKey: 'mission-1:1',
      now: Date.UTC(2026, 6, 18),
    })
    const review = recordAdventureAttempt(first, 'mission-1', true, {
      variantKey: 'mission-1:2',
      now: Date.UTC(2026, 6, 18) + day,
    })

    expect(getMasteryStars(first.masteryByMissionId['mission-1'])).toBe(2)
    expect(review.masteryByMissionId['mission-1'].spacedReviewCorrect).toBe(1)
    expect(getMasteryStars(review.masteryByMissionId['mission-1'])).toBe(3)
    expect(review.xp).toBe(35)
  })

  it('tracks a gentle streak ending today or yesterday', () => {
    const now = Date.UTC(2026, 6, 18, 12)
    expect(getLearningStreak(['2026-07-15', '2026-07-16', '2026-07-17'], now)).toBe(3)
    expect(getLearningStreak(['2026-07-16', '2026-07-17', '2026-07-18'], now)).toBe(3)
    expect(getLearningStreak(['2026-07-15', '2026-07-17'], now)).toBe(1)
  })

  it('derives levels and positive achievements from progress', () => {
    const mastery = {
      attempted: 3,
      correct: 3,
      firstTryCorrect: 2,
      hintlessCorrect: 2,
      spacedReviewCorrect: 1,
      lastSolvedAt: Date.UTC(2026, 6, 18),
      nextReviewAt: Date.UTC(2026, 6, 25),
    }

    expect(getAdventureLevel(0)).toBe(1)
    expect(getAdventureLevel(205)).toBe(3)
    expect(getAdventureAchievements({
      xp: 205,
      todaySolvedCount: 8,
      learningDates: ['2026-07-16', '2026-07-17', '2026-07-18'],
      masteryByMissionId: { a: mastery, b: mastery, c: mastery, d: mastery },
    }, Date.UTC(2026, 6, 18))).toEqual(expect.arrayContaining([
      'first-step',
      'level-2',
      'daily-treasure',
      'three-day-journey',
      'mastery-collector',
    ]))
  })
})
