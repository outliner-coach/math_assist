import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const reviewCore = require('../../scripts/problem-review-catalog-core.js')
const { explicitTaskActionsFor } = require('../../scripts/grade6-quality-metadata.js')

const ledgerPath = join(
  process.cwd(),
  'docs/tracking/problem-editorial-review-v1.json'
)
const visualEvidenceArtifact = 'docs/tracking/problem-visual-browser-evidence-v1.json'

function loadGrade6Ledger() {
  const finalLedger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  return {
    ...finalLedger,
    items: finalLedger.items.filter(
      (item: { reviewId: string }) => item.reviewId.startsWith('6:')
    ),
  }
}

describe('Grade 6 final editorial review', () => {
  it('rejects a source definition that omits explicit taskActions', () => {
    expect(() => explicitTaskActionsFor({
      family: 'missing-actions',
      pattern: 'direct',
    })).toThrow(/taskActions/)
  })

  it('records every Grade 6 source as a current final pass', () => {
    expect(existsSync(ledgerPath)).toBe(true)
    const ledger = loadGrade6Ledger()
    const catalog = reviewCore.buildCatalog(
      reviewCore.loadActualSources().filter(
        (source: { grade: number }) => source.grade === 6
      ),
      reviewCore.RENDERER_REVIEW_VERSION_REGISTRY
    )
    const visualItems = new Set(
      catalog.items
        .filter((item: { content: { visual: unknown } }) => (
          item.content.visual !== null
        ))
        .map((item: { reviewId: string }) => item.reviewId)
    )

    expect(ledger.items).toHaveLength(330)
    expect(new Set(
      ledger.items.map((item: { reviewId: string }) => item.reviewId)
    )).toHaveLength(330)
    expect(ledger.items.map((item: { reviewId: string }) => item.reviewId)).toEqual(
      catalog.items.map((item: { reviewId: string }) => item.reviewId)
    )

    for (const item of ledger.items) {
      const visualEvidence = [
        item.evidence.preAnswer,
        item.evidence.hint,
        item.evidence.revealed,
        item.evidence.mobile,
        item.evidence.tablet,
      ]
      expect(item.status, item.reviewId).toBe('pass')
      expect(item.findingCategories, item.reviewId).toEqual([])
      expect(item.evidence.editorialRead, item.reviewId).toBe(true)
      expect(item.evidence.variantAudit, item.reviewId).toBe(true)
      expect(item.note.trim().length, item.reviewId).toBeGreaterThan(0)
      if (visualItems.has(item.reviewId)) {
        expect(visualEvidence, item.reviewId).toEqual([true, true, true, true, true])
        expect(item.evidence.artifacts, item.reviewId).toContain(visualEvidenceArtifact)
      } else {
        expect(visualEvidence, item.reviewId).toEqual([null, null, null, null, null])
      }
    }

    expect(
      reviewCore.loadContractModule().validateEditorialLedger(catalog, ledger)
    ).toEqual([])
  })
})
