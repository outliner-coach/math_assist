import type { Metadata } from 'next'

import GuestHomeClient from './GuestHomeClient'

export const metadata: Metadata = {
  title: '학습 홈 | 수학 연습장',
  description: '이 기기에 저장된 진도에서 초등 수학 학습을 이어갑니다.',
}

export default function HomePage() {
  return <GuestHomeClient />
}
