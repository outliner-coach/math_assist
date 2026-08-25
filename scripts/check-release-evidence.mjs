#!/usr/bin/env node
/**
 * check-release-evidence.mjs — manual accessibility release evidence gate (T8)
 *
 * Validates docs/tracking/accessibility-release-v1.json against
 * docs/tracking/accessibility-release-v1.schema.json semantics AND against the
 * CURRENT product input fingerprint recomputed with the exact same digest core
 * as generate-release-metadata.mjs (scripts/release-digest-core.mjs).
 *
 * Fixed reason codes (printed to stderr, exit 1):
 *   EVIDENCE_MISSING      evidence file does not exist. A release CANNOT pass
 *                         until real two-device evidence lands; no template or
 *                         placeholder file is accepted.
 *   SCHEMA_SHAPE          top-level shape violations (schemaVersion, checkedAt,
 *                         missing keys, malformed entries, failed scenario).
 *   FINGERPRINT_FORMAT    releaseFingerprint is not lowercase 64-hex.
 *   FINGERPRINT_MISMATCH  releaseFingerprint differs from the current product
 *                         input fingerprint.
 *   SCHEMA_PLATFORMS      platform list is not exactly the two required real
 *                         assistive-tech platforms (with device/os/browser).
 *   SCHEMA_SCENARIOS      per-platform scenario set is not exactly the seven
 *                         required ids or any scenario is not passed.
 *   NOTE_PLACEHOLDER      empty note or template note like "TBD".
 *
 * Usage:
 *   node scripts/check-release-evidence.mjs [--evidence <path>] [--root <dir>]
 *                                           [--fingerprint <64hex>] [--help]
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { computeReleaseMetadata } from './release-digest-core.mjs'

export const EVIDENCE_SCHEMA_VERSION = 1

export const REQUIRED_PLATFORM_IDS = ['ipados-safari-voiceover', 'android-chrome-talkback']

export const REQUIRED_SCENARIO_IDS = [
  'home-profile',
  'learning-check',
  'hint-solution',
  'scratchpad',
  'profile-transfer',
  'offline-learning',
  'error-recovery',
]

const REASON_PRIORITY = [
  'EVIDENCE_MISSING',
  'SCHEMA_SHAPE',
  'FINGERPRINT_FORMAT',
  'FINGERPRINT_MISMATCH',
  'SCHEMA_PLATFORMS',
  'SCHEMA_SCENARIOS',
  'NOTE_PLACEHOLDER',
]

const PLACEHOLDER_NOTE_PATTERN = /(^|[^a-z])(tbd|todo|tba|fixme|placeholder)([^a-z]|$)/i
const FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isPlatformEntryValid(platform) {
  if (!platform || typeof platform !== 'object') return false
  return (
    isNonEmptyString(platform.id) &&
    isNonEmptyString(platform.deviceModel) &&
    isNonEmptyString(platform.osVersion) &&
    isNonEmptyString(platform.browserVersion)
  )
}

function sameIdSet(actualIds, expectedIds) {
  if (!Array.isArray(actualIds) || actualIds.length !== expectedIds.length) return false
  const remaining = [...expectedIds]
  actualIds.forEach(id => {
    const index = remaining.indexOf(id)
    if (index !== -1) remaining.splice(index, 1)
  })
  return remaining.length === 0
}

export function validateEvidence(evidence, expectedFingerprint) {
  const codes = new Set()

  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    codes.add('SCHEMA_SHAPE')
    return sortCodes(codes)
  }

  if (evidence.schemaVersion !== EVIDENCE_SCHEMA_VERSION) codes.add('SCHEMA_SHAPE')
  if (!Number.isInteger(evidence.checkedAt) || evidence.checkedAt <= 0) codes.add('SCHEMA_SHAPE')

  if (typeof evidence.releaseFingerprint !== 'string' || !FINGERPRINT_PATTERN.test(evidence.releaseFingerprint)) {
    codes.add('FINGERPRINT_FORMAT')
  } else if (evidence.releaseFingerprint !== expectedFingerprint) {
    codes.add('FINGERPRINT_MISMATCH')
  }

  if (
    !Array.isArray(evidence.platforms) ||
    !sameIdSet(evidence.platforms.map(platform => platform?.id), REQUIRED_PLATFORM_IDS) ||
    !evidence.platforms.every(isPlatformEntryValid)
  ) {
    codes.add('SCHEMA_PLATFORMS')
  } else {
    evidence.platforms.forEach(platform => {
      const scenarios = Array.isArray(platform.scenarios) ? platform.scenarios : []
      const idsValid = sameIdSet(scenarios.map(scenario => scenario?.id), REQUIRED_SCENARIO_IDS)
      const passesValid = scenarios.every(
        scenario => scenario && typeof scenario === 'object' && scenario.pass === true,
      )
      if (!idsValid || !passesValid) {
        codes.add('SCHEMA_SCENARIOS')
        return
      }
      scenarios.forEach(scenario => {
        if (!isNonEmptyString(scenario.note) || PLACEHOLDER_NOTE_PATTERN.test(scenario.note)) {
          codes.add('NOTE_PLACEHOLDER')
        }
      })
    })
  }

  return sortCodes(codes)
}

function sortCodes(codes) {
  return REASON_PRIORITY.filter(code => codes.has(code))
}

function printUsage() {
  process.stdout.write(`check-release-evidence.mjs — accessibility release evidence gate

Usage:
  node scripts/check-release-evidence.mjs [options]

Options:
  --evidence <path>     Evidence JSON file
                        (default: docs/tracking/accessibility-release-v1.json)
  --root <dir>          Product root used to recompute the current release
                        fingerprint (default: repository root)
  --fingerprint <hex>   Override the expected 64-hex fingerprint instead of
                        recomputing it from product inputs
  --help                Show this help

Contract:
  The checker requires exactly two real assistive-tech platforms
  (${REQUIRED_PLATFORM_IDS.join(', ')}) covering exactly seven scenarios each,
  all passed, with real notes. It also recomputes the current product input
  fingerprint and requires evidence.releaseFingerprint to match.

  A MISSING evidence file FAILS with EVIDENCE_MISSING. Release cannot pass
  until real device evidence lands — do not create a fake-passing template.
`)
}

async function main(argv) {
  const args = { evidence: undefined, root: undefined, fingerprint: undefined, help: false }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--evidence') {
      index += 1
      args.evidence = argv[index]
    } else if (value === '--root') {
      index += 1
      args.root = argv[index]
    } else if (value === '--fingerprint') {
      index += 1
      args.fingerprint = argv[index]
    } else if (value === '--help' || value === '-h') {
      args.help = true
    } else {
      process.stderr.write(`UNKNOWN_ARG:${value}\n`)
      printUsage()
      return 2
    }
  }

  if (args.help) {
    printUsage()
    return 0
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const root = path.resolve(args.root ?? path.join(scriptDir, '..'))
  const evidencePath = path.resolve(args.evidence ?? path.join(root, 'docs', 'tracking', 'accessibility-release-v1.json'))

  let expectedFingerprint
  try {
    expectedFingerprint = args.fingerprint ?? computeReleaseMetadata(root).appRelease
  } catch (error) {
    process.stderr.write(`${error?.code ?? error?.message ?? error}\n`)
    return 1
  }

  if (!existsSync(evidencePath)) {
    process.stderr.write('EVIDENCE_MISSING\n')
    process.stderr.write(`expected evidence at ${evidencePath} — a release cannot pass until real two-device evidence lands\n`)
    return 1
  }

  let evidence
  try {
    evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  } catch {
    process.stderr.write('SCHEMA_SHAPE\nEVIDENCE_UNPARSEABLE\n')
    return 1
  }

  const codes = validateEvidence(evidence, expectedFingerprint)
  if (codes.length > 0) {
    codes.forEach(code => process.stderr.write(`${code}\n`))
    return 1
  }

  process.stdout.write(`EVIDENCE_OK fingerprint=${expectedFingerprint}\n`)
  return 0
}

const invokedDirectly = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (invokedDirectly) {
  main(process.argv.slice(2)).then(code => {
    process.exit(code)
  })
}
