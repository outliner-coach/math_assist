import { describe, expect, it } from 'vitest'
import {
  buildSessionResult,
  createRetrySessionFromResult,
  matchesSessionRequest
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

function makeResult(): SessionResult {
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
    ]
  }
}

describe('session helpers', () => {
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
})
