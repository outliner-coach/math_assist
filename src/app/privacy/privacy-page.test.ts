import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import PrivacyPage, { metadata } from './page'

function renderPage(): string {
  return renderToStaticMarkup(createElement(PrivacyPage))
}

describe('privacy page content', () => {
  it('declares Korean privacy metadata', () => {
    expect(JSON.stringify(metadata)).toContain('개인정보')
  })

  it('explains the device-local inventory', () => {
    const html = renderPage()
    expect(html).toContain('기기에 저장')
    expect(html).toContain('localStorage')
    expect(html).toContain('Cache Storage')
  })

  it('states profiles are not an authentication boundary', () => {
    const html = renderPage()
    expect(html).toContain('인증')
  })

  it('describes export contents and deletion', () => {
    const html = renderPage()
    expect(html).toContain('내보내기 파일')
    expect(html).toContain('삭제')
  })

  it('discloses Sentry allow-listed fields and the retention cap', () => {
    const html = renderPage()
    expect(html).toContain('MathAssistTechnicalError')
    expect(html).toContain('route_template')
    expect(html).toContain('error_kind')
    expect(html).toContain('30일')
  })

  it('states there are no ads, analytics or remote learning storage', () => {
    const html = renderPage()
    expect(html).toContain('광고')
    expect(html).toContain('분석')
  })

  it('shows the applied versions and policy update date from shared constants', () => {
    const html = renderPage()
    expect(html).not.toMatch(/\d+\.\d+\.\d+/)
    expect(renderPage()).toMatch(/2026-08-23/)
  })
})

describe('privacy page prerender safety', () => {
  const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf8')

  it('is a server component without browser access', () => {
    expect(source.trimStart().startsWith("'use client'")).toBe(false)
    expect(source).not.toMatch(/localStorage\.|sessionStorage\.|indexedDB\.|caches\.open|window\.|document\./)
  })

  it('sources release labels from the shared module instead of hardcoding', () => {
    expect(source).toContain('@/lib/app-release-info')
  })
})
