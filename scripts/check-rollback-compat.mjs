#!/usr/bin/env node
/**
 * check-rollback-compat.mjs — learner-data schema rollback gate (T8)
 *
 * A release candidate may only replace the deployed site when its
 * storageSchema / exportSchema / offlineCacheSchema values can still read the
 * currently deployed device records. This tool compares the candidate's
 * public/release-metadata.json against the LIVE metadata.
 *
 * Modes:
 *   --candidate-ref <sha>  Compare a git ref's committed metadata (standalone).
 *   --check-current        Compare the CURRENT working tree metadata. Used by
 *                          `npm run verify:release` (run-verify.mjs) before any
 *                          deployment artifact is accepted.
 *
 * An unreachable live URL is treated as a first deploy and passes with mode
 * "first-deploy". Missing candidate metadata fails CANDIDATE_METADATA_MISSING.
 * Any differing schema value lists SCHEMA_MISMATCH reasons and exits 1.
 *
 * Usage:
 *   node scripts/check-rollback-compat.mjs --candidate-ref <sha> [--repo <dir>] [--live-url <url>]
 *   node scripts/check-rollback-compat.mjs --check-current [--root <dir>] [--live-url <url>]
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const SCHEMA_COMPAT_KEYS = ['storageSchema', 'exportSchema', 'offlineCacheSchema']

export const DEFAULT_LIVE_URL = 'https://outliner-coach.github.io/math_assist/release-metadata.json'
const FETCH_TIMEOUT_MS = 10000

export function compareMetadata(live, candidate) {
  const reasons = []
  if (!live || typeof live !== 'object') {
    return { compatible: false, reasons: ['LIVE_METADATA_MALFORMED'] }
  }
  if (!candidate || typeof candidate !== 'object') {
    return { compatible: false, reasons: ['CANDIDATE_METADATA_MISSING'] }
  }
  SCHEMA_COMPAT_KEYS.forEach(key => {
    if (live[key] !== candidate[key]) {
      reasons.push(`SCHEMA_MISMATCH:${key}(live=${live[key]},candidate=${candidate[key]})`)
    }
  })
  return { compatible: reasons.length === 0, reasons }
}

async function fetchLiveMetadata(liveUrl, fetchImpl = globalThis.fetch) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetchImpl(liveUrl, { signal: controller.signal })
    if (!response.ok) {
      return { reachable: false, reason: `LIVE_HTTP_${response.status}` }
    }
    const body = await response.json()
    return { reachable: true, metadata: body }
  } catch (error) {
    return { reachable: false, reason: `LIVE_UNREACHABLE:${error?.message ?? error}` }
  } finally {
    clearTimeout(timer)
  }
}

function readGitCandidateMetadata(ref, repoDir) {
  try {
    const raw = execFileSync('git', ['show', `${ref}:public/release-metadata.json`], {
      cwd: repoDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { found: true, metadata: JSON.parse(raw) }
  } catch {
    return { found: false }
  }
}

function readWorkingTreeMetadata(rootDir) {
  const filePath = path.join(rootDir, 'public', 'release-metadata.json')
  if (!existsSync(filePath)) return { found: false }
  try {
    return { found: true, metadata: JSON.parse(readFileSync(filePath, 'utf8')) }
  } catch {
    return { found: false }
  }
}

export { fetchLiveMetadata, readGitCandidateMetadata, readWorkingTreeMetadata }

function printUsage() {
  process.stdout.write(`check-rollback-compat.mjs — learner-data schema rollback gate

Usage:
  node scripts/check-rollback-compat.mjs --candidate-ref <sha> [--repo <dir>] [--live-url <url>]
  node scripts/check-rollback-compat.mjs --check-current [--root <dir>] [--live-url <url>]

Compares storageSchema/exportSchema/offlineCacheSchema between the deployed
metadata and the candidate. Unreachable live site -> first-deploy pass.
Missing candidate metadata -> CANDIDATE_METADATA_MISSING failure.
Prints a verdict JSON object; exit 0 compatible, exit 1 incompatible.
`)
}

async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage()
    return 0
  }

  let candidateRef
  let checkCurrent = false
  let repoDir
  let rootDir
  let liveUrl = process.env.MATH_ASSIST_LIVE_METADATA_URL ?? DEFAULT_LIVE_URL

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--candidate-ref') {
      index += 1
      candidateRef = argv[index]
    } else if (value === '--check-current') {
      checkCurrent = true
    } else if (value === '--repo') {
      index += 1
      repoDir = argv[index]
    } else if (value === '--root') {
      index += 1
      rootDir = argv[index]
    } else if (value === '--live-url') {
      index += 1
      liveUrl = argv[index]
    } else {
      process.stderr.write(`UNKNOWN_ARG:${value}\n`)
      printUsage()
      return 2
    }
  }

  if (!checkCurrent && !candidateRef) {
    process.stderr.write('MISSING_MODE\n')
    printUsage()
    return 2
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const defaultRoot = path.resolve(scriptDir, '..')

  const candidate = checkCurrent
    ? readWorkingTreeMetadata(path.resolve(rootDir ?? defaultRoot))
    : readGitCandidateMetadata(candidateRef, path.resolve(repoDir ?? defaultRoot))

  if (!candidate.found) {
    process.stderr.write('CANDIDATE_METADATA_MISSING\n')
    process.stdout.write(`${JSON.stringify({ compatible: false, mode: checkCurrent ? 'current' : 'ref', candidateRef: candidateRef ?? null, reasons: ['CANDIDATE_METADATA_MISSING'] }, null, 2)}\n`)
    return 1
  }

  const live = await fetchLiveMetadata(liveUrl)
  if (!live.reachable) {
    process.stdout.write(`${JSON.stringify({
      compatible: true,
      mode: 'first-deploy',
      reason: live.reason,
      candidateRef: candidateRef ?? null,
      schemas: Object.fromEntries(SCHEMA_COMPAT_KEYS.map(key => [key, candidate.metadata[key]])),
    }, null, 2)}\n`)
    return 0
  }

  const comparison = compareMetadata(live.metadata, candidate.metadata)
  const verdict = {
    compatible: comparison.compatible,
    mode: checkCurrent ? 'current' : 'ref',
    candidateRef: candidateRef ?? null,
    liveUrl,
    reasons: comparison.reasons,
    schemas: Object.fromEntries(SCHEMA_COMPAT_KEYS.map(key => [key, {
      live: live.metadata[key],
      candidate: candidate.metadata[key],
    }])),
  }
  process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`)
  if (!comparison.compatible) {
    comparison.reasons.forEach(reason => process.stderr.write(`${reason}\n`))
    return 1
  }
  return 0
}

const invokedDirectly = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (invokedDirectly) {
  main(process.argv.slice(2)).then(code => {
    process.exit(code)
  })
}
