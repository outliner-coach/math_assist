import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildConceptProgressSummary,
  loadConceptProgress,
  recordConceptProgress
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
    recordConceptProgress(makeResult())

    expect(loadConceptProgress('divisor-001')).toMatchObject({
      conceptId: 'divisor-001',
      latestScore: 60,
      attemptCount: 1,
      needsReview: true
    })
  })
})
