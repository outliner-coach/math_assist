import type { Metadata } from 'next'

import LandingPageClient from './LandingPageClient'

export const metadata: Metadata = {
  title: '수학 연습장 | 초등 수학을 한 문제씩',
  description: '가입 없이 바로 시작하는 초등 수학 개념 학습과 게임형 연습문제',
}

export default function LandingPage() {
  return <LandingPageClient />
}
