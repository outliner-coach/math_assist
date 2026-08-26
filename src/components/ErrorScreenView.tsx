'use client'

import ProblemReportActions from './ProblemReportActions'
import type { RouteTemplate } from '@/lib/error-reporting'

interface ErrorScreenViewProps {
  onRetry: () => void
  screenTemplate: RouteTemplate
}

export default function ErrorScreenView({ onRetry, screenTemplate }: ErrorScreenViewProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-5 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">문제가 발생했어요</h1>
        <p role="status" aria-live="polite" className="text-base text-slate-600">
          걱정하지 마세요. 학습 기록은 그대로 남아 있어요.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[56px] items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          data-testid="error-retry"
        >
          다시 시도
        </button>
        <a
          href={`${basePath}/home/`}
          className="inline-flex min-h-[56px] items-center justify-center rounded-xl border-2 border-sky-200 bg-white px-6 py-3 text-base font-bold text-sky-800 transition hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          data-testid="error-home"
        >
          홈으로
        </a>
      </div>
      <section aria-labelledby="error-report-heading" className="rounded-2xl border-2 border-slate-200 bg-white p-5">
        <h2 id="error-report-heading" className="text-lg font-black text-slate-900">
          문제 신고
        </h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">
          고장 난 부분을 운영자에게 알려 주면 도움이 돼요. 보고문에는 답이나 학습 기록이 들어가지 않아요.
        </p>
        <ProblemReportActions classification="technical" screenTemplate={screenTemplate} />
      </section>
    </main>
  )
}
