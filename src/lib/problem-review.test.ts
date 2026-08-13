import { describe, expect, it } from 'vitest'

import {
  classifyProblemReviewStatus,
  getProblemReviewData,
} from './problem-review'

describe('getProblemReviewData', () => {
  it('builds one deterministic review row per Grade 1-6 catalog source', async () => {
    const data = await getProblemReviewData()

    expect(data.summary.totalProblems).toBe(1_622)
    expect(data.rows).toHaveLength(1_622)
    expect(new Set(data.rows.map(row => row.reviewId)).size).toBe(1_622)
    expect(data.summary.byGrade).toEqual({
      1: 98,
      2: 144,
      3: 120,
      4: 150,
      5: 780,
      6: 330,
    })
    expect(data.summary).toMatchObject({
      passProblems: 1_622,
      blockedProblems: 0,
      staleProblems: 0,
      missingProblems: 0,
    })
    expect(data.rows.every(row => row.contentHash === row.reviewedContentHash)).toBe(true)
  })

  it('includes one actual renderer payload and canonical filter metadata per row', async () => {
    const data = await getProblemReviewData()
    const rendererCounts = data.rows.reduce<Record<string, number>>(
      (counts, row) => {
        counts[row.renderer] = (counts[row.renderer] ?? 0) + 1
        return counts
      },
      {}
    )

    expect(rendererCounts).toEqual({
      grade1: 98,
      grade2: 144,
      grade3: 120,
      grade4: 150,
      practice: 1_110,
    })
    expect(data.rows.every(row => row.prompt.trim().length > 0)).toBe(true)
    expect(data.rows.every(row => row.correctAnswer.trim().length > 0)).toBe(true)
    expect(data.rows.every(row => row.hintSteps.length > 0)).toBe(true)
    expect(data.rows.every(row => row.solutionSteps.length > 0)).toBe(true)
    expect(data.rows.filter(row => row.hasVisual)).toHaveLength(1_013)
    expect(data.rows.every(row => row.curriculumCodes.length > 0)).toBe(true)
    expect(data.rows.every(row => row.taskActions.length > 0)).toBe(true)
    expect(data.rows.every(row => row.family.trim().length > 0)).toBe(true)
    expect(data.rows.every(row => row.rendererReviewVersion.length > 0)).toBe(true)
    expect(data.rows.every(row => row.variants.length > 0)).toBe(true)
    expect(
      data.rows
        .filter(row => row.renderer === 'grade4')
        .every(row => row.variants.length === 9)
    ).toBe(true)
    expect(
      data.rows
        .filter(row => row.renderer === 'grade2')
        .every(row => row.rendererReviewVersion === 'grade2-mission-visual-review-v3')
    ).toBe(true)
    expect(
      data.rows
        .filter(row => row.renderer === 'practice')
        .every(row => row.variants.length >= 1 && row.variants.length <= 3)
    ).toBe(true)
  })

  it('marks missing and stale receipts without treating them as pass', () => {
    const currentItem = { contentHash: 'current' }

    expect(classifyProblemReviewStatus(currentItem, undefined)).toBe('missing')
    expect(classifyProblemReviewStatus(currentItem, {
      contentHash: 'old',
      status: 'pass',
    })).toBe('stale')
    expect(classifyProblemReviewStatus(currentItem, {
      contentHash: 'current',
      status: 'blocked',
    })).toBe('blocked')
    expect(classifyProblemReviewStatus(currentItem, {
      contentHash: 'current',
      status: 'pass',
    })).toBe('pass')
  })
})
