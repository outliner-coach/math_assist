import { afterEach, describe, expect, it, vi } from 'vitest'

import { GRADE5_PROGRESS_KEY, GRADE6_PROGRESS_KEY } from './progress'
import { persistCompletedPractice } from './practice-completion'
import {
  GRADE5_SESSION_KEY,
  GRADE6_SESSION_KEY,
  saveSession,
} from './session'
import type { PracticeGrade, PracticeSession, Problem, SubmissionResult } from './types'

class MemoryStorage {
  data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
  removeItem(key: string) { this.data.delete(key) }
}

function completionFixture(grade: PracticeGrade): { session: PracticeSession; results: SubmissionResult[] } {
  const problem: Problem = {
    index: 0,
    templateId: grade === 6 ? 'tmpl-g6ratio-A-01' : 'tmpl-divisor-A-01',
    setId: 'A',
    params: { p: 2 },
    prompt: '문제',
    type: 'number',
    correctAnswer: '4',
    solutionSteps: ['풀이'],
  }
  const session: PracticeSession = {
    sessionId: grade === 6 ? 'grade6_session_1_test' : 'session_1_test',
    conceptId: grade === 6 ? 'g6ratio-001' : 'divisor-001',
    setId: 'A',
    mode: 'standard',
    grade: grade === 6 ? 6 : undefined,
    itemCount: grade === 6 ? 5 : undefined,
    problems: [problem],
    answers: ['4'],
    checkedAnswers: [true],
    currentIndex: 0,
    startedAt: 100,
    expiresAt: Date.now() + 10_000,
  }
  return {
    session,
    results: [{
      index: 0,
      correct: true,
      userAnswer: '4',
      correctAnswer: '4',
      solutionSteps: ['풀이'],
      problem,
    }],
  }
}

describe.each([5, 6] as const)('Grade %i completion storage boundary', (grade) => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the active session when corrupt progress blocks completion', () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    const fixture = completionFixture(grade)
    const sessionKey = grade === 6 ? GRADE6_SESSION_KEY : GRADE5_SESSION_KEY
    const progressKey = grade === 6 ? GRADE6_PROGRESS_KEY : GRADE5_PROGRESS_KEY
    expect(saveSession(fixture.session)).toBe(true)
    storage.setItem(progressKey, `{corrupt-grade-${grade}`)

    expect(persistCompletedPractice(fixture.session, fixture.results, 200)).toEqual({
      status: 'storage-blocked',
      target: 'progress',
    })
    expect(storage.getItem(progressKey)).toBe(`{corrupt-grade-${grade}`)
    expect(storage.getItem(sessionKey)).toContain(fixture.session.sessionId)
  })

  it('clears the active session only after result and progress both save', () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    const fixture = completionFixture(grade)
    const sessionKey = grade === 6 ? GRADE6_SESSION_KEY : GRADE5_SESSION_KEY
    expect(saveSession(fixture.session)).toBe(true)

    expect(persistCompletedPractice(fixture.session, fixture.results, 200).status).toBe('completed')
    expect(storage.getItem(sessionKey)).toBeNull()
  })
})
