import type { Metadata, Viewport } from 'next'
import { MascotRouteCompanion } from '@/components'
import AppReliabilityShell from '@/components/AppReliabilityShell'
import './globals.css'

export const metadata: Metadata = {
  title: '수학 연습장',
  description: '초등 수학 개념 학습과 게임형 연습문제',
  icons: {
    icon: '/math_assist/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

/**
 * Enforceable-by-meta CSP for the static export. `script-src 'unsafe-inline'`
 * is the minimum the Next.js static build requires: hydration bootstrap and
 * flight data are emitted as inline <script> blocks, and no external script
 * origin is ever allowed. `unsafe-eval` exists ONLY outside production builds
 * (React's development-mode call-stack tooling); the shipped static artifact
 * keeps the narrowest enforceable policy. Sentry ingest appears in
 * connect-src only when a DSN is configured at build time; without it the app
 * runs fully offline. frame-ancestors is deliberately omitted: a meta policy
 * cannot enforce it, and pretending otherwise would overstate GitHub Pages
 * protection (docs/security.md documents this header limitation).
 */
export function buildContentSecurityPolicy(
  nodeEnv: string | undefined,
  sentryDsn: string | undefined,
): string {
  const connectSrc = ["'self'"]
  if (sentryDsn) {
    connectSrc.push('https://*.sentry.io')
  }
  const scriptSrc = ["'self'", "'unsafe-inline'"]
  if (nodeEnv !== 'production') {
    scriptSrc.push("'unsafe-eval'")
  }
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    "font-src 'self'",
  ].join('; ')
}

const contentSecurityPolicy = buildContentSecurityPolicy(
  process.env.NODE_ENV,
  process.env.NEXT_PUBLIC_SENTRY_DSN,
)

export default function RootLayout({
  children,
}: {
  children?: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">
        {/* React hoists this meta into <head> at render; meta CSP is only honored from there. */}
        <meta httpEquiv="Content-Security-Policy" content={contentSecurityPolicy} />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <AppReliabilityShell>{children}</AppReliabilityShell>
        </div>
        <MascotRouteCompanion />
      </body>
    </html>
  )
}
