import type { Metadata } from 'next'

import ProblemReviewClient from './ProblemReviewClient'
import { getProblemReviewData } from '@/lib/problem-review'

export const metadata: Metadata = {
  title: '연습문제 검수 보드',
  description: '문제 유형, 난이도, 보기, 정답을 한 번에 검수하는 페이지',
}

export default async function ProblemReviewPage() {
  const data = await getProblemReviewData()

  return <ProblemReviewClient data={data} />
}
