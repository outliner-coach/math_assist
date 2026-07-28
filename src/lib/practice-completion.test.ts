import { afterEach, describe, expect, it, vi } from 'vitest'

import { GRADE5_PROGRESS_KEY, GRADE6_PROGRESS_KEY } from './progress'
import { persistCompletedPractice } from './practice-completion'
import {
  GRADE5_APPLICATION_RECOVERY_EVIDENCE_KEY,
  GRADE5_SESSION_KEY,
  GRADE6_APPLICATION_RECOVERY_EVIDENCE_KEY,
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
  const itemCount = grade === 6 ? 5 : 10
  const problems: Problem[] = Array.from({ length: itemCount }, (_, index) => ({
    index,
    templateId: grade === 6 ? `tmpl-g6ratio-A-${index + 1}` : `tmpl-divisor-A-${index + 1}`,
    setId: 'A',
    params: { p: index + 2 },
    prompt: `문제 ${index + 1}`,
    type: 'number',
    correctAnswer: String(index + 4),
    solutionSteps: [`풀이 ${index + 1}`],
  }))
  const session: PracticeSession = {
    sessionId: grade === 6 ? 'grade6_session_1_test' : 'session_1_test',
    conceptId: grade === 6 ? 'g6ratio-001' : 'divisor-001',
    setId: 'A',
    mode: 'standard',
    grade: grade === 6 ? 6 : undefined,
    itemCount: grade === 6 ? 5 : undefined,
    problems,
    answers: problems.map((problem) => problem.correctAnswer),
    checkedAnswers: Array(itemCount).fill(true),
    currentIndex: itemCount - 1,
    startedAt: 100,
    expiresAt: Date.now() + 10_000,
  }
  return {
    session,
    results: problems.map((problem) => ({
      index: problem.index,
      correct: true,
      userAnswer: problem.correctAnswer,
      correctAnswer: problem.correctAnswer,
      solutionSteps: problem.solutionSteps,
      problem,
    })),
  }
}

function withReplacementEvidence(
  fixture: ReturnType<typeof completionFixture>,
  grade: PracticeGrade,
): ReturnType<typeof completionFixture> {
  const originalProblem: Problem = {
    ...fixture.session.problems[0],
    templateId: `application-g${grade}-recovery-v1`,
    applicationSource: {
      schemaVersion: 'generated-application-problem-v1',
      instanceId: `g${grade}-recovery@1:7:0`,
      familyId: `g${grade}-recovery`,
      generatorVersion: 1,
      packId: `pack-g${grade}`,
      packVersion: 1,
      seed: 7,
      variantIndex: 0,
      curriculumCodes: ['test'],
    },
  }
  const replacement: Problem = {
    ...originalProblem,
    templateId: `application-g${grade}-recovery-v2`,
    applicationSource: {
      ...originalProblem.applicationSource!,
      instanceId: `g${grade}-recovery@2:9:0`,
      generatorVersion: 2,
    },
  }
  const session = {
    ...fixture.session,
    problems: [replacement, ...fixture.session.problems.slice(1)],
    applicationProblemReplacementArchive: [{
      problemIndex: 0,
      originalInstanceId: originalProblem.applicationSource!.instanceId,
      replacementInstanceId: replacement.applicationSource!.instanceId,
      originalProblem,
    }],
  }
  return {
    session,
    results: fixture.results.map((result) => (
      result.index === 0 ? { ...result, problem: replacement } : result
    )),
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

  it('keeps durable replacement evidence after the recovered session completes', () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    const fixture = withReplacementEvidence(completionFixture(grade), grade)
    const sessionKey = grade === 6 ? GRADE6_SESSION_KEY : GRADE5_SESSION_KEY
    const evidenceKey = grade === 6
      ? GRADE6_APPLICATION_RECOVERY_EVIDENCE_KEY
      : GRADE5_APPLICATION_RECOVERY_EVIDENCE_KEY
    expect(saveSession(fixture.session)).toBe(true)

    expect(persistCompletedPractice(fixture.session, fixture.results, 200).status).toBe('completed')
    expect(storage.getItem(sessionKey)).toBeNull()
    expect(JSON.parse(storage.getItem(evidenceKey) ?? 'null')).toEqual([
      expect.objectContaining({
        sessionId: fixture.session.sessionId,
        replacements: fixture.session.applicationProblemReplacementArchive,
      }),
    ])
  })

  it('keeps the recovered session when durable replacement evidence is corrupt', () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    const fixture = withReplacementEvidence(completionFixture(grade), grade)
    const sessionKey = grade === 6 ? GRADE6_SESSION_KEY : GRADE5_SESSION_KEY
    const evidenceKey = grade === 6
      ? GRADE6_APPLICATION_RECOVERY_EVIDENCE_KEY
      : GRADE5_APPLICATION_RECOVERY_EVIDENCE_KEY
    expect(saveSession(fixture.session)).toBe(true)
    storage.setItem(evidenceKey, '{corrupt-recovery-evidence')

    expect(persistCompletedPractice(fixture.session, fixture.results, 200)).toEqual({
      status: 'storage-blocked',
      target: 'recovery-evidence',
    })
    expect(storage.getItem(sessionKey)).not.toBeNull()
    expect(storage.getItem(evidenceKey)).toBe('{corrupt-recovery-evidence')
  })
})
