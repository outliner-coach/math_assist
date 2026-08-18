import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

import { APPLICATION_UNIT_INVENTORY_V1 } from './application-problems/authoring-catalog'

const require = createRequire(import.meta.url)
const { renderMarkdown } = require('../../scripts/application-problem-quality-report.js')
const ProblemQualityProvider = require('../../scripts/promptfoo/problem-quality-provider.js')
const { summarizeApplicationReviewCoverage } = ProblemQualityProvider
const { generateTests } = require('../../scripts/promptfoo/problem-quality-tests.js')

function unitReports({ canonical = true } = {}) {
  const units = canonical
    ? APPLICATION_UNIT_INVENTORY_V1
    : APPLICATION_UNIT_INVENTORY_V1.map((unit, index) => ({
      ...unit,
      unitId: `forged-unit-${String(index + 1).padStart(2, '0')}`,
    }))
  return units.map((unit, index) => ({
    grade: unit.grade,
    unitId: unit.unitId,
    rolloutStatus: index < 3 ? 'baseline-pilot' : 'pending',
    baselinePilot: index < 3,
    packRefs: index < 3 ? [`pack-${index + 1}@1`] : [],
    gradeComplete: false,
    productionComplete: false,
    candidateComplete: false,
  }))
}

describe('application problem quality reporting', () => {
  it('renders all-unit rollout and family verification evidence', () => {
    const firstUnit = APPLICATION_UNIT_INVENTORY_V1[0]
    const markdown = renderMarkdown({
      summary: {
        packCount: 3,
        unitCount: 62,
        familyCount: 9,
        draftFamilyCount: 0,
        approvedFamilyCount: 9,
        errorCount: 0,
      },
      packReports: [],
      unitReports: unitReports(),
      reviewedFamilies: [
        { key: 'family-a@1', source: 'production' },
        { key: 'family-draft@1', source: 'draft' },
      ],
      familyEvidence: [{
        key: 'family-a@1',
        status: 'passed',
        deterministicSample: true,
        proof: { mode: 'exhaustive', proven: true, checkedCount: 8, expectedCount: 8 },
        cases: [
          {
            kind: 'representative',
            status: 'passed',
            oracleStatus: 'passed',
            visualStatus: 'passed',
            disclosureStatus: 'passed',
            proofStatus: 'passed',
          },
          {
            kind: 'boundary',
            status: 'passed',
            oracleStatus: 'passed',
            visualStatus: 'passed',
            disclosureStatus: 'passed',
            proofStatus: 'passed',
          },
        ],
      }],
      errors: [],
    })

    expect(markdown).toContain('## Unit rollout (62)')
    expect(markdown).toContain(`| ${firstUnit.grade} | ${firstUnit.unitId} | baseline-pilot |`)
    expect(markdown).toContain('## Family verification evidence')
    expect(markdown).toContain('| family-a@1 | production | passed | representative: passed | boundary: passed |')
    expect(markdown).toContain('| family-draft@1 | draft | missing | representative: missing | boundary: missing |')
    expect(markdown).not.toMatch(/\| family-a@1 [^\n]*missing family evidence/)
  })

  it('adds a promptfoo gate that checks the canonical 62-unit review denominator', () => {
    const summary = summarizeApplicationReviewCoverage({
      summary: { errorCount: 0 },
      unitReports: unitReports(),
      errors: [],
    })
    const tests = generateTests()

    expect(summary).toMatchObject({
      auditType: 'application_review_coverage',
      issueCount: 0,
      unitCount: 62,
      byGrade: { 2: 12, 3: 12, 4: 15, 5: 12, 6: 11 },
    })
    expect(tests.some((test: { metadata?: { suite?: string } }) => (
      test.metadata?.suite === 'application_review_coverage'
    ))).toBe(true)
  })

  it('rejects 62 unique but non-canonical unit identities', () => {
    const summary = summarizeApplicationReviewCoverage({
      summary: { errorCount: 0 },
      unitReports: unitReports({ canonical: false }),
      reviewedFamilies: [],
      familyEvidence: [],
      errors: [],
    })

    expect(summary.issues).toContainEqual(expect.objectContaining({
      code: 'application_review_unit_identity',
    }))
  })

  it('fails reviewed production and draft families without complete case evidence', () => {
    const summary = summarizeApplicationReviewCoverage({
      summary: { errorCount: 0 },
      unitReports: unitReports(),
      reviewedFamilies: [
        { key: 'production-family@1', source: 'production' },
        { key: 'draft-family@1', source: 'draft' },
      ],
      familyEvidence: [{
        key: 'production-family@1',
        source: 'production',
        status: 'passed',
        cases: [{
          kind: 'representative',
          status: 'passed',
          oracleStatus: 'passed',
          visualStatus: 'passed',
          disclosureStatus: 'passed',
          proofStatus: 'passed',
        }],
      }],
      errors: [],
    })

    expect(summary.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'application_review_family_boundary_evidence' }),
      expect.objectContaining({ code: 'application_review_family_evidence' }),
    ]))
  })

  it('runs application promptfoo audits without reading promptfoo CLI arguments', async () => {
    const provider = new ProblemQualityProvider()
    const previousArgv = process.argv
    process.argv = ['node', 'promptfoo', 'eval']
    try {
      const coverage = await provider.callApi('', {
        vars: { auditType: 'application_review_coverage' },
      })
      const metadata = await provider.callApi('', {
        vars: { auditType: 'application_metadata' },
      })

      expect(coverage.output).toMatchObject({ issueCount: 0, unitCount: 62 })
      expect(metadata.output).toMatchObject({ issueCount: 0 })
    } finally {
      process.argv = previousArgv
    }
  })
})
