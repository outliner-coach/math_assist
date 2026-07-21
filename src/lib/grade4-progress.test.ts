import { describe, expect, it, vi } from 'vitest'

import {
  GRADE4_PROGRESS_KEY,
  advanceGrade4Activity,
  createInitialGrade4Progress,
  loadGrade4Progress,
  recordGrade4Attempt,
  resetGrade4Progress,
  saveGrade4Progress,
  type Grade4ProgressStorage,
} from './grade4-progress'

function memoryStorage(initial: Record<string, string> = {}): Grade4ProgressStorage & { values: Record<string, string>; setItem: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn> } {
  return {
    values: { ...initial },
    getItem(key) { return this.values[key] ?? null },
    setItem: vi.fn(function (this: { values: Record<string, string> }, key: string, value: string) { this.values[key] = value }),
    removeItem: vi.fn(function (this: { values: Record<string, string> }, key: string) { delete this.values[key] }),
  }
}

describe('Grade 4 progress', () => {
  it('persists completed and review variants under the Grade 4 key only', () => {
    const storage = memoryStorage({ mathAssist_grade3Progress: '{"keep":true}' })
    const start = createInitialGrade4Progress(100)
    const wrong = recordGrade4Attempt(start, {
      missionId: 'g4-big-01', variantKey: 'g4-big-01:seed-1', unitId: 'unit-4-1-large-numbers', skillTag: '큰 수', correct: false, now: 200,
    })
    const correct = recordGrade4Attempt(wrong, {
      missionId: 'g4-big-01', variantKey: 'g4-big-01:seed-1', unitId: 'unit-4-1-large-numbers', skillTag: '큰 수', correct: true, now: 300,
    })

    expect(saveGrade4Progress(correct, storage)).toBe(true)
    expect(loadGrade4Progress(storage, 400).progress).toMatchObject({
      completedVariantKeys: ['g4-big-01:seed-1'],
      reviewVariantKeys: [],
      latestMissionId: 'g4-big-01',
    })
    expect(storage.values.mathAssist_grade3Progress).toBe('{"keep":true}')
    expect(storage.values[GRADE4_PROGRESS_KEY]).toBeTruthy()
  })

  it('isolates corrupt Grade 4 state without changing another grade', () => {
    const storage = memoryStorage({
      [GRADE4_PROGRESS_KEY]: '{broken',
      mathAssist_grade5Progress: '{"keep":true}',
    })

    const result = loadGrade4Progress(storage, 500)

    expect(result.recovered).toBe(true)
    expect(result.progress.completedVariantKeys).toEqual([])
    expect(storage.values[GRADE4_PROGRESS_KEY]).toBe('{broken')
    expect(storage.removeItem).not.toHaveBeenCalled()
    expect(saveGrade4Progress(result.progress, storage)).toBe(false)
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(storage.values.mathAssist_grade5Progress).toBe('{"keep":true}')
  })

  it('allows an explicit Grade 4 reset to replace only the corrupt Grade 4 payload', () => {
    const storage = memoryStorage({
      [GRADE4_PROGRESS_KEY]: '{broken',
      mathAssist_grade3Progress: '{"keep":3}',
      mathAssist_progress_v1: '{"keep":5}',
    })
    loadGrade4Progress(storage, 500)

    const reset = resetGrade4Progress(storage, 600)

    expect(reset.completedVariantKeys).toEqual([])
    expect(JSON.parse(storage.values[GRADE4_PROGRESS_KEY])).toMatchObject({ schemaVersion: 1 })
    expect(storage.values.mathAssist_grade3Progress).toBe('{"keep":3}')
    expect(storage.values.mathAssist_progress_v1).toBe('{"keep":5}')
  })

  it('starts the next three-item activity without deleting completion history', () => {
    const current = { ...createInitialGrade4Progress(100), completedVariantKeys: ['done'], activeItemIndex: 2 }
    const next = advanceGrade4Activity(current, 200)

    expect(next.activityRun).toBe(1)
    expect(next.activeItemIndex).toBe(0)
    expect(next.completedVariantKeys).toEqual(['done'])
  })
})
