import type {
  ConceptProgressMap,
  ConceptProgressSummary,
  SessionResult
} from './types'

const PROGRESS_KEY = 'mathAssist_progress_v1'

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

export function loadConceptProgressMap(): ConceptProgressMap {
  if (typeof window === 'undefined') return {}

  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ConceptProgressMap
  } catch {
    return {}
  }
}

export function saveConceptProgressMap(progressMap: ConceptProgressMap): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap))
}

export function loadConceptProgress(conceptId: string): ConceptProgressSummary | null {
  return loadConceptProgressMap()[conceptId] ?? null
}

export function recordConceptProgress(result: SessionResult): ConceptProgressSummary {
  const nextMap = mergeConceptProgress(loadConceptProgressMap(), result)
  saveConceptProgressMap(nextMap)
  return nextMap[result.conceptId]
}

export function clearConceptProgress(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PROGRESS_KEY)
}
