import type { Grade2Mission } from './grade2-problems'
import {
  createAdventureState,
  normalizeAdventureState,
  recordAdventureAttempt,
  type AdventureMastery,
} from './adventure-progression'

export const GRADE2_PROGRESS_KEY = 'mathAssist_grade2Progress'
export const GRADE2_PROGRESS_SCHEMA_VERSION = 2

export interface Grade2SkillSummary {
  attempted: number
  correct: number
}

export interface Grade2Progress {
  schemaVersion: number
  completedMissionIds: string[]
  reviewMissionIds: string[]
  latestMissionId: string | null
  selectedUnitId: string | null
  todaySolvedCount: number
  skillSummaryByTag: Record<string, Grade2SkillSummary>
  introDismissedAt: number | null
  lastPlayedAt: number | null
  xp: number
  learningDates: string[]
  solvedVariantKeys: string[]
  masteryByMissionId: Record<string, AdventureMastery>
}

export interface Grade2ProgressLoadResult {
  progress: Grade2Progress
  storageAvailable: boolean
  recovered: boolean
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function createInitialGrade2Progress(now = Date.now()): Grade2Progress {
  return {
    schemaVersion: GRADE2_PROGRESS_SCHEMA_VERSION,
    completedMissionIds: [],
    reviewMissionIds: [],
    latestMissionId: null,
    selectedUnitId: null,
    todaySolvedCount: 0,
    skillSummaryByTag: {},
    introDismissedAt: null,
    lastPlayedAt: now,
    ...createAdventureState(),
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

function normalizeProgress(value: unknown, now: number): Grade2Progress | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<Grade2Progress>

  if (candidate.schemaVersion !== 1 && candidate.schemaVersion !== GRADE2_PROGRESS_SCHEMA_VERSION) return null
  if (!Array.isArray(candidate.completedMissionIds)) return null
  if (!Array.isArray(candidate.reviewMissionIds)) return null
  if (
    candidate.latestMissionId !== null &&
    candidate.latestMissionId !== undefined &&
    typeof candidate.latestMissionId !== 'string'
  ) {
    return null
  }
  if (
    candidate.selectedUnitId !== null &&
    candidate.selectedUnitId !== undefined &&
    typeof candidate.selectedUnitId !== 'string'
  ) {
    return null
  }
  if (!candidate.skillSummaryByTag || typeof candidate.skillSummaryByTag !== 'object') {
    return null
  }

  const completedMissionIds = uniqueStrings(candidate.completedMissionIds)
  const lastPlayedAt = typeof candidate.lastPlayedAt === 'number' ? candidate.lastPlayedAt : now
  const adventure = normalizeAdventureState(candidate, completedMissionIds, lastPlayedAt)

  return {
    schemaVersion: GRADE2_PROGRESS_SCHEMA_VERSION,
    completedMissionIds,
    reviewMissionIds: uniqueStrings(candidate.reviewMissionIds),
    latestMissionId: candidate.latestMissionId ?? null,
    selectedUnitId: candidate.selectedUnitId ?? null,
    todaySolvedCount: isSameLocalDay(candidate.lastPlayedAt ?? null, now)
      ? Number(candidate.todaySolvedCount ?? 0)
      : 0,
    skillSummaryByTag: candidate.skillSummaryByTag as Record<string, Grade2SkillSummary>,
    introDismissedAt:
      typeof candidate.introDismissedAt === 'number' ? candidate.introDismissedAt : null,
    lastPlayedAt,
    ...adventure,
  }
}

export function loadGrade2Progress(
  storage: StorageLike | null = getBrowserStorage(),
  now = Date.now()
): Grade2ProgressLoadResult {
  if (!storage) {
    return {
      progress: createInitialGrade2Progress(now),
      storageAvailable: false,
      recovered: false,
    }
  }

  try {
    const raw = storage.getItem(GRADE2_PROGRESS_KEY)
    if (!raw) {
      return {
        progress: createInitialGrade2Progress(now),
        storageAvailable: true,
        recovered: false,
      }
    }

    const normalized = normalizeProgress(JSON.parse(raw), now)
    if (!normalized) {
      storage.removeItem(GRADE2_PROGRESS_KEY)
      return {
        progress: createInitialGrade2Progress(now),
        storageAvailable: true,
        recovered: true,
      }
    }

    return {
      progress: normalized,
      storageAvailable: true,
      recovered: false,
    }
  } catch {
    try {
      storage.removeItem(GRADE2_PROGRESS_KEY)
    } catch {
      // Continue in memory when storage is unavailable.
    }
    return {
      progress: createInitialGrade2Progress(now),
      storageAvailable: false,
      recovered: true,
    }
  }
}

export function saveGrade2Progress(
  progress: Grade2Progress,
  storage: StorageLike | null = getBrowserStorage()
): boolean {
  if (!storage) return false
  try {
    storage.setItem(GRADE2_PROGRESS_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

function toggleId(ids: string[], id: string, present: boolean): string[] {
  const set = new Set(ids)
  if (present) {
    set.add(id)
  } else {
    set.delete(id)
  }
  return Array.from(set)
}

export function selectGrade2Unit(
  progress: Grade2Progress,
  unitId: string,
  now = Date.now()
): Grade2Progress {
  return {
    ...progress,
    selectedUnitId: unitId,
    lastPlayedAt: now,
  }
}

export function dismissGrade2Intro(progress: Grade2Progress, now = Date.now()): Grade2Progress {
  if (progress.introDismissedAt !== null) return progress
  return {
    ...progress,
    introDismissedAt: now,
    lastPlayedAt: now,
  }
}

export function recordGrade2Attempt(
  progress: Grade2Progress,
  mission: Pick<Grade2Mission, 'id' | 'unitId' | 'parentSummaryTag'>,
  correct: boolean,
  options: {
    hadHint?: boolean
    countSolved?: boolean
    now?: number
    variantKey?: string
    wrongAttempts?: number
    difficultyBonus?: number
  } = {}
): Grade2Progress {
  const now = options.now ?? Date.now()
  const countSolved = options.countSolved ?? true
  const variantKey = options.variantKey ?? `${mission.id}:legacy`
  const alreadySolvedVariant = progress.solvedVariantKeys.includes(variantKey)
  const summary = progress.skillSummaryByTag[mission.parentSummaryTag] ?? {
    attempted: 0,
    correct: 0,
  }

  const adventure = recordAdventureAttempt({
    xp: progress.xp,
    learningDates: progress.learningDates,
    solvedVariantKeys: progress.solvedVariantKeys,
    masteryByMissionId: progress.masteryByMissionId,
  }, mission.id, correct, {
    variantKey,
    now,
    hadHint: options.hadHint,
    wrongAttempts: options.wrongAttempts,
    difficultyBonus: options.difficultyBonus,
  })

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
    todaySolvedCount: correct && countSolved && !alreadySolvedVariant
      ? progress.todaySolvedCount + 1
      : progress.todaySolvedCount,
    skillSummaryByTag: {
      ...progress.skillSummaryByTag,
      [mission.parentSummaryTag]: {
        attempted: summary.attempted + 1,
        correct: summary.correct + (correct ? 1 : 0),
      },
    },
    lastPlayedAt: now,
    ...adventure,
  }
}

export function resetGrade2Progress(
  storage: StorageLike | null = getBrowserStorage(),
  now = Date.now()
): Grade2Progress {
  const progress = createInitialGrade2Progress(now)
  saveGrade2Progress(progress, storage)
  return progress
}
