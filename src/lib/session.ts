/**
 * 세션 관리 - localStorage 기반
 */

import type { PracticeSession, SessionResult } from './types'

const SESSION_KEY = 'mathAssist_currentSession'
const RESULT_KEY = 'mathAssist_lastResult'
const SESSION_DURATION = 2 * 60 * 60 * 1000 // 2시간

// 세션 저장
export function saveSession(session: PracticeSession): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

// 세션 로드
export function loadSession(): PracticeSession | null {
  if (typeof window === 'undefined') return null

  try {
    const data = localStorage.getItem(SESSION_KEY)
    if (!data) return null

    const session = JSON.parse(data) as PracticeSession

    // 만료 체크
    if (isSessionExpired(session)) {
      clearSession()
      return null
    }

    return session
  } catch {
    return null
  }
}

// 세션 삭제
export function clearSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

// 세션 만료 체크
export function isSessionExpired(session: PracticeSession): boolean {
  return Date.now() > session.expiresAt
}

// 새 세션 생성 시간 정보
export function createSessionTiming(): { startedAt: number; expiresAt: number } {
  const startedAt = Date.now()
  return {
    startedAt,
    expiresAt: startedAt + SESSION_DURATION
  }
}

// 결과 저장
export function saveResult(result: SessionResult): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(RESULT_KEY, JSON.stringify(result))
}

// 결과 로드
export function loadResult(): SessionResult | null {
  if (typeof window === 'undefined') return null

  try {
    const data = localStorage.getItem(RESULT_KEY)
    if (!data) return null
    return JSON.parse(data) as SessionResult
  } catch {
    return null
  }
}

// 결과 삭제
export function clearResult(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(RESULT_KEY)
}

// 답안 업데이트
export function updateAnswer(session: PracticeSession, index: number, answer: string): PracticeSession {
  const newAnswers = [...session.answers]
  newAnswers[index] = answer
  return { ...session, answers: newAnswers }
}

// 현재 문제 인덱스 업데이트
export function updateCurrentIndex(session: PracticeSession, index: number): PracticeSession {
  return { ...session, currentIndex: index }
}
