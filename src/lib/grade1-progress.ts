import type { Grade1Mission } from './grade1-problems'
import {
  createAdventureState,
  normalizeAdventureState,
  recordAdventureAttempt,
  type AdventureMastery,
} from './adventure-progression'

export const GRADE1_PROGRESS_KEY = 'mathAssist_grade1Progress'
export const GRADE1_PROGRESS_SCHEMA_VERSION = 2

export interface Grade1SkillSummary {
  attempted: number
  correct: number
}

export interface Grade1Progress {
  schemaVersion: number
  completedStageIds: string[]
  reviewStageIds: string[]
  latestStageId: string | null
  todaySolvedCount: number
  skillSummaryByTag: Record<string, Grade1SkillSummary>
  introDismissedAt: number | null
  lastPlayedAt: number | null
  xp: number
  learningDates: string[]
  solvedVariantKeys: string[]
  masteryByMissionId: Record<string, AdventureMastery>
}

export interface Grade1ProgressLoadResult {
  progress: Grade1Progress
  storageAvailable: boolean
  recovered: boolean
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function createInitialGrade1Progress(now = Date.now()): Grade1Progress {
  return {
    schemaVersion: GRADE1_PROGRESS_SCHEMA_VERSION,
    completedStageIds: [],
    reviewStageIds: [],
    latestStageId: null,
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

function normalizeProgress(value: unknown, now: number): Grade1Progress | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<Grade1Progress>

  if (candidate.schemaVersion !== 1 && candidate.schemaVersion !== GRADE1_PROGRESS_SCHEMA_VERSION) return null
  if (!Array.isArray(candidate.completedStageIds)) return null
  if (!Array.isArray(candidate.reviewStageIds)) return null
  if (
    candidate.latestStageId !== null &&
    candidate.latestStageId !== undefined &&
    typeof candidate.latestStageId !== 'string'
  ) {
    return null
  }
  if (!candidate.skillSummaryByTag || typeof candidate.skillSummaryByTag !== 'object') {
    return null
  }

  const completedStageIds = Array.from(
    new Set(candidate.completedStageIds.filter((id): id is string => typeof id === 'string'))
  )
  const lastPlayedAt = typeof candidate.lastPlayedAt === 'number' ? candidate.lastPlayedAt : now
  const adventure = normalizeAdventureState(candidate, completedStageIds, lastPlayedAt)

  return {
    schemaVersion: GRADE1_PROGRESS_SCHEMA_VERSION,
    completedStageIds,
    reviewStageIds: Array.from(
      new Set(candidate.reviewStageIds.filter((id): id is string => typeof id === 'string'))
    ),
    latestStageId: candidate.latestStageId ?? null,
    todaySolvedCount: isSameLocalDay(candidate.lastPlayedAt ?? null, now)
      ? Number(candidate.todaySolvedCount ?? 0)
      : 0,
    skillSummaryByTag: candidate.skillSummaryByTag as Record<string, Grade1SkillSummary>,
    introDismissedAt:
      typeof candidate.introDismissedAt === 'number' ? candidate.introDismissedAt : null,
    lastPlayedAt,
    ...adventure,
  }
}

export function loadGrade1Progress(
  storage: StorageLike | null = getBrowserStorage(),
  now = Date.now()
): Grade1ProgressLoadResult {
  if (!storage) {
    return {
      progress: createInitialGrade1Progress(now),
      storageAvailable: false,
      recovered: false,
    }
  }

  try {
    const raw = storage.getItem(GRADE1_PROGRESS_KEY)
    if (!raw) {
      return {
        progress: createInitialGrade1Progress(now),
        storageAvailable: true,
        recovered: false,
      }
    }

    const normalized = normalizeProgress(JSON.parse(raw), now)
    if (!normalized) {
      storage.removeItem(GRADE1_PROGRESS_KEY)
      return {
        progress: createInitialGrade1Progress(now),
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
      storage.removeItem(GRADE1_PROGRESS_KEY)
    } catch {
      // Storage may fail both reads and writes. The caller can continue in memory.
    }
    return {
      progress: createInitialGrade1Progress(now),
      storageAvailable: false,
      recovered: true,
    }
  }
}

export function saveGrade1Progress(
  progress: Grade1Progress,
  storage: StorageLike | null = getBrowserStorage()
): boolean {
  if (!storage) return false
  try {
    storage.setItem(GRADE1_PROGRESS_KEY, JSON.stringify(progress))
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

export function recordGrade1Attempt(
  progress: Grade1Progress,
  mission: Pick<Grade1Mission, 'id' | 'parentSummaryTag'>,
  correct: boolean,
  options: {
    hadHint?: boolean
    countSolved?: boolean
    now?: number
    variantKey?: string
    wrongAttempts?: number
    difficultyBonus?: number
  } = {}
): Grade1Progress {
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
    completedStageIds: correct
      ? toggleId(progress.completedStageIds, mission.id, true)
      : progress.completedStageIds,
    reviewStageIds:
      correct && !options.hadHint
        ? toggleId(progress.reviewStageIds, mission.id, false)
        : toggleId(progress.reviewStageIds, mission.id, true),
    latestStageId: mission.id,
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

export function dismissGrade1Intro(
  progress: Grade1Progress,
  now = Date.now()
): Grade1Progress {
  if (progress.introDismissedAt !== null) return progress

  return {
    ...progress,
    introDismissedAt: now,
    lastPlayedAt: now,
  }
}

export function resetGrade1Progress(
  storage: StorageLike | null = getBrowserStorage(),
  now = Date.now()
): Grade1Progress {
  const progress = createInitialGrade1Progress(now)
  saveGrade1Progress(progress, storage)
  return progress
}
