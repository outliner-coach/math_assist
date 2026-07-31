import { describe, expect, it } from 'vitest'

import {
  serializeDirectCoverageResult,
  validateDirectCurriculumCoverage,
} from '../../scripts/curriculum-direct-link-core.js'

const sources = [
  {
    reviewId: '3:mission:g3-knowing',
    grade: 3,
    sourceKind: 'mission',
    published: true,
    qualityMetadata: { standards: ['[4수01-01]'] },
  },
  {
    reviewId: '3:mission:g3-applying',
    grade: 3,
    sourceKind: 'mission',
    published: true,
    qualityMetadata: { standards: ['4수01-01'] },
  },
  {
    reviewId: '4:mission:g4-review',
    grade: 4,
    sourceKind: 'mission',
    published: true,
    qualityMetadata: { standards: ['[4수01-01]'] },
  },
  {
    reviewId: '5:template:g5-direct',
    grade: 5,
    sourceKind: 'template',
    published: true,
    qualityMetadata: { standards: ['[6수01-01]'] },
  },
]

const allocations = [
  {
    standardCode: '[4수01-01]',
    assignedGrade: 3,
    directContentRefs: ['3:mission:g3-knowing', '3:mission:g3-applying'],
    reviewContentRefs: ['4:mission:g4-review'],
    prerequisiteCodes: ['[4수01-02]'],
    existingContentRefs: ['grade3:unit-3-1-large-numbers'],
  },
  {
    standardCode: '[6수01-01]',
    assignedGrade: 5,
    directContentRefs: ['5:template:g5-direct'],
    reviewContentRefs: [],
    prerequisiteCodes: [],
    existingContentRefs: ['grade5:numberrange-001'],
  },
]

describe('published curriculum direct-link core', () => {
  it('counts assigned-grade problem links once while retaining optional other-grade review links', () => {
    const result = validateDirectCurriculumCoverage({
      allocations,
      publishedSources: sources,
    })

    expect(result.errors).toEqual([])
    expect(result.summary).toEqual({
      standardDenominator: 2,
      directlyCoveredStandardCount: 2,
      directContentLinkCount: 3,
      reviewContentLinkCount: 1,
    })
    expect(result.coverage.map((entry: { standardCode: string }) => entry.standardCode)).toEqual([
      '[4수01-01]',
      '[6수01-01]',
    ])
  })

  it('does not infer direct coverage from unit declarations, prerequisites, comments, or documentation text', () => {
    const result = validateDirectCurriculumCoverage({
      allocations: [{
        standardCode: '[4수01-01]',
        assignedGrade: 3,
        directContentRefs: [],
        reviewContentRefs: [],
        prerequisiteCodes: ['[4수01-01]'],
        existingContentRefs: ['grade3:unit-with-[4수01-01]'],
      }],
      publishedSources: [],
      unitDeclarations: [{ curriculumCodes: ['[4수01-01]'] }],
      comments: ['published source [4수01-01]'],
      documentation: 'The unit covers [4수01-01].',
    })

    expect(result.errors).toEqual([
      expect.objectContaining({
        code: 'missing_direct_content_ref',
        field: 'directContentRefs',
        standardCode: '[4수01-01]',
      }),
    ])
    expect(result.summary.directlyCoveredStandardCount).toBe(0)
  })

  it('rejects non-problem references, assigned-grade mismatches, metadata mismatches, and same-grade review links', () => {
    const result = validateDirectCurriculumCoverage({
      allocations: [{
        standardCode: '[4수01-01]',
        assignedGrade: 3,
        directContentRefs: [
          'grade3:unit-3-1-large-numbers',
          '4:mission:g4-review',
          '3:mission:g3-wrong-standard',
        ],
        reviewContentRefs: ['3:mission:g3-knowing'],
      }],
      publishedSources: [
        ...sources,
        {
          reviewId: '3:mission:g3-wrong-standard',
          grade: 3,
          sourceKind: 'mission',
          published: true,
          qualityMetadata: { standards: ['[4수01-02]'] },
        },
      ],
    })

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'direct_ref_not_published_source',
        field: 'directContentRefs',
        sourceRef: 'grade3:unit-3-1-large-numbers',
      }),
      expect.objectContaining({
        code: 'direct_ref_grade_mismatch',
        field: 'directContentRefs',
        sourceRef: '4:mission:g4-review',
      }),
      expect.objectContaining({
        code: 'direct_ref_standard_mismatch',
        field: 'directContentRefs',
        sourceRef: '3:mission:g3-wrong-standard',
      }),
      expect.objectContaining({
        code: 'review_ref_must_use_other_grade',
        field: 'reviewContentRefs',
        sourceRef: '3:mission:g3-knowing',
      }),
    ]))
    expect(result.summary.directlyCoveredStandardCount).toBe(0)
  })

  it('rejects duplicate assigned-grade allocations for the same standard', () => {
    const result = validateDirectCurriculumCoverage({
      allocations: [allocations[0], { ...allocations[0], assignedGrade: 4 }],
      publishedSources: sources,
    })

    expect(result.errors).toContainEqual(expect.objectContaining({
      code: 'duplicate_standard_allocation',
      field: 'standardCode',
      standardCode: '[4수01-01]',
    }))
  })

  it('serializes byte-identical output regardless of fixture order', () => {
    const forward = validateDirectCurriculumCoverage({
      allocations,
      publishedSources: sources,
    })
    const reversed = validateDirectCurriculumCoverage({
      allocations: [...allocations].reverse().map((allocation) => ({
        ...allocation,
        directContentRefs: [...allocation.directContentRefs].reverse(),
      })),
      publishedSources: [...sources].reverse(),
    })

    expect(serializeDirectCoverageResult(forward)).toBe(
      serializeDirectCoverageResult(reversed)
    )
  })

  it('serializes duplicate-allocation failures deterministically', () => {
    const duplicated = [allocations[0], { ...allocations[0], assignedGrade: 4 }]
    const forward = validateDirectCurriculumCoverage({
      allocations: duplicated,
      publishedSources: sources,
    })
    const reversed = validateDirectCurriculumCoverage({
      allocations: [...duplicated].reverse(),
      publishedSources: [...sources].reverse(),
    })

    expect(serializeDirectCoverageResult(forward)).toBe(
      serializeDirectCoverageResult(reversed)
    )
  })
})
