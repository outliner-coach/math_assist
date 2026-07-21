import { grade2Units } from './grade2-problems'
import { grade3Units } from './grade3-problems'
import { grade4Units } from './grade4-problems'
import type { LearningActivitySession, LearningProgressProjection } from './learning-activity'
import { createLocalProgressRepository } from './local-progress-repository'

export const GUEST_HOME_PREFERENCES_KEY = 'mathAssist_guestHome_v1'

const GRADE1_PROGRESS_KEY = 'mathAssist_grade1Progress'
const GRADE2_PROGRESS_KEY = 'mathAssist_grade2Progress'
const GRADE3_PROGRESS_KEY = 'mathAssist_grade3Progress'
const GRADE4_PROGRESS_KEY = 'mathAssist_grade4Progress'
const GRADE5_SESSION_KEY = 'mathAssist_currentSession'
const GRADE6_SESSION_KEY = 'mathAssist_grade6CurrentSession'

export const SUPPORTED_GRADES = [1, 2, 3, 4, 5, 6] as const
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

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function supportedGrade(value: unknown): SupportedGrade | null {
  return SUPPORTED_GRADES.find((grade) => grade === value) ?? null
}

function grade1Summary(
  storage: GuestHomeStorage | null,
  projection: LearningProgressProjection,
): GradeHomeSummary {
  const progress = parseRecord(storage, GRADE1_PROGRESS_KEY)
  const completed = [...projection.completed]
  const review = [...projection.review]
  const latest = stringValue(progress?.latestStageId)
  const hasProgress = completed.length > 0 || review.length > 0 || latest !== null

  return {
    grade: 1,
    hasProgress,
    lastPlayedAt: hasProgress ? projection.lastActivityAt : null,
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

function grade2Summary(
  storage: GuestHomeStorage | null,
  projection: LearningProgressProjection,
): GradeHomeSummary {
  const progress = parseRecord(storage, GRADE2_PROGRESS_KEY)
  const completed = [...projection.completed]
  const review = [...projection.review]
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
    lastPlayedAt: hasProgress ? projection.lastActivityAt : null,
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

function grade3Summary(
  storage: GuestHomeStorage | null,
  projection: LearningProgressProjection,
): GradeHomeSummary {
  const progress = parseRecord(storage, GRADE3_PROGRESS_KEY)
  const completed = [...projection.completed]
  const review = [...projection.review]
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
    lastPlayedAt: hasProgress ? projection.lastActivityAt : null,
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

function grade5Summary(
  storage: GuestHomeStorage | null,
  projection: LearningProgressProjection,
  session: LearningActivitySession | null,
): GradeHomeSummary {
  const rawSession = parseRecord(storage, GRADE5_SESSION_KEY)
  const sessionSetId = stringValue(rawSession?.setId)
  const hasActiveSession = session?.status === 'active'
  const conceptId = session?.activityId ?? projection.resume?.activityId ?? null
  const setId = sessionSetId === 'B' || sessionSetId === 'C' ? sessionSetId : 'A'
  const hasProgress = projection.completed.length > 0 || hasActiveSession
  const reviewCount = projection.review.length

  return {
    grade: 5,
    hasProgress,
    lastPlayedAt: projection.lastActivityAt,
    completedCount: projection.completed.length,
    reviewCount,
    todaySolvedCount: null,
    continueTitle: hasActiveSession ? '풀던 10문제를 이어가요' : hasProgress ? '최근 개념을 다시 확인해요' : '5학년 단원을 골라요',
    continueDescription: hasActiveSession
      ? '답은 이 기기에 저장되어 있어요. 멈춘 문제부터 계속 풀 수 있어요.'
      : hasProgress
        ? `연습한 개념 ${projection.completed.length}개 · 복습할 개념 ${reviewCount}개`
        : '개념을 짧게 읽고 10문제 연습으로 바로 확인해요.',
    continueHref: hasActiveSession && conceptId
      ? `/practice/${encodeURIComponent(conceptId)}?set=${setId}`
      : conceptId
        ? `/concept/${encodeURIComponent(conceptId)}`
        : '/grade/5',
    continueLabel: hasActiveSession ? '문제 이어서 풀기' : hasProgress ? '최근 개념 보기' : '단원 고르기',
  }
}

function grade6Summary(
  storage: GuestHomeStorage | null,
  projection: LearningProgressProjection,
  session: LearningActivitySession | null,
): GradeHomeSummary {
  const rawSession = parseRecord(storage, GRADE6_SESSION_KEY)
  const rawSetId = stringValue(rawSession?.setId)
  const setId = rawSetId === 'B' || rawSetId === 'C' ? rawSetId : 'A'
  const rawCount = numberValue(rawSession?.itemCount)
  const itemCount = rawCount === 10 ? 10 : 5
  const hasActiveSession = session?.status === 'active'
  const conceptId = session?.activityId ?? projection.resume?.activityId ?? null
  const hasProgress = projection.completed.length > 0 || hasActiveSession
  const reviewCount = projection.review.length

  return {
    grade: 6,
    hasProgress,
    lastPlayedAt: projection.lastActivityAt,
    completedCount: projection.completed.length,
    reviewCount,
    todaySolvedCount: null,
    continueTitle: hasActiveSession
      ? `풀던 ${itemCount}문제를 이어가요`
      : hasProgress
        ? '최근 비와 비율을 다시 확인해요'
        : '6학년 Study를 시작해요',
    continueDescription: hasActiveSession
      ? '답과 풀이장은 이 기기에 저장되어 있어요. 멈춘 문제부터 계속 풀 수 있어요.'
      : hasProgress
        ? `연습한 개념 ${projection.completed.length}개 · 복습할 개념 ${reviewCount}개`
        : '비와 비율 개념을 확인하고 5문제부터 가볍게 시작해요.',
    continueHref: hasActiveSession && conceptId
      ? `/practice/${encodeURIComponent(conceptId)}?set=${setId}&count=${itemCount}`
      : conceptId
        ? `/concept/${encodeURIComponent(conceptId)}`
        : '/grade/6',
    continueLabel: hasActiveSession ? '문제 이어서 풀기' : hasProgress ? '최근 개념 보기' : 'Study 시작',
  }
}

function grade4Summary(
  storage: GuestHomeStorage | null,
  projection: LearningProgressProjection,
): GradeHomeSummary {
  const progress = parseRecord(storage, GRADE4_PROGRESS_KEY)
  const completed = [...projection.completed]
  const review = [...projection.review]
  const latest = stringValue(progress?.latestMissionId)
  const selectedUnitId = stringValue(progress?.selectedUnitId)
  const selectedUnit = grade4Units.find((unit) => unit.id === selectedUnitId)
  const hasProgress = completed.length > 0 || review.length > 0 || latest !== null
  const continueHref = selectedUnit
    ? `/grade/4/mission?unitId=${encodeURIComponent(selectedUnit.id)}`
    : '/grade/4'

  return {
    grade: 4,
    hasProgress,
    lastPlayedAt: hasProgress ? projection.lastActivityAt : null,
    completedCount: completed.length,
    reviewCount: review.length,
    todaySolvedCount: hasProgress ? numberValue(progress?.todaySolvedCount) ?? 0 : null,
    continueTitle: selectedUnit
      ? hasProgress ? `${selectedUnit.title} 활동 이어하기` : `${selectedUnit.title} 첫 활동`
      : '4학년 Bridge 단원을 골라요',
    continueDescription: review.length > 0
      ? `다시 볼 문제 ${review.length}개를 자리표와 수직선으로 확인해요.`
      : hasProgress
        ? `해결한 문제 ${completed.length}개 · 알기·적용·추론을 한 문제씩 이어가요.`
        : '큰 수를 자리표와 수직선으로 확인하고 3문제 활동을 시작해요.',
    continueHref,
    continueLabel: hasProgress ? '활동 이어서 하기' : selectedUnit ? '첫 활동 시작' : '단원 고르기',
  }
}

export function loadGuestHomeState(
  storage: GuestHomeStorage | null = browserStorage(),
  now = Date.now()
): GuestHomeState {
  const repository = createLocalProgressRepository(storage)
  const projections = repository.readAllProgress(now)
  const summaries = {
    1: grade1Summary(storage, projections[1]),
    2: grade2Summary(storage, projections[2]),
    3: grade3Summary(storage, projections[3]),
    4: grade4Summary(storage, projections[4]),
    5: grade5Summary(storage, projections[5], repository.readSession(5, now)),
    6: grade6Summary(storage, projections[6], repository.readSession(6, now)),
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
