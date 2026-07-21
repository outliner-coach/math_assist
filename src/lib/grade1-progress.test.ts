import { describe, expect, it, vi } from 'vitest'

import {
  createInitialGrade1Progress,
  dismissGrade1Intro,
  GRADE1_PROGRESS_KEY,
  loadGrade1Progress,
  recordGrade1Attempt,
  resetGrade1Progress,
  saveGrade1Progress,
  type StorageLike,
} from './grade1-progress'

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const store = new Map(Object.entries(initial))
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
  }
}

const mission = {
  id: 'count-cove-01',
  parentSummaryTag: 'counting-to-10',
}

describe('grade1 progress persistence', () => {
  it('loads and saves progress through localStorage-compatible storage', () => {
    const storage = memoryStorage()
    const progress = createInitialGrade1Progress(100)
    const next = recordGrade1Attempt(progress, mission, true, { now: 200 })

    expect(saveGrade1Progress(next, storage)).toBe(true)

    const loaded = loadGrade1Progress(storage, 300)
    expect(loaded.storageAvailable).toBe(true)
    expect(loaded.recovered).toBe(false)
    expect(loaded.progress.completedStageIds).toContain('count-cove-01')
    expect(loaded.progress.todaySolvedCount).toBe(1)
    expect(loaded.progress.introDismissedAt).toBe(null)
    expect(loaded.progress.xp).toBe(15)
    expect(loaded.progress.masteryByMissionId['count-cove-01'].correct).toBe(1)
    expect(loaded.progress.missionSketchRunOrdinal).toBe(0)
  })

  it('marks wrong and hinted-correct missions for review', () => {
    const progress = createInitialGrade1Progress(100)
    const wrong = recordGrade1Attempt(progress, mission, false, { now: 200 })
    const corrected = recordGrade1Attempt(wrong, mission, true, {
      hadHint: true,
      now: 300,
    })

    expect(corrected.completedStageIds).toContain('count-cove-01')
    expect(corrected.reviewStageIds).toContain('count-cove-01')
    expect(corrected.skillSummaryByTag['counting-to-10']).toEqual({
      attempted: 2,
      correct: 1,
    })
  })

  it('recovers from corrupt storage without throwing', () => {
    const storage = memoryStorage({ [GRADE1_PROGRESS_KEY]: '{bad json' })
    const loaded = loadGrade1Progress(storage, 100)

    expect(loaded.recovered).toBe(true)
    expect(loaded.progress.completedStageIds).toEqual([])
    expect(storage.removeItem).not.toHaveBeenCalled()
    expect(saveGrade1Progress(loaded.progress, storage)).toBe(false)
  })

  it('resets incompatible schema versions', () => {
    const storage = memoryStorage({
      [GRADE1_PROGRESS_KEY]: JSON.stringify({
        schemaVersion: 999,
        completedStageIds: ['old'],
        reviewStageIds: [],
        latestStageId: 'old',
        todaySolvedCount: 3,
        skillSummaryByTag: {},
        lastPlayedAt: 100,
      }),
    })

    const loaded = loadGrade1Progress(storage, 100)

    expect(loaded.recovered).toBe(true)
    expect(loaded.progress.completedStageIds).toEqual([])
    expect(loaded.progress.todaySolvedCount).toBe(0)
    expect(loaded.progress.introDismissedAt).toBe(null)
    expect(storage.removeItem).not.toHaveBeenCalled()
  })

  it('loads older progress without an intro dismissal field', () => {
    const storage = memoryStorage({
      [GRADE1_PROGRESS_KEY]: JSON.stringify({
        schemaVersion: 1,
        completedStageIds: ['count-cove-01'],
        reviewStageIds: [],
        latestStageId: 'count-cove-01',
        todaySolvedCount: 1,
        skillSummaryByTag: {},
        lastPlayedAt: 100,
      }),
    })

    const loaded = loadGrade1Progress(storage, 100)

    expect(loaded.recovered).toBe(false)
    expect(loaded.progress.completedStageIds).toEqual(['count-cove-01'])
    expect(loaded.progress.introDismissedAt).toBe(null)
    expect(loaded.progress.schemaVersion).toBe(2)
    expect(loaded.progress.xp).toBe(10)
    expect(loaded.progress.masteryByMissionId['count-cove-01'].correct).toBe(1)
    expect(loaded.progress.missionSketchRunOrdinal).toBe(0)
  })

  it('counts a new replay variant while blocking duplicate xp farming', () => {
    const initial = createInitialGrade1Progress(100)
    const first = recordGrade1Attempt(initial, mission, true, {
      variantKey: 'count-cove-01:day-1',
      now: 200,
    })
    const duplicate = recordGrade1Attempt(first, mission, true, {
      variantKey: 'count-cove-01:day-1',
      now: 300,
    })
    const replay = recordGrade1Attempt(duplicate, mission, true, {
      variantKey: 'count-cove-01:day-2',
      now: 400,
    })

    expect(first.xp).toBe(15)
    expect(duplicate.xp).toBe(15)
    expect(replay.xp).toBe(30)
    expect(replay.todaySolvedCount).toBe(2)
  })

  it('stores and resets the intro dismissal state', () => {
    const storage = memoryStorage()
    const dismissed = dismissGrade1Intro(createInitialGrade1Progress(100), 200)

    expect(dismissed.introDismissedAt).toBe(200)
    expect(saveGrade1Progress(dismissed, storage)).toBe(true)

    const loaded = loadGrade1Progress(storage, 250)
    expect(loaded.progress.introDismissedAt).toBe(200)

    const reset = resetGrade1Progress(storage, 300)
    expect(reset.introDismissedAt).toBe(null)
    expect(loadGrade1Progress(storage, 300).progress.introDismissedAt).toBe(null)
  })

  it('continues in memory when storage is unavailable', () => {
    const loaded = loadGrade1Progress(null, 100)

    expect(loaded.storageAvailable).toBe(false)
    expect(loaded.progress.lastPlayedAt).toBe(100)
  })
})
