import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const reviewCore = require('../../scripts/problem-review-catalog-core.js')
const { serializeReceipt } = require('../../scripts/generate-grade6-editorial-receipt.js')

const receiptPath = join(
  process.cwd(),
  'docs/tracking/problem-editorial-review-work/grade6.json',
)

describe('Grade 6 editorial review receipt', () => {
  it('covers every Grade 6 source exactly once with honest visual blockers', () => {
    expect(existsSync(receiptPath)).toBe(true)
    const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'))
    const catalog = reviewCore.buildCatalog(
      reviewCore.loadActualSources().filter((source: { grade: number }) => source.grade === 6),
      reviewCore.RENDERER_REVIEW_VERSION_REGISTRY,
    )
    const ids = receipt.items.map((item: { reviewId: string }) => item.reviewId)
    const visualItems = new Set(
      catalog.items
        .filter((item: { content: { visual: unknown } }) => item.content.visual !== null)
        .map((item: { reviewId: string }) => item.reviewId),
    )

    expect(receipt.items).toHaveLength(330)
    expect(new Set(ids)).toHaveLength(330)
    expect(ids).toEqual(catalog.items.map((item: { reviewId: string }) => item.reviewId))
    expect(receipt.items.filter((item: { status: string }) => item.status === 'blocked')).toHaveLength(171)

    for (const item of receipt.items) {
      expect(item.evidence.editorialRead).toBe(true)
      expect(item.evidence.variantAudit).toBe(true)
      expect(item.evidence.artifacts.every((artifact: string) => (
        !artifact.startsWith('/')
        && !artifact.split(/[\\/]/).includes('..')
        && existsSync(join(process.cwd(), artifact))
      ))).toBe(true)

      const visualEvidence = [
        item.evidence.preAnswer,
        item.evidence.hint,
        item.evidence.revealed,
        item.evidence.mobile,
        item.evidence.tablet,
      ]
      if (visualItems.has(item.reviewId)) {
        expect(item.status).toBe('blocked')
        expect(visualEvidence).toEqual([false, false, false, false, false])
      } else {
        expect(item.status).toBe('pass')
        expect(visualEvidence).toEqual([null, null, null, null, null])
      }
    }

    const validationErrors = reviewCore
      .loadContractModule()
      .validateEditorialLedger(catalog, receipt)
    expect(validationErrors).toEqual(
      [...visualItems].map((reviewId) => `blocked editorial status: ${reviewId}`),
    )
  })

  it('is byte-deterministic from the reviewed Grade 6 sources', () => {
    expect(serializeReceipt()).toBe(readFileSync(receiptPath, 'utf8'))
  })
})
