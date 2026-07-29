import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const evidence = require(
  '../../scripts/generate-problem-visual-browser-evidence.js'
)
const evidenceCore = require(
  '../../scripts/problem-visual-evidence-core.js'
)

function fixtureReport() {
  return {
    schemaVersion: 1,
    catalogVisualItemCount: 1,
    reviewedItemCount: 1,
    viewports: evidenceCore.REQUIRED_VIEWPORTS,
    states: evidenceCore.REQUIRED_STATES,
    storagePreserved: true,
    browserErrors: [],
    representativeSamples: [],
    items: [{
      reviewId: '1:mission:fixture',
      contentHash: 'current-hash',
      visualKind: 'fixture',
      visualSemantics: 'quantitative',
      taskActions: ['compare'],
      variants: [{
        key: 'representative',
        label: '대표',
        viewports: {
          mobile: { pre: true, hint: true, revealed: true },
          tablet: { pre: true, hint: true, revealed: true },
        },
      }],
      passed: true,
      errors: [],
    }],
    summary: {
      passed: 1,
      failed: 0,
      representativeSampleCount: 0,
    },
  }
}

function fixtureLedger() {
  return {
    schemaVersion: 1,
    items: [{
      reviewId: '1:mission:fixture',
      contentHash: 'current-hash',
      status: 'blocked',
      findingCategories: ['accessibility'],
      note: '브라우저 증거 대기.',
      evidence: {
        editorialRead: true,
        variantAudit: true,
        preAnswer: false,
        hint: false,
        revealed: false,
        mobile: false,
        tablet: false,
        artifacts: [],
      },
    }],
  }
}

describe('problem visual browser evidence report', () => {
  it('groups representative samples independently of task-action order', () => {
    const base = {
      visualKind: 'fraction-strip',
      visualSemantics: 'quantitative',
    }

    expect(evidence.representativeKey({
      ...base,
      taskActions: ['reason', 'compare'],
    })).toBe(evidence.representativeKey({
      ...base,
      taskActions: ['compare', 'reason'],
    }))
  })

  it('writes byte-identical canonical JSON without run timestamps', () => {
    const report = {
      summary: { failed: 0, passed: 1 },
      items: [{ reviewId: '1:mission:fixture', passed: true }],
      schemaVersion: 1,
    }

    const first = evidence.stableJson(report)
    const second = evidence.stableJson({
      schemaVersion: 1,
      items: [{ passed: true, reviewId: '1:mission:fixture' }],
      summary: { passed: 1, failed: 0 },
    })

    expect(first).toBe(second)
    expect(first).not.toContain('generatedAt')
    expect(first.endsWith('\n')).toBe(true)
  })

  it('requires complete current evidence before marking a visual receipt pass', () => {
    const report = fixtureReport()
    const ledger = fixtureLedger()

    expect(
      evidenceCore.validateVisualBrowserEvidence(report, [ledger], 1)
    ).toEqual([])

    const [updated] = evidenceCore.applyVisualBrowserEvidence(
      report,
      [ledger],
      'docs/tracking/fixture.json',
      1
    )
    expect(updated.items[0]).toMatchObject({
      status: 'pass',
      findingCategories: ['accessibility'],
      evidence: {
        editorialRead: true,
        variantAudit: true,
        preAnswer: true,
        hint: true,
        revealed: true,
        mobile: true,
        tablet: true,
        artifacts: ['docs/tracking/fixture.json'],
      },
    })
  })

  it('rejects missing, duplicate, stale, failed, and browser-error evidence', () => {
    const report = fixtureReport()
    const ledger = fixtureLedger()
    const invalid = {
      ...report,
      browserErrors: [{ reviewId: 'fixture', message: 'console error' }],
      items: [
        {
          ...report.items[0],
          contentHash: 'stale-hash',
          passed: false,
          errors: ['failed'],
        },
        report.items[0],
      ],
    }

    expect(
      evidenceCore.validateVisualBrowserEvidence(invalid, [ledger], 1)
    ).toEqual(expect.arrayContaining([
      'visual browser evidence must contain zero browser errors',
      'visual browser evidence must contain 1 items',
      '1:mission:fixture: visual evidence did not pass',
      'duplicate visual evidence reviewId: 1:mission:fixture',
      'stale visual evidence contentHash: 1:mission:fixture',
    ]))

    expect(
      evidenceCore.validateVisualBrowserEvidence(
        { ...report, items: [] },
        [ledger],
        1
      )
    ).toContain('missing visual evidence reviewId: 1:mission:fixture')
  })
})
