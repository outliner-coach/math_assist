import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildSessionResult,
  createRetrySessionFromResult,
  GRADE5_APPLICATION_RECOVERY_EVIDENCE_KEY,
  GRADE5_RESULT_KEY,
  GRADE5_SESSION_KEY,
  GRADE6_RESULT_KEY,
  GRADE6_SESSION_KEY,
  GRADE6_APPLICATION_RECOVERY_EVIDENCE_KEY,
  getResultStorageStatus,
  getSessionStorageStatus,
  loadResult,
  loadSession,
  markAnswerChecked,
  matchesSessionRequest,
  persistRecoveredPracticeSession,
  resetGrade6ResultStorage,
  resetGrade6SessionStorage,
  resetGrade5ResultStorage,
  resetGrade5SessionStorage,
  saveResult,
  saveSession,
  updateAnswer
} from './session'
import type { PracticeSession, Problem, SessionResult, SubmissionResult } from './types'
import { adaptGeneratedApplicationProblemToPractice } from './application-problems/template-adapter'
import { generateG6RatioPartWhole } from './application-problems/families/g6-ratio'

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
  const itemCount = overrides.itemCount ?? 10
  const results = overrides.results ?? Array.from(
    { length: itemCount },
    (_, index) => makeSubmissionResult(makeProblem(index), index === 0),
  )
  const score = results.filter((result) => result.correct).length

  return {
    sessionId: 'session-1',
    conceptId: 'divisor-001',
    setId: 'A',
    mode: 'standard',
    score,
    total: results.length,
    wrongCount: results.length - score,
    completedAt: 100,
    results,
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
      sourceProblemIndexes: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      currentIndex: 0
    })
    expect(retrySession?.problems).toHaveLength(9)
    expect(retrySession?.answers).toEqual(Array(9).fill(null))
    expect(retrySession?.checkedAnswers).toEqual(Array(9).fill(null))
  })

  it('locks an answer after immediate grading', () => {
    const session = createRetrySessionFromResult(makeResult(), 500)!
    const answered = updateAnswer(session, 0, '2')
    const checked = markAnswerChecked(answered, 0, true)

    expect(checked.checkedAnswers).toEqual([true, ...Array(8).fill(null)])
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
      problems: Array.from({ length: 10 }, (_, index) => makeProblem(index)),
      answers: Array(10).fill(null),
      checkedAnswers: Array(10).fill(null),
      currentIndex: 0,
      startedAt: Date.now(),
      expiresAt: Date.now() + 10_000,
    }
    data.set(GRADE5_SESSION_KEY, JSON.stringify(legacyGrade5))

    expect(loadSession(5)).toMatchObject({ sessionId: 'legacy-5', itemCount: 10 })
    expect(loadSession(6)).toBeNull()

    saveSession({
      ...legacyGrade5,
      sessionId: 'grade-6',
      conceptId: 'g6ratio-001',
      grade: 6,
      itemCount: 5,
      problems: legacyGrade5.problems.slice(0, 5),
      answers: legacyGrade5.answers.slice(0, 5),
      checkedAnswers: legacyGrade5.checkedAnswers.slice(0, 5),
    })
    expect(data.get(GRADE5_SESSION_KEY)).toContain('legacy-5')
    expect(data.get(GRADE6_SESSION_KEY)).toContain('grade-6')
    expect(loadSession(6)).toMatchObject({ sessionId: 'grade-6', grade: 6, itemCount: 5 })
  })

  it('round-trips the complete application snapshot while legacy source-less problems stay readable', () => {
    const generated = generateG6RatioPartWhole({ seed: 7, variantIndex: 1 })
    const applicationProblem = adaptGeneratedApplicationProblemToPractice({
      problem: generated,
      placement: {
        index: 0,
        templateId: 'application-g6-ratio-part-whole-v1',
        setId: 'A',
        difficulty: 2,
      },
      mapParams: (params) => Object.fromEntries(
        Object.entries(params).filter((entry): entry is [string, number] => typeof entry[1] === 'number'),
      ),
    })
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    const session: PracticeSession = {
      sessionId: 'grade6-application-session',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: [applicationProblem, ...Array.from({ length: 4 }, (_, index) => makeProblem(index + 1))],
      answers: Array(5).fill(null),
      checkedAnswers: Array(5).fill(null),
      applicationProblemReplacementArchive: [{
        problemIndex: applicationProblem.index,
        originalInstanceId: applicationProblem.applicationSource.instanceId,
        replacementInstanceId: 'g6-ratio-part-whole@2:99:0',
        originalProblem: applicationProblem,
      }],
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() + 10_000,
    }

    expect(saveSession(session)).toBe(true)
    const regenerated = adaptGeneratedApplicationProblemToPractice({
      problem: generateG6RatioPartWhole({ seed: 8, variantIndex: 2 }),
      placement: {
        index: 0,
        templateId: 'application-g6-ratio-part-whole-v1',
        setId: 'A',
        difficulty: 2,
      },
      mapParams: (params) => Object.fromEntries(
        Object.entries(params).filter((entry): entry is [string, number] => typeof entry[1] === 'number'),
      ),
    })
    const loaded = loadSession(6)!
    expect(loaded.problems[0]).toEqual(applicationProblem)
    expect(loaded.problems[0]).not.toEqual(regenerated)
    expect(loaded.problems[0]).toHaveProperty('applicationParams')
    expect(loaded.problems[0]).toHaveProperty('applicationVisual')
    expect(loaded.problems[1]).toEqual(makeProblem(1))
    expect(loaded.problems[1]).not.toHaveProperty('applicationSource')
    expect(loaded.applicationProblemReplacementArchive).toEqual(
      session.applicationProblemReplacementArchive,
    )

    const retry = createRetrySessionFromResult(makeResult({
      conceptId: 'g6ratio-001',
      grade: 6,
      itemCount: 5,
      results: [makeSubmissionResult(applicationProblem, false)],
    }), 500)!
    expect(retry.problems[0]).toEqual(applicationProblem)
  })

  it('persists an application replacement only when the stored session is still the loaded original', () => {
    const generated = generateG6RatioPartWhole({ seed: 7, variantIndex: 1 })
    const originalProblem = adaptGeneratedApplicationProblemToPractice({
      problem: generated,
      placement: {
        index: 0,
        templateId: 'application-g6-ratio-part-whole-v1',
        setId: 'A',
        difficulty: 2,
      },
      mapParams: (params) => Object.fromEntries(
        Object.entries(params).filter(
          (entry): entry is [string, number] => typeof entry[1] === 'number',
        ),
      ),
    })
    const original: PracticeSession = {
      sessionId: 'grade6-atomic-application-recovery',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: [originalProblem, ...Array.from({ length: 4 }, (_, index) => makeProblem(index + 1))],
      answers: ['0', null, null, null, null],
      checkedAnswers: [false, null, null, null, null],
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() + 10_000,
    }
    const replacement = structuredClone(originalProblem)
    replacement.applicationSource = {
      ...replacement.applicationSource,
      instanceId: 'g6-ratio-part-whole@2:99:0',
      generatorVersion: 2,
    }
    const recovered: PracticeSession = {
      ...original,
      problems: [replacement, ...original.problems.slice(1)],
      answers: Array(5).fill(null),
      checkedAnswers: Array(5).fill(null),
      applicationProblemReplacementArchive: [{
        problemIndex: originalProblem.index,
        originalInstanceId: originalProblem.applicationSource.instanceId,
        replacementInstanceId: replacement.applicationSource.instanceId,
        originalProblem,
      }],
    }
    const originalRaw = JSON.stringify(original)
    const data = new Map<string, string>([[GRADE6_SESSION_KEY, originalRaw]])
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)

    const loaded = loadSession(6)!
    const concurrentRaw = JSON.stringify({ ...original, sessionId: 'newer-session' })
    data.set(GRADE6_SESSION_KEY, concurrentRaw)
    expect(persistRecoveredPracticeSession(loaded, recovered)).toBe(false)
    expect(data.get(GRADE6_SESSION_KEY)).toBe(concurrentRaw)

    data.set(GRADE6_SESSION_KEY, originalRaw)
    expect(persistRecoveredPracticeSession(loaded, recovered)).toBe(true)
    expect(JSON.parse(data.get(GRADE6_SESSION_KEY) ?? 'null')).toEqual(recovered)
    expect(JSON.parse(data.get(GRADE6_APPLICATION_RECOVERY_EVIDENCE_KEY) ?? 'null'))
      .toEqual([expect.objectContaining({
        schemaVersion: 'application-problem-recovery-evidence-v1',
        evidenceId: `${original.sessionId}:1`,
        sessionId: original.sessionId,
        grade: 6,
        itemCount: 5,
        replacements: recovered.applicationProblemReplacementArchive,
      })])
  })

  it('does not replace an application session when its durable recovery evidence is corrupt', () => {
    const generated = generateG6RatioPartWhole({ seed: 7, variantIndex: 1 })
    const originalProblem = adaptGeneratedApplicationProblemToPractice({
      problem: generated,
      placement: {
        index: 0,
        templateId: 'application-g6-ratio-part-whole-v1',
        setId: 'A',
        difficulty: 2,
      },
      mapParams: (params) => Object.fromEntries(
        Object.entries(params).filter(
          (entry): entry is [string, number] => typeof entry[1] === 'number',
        ),
      ),
    })
    const original: PracticeSession = {
      sessionId: 'grade6-corrupt-durable-evidence',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: [originalProblem, ...Array.from({ length: 4 }, (_, index) => makeProblem(index + 1))],
      answers: ['0', null, null, null, null],
      checkedAnswers: [false, null, null, null, null],
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() + 10_000,
    }
    const replacement = structuredClone(originalProblem)
    replacement.applicationSource = {
      ...replacement.applicationSource,
      instanceId: 'g6-ratio-part-whole@2:99:0',
      generatorVersion: 2,
    }
    const recovered: PracticeSession = {
      ...original,
      problems: [replacement, ...original.problems.slice(1)],
      answers: Array(5).fill(null),
      checkedAnswers: Array(5).fill(null),
      applicationProblemReplacementArchive: [{
        problemIndex: originalProblem.index,
        originalInstanceId: originalProblem.applicationSource.instanceId,
        replacementInstanceId: replacement.applicationSource.instanceId,
        originalProblem,
      }],
    }
    const originalRaw = JSON.stringify(original)
    const data = new Map<string, string>([
      [GRADE6_SESSION_KEY, originalRaw],
      [GRADE6_APPLICATION_RECOVERY_EVIDENCE_KEY, '{corrupt-evidence'],
    ])
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)

    expect(persistRecoveredPracticeSession(original, recovered)).toBe(false)
    expect(data.get(GRADE6_SESSION_KEY)).toBe(originalRaw)
    expect(data.get(GRADE6_APPLICATION_RECOVERY_EVIDENCE_KEY)).toBe('{corrupt-evidence')
    expect(data.has(GRADE5_APPLICATION_RECOVERY_EVIDENCE_KEY)).toBe(false)
  })

  it('treats a malformed application replacement archive as corrupt without overwriting it', () => {
    const base: PracticeSession = {
      sessionId: 'grade6-malformed-replacement-archive',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: Array.from({ length: 5 }, (_, index) => makeProblem(index)),
      answers: Array(5).fill(null),
      checkedAnswers: Array(5).fill(null),
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() + 10_000,
    }
    const raw = JSON.stringify({
      ...base,
      applicationProblemReplacementArchive: [{ originalInstanceId: 123 }],
    })
    const data = new Map<string, string>([[GRADE6_SESSION_KEY, raw]])
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)

    expect(getSessionStorageStatus(6)).toBe('corrupt')
    expect(loadSession(6)).toBeNull()
    expect(saveSession(base)).toBe(false)
    expect(data.get(GRADE6_SESSION_KEY)).toBe(raw)
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
      problems: Array.from({ length: 5 }, (_, index) => makeProblem(index)),
      answers: Array(5).fill(null),
      checkedAnswers: Array(5).fill(null),
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
      problems: Array.from({ length: 10 }, (_, index) => makeProblem(index)),
      answers: Array(10).fill(null),
      checkedAnswers: Array(10).fill(null),
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

  it('quarantines explicit non-Grade-5 identity instead of normalizing it as legacy Grade 5', () => {
    const foreignSession = {
      sessionId: 'foreign-grade-session',
      conceptId: 'divisor-001',
      setId: 'A',
      mode: 'standard',
      grade: 4,
      itemCount: 5,
      problems: Array.from({ length: 5 }, (_, index) => makeProblem(index)),
      answers: Array(5).fill(null),
      checkedAnswers: Array(5).fill(null),
      currentIndex: 0,
      startedAt: Date.now(),
      expiresAt: Date.now() + 10_000,
    }
    const foreignResult = {
      ...makeResult(),
      grade: 4,
      itemCount: 5,
    }
    const sessionRaw = JSON.stringify(foreignSession)
    const resultRaw = JSON.stringify(foreignResult)
    const data = new Map<string, string>([
      [GRADE5_SESSION_KEY, sessionRaw],
      [GRADE5_RESULT_KEY, resultRaw],
    ])
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)

    expect(getSessionStorageStatus(5)).toBe('corrupt')
    expect(getResultStorageStatus(5)).toBe('corrupt')
    expect(loadSession(5)).toBeNull()
    expect(loadResult(5)).toBeNull()
    expect(data.get(GRADE5_SESSION_KEY)).toBe(sessionRaw)
    expect(data.get(GRADE5_RESULT_KEY)).toBe(resultRaw)
  })

  it('quarantines malformed problem and result entries without deleting their raw bytes', () => {
    const malformedSession = {
      sessionId: 'grade6-malformed-problem-entry',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: [null],
      answers: [null],
      checkedAnswers: [null],
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() + 10_000,
    }
    const malformedResult = {
      sessionId: 'grade6-malformed-result-entry',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      score: 1,
      total: 1,
      wrongCount: 0,
      results: [{
        index: 0,
        correct: true,
        userAnswer: '1',
        correctAnswer: '1',
        solutionSteps: ['풀이'],
        problem: null,
      }],
      completedAt: 100,
    }
    const sessionRaw = JSON.stringify(malformedSession)
    const resultRaw = JSON.stringify(malformedResult)
    const data = new Map<string, string>([
      [GRADE6_SESSION_KEY, sessionRaw],
      [GRADE6_RESULT_KEY, resultRaw],
    ])
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)

    expect(getSessionStorageStatus(6)).toBe('corrupt')
    expect(getResultStorageStatus(6)).toBe('corrupt')
    expect(loadSession(6)).toBeNull()
    expect(loadResult(6)).toBeNull()
    expect(data.get(GRADE6_SESSION_KEY)).toBe(sessionRaw)
    expect(data.get(GRADE6_RESULT_KEY)).toBe(resultRaw)
  })

  it('rejects incoherent session indexes and result totals', () => {
    const session = {
      sessionId: 'grade6-bad-index',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: Array.from({ length: 5 }, (_, index) => makeProblem(index)),
      answers: Array(5).fill(null),
      checkedAnswers: Array(5).fill(null),
      currentIndex: 5,
      startedAt: 100,
      expiresAt: Date.now() + 10_000,
    }
    const result = {
      ...makeResult({ grade: 6, itemCount: 5, conceptId: 'g6ratio-001' }),
      total: 99,
    }
    const data = new Map<string, string>([
      [GRADE6_SESSION_KEY, JSON.stringify(session)],
      [GRADE6_RESULT_KEY, JSON.stringify(result)],
    ])
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)

    expect(getSessionStorageStatus(6)).toBe('corrupt')
    expect(getResultStorageStatus(6)).toBe('corrupt')
  })

  it('rejects truncated standard snapshots but accepts bounded retry subsets', () => {
    const truncatedSession = {
      sessionId: 'grade6-truncated-standard',
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
    const truncatedResult = makeResult({
      sessionId: 'grade6-truncated-standard',
      conceptId: 'g6ratio-001',
      grade: 6,
      itemCount: 5,
      results: [makeSubmissionResult(makeProblem(0), true)],
    })
    const sessionRaw = JSON.stringify(truncatedSession)
    const resultRaw = JSON.stringify(truncatedResult)
    const data = new Map<string, string>([
      [GRADE6_SESSION_KEY, sessionRaw],
      [GRADE6_RESULT_KEY, resultRaw],
    ])
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)

    expect(getSessionStorageStatus(6)).toBe('corrupt')
    expect(getResultStorageStatus(6)).toBe('corrupt')
    expect(loadSession(6)).toBeNull()
    expect(loadResult(6)).toBeNull()
    expect(data.get(GRADE6_SESSION_KEY)).toBe(sessionRaw)
    expect(data.get(GRADE6_RESULT_KEY)).toBe(resultRaw)

    const retrySession: PracticeSession = {
      sessionId: 'grade6-bounded-retry',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'retry-wrong',
      grade: 6,
      itemCount: 5,
      sourceResultId: 'grade6-source',
      sourceProblemIndexes: [1, 4],
      problems: [makeProblem(1), makeProblem(4)],
      answers: [null, null],
      checkedAnswers: [null, null],
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() + 10_000,
    }
    const retryResults = [
      { ...makeSubmissionResult(makeProblem(1), true), index: 0 },
      { ...makeSubmissionResult(makeProblem(4), false), index: 1 },
    ]
    const retryResult = makeResult({
      sessionId: retrySession.sessionId,
      conceptId: retrySession.conceptId,
      mode: 'retry-wrong',
      grade: 6,
      itemCount: 5,
      results: retryResults,
      score: 1,
      total: 2,
      wrongCount: 1,
    })
    data.set(GRADE6_SESSION_KEY, JSON.stringify(retrySession))
    data.set(GRADE6_RESULT_KEY, JSON.stringify(retryResult))

    expect(getSessionStorageStatus(6)).toBe('valid')
    expect(getResultStorageStatus(6)).toBe('valid')

    data.set(GRADE6_SESSION_KEY, JSON.stringify({
      ...retrySession,
      sourceProblemIndexes: [1, 3],
    }))
    expect(getSessionStorageStatus(6)).toBe('corrupt')
  })
})
