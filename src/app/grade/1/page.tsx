import { Suspense } from 'react'

import Grade1GameClient from './Grade1GameClient'

export default function Grade1Page() {
  return (
    <Suspense fallback={<main className="-mx-4 -my-6 min-h-screen bg-[#f8fafc] p-6"><p className="mx-auto max-w-5xl rounded-3xl bg-white p-6 text-lg font-black">1학년 탐험을 준비하고 있어요.</p></main>}>
      <Grade1GameClient />
    </Suspense>
  )
}
