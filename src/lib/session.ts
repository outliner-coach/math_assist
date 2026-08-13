/**
 * 세션 관리 - localStorage 기반
 */

import type {
  ApplicationProblemRecoveryEvidenceV1,
  PracticeGrade,
  PracticeItemCount,
  PracticeSession,
  Problem,
  SessionResult,
  SubmissionResult,
} from './types'
import { hasApplicationProblemFootprint } from './application-problems/template-adapter'

export const GRADE5_SESSION_KEY = 'mathAssist_currentSession'
export const GRADE5_RESULT_KEY = 'mathAssist_lastResult'
export const GRADE6_SESSION_KEY = 'mathAssist_grade6CurrentSession'
export const GRADE6_RESULT_KEY = 'mathAssist_grade6LastResult'
export const GRADE5_APPLICATION_RECOVERY_EVIDENCE_KEY =
  'mathAssist_grade5ApplicationProblemRecoveryEvidence_v1'
export const GRADE6_APPLICATION_RECOVERY_EVIDENCE_KEY =
  'mathAssist_grade6ApplicationProblemRecoveryEvidence_v1'
const SESSION_DURATION = 2 * 60 * 60 * 1000 // 2시간

function sessionKey(grade: PracticeGrade): string {
  return grade === 6 ? GRADE6_SESSION_KEY : GRADE5_SESSION_KEY
}

function resultKey(grade: PracticeGrade): string {
  return grade === 6 ? GRADE6_RESULT_KEY : GRADE5_RESULT_KEY
}

function hasCompatiblePracticeIdentity(
  candidate: { grade?: unknown; itemCount?: unknown },
  grade: PracticeGrade,
): boolean {
  if (grade === 6) {
    return candidate.grade === 6
      && (candidate.itemCount === 5 || candidate.itemCount === 10)
  }
  return (candidate.grade === undefined || candidate.grade === 5)
    && (
      candidate.itemCount === undefined
      || candidate.itemCount === 5
      || candidate.itemCount === 10
    )
}

function recoveryEvidenceKey(grade: PracticeGrade): string {
  return grade === 6
    ? GRADE6_APPLICATION_RECOVERY_EVIDENCE_KEY
    : GRADE5_APPLICATION_RECOVERY_EVIDENCE_KEY
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isFiniteNumericRecord(value: unknown): value is Record<string, number> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) &&
    Object.entries(value as Record<string, unknown>).every(([key, entry]) => (
      key !== '' && typeof entry === 'number' && Number.isFinite(entry)
    ))
}

function isProblemSnapshot(value: unknown): value is Problem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<Problem>
  if (
    !Number.isSafeInteger(candidate.index) ||
    (candidate.index ?? -1) < 0 ||
    typeof candidate.templateId !== 'string' ||
    candidate.templateId === '' ||
    !['A', 'B', 'C'].includes(candidate.setId ?? '') ||
    !isFiniteNumericRecord(candidate.params) ||
    typeof candidate.prompt !== 'string' ||
    candidate.prompt === '' ||
    !['choice', 'number'].includes(candidate.type ?? '') ||
    typeof candidate.correctAnswer !== 'string' ||
    candidate.correctAnswer === '' ||
    !isStringArray(candidate.solutionSteps) ||
    (candidate.hintSteps !== undefined && !isStringArray(candidate.hintSteps))
  ) {
    return false
  }
  if (candidate.type === 'choice') {
    return isStringArray(candidate.choices) &&
      candidate.choices.length > 0 &&
      Number.isSafeInteger(candidate.correctChoiceIndex) &&
      (candidate.correctChoiceIndex ?? -1) >= 0 &&
      (candidate.correctChoiceIndex ?? Number.MAX_SAFE_INTEGER) < candidate.choices.length
  }
  return true
}

function isApplicationProblemReplacementArchive(value: unknown): boolean {
  if (value === undefined) return true
  if (!Array.isArray(value)) return false
  const originalInstanceIds = new Set<string>()
  return value.every((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false
    const candidate = entry as Record<string, unknown>
    const originalProblem = candidate.originalProblem
    if (!originalProblem || typeof originalProblem !== 'object' || Array.isArray(originalProblem)) {
      return false
    }
    const problem = originalProblem as Record<string, unknown>
    const source = problem.applicationSource
    if (!source || typeof source !== 'object' || Array.isArray(source)) return false
    const applicationSource = source as Record<string, unknown>
    if (
      !Number.isSafeInteger(candidate.problemIndex) ||
      candidate.problemIndex !== problem.index ||
      typeof candidate.originalInstanceId !== 'string' ||
      candidate.originalInstanceId === '' ||
      typeof candidate.replacementInstanceId !== 'string' ||
      candidate.replacementInstanceId === '' ||
      candidate.originalInstanceId === candidate.replacementInstanceId ||
      applicationSource.schemaVersion !== 'generated-application-problem-v1' ||
      applicationSource.instanceId !== candidate.originalInstanceId ||
      !isProblemSnapshot(originalProblem) ||
      originalInstanceIds.has(candidate.originalInstanceId)
    ) {
      return false
    }
    originalInstanceIds.add(candidate.originalInstanceId)
    return true
  })
}

function isApplicationProblemRecoveryEvidence(
  value: unknown,
  grade: PracticeGrade,
): value is ApplicationProblemRecoveryEvidenceV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<ApplicationProblemRecoveryEvidenceV1>
  if (
    candidate.schemaVersion !== 'application-problem-recovery-evidence-v1' ||
    typeof candidate.evidenceId !== 'string' ||
    typeof candidate.sessionId !== 'string' ||
    candidate.sessionId === '' ||
    typeof candidate.conceptId !== 'string' ||
    candidate.conceptId === '' ||
    !['A', 'B', 'C'].includes(candidate.setId ?? '') ||
    !['standard', 'retry-wrong'].includes(candidate.mode ?? '') ||
    candidate.grade !== grade ||
    ![5, 10].includes(candidate.itemCount ?? 0) ||
    (candidate.sourceResultId !== undefined && typeof candidate.sourceResultId !== 'string') ||
    !Array.isArray(candidate.replacements) ||
    candidate.replacements.length === 0 ||
    !isApplicationProblemReplacementArchive(candidate.replacements) ||
    candidate.evidenceId !== `${candidate.sessionId}:${candidate.replacements.length}`
  ) {
    return false
  }
  return true
}

function isApplicationProblemRecoveryEvidenceArchive(
  value: unknown,
  grade: PracticeGrade,
): value is ApplicationProblemRecoveryEvidenceV1[] {
  if (!Array.isArray(value)) return false
  const evidenceIds = new Set<string>()
  return value.every((entry) => {
    if (!isApplicationProblemRecoveryEvidence(entry, grade)) return false
    if (evidenceIds.has(entry.evidenceId)) return false
    evidenceIds.add(entry.evidenceId)
    return true
  })
}

function isSessionSnapshot(value: unknown, grade: PracticeGrade): value is PracticeSession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<PracticeSession>
  const gradeContractMatches = hasCompatiblePracticeIdentity(candidate, grade)
  const problems = Array.isArray(candidate.problems) ? candidate.problems : []
  const problemsAreValid = problems.length > 0 &&
    problems.every((problem) => (
      isProblemSnapshot(problem) && problem.setId === candidate.setId
    ))
  const indexes = problemsAreValid
    ? new Set(problems.map((problem) => problem.index))
    : new Set<number>()
  const itemCount = resolvePracticeItemCount(candidate.itemCount, grade)
  const standardShapeMatches = candidate.mode === 'standard' &&
    candidate.sourceResultId === undefined &&
    candidate.sourceProblemIndexes === undefined &&
    problems.length === itemCount &&
    problems.every((problem, index) => problem.index === index)
  const retryIndexes = candidate.sourceProblemIndexes
  const retryShapeMatches = candidate.mode === 'retry-wrong' &&
    typeof candidate.sourceResultId === 'string' &&
    candidate.sourceResultId.trim() !== '' &&
    Array.isArray(retryIndexes) &&
    retryIndexes.length === problems.length &&
    problems.length >= 1 &&
    problems.length <= itemCount &&
    new Set(retryIndexes).size === retryIndexes.length &&
    retryIndexes.every((sourceIndex, index) => (
      Number.isSafeInteger(sourceIndex) &&
      sourceIndex >= 0 &&
      sourceIndex < itemCount &&
      problems[index]?.index === sourceIndex
    ))
  return gradeContractMatches
    && typeof candidate.sessionId === 'string'
    && typeof candidate.conceptId === 'string'
    && (candidate.setId === 'A' || candidate.setId === 'B' || candidate.setId === 'C')
    && (candidate.mode === 'standard' || candidate.mode === 'retry-wrong')
    && problemsAreValid
    && indexes.size === problems.length
    && (standardShapeMatches || retryShapeMatches)
    && Array.isArray(candidate.answers)
    && candidate.answers.length === problems.length
    && candidate.answers.every((answer) => answer === null || typeof answer === 'string')
    && (candidate.checkedAnswers === undefined || (
      Array.isArray(candidate.checkedAnswers) &&
      candidate.checkedAnswers.length === problems.length &&
      candidate.checkedAnswers.every((answer) => answer === null || typeof answer === 'boolean')
    ))
    && isApplicationProblemReplacementArchive(candidate.applicationProblemReplacementArchive)
    && Number.isSafeInteger(candidate.currentIndex)
    && (candidate.currentIndex ?? -1) >= 0
    && (candidate.currentIndex ?? Number.MAX_SAFE_INTEGER) < problems.length
    && typeof candidate.startedAt === 'number'
    && Number.isFinite(candidate.startedAt)
    && typeof candidate.expiresAt === 'number'
    && Number.isFinite(candidate.expiresAt)
    && candidate.startedAt <= candidate.expiresAt
}

function normalizeSessionSnapshot(
  parsed: PracticeSession,
  grade: PracticeGrade,
): PracticeSession {
  const checkedAnswers =
    Array.isArray(parsed.checkedAnswers) &&
    parsed.checkedAnswers.length === parsed.problems.length
      ? parsed.checkedAnswers.map((value) => (typeof value === 'boolean' ? value : null))
      : Array(parsed.problems.length).fill(null)
  return {
    ...parsed,
    checkedAnswers,
    grade: parsed.grade === undefined && grade === 5 ? undefined : grade,
    itemCount: resolvePracticeItemCount(parsed.itemCount, grade),
  }
}

function canonicalJson(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(canonicalJson)
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalJson(entry)]),
  )
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalJson(left)) === JSON.stringify(canonicalJson(right))
}

function isSubmissionResultSnapshot(value: unknown): value is SubmissionResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<SubmissionResult>
  return Number.isSafeInteger(candidate.index)
    && (candidate.index ?? -1) >= 0
    && typeof candidate.correct === 'boolean'
    && (candidate.userAnswer === null || typeof candidate.userAnswer === 'string')
    && typeof candidate.correctAnswer === 'string'
    && isStringArray(candidate.solutionSteps)
    && isProblemSnapshot(candidate.problem)
    && candidate.correctAnswer === candidate.problem.correctAnswer
    && sameJson(candidate.solutionSteps, candidate.problem.solutionSteps)
}

function isResultSnapshot(value: unknown, grade: PracticeGrade): value is SessionResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<SessionResult>
  if (
    !Number.isSafeInteger(candidate.score) ||
    !Number.isSafeInteger(candidate.total) ||
    !Number.isSafeInteger(candidate.wrongCount)
  ) {
    return false
  }
  const score = candidate.score as number
  const total = candidate.total as number
  const wrongCount = candidate.wrongCount as number
  const gradeContractMatches = hasCompatiblePracticeIdentity(candidate, grade)
  const results = Array.isArray(candidate.results) ? candidate.results : []
  const resultsAreValid = results.length > 0 &&
    results.every((result) => (
      isSubmissionResultSnapshot(result) && result.problem.setId === candidate.setId
    ))
  const correctCount = resultsAreValid
    ? results.filter((result) => result.correct).length
    : -1
  const itemCount = resolvePracticeItemCount(candidate.itemCount, grade)
  const resultIndexes = resultsAreValid
    ? new Set(results.map((result) => result.index))
    : new Set<number>()
  const sourceProblemIndexes = resultsAreValid
    ? new Set(results.map((result) => result.problem.index))
    : new Set<number>()
  const standardShapeMatches = candidate.mode === 'standard' &&
    results.length === itemCount &&
    results.every((result, index) => (
      result.index === index &&
      result.problem.index === index
    ))
  const retryShapeMatches = candidate.mode === 'retry-wrong' &&
    results.length >= 1 &&
    results.length <= itemCount &&
    resultIndexes.size === results.length &&
    sourceProblemIndexes.size === results.length &&
    results.every((result, index) => (
      result.index === index &&
      result.problem.index >= 0 &&
      result.problem.index < itemCount
    ))
  return gradeContractMatches
    && typeof candidate.sessionId === 'string'
    && typeof candidate.conceptId === 'string'
    && (candidate.setId === 'A' || candidate.setId === 'B' || candidate.setId === 'C')
    && (candidate.mode === 'standard' || candidate.mode === 'retry-wrong')
    && score >= 0
    && total === results.length
    && score === correctCount
    && wrongCount === total - score
    && resultsAreValid
    && (standardShapeMatches || retryShapeMatches)
    && typeof candidate.completedAt === 'number'
    && Number.isFinite(candidate.completedAt)
}

function existingStorageIsCompatible(
  key: string,
  grade: PracticeGrade,
  predicate: (value: unknown, grade: PracticeGrade) => boolean,
): boolean {
  const raw = localStorage.getItem(key)
  if (raw === null) return true
  try {
    return predicate(JSON.parse(raw), grade)
  } catch {
    return false
  }
}

export type PracticeStorageStatus = 'missing' | 'valid' | 'corrupt'

function storageSnapshotStatus(
  key: string,
  grade: PracticeGrade,
  predicate: (value: unknown, grade: PracticeGrade) => boolean,
): PracticeStorageStatus {
  if (typeof window === 'undefined') return 'missing'
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return 'missing'
    return predicate(JSON.parse(raw), grade) ? 'valid' : 'corrupt'
  } catch {
    return 'corrupt'
  }
}

export function getSessionStorageStatus(grade: PracticeGrade = 5): PracticeStorageStatus {
  return storageSnapshotStatus(sessionKey(grade), grade, isSessionSnapshot)
}

export function getResultStorageStatus(grade: PracticeGrade = 5): PracticeStorageStatus {
  return storageSnapshotStatus(resultKey(grade), grade, isResultSnapshot)
}

export function resolvePracticeGrade(value: unknown): PracticeGrade {
  return value === 6 ? 6 : 5
}

export function resolvePracticeItemCount(
  value: unknown,
  grade: PracticeGrade,
): PracticeItemCount {
  if (value === 5 || value === 10) return value
  return grade === 6 ? 5 : 10
}

// 세션 저장
export function saveSession(session: PracticeSession): boolean {
  if (typeof window === 'undefined') return false
  const grade = resolvePracticeGrade(session.grade)
  if (!isSessionSnapshot(session, grade)) return false
  const key = sessionKey(grade)
  if (!existingStorageIsCompatible(key, grade, isSessionSnapshot)) return false
  localStorage.setItem(key, JSON.stringify(session))
  return true
}

export function persistApplicationProblemRecoveryEvidence(
  session: PracticeSession,
): boolean {
  const replacements = session.applicationProblemReplacementArchive
  if (replacements === undefined || replacements.length === 0) return true
  if (typeof window === 'undefined') return false
  const grade = resolvePracticeGrade(session.grade)
  if (!isSessionSnapshot(session, grade)) return false

  const record: ApplicationProblemRecoveryEvidenceV1 = {
    schemaVersion: 'application-problem-recovery-evidence-v1',
    evidenceId: `${session.sessionId}:${replacements.length}`,
    sessionId: session.sessionId,
    conceptId: session.conceptId,
    setId: session.setId,
    mode: session.mode,
    grade,
    itemCount: resolvePracticeItemCount(session.itemCount, grade),
    ...(session.sourceResultId === undefined ? {} : { sourceResultId: session.sourceResultId }),
    replacements,
  }
  const key = recoveryEvidenceKey(grade)
  try {
    const raw = localStorage.getItem(key)
    const archive = raw === null ? [] : JSON.parse(raw) as unknown
    if (!isApplicationProblemRecoveryEvidenceArchive(archive, grade)) return false
    const existing = archive.find((entry) => entry.evidenceId === record.evidenceId)
    if (existing) return sameJson(existing, record)
    localStorage.setItem(key, JSON.stringify([...archive, record]))
    return true
  } catch {
    return false
  }
}

export function persistRecoveredPracticeSession(
  original: PracticeSession,
  recovered: PracticeSession,
): boolean {
  if (typeof window === 'undefined') return false
  const grade = resolvePracticeGrade(original.grade)
  if (
    resolvePracticeGrade(recovered.grade) !== grade ||
    recovered.sessionId !== original.sessionId ||
    recovered.conceptId !== original.conceptId ||
    recovered.setId !== original.setId ||
    recovered.mode !== original.mode ||
    recovered.startedAt !== original.startedAt ||
    recovered.expiresAt !== original.expiresAt ||
    recovered.problems.length !== original.problems.length ||
    recovered.answers.length !== recovered.problems.length ||
    recovered.checkedAnswers.length !== recovered.problems.length ||
    (recovered.applicationProblemReplacementArchive?.length ?? 0) <=
      (original.applicationProblemReplacementArchive?.length ?? 0) ||
    !isSessionSnapshot(recovered, grade)
  ) {
    return false
  }

  const key = sessionKey(grade)
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return false
    const parsed = JSON.parse(raw) as unknown
    if (!isSessionSnapshot(parsed, grade)) return false
    if (!sameJson(normalizeSessionSnapshot(parsed, grade), original)) return false
    if (!persistApplicationProblemRecoveryEvidence(recovered)) return false
    const currentRaw = localStorage.getItem(key)
    if (currentRaw === null) return false
    const current = JSON.parse(currentRaw) as unknown
    if (!isSessionSnapshot(current, grade)) return false
    if (!sameJson(normalizeSessionSnapshot(current, grade), original)) return false
    localStorage.setItem(key, JSON.stringify(recovered))
    return true
  } catch {
    return false
  }
}

// 세션 로드
export function loadSession(grade: PracticeGrade = 5): PracticeSession | null {
  if (typeof window === 'undefined') return null

  try {
    const data = localStorage.getItem(sessionKey(grade))
    if (!data) return null

    const parsed = JSON.parse(data) as PracticeSession
    if (!isSessionSnapshot(parsed, grade)) return null
    const session = normalizeSessionSnapshot(parsed, grade)

    // Application snapshots must pass the semantic/release gate before their
    // stored bytes may be removed. The practice screen performs that preflight
    // and explicitly clears an eligible expired session afterwards.
    if (isSessionExpired(session)) {
      if (session.problems.some(hasApplicationProblemFootprint)) {
        return session
      }
      clearSession(grade)
      return null
    }

    return session
  } catch {
    return null
  }
}

// 세션 삭제
export function clearSession(grade: PracticeGrade = 5): void {
  if (typeof window === 'undefined') return
  const key = sessionKey(grade)
  if (!existingStorageIsCompatible(key, grade, isSessionSnapshot)) return
  localStorage.removeItem(key)
}

export function resetGrade6SessionStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GRADE6_SESSION_KEY)
}

export function resetGrade5SessionStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GRADE5_SESSION_KEY)
}

// 세션 만료 체크
export function isSessionExpired(session: PracticeSession): boolean {
  return Date.now() > session.expiresAt
}

// 새 세션 생성 시간 정보
export function createSessionTiming(now = Date.now()): { startedAt: number; expiresAt: number } {
  const startedAt = now
  return {
    startedAt,
    expiresAt: startedAt + SESSION_DURATION
  }
}

// 세션 ID 생성
export function createSessionId(now = Date.now(), grade: PracticeGrade = 5): string {
  return `${grade === 6 ? 'grade6_session' : 'session'}_${now}_${Math.random().toString(36).slice(2, 11)}`
}

// 결과 저장
export function saveResult(result: SessionResult): boolean {
  if (typeof window === 'undefined') return false
  const grade = resolvePracticeGrade(result.grade)
  if (!isResultSnapshot(result, grade)) return false
  const key = resultKey(grade)
  if (!existingStorageIsCompatible(key, grade, isResultSnapshot)) return false
  localStorage.setItem(key, JSON.stringify(result))
  return true
}

// 결과 로드
export function loadResult(grade: PracticeGrade = 5): SessionResult | null {
  if (typeof window === 'undefined') return null

  try {
    const data = localStorage.getItem(resultKey(grade))
    if (!data) return null
    const parsed = JSON.parse(data) as SessionResult
    if (!isResultSnapshot(parsed, grade)) return null
    return {
      ...parsed,
      grade: parsed.grade === undefined && grade === 5 ? undefined : grade,
      itemCount: resolvePracticeItemCount(parsed.itemCount, grade),
    }
  } catch {
    return null
  }
}

// 결과 삭제
export function clearResult(grade: PracticeGrade = 5): void {
  if (typeof window === 'undefined') return
  const key = resultKey(grade)
  if (!existingStorageIsCompatible(key, grade, isResultSnapshot)) return
  localStorage.removeItem(key)
}

export function resetGrade6ResultStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GRADE6_RESULT_KEY)
}

export function resetGrade5ResultStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GRADE5_RESULT_KEY)
}

// 답안 업데이트
export function updateAnswer(session: PracticeSession, index: number, answer: string): PracticeSession {
  if (session.checkedAnswers[index] !== null) return session

  const newAnswers = [...session.answers]
  newAnswers[index] = answer
  return { ...session, answers: newAnswers }
}

// 문제별 정답 확인 상태 저장
export function markAnswerChecked(
  session: PracticeSession,
  index: number,
  correct: boolean
): PracticeSession {
  if (index < 0 || index >= session.problems.length) return session
  if (session.checkedAnswers[index] !== null) return session

  const checkedAnswers = [...session.checkedAnswers]
  checkedAnswers[index] = correct
  return { ...session, checkedAnswers }
}

// 현재 문제 인덱스 업데이트
export function updateCurrentIndex(session: PracticeSession, index: number): PracticeSession {
  return { ...session, currentIndex: index }
}

// 요청한 세션과 현재 저장된 세션이 같은지 확인
export function matchesSessionRequest(
  session: PracticeSession,
  request: {
    conceptId: string
    setId: 'A' | 'B' | 'C'
    mode: PracticeSession['mode']
    sourceResultId?: string
    grade?: PracticeGrade
    itemCount?: PracticeItemCount
  }
): boolean {
  if (session.conceptId !== request.conceptId) return false
  if (session.setId !== request.setId) return false
  if (session.mode !== request.mode) return false
  const sessionGrade = resolvePracticeGrade(session.grade)
  const requestGrade = resolvePracticeGrade(request.grade)
  if (sessionGrade !== requestGrade) return false
  if (
    resolvePracticeItemCount(session.itemCount, sessionGrade) !==
    resolvePracticeItemCount(request.itemCount, requestGrade)
  ) return false

  if (request.mode === 'retry-wrong') {
    return session.sourceResultId === request.sourceResultId
  }

  return true
}

// 마지막 결과에서 오답만 다시 푸는 세션 생성
export function createRetrySessionFromResult(
  result: SessionResult,
  now = Date.now()
): PracticeSession | null {
  const wrongResults = result.results.filter((entry) => !entry.correct)

  if (wrongResults.length === 0) {
    return null
  }

  const timing = createSessionTiming(now)

  return {
    sessionId: createSessionId(now, resolvePracticeGrade(result.grade)),
    conceptId: result.conceptId,
    setId: result.setId,
    mode: 'retry-wrong',
    grade: result.grade,
    itemCount: resolvePracticeItemCount(result.itemCount, resolvePracticeGrade(result.grade)),
    sourceResultId: result.sessionId,
    sourceProblemIndexes: wrongResults.map((entry) => entry.problem.index),
    problems: wrongResults.map((entry) => entry.problem),
    answers: Array(wrongResults.length).fill(null),
    checkedAnswers: Array(wrongResults.length).fill(null),
    currentIndex: 0,
    ...timing
  }
}

// 세션 제출 결과 조립
export function buildSessionResult(
  session: PracticeSession,
  results: SubmissionResult[],
  completedAt = Date.now()
): SessionResult {
  const score = results.filter((entry) => entry.correct).length

  return {
    sessionId: session.sessionId,
    conceptId: session.conceptId,
    setId: session.setId,
    mode: session.mode,
    grade: session.grade,
    itemCount: resolvePracticeItemCount(session.itemCount, resolvePracticeGrade(session.grade)),
    score,
    total: results.length,
    wrongCount: results.length - score,
    results,
    completedAt
  }
}
