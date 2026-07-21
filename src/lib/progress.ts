import type {
  ConceptProgressMap,
  ConceptProgressSummary,
  SessionResult
} from './types'
import type { PracticeGrade } from './types'
import { resolvePracticeGrade } from './session'

export const GRADE5_PROGRESS_KEY = 'mathAssist_progress_v1'
export const GRADE6_PROGRESS_KEY = 'mathAssist_grade6Progress'

function progressKey(grade: PracticeGrade): string {
  return grade === 6 ? GRADE6_PROGRESS_KEY : GRADE5_PROGRESS_KEY
}

function isConceptProgressMap(value: unknown): value is ConceptProgressMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.entries(value).every(([conceptId, summary]) => {
    if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return false
    const candidate = summary as Partial<ConceptProgressSummary>
    return candidate.conceptId === conceptId
      && Number.isInteger(candidate.attemptCount)
      && typeof candidate.bestScore === 'number'
      && typeof candidate.latestScore === 'number'
      && typeof candidate.lastCompletedAt === 'number'
      && typeof candidate.needsReview === 'boolean'
      && (candidate.lastMode === 'standard' || candidate.lastMode === 'retry-wrong')
  })
}

export function toPercentScore(score: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((score / total) * 100)
}

export function buildConceptProgressSummary(
  existing: ConceptProgressSummary | null,
  result: SessionResult
): ConceptProgressSummary {
  const latestScore = toPercentScore(result.score, result.total)

  return {
    conceptId: result.conceptId,
    attemptCount: (existing?.attemptCount ?? 0) + 1,
    bestScore: Math.max(existing?.bestScore ?? 0, latestScore),
    latestScore,
    lastCompletedAt: result.completedAt,
    needsReview: result.wrongCount > 0,
    lastMode: result.mode
  }
}

export function mergeConceptProgress(
  progressMap: ConceptProgressMap,
  result: SessionResult
): ConceptProgressMap {
  return {
    ...progressMap,
    [result.conceptId]: buildConceptProgressSummary(
      progressMap[result.conceptId] ?? null,
      result
    )
  }
}

export function loadConceptProgressMap(grade: PracticeGrade = 5): ConceptProgressMap {
  if (typeof window === 'undefined') return {}

  try {
    const raw = localStorage.getItem(progressKey(grade))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return isConceptProgressMap(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function saveConceptProgressMap(
  progressMap: ConceptProgressMap,
  grade: PracticeGrade = 5,
): boolean {
  if (typeof window === 'undefined') return false
  const key = progressKey(grade)
  const raw = localStorage.getItem(key)
  if (raw !== null) {
    try {
      if (!isConceptProgressMap(JSON.parse(raw))) return false
    } catch {
      return false
    }
  }
  localStorage.setItem(key, JSON.stringify(progressMap))
  return true
}

export function loadConceptProgress(
  conceptId: string,
  grade: PracticeGrade = 5,
): ConceptProgressSummary | null {
  return loadConceptProgressMap(grade)[conceptId] ?? null
}

export function recordConceptProgress(result: SessionResult): {
  summary: ConceptProgressSummary
  saved: boolean
} {
  const grade = resolvePracticeGrade(result.grade)
  const nextMap = mergeConceptProgress(loadConceptProgressMap(grade), result)
  return {
    summary: nextMap[result.conceptId],
    saved: saveConceptProgressMap(nextMap, grade),
  }
}

export function clearConceptProgress(grade: PracticeGrade = 5): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(progressKey(grade))
}
