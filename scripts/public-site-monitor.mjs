#!/usr/bin/env node
/**
 * public-site-monitor.mjs — read-only production site monitor (T8)
 *
 * Checks the deployed GitHub Pages site in order, GET only, 10s timeout each:
 *   1. landing page responds 200 and contains the app title "수학 연습장"
 *   2. /home/ responds 200
 *   3. release-metadata.json parses as JSON with schemaVersion === 1
 *   4. sw.js (service worker) responds 200
 *   5. representative grade entry /grade/3/ responds 200
 *
 * Read-only: never submits answers, never creates profiles or learner data,
 * and sends nothing to Sentry. Exits non-zero listing failed checks; when run
 * inside GitHub Actions it also appends a step summary.
 *
 * Usage: node scripts/public-site-monitor.mjs [--base-url <url>] [--timeout-ms <ms>]
 */
import { appendFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'

export const DEFAULT_BASE_URL = 'https://outliner-coach.github.io/math_assist/'
export const DEFAULT_TIMEOUT_MS = 10000

function joinUrl(baseUrl, suffix) {
  return `${baseUrl.replace(/\/?$/, '/')}${suffix}`
}

export function buildMonitorChecks(baseUrl) {
  return [
    {
      id: 'landing-page',
      url: joinUrl(baseUrl, ''),
      bodyIncludes: '수학 연습장',
    },
    { id: 'home-page', url: joinUrl(baseUrl, 'home/') },
    {
      id: 'release-metadata',
      url: joinUrl(baseUrl, 'release-metadata.json'),
      json(payload) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'metadata is not an object'
        if (payload.schemaVersion !== 1) return `expected schemaVersion 1 got ${JSON.stringify(payload.schemaVersion)}`
        return null
      },
    },
    { id: 'service-worker', url: joinUrl(baseUrl, 'sw.js') },
    { id: 'grade3-entry', url: joinUrl(baseUrl, 'grade/3/') },
  ]
}

async function runCheck(check, fetchImpl, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetchImpl(check.url, { method: 'GET', signal: controller.signal })
  } catch (error) {
    const reason = error?.name === 'AbortError' ? `timeout after ${timeoutMs}ms` : `fetch failed: ${error?.message ?? error}`
    return reason
  } finally {
    clearTimeout(timer)
  }

  if (response.status !== (check.status ?? 200)) {
    return `expected status ${check.status ?? 200} got ${response.status}`
  }

  if (check.bodyIncludes !== undefined) {
    try {
      const body = await response.text()
      if (!body.includes(check.bodyIncludes)) return `body does not contain "${check.bodyIncludes}"`
    } catch (error) {
      return `body read failed: ${error?.message ?? error}`
    }
  }

  if (check.json) {
    let payload
    try {
      payload = JSON.parse(await response.text())
    } catch (error) {
      return `invalid JSON: ${error?.message ?? error}`
    }
    const problem = check.json(payload)
    if (problem) return problem
  }

  return null
}

export async function runMonitor(checks, fetchImpl = globalThis.fetch, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const failures = []
  for (const check of checks) {
    const failure = await runCheck(check, fetchImpl, timeoutMs)
    if (failure) failures.push({ id: check.id, url: check.url, reason: failure })
  }
  return { ok: failures.length === 0, failures, total: checks.length }
}

function writeStepSummary(result) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) return
  const lines = [
    '## Public site monitor',
    '',
    '| Check | Result |',
    '| --- | --- |',
  ]
  result.checks.forEach(check => {
    const failure = result.failures.find(item => item.id === check.id)
    lines.push(`| ${check.id} | ${failure ? `FAIL — ${failure.reason}` : 'PASS'} |`)
  })
  lines.push('', `Result: ${result.ok ? 'PASS' : 'FAIL'} (${result.failures.length}/${result.total} failed)`, '')
  try {
    appendFileSync(summaryPath, lines.join('\n'))
  } catch {
    // Step summary is best-effort; the job verdict does not depend on it.
  }
}

function printUsage() {
  process.stdout.write(`public-site-monitor.mjs — read-only production monitor

Usage:
  node scripts/public-site-monitor.mjs [--base-url <url>] [--timeout-ms <ms>]

Default base URL: ${DEFAULT_BASE_URL}
Read-only GET checks only; no learner data is created or sent anywhere.
`)
}

async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage()
    return 0
  }

  let baseUrl = DEFAULT_BASE_URL
  let timeoutMs = DEFAULT_TIMEOUT_MS
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--base-url') {
      index += 1
      baseUrl = argv[index]
    } else if (value === '--timeout-ms') {
      index += 1
      timeoutMs = Number(argv[index])
    } else {
      process.stderr.write(`UNKNOWN_ARG:${value}\n`)
      return 2
    }
  }

  const checks = buildMonitorChecks(baseUrl)
  const result = await runMonitor(checks, undefined, { timeoutMs })

  checks.forEach(check => {
    const failure = result.failures.find(item => item.id === check.id)
    process.stdout.write(`${failure ? 'FAIL' : 'PASS'} ${check.id} ${check.url}${failure ? ` — ${failure.reason}` : ''}\n`)
  })

  writeStepSummary({ ...result, checks })

  if (!result.ok) {
    process.stderr.write(`MONITOR_FAILED:${result.failures.map(failure => failure.id).join(',')}\n`)
    return 1
  }
  process.stdout.write('SITE_OK all public site checks passed\n')
  return 0
}

const invokedDirectly = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (invokedDirectly) {
  main(process.argv.slice(2)).then(code => {
    process.exit(code)
  })
}
