import { grade2Units } from './grade2-problems'
import { grade3Units } from './grade3-problems'

export const GUEST_HOME_PREFERENCES_KEY = 'mathAssist_guestHome_v1'

const GRADE1_PROGRESS_KEY = 'mathAssist_grade1Progress'
const GRADE2_PROGRESS_KEY = 'mathAssist_grade2Progress'
const GRADE3_PROGRESS_KEY = 'mathAssist_grade3Progress'
const GRADE5_PROGRESS_KEY = 'mathAssist_progress_v1'
const GRADE5_SESSION_KEY = 'mathAssist_currentSession'

export const SUPPORTED_GRADES = [1, 2, 3, 5] as const
export type SupportedGrade = (typeof SUPPORTED_GRADES)[number]

export interface GuestHomeStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface GradeHomeSummary {
  grade: SupportedGrade
  hasProgress: boolean
  lastPlayedAt: number | null
  completedCount: number
  reviewCount: number
  todaySolvedCount: number | null
  continueTitle: string
  continueDescription: string
  continueHref: string
  continueLabel: string
}

export interface GuestHomeState {
  activeGrade: SupportedGrade | null
  hasAnyProgress: boolean
  summaries: Record<SupportedGrade, GradeHomeSummary>
}

type JsonRecord = Record<string, unknown>

function browserStorage(): GuestHomeStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function parseRecord(storage: GuestHomeStorage | null, key: string): JsonRecord | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as JsonRecord
      : null
  } catch {
    return null
  }
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function supportedGrade(value: unknown): SupportedGrade | null {
  return SUPPORTED_GRADES.find((grade) => grade === value) ?? null
}

function grade1Summary(storage: GuestHomeStorage | null): GradeHomeSummary {
  const progress = parseRecord(storage, GRADE1_PROGRESS_KEY)
  const completed = stringList(progress?.completedStageIds)
  const review = stringList(progress?.reviewStageIds)
  const latest = stringValue(progress?.latestStageId)
  const hasProgress = completed.length > 0 || review.length > 0 || latest !== null

  return {
    grade: 1,
    hasProgress,
    lastPlayedAt: hasProgress ? numberValue(progress?.lastPlayedAt) : null,
    completedCount: completed.length,
    reviewCount: review.length,
    todaySolvedCount: hasProgress ? numberValue(progress?.todaySolvedCount) ?? 0 : null,
    continueTitle: review.length > 0 ? '다시 볼 미션이 기다리고 있어요' : '숫자 탐험섬을 이어가요',
    continueDescription: hasProgress
      ? `완료한 미션 ${completed.length}개 · 탐험 지도에서 다음 길을 열어요.`
      : '큰 그림과 버튼을 따라 첫 번째 숫자 미션부터 시작해요.',
    continueHref: '/grade/1',
    continueLabel: hasProgress ? '탐험 이어서 하기' : '첫 미션 시작',
  }
}

function grade2Summary(storage: GuestHomeStorage | null): GradeHomeSummary {
  const progress = parseRecord(storage, GRADE2_PROGRESS_KEY)
  const completed = stringList(progress?.completedMissionIds)
  const review = stringList(progress?.reviewMissionIds)
  const latest = stringValue(progress?.latestMissionId)
  const selectedUnitId = stringValue(progress?.selectedUnitId)
  const selectedUnit = grade2Units.find((unit) => unit.id === selectedUnitId)
  const hasProgress = completed.length > 0 || review.length > 0 || latest !== null
  const continueHref = selectedUnit
    ? `/grade/2/mission?unitId=${encodeURIComponent(selectedUnit.id)}`
    : '/grade/2'

  return {
    grade: 2,
    hasProgress,
    lastPlayedAt: hasProgress ? numberValue(progress?.lastPlayedAt) : null,
    completedCount: completed.length,
    reviewCount: review.length,
    todaySolvedCount: hasProgress ? numberValue(progress?.todaySolvedCount) ?? 0 : null,
    continueTitle: selectedUnit
      ? hasProgress ? `${selectedUnit.title} 미션 이어하기` : `${selectedUnit.title} 첫 미션`
      : '2학년 탐험 단원을 골라요',
    continueDescription: review.length > 0
      ? `다시 볼 미션 ${review.length}개가 있어요. 천천히 한 문제씩 풀어 봐요.`
      : hasProgress
        ? `완료한 미션 ${completed.length}개 · 다음 미션으로 탐험을 이어가요.`
        : '자리값, 길이, 시각, 그래프 중 재미있는 단원부터 골라요.',
    continueHref,
    continueLabel: hasProgress ? '이어서 풀기' : selectedUnit ? '첫 미션 시작' : '단원 고르기',
  }
}

function grade3Summary(storage: GuestHomeStorage | null): GradeHomeSummary {
  const progress = parseRecord(storage, GRADE3_PROGRESS_KEY)
  const completed = stringList(progress?.completedMissionIds)
  const review = stringList(progress?.reviewMissionIds)
  const latest = stringValue(progress?.latestMissionId)
  const selectedUnitId = stringValue(progress?.selectedUnitId)
  const selectedUnit = grade3Units.find((unit) => unit.id === selectedUnitId)
  const hasProgress = completed.length > 0 || review.length > 0 || latest !== null
  const continueHref = selectedUnit
    ? `/grade/3/mission?unitId=${encodeURIComponent(selectedUnit.id)}`
    : '/grade/3'

  return {
    grade: 3,
    hasProgress,
    lastPlayedAt: hasProgress ? numberValue(progress?.lastPlayedAt) : null,
    completedCount: completed.length,
    reviewCount: review.length,
    todaySolvedCount: hasProgress ? numberValue(progress?.todaySolvedCount) ?? 0 : null,
    continueTitle: selectedUnit
      ? hasProgress ? `${selectedUnit.title} 미션 이어하기` : `${selectedUnit.title} 첫 미션`
      : '3학년 탐험 단원을 골라요',
    continueDescription: review.length > 0
      ? `다시 볼 미션 ${review.length}개를 그림과 답 칸으로 차근차근 확인해요.`
      : hasProgress
        ? `완료한 미션 ${completed.length}개 · 다음 미션으로 탐험을 이어가요.`
        : '도형, 분수, 측정, 그래프를 그림으로 확인하며 시작해요.',
    continueHref,
    continueLabel: hasProgress ? '이어서 풀기' : selectedUnit ? '첫 미션 시작' : '단원 고르기',
  }
}

function grade5Summary(storage: GuestHomeStorage | null, now: number): GradeHomeSummary {
  const progress = parseRecord(storage, GRADE5_PROGRESS_KEY) ?? {}
  const progressEntries = Object.values(progress).filter(
    (value): value is JsonRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  )
  const reviewCount = progressEntries.filter((entry) => entry.needsReview === true).length
  const latestProgress = progressEntries
    .slice()
    .sort((a, b) => (numberValue(b.lastCompletedAt) ?? 0) - (numberValue(a.lastCompletedAt) ?? 0))[0]
  const session = parseRecord(storage, GRADE5_SESSION_KEY)
  const sessionExpiresAt = numberValue(session?.expiresAt)
  const sessionConceptId = stringValue(session?.conceptId)
  const sessionSetId = stringValue(session?.setId)
  const hasActiveSession = Boolean(
    session && sessionConceptId && sessionExpiresAt && sessionExpiresAt > now
  )
  const latestConceptId = stringValue(latestProgress?.conceptId)
  const conceptId = hasActiveSession ? sessionConceptId : latestConceptId
  const setId = sessionSetId === 'B' || sessionSetId === 'C' ? sessionSetId : 'A'
  const hasProgress = progressEntries.length > 0 || hasActiveSession
  const lastPlayedAt = Math.max(
    numberValue(latestProgress?.lastCompletedAt) ?? 0,
    hasActiveSession ? numberValue(session?.startedAt) ?? 0 : 0
  ) || null

  return {
    grade: 5,
    hasProgress,
    lastPlayedAt,
    completedCount: progressEntries.length,
    reviewCount,
    todaySolvedCount: null,
    continueTitle: hasActiveSession ? '풀던 10문제를 이어가요' : hasProgress ? '최근 개념을 다시 확인해요' : '5학년 단원을 골라요',
    continueDescription: hasActiveSession
      ? '답은 이 기기에 저장되어 있어요. 멈춘 문제부터 계속 풀 수 있어요.'
      : hasProgress
        ? `연습한 개념 ${progressEntries.length}개 · 복습할 개념 ${reviewCount}개`
        : '개념을 짧게 읽고 10문제 연습으로 바로 확인해요.',
    continueHref: hasActiveSession && conceptId
      ? `/practice/${encodeURIComponent(conceptId)}?set=${setId}`
      : conceptId
        ? `/concept/${encodeURIComponent(conceptId)}`
        : '/grade/5',
    continueLabel: hasActiveSession ? '문제 이어서 풀기' : hasProgress ? '최근 개념 보기' : '단원 고르기',
  }
}

export function loadGuestHomeState(
  storage: GuestHomeStorage | null = browserStorage(),
  now = Date.now()
): GuestHomeState {
  const summaries = {
    1: grade1Summary(storage),
    2: grade2Summary(storage),
    3: grade3Summary(storage),
    5: grade5Summary(storage, now),
  } satisfies Record<SupportedGrade, GradeHomeSummary>
  const preferences = parseRecord(storage, GUEST_HOME_PREFERENCES_KEY)
  const preferredGrade = supportedGrade(preferences?.activeGrade)
  const mostRecentGrade = SUPPORTED_GRADES
    .filter((grade) => summaries[grade].hasProgress)
    .sort((left, right) => (
      (summaries[right].lastPlayedAt ?? 0) - (summaries[left].lastPlayedAt ?? 0)
    ))[0] ?? null

  return {
    activeGrade: preferredGrade ?? mostRecentGrade,
    hasAnyProgress: SUPPORTED_GRADES.some((grade) => summaries[grade].hasProgress),
    summaries,
  }
}

export function saveActiveGrade(
  grade: SupportedGrade,
  storage: GuestHomeStorage | null = browserStorage()
): boolean {
  if (!storage) return false
  try {
    storage.setItem(GUEST_HOME_PREFERENCES_KEY, JSON.stringify({ activeGrade: grade }))
    return true
  } catch {
    return false
  }
}
