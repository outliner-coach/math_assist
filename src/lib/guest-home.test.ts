import { describe, expect, it } from 'vitest'

import {
  GUEST_HOME_PREFERENCES_KEY,
  loadGuestHomeState,
  saveActiveGrade,
  type GuestHomeStorage,
} from './guest-home'

function memoryStorage(initial: Record<string, string> = {}): GuestHomeStorage & { data: Record<string, string> } {
  return {
    data: { ...initial },
    getItem(key: string) {
      return this.data[key] ?? null
    },
    setItem(key: string, value: string) {
      this.data[key] = value
    },
  }
}

describe('guest home state', () => {
  it('asks a first-time learner to choose a grade', () => {
    const state = loadGuestHomeState(memoryStorage(), 1_000)

    expect(state.activeGrade).toBeNull()
    expect(state.hasAnyProgress).toBe(false)
    expect(state.summaries[2].continueLabel).toBe('단원 고르기')
  })

  it('uses the most recently played grade when no preference exists', () => {
    const storage = memoryStorage({
      mathAssist_grade1Progress: JSON.stringify({
        completedStageIds: ['count-cove-01'],
        reviewStageIds: [],
        latestStageId: 'count-cove-01',
        todaySolvedCount: 1,
        lastPlayedAt: 200,
      }),
      mathAssist_grade2Progress: JSON.stringify({
        completedMissionIds: ['g2-1-place-value-01'],
        reviewMissionIds: ['g2-1-place-value-01'],
        latestMissionId: 'g2-1-place-value-01',
        selectedUnitId: 'g2-1-place-value',
        todaySolvedCount: 1,
        lastPlayedAt: 400,
      }),
    })

    const state = loadGuestHomeState(storage, 1_000)

    expect(state.activeGrade).toBe(2)
    expect(state.summaries[2]).toMatchObject({
      hasProgress: true,
      reviewCount: 1,
      continueHref: '/grade/2/mission?unitId=g2-1-place-value',
    })
  })

  it('preserves an explicit grade choice even when another grade is more recent', () => {
    const storage = memoryStorage({
      [GUEST_HOME_PREFERENCES_KEY]: JSON.stringify({ activeGrade: 5 }),
      mathAssist_grade1Progress: JSON.stringify({
        completedStageIds: ['count-cove-01'],
        reviewStageIds: [],
        latestStageId: 'count-cove-01',
        lastPlayedAt: 900,
      }),
    })

    expect(loadGuestHomeState(storage, 1_000).activeGrade).toBe(5)
  })

  it('prioritizes an unexpired grade 5 practice session', () => {
    const storage = memoryStorage({
      mathAssist_currentSession: JSON.stringify({
        conceptId: 'divisor-001',
        setId: 'B',
        currentIndex: 3,
        startedAt: 500,
        expiresAt: 2_000,
      }),
    })

    const summary = loadGuestHomeState(storage, 1_000).summaries[5]

    expect(summary.hasProgress).toBe(true)
    expect(summary.continueLabel).toBe('문제 이어서 풀기')
    expect(summary.continueHref).toBe('/practice/divisor-001?set=B')
  })

  it('offers the first mission after a learner selects a unit but has not solved it yet', () => {
    const storage = memoryStorage({
      mathAssist_grade2Progress: JSON.stringify({
        completedMissionIds: [],
        reviewMissionIds: [],
        latestMissionId: null,
        selectedUnitId: 'g2-1-place-value',
        todaySolvedCount: 0,
        lastPlayedAt: 500,
      }),
    })

    const summary = loadGuestHomeState(storage, 1_000).summaries[2]

    expect(summary.hasProgress).toBe(false)
    expect(summary.continueTitle).toBe('세 자리 수 첫 미션')
    expect(summary.continueLabel).toBe('첫 미션 시작')
  })

  it('saves the active grade without touching learning records', () => {
    const storage = memoryStorage({ mathAssist_grade3Progress: '{"keep":true}' })

    expect(saveActiveGrade(3, storage)).toBe(true)
    expect(JSON.parse(storage.data[GUEST_HOME_PREFERENCES_KEY])).toEqual({ activeGrade: 3 })
    expect(storage.data.mathAssist_grade3Progress).toBe('{"keep":true}')
  })
})
