import { describe, expect, it } from 'vitest'

import curriculumLedger from '../../public/data/curriculum-allocations-v1.json'
import {
  buildContentReleaseReport,
  loadReleaseSourceRecords,
  stableJson,
  validateReleaseCurriculum,
} from '../../scripts/content-release-adapter.js'

const records = loadReleaseSourceRecords(process.cwd())

describe('Grade 1-6 content release integration', () => {
  it('reports the 1,622 authored sources without blending source, signature, variant, or session counts', () => {
    const report = buildContentReleaseReport(records)

    expect(report.errors).toEqual([])
    expect(report.summary).toEqual({
      publishedSourceCount: 1622,
      authoredSourceCount: 1622,
      canonicalMathSignatureCount: 1116,
      generatedVariantCount: 200460,
      errorCount: 0,
    })
    expect(report.grades).toEqual([
      { grade: 1, publishedSourceCount: 98, authoredSourceCount: 98, canonicalMathSignatureCount: 98, generatedVariantCount: 1046, sessionItemCount: { basic: 7, practice: 7 } },
      { grade: 2, publishedSourceCount: 144, authoredSourceCount: 144, canonicalMathSignatureCount: 144, generatedVariantCount: 144, sessionItemCount: { basic: 6, practice: 6 } },
      { grade: 3, publishedSourceCount: 120, authoredSourceCount: 120, canonicalMathSignatureCount: 120, generatedVariantCount: 120, sessionItemCount: { basic: 3, practice: 3 } },
      { grade: 4, publishedSourceCount: 150, authoredSourceCount: 150, canonicalMathSignatureCount: 150, generatedVariantCount: 1350, sessionItemCount: { basic: 3, practice: 3 } },
      { grade: 5, publishedSourceCount: 780, authoredSourceCount: 780, canonicalMathSignatureCount: 274, generatedVariantCount: 196167, sessionItemCount: { basic: 5, practice: 10 } },
      { grade: 6, publishedSourceCount: 330, authoredSourceCount: 330, canonicalMathSignatureCount: 330, generatedVariantCount: 1633, sessionItemCount: { basic: 5, practice: 10 } },
    ])
  })

  it('is deterministic for the same authored release sources', () => {
    expect(stableJson(buildContentReleaseReport(records)))
      .toBe(stableJson(buildContentReleaseReport(records)))
  })

  it('directly covers all 121 standards with foundation and applying work', () => {
    const validation = validateReleaseCurriculum(curriculumLedger, records)

    expect(validation.directCoverage.errors).toEqual([])
    expect(validation.roleErrors).toEqual([])
    expect(validation.summary).toEqual({
      standardDenominator: 121,
      directlyCoveredStandardCount: 121,
      directContentLinkCount: 1803,
      reviewContentLinkCount: 81,
      roleErrorCount: 0,
    })
  })

  it('fails closed when a standard loses its direct problem references', () => {
    const brokenLedger = {
      ...curriculumLedger,
      allocations: curriculumLedger.allocations.map((allocation, index) => (
        index === 0 ? { ...allocation, directContentRefs: [] } : allocation
      )),
    }
    const validation = validateReleaseCurriculum(brokenLedger, records)

    expect(validation.directCoverage.errors.map((error: { code: string }) => error.code))
      .toContain('missing_direct_content_ref')
    expect(validation.roleErrors.map((error: { code: string }) => error.code))
      .toEqual(expect.arrayContaining([
        'missing_foundation_direct_ref',
        'missing_applying_direct_ref',
      ]))
  })
})
