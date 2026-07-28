import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const {
  auditAllGrade5Variants,
} = require('../../scripts/grade5-editorial-variant-audit.js')
const reviewCore = require('../../scripts/problem-review-catalog-core.js')

const ledgerPath = join(
  process.cwd(),
  'docs/tracking/problem-editorial-review-v1.json'
)
const visualEvidenceArtifact = 'docs/tracking/problem-visual-browser-evidence-v1.json'

function loadGrade5Ledger() {
  const finalLedger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  return {
    ...finalLedger,
    items: finalLedger.items.filter(
      (item: { reviewId: string }) => item.reviewId.startsWith('5:')
    ),
  }
}

describe('Grade 5 editorial review', () => {
  it('exhausts every allowed parameter variant without answer or rendering defects', () => {
    const audit = auditAllGrade5Variants()

    expect(audit.items).toHaveLength(780)
    expect(new Set(
      audit.items.map((item: { templateId: string }) => item.templateId)
    )).toHaveLength(780)
    expect(audit.totalVariants).toBe(196_167)
    expect(audit.items.flatMap(
      (item: { issues: string[] }) => item.issues
    )).toEqual([])
  })

  it('hashes the Grade 5 text correction into every review item', () => {
    const catalog = reviewCore.buildCatalog(
      reviewCore.loadActualSources().filter(
        (source: { grade: number }) => source.grade === 5
      ),
      reviewCore.RENDERER_REVIEW_VERSION_REGISTRY
    )
    const versionCounts = catalog.items.reduce<Record<string, number>>(
      (counts, item: { rendererReviewVersion: string }) => {
        counts[item.rendererReviewVersion] = (
          counts[item.rendererReviewVersion] ?? 0
        ) + 1
        return counts
      },
      {}
    )

    expect(versionCounts).toEqual({
      'grade5-practice-text-particles-v1': 450,
      'grade5-practice-visual-particles-v1': 297,
      'grade5-practice-cuboid-v2-particles-v1': 30,
      'grade5-practice-three-shape-overlap-v2-particles-v1': 3,
    })
  })

  it('records every Grade 5 source as a current final pass', () => {
    expect(existsSync(ledgerPath)).toBe(true)
    const ledger = loadGrade5Ledger()
    const catalog = reviewCore.buildCatalog(
      reviewCore.loadActualSources().filter(
        (source: { grade: number }) => source.grade === 5
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

    expect(ledger.items).toHaveLength(780)
    expect(new Set(
      ledger.items.map((item: { reviewId: string }) => item.reviewId)
    )).toHaveLength(780)
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
