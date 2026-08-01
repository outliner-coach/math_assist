import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  changedReviewDigest,
  finalizeEditorialLedger,
} = require('../../scripts/problem-editorial-finalization-core.js')

const unchangedReceipt = {
  reviewId: '1:mission:unchanged',
  contentHash: 'same-hash',
  status: 'pass',
  findingCategories: [],
  note: '기존 검수 완료.',
  evidence: {
    editorialRead: true,
    variantAudit: true,
    preAnswer: true,
    hint: true,
    revealed: true,
    mobile: true,
    tablet: true,
    artifacts: ['docs/tracking/old.json'],
  },
}

const catalog = {
  items: [
    {
      reviewId: '1:mission:unchanged',
      contentHash: 'same-hash',
      grade: 1,
      unitId: 'unit-a',
      family: 'family-a',
      taskActions: ['calculate'],
      visualKind: 'clock-face',
      requiredEvidence: ['text', 'visual'],
    },
    {
      reviewId: '3:mission:new',
      contentHash: 'new-hash',
      grade: 3,
      unitId: 'unit-b',
      family: 'family-b',
      taskActions: ['analyze_error', 'construct'],
      visualKind: 'circle-parts',
      requiredEvidence: ['text', 'visual'],
    },
  ],
}

describe('problem editorial finalization', () => {
  it('preserves unchanged receipts and blocks reviewed changed sources until fresh browser evidence', () => {
    const ledger = { schemaVersion: 1, items: [unchangedReceipt] }
    const digest = changedReviewDigest(catalog, ledger)
    const result = finalizeEditorialLedger(catalog, ledger, {
      expectedCatalogCount: 2,
      expectedVisualCount: 2,
      expectedChangedCount: 1,
      expectedNewCount: 1,
      expectedChangedDigest: digest,
      reviewLabel: 'T14',
    })

    expect(result.items[0]).toEqual(unchangedReceipt)
    expect(result.items[1]).toMatchObject({
      reviewId: '3:mission:new',
      contentHash: 'new-hash',
      status: 'blocked',
      findingCategories: [],
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
    })
    expect(result.items[1].note).toContain('analyze_error+construct')
    expect(result.items[1].note).toContain('브라우저')
  })

  it('fails closed when the independently reviewed changed set drifts', () => {
    const ledger = { schemaVersion: 1, items: [unchangedReceipt] }

    expect(() => finalizeEditorialLedger(catalog, ledger, {
      expectedCatalogCount: 2,
      expectedVisualCount: 2,
      expectedChangedCount: 1,
      expectedNewCount: 1,
      expectedChangedDigest: 'stale-review-digest',
      reviewLabel: 'T14',
    })).toThrow(/changed review digest/)
  })
})
