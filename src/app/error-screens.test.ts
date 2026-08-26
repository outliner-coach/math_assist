import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import RouteError from './error'
import GlobalError from './global-error'

process.env.NEXT_PUBLIC_BASE_PATH = '/math_assist'

function makeErrorProps() {
  return {
    error: new Error('secret local stack detail must never be shown'),
    reset: () => undefined,
  }
}

const STORAGE_PATTERNS =
  /localStorage|sessionStorage|indexedDB|caches\b|removeItem|\.clear\(/g

describe('route error screen', () => {
  it('renders retry, home and report actions in Korean', () => {
    const html = renderToStaticMarkup(createElement(RouteError, makeErrorProps()))
    expect(html).toContain('문제가 발생했어요')
    expect(html).toContain('다시 시도')
    expect(html).toContain('홈으로')
    expect(html).toContain('문제 신고')
  })

  it('links home under the deployed base path', () => {
    const html = renderToStaticMarkup(createElement(RouteError, makeErrorProps()))
    expect(html).toContain('href="/math_assist/home/"')
  })

  it('never shows the real error text', () => {
    const html = renderToStaticMarkup(createElement(RouteError, makeErrorProps()))
    expect(html).not.toContain('secret local stack detail')
  })
})

describe('global error screen', () => {
  it('renders its own html and body shells', () => {
    const html = renderToStaticMarkup(createElement(GlobalError, makeErrorProps()))
    expect(html.startsWith('<html')).toBe(true)
    expect(html).toContain('<body')
    expect(html).toContain('다시 시도')
    expect(html).toContain('/math_assist/home/')
    expect(html).not.toContain('secret local stack detail')
  })
})

describe('error screen source contract', () => {
  const appDir = path.join(__dirname)

  it.each(['error.tsx', 'global-error.tsx'])(
    '%s is a client component that never clears storage',
    (fileName) => {
      const source = fs.readFileSync(path.join(appDir, fileName), 'utf8')
      expect(source.trimStart().startsWith("'use client'")).toBe(true)
      expect(source).not.toMatch(STORAGE_PATTERNS)
    },
  )

  it('reports technical errors through the sanitized reporting module', () => {
    const source = fs.readFileSync(path.join(appDir, 'error.tsx'), 'utf8')
    expect(source).toContain('reportTechnicalError')
    expect(source).toContain('routeTemplateFromPathname')
    expect(source).toContain("errorKind: 'render'")
  })

  it('reports global errors with the unknown route template', () => {
    const source = fs.readFileSync(path.join(appDir, 'global-error.tsx'), 'utf8')
    expect(source).toContain('reportTechnicalError')
    expect(source).toContain("'unknown'")
  })

  it('shares one accessible screen view for both boundaries', () => {
    const viewSource = fs.readFileSync(
      path.join(appDir, '..', 'components', 'ErrorScreenView.tsx'),
      'utf8',
    )
    expect(viewSource.trimStart().startsWith("'use client'")).toBe(true)
    expect(viewSource).not.toMatch(STORAGE_PATTERNS)
    expect(fs.readFileSync(path.join(appDir, 'error.tsx'), 'utf8')).toContain(
      'ErrorScreenView',
    )
    expect(fs.readFileSync(path.join(appDir, 'global-error.tsx'), 'utf8')).toContain(
      'ErrorScreenView',
    )
  })
})
