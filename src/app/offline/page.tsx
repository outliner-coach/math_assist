import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '오프라인 안내 | 수학 연습장',
  description: '인터넷에 연결되어 있지 않을 때 학습을 계속하는 방법을 안내합니다.',
}

export default function OfflinePage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-5 py-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">오프라인 상태예요</h1>
        <p role="status" aria-live="polite" className="text-base leading-relaxed text-slate-600">
          인터넷에 연결되어 있지 않아요. 이미 저장된 학습 팩이 있다면 오프라인으로도
          학습을 계속할 수 있어요.
        </p>
      </header>
      <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-slate-700">
        <li>인터넷 연결이 다시 되면 새 학습 내용과 업데이트를 받아요.</li>
        <li>처음 방문한 기기라면 연결 후에 오프라인 학습이 준비돼요.</li>
      </ul>
      <div>
        <a
          href={`${basePath}/home/`}
          className="inline-flex min-h-[56px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          data-testid="offline-home"
        >
          홈으로
        </a>
      </div>
    </main>
  )
}
