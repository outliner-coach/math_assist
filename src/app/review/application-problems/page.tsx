import type { Metadata } from 'next'

import { getApplicationProblemReviewData } from '@/lib/problem-review'

import ApplicationProblemReviewClient from './ApplicationProblemReviewClient'

export const metadata: Metadata = {
  title: '응용문제 V1 내부 검수',
  description: '승인된 응용문제 family의 대표 사례와 자동 검사 근거를 비교하는 내부 화면',
}

export default function ApplicationProblemReviewPage() {
  const data = getApplicationProblemReviewData()

  return <ApplicationProblemReviewClient data={data} />
}
