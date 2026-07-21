/**
 * 세션 관리 - localStorage 기반
 */

import type {
  PracticeGrade,
  PracticeItemCount,
  PracticeSession,
  SessionResult,
  SubmissionResult,
} from './types'

export const GRADE5_SESSION_KEY = 'mathAssist_currentSession'
export const GRADE5_RESULT_KEY = 'mathAssist_lastResult'
export const GRADE6_SESSION_KEY = 'mathAssist_grade6CurrentSession'
export const GRADE6_RESULT_KEY = 'mathAssist_grade6LastResult'
const SESSION_DURATION = 2 * 60 * 60 * 1000 // 2시간

function sessionKey(grade: PracticeGrade): string {
  return grade === 6 ? GRADE6_SESSION_KEY : GRADE5_SESSION_KEY
}

function resultKey(grade: PracticeGrade): string {
  return grade === 6 ? GRADE6_RESULT_KEY : GRADE5_RESULT_KEY
}

function isSessionSnapshot(value: unknown, grade: PracticeGrade): value is PracticeSession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<PracticeSession>
  return resolvePracticeGrade(candidate.grade) === grade
    && (grade === 5 || (candidate.grade === 6 && (candidate.itemCount === 5 || candidate.itemCount === 10)))
    && typeof candidate.sessionId === 'string'
    && typeof candidate.conceptId === 'string'
    && (candidate.setId === 'A' || candidate.setId === 'B' || candidate.setId === 'C')
    && (candidate.mode === 'standard' || candidate.mode === 'retry-wrong')
    && Array.isArray(candidate.problems)
    && Array.isArray(candidate.answers)
    && candidate.answers.length === candidate.problems.length
    && Number.isInteger(candidate.currentIndex)
    && typeof candidate.startedAt === 'number'
    && typeof candidate.expiresAt === 'number'
}

function isResultSnapshot(value: unknown, grade: PracticeGrade): value is SessionResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<SessionResult>
  return resolvePracticeGrade(candidate.grade) === grade
    && (grade === 5 || (candidate.grade === 6 && (candidate.itemCount === 5 || candidate.itemCount === 10)))
    && typeof candidate.sessionId === 'string'
    && typeof candidate.conceptId === 'string'
    && (candidate.setId === 'A' || candidate.setId === 'B' || candidate.setId === 'C')
    && (candidate.mode === 'standard' || candidate.mode === 'retry-wrong')
    && Number.isInteger(candidate.score)
    && Number.isInteger(candidate.total)
    && Number.isInteger(candidate.wrongCount)
    && Array.isArray(candidate.results)
    && typeof candidate.completedAt === 'number'
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
  const key = sessionKey(grade)
  if (!existingStorageIsCompatible(key, grade, isSessionSnapshot)) return false
  localStorage.setItem(key, JSON.stringify(session))
  return true
}

// 세션 로드
export function loadSession(grade: PracticeGrade = 5): PracticeSession | null {
  if (typeof window === 'undefined') return null

  try {
    const data = localStorage.getItem(sessionKey(grade))
    if (!data) return null

    const parsed = JSON.parse(data) as PracticeSession
    if (!isSessionSnapshot(parsed, grade)) return null
    const checkedAnswers = Array.isArray(parsed.checkedAnswers) && parsed.checkedAnswers.length === parsed.problems.length
      ? parsed.checkedAnswers.map(value => typeof value === 'boolean' ? value : null)
      : Array(parsed.problems.length).fill(null)
    const session = {
      ...parsed,
      checkedAnswers,
      grade: parsed.grade === undefined && grade === 5 ? undefined : grade,
      itemCount: resolvePracticeItemCount(parsed.itemCount, grade),
    }

    // 만료 체크
    if (isSessionExpired(session)) {
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
