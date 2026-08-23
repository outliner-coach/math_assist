import type { Metadata } from 'next'

import { getApplicationProblemReviewData } from '@/lib/problem-review'

import ApplicationProblemReviewClient from './ApplicationProblemReviewClient'

export const metadata: Metadata = {
  title: '전 학년 응용문제 내부 검수',
  description: '2~6학년 draft와 production 응용문제의 대표·경계 사례와 자동 검사 근거를 비교하는 읽기 전용 화면',
}

export default function ApplicationProblemReviewPage() {
  const data = getApplicationProblemReviewData()

  return <ApplicationProblemReviewClient data={data} />
}
