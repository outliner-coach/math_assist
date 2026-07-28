import type { Metadata } from 'next'

import ProblemReviewClient from './ProblemReviewClient'
import { getApplicationProblemReviewData } from '@/lib/problem-review'

export const metadata: Metadata = {
  title: '세 학년 응용문제 내부 검수',
  description: '등록된 응용문제 family의 대표 사례와 자동 검사 근거를 비교하는 내부 화면',
}

export default function ProblemReviewPage() {
  const data = getApplicationProblemReviewData()

  return <ProblemReviewClient data={data} />
}
