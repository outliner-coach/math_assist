import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import SupportPage, { metadata } from './page'

function renderPage(): string {
  return renderToStaticMarkup(createElement(SupportPage))
}

describe('support page content', () => {
  it('declares Korean support metadata', () => {
    expect(JSON.stringify(metadata)).toContain('지원')
  })

  it('lists the operations mailbox and how problem reports work', () => {
    const html = renderPage()
    expect(html).toContain('outliner0206@gmail.com')
    expect(html).toContain('문제 신고')
    expect(html).toContain('복사')
  })

  it('warns when device storage is unavailable', () => {
    const html = renderPage()
    expect(html).toContain('학습은 계속되지만 기록이 남지 않을 수 있어요')
  })

  it('explains backup and recovery', () => {
    const html = renderPage()
    expect(html).toContain('내보내기')
    expect(html).toContain('가져오기')
  })

  it('explains offline first-visit, capacity and update limits', () => {
    const html = renderPage()
    expect(html).toContain('최초')
    expect(html).toContain('용량')
    expect(html).toContain('업데이트')
  })

  it('states the officially supported environments honestly', () => {
    const html = renderPage()
    expect(html).toContain('iPadOS')
    expect(html).toContain('Safari')
    expect(html).toContain('Android Chrome')
    expect(html).toContain('직전')
    expect(html).toContain('Edge')
    expect(html).toContain('공식')
  })

  it('admits the GitHub Pages security header limitation', () => {
    const html = renderPage()
    expect(html).toContain('GitHub Pages')
    expect(html).toContain('헤더')
  })

  it('shows the applied versions and policy update date', () => {
    const html = renderPage()
    expect(html).not.toMatch(/\d+\.\d+\.\d+/)
    expect(html).toMatch(/2026-08-23/)
  })
})

describe('support page prerender safety', () => {
  const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf8')

  it('is a server component without browser access', () => {
    expect(source.trimStart().startsWith("'use client'")).toBe(false)
    expect(source).not.toMatch(/localStorage\.|sessionStorage\.|indexedDB\.|caches\.open|window\.|document\./)
  })

  it('sources release labels from the shared module', () => {
    expect(source).toContain('@/lib/app-release-info')
  })

  it('renders the storage warning from the shared storage-health constant', () => {
    expect(source).toContain('@/lib/storage-health')
    expect(source).toContain('STORAGE_UNAVAILABLE_WARNING')
  })
})
