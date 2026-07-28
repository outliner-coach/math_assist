import type { Metadata } from 'next'

import ProblemReviewClient from './ProblemReviewClient'
import { getProblemReviewData } from '@/lib/problem-review'

export const metadata: Metadata = {
  title: '1–6학년 문제 렌더러 검수',
  description: '1,540개 원문을 실제 학년별 시각 렌더러의 제출 전·힌트·정답 공개 상태로 검수하는 내부 페이지',
}

export default async function ProblemReviewPage() {
  const data = await getProblemReviewData()

  return <ProblemReviewClient data={data} />
}
