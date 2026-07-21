export const GRADE4_PROGRESS_KEY = 'mathAssist_grade4Progress'
export const GRADE4_PROGRESS_SCHEMA_VERSION = 1

export interface Grade4SkillSummary {
  attempted: number
  correct: number
}

export interface Grade4Progress {
  schemaVersion: 1
  completedVariantKeys: string[]
  reviewVariantKeys: string[]
  latestMissionId: string | null
  selectedUnitId: string | null
  activityRun: number
  activeItemIndex: number
  todaySolvedCount: number
  skillSummaryByTag: Record<string, Grade4SkillSummary>
  lastPlayedAt: number | null
}

export interface Grade4ProgressStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface Grade4ProgressLoadResult {
  progress: Grade4Progress
  storageAvailable: boolean
  recovered: boolean
}

export interface Grade4Attempt {
  missionId: string
  variantKey: string
  unitId: string
  skillTag: string
  correct: boolean
  usedHint?: boolean
  now?: number
}

const corruptProgressStorages = new WeakSet<object>()

function browserStorage(): Grade4ProgressStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0)))
}

function isSameLocalDay(left: number | null, right: number): boolean {
  if (!left) return false
  const a = new Date(left)
  const b = new Date(right)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function nonNegativeInteger(value: unknown, fallback = 0): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : fallback
}

export function createInitialGrade4Progress(now = Date.now()): Grade4Progress {
  return {
    schemaVersion: GRADE4_PROGRESS_SCHEMA_VERSION,
    completedVariantKeys: [],
    reviewVariantKeys: [],
    latestMissionId: null,
    selectedUnitId: null,
    activityRun: 0,
    activeItemIndex: 0,
    todaySolvedCount: 0,
    skillSummaryByTag: {},
    lastPlayedAt: now,
  }
}

function normalizeGrade4Progress(value: unknown, now: number): Grade4Progress | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<Grade4Progress>
  if (candidate.schemaVersion !== GRADE4_PROGRESS_SCHEMA_VERSION) return null
  if (!Array.isArray(candidate.completedVariantKeys) || !Array.isArray(candidate.reviewVariantKeys)) return null
  if (!candidate.skillSummaryByTag || typeof candidate.skillSummaryByTag !== 'object' || Array.isArray(candidate.skillSummaryByTag)) return null
  if (candidate.latestMissionId != null && typeof candidate.latestMissionId !== 'string') return null
  if (candidate.selectedUnitId != null && typeof candidate.selectedUnitId !== 'string') return null

  const lastPlayedAt = typeof candidate.lastPlayedAt === 'number' && Number.isFinite(candidate.lastPlayedAt)
    ? candidate.lastPlayedAt
    : now
  return {
    schemaVersion: GRADE4_PROGRESS_SCHEMA_VERSION,
    completedVariantKeys: uniqueStrings(candidate.completedVariantKeys),
    reviewVariantKeys: uniqueStrings(candidate.reviewVariantKeys),
    latestMissionId: candidate.latestMissionId ?? null,
    selectedUnitId: candidate.selectedUnitId ?? null,
    activityRun: nonNegativeInteger(candidate.activityRun),
    activeItemIndex: Math.min(2, nonNegativeInteger(candidate.activeItemIndex)),
    todaySolvedCount: isSameLocalDay(lastPlayedAt, now) ? nonNegativeInteger(candidate.todaySolvedCount) : 0,
    skillSummaryByTag: candidate.skillSummaryByTag as Record<string, Grade4SkillSummary>,
    lastPlayedAt,
  }
}

export function loadGrade4Progress(
  storage: Grade4ProgressStorage | null = browserStorage(),
  now = Date.now(),
): Grade4ProgressLoadResult {
  if (!storage) return { progress: createInitialGrade4Progress(now), storageAvailable: false, recovered: false }
  try {
    const raw = storage.getItem(GRADE4_PROGRESS_KEY)
    if (!raw) return { progress: createInitialGrade4Progress(now), storageAvailable: true, recovered: false }
    const progress = normalizeGrade4Progress(JSON.parse(raw), now)
    if (progress) return { progress, storageAvailable: true, recovered: false }
    corruptProgressStorages.add(storage)
    return { progress: createInitialGrade4Progress(now), storageAvailable: true, recovered: true }
  } catch {
    corruptProgressStorages.add(storage)
    return { progress: createInitialGrade4Progress(now), storageAvailable: false, recovered: true }
  }
}

export function saveGrade4Progress(
  progress: Grade4Progress,
  storage: Grade4ProgressStorage | null = browserStorage(),
): boolean {
  if (!storage || corruptProgressStorages.has(storage)) return false
  try {
    storage.setItem(GRADE4_PROGRESS_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

function toggle(values: string[], value: string, present: boolean): string[] {
  const next = new Set(values)
  if (present) next.add(value)
  else next.delete(value)
  return Array.from(next)
}

export function recordGrade4Attempt(progress: Grade4Progress, attempt: Grade4Attempt): Grade4Progress {
  const now = attempt.now ?? Date.now()
  const alreadyCompleted = progress.completedVariantKeys.includes(attempt.variantKey)
  const summary = progress.skillSummaryByTag[attempt.skillTag] ?? { attempted: 0, correct: 0 }
  return {
    ...progress,
    completedVariantKeys: attempt.correct
      ? toggle(progress.completedVariantKeys, attempt.variantKey, true)
      : progress.completedVariantKeys,
    reviewVariantKeys: attempt.correct && !attempt.usedHint
      ? toggle(progress.reviewVariantKeys, attempt.variantKey, false)
      : toggle(progress.reviewVariantKeys, attempt.variantKey, true),
    latestMissionId: attempt.missionId,
    selectedUnitId: attempt.unitId,
    todaySolvedCount: attempt.correct && !alreadyCompleted ? progress.todaySolvedCount + 1 : progress.todaySolvedCount,
    skillSummaryByTag: {
      ...progress.skillSummaryByTag,
      [attempt.skillTag]: {
        attempted: summary.attempted + 1,
        correct: summary.correct + (attempt.correct ? 1 : 0),
      },
    },
    lastPlayedAt: now,
  }
}

export function selectGrade4Unit(progress: Grade4Progress, unitId: string, now = Date.now()): Grade4Progress {
  return { ...progress, selectedUnitId: unitId, lastPlayedAt: now }
}

export function setGrade4ActiveItem(progress: Grade4Progress, activeItemIndex: number, now = Date.now()): Grade4Progress {
  return { ...progress, activeItemIndex: Math.max(0, Math.min(2, activeItemIndex)), lastPlayedAt: now }
}

export function advanceGrade4Activity(progress: Grade4Progress, now = Date.now()): Grade4Progress {
  return { ...progress, activityRun: progress.activityRun + 1, activeItemIndex: 0, lastPlayedAt: now }
}

export function resetGrade4Progress(
  storage: Grade4ProgressStorage | null = browserStorage(),
  now = Date.now(),
): Grade4Progress {
  const progress = createInitialGrade4Progress(now)
  if (storage) corruptProgressStorages.delete(storage)
  saveGrade4Progress(progress, storage)
  return progress
}
