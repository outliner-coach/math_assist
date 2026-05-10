import { describe, expect, it } from 'vitest'

const {
  classifyChangedFiles,
  evaluateTddGuard,
  evaluatePorcelainStatus,
  formatTddGuardResult,
  parsePorcelainStatus
} = require('../../scripts/tdd-guard-core')

describe('tdd_guard_core', () => {
  it('denies production changes when no tests changed', () => {
    const result = evaluateTddGuard(['src/lib/grader.ts'])

    expect(result.allowed).toBe(false)
    expect(result.productFiles).toEqual(['src/lib/grader.ts'])
    expect(result.testFiles).toEqual([])
    expect(result.reason).toContain('TDD violation')
  })

  it('allows production changes paired with a test change', () => {
    const result = evaluateTddGuard(['src/lib/grader.ts', 'src/lib/grader.test.ts'])

    expect(result.allowed).toBe(true)
    expect(result.reason).toContain('include test changes')
  })

  it('ignores documentation and harness metadata changes', () => {
    const result = evaluateTddGuard([
      'AGENTS.md',
      '.codex/hooks/tdd-guard.sh',
      'docs/ARCHITECTURE.md',
      'phases/index.json'
    ])

    expect(result.allowed).toBe(true)
    expect(result.productFiles).toEqual([])
  })

  it('classifies public data changes as production changes', () => {
    const result = classifyChangedFiles(['public/data/concepts.json'])

    expect(result.productFiles).toEqual(['public/data/concepts.json'])
  })

  it('parses renamed paths from git porcelain output', () => {
    const files = parsePorcelainStatus(' M src/lib/a.ts\nR  src/lib/old.ts -> src/lib/new.ts\n?? src/lib/a.test.ts\n')

    expect(files).toEqual(['src/lib/a.ts', 'src/lib/new.ts', 'src/lib/a.test.ts'])
  })

  it('allows Codex-created production files when the same step creates a focused test', () => {
    const result = evaluatePorcelainStatus('?? src/lib/new-helper.ts\n?? src/lib/new-helper.test.ts\n')

    expect(result.allowed).toBe(true)
    expect(result.productFiles).toEqual(['src/lib/new-helper.ts'])
    expect(result.testFiles).toEqual(['src/lib/new-helper.test.ts'])
  })

  it('allows explicitly reviewed maintenance changes without tests', () => {
    const result = evaluateTddGuard(['public/data/concepts.json'], { allowNoTest: true })

    expect(result.allowed).toBe(true)
    expect(result.reason).toContain('TDD_GUARD_ALLOW_NO_TEST')
  })

  it('renders Codex-friendly CLI output for denied production-only changes', () => {
    const result = evaluateTddGuard(['src/app/page.tsx'])
    const rendered = formatTddGuardResult(result)

    expect(rendered.exitCode).toBe(1)
    expect(rendered.stderr.join('\n')).toContain('tdd-guard: deny')
    expect(rendered.stderr.join('\n')).toContain('no matching test files')
  })
})
