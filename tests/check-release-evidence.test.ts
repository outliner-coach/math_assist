import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  REQUIRED_PLATFORM_IDS,
  REQUIRED_SCENARIO_IDS,
  validateEvidence,
} from '../scripts/check-release-evidence.mjs'
import { computeReleaseMetadata } from '../scripts/release-digest-core.mjs'

const CHECKER = path.resolve(__dirname, '../scripts/check-release-evidence.mjs')
const REPO_ROOT = path.resolve(__dirname, '..')
const CURRENT_FINGERPRINT = computeReleaseMetadata(REPO_ROOT).appRelease

const GOOD_FINGERPRINT = CURRENT_FINGERPRINT

function buildEvidence(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    releaseFingerprint: GOOD_FINGERPRINT,
    checkedAt: 1756100000000,
    platforms: REQUIRED_PLATFORM_IDS.map(id => ({
      id,
      deviceModel: 'iPad Pro 11-inch (M2)',
      osVersion: 'iPadOS 18.5',
      browserVersion: 'Safari 18.5',
      scenarios: REQUIRED_SCENARIO_IDS.map(scenarioId => ({
        id: scenarioId,
        pass: true,
        note: `VoiceOver confirmed ${scenarioId} on device`,
      })),
    })),
    ...overrides,
  }
}

describe('check-release-evidence validator', () => {
  it('accepts a complete evidence record for the expected fingerprint', () => {
    expect(validateEvidence(buildEvidence(), GOOD_FINGERPRINT)).toEqual([])
  })

  it('rejects a fingerprint that is not lowercase 64-hex', () => {
    const codes = validateEvidence(buildEvidence({ releaseFingerprint: 'ABC' }), GOOD_FINGERPRINT)
    expect(codes).toContain('FINGERPRINT_FORMAT')
  })

  it('rejects a valid-format fingerprint that does not match the current product digest', () => {
    const codes = validateEvidence(buildEvidence({ releaseFingerprint: 'b'.repeat(64) }), GOOD_FINGERPRINT)
    expect(codes).toContain('FINGERPRINT_MISMATCH')
  })

  it('rejects placeholder notes like TBD and empty notes', () => {
    const evidence = buildEvidence()
    evidence.platforms[0].scenarios[0].note = 'TBD after device pass'
    expect(validateEvidence(evidence, GOOD_FINGERPRINT)).toContain('NOTE_PLACEHOLDER')

    const emptyNote = buildEvidence()
    emptyNote.platforms[1].scenarios[3].note = '   '
    expect(validateEvidence(emptyNote, GOOD_FINGERPRINT)).toContain('NOTE_PLACEHOLDER')
  })

  it('rejects a wrong platform set with SCHEMA_PLATFORMS', () => {
    const swapped = buildEvidence()
    swapped.platforms = [swapped.platforms[0], { ...swapped.platforms[0], id: 'desktop-chrome-nvda' }]
    expect(validateEvidence(swapped, GOOD_FINGERPRINT)).toContain('SCHEMA_PLATFORMS')

    const single = buildEvidence()
    single.platforms = [single.platforms[0]]
    expect(validateEvidence(single, GOOD_FINGERPRINT)).toContain('SCHEMA_PLATFORMS')
  })

  it('rejects a wrong scenario set or failed scenario with SCHEMA_SCENARIOS', () => {
    const missingOne = buildEvidence()
    missingOne.platforms[1].scenarios = missingOne.platforms[1].scenarios.slice(0, 6)
    expect(validateEvidence(missingOne, GOOD_FINGERPRINT)).toContain('SCHEMA_SCENARIOS')

    const failed = buildEvidence()
    failed.platforms[0].scenarios[2].pass = false
    expect(validateEvidence(failed, GOOD_FINGERPRINT)).toContain('SCHEMA_SCENARIOS')
  })

  it('rejects non-integer checked timestamps with SCHEMA_SHAPE', () => {
    const badTime = buildEvidence({ checkedAt: '2026-08-25' })
    expect(validateEvidence(badTime, GOOD_FINGERPRINT)).toContain('SCHEMA_SHAPE')
  })
})

describe('check-release-evidence CLI', () => {
  let tempDir: string

  afterAll(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true })
  })

  function writeEvidenceFile(name: string, payload: unknown): string {
    if (!tempDir) tempDir = mkdtempSync(path.join(tmpdir(), 'ma-evidence-'))
    const filePath = path.join(tempDir, name)
    writeFileSync(filePath, JSON.stringify(payload, null, 2))
    return filePath
  }

  function runChecker(args: string[]): { status: number; stderr: string; stdout: string } {
    try {
      const stdout = execFileSync(process.execPath, [CHECKER, ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      return { status: 0, stderr: '', stdout }
    } catch (error) {
      const failure = error as { status?: number; stderr?: string; stdout?: string }
      return { status: failure.status ?? 1, stderr: failure.stderr ?? '', stdout: failure.stdout ?? '' }
    }
  }

  it('passes when the evidence fingerprint equals the freshly recomputed product digest', () => {
    const evidencePath = writeEvidenceFile('valid.json', buildEvidence())
    const result = runChecker(['--evidence', evidencePath, '--root', REPO_ROOT])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('EVIDENCE_OK')
  }, 60000)

  it('fails with EVIDENCE_MISSING when the file does not exist and documents this in --help', () => {
    const missing = runChecker(['--evidence', path.join(tmpdir(), `nope-${Date.now()}.json`)])
    expect(missing.status).toBe(1)
    expect(missing.stderr).toContain('EVIDENCE_MISSING')

    const help = execFileSync(process.execPath, [CHECKER, '--help'], { encoding: 'utf8' })
    expect(help).toContain('EVIDENCE_MISSING')
    expect(help.toLowerCase()).toContain('missing')
  })

  it('fails with FINGERPRINT_MISMATCH for stale evidence against the recomputed digest', () => {
    const evidencePath = writeEvidenceFile('stale.json', buildEvidence({ releaseFingerprint: 'c'.repeat(64) }))
    const result = runChecker(['--evidence', evidencePath, '--root', REPO_ROOT])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('FINGERPRINT_MISMATCH')
  })

  it('fails with NOTE_PLACEHOLDER for template notes', () => {
    const templated = buildEvidence()
    templated.platforms[0].scenarios[4].note = 'TBD'
    const evidencePath = writeEvidenceFile('tbd.json', templated)
    const result = runChecker(['--evidence', evidencePath, '--root', REPO_ROOT])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('NOTE_PLACEHOLDER')
  })

  it('fails with SCHEMA_PLATFORMS for an unexpected platform list', () => {
    const wrongPlatforms = buildEvidence()
    wrongPlatforms.platforms = [
      { ...wrongPlatforms.platforms[0], id: 'macos-safari-voiceover' },
      wrongPlatforms.platforms[1],
    ]
    const evidencePath = writeEvidenceFile('platforms.json', wrongPlatforms)
    const result = runChecker(['--evidence', evidencePath, '--root', REPO_ROOT])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('SCHEMA_PLATFORMS')
  })
})
