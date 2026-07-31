import {
  getGrade1LegacyMissionIds,
  getGrade1PracticeMissionIds,
  grade1Islands,
  type Grade1Mission,
  type Grade1Mode,
} from './grade1-problems'
import {
  createAdventureState,
  normalizeAdventureState,
  recordAdventureAttempt,
  type AdventureMastery,
} from './adventure-progression'
import { normalizeMissionSketchRunOrdinal } from './mission-sketch-identity'

export const GRADE1_PROGRESS_KEY = 'mathAssist_grade1Progress'
export const GRADE1_PROGRESS_SCHEMA_VERSION = 3

export interface Grade1SkillSummary {
  attempted: number
  correct: number
}

export interface Grade1Progress {
  schemaVersion: number
  completedStageIds: string[]
  checkedStageIds: string[]
  completedIslandIds: string[]
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
  missionSketchRunOrdinal: number
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

const corruptProgressStorages = new WeakSet<object>()

export function createInitialGrade1Progress(now = Date.now()): Grade1Progress {
  return {
    schemaVersion: GRADE1_PROGRESS_SCHEMA_VERSION,
    completedStageIds: [],
    checkedStageIds: [],
    completedIslandIds: [],
    reviewStageIds: [],
    latestStageId: null,
    todaySolvedCount: 0,
    skillSummaryByTag: {},
    introDismissedAt: null,
    lastPlayedAt: now,
    ...createAdventureState(),
    missionSketchRunOrdinal: 0,
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

function defaultPracticeMissionIdsByIsland(): Record<string, string[]> {
  return Object.fromEntries(
    grade1Islands.map((island) => [island.id, getGrade1PracticeMissionIds(island.id)])
  )
}

function defaultLegacyMissionIdsByIsland(): Record<string, string[]> {
  return Object.fromEntries(
    grade1Islands.map((island) => [island.id, getGrade1LegacyMissionIds(island.id)])
  )
}

function deriveCompletedIslandIds(
  checkedStageIds: string[],
  savedIslandIds: unknown,
  practiceMissionIdsByIsland: Record<string, readonly string[]>,
  legacyMissionIdsByIsland: Record<string, readonly string[]>,
  acceptLegacyCompletion: boolean,
): string[] {
  const checkedStages = new Set(checkedStageIds)
  const completedIslands = new Set(
    Array.isArray(savedIslandIds)
      ? savedIslandIds.filter((id): id is string => typeof id === 'string')
      : []
  )
  for (const [islandId, practiceMissionIds] of Object.entries(practiceMissionIdsByIsland)) {
    if (
      practiceMissionIds.length > 0
      && practiceMissionIds.every((missionId) => checkedStages.has(missionId))
    ) {
      completedIslands.add(islandId)
    }
  }
  if (acceptLegacyCompletion) {
    for (const [islandId, legacyMissionIds] of Object.entries(legacyMissionIdsByIsland)) {
      if (
        legacyMissionIds.length > 0
        && legacyMissionIds.every((missionId) => checkedStages.has(missionId))
      ) {
        completedIslands.add(islandId)
      }
    }
  }
  return Array.from(completedIslands)
}

function normalizeProgress(
  value: unknown,
  now: number,
  practiceMissionIdsByIsland: Record<string, readonly string[]>,
  legacyMissionIdsByIsland: Record<string, readonly string[]>,
): Grade1Progress | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<Grade1Progress>

  if (![1, 2, GRADE1_PROGRESS_SCHEMA_VERSION].includes(Number(candidate.schemaVersion))) return null
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
  const checkedStageIds = Array.from(new Set(
    Array.isArray(candidate.checkedStageIds)
      ? candidate.checkedStageIds.filter((id): id is string => typeof id === 'string')
      : [...candidate.completedStageIds, ...candidate.reviewStageIds]
        .filter((id): id is string => typeof id === 'string')
  ))
  const lastPlayedAt = typeof candidate.lastPlayedAt === 'number' ? candidate.lastPlayedAt : now
  const adventure = normalizeAdventureState(candidate, completedStageIds, lastPlayedAt)

  return {
    schemaVersion: GRADE1_PROGRESS_SCHEMA_VERSION,
    completedStageIds,
    checkedStageIds,
    completedIslandIds: deriveCompletedIslandIds(
      checkedStageIds,
      candidate.completedIslandIds,
      practiceMissionIdsByIsland,
      legacyMissionIdsByIsland,
      Number(candidate.schemaVersion) < GRADE1_PROGRESS_SCHEMA_VERSION,
    ),
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
    missionSketchRunOrdinal: normalizeMissionSketchRunOrdinal(candidate.missionSketchRunOrdinal),
  }
}

export function loadGrade1Progress(
  storage: StorageLike | null = getBrowserStorage(),
  now = Date.now(),
  practiceMissionIdsByIsland: Record<string, readonly string[]> = defaultPracticeMissionIdsByIsland(),
  legacyMissionIdsByIsland: Record<string, readonly string[]> = defaultLegacyMissionIdsByIsland(),
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

    const normalized = normalizeProgress(
      JSON.parse(raw),
      now,
      practiceMissionIdsByIsland,
      legacyMissionIdsByIsland,
    )
    if (!normalized) {
      corruptProgressStorages.add(storage)
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
    corruptProgressStorages.add(storage)
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
  if (!storage || corruptProgressStorages.has(storage)) return false
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
  mission: Pick<Grade1Mission, 'id' | 'parentSummaryTag'> & {
    islandId?: string
    mode?: Grade1Mode
  },
  correct: boolean,
  options: {
    hadHint?: boolean
    countSolved?: boolean
    now?: number
    variantKey?: string
    wrongAttempts?: number
    difficultyBonus?: number
    practiceMissionIds?: readonly string[]
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
  const completedStageIds = correct
    ? toggleId(progress.completedStageIds, mission.id, true)
    : progress.completedStageIds
  const checkedStageIds = toggleId(progress.checkedStageIds, mission.id, true)
  const completedIslandIds = (
    mission.islandId
    && mission.mode === 'practice'
    && options.practiceMissionIds
    && options.practiceMissionIds.length > 0
    && options.practiceMissionIds.every((missionId) => checkedStageIds.includes(missionId))
  )
    ? toggleId(progress.completedIslandIds, mission.islandId, true)
    : progress.completedIslandIds

  return {
    ...progress,
    completedStageIds,
    checkedStageIds,
    completedIslandIds,
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

export function isGrade1IslandComplete(
  progress: Pick<Grade1Progress, 'completedIslandIds'>,
  islandId: string
): boolean {
  return progress.completedIslandIds.includes(islandId)
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
  if (storage) corruptProgressStorages.delete(storage)
  saveGrade1Progress(progress, storage)
  return progress
}
