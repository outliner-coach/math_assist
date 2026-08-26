import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  SCHEMA_COMPAT_KEYS,
  compareMetadata,
  fetchLiveMetadata,
  readGitCandidateMetadata,
} from '../scripts/check-rollback-compat.mjs'

const CLI = path.resolve(__dirname, '../scripts/check-rollback-compat.mjs')

function metadata(overrides: Record<string, number> = {}) {
  return {
    schemaVersion: 1,
    appRelease: 'a'.repeat(64),
    contentRelease: 'b'.repeat(64),
    storageSchema: 1,
    exportSchema: 1,
    offlineCacheSchema: 1,
    ...overrides,
  }
}

describe('check-rollback-compat schema comparison', () => {
  it('uses exactly the three learner-data schema keys', () => {
    expect(SCHEMA_COMPAT_KEYS).toEqual(['storageSchema', 'exportSchema', 'offlineCacheSchema'])
  })

  it('accepts identical schema values regardless of release digests', () => {
    const result = compareMetadata(metadata(), metadata({ appRelease: 'c'.repeat(64) }))
    expect(result.compatible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('reports every differing schema key', () => {
    const result = compareMetadata(
      metadata(),
      metadata({ storageSchema: 2, offlineCacheSchema: 3 }),
    )
    expect(result.compatible).toBe(false)
    expect(result.reasons).toEqual([
      'SCHEMA_MISMATCH:storageSchema(live=1,candidate=2)',
      'SCHEMA_MISMATCH:offlineCacheSchema(live=1,candidate=3)',
    ])
  })
})

describe('fetchLiveMetadata', () => {
  it('returns metadata for a reachable live URL', async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ storageSchema: 1, exportSchema: 1, offlineCacheSchema: 1 }), {
        status: 200,
      })) as unknown as typeof fetch
    const result = await fetchLiveMetadata('https://example.invalid/metadata.json', fetchImpl)
    expect(result.reachable).toBe(true)
    expect(result.metadata).toEqual({ storageSchema: 1, exportSchema: 1, offlineCacheSchema: 1 })
  })

  it('treats non-200 responses as an unreachable first-deploy condition', async () => {
    const notFound = (async () => new Response('nope', { status: 404 })) as unknown as typeof fetch
    const result404 = await fetchLiveMetadata('https://example.invalid/metadata.json', notFound)
    expect(result404.reachable).toBe(false)
    expect(result404.reason).toContain('LIVE_HTTP_404')
  })

  it('treats network errors as an unreachable first-deploy condition', async () => {
    const failing = (async () => {
      throw new TypeError('fetch failed')
    }) as unknown as typeof fetch
    const resultError = await fetchLiveMetadata('https://example.invalid/metadata.json', failing)
    expect(resultError.reachable).toBe(false)
    expect(resultError.reason).toContain('LIVE_UNREACHABLE')
  })
})

describe('readGitCandidateMetadata', () => {
  let repoDir: string

  afterAll(() => {
    if (repoDir) rmSync(repoDir, { recursive: true, force: true })
  })

  function git(...args: string[]): string {
    return execFileSync('git', args, { cwd: repoDir, encoding: 'utf8' })
  }

  it('reads committed candidate metadata and reports missing files', () => {
    repoDir = mkdtempSync(path.join(tmpdir(), 'ma-rollback-read-'))
    execFileSync('git', ['init'], { cwd: repoDir })
    execFileSync('git', ['-C', repoDir, 'config', 'user.email', 'fixture@example.com'])
    execFileSync('git', ['-C', repoDir, 'config', 'user.name', 'Fixture'])
    mkdirSync(path.join(repoDir, 'public'), { recursive: true })
    writeFileSync(
      path.join(repoDir, 'public', 'release-metadata.json'),
      `${JSON.stringify(metadata(), null, 2)}\n`,
    )

    // Missing before the first commit.
    const missing = readGitCandidateMetadata('HEAD', repoDir)
    expect(missing.found).toBe(false)

    git('add', '.')
    git('commit', '-m', 'candidate')
    const found = readGitCandidateMetadata('HEAD', repoDir)
    expect(found.found).toBe(true)
    expect(found.metadata).toMatchObject({ storageSchema: 1, exportSchema: 1, offlineCacheSchema: 1 })
  })
})

describe('check-rollback-compat CLI', () => {
  let repoDir: string

  function runCli(args: string[]): { status: number; stdout: string; stderr: string } {
    try {
      const stdout = execFileSync(process.execPath, [CLI, ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      return { status: 0, stdout, stderr: '' }
    } catch (error) {
      const failure = error as { status?: number; stdout?: string; stderr?: string }
      return { status: failure.status ?? 1, stdout: failure.stdout ?? '', stderr: failure.stderr ?? '' }
    }
  }

  function initRepo(withMetadata: boolean): void {
    repoDir = mkdtempSync(path.join(tmpdir(), 'ma-rollback-cli-'))
    execFileSync('git', ['init'], { cwd: repoDir })
    execFileSync('git', ['-C', repoDir, 'config', 'user.email', 'fixture@example.com'])
    execFileSync('git', ['-C', repoDir, 'config', 'user.name', 'Fixture'])
    mkdirSync(path.join(repoDir, 'public'), { recursive: true })
    if (withMetadata) {
      writeFileSync(
        path.join(repoDir, 'public', 'release-metadata.json'),
        `${JSON.stringify(metadata(), null, 2)}\n`,
      )
    }
    execFileSync('git', ['-C', repoDir, 'add', '.'])
    execFileSync('git', ['-C', repoDir, 'commit', '--allow-empty', '-m', 'candidate'])
  }

  function cleanupRepo(): void {
    if (repoDir) rmSync(repoDir, { recursive: true, force: true })
    repoDir = undefined as unknown as string
  }

  it('passes with a first-deploy verdict when the live site is unreachable', () => {
    initRepo(true)
    try {
      const result = runCli([
        '--candidate-ref',
        'HEAD',
        '--repo',
        repoDir,
        '--live-url',
        'http://127.0.0.1:9/metadata.json',
      ])
      expect(result.status).toBe(0)
      const verdict = JSON.parse(result.stdout) as { compatible: boolean; mode: string }
      expect(verdict.compatible).toBe(true)
      expect(verdict.mode).toBe('first-deploy')
    } finally {
      cleanupRepo()
    }
  })

  it('fails with CANDIDATE_METADATA_MISSING when the ref has no metadata file', () => {
    initRepo(false)
    try {
      const result = runCli([
        '--candidate-ref',
        'HEAD',
        '--repo',
        repoDir,
        '--live-url',
        'http://127.0.0.1:9/metadata.json',
      ])
      expect(result.status).toBe(1)
      expect(result.stdout + result.stderr).toContain('CANDIDATE_METADATA_MISSING')
    } finally {
      cleanupRepo()
    }
  })
})
