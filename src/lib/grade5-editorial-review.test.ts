import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const {
  auditAllGrade5Variants,
} = require('../../scripts/grade5-editorial-variant-audit.js')
const reviewCore = require('../../scripts/problem-review-catalog-core.js')
const {
  createReceipt,
  loadDecisions,
  serializeReceipt,
} = require('../../scripts/generate-grade5-editorial-receipt.js')

const receiptPath = join(
  process.cwd(),
  'docs/tracking/problem-editorial-review-work/grade5.json'
)

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

  it('has no default pass when a per-item decision is incomplete', () => {
    const decisions = structuredClone(loadDecisions())
    delete decisions.items[0].status

    expect(() => createReceipt(decisions)).toThrow(/explicit status/)
  })

  it('rejects a missing per-item decision instead of synthesizing one', () => {
    const decisions = structuredClone(loadDecisions())
    decisions.items.shift()

    expect(() => createReceipt(decisions)).toThrow(/missing explicit review decision/)
  })

  it('requires unresolved findings to remain blocked with their categories', () => {
    const decisions = structuredClone(loadDecisions())
    const decision = decisions.items.find(
      (item: { reviewId: string }) => (
        item.reviewId === '5:template:tmpl-estimate-B-06'
      )
    )
    decision.status = 'pass'
    decision.findings = [{
      category: 'wording',
      resolved: false,
      note: '검수 재현용 미해결 문장 결함',
    }]

    expect(() => createReceipt(decisions)).toThrow(/open finding.*blocked/)

    decision.status = 'blocked'
    const receipt = createReceipt(decisions)
    expect(receipt.items.find(
      (item: { reviewId: string }) => item.reviewId === decision.reviewId
    )).toMatchObject({
      status: 'blocked',
      findingCategories: ['wording'],
    })
  })

  it('covers every Grade 5 source and audited variant with honest visual blockers', () => {
    expect(existsSync(receiptPath)).toBe(true)
    const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'))
    const decisions = loadDecisions()
    const decisionById = new Map(
      decisions.items.map((item: { reviewId: string }) => [item.reviewId, item])
    )
    const catalog = reviewCore.buildCatalog(
      reviewCore.loadActualSources().filter(
        (source: { grade: number }) => source.grade === 5
      ),
      reviewCore.RENDERER_REVIEW_VERSION_REGISTRY
    )
    const ids = receipt.items.map((item: { reviewId: string }) => item.reviewId)
    const visualItems = new Set(
      catalog.items
        .filter((item: { content: { visual: unknown } }) => (
          item.content.visual !== null
        ))
        .map((item: { reviewId: string }) => item.reviewId)
    )

    expect(receipt.items).toHaveLength(780)
    expect(decisions.items).toHaveLength(780)
    expect(new Set(ids)).toHaveLength(780)
    expect(ids).toEqual(
      catalog.items.map((item: { reviewId: string }) => item.reviewId)
    )
    expect(decisions.items.reduce(
      (total: number, item: { variantCount: number }) => (
        total + item.variantCount
      ),
      0
    )).toBe(196_167)
    expect(receipt.items.filter(
      (item: { status: string }) => item.status === 'blocked'
    )).toHaveLength(330)

    for (const item of receipt.items) {
      const decision = decisionById.get(item.reviewId) as {
        status: string
        findings: { category: string }[]
        evidence: Record<string, unknown>
      }
      expect(item.status).toBe(decision.status)
      expect(item.findingCategories).toEqual([
        ...new Set(decision.findings.map((finding) => finding.category)),
      ])
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
        expect(visualEvidence).toEqual([false, false, false, false, false])
      } else {
        expect(visualEvidence).toEqual([null, null, null, null, null])
      }
    }

    const validationErrors = reviewCore
      .loadContractModule()
      .validateEditorialLedger(catalog, receipt)
    expect(validationErrors).toEqual(
      [...visualItems].map(
        (reviewId) => `blocked editorial status: ${reviewId}`
      )
    )
  })

  it('is byte-deterministic from the reviewed Grade 5 sources', () => {
    expect(serializeReceipt()).toBe(readFileSync(receiptPath, 'utf8'))
  })
})
