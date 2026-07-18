import { describe, expect, it } from 'vitest'

import { getSafeGrade2Mission } from './grade2-problems'
import {
  GRADE2_PROGRESS_KEY,
  createInitialGrade2Progress,
  dismissGrade2Intro,
  loadGrade2Progress,
  recordGrade2Attempt,
  resetGrade2Progress,
  saveGrade2Progress,
  selectGrade2Unit,
  type StorageLike,
} from './grade2-progress'

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  return {
    data: { ...initial },
    getItem(key: string) {
      return this.data[key] ?? null
    },
    setItem(key: string, value: string) {
      this.data[key] = value
    },
    removeItem(key: string) {
      delete this.data[key]
    },
  }
}

describe('grade2 progress', () => {
  it('loads initial progress in a separate grade2 storage namespace', () => {
    const storage = createMemoryStorage()
    const result = loadGrade2Progress(storage, 100)

    expect(result.progress.completedMissionIds).toEqual([])
    expect(result.progress.selectedUnitId).toBeNull()
    expect(storage.getItem('mathAssist_grade1Progress')).toBeNull()
  })

  it('saves and reloads grade2 progress', () => {
    const storage = createMemoryStorage()
    const mission = getSafeGrade2Mission(42)
    const progress = recordGrade2Attempt(createInitialGrade2Progress(100), mission, true, {
      now: 200,
    })

    expect(saveGrade2Progress(progress, storage)).toBe(true)
    const loaded = loadGrade2Progress(storage, 300)

    expect(loaded.progress.completedMissionIds).toContain(mission.id)
    expect(loaded.progress.todaySolvedCount).toBe(1)
    expect(loaded.progress.selectedUnitId).toBe(mission.unitId)
    expect(loaded.progress.xp).toBe(15)
  })

  it('marks wrong answers for review and avoids duplicate solved counts', () => {
    const mission = getSafeGrade2Mission(42)
    const wrong = recordGrade2Attempt(createInitialGrade2Progress(100), mission, false, {
      now: 200,
    })
    const correct = recordGrade2Attempt(wrong, mission, true, {
      hadHint: true,
      now: 300,
    })
    const duplicate = recordGrade2Attempt(correct, mission, true, {
      countSolved: false,
      now: 400,
    })

    expect(correct.reviewMissionIds).toContain(mission.id)
    expect(duplicate.todaySolvedCount).toBe(1)
    expect(duplicate.completedMissionIds).toEqual([mission.id])
  })

  it('tracks selected unit and intro dismissal', () => {
    const progress = createInitialGrade2Progress(100)
    const selected = selectGrade2Unit(progress, 'g2-2-time', 200)
    const dismissed = dismissGrade2Intro(selected, 300)

    expect(selected.selectedUnitId).toBe('g2-2-time')
    expect(dismissed.introDismissedAt).toBe(300)
  })

  it('recovers corrupt progress without touching grade1 storage', () => {
    const storage = createMemoryStorage({
      [GRADE2_PROGRESS_KEY]: '{bad json',
      mathAssist_grade1Progress: '{"keep":true}',
    })
    const result = loadGrade2Progress(storage, 100)

    expect(result.recovered).toBe(true)
    expect(result.progress.completedMissionIds).toEqual([])
    expect(storage.getItem(GRADE2_PROGRESS_KEY)).toBeNull()
    expect(storage.getItem('mathAssist_grade1Progress')).toBe('{"keep":true}')
  })

  it('resets grade2 progress only', () => {
    const storage = createMemoryStorage({ mathAssist_grade1Progress: '{"keep":true}' })
    const progress = resetGrade2Progress(storage, 100)

    expect(progress.todaySolvedCount).toBe(0)
    expect(storage.getItem(GRADE2_PROGRESS_KEY)).toContain('"schemaVersion":2')
    expect(storage.getItem('mathAssist_grade1Progress')).toBe('{"keep":true}')
  })

  it('migrates v1 completion into mastery and preserves the selected unit', () => {
    const storage = createMemoryStorage({
      [GRADE2_PROGRESS_KEY]: JSON.stringify({
        schemaVersion: 1,
        completedMissionIds: ['g2-1-place-value-01'],
        reviewMissionIds: [],
        latestMissionId: 'g2-1-place-value-01',
        selectedUnitId: 'g2-1-place-value',
        todaySolvedCount: 1,
        skillSummaryByTag: {},
        introDismissedAt: 50,
        lastPlayedAt: 100,
      }),
    })

    const loaded = loadGrade2Progress(storage, 100)

    expect(loaded.recovered).toBe(false)
    expect(loaded.progress.schemaVersion).toBe(2)
    expect(loaded.progress.selectedUnitId).toBe('g2-1-place-value')
    expect(loaded.progress.xp).toBe(10)
    expect(loaded.progress.masteryByMissionId['g2-1-place-value-01'].correct).toBe(1)
  })
})
