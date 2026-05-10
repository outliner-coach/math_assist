import { Suspense } from 'react'

import Grade2MissionRouteClient from './Grade2MissionRouteClient'

export default function Grade2MissionPage() {
  return (
    <Suspense
      fallback={
        <main className="grade2-game-surface -mx-4 -my-6 min-h-screen bg-[#f1f7fb] px-4 py-5 md:px-6">
          <div className="mx-auto max-w-6xl rounded-[2rem] border-2 border-[#d8e3ef] bg-white p-6 text-lg font-black text-[#0f172a]">
            미션을 준비하고 있어요.
          </div>
        </main>
      }
    >
      <Grade2MissionRouteClient />
    </Suspense>
  )
}
