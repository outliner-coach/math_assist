import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  captureAdventureReplayTime,
  captureAdventureViewTime,
  refreshAdventureProgressTime,
} from './adventure-view-time'
import { getDailyAdventureSeed } from './adventure-progression'

describe('adventure view time', () => {
  afterEach(() => vi.useRealTimers())

  it('refreshes progress evaluation and replay seed after a mounted session crosses midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 2, 23, 59))
    const mounted = captureAdventureViewTime(0, Date.now())
    const mountedSeed = getDailyAdventureSeed('grade1', mounted.seedNow, mounted.replayRound)

    vi.setSystemTime(new Date(2026, 7, 3, 0, 1))
    const progressed = refreshAdventureProgressTime(mounted, Date.now())
    expect(progressed.progressNow).toBe(Date.now())
    expect(progressed.seedNow).toBe(mounted.seedNow)

    const replayed = captureAdventureReplayTime(1, Date.now())
    expect(replayed.progressNow).toBe(Date.now())
    expect(replayed.seedNow).toBe(Date.now())
    expect(getDailyAdventureSeed('grade1', replayed.seedNow, replayed.replayRound))
      .not.toBe(mountedSeed)
  })
})
