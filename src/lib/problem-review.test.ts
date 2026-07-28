import { describe, expect, it } from 'vitest'

import { getApplicationProblemReviewData } from './problem-review'

describe('getApplicationProblemReviewData', () => {
  it('builds one representative row for every registered Grade 2, 5, and 6 application family', () => {
    const data = getApplicationProblemReviewData()

    expect(data.summary.totalRows).toBe(9)
    expect(new Set(data.rows.map((row) => row.familyId)).size).toBe(9)
    expect(Array.from(new Set(data.rows.map((row) => row.grade))).sort()).toEqual([2, 5, 6])
  })

  it('derives every filter option from the registered review rows', () => {
    const data = getApplicationProblemReviewData()

    expect(Object.keys(data.filters).sort()).toEqual([
      'cognitiveDomains',
      'families',
      'grades',
      'proofModes',
      'reasoningPatterns',
      'releaseStatuses',
      'standards',
      'units',
      'versions',
    ])
    expect(data.filters.grades).toEqual([2, 5, 6])
    expect(data.filters.families.every((option) => data.rows.some((row) => row.familyId === option.value))).toBe(true)
    expect(data.filters.units.every((option) => data.rows.some((row) => row.unitId === option.value))).toBe(true)
    expect(data.filters.standards.every((option) => data.rows.some((row) => row.standards.includes(option.value)))).toBe(true)
    expect(data.filters.versions.every((option) => data.rows.some((row) => String(row.version) === option.value))).toBe(true)
  })

  it('keeps the generated problem content and registered automated evidence together', () => {
    const data = getApplicationProblemReviewData()

    data.rows.forEach((row) => {
      expect(row.prompt).not.toHaveLength(0)
      expect(row.answer).not.toHaveLength(0)
      expect(row.solutionSteps.length).toBeGreaterThan(0)
      expect(row.hintSteps.length).toBeGreaterThan(0)
      expect(row.misconceptions.length).toBeGreaterThan(0)
      expect(row.automaticChecks.deterministicSample).toBe(true)
      expect(row.automaticChecks.proof.proven).toBe(true)
      expect(row.automaticChecks.proof.expectedCount).toBeGreaterThan(0)
      expect(row.automaticChecks.proof.issues).toEqual([])
      expect(row.automaticChecks.audit.status).toBe('passed')
      expect(row.automaticChecks.visual.status).toBe('ready')
    })
  })

  it('provides answer-hidden and answer-revealed visual review states for quantitative rows', () => {
    const data = getApplicationProblemReviewData()
    const quantitativeRows = data.rows.filter((row) => row.visual.semantics === 'quantitative')

    expect(quantitativeRows).not.toHaveLength(0)
    quantitativeRows.forEach((row) => {
      expect(row.visual.before).toBeDefined()
      expect(row.visual.after).toBeDefined()
      expect(row.visual.before).not.toEqual(row.visual.after)
    })
  })
})
