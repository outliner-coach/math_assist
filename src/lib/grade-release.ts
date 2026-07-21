export type CurriculumGatedGrade = 4 | 6
export type CurriculumReleaseState = 'not-released' | 'release-candidate' | 'released'

const RELEASE_STATES = new Set<CurriculumReleaseState>([
  'not-released',
  'release-candidate',
  'released',
])
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

type FetchLike = typeof fetch

export async function getCurriculumGradeReleaseState(
  grade: CurriculumGatedGrade,
  fetchImpl: FetchLike = fetch,
): Promise<CurriculumReleaseState | null> {
  try {
    const response = await fetchImpl(`${BASE_PATH}/data/curriculum-allocations-v1.json`)
    if (!response.ok) return null
    const value: unknown = await response.json()
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const releaseState = (value as { releaseState?: unknown }).releaseState
    if (!releaseState || typeof releaseState !== 'object' || Array.isArray(releaseState)) return null
    const state = (releaseState as Record<string, unknown>)[`grade${grade}`]
    return typeof state === 'string' && RELEASE_STATES.has(state as CurriculumReleaseState)
      ? state as CurriculumReleaseState
      : null
  } catch {
    return null
  }
}

export async function isCurriculumGradeReleased(
  grade: CurriculumGatedGrade,
  fetchImpl: FetchLike = fetch,
): Promise<boolean> {
  return await getCurriculumGradeReleaseState(grade, fetchImpl) === 'released'
}
