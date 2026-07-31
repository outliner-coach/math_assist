import { describe, expect, it, vi } from 'vitest'

import {
  GRADE4_PROGRESS_KEY,
  advanceGrade4Activity,
  completeGrade4Activity,
  createInitialGrade4Progress,
  loadGrade4Progress,
  projectGrade4UnitCompletion,
  recordGrade4Attempt,
  resolveGrade4ActivityMode,
  resetGrade4Progress,
  saveGrade4Progress,
  selectGrade4Unit,
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

  it('starts a newly selected unit at its first item without deleting history', () => {
    const current = {
      ...createInitialGrade4Progress(100),
      selectedUnitId: 'unit-4-1-large-numbers',
      activeItemIndex: 2,
      completedVariantKeys: ['g4-big-01:seed-1'],
      reviewVariantKeys: ['g4-big-02:seed-1'],
    }

    const next = selectGrade4Unit(current, 'unit-4-1-multiplication-division', 200)

    expect(next.selectedUnitId).toBe('unit-4-1-multiplication-division')
    expect(next.activeItemIndex).toBe(0)
    expect(next.completedVariantKeys).toEqual(['g4-big-01:seed-1'])
    expect(next.reviewVariantKeys).toEqual(['g4-big-02:seed-1'])
  })

  it('defaults missing and invalid activity modes to basic while keeping practice explicit', () => {
    expect(resolveGrade4ActivityMode(undefined)).toBe('basic')
    expect(resolveGrade4ActivityMode(null)).toBe('basic')
    expect(resolveGrade4ActivityMode('unexpected')).toBe('basic')
    expect(resolveGrade4ActivityMode('basic')).toBe('basic')
    expect(resolveGrade4ActivityMode('practice')).toBe('practice')
  })

  it('loads the legacy schema without losing completion, review, reward, or recent activity fields', () => {
    const legacy = {
      schemaVersion: 1,
      completedVariantKeys: ['g4-big-02:seed-1'],
      reviewVariantKeys: ['g4-big-07:seed-1'],
      latestMissionId: 'g4-big-07',
      selectedUnitId: 'unit-4-1-large-numbers',
      activityRun: 3,
      activeItemIndex: 1,
      todaySolvedCount: 8,
      skillSummaryByTag: { '큰 수 비교': { attempted: 4, correct: 3 } },
      lastPlayedAt: 1_000,
    }
    const storage = memoryStorage({ [GRADE4_PROGRESS_KEY]: JSON.stringify(legacy) })

    const loaded = loadGrade4Progress(storage, 1_000)

    expect(loaded).toMatchObject({ recovered: false, storageAvailable: true })
    expect(loaded.progress).toMatchObject({
      ...legacy,
      selectedMode: 'basic',
      completionRecord: {
        completedBasicSetActivityIds: [],
        completedPracticeSetActivityIds: [],
      },
    })
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('preserves a malformed completion extension as corrupt Grade 4 state', () => {
    const raw = JSON.stringify({
      ...createInitialGrade4Progress(100),
      completionRecord: {
        completedBasicSetActivityIds: ['unit-4-1-large-numbers'],
        completedPracticeSetActivityIds: 'broken',
      },
    })
    const storage = memoryStorage({
      [GRADE4_PROGRESS_KEY]: raw,
      mathAssist_grade3Progress: '{"keep":true}',
    })

    const loaded = loadGrade4Progress(storage, 200)

    expect(loaded.recovered).toBe(true)
    expect(storage.values[GRADE4_PROGRESS_KEY]).toBe(raw)
    expect(storage.values.mathAssist_grade3Progress).toBe('{"keep":true}')
    expect(saveGrade4Progress(loaded.progress, storage)).toBe(false)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('records a checked basic set without newly completing the unit', () => {
    const unitId = 'unit-4-1-large-numbers'
    const variants = ['basic-k', 'basic-a', 'basic-r']
    const before = {
      ...createInitialGrade4Progress(100),
      selectedUnitId: unitId,
      selectedMode: 'basic' as const,
      completedVariantKeys: variants,
      reviewVariantKeys: ['legacy-review'],
    }

    const result = completeGrade4Activity(before, {
      unitId,
      mode: 'basic',
      variantKeys: variants,
      now: 200,
    })

    expect(result.completed).toBe(true)
    expect(result.progress.completionRecord).toEqual({
      completedBasicSetActivityIds: [unitId],
      completedPracticeSetActivityIds: [],
    })
    expect(result.progress.reviewVariantKeys).toEqual(['legacy-review'])
    expect(projectGrade4UnitCompletion(result.progress, unitId)).toMatchObject({
      hasCompletedBasicSet: true,
      hasCompletedPracticeSet: false,
      isComplete: false,
      recommendedMode: 'practice',
    })
  })

  it('completes a unit after all three practice items are checked and keeps wrong items for review', () => {
    const unitId = 'unit-4-1-large-numbers'
    const variants = ['practice-k', 'practice-a', 'practice-r']
    const before = {
      ...createInitialGrade4Progress(100),
      selectedUnitId: unitId,
      selectedMode: 'practice' as const,
      completedVariantKeys: ['practice-k', 'practice-r', 'legacy-complete'],
      reviewVariantKeys: ['practice-a', 'legacy-review'],
    }

    const result = completeGrade4Activity(before, {
      unitId,
      mode: 'practice',
      variantKeys: variants,
      now: 200,
    })

    expect(result.completed).toBe(true)
    expect(result.progress.completedVariantKeys).toContain('legacy-complete')
    expect(result.progress.reviewVariantKeys).toEqual(['practice-a', 'legacy-review'])
    expect(projectGrade4UnitCompletion(result.progress, unitId)).toMatchObject({
      hasCompletedBasicSet: false,
      hasCompletedPracticeSet: true,
      isComplete: true,
    })
  })

  it('resets only the active item when the mode changes and keeps historical progress', () => {
    const current = {
      ...createInitialGrade4Progress(100),
      selectedUnitId: 'unit-4-1-large-numbers',
      selectedMode: 'basic' as const,
      activeItemIndex: 2,
      completedVariantKeys: ['done'],
      reviewVariantKeys: ['review'],
    }

    const next = selectGrade4Unit(current, 'unit-4-1-large-numbers', 'practice', 200)

    expect(next).toMatchObject({
      selectedUnitId: 'unit-4-1-large-numbers',
      selectedMode: 'practice',
      activeItemIndex: 0,
      completedVariantKeys: ['done'],
      reviewVariantKeys: ['review'],
    })
  })
})
