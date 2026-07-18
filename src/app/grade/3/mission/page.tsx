import { Suspense } from 'react'

import Grade3MissionRouteClient from './Grade3MissionRouteClient'

export default function Grade3MissionPage() {
  return (
    <Suspense
      fallback={
        <main className="grade3-game-surface -mx-4 -my-6 min-h-screen bg-[#f0fdfa] px-4 py-5 md:px-6">
          <div className="mx-auto max-w-6xl rounded-[2rem] border-2 border-[#ccfbf1] bg-white p-6 text-lg font-black text-[#0f172a]">
            미션을 준비하고 있어요.
          </div>
        </main>
      }
    >
      <Grade3MissionRouteClient />
    </Suspense>
  )
}
