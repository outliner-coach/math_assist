import type { Metadata } from 'next'

import Grade6UnitSelectionClient from './Grade6UnitSelectionClient'

export const metadata: Metadata = {
  title: '6학년 단원 | 수학 연습장',
}

export default function Grade6Page() {
  return <Grade6UnitSelectionClient />
}
