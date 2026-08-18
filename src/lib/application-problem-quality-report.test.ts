import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { renderMarkdown } = require('../../scripts/application-problem-quality-report.js')
const ProblemQualityProvider = require('../../scripts/promptfoo/problem-quality-provider.js')
const { summarizeApplicationReviewCoverage } = ProblemQualityProvider
const { generateTests } = require('../../scripts/promptfoo/problem-quality-tests.js')

function unitReports() {
  return Array.from({ length: 62 }, (_, index) => ({
    grade: index < 12 ? 2 : index < 24 ? 3 : index < 39 ? 4 : index < 51 ? 5 : 6,
    unitId: `unit-${String(index + 1).padStart(2, '0')}`,
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
      familyEvidence: [{
        key: 'family-a@1',
        status: 'passed',
        deterministicSample: true,
        proof: { mode: 'exhaustive', proven: true, checkedCount: 8, expectedCount: 8 },
      }],
      errors: [],
    })

    expect(markdown).toContain('## Unit rollout (62)')
    expect(markdown).toContain('| 2 | unit-01 | baseline-pilot |')
    expect(markdown).toContain('## Family verification evidence')
    expect(markdown).toContain('| family-a@1 | passed | yes | exhaustive | 8/8 |')
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
