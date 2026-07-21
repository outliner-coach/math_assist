import { Suspense } from 'react'

import Grade4MissionRouteClient from './Grade4MissionRouteClient'

export default function Grade4MissionPage() {
  return (
    <Suspense fallback={<main className="-mx-4 -my-6 min-h-screen bg-[#eef2ff] p-6"><p className="mx-auto max-w-5xl rounded-3xl bg-white p-6 text-lg font-black">큰 수 활동을 준비하고 있어요.</p></main>}>
      <Grade4MissionRouteClient />
    </Suspense>
  )
}
