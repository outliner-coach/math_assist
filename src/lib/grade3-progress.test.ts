import { describe, expect, it } from 'vitest'

import { getSafeGrade3Mission } from './grade3-problems'
import {
  GRADE3_PROGRESS_KEY,
  createInitialGrade3Progress,
  dismissGrade3Intro,
  loadGrade3Progress,
  recordGrade3Attempt,
  resetGrade3Progress,
  saveGrade3Progress,
  selectGrade3Unit,
  type StorageLike,
} from './grade3-progress'

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

describe('grade3 progress', () => {
  it('loads initial progress in a separate grade3 storage namespace', () => {
    const storage = createMemoryStorage()
    const result = loadGrade3Progress(storage, 100)

    expect(result.progress.completedMissionIds).toEqual([])
    expect(result.progress.selectedUnitId).toBeNull()
    expect(storage.getItem('mathAssist_grade2Progress')).toBeNull()
  })

  it('saves and reloads grade3 progress', () => {
    const storage = createMemoryStorage()
    const mission = getSafeGrade3Mission(42)
    const progress = recordGrade3Attempt(createInitialGrade3Progress(100), mission, true, { now: 200 })

    expect(saveGrade3Progress(progress, storage)).toBe(true)
    const loaded = loadGrade3Progress(storage, 300)

    expect(loaded.progress.completedMissionIds).toContain(mission.id)
    expect(loaded.progress.todaySolvedCount).toBe(1)
    expect(loaded.progress.selectedUnitId).toBe(mission.unitId)
  })

  it('tracks wrong answers for review but input errors can be skipped by callers', () => {
    const mission = getSafeGrade3Mission(42)
    const wrong = recordGrade3Attempt(createInitialGrade3Progress(100), mission, false, { now: 200 })
    const correct = recordGrade3Attempt(wrong, mission, true, { hadHint: true, now: 300 })

    expect(wrong.reviewMissionIds).toContain(mission.id)
    expect(wrong.todaySolvedCount).toBe(0)
    expect(correct.reviewMissionIds).toContain(mission.id)
    expect(correct.todaySolvedCount).toBe(1)
  })

  it('tracks selected unit and intro dismissal', () => {
    const progress = createInitialGrade3Progress(100)
    const selected = selectGrade3Unit(progress, 'g3-2-graph', 200)
    const dismissed = dismissGrade3Intro(selected, 300)

    expect(selected.selectedUnitId).toBe('g3-2-graph')
    expect(dismissed.introDismissedAt).toBe(300)
  })

  it('recovers corrupt progress without touching other grade storage', () => {
    const storage = createMemoryStorage({
      [GRADE3_PROGRESS_KEY]: '{bad json',
      mathAssist_grade1Progress: '{"keep":1}',
      mathAssist_grade2Progress: '{"keep":2}',
    })
    const result = loadGrade3Progress(storage, 100)

    expect(result.recovered).toBe(true)
    expect(result.progress.completedMissionIds).toEqual([])
    expect(storage.getItem(GRADE3_PROGRESS_KEY)).toBeNull()
    expect(storage.getItem('mathAssist_grade1Progress')).toBe('{"keep":1}')
    expect(storage.getItem('mathAssist_grade2Progress')).toBe('{"keep":2}')
  })

  it('resets grade3 progress only', () => {
    const storage = createMemoryStorage({ mathAssist_grade2Progress: '{"keep":true}' })
    const progress = resetGrade3Progress(storage, 100)

    expect(progress.todaySolvedCount).toBe(0)
    expect(storage.getItem(GRADE3_PROGRESS_KEY)).toContain('"schemaVersion":1')
    expect(storage.getItem('mathAssist_grade2Progress')).toBe('{"keep":true}')
  })
})
