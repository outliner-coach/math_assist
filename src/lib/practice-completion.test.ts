import { afterEach, describe, expect, it, vi } from 'vitest'

import { GRADE5_PROGRESS_KEY, GRADE6_PROGRESS_KEY } from './progress'
import {
  derivePracticeSetCompletion,
  persistCompletedPractice,
} from './practice-completion'
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

function completionFixture(
  grade: PracticeGrade,
  itemCount: 5 | 10 = grade === 6 ? 5 : 10,
): { session: PracticeSession; results: SubmissionResult[] } {
  const problems: Problem[] = Array.from({ length: itemCount }, (_, index) => ({
    index,
    templateId: grade === 6 ? `tmpl-g6ratio-A-${index + 1}` : `tmpl-divisor-A-${index + 1}`,
    setId: 'A',
    params: { p: index + 2 },
    prompt: `문제 ${index + 1}`,
    type: 'number',
    correctAnswer: '4',
    solutionSteps: ['풀이'],
  }))
  const session: PracticeSession = {
    sessionId: grade === 6 ? 'grade6_session_1_test' : 'session_1_test',
    conceptId: grade === 6 ? 'g6ratio-001' : 'divisor-001',
    setId: 'A',
    mode: 'standard',
    grade: grade === 6 ? 6 : undefined,
    itemCount: grade === 6 ? itemCount : undefined,
    problems,
    answers: problems.map(() => '4'),
    checkedAnswers: problems.map(() => true),
    currentIndex: 0,
    startedAt: 100,
    expiresAt: Date.now() + 10_000,
  }
  return {
    session,
    results: problems.map((problem) => ({
      index: problem.index,
      correct: problem.index !== 1,
      userAnswer: problem.index === 1 ? '3' : '4',
      correctAnswer: '4',
      solutionSteps: ['풀이'],
      problem,
    })),
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

  it('does not persist an incomplete or abandoned set', () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    const fixture = completionFixture(grade)
    const incompleteResults = fixture.results.slice(0, -1)

    expect(() => persistCompletedPractice(fixture.session, incompleteResults, 200))
      .toThrow(/complete set/i)
    expect(storage.data.size).toBe(0)
  })

  it('treats the same completed session as an idempotent re-entry', () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    const fixture = completionFixture(grade)
    const first = persistCompletedPractice(fixture.session, fixture.results, 200)
    const rawAfterFirst = new Map(storage.data)
    const repeated = persistCompletedPractice(fixture.session, fixture.results, 900)
    const progressKey = grade === 6 ? GRADE6_PROGRESS_KEY : GRADE5_PROGRESS_KEY
    const progress = JSON.parse(storage.getItem(progressKey) ?? '{}')

    expect(repeated).toEqual(first)
    expect(storage.data).toEqual(rawAfterFirst)
    expect(progress[fixture.session.conceptId]).toMatchObject({
      attemptCount: 1,
      lastCompletedAt: 200,
    })
  })
})

describe('practice completion projection', () => {
  it('treats five items as basic and ten items as practice without requiring a perfect score', () => {
    const basic = completionFixture(6, 5)
    const practice = completionFixture(6, 10)

    const basicProjection = derivePracticeSetCompletion(
      basic.session,
      basic.results,
      { completedBasicSetActivityIds: [], completedPracticeSetActivityIds: [] },
      false,
    )
    const practiceProjection = derivePracticeSetCompletion(
      practice.session,
      practice.results,
      basicProjection.record,
      false,
    )

    expect(basicProjection.projection).toEqual({
      hasCompletedBasicSet: true,
      hasCompletedPracticeSet: false,
      isComplete: false,
      recommendedMode: 'practice',
    })
    expect(practiceProjection.projection).toEqual({
      hasCompletedBasicSet: true,
      hasCompletedPracticeSet: true,
      isComplete: true,
      recommendedMode: 'practice',
    })
    expect(practiceProjection.reviewItemIds).toEqual(['tmpl-g6ratio-A-2'])
  })

  it('keeps a legacy completion complete without claiming a basic or practice source', () => {
    const fixture = completionFixture(5, 10)
    const projection = derivePracticeSetCompletion(
      { ...fixture.session, checkedAnswers: fixture.session.checkedAnswers.map(() => null) },
      [],
      { completedBasicSetActivityIds: [], completedPracticeSetActivityIds: [] },
      true,
    )

    expect(projection.completed).toBe(false)
    expect(projection.projection).toEqual({
      hasCompletedBasicSet: false,
      hasCompletedPracticeSet: false,
      isComplete: true,
      recommendedMode: 'basic',
    })
  })

  it('keeps practice completion after a wrong-answer retry', () => {
    const practice = completionFixture(6, 10)
    const completed = derivePracticeSetCompletion(
      practice.session,
      practice.results,
      { completedBasicSetActivityIds: [], completedPracticeSetActivityIds: [] },
      false,
    )
    const wrongResult = practice.results[1]
    const retrySession: PracticeSession = {
      ...practice.session,
      sessionId: 'grade6_session_retry',
      mode: 'retry-wrong',
      sourceResultId: practice.session.sessionId,
      sourceProblemIndexes: [wrongResult.index],
      problems: [wrongResult.problem],
      answers: ['4'],
      checkedAnswers: [true],
    }
    const retry = derivePracticeSetCompletion(
      retrySession,
      [{ ...wrongResult, correct: true, userAnswer: '4' }],
      completed.record,
      false,
    )

    expect(retry.completed).toBe(false)
    expect(retry.record).toEqual(completed.record)
    expect(retry.projection.isComplete).toBe(true)
    expect(retry.projection.hasCompletedPracticeSet).toBe(true)
  })
})
