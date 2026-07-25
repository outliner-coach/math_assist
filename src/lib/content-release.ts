import type { PracticeGrade } from './types'

const GRADE6_CONTENT_RELEASE_IDS: Readonly<Record<string, string>> = {
  'g6ratio-001': 'grade6-ratio-v1',
  'g6fractiondiv-001': 'grade6-fraction-division-v1',
}

export function resolveContentReleaseId(grade: PracticeGrade, conceptId: string): string {
  if (grade === 5) return 'grade5-static-v1'

  const releaseId = GRADE6_CONTENT_RELEASE_IDS[conceptId]
  if (!releaseId) {
    throw new Error(`알 수 없는 6학년 개념의 콘텐츠 버전입니다: ${conceptId}`)
  }
  return releaseId
}
