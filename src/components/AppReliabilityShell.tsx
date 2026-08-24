'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import { initErrorReporting } from '@/lib/error-reporting'
import { getLearnerStorage } from '@/lib/profile-bootstrap'
import { useLearnerLeaseStatus } from '@/lib/use-lease-status'

/**
 * AppReliabilityShell (T7). Client wrapper around every app page that fixes
 * the global bootstrap order once per document mount:
 *   (a) profile bootstrap warm-up so registry/migration settle before any
 *       learner surface reads scoped storage,
 *   (b) client-only technical error reporting (no-DSN safe),
 *   (c) production-only service-worker registration pointing at the static
 *       sw.js asset — failures are tolerated so deploys without the worker
 *       or release metadata never break the app,
 *   (d) children render unchanged; the shell itself paints nothing.
 */

export function resolveServiceWorkerScriptUrl(basePath: string | undefined): string {
  return `${basePath ?? ''}/sw.js`
}

export function shouldRegisterServiceWorker(
  navigatorLike: unknown,
  nodeEnv: string | undefined,
): boolean {
  if (typeof navigatorLike !== 'object' || navigatorLike === null) return false
  if (!('serviceWorker' in navigatorLike)) return false
  return nodeEnv === 'production'
}

function LeaseLostOverlay() {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="reliability-overlay" data-testid="lease-lost-overlay">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="lease-lost-title"
        aria-describedby="lease-lost-description"
        className="reliability-dialog"
      >
        <h2 id="lease-lost-title" ref={headingRef} tabIndex={-1} className="text-xl font-black text-[#0f172a]">
          다른 탭에서 프로필이 바뀌었어요
        </h2>
        <p id="lease-lost-description" className="mt-3 text-sm font-bold leading-6 text-[#64748b]">
          이 탭에서는 더 이상 학습 기록을 저장하지 않아요. 홈을 다시 열면 새 프로필로 이어서 시작할 수 있어요.
        </p>
        <button
          type="button"
          data-testid="lease-lost-reload"
          onClick={() => {
            window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? '/math_assist'}/home/`
          }}
          className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#1d4ed8] px-6 font-black text-white"
        >
          홈으로 다시 열기
        </button>
      </div>
    </div>
  )
}

export default function AppReliabilityShell({ children }: { children?: ReactNode }) {
  const leaseStatus = useLearnerLeaseStatus()

  useEffect(() => {
    try {
      getLearnerStorage()
    } catch {
      // Fail-closed consumers already handle null storage; warm-up must never throw.
    }

    void initErrorReporting({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? null,
    }).catch(() => {
      // Reporting stays silent; the app must run without Sentry.
    })

    if (
      shouldRegisterServiceWorker(
        typeof navigator !== 'undefined' ? navigator : undefined,
        process.env.NODE_ENV,
      )
    ) {
      navigator.serviceWorker
        .register(resolveServiceWorkerScriptUrl(process.env.NEXT_PUBLIC_BASE_PATH))
        .catch(() => {
          // Missing sw.js or a failed install must not break the page (dev safety).
        })
    }
  }, [])

  return (
    <>
      {children}
      {leaseStatus === 'lost' ? <LeaseLostOverlay /> : null}
    </>
  )
}
