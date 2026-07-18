export const ADVENTURE_DAILY_GOAL = 8
export const ADVENTURE_XP_PER_LEVEL = 100

const DAY_MS = 24 * 60 * 60 * 1000
const REVIEW_INTERVAL_DAYS = [1, 3, 7, 21]

export interface AdventureMastery {
  attempted: number
  correct: number
  firstTryCorrect: number
  hintlessCorrect: number
  spacedReviewCorrect: number
  lastSolvedAt: number | null
  nextReviewAt: number | null
}

export interface AdventureState {
  xp: number
  learningDates: string[]
  solvedVariantKeys: string[]
  masteryByMissionId: Record<string, AdventureMastery>
}

export interface AdventureAttemptOptions {
  variantKey: string
  now?: number
  hadHint?: boolean
  wrongAttempts?: number
  difficultyBonus?: number
}

export function adventureDateKey(now = Date.now()): string {
  const date = new Date(now)
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function getDailyAdventureSeed(
  grade: 'grade1' | 'grade2',
  now = Date.now(),
  replayRound = 0
): number {
  return hashString(`${grade}:${adventureDateKey(now)}:${replayRound}`) & 0x7fffffff
}

export function getAdventureVariantKey(missionId: string, concreteSignature: number | string): string {
  const fingerprint = typeof concreteSignature === 'number'
    ? concreteSignature
    : hashString(concreteSignature).toString(36)
  return `${missionId}:${fingerprint}`
}

export function createAdventureMastery(): AdventureMastery {
  return {
    attempted: 0,
    correct: 0,
    firstTryCorrect: 0,
    hintlessCorrect: 0,
    spacedReviewCorrect: 0,
    lastSolvedAt: null,
    nextReviewAt: null,
  }
}

export function createAdventureState(): AdventureState {
  return {
    xp: 0,
    learningDates: [],
    solvedVariantKeys: [],
    masteryByMissionId: {},
  }
}

function nonNegativeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string')))
}

export function normalizeAdventureState(
  value: unknown,
  completedMissionIds: string[] = [],
  lastPlayedAt: number | null = null
): AdventureState {
  const candidate = value && typeof value === 'object' ? value as Partial<AdventureState> : {}
  const rawMastery = candidate.masteryByMissionId && typeof candidate.masteryByMissionId === 'object'
    ? candidate.masteryByMissionId
    : {}
  const masteryByMissionId = Object.fromEntries(
    Object.entries(rawMastery).map(([missionId, raw]) => {
      const mastery = raw && typeof raw === 'object' ? raw as Partial<AdventureMastery> : {}
      return [missionId, {
        attempted: nonNegativeNumber(mastery.attempted),
        correct: nonNegativeNumber(mastery.correct),
        firstTryCorrect: nonNegativeNumber(mastery.firstTryCorrect),
        hintlessCorrect: nonNegativeNumber(mastery.hintlessCorrect),
        spacedReviewCorrect: nonNegativeNumber(mastery.spacedReviewCorrect),
        lastSolvedAt: typeof mastery.lastSolvedAt === 'number' ? mastery.lastSolvedAt : null,
        nextReviewAt: typeof mastery.nextReviewAt === 'number' ? mastery.nextReviewAt : null,
      } satisfies AdventureMastery]
    })
  )

  for (const missionId of completedMissionIds) {
    if (masteryByMissionId[missionId]) continue
    masteryByMissionId[missionId] = {
      ...createAdventureMastery(),
      attempted: 1,
      correct: 1,
      lastSolvedAt: lastPlayedAt,
      nextReviewAt: lastPlayedAt === null ? null : lastPlayedAt + DAY_MS,
    }
  }

  const hasStoredAdventureState =
    typeof candidate.xp === 'number' ||
    Array.isArray(candidate.solvedVariantKeys) ||
    Object.keys(rawMastery).length > 0

  return {
    xp: nonNegativeNumber(candidate.xp, hasStoredAdventureState ? 0 : completedMissionIds.length * 10),
    learningDates: stringList(candidate.learningDates),
    solvedVariantKeys: stringList(candidate.solvedVariantKeys),
    masteryByMissionId,
  }
}

export function getMasteryStars(mastery: AdventureMastery | undefined): 0 | 1 | 2 | 3 {
  if (!mastery || mastery.correct === 0) return 0
  if (mastery.spacedReviewCorrect > 0) return 3
  if (mastery.firstTryCorrect > 0) return 2
  return 1
}

export function getAdventureLevel(xp: number): number {
  return Math.floor(Math.max(0, xp) / ADVENTURE_XP_PER_LEVEL) + 1
}

export function getLearningStreak(learningDates: string[], now = Date.now()): number {
  const dates = new Set(learningDates)
  const today = adventureDateKey(now)
  const currentDate = new Date(now)
  let cursor = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  if (!dates.has(today)) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (dates.has(adventureDateKey(cursor.getTime()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function appendUnique(values: string[], value: string, limit = 500): string[] {
  const next = values.includes(value) ? values : [...values, value]
  return next.slice(Math.max(0, next.length - limit))
}

export function recordAdventureAttempt(
  state: AdventureState,
  missionId: string,
  correct: boolean,
  options: AdventureAttemptOptions
): AdventureState {
  const now = options.now ?? Date.now()
  const current = state.masteryByMissionId[missionId] ?? createAdventureMastery()
  const attempted: AdventureMastery = {
    ...current,
    attempted: current.attempted + 1,
  }

  if (!correct) {
    return {
      ...state,
      masteryByMissionId: {
        ...state.masteryByMissionId,
        [missionId]: attempted,
      },
    }
  }

  if (state.solvedVariantKeys.includes(options.variantKey)) {
    return {
      ...state,
      masteryByMissionId: {
        ...state.masteryByMissionId,
        [missionId]: attempted,
      },
    }
  }

  const firstTry = !options.hadHint && (options.wrongAttempts ?? 0) === 0
  const dueReview = current.nextReviewAt !== null && now >= current.nextReviewAt
  const correctCount = current.correct + 1
  const intervalDays = REVIEW_INTERVAL_DAYS[Math.min(correctCount - 1, REVIEW_INTERVAL_DAYS.length - 1)]
  const xpAward = 10 + (firstTry ? 5 : 0) + (dueReview ? 5 : 0) + Math.max(0, options.difficultyBonus ?? 0)

  return {
    xp: state.xp + xpAward,
    learningDates: appendUnique(state.learningDates, adventureDateKey(now), 400),
    solvedVariantKeys: appendUnique(state.solvedVariantKeys, options.variantKey),
    masteryByMissionId: {
      ...state.masteryByMissionId,
      [missionId]: {
        attempted: attempted.attempted,
        correct: correctCount,
        firstTryCorrect: current.firstTryCorrect + (firstTry ? 1 : 0),
        hintlessCorrect: current.hintlessCorrect + (!options.hadHint ? 1 : 0),
        spacedReviewCorrect: current.spacedReviewCorrect + (dueReview ? 1 : 0),
        lastSolvedAt: now,
        nextReviewAt: now + intervalDays * DAY_MS,
      },
    },
  }
}

export type AdventureAchievementId =
  | 'first-step'
  | 'level-2'
  | 'daily-treasure'
  | 'three-day-journey'
  | 'mastery-collector'

export function getAdventureAchievements(
  state: Pick<AdventureState, 'xp' | 'learningDates' | 'masteryByMissionId'> & { todaySolvedCount: number },
  now = Date.now()
): AdventureAchievementId[] {
  const achievements: AdventureAchievementId[] = []
  const masteries = Object.values(state.masteryByMissionId)
  const totalStars = masteries.reduce((sum, mastery) => sum + getMasteryStars(mastery), 0)

  if (masteries.some((mastery) => mastery.correct > 0)) achievements.push('first-step')
  if (getAdventureLevel(state.xp) >= 2) achievements.push('level-2')
  if (state.todaySolvedCount >= ADVENTURE_DAILY_GOAL) achievements.push('daily-treasure')
  if (getLearningStreak(state.learningDates, now) >= 3) achievements.push('three-day-journey')
  if (totalStars >= 10) achievements.push('mastery-collector')
  return achievements
}
