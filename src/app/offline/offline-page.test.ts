import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import OfflinePage, { metadata } from './page'

process.env.NEXT_PUBLIC_BASE_PATH = '/math_assist'

describe('offline page', () => {
  it('declares Korean offline metadata', () => {
    expect(JSON.stringify(metadata)).toContain('오프라인')
  })

  it('guides the learner and links home under the base path', () => {
    const html = renderToStaticMarkup(createElement(OfflinePage))
    expect(html).toContain('오프라인')
    expect(html).toContain('href="/math_assist/home/"')
  })

  it('keeps guidance honest about installed packs', () => {
    const html = renderToStaticMarkup(createElement(OfflinePage))
    expect(html).toContain('저장된 학습 팩')
  })
})

describe('offline page prerender safety', () => {
  const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf8')

  it('is a server component without browser access', () => {
    expect(source.trimStart().startsWith("'use client'")).toBe(false)
    expect(source).not.toMatch(/localStorage\.|sessionStorage\.|indexedDB\.|caches\.open|window\.|document\./)
  })
})
