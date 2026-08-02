import { describe, expect, it } from 'vitest'

import {
  createProblemReviewQuery,
  resolveProblemReviewQuery,
  transitionProblemReviewSelection,
} from './problem-review-query'

const rows = [
  {
    reviewId: '1:mission:count-cove-03',
    grade: 1,
    hasVisual: true,
    variants: [{ key: 'minimum' }, { key: 'maximum' }],
  },
  {
    reviewId: '5:template:text-only',
    grade: 5,
    hasVisual: false,
    variants: [{ key: 'default' }],
  },
]

describe('problem review query selection', () => {
  it('keeps a valid deep-linked review row, state, and variant together', () => {
    expect(resolveProblemReviewQuery(
      rows,
      '?id=1%3Amission%3Acount-cove-03&state=pre&variant=minimum',
    )).toEqual({
      reviewId: '1:mission:count-cove-03',
      gradeFilter: '1',
      visualOnly: true,
      state: 'pre',
      variantKey: 'minimum',
    })
  })

  it('opens a valid text-only row and falls back from invalid state and variant', () => {
    expect(resolveProblemReviewQuery(
      rows,
      '?id=5%3Atemplate%3Atext-only&state=unknown&variant=missing',
    )).toEqual({
      reviewId: '5:template:text-only',
      gradeFilter: '5',
      visualOnly: false,
      state: 'pre',
      variantKey: 'default',
    })
  })

  it('returns no row selection for an unknown review id', () => {
    expect(resolveProblemReviewQuery(rows, '?id=unknown')).toBeNull()
  })

  it('commits fallback selection across a narrow then manually broadened filter transition', () => {
    let selection = {
      reviewId: '5:template:text-only',
      state: 'hint' as const,
      variantKey: 'default',
    }
    selection = transitionProblemReviewSelection(selection, [rows[0]], rows[0])

    expect(selection).toEqual({
      reviewId: '1:mission:count-cove-03',
      state: 'hint',
      variantKey: 'minimum',
    })
    expect(createProblemReviewQuery(selection)).toBe(
      'id=1%3Amission%3Acount-cove-03&state=hint&variant=minimum',
    )

    selection = transitionProblemReviewSelection(selection, rows, rows[0])
    expect(selection.reviewId).toBe('1:mission:count-cove-03')
    expect(createProblemReviewQuery(selection)).toBe(
      'id=1%3Amission%3Acount-cove-03&state=hint&variant=minimum',
    )
  })
})
