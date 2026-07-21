import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildConceptProgressSummary,
  GRADE5_PROGRESS_KEY,
  GRADE6_PROGRESS_KEY,
  loadConceptProgress,
  recordConceptProgress,
  saveConceptProgressMap,
  clearConceptProgress,
} from './progress'
import type { SessionResult } from './types'

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
    expect(localStorage.getItem(GRADE5_PROGRESS_KEY)).not.toContain('g6ratio-001')
    expect(localStorage.getItem(GRADE6_PROGRESS_KEY)).not.toContain('divisor-001')
  })

  it('preserves corrupt Grade 6 progress until explicit clear', () => {
    localStorage.setItem(GRADE6_PROGRESS_KEY, '{corrupt-progress')

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
    expect(localStorage.getItem(GRADE6_PROGRESS_KEY)).toBe('{corrupt-progress')

    clearConceptProgress(6)
    expect(saveConceptProgressMap({}, 6)).toBe(true)
    expect(localStorage.getItem(GRADE6_PROGRESS_KEY)).toBe('{}')
  })

  it('preserves corrupt legacy Grade 5 progress until explicit clear', () => {
    localStorage.setItem(GRADE5_PROGRESS_KEY, '{corrupt-progress-v1')

    expect(loadConceptProgress('divisor-001', 5)).toBeNull()
    expect(recordConceptProgress(makeResult()).saved).toBe(false)
    expect(saveConceptProgressMap({}, 5)).toBe(false)
    expect(localStorage.getItem(GRADE5_PROGRESS_KEY)).toBe('{corrupt-progress-v1')

    clearConceptProgress(5)
    expect(saveConceptProgressMap({}, 5)).toBe(true)
  })
})
