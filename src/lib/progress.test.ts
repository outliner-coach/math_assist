import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildConceptProgressSummary,
  GRADE5_PROGRESS_KEY,
  GRADE6_PROGRESS_KEY,
  loadConceptProgress,
  projectConceptProgressCompletion,
  recordConceptProgress,
  saveConceptProgressMap,
  clearConceptProgress,
} from './progress'
import { LOCAL_PROFILE_REGISTRY_KEY, createInitialLocalProfileRegistry } from './local-profile'
import { getActiveProfileId } from './profile-bootstrap'
import type { SessionResult } from './types'

const BOOTSTRAP_UUID_A = '00000000-0000-4000-8000-000000000001'
const BOOTSTRAP_PROFILE_A = `local_${BOOTSTRAP_UUID_A}`

function scopedProgressKey(legacyKey: string): string {
  return `mathAssist_profile_v1:${getActiveProfileId()}:${legacyKey}`
}

class MemoryStorage {
  private store = new Map<string, string>()

  clear() {
    this.store.clear()
  }

  getItem(key: string) {
    return this.store.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  setItem(key: string, value: string) {
    this.store.set(key, value)
  }

  get length() {
    return this.store.size
  }
}

function makeResult(overrides: Partial<SessionResult> = {}): SessionResult {
  return {
    sessionId: 'session-1',
    conceptId: 'divisor-001',
    setId: 'A',
    mode: 'standard',
    score: 6,
    total: 10,
    wrongCount: 4,
    results: [],
    completedAt: 100,
    ...overrides
  }
}

describe('progress_v1', () => {
  beforeEach(() => {
    const storage = new MemoryStorage()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage as unknown as Storage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('aggregates attempt count, best score, and review state', () => {
    const first = buildConceptProgressSummary(null, makeResult())
    const second = buildConceptProgressSummary(
      first,
      makeResult({
        sessionId: 'session-2',
        mode: 'retry-wrong',
        score: 2,
        total: 2,
        wrongCount: 0,
        completedAt: 200
      })
    )

    expect(first).toMatchObject({
      attemptCount: 1,
      bestScore: 60,
      latestScore: 60,
      needsReview: true,
      lastMode: 'standard'
    })
    expect(second).toMatchObject({
      attemptCount: 2,
      bestScore: 100,
      latestScore: 100,
      needsReview: false,
      lastMode: 'retry-wrong'
    })
  })

  it('records and reloads concept summaries from progress_v1 storage', () => {
    expect(recordConceptProgress(makeResult()).saved).toBe(true)

    expect(loadConceptProgress('divisor-001')).toMatchObject({
      conceptId: 'divisor-001',
      latestScore: 60,
      attemptCount: 1,
      needsReview: true
    })
  })

  it('records Grade 6 progress without changing the legacy Grade 5 namespace', () => {
    expect(recordConceptProgress(makeResult()).saved).toBe(true)
    expect(recordConceptProgress(makeResult({
      sessionId: 'grade6-session',
      conceptId: 'g6ratio-001',
      grade: 6,
      itemCount: 5,
      score: 4,
      total: 5,
      wrongCount: 1,
    })).saved).toBe(true)

    expect(loadConceptProgress('divisor-001', 5)?.latestScore).toBe(60)
    expect(loadConceptProgress('g6ratio-001', 6)?.latestScore).toBe(80)
    expect(localStorage.getItem(GRADE5_PROGRESS_KEY)).toBeNull()
    expect(localStorage.getItem(GRADE6_PROGRESS_KEY)).toBeNull()
  })

  it('persists basic and practice completion evidence without treating basic as complete', () => {
    const basic = buildConceptProgressSummary(null, makeResult({
      grade: 6,
      itemCount: 5,
      conceptId: 'g6ratio-001',
      total: 5,
      score: 4,
    }))
    const practice = buildConceptProgressSummary(basic, makeResult({
      sessionId: 'session-2',
      grade: 6,
      itemCount: 10,
      conceptId: 'g6ratio-001',
      completedAt: 200,
    }))

    expect(basic.completionRecord).toEqual({
      completedBasicSetActivityIds: ['g6ratio-001'],
      completedPracticeSetActivityIds: [],
    })
    expect(basic.legacyCompleted).toBe(false)
    expect(projectConceptProgressCompletion(basic)).toEqual({
      hasCompletedBasicSet: true,
      hasCompletedPracticeSet: false,
      isComplete: false,
      recommendedMode: 'practice',
    })
    expect(projectConceptProgressCompletion(practice)).toEqual({
      hasCompletedBasicSet: true,
      hasCompletedPracticeSet: true,
      isComplete: true,
      recommendedMode: 'practice',
    })
  })

  it('keeps a stored pre-evidence concept complete as legacy history', () => {
    const legacy = buildConceptProgressSummary(null, makeResult())
    const { completionRecord: _completionRecord, legacyCompleted: _legacyCompleted, ...legacyShape } = legacy
    localStorage.setItem(GRADE5_PROGRESS_KEY, JSON.stringify({ 'divisor-001': legacyShape }))

    const loaded = loadConceptProgress('divisor-001')

    expect(loaded).not.toBeNull()
    expect(projectConceptProgressCompletion(loaded!)).toEqual({
      hasCompletedBasicSet: false,
      hasCompletedPracticeSet: false,
      isComplete: true,
      recommendedMode: 'basic',
    })
  })

  it('preserves corrupt Grade 6 progress and stays fail-closed until the record is repaired', () => {
    loadConceptProgress('g6ratio-001', 6)
    localStorage.setItem(scopedProgressKey(GRADE6_PROGRESS_KEY), '{corrupt-progress')

    expect(loadConceptProgress('g6ratio-001', 6)).toBeNull()
    expect(recordConceptProgress(makeResult({
      conceptId: 'g6ratio-001',
      grade: 6,
      itemCount: 5,
    })).saved).toBe(false)
    expect(saveConceptProgressMap({
      'g6ratio-001': buildConceptProgressSummary(null, makeResult({
        conceptId: 'g6ratio-001',
        grade: 6,
        itemCount: 5,
      })),
    }, 6)).toBe(false)
    expect(localStorage.getItem(scopedProgressKey(GRADE6_PROGRESS_KEY))).toBe('{corrupt-progress')

    localStorage.setItem(scopedProgressKey(GRADE6_PROGRESS_KEY), '{}')
    clearConceptProgress(6)
    expect(saveConceptProgressMap({}, 6)).toBe(true)
  })

  it('preserves corrupt Grade 5 progress and stays fail-closed until the record is repaired', () => {
    loadConceptProgress('divisor-001', 5)
    localStorage.setItem(scopedProgressKey(GRADE5_PROGRESS_KEY), '{corrupt-progress-v1')

    expect(loadConceptProgress('divisor-001', 5)).toBeNull()
    expect(recordConceptProgress(makeResult()).saved).toBe(false)
    expect(saveConceptProgressMap({}, 5)).toBe(false)
    expect(localStorage.getItem(scopedProgressKey(GRADE5_PROGRESS_KEY))).toBe('{corrupt-progress-v1')

    localStorage.setItem(scopedProgressKey(GRADE5_PROGRESS_KEY), '{}')
    clearConceptProgress(5)
    expect(saveConceptProgressMap({}, 5)).toBe(true)
  })

  it('(a) lands concept progress writes at the profile-scoped key and leaves the legacy raw key untouched', () => {
    localStorage.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(createInitialLocalProfileRegistry({
      now: () => 1,
      randomUUID: () => BOOTSTRAP_UUID_A,
      migrationStatus: 'not-needed',
    })))

    expect(recordConceptProgress(makeResult()).saved).toBe(true)

    expect(localStorage.getItem(`mathAssist_profile_v1:${BOOTSTRAP_PROFILE_A}:${GRADE5_PROGRESS_KEY}`))
      .toContain('divisor-001')
    expect(localStorage.getItem(GRADE5_PROGRESS_KEY)).toBeNull()
  })

  it('(b) isolates Grade 5 and Grade 6 progress maps across profiles A and B', () => {
    localStorage.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(createInitialLocalProfileRegistry({
      now: () => 1,
      randomUUID: () => BOOTSTRAP_UUID_A,
      migrationStatus: 'not-needed',
    })))
    expect(recordConceptProgress(makeResult()).saved).toBe(true)
    expect(recordConceptProgress(makeResult({
      sessionId: 'grade6-session',
      conceptId: 'g6ratio-001',
      grade: 6,
      itemCount: 5,
      score: 4,
      total: 5,
      wrongCount: 1,
    })).saved).toBe(true)

    const registry = JSON.parse(localStorage.getItem(LOCAL_PROFILE_REGISTRY_KEY) ?? '{}')
    registry.activeProfileId = 'local_00000000-0000-4000-8000-000000000002'
    registry.profiles.push({
      profileId: 'local_00000000-0000-4000-8000-000000000002',
      nickname: null,
      createdAt: 2,
      updatedAt: 2,
    })
    localStorage.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(registry))

    expect(loadConceptProgress('divisor-001', 5)).toBeNull()
    expect(loadConceptProgress('g6ratio-001', 6)).toBeNull()

    expect(recordConceptProgress(makeResult({ conceptId: 'g6ratio-001', grade: 6, score: 5, total: 5, wrongCount: 0 })).saved).toBe(true)
    expect(localStorage.getItem(`mathAssist_profile_v1:local_00000000-0000-4000-8000-000000000002:${GRADE6_PROGRESS_KEY}`))
      .toContain('g6ratio-001')
    expect(localStorage.getItem(`mathAssist_profile_v1:${BOOTSTRAP_PROFILE_A}:${GRADE6_PROGRESS_KEY}`))
      .not.toContain('"attemptCount":2')
  })
})
