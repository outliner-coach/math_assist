import type { Grade3Mission } from './grade3-problems'

export const GRADE3_PROGRESS_KEY = 'mathAssist_grade3Progress'
export const GRADE3_PROGRESS_SCHEMA_VERSION = 1

export interface Grade3SkillSummary {
  attempted: number
  correct: number
}

export interface Grade3Progress {
  schemaVersion: number
  completedMissionIds: string[]
  reviewMissionIds: string[]
  latestMissionId: string | null
  selectedUnitId: string | null
  todaySolvedCount: number
  skillSummaryByTag: Record<string, Grade3SkillSummary>
  introDismissedAt: number | null
  lastPlayedAt: number | null
}

export interface Grade3ProgressLoadResult {
  progress: Grade3Progress
  storageAvailable: boolean
  recovered: boolean
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function createInitialGrade3Progress(now = Date.now()): Grade3Progress {
  return {
    schemaVersion: GRADE3_PROGRESS_SCHEMA_VERSION,
    completedMissionIds: [],
    reviewMissionIds: [],
    latestMissionId: null,
    selectedUnitId: null,
    todaySolvedCount: 0,
    skillSummaryByTag: {},
    introDismissedAt: null,
    lastPlayedAt: now,
  }
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isSameLocalDay(a: number | null, b: number): boolean {
  if (!a) return false
  const left = new Date(a)
  const right = new Date(b)
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return Array.from(new Set(values.filter((id): id is string => typeof id === 'string')))
}

function normalizeProgress(value: unknown, now: number): Grade3Progress | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<Grade3Progress>
  if (candidate.schemaVersion !== GRADE3_PROGRESS_SCHEMA_VERSION) return null
  if (!Array.isArray(candidate.completedMissionIds)) return null
  if (!Array.isArray(candidate.reviewMissionIds)) return null
  if (
    candidate.latestMissionId !== null &&
    candidate.latestMissionId !== undefined &&
    typeof candidate.latestMissionId !== 'string'
  ) return null
  if (
    candidate.selectedUnitId !== null &&
    candidate.selectedUnitId !== undefined &&
    typeof candidate.selectedUnitId !== 'string'
  ) return null
  if (!candidate.skillSummaryByTag || typeof candidate.skillSummaryByTag !== 'object') return null

  return {
    schemaVersion: GRADE3_PROGRESS_SCHEMA_VERSION,
    completedMissionIds: uniqueStrings(candidate.completedMissionIds),
    reviewMissionIds: uniqueStrings(candidate.reviewMissionIds),
    latestMissionId: candidate.latestMissionId ?? null,
    selectedUnitId: candidate.selectedUnitId ?? null,
    todaySolvedCount: isSameLocalDay(candidate.lastPlayedAt ?? null, now)
      ? Number(candidate.todaySolvedCount ?? 0)
      : 0,
    skillSummaryByTag: candidate.skillSummaryByTag as Record<string, Grade3SkillSummary>,
    introDismissedAt: typeof candidate.introDismissedAt === 'number' ? candidate.introDismissedAt : null,
    lastPlayedAt: typeof candidate.lastPlayedAt === 'number' ? candidate.lastPlayedAt : now,
  }
}

export function loadGrade3Progress(
  storage: StorageLike | null = getBrowserStorage(),
  now = Date.now()
): Grade3ProgressLoadResult {
  if (!storage) {
    return { progress: createInitialGrade3Progress(now), storageAvailable: false, recovered: false }
  }
  try {
    const raw = storage.getItem(GRADE3_PROGRESS_KEY)
    if (!raw) {
      return { progress: createInitialGrade3Progress(now), storageAvailable: true, recovered: false }
    }
    const normalized = normalizeProgress(JSON.parse(raw), now)
    if (!normalized) {
      storage.removeItem(GRADE3_PROGRESS_KEY)
      return { progress: createInitialGrade3Progress(now), storageAvailable: true, recovered: true }
    }
    return { progress: normalized, storageAvailable: true, recovered: false }
  } catch {
    try {
      storage.removeItem(GRADE3_PROGRESS_KEY)
    } catch {
      // Continue in memory when storage is unavailable.
    }
    return { progress: createInitialGrade3Progress(now), storageAvailable: false, recovered: true }
  }
}

export function saveGrade3Progress(
  progress: Grade3Progress,
  storage: StorageLike | null = getBrowserStorage()
): boolean {
  if (!storage) return false
  try {
    storage.setItem(GRADE3_PROGRESS_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

function toggleId(ids: string[], id: string, present: boolean): string[] {
  const set = new Set(ids)
  if (present) set.add(id)
  else set.delete(id)
  return Array.from(set)
}

export function selectGrade3Unit(
  progress: Grade3Progress,
  unitId: string,
  now = Date.now()
): Grade3Progress {
  return { ...progress, selectedUnitId: unitId, lastPlayedAt: now }
}

export function dismissGrade3Intro(progress: Grade3Progress, now = Date.now()): Grade3Progress {
  if (progress.introDismissedAt !== null) return progress
  return { ...progress, introDismissedAt: now, lastPlayedAt: now }
}

export function recordGrade3Attempt(
  progress: Grade3Progress,
  mission: Pick<Grade3Mission, 'id' | 'unitId' | 'parentSummaryTag'>,
  correct: boolean,
  options: { hadHint?: boolean; countSolved?: boolean; now?: number } = {}
): Grade3Progress {
  const now = options.now ?? Date.now()
  const countSolved = options.countSolved ?? true
  const summary = progress.skillSummaryByTag[mission.parentSummaryTag] ?? { attempted: 0, correct: 0 }
  return {
    ...progress,
    completedMissionIds: correct
      ? toggleId(progress.completedMissionIds, mission.id, true)
      : progress.completedMissionIds,
    reviewMissionIds:
      correct && !options.hadHint
        ? toggleId(progress.reviewMissionIds, mission.id, false)
        : toggleId(progress.reviewMissionIds, mission.id, true),
    latestMissionId: mission.id,
    selectedUnitId: mission.unitId,
    todaySolvedCount: correct && countSolved ? progress.todaySolvedCount + 1 : progress.todaySolvedCount,
    skillSummaryByTag: {
      ...progress.skillSummaryByTag,
      [mission.parentSummaryTag]: {
        attempted: summary.attempted + 1,
        correct: summary.correct + (correct ? 1 : 0),
      },
    },
    lastPlayedAt: now,
  }
}

export function resetGrade3Progress(
  storage: StorageLike | null = getBrowserStorage(),
  now = Date.now()
): Grade3Progress {
  const progress = createInitialGrade3Progress(now)
  saveGrade3Progress(progress, storage)
  return progress
}
