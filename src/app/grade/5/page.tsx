import type { Metadata } from 'next'

import Grade5UnitSelectionClient from './Grade5UnitSelectionClient'

export const metadata: Metadata = {
  title: '5학년 단원 | 수학 연습장',
}

export default function Grade5Page() {
  return <Grade5UnitSelectionClient />
}
