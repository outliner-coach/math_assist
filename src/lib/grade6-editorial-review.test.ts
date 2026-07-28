import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const reviewCore = require('../../scripts/problem-review-catalog-core.js')
const visualEvidenceCore = require('../../scripts/problem-visual-evidence-core.js')
const {
  createReceipt,
  loadDecisions,
  serializeReceipt,
} = require('../../scripts/generate-grade6-editorial-receipt.js')
const { explicitTaskActionsFor } = require('../../scripts/grade6-quality-metadata.js')

const receiptPath = join(
  process.cwd(),
  'docs/tracking/problem-editorial-review-work/grade6.json',
)
const visualEvidencePath = join(
  process.cwd(),
  'docs/tracking/problem-visual-browser-evidence-v1.json',
)
const visualEvidenceArtifact = 'docs/tracking/problem-visual-browser-evidence-v1.json'

function grade6VisualEvidenceReport() {
  const report = JSON.parse(readFileSync(visualEvidencePath, 'utf8'))
  const items = report.items.filter(
    (item: { reviewId: string }) => item.reviewId.startsWith('6:'),
  )
  return {
    ...report,
    catalogVisualItemCount: items.length,
    reviewedItemCount: items.length,
    items,
    summary: {
      ...report.summary,
      passed: items.length,
      failed: 0,
    },
  }
}

describe('Grade 6 editorial review receipt', () => {
  it('rejects a source definition that omits explicit taskActions', () => {
    expect(() => explicitTaskActionsFor({
      family: 'missing-actions',
      pattern: 'direct',
    })).toThrow(/taskActions/)
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
      (item: { reviewId: string }) => item.reviewId === '6:template:tmpl-g6decimaldiv-A-01',
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
      (item: { reviewId: string }) => item.reviewId === decision.reviewId,
    )).toMatchObject({
      status: 'blocked',
      findingCategories: ['wording'],
    })
  })

  it('covers every Grade 6 source exactly once with complete visual evidence', () => {
    expect(existsSync(receiptPath)).toBe(true)
    const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'))
    const decisions = loadDecisions()
    const decisionById = new Map(
      decisions.items.map((item: { reviewId: string }) => [item.reviewId, item]),
    )
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
    expect(decisions.items).toHaveLength(330)
    expect(new Set(ids)).toHaveLength(330)
    expect(ids).toEqual(catalog.items.map((item: { reviewId: string }) => item.reviewId))
    expect(receipt.items.filter((item: { status: string }) => item.status === 'blocked')).toHaveLength(0)

    for (const item of receipt.items) {
      const decision = decisionById.get(item.reviewId) as {
        status: string
        findings: { category: string }[]
        evidence: Record<string, unknown>
      }
      expect(item.status).toBe('pass')
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
        expect(visualEvidence).toEqual([true, true, true, true, true])
        expect(item.evidence.artifacts).toContain(visualEvidenceArtifact)
      } else {
        expect(visualEvidence).toEqual([null, null, null, null, null])
      }
    }

    const validationErrors = reviewCore
      .loadContractModule()
      .validateEditorialLedger(catalog, receipt)
    expect(validationErrors).toEqual([])
  })

  it('is byte-deterministic from the reviewed sources plus browser evidence', () => {
    const baseline = JSON.parse(serializeReceipt())
    const [expected] = visualEvidenceCore.applyVisualBrowserEvidence(
      grade6VisualEvidenceReport(),
      [baseline],
      visualEvidenceArtifact,
      171,
    )

    expect(visualEvidenceCore.stableJson(expected)).toBe(
      readFileSync(receiptPath, 'utf8'),
    )
  })
})
