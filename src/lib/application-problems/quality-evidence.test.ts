import { describe, expect, it } from 'vitest'

import {
  answerIsPublicBeforeSubmission,
  buildApplicationFamilyEvidence,
  getProductionApplicationFamilyEvidence,
} from './quality-evidence'

const family = {
  familyId: 'fixture-family',
  version: 1,
  proofMode: 'exhaustive' as const,
}

describe('application family quality evidence', () => {
  it('marks a failed proof as failed evidence with its issue instead of registered success', () => {
    const evidence = buildApplicationFamilyEvidence({
      families: [family],
      generatedSnapshots: [{ family, seed: 1, first: { prompt: 'same' }, second: { prompt: 'same' } }],
      proofReports: [{ family, mode: 'exhaustive', proven: false, checkedCount: 0, issues: ['oracle disagreed'] }],
      oracleResults: [{ family, valid: true }],
      visualResults: [{ family, valid: true }],
      answerExposureResults: [{ family, exposed: false }],
    })

    expect(evidence.rows).toEqual([expect.objectContaining({
      key: 'fixture-family@1',
      status: 'failed',
      proof: expect.objectContaining({ proven: false, checkedCount: 0, issues: ['oracle disagreed'] }),
    })])
  })

  it('returns actual proof and audit-ready outcomes for every production family', () => {
    const evidence = getProductionApplicationFamilyEvidence()

    expect(evidence.rows).toHaveLength(59)
    evidence.rows.forEach((row) => {
      expect(row.proof.proven).toBe(true)
      expect(row.proof.checkedCount).toBeGreaterThan(0)
      expect(row.proof.issues).toEqual([])
      expect(row.status).toBe('passed')
    })
    expect(evidence.rows.find((row) => row.familyId === 'g2-1-multiplication-model-check'))
      .toMatchObject({ status: 'passed' })
    expect(evidence.rows.find((row) => row.familyId === 'g2-2-length-method-compare'))
      .toMatchObject({ status: 'passed' })
  })

  it('distinguishes public givens from answer-only pre-submit disclosures', () => {
    const problem = (disclosure: 'given' | 'solution') => ({
      answer: { normalized: '5' },
      visual: {
        scene: {
          label: {
            before: { text: '5', disclosure },
            after: { text: '5', disclosure: 'solution' },
          },
        },
      },
    })

    expect(answerIsPublicBeforeSubmission(problem('given') as never)).toBe(false)
    expect(answerIsPublicBeforeSubmission(problem('solution') as never)).toBe(true)
  })
})
