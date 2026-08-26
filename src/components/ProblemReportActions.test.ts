import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import ProblemReportActions from './ProblemReportActions'

function renderActions(
  props?: Partial<Parameters<typeof ProblemReportActions>[0]>,
): string {
  return renderToStaticMarkup(
    createElement(ProblemReportActions, {
      classification: 'technical',
      screenTemplate: 'unknown',
      ...props,
    }),
  )
}

describe('ProblemReportActions rendering', () => {
  it('offers a mail report addressed to the operations mailbox', () => {
    const html = renderActions({ problemId: 'g5-add-001' })
    expect(html).toContain('href="mailto:outliner0206@gmail.com?')
    expect(html).toContain('메일로 신고하기')
    expect(html).toContain('보고문 복사')
  })

  it('announces copy results through a polite live region', () => {
    const html = renderActions()
    expect(html).toContain('aria-live="polite"')
    expect(html).toMatch(/role="status"/)
  })

  it('keeps the visible report free of learner data', () => {
    const html = renderActions()
    expect(decodeURIComponent(html)).not.toMatch(/정답|오답|닉네임|profile-|Mozilla/)
  })

  it('exposes the fallback textarea for manual copying', () => {
    const html = renderActions()
    expect(html).not.toContain('<textarea')
  })
})

describe('ProblemReportActions source contract', () => {
  const source = fs.readFileSync(path.join(__dirname, 'ProblemReportActions.tsx'), 'utf8')

  it('is a client component wired to the sanitized report builder', () => {
    expect(source.trimStart().startsWith("'use client'")).toBe(true)
    expect(source).toContain('buildProblemReport')
    expect(source).toContain('@/lib/problem-report')
  })

  it('never touches learner storage', () => {
    expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|caches\b/)
    expect(source).not.toMatch(/removeItem|\.clear\(/)
  })

  it('never reads or forwards user agent data', () => {
    expect(source).not.toMatch(/userAgent|navigator\.userAgent/)
  })
})
