import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildSessionResult,
  createRetrySessionFromResult,
  GRADE5_RESULT_KEY,
  GRADE5_SESSION_KEY,
  GRADE6_RESULT_KEY,
  GRADE6_SESSION_KEY,
  getResultStorageStatus,
  getSessionStorageStatus,
  loadResult,
  loadSession,
  markAnswerChecked,
  matchesSessionRequest,
  resetGrade6ResultStorage,
  resetGrade6SessionStorage,
  resetGrade5ResultStorage,
  resetGrade5SessionStorage,
  saveResult,
  saveSession,
  updateAnswer
} from './session'
import type { PracticeSession, Problem, SessionResult, SubmissionResult } from './types'

function makeProblem(index: number): Problem {
  return {
    index,
    templateId: `tmpl-${index}`,
    setId: 'A',
    params: { index },
    prompt: `문제 ${index + 1}`,
    type: 'number',
    correctAnswer: String(index + 1),
    solutionSteps: [`풀이 ${index + 1}`]
  }
}

function makeSubmissionResult(problem: Problem, correct: boolean): SubmissionResult {
  return {
    index: problem.index,
    correct,
    userAnswer: correct ? problem.correctAnswer : '999999',
    correctAnswer: problem.correctAnswer,
    solutionSteps: problem.solutionSteps,
    problem
  }
}

function makeResult(overrides: Partial<SessionResult> = {}): SessionResult {
  const first = makeProblem(0)
  const second = makeProblem(1)
  const third = makeProblem(2)

  return {
    sessionId: 'session-1',
    conceptId: 'divisor-001',
    setId: 'A',
    mode: 'standard',
    score: 1,
    total: 3,
    wrongCount: 2,
    completedAt: 100,
    results: [
      makeSubmissionResult(first, true),
      makeSubmissionResult(second, false),
      makeSubmissionResult(third, false)
    ],
    ...overrides,
  }
}

describe('session helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates a retry session with only wrong problems', () => {
    const retrySession = createRetrySessionFromResult(makeResult(), 500)

    expect(retrySession).toMatchObject({
      conceptId: 'divisor-001',
      setId: 'A',
      mode: 'retry-wrong',
      sourceResultId: 'session-1',
      sourceProblemIndexes: [1, 2],
      currentIndex: 0
    })
    expect(retrySession?.problems).toHaveLength(2)
    expect(retrySession?.answers).toEqual([null, null])
    expect(retrySession?.checkedAnswers).toEqual([null, null])
  })

  it('locks an answer after immediate grading', () => {
    const session = createRetrySessionFromResult(makeResult(), 500)!
    const answered = updateAnswer(session, 0, '2')
    const checked = markAnswerChecked(answered, 0, true)

    expect(checked.checkedAnswers).toEqual([true, null])
    expect(updateAnswer(checked, 0, '999999')).toBe(checked)
    expect(markAnswerChecked(checked, 0, false)).toBe(checked)
  })

  it('builds a variable-length session result from a retry session', () => {
    const retrySession: PracticeSession = {
      sessionId: 'retry-1',
      conceptId: 'divisor-001',
      setId: 'A',
      mode: 'retry-wrong',
      sourceResultId: 'session-1',
      sourceProblemIndexes: [1, 2],
      problems: [makeProblem(1), makeProblem(2)],
      answers: ['2', '999999'],
      checkedAnswers: [true, false],
      currentIndex: 1,
      startedAt: 10,
      expiresAt: 20
    }
    const results = [
      makeSubmissionResult(retrySession.problems[0], true),
      makeSubmissionResult(retrySession.problems[1], false)
    ]

    const sessionResult = buildSessionResult(retrySession, results, 900)

    expect(sessionResult).toMatchObject({
      sessionId: 'retry-1',
      mode: 'retry-wrong',
      score: 1,
      total: 2,
      wrongCount: 1,
      completedAt: 900
    })
  })

  it('matches retry requests by source result id', () => {
    const retrySession = createRetrySessionFromResult(makeResult(), 500)

    expect(
      matchesSessionRequest(retrySession!, {
        conceptId: 'divisor-001',
        setId: 'A',
        mode: 'retry-wrong',
        sourceResultId: 'session-1'
      })
    ).toBe(true)

    expect(
      matchesSessionRequest(retrySession!, {
        conceptId: 'divisor-001',
        setId: 'A',
        mode: 'retry-wrong',
        sourceResultId: 'other-session'
      })
    ).toBe(false)
  })

  it('keeps legacy Grade 5 sessions on the original key and isolates Grade 6', () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)

    const legacyGrade5: PracticeSession = {
      sessionId: 'legacy-5',
      conceptId: 'divisor-001',
      setId: 'A',
      mode: 'standard',
      problems: [makeProblem(0)],
      answers: [null],
      checkedAnswers: [null],
      currentIndex: 0,
      startedAt: Date.now(),
      expiresAt: Date.now() + 10_000,
    }
    data.set(GRADE5_SESSION_KEY, JSON.stringify(legacyGrade5))

    expect(loadSession(5)).toMatchObject({ sessionId: 'legacy-5', itemCount: 10 })
    expect(loadSession(6)).toBeNull()

    saveSession({ ...legacyGrade5, sessionId: 'grade-6', conceptId: 'g6ratio-001', grade: 6, itemCount: 5 })
    expect(data.get(GRADE5_SESSION_KEY)).toContain('legacy-5')
    expect(data.get(GRADE6_SESSION_KEY)).toContain('grade-6')
    expect(loadSession(6)).toMatchObject({ sessionId: 'grade-6', grade: 6, itemCount: 5 })
  })

  it('preserves Grade 6 grade and requested count through retry and results', () => {
    const grade6Result = makeResult({
      conceptId: 'g6ratio-001',
      grade: 6,
      itemCount: 5,
    })
    const retrySession = createRetrySessionFromResult(grade6Result, 500)!

    expect(retrySession).toMatchObject({ grade: 6, itemCount: 5 })
    expect(matchesSessionRequest(retrySession, {
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'retry-wrong',
      sourceResultId: 'session-1',
      grade: 6,
      itemCount: 5,
    })).toBe(true)
    expect(matchesSessionRequest(retrySession, {
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'retry-wrong',
      sourceResultId: 'session-1',
      grade: 6,
      itemCount: 10,
    })).toBe(false)
  })

  it('preserves corrupt Grade 6 session and result bytes until an explicit reset', () => {
    const data = new Map<string, string>([
      [GRADE6_SESSION_KEY, '{corrupt-session'],
      [GRADE6_RESULT_KEY, JSON.stringify({ grade: 6, itemCount: 7, keep: true })],
    ])
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    const grade6Session: PracticeSession = {
      sessionId: 'grade6_session_1_safe',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: [makeProblem(0)],
      answers: [null],
      checkedAnswers: [null],
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() + 10_000,
    }
    const grade6Result = makeResult({ grade: 6, itemCount: 5, conceptId: 'g6ratio-001' })

    expect(loadSession(6)).toBeNull()
    expect(loadResult(6)).toBeNull()
    expect(getSessionStorageStatus(6)).toBe('corrupt')
    expect(getResultStorageStatus(6)).toBe('corrupt')
    expect(saveSession(grade6Session)).toBe(false)
    expect(saveResult(grade6Result)).toBe(false)
    expect(data.get(GRADE6_SESSION_KEY)).toBe('{corrupt-session')
    expect(data.get(GRADE6_RESULT_KEY)).toBe(JSON.stringify({ grade: 6, itemCount: 7, keep: true }))

    resetGrade6SessionStorage()
    resetGrade6ResultStorage()
    expect(getSessionStorageStatus(6)).toBe('missing')
    expect(getResultStorageStatus(6)).toBe('missing')
    expect(saveSession(grade6Session)).toBe(true)
    expect(saveResult(grade6Result)).toBe(true)
    expect(getSessionStorageStatus(6)).toBe('valid')
    expect(getResultStorageStatus(6)).toBe('valid')
  })

  it('preserves corrupt legacy Grade 5 bytes while still expiring valid sessions', () => {
    const corruptSession = '{corrupt-grade5-session'
    const corruptResult = '{corrupt-grade5-result'
    const data = new Map<string, string>([
      [GRADE5_SESSION_KEY, corruptSession],
      [GRADE5_RESULT_KEY, corruptResult],
    ])
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    const grade5Session: PracticeSession = {
      sessionId: 'session_1_safe',
      conceptId: 'divisor-001',
      setId: 'A',
      mode: 'standard',
      problems: [makeProblem(0)],
      answers: [null],
      checkedAnswers: [null],
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() + 10_000,
    }

    expect(loadSession(5)).toBeNull()
    expect(loadResult(5)).toBeNull()
    expect(saveSession(grade5Session)).toBe(false)
    expect(saveResult(makeResult())).toBe(false)
    expect(data.get(GRADE5_SESSION_KEY)).toBe(corruptSession)
    expect(data.get(GRADE5_RESULT_KEY)).toBe(corruptResult)

    resetGrade5SessionStorage()
    resetGrade5ResultStorage()
    const expired = { ...grade5Session, expiresAt: Date.now() - 1 }
    expect(saveSession(expired)).toBe(true)
    expect(loadSession(5)).toBeNull()
    expect(data.has(GRADE5_SESSION_KEY)).toBe(false)
  })
})
