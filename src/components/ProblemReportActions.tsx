'use client'

import { useState } from 'react'

import {
  buildProblemReport,
  buildProblemReportClipboardText,
  type ProblemReportClassification,
} from '@/lib/problem-report'
import type { RouteTemplate } from '@/lib/error-reporting'

interface ProblemReportActionsProps {
  classification: ProblemReportClassification
  screenTemplate: RouteTemplate
  problemId?: string
  contentRelease?: string
  appRelease?: string
}

type CopyStatus = 'idle' | 'copied' | 'failed'

export default function ProblemReportActions({
  classification,
  screenTemplate,
  problemId,
  contentRelease,
  appRelease,
}: ProblemReportActionsProps) {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const [showFallback, setShowFallback] = useState(false)
  const report = buildProblemReport({
    classification,
    problemId,
    contentRelease,
    appRelease,
    screenTemplate,
  })

  async function handleCopy() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(
          buildProblemReportClipboardText(report),
        )
        setStatus('copied')
        return
      }
      throw new Error('clipboard-unavailable')
    } catch {
      setStatus('failed')
      setShowFallback(true)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <a
          href={report.mailtoUrl}
          className="inline-flex min-h-[56px] items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          data-testid="problem-report-mail"
        >
          메일로 신고하기
        </a>
        <button
          type="button"
          onClick={() => {
            void handleCopy()
          }}
          className="inline-flex min-h-[56px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-base font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
          data-testid="problem-report-copy"
        >
          보고문 복사
        </button>
      </div>
      <p role="status" aria-live="polite" className="text-sm font-semibold text-slate-600">
        {status === 'copied' && '보고문을 복사했어요. 메일이나 다른 방법으로 붙여 넣어 주세요.'}
        {status === 'failed' && '자동 복사가 막혔어요. 아래 내용을 직접 선택해 복사해 주세요.'}
      </p>
      {showFallback && (
        <div>
          <label htmlFor="problem-report-fallback" className="block text-sm font-bold text-slate-700">
            신고 보고문
          </label>
          <textarea
            id="problem-report-fallback"
            readOnly
            rows={8}
            value={report.body}
            className="mt-1 w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-sm text-slate-800"
          />
        </div>
      )}
    </div>
  )
}
