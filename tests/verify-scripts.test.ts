import { describe, expect, it } from 'vitest'
import {
  MODES,
  VERIFY_PHASES,
  getPhaseIds,
  isTerminalFailure,
  nextPhase,
  selectPhases,
} from '../scripts/run-verify.mjs'

function ids(mode: 'fast' | 'full' | 'release'): string[] {
  return getPhaseIds(mode)
}

describe('run-verify orchestration table', () => {
  it('exposes exactly the fast, full, and release modes', () => {
    expect(MODES).toEqual(['fast', 'full', 'release'])
    expect(Object.keys(VERIFY_PHASES).sort()).toEqual(['fast', 'full', 'release'])
  })

  it('runs fast in lint → vitest → tdd guard → build → e2e smoke order', () => {
    expect(ids('fast')).toEqual(['lint', 'vitest', 'tdd-guard', 'build', 'e2e-smoke'])
  })

  it('smoke lane runs only the two named spec files', () => {
    const smoke = VERIFY_PHASES.fast.find(phase => phase.id === 'e2e-smoke')
    expect(smoke?.command).toContain('e2e/home-learning-modes.spec.ts')
    expect(smoke?.command).toContain('e2e/mascot-service.spec.ts')
  })

  it('validates every existing grade validator name plus curriculum, templates, application packs', () => {
    const full = ids('full')
    expect(full).toEqual(
      expect.arrayContaining([
        'validate-grade1',
        'validate-grade2',
        'validate-grade3',
        'validate-grade4',
        'validate-grade6',
        'validate-curriculum',
        'validate-templates',
        'validate-application-packs',
      ]),
    )
    // There is no validate:grade5 script; only existing validator names appear.
    const commands = VERIFY_PHASES.full.map(phase => phase.command)
    expect(commands.some(command => command.includes('validate:grade5'))).toBe(false)
  })

  it('includes mission, problem, and application audits in full', () => {
    const full = ids('full')
    expect(full).toEqual(expect.arrayContaining(['audit-missions', 'audit-problems', 'audit-applications']))
  })

  it('keeps promptfoo problem evaluation mandatory in full', () => {
    const promptfoo = VERIFY_PHASES.full.find(phase => phase.id === 'promptfoo-problems')
    expect(promptfoo?.command).toBe('npm run promptfoo:problems')
  })

  it('runs catalog generation immediately before the editorial ledger check in full', () => {
    const full = ids('full')
    const generateIndex = full.indexOf('catalog-generate')
    const checkIndex = full.indexOf('editorial-check')
    expect(generateIndex).toBeGreaterThanOrEqual(0)
    expect(checkIndex).toBe(generateIndex + 1)
    expect(nextPhase(full, 'catalog-generate')).toBe('editorial-check')
  })

  it('orders content validation → audits → promptfoo → catalog pair → vitest → lint → guard → build → full e2e', () => {
    const full = ids('full')
    expect(full[0]).toBe('validate-grade1')
    const lastAudit = full.indexOf('audit-applications')
    expect(full.indexOf('promptfoo-problems')).toBe(lastAudit + 1)
    expect(nextPhase(full, 'promptfoo-problems')).toBe('catalog-generate')
    const buildIndex = full.indexOf('build')
    expect(full.slice(buildIndex)).toEqual(['build', 'e2e-full'])
    expect(full.indexOf('vitest')).toBeGreaterThan(full.indexOf('editorial-check'))
    expect(full.indexOf('lint')).toBeGreaterThan(full.indexOf('vitest'))
    expect(full.indexOf('tdd-guard')).toBeGreaterThan(full.indexOf('lint'))
    expect(VERIFY_PHASES.full.find(phase => phase.id === 'e2e-full')?.command)
      .toBe('npm run test:e2e:production')
  })

  it('release extends full with evidence check, production dependency audit, and rollback compat in order', () => {
    const release = ids('release')
    const full = ids('full')
    expect(release.slice(0, full.length)).toEqual(full)
    expect(release.slice(full.length)).toEqual([
      'release-evidence',
      'dependency-audit',
      'rollback-compat',
    ])
  })
})

describe('run-verify phase ordering helpers', () => {
  it('nextPhase returns the following phase id and null at the tail or unknown input', () => {
    const full = ids('full')
    expect(nextPhase(full, 'validate-grade1')).toBe('validate-grade2')
    expect(nextPhase(full, full[full.length - 1])).toBeNull()
    expect(nextPhase(full, 'no-such-phase')).toBeNull()
  })

  it('isTerminalFailure treats any non-zero or signal exit as terminal', () => {
    expect(isTerminalFailure(0)).toBe(false)
    expect(isTerminalFailure(1)).toBe(true)
    expect(isTerminalFailure(127)).toBe(true)
    expect(isTerminalFailure(null)).toBe(true)
    expect(isTerminalFailure(undefined)).toBe(true)
  })

  it('selectPhases keeps canonical order and rejects unknown phase ids', () => {
    expect(selectPhases('fast', ['build', 'lint']).map(phase => phase.id)).toEqual(['lint', 'build'])
    expect(() => selectPhases('fast', ['nope'])).toThrow(/UNKNOWN_PHASE:nope/)
  })
})
