import { describe, expect, it } from 'vitest'

import {
  GUEST_HOME_PREFERENCES_KEY,
  loadGuestHomeState,
  saveActiveGrade,
  type GuestHomeStorage,
} from './guest-home'
import { createLocalProgressRepository } from './local-progress-repository'

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

  it('offers Grade 4 Bridge and resumes the selected large-number unit', () => {
    const storage = memoryStorage({
      [GUEST_HOME_PREFERENCES_KEY]: JSON.stringify({ activeGrade: 4 }),
      mathAssist_grade4Progress: JSON.stringify({
        schemaVersion: 1,
        completedVariantKeys: ['g4-big-02:seed-20260721:variant-8'],
        reviewVariantKeys: ['g4-big-02:seed-20260721:variant-8'],
        latestMissionId: 'g4-big-02',
        selectedUnitId: 'unit-4-1-large-numbers',
        activityRun: 0,
        activeItemIndex: 1,
        todaySolvedCount: 1,
        skillSummaryByTag: {},
        lastPlayedAt: 700,
      }),
    })

    const state = loadGuestHomeState(storage, 1_000)

    expect(state.activeGrade).toBe(4)
    expect(state.summaries[4]).toMatchObject({
      hasProgress: true,
      completedCount: 1,
      reviewCount: 1,
      todaySolvedCount: 1,
      continueTitle: '큰 수 활동 이어하기',
      continueHref: '/grade/4/mission?unitId=unit-4-1-large-numbers',
      continueLabel: '활동 이어서 하기',
    })
  })

  it('offers released Grade 6 Study and resumes an isolated five-item session', () => {
    const storage = memoryStorage({
      [GUEST_HOME_PREFERENCES_KEY]: JSON.stringify({ activeGrade: 6 }),
      mathAssist_grade6Progress: JSON.stringify({
        'g6ratio-001': {
          conceptId: 'g6ratio-001',
          attemptCount: 1,
          bestScore: 80,
          latestScore: 80,
          lastCompletedAt: 700,
          needsReview: true,
          lastMode: 'standard',
        },
      }),
      mathAssist_grade6CurrentSession: JSON.stringify({
        sessionId: 'grade6_session_800_home',
        conceptId: 'g6ratio-001',
        setId: 'B',
        mode: 'standard',
        grade: 6,
        itemCount: 5,
        problems: [{ index: 0, templateId: 'tmpl-g6ratio-B-01', type: 'number', prompt: '문제' }],
        answers: [null],
        checkedAnswers: [null],
        currentIndex: 0,
        startedAt: 800,
        expiresAt: 2_000,
      }),
    })

    const state = loadGuestHomeState(storage, 1_000)

    expect(state.activeGrade).toBe(6)
    expect(state.summaries[6]).toMatchObject({
      hasProgress: true,
      completedCount: 1,
      reviewCount: 1,
      continueTitle: '풀던 5문제를 이어가요',
      continueHref: '/practice/g6ratio-001?set=B&count=5',
      continueLabel: '문제 이어서 풀기',
    })
  })

  it('ignores corrupt Grade 4 progress without changing other grade payloads', () => {
    const storage = memoryStorage({
      mathAssist_grade1Progress: '{"completedStageIds":["g1-safe"],"reviewStageIds":[],"latestStageId":"g1-safe","lastPlayedAt":500}',
      mathAssist_grade4Progress: '{bad json',
      mathAssist_progress_v1: '{"g5-safe":{"conceptId":"g5-safe","lastCompletedAt":400,"needsReview":false}}',
    })
    const before = { ...storage.data }

    const state = loadGuestHomeState(storage, 1_000)

    expect(state.summaries[4]).toMatchObject({ hasProgress: false, completedCount: 0, reviewCount: 0 })
    expect(state.summaries[1].completedCount).toBe(1)
    expect(state.summaries[5].completedCount).toBe(1)
    expect(storage.data).toEqual(before)
  })

  it('prioritizes an unexpired grade 5 practice session', () => {
    const storage = memoryStorage({
      mathAssist_currentSession: JSON.stringify({
        sessionId: 'active-grade5-session',
        conceptId: 'divisor-001',
        setId: 'B',
        problems: [{ index: 0, templateId: 'divisor-item-1', type: 'number', prompt: '문제' }],
        answers: [null],
        currentIndex: 0,
        startedAt: 500,
        expiresAt: 2_000,
      }),
    })

    const summary = loadGuestHomeState(storage, 1_000).summaries[5]

    expect(summary.hasProgress).toBe(true)
    expect(summary.continueLabel).toBe('문제 이어서 풀기')
    expect(summary.continueHref).toBe('/practice/divisor-001?set=B')
  })

  it('does not offer a malformed Grade 5 session as resumable learning', () => {
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

    expect(summary.hasProgress).toBe(false)
    expect(summary.continueHref).toBe('/grade/5')
  })

  it('uses the common projection for completion, review, and recent activity without rewriting legacy keys', () => {
    const storage = memoryStorage({
      mathAssist_grade1Progress: JSON.stringify({
        completedStageIds: ['g1-a'],
        reviewStageIds: ['g1-b'],
        latestStageId: 'g1-b',
        todaySolvedCount: 2,
        lastPlayedAt: 100,
      }),
      mathAssist_grade2Progress: JSON.stringify({
        completedMissionIds: ['g2-a'],
        reviewMissionIds: [],
        latestMissionId: 'g2-a',
        selectedUnitId: 'g2-1-place-value',
        todaySolvedCount: 1,
        lastPlayedAt: 200,
      }),
      mathAssist_grade3Progress: JSON.stringify({
        completedMissionIds: ['g3-a'],
        reviewMissionIds: ['g3-a'],
        latestMissionId: 'g3-a',
        selectedUnitId: 'g3-1-multiplication-division',
        todaySolvedCount: 3,
        lastPlayedAt: 300,
      }),
      mathAssist_progress_v1: JSON.stringify({
        'g5-a': {
          conceptId: 'g5-a',
          needsReview: true,
          lastCompletedAt: 400,
        },
      }),
    })
    const before = { ...storage.data }
    const home = loadGuestHomeState(storage, 1_000)
    const projections = createLocalProgressRepository(storage).readAllProgress(1_000)

    for (const grade of [1, 2, 3, 4, 5, 6] as const) {
      expect(home.summaries[grade].completedCount).toBe(projections[grade].completed.length)
      expect(home.summaries[grade].reviewCount).toBe(projections[grade].review.length)
      expect(home.summaries[grade].lastPlayedAt).toBe(projections[grade].lastActivityAt)
    }
    expect(storage.data).toEqual(before)
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
