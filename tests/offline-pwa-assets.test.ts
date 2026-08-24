import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const PUBLIC = path.resolve(__dirname, '../public')

describe('PWA static assets (T5)', () => {
  it('serves a deterministic manifest.webmanifest scoped to /math_assist/', () => {
    const raw = readFileSync(path.join(PUBLIC, 'manifest.webmanifest'), 'utf8')
    const manifest = JSON.parse(raw) as Record<string, unknown>
    expect(manifest.start_url).toBe('/math_assist/')
    expect(manifest.scope).toBe('/math_assist/')
    expect(manifest.display).toBe('standalone')
    expect(Array.isArray(manifest.icons)).toBe(true)
    const icons = manifest.icons as Array<Record<string, string>>
    icons.forEach(icon => {
      expect(icon.src.startsWith('/math_assist/')).toBe(true)
      expect(icon.src.includes('?')).toBe(false)
      expect(icon.type).toBe('image/svg+xml')
    })
    expect(existsSync(path.join(PUBLIC, 'icons/icon.svg'))).toBe(true)
  })

  it('keeps hand-written SVG icons valid and tiny without new dependencies', () => {
    const icon = readFileSync(path.join(PUBLIC, 'icons/icon.svg'), 'utf8')
    const maskable = readFileSync(path.join(PUBLIC, 'icons/maskable-icon.svg'), 'utf8')
    ;[icon, maskable].forEach(source => {
      expect(source.trimStart().startsWith('<svg')).toBe(true)
      expect(source.trimEnd().endsWith('</svg>')).toBe(true)
      expect(source).toContain('viewBox="0 0 512 512"')
      expect(Buffer.byteLength(source)).toBeLessThan(4096)
    })
    expect(icon).not.toBe(maskable)
  })

  it('ships a hand-written classic service worker with no build step and fixed protocol names', () => {
    const sw = readFileSync(path.join(PUBLIC, 'sw.js'), 'utf8')
    ;[
      'MATH_ASSIST_INSTALL_GRADE_PACK',
      'MATH_ASSIST_REMOVE_GRADE_PACK',
      'MATH_ASSIST_QUERY_OFFLINE_STATE',
      'MATH_ASSIST_ACTIVATE_UPDATE',
      'MATH_ASSIST_OFFLINE_PROGRESS',
      'MATH_ASSIST_OFFLINE_STATE',
      'MATH_ASSIST_OFFLINE_ERROR',
      'MATH_ASSIST_UPDATE_READY',
      'math-assist-shell:',
      'math-assist-visited:',
      'math-assist-grade:',
      "BASE + '/offline/'",
    ].forEach(needle => {
      expect(sw).toContain(needle)
    })
    const swCode = sw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
    expect(swCode).not.toContain('localStorage')
    expect(swCode).not.toContain('indexedDB')
    expect(swCode).not.toContain('self.skipWaiting()')
    expect(sw).toMatch(/schemaVersion:\s*1/)
  })

  it('does not embed release digests or timestamps in the worker source', () => {
    const sw = readFileSync(path.join(PUBLIC, 'sw.js'), 'utf8')
    expect(sw).not.toMatch(/[0-9a-f]{64}/)
    expect(sw).not.toMatch(/20\d\d-\d\d-\d\d/)
  })
})
