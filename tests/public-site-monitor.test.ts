import { describe, expect, it } from 'vitest'
import { buildMonitorChecks, runMonitor } from '../scripts/public-site-monitor.mjs'

const BASE = 'https://outliner-coach.github.io/math_assist/'

function jsonResponse(body: string): Response {
  return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } })
}

describe('public-site-monitor', () => {
  it('builds ordered read-only checks against the public base URL', () => {
    const checks = buildMonitorChecks(BASE)
    expect(checks.map(check => check.id)).toEqual([
      'landing-page',
      'home-page',
      'release-metadata',
      'service-worker',
      'grade3-entry',
    ])
    checks.forEach(check => {
      expect(check.method ?? 'GET').toBe('GET')
      expect(check.url.startsWith(BASE)).toBe(true)
    })
  })

  it('passes when every endpoint responds as expected', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const target = String(input)
      if (target === BASE) return new Response('<html>수학 연습장 홈</html>', { status: 200 })
      if (target.endsWith('/release-metadata.json')) return jsonResponse('{"schemaVersion":1}')
      return new Response('ok', { status: 200 })
    }) as typeof fetch

    const result = await runMonitor(buildMonitorChecks(BASE), fetchImpl)
    expect(result.ok).toBe(true)
    expect(result.failures).toEqual([])
  })

  it('collects every failing check with a reason and keeps the order', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const target = String(input)
      if (target.endsWith('/home/')) return new Response('ok', { status: 200 })
      if (target === BASE) return new Response('<html>다른 사이트</html>', { status: 200 })
      if (target.endsWith('/release-metadata.json')) return new Response('Not Found', { status: 404 })
      throw new TypeError('fetch failed')
    }) as typeof fetch

    const result = await runMonitor(buildMonitorChecks(BASE), fetchImpl)
    expect(result.ok).toBe(false)
    expect(result.failures.map(failure => failure.id)).toEqual([
      'landing-page',
      'release-metadata',
      'service-worker',
      'grade3-entry',
    ])
    expect(result.failures[0].reason).toContain('수학 연습장')
    expect(result.failures[0].reason).not.toContain('status')
    expect(result.failures[1].reason).toContain('404')
    expect(result.failures[2].reason.toLowerCase()).toContain('fetch failed')
  })

  it('rejects release metadata with a wrong schemaVersion', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const target = String(input)
      if (target === BASE) return new Response('<html>수학 연습장</html>', { status: 200 })
      if (target.endsWith('/release-metadata.json')) return jsonResponse('{"schemaVersion":99}')
      return new Response('ok', { status: 200 })
    }) as typeof fetch

    const result = await runMonitor(buildMonitorChecks(BASE), fetchImpl)
    expect(result.ok).toBe(false)
    expect(result.failures.map(failure => failure.id)).toEqual(['release-metadata'])
    expect(result.failures[0].reason).toContain('schemaVersion')
  })
})
