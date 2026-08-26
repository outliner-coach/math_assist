import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { buildContentSecurityPolicy, default as RootLayout } from './layout'

vi.mock('next/navigation', () => ({
  usePathname: () => '/math_assist/',
}))

function extractCsp(html: string): string {
  const match = /http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html)
  if (!match) return ''
  return match[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}

describe('buildContentSecurityPolicy', () => {
  it('locks self assets and allows only the inline hydration minimum in production builds', () => {
    expect(buildContentSecurityPolicy('production', undefined)).toBe(
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'",
    )
    expect(buildContentSecurityPolicy('production', '')).not.toContain('sentry')
  })

  it('loosens script-src with unsafe-eval only outside production builds', () => {
    const development = buildContentSecurityPolicy('development', undefined)
    expect(development).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
  })

  it('adds the Sentry ingest origin to connect-src only when a DSN exists at build time', () => {
    const withDsn = buildContentSecurityPolicy('production', 'https://example.ingest.sentry.io/1')
    expect(withDsn).toContain("connect-src 'self' https://*.sentry.io")
  })

  it('never pretends meta can enforce frame-ancestors', () => {
    expect(buildContentSecurityPolicy('production', undefined)).not.toContain('frame-ancestors')
  })
})

describe('root layout CSP meta', () => {
  it('emits the policy into the document head ahead of the body', () => {
    const html = renderToStaticMarkup(createElement(RootLayout, {}, createElement('p')))
    expect(html).toContain('<html lang="ko">')
    expect(html).toContain('<body class="bg-gray-50 min-h-screen"><div class="max-w-4xl mx-auto px-4 py-6">')
    expect(html.indexOf('Content-Security-Policy')).toBeGreaterThan(-1)
    expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('<body'))
    expect(extractCsp(html)).toBe(
      buildContentSecurityPolicy(process.env.NODE_ENV, process.env.NEXT_PUBLIC_SENTRY_DSN),
    )
  })
})
