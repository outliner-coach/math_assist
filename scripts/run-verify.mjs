#!/usr/bin/env node
/**
 * run-verify.mjs — layered verification orchestrator (T8)
 *
 * Modes (sequential, stop on first failure, child exit codes propagate):
 *   fast    lint → vitest → tdd guard → static build → Playwright smoke lane
 *   full    content validators → audits → promptfoo → review catalog pair →
 *           vitest → lint → tdd guard → build → full Playwright suite
 *   release full + release evidence check + production dependency security
 *           gate + rollback compatibility check against the deployed site
 *
 * Usage:
 *   node scripts/run-verify.mjs <fast|full|release> [--phase <id>[,<id>...]] [--list] [--help]
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const MODES = ['fast', 'full', 'release']

export const LIVE_METADATA_URL = 'https://outliner-coach.github.io/math_assist/release-metadata.json'

const SMOKE_COMMAND = 'npx playwright test e2e/home-learning-modes.spec.ts e2e/mascot-service.spec.ts'

const FAST_PHASES = [
  { id: 'lint', command: 'npm run lint' },
  { id: 'vitest', command: 'npm run test' },
  { id: 'tdd-guard', command: 'npm run tdd:guard' },
  { id: 'build', command: 'npm run build' },
  { id: 'e2e-smoke', command: SMOKE_COMMAND },
]

// There is deliberately no validate:grade5; Grade 5 template banks are covered
// by validate:templates plus audit:problems.
const FULL_PHASES = [
  { id: 'validate-grade1', command: 'npm run validate:grade1' },
  { id: 'validate-grade2', command: 'npm run validate:grade2' },
  { id: 'validate-grade3', command: 'npm run validate:grade3' },
  { id: 'validate-grade4', command: 'npm run validate:grade4' },
  { id: 'validate-grade6', command: 'npm run validate:grade6' },
  { id: 'validate-curriculum', command: 'npm run validate:curriculum' },
  { id: 'validate-templates', command: 'npm run validate:templates' },
  { id: 'validate-application-packs', command: 'npm run validate:application-packs' },
  { id: 'audit-missions', command: 'npm run audit:missions' },
  { id: 'audit-problems', command: 'npm run audit:problems' },
  { id: 'audit-applications', command: 'npm run audit:applications' },
  { id: 'promptfoo-problems', command: 'npm run promptfoo:problems' },
  // The editorial ledger must always be checked AFTER regeneration.
  { id: 'catalog-generate', command: 'npm run generate:problem-review-catalog' },
  { id: 'editorial-check', command: 'npm run check:problem-editorial-review' },
  { id: 'vitest', command: 'npm run test' },
  { id: 'lint', command: 'npm run lint' },
  { id: 'tdd-guard', command: 'npm run tdd:guard' },
  { id: 'build', command: 'npm run build' },
  { id: 'e2e-full', command: 'npm run test:e2e' },
]

const RELEASE_ONLY_PHASES = [
  { id: 'release-evidence', command: 'node scripts/check-release-evidence.mjs' },
  { id: 'dependency-audit', command: 'npm audit --omit=dev --audit-level=high' },
  { id: 'rollback-compat', command: 'node scripts/check-rollback-compat.mjs --check-current' },
]

export const VERIFY_PHASES = {
  fast: FAST_PHASES,
  full: FULL_PHASES,
  release: [...FULL_PHASES.map(phase => ({ ...phase })), ...RELEASE_ONLY_PHASES],
}

export function getPhaseIds(mode) {
  assertMode(mode)
  return VERIFY_PHASES[mode].map(phase => phase.id)
}

export function nextPhase(phaseIds, currentId) {
  const index = phaseIds.indexOf(currentId)
  if (index === -1 || index + 1 >= phaseIds.length) return null
  return phaseIds[index + 1]
}

export function isTerminalFailure(exitCode) {
  return exitCode !== 0 || exitCode == null
}

export function selectPhases(mode, wantedIds) {
  const phases = VERIFY_PHASES[mode]
  const unknown = wantedIds.filter(id => !phases.some(phase => phase.id === id))
  if (unknown.length > 0) {
    throw new Error(`UNKNOWN_PHASE:${unknown.join(',')}`)
  }
  return phases.filter(phase => wantedIds.includes(phase.id))
}

function assertMode(mode) {
  if (!MODES.includes(mode)) {
    throw new Error(`UNKNOWN_MODE:${mode}`)
  }
}

function formatSeconds(milliseconds) {
  return `${(milliseconds / 1000).toFixed(1)}s`
}

function parseArgs(argv) {
  const args = { mode: undefined, phases: [], list: false, help: false }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--phase') {
      index += 1
      args.phases.push(...(argv[index] ?? '').split(',').filter(Boolean))
    } else if (value === '--list') {
      args.list = true
    } else if (value === '--help' || value === '-h') {
      args.help = true
    } else if (args.mode === undefined && !value.startsWith('--')) {
      args.mode = value
    } else {
      throw new Error(`UNKNOWN_ARG:${value}`)
    }
  }
  return args
}

function printUsage() {
  process.stdout.write(`run-verify.mjs — layered verification orchestrator

Usage:
  node scripts/run-verify.mjs <fast|full|release> [options]

Modes:
  fast     lint -> vitest -> tdd:guard -> build -> Playwright smoke lane
           (e2e/home-learning-modes.spec.ts + e2e/mascot-service.spec.ts)
  full     content validators -> audits -> promptfoo -> review catalog pair
           (generate BEFORE editorial check) -> vitest -> lint -> tdd:guard
           -> build -> full Playwright suite
  release  full + release evidence check + production dependency audit
           (npm audit --omit=dev --audit-level=high) + rollback compat check
           against ${LIVE_METADATA_URL}

Options:
  --phase <id[,id...]>  Run only the named phases in canonical order
  --list                Print phase ids for a mode and exit
  --help                Show this help

Execution is strictly sequential and stops at the first failing phase,
propagating its exit code. Every phase duration is printed.
`)
}

async function main(argv) {
  let args
  try {
    args = parseArgs(argv)
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    printUsage()
    return 2
  }

  if (args.help) {
    printUsage()
    return 0
  }

  if (!args.mode || !MODES.includes(args.mode)) {
    process.stderr.write(`MISSING_OR_UNKNOWN_MODE:${args.mode ?? ''}\n`)
    printUsage()
    return 2
  }

  let selectedPhases
  try {
    selectedPhases = args.phases.length > 0 ? selectPhases(args.mode, args.phases) : VERIFY_PHASES[args.mode]
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 2
  }

  if (args.list) {
    selectedPhases.forEach(phase => process.stdout.write(`${phase.id}\n`))
    return 0
  }

  const startedAt = Date.now()
  for (const phase of selectedPhases) {
    process.stdout.write(`[verify:${args.mode}] START ${phase.id}: ${phase.command}\n`)
    const phaseStartedAt = Date.now()
    const result = spawnSync(phase.command, {
      shell: true,
      stdio: 'inherit',
      env: process.env,
    })
    const elapsed = Date.now() - phaseStartedAt
    if (isTerminalFailure(result.status)) {
      const detail = result.status == null ? `signal=${result.signal}` : `code=${result.status}`
      process.stdout.write(
        `[verify:${args.mode}] FAIL ${phase.id} (${detail}, ${formatSeconds(elapsed)}) — stopping, later phases skipped\n`,
      )
      return result.status ?? 1
    }
    process.stdout.write(`[verify:${args.mode}] PASS ${phase.id} (${formatSeconds(elapsed)})\n`)
  }

  process.stdout.write(
    `[verify:${args.mode}] OK all ${selectedPhases.length} phase(s) passed in ${formatSeconds(Date.now() - startedAt)}\n`,
  )
  return 0
}

const invokedDirectly = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (invokedDirectly) {
  main(process.argv.slice(2)).then(code => {
    process.exit(code)
  })
}
