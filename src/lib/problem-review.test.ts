import { describe, expect, it } from 'vitest'

import { getProblemReviewData } from './problem-review'

describe('getProblemReviewData', () => {
  it('builds one deterministic review row per template', async () => {
    const data = await getProblemReviewData()

    expect(data.summary.totalConcepts).toBeGreaterThan(0)
    expect(data.summary.totalProblems).toBe(data.rows.length)
    expect(new Set(data.rows.map(row => row.templateId)).size).toBe(data.rows.length)
  })

  it('includes rendered prompts and answers for both choice and number problems', async () => {
    const data = await getProblemReviewData()
    const choiceRow = data.rows.find(row => row.type === 'choice')
    const numberRow = data.rows.find(row => row.type === 'number')

    expect(choiceRow).toBeDefined()
    expect(choiceRow?.choices.length).toBeGreaterThan(0)
    expect(choiceRow?.correctChoiceLabel).toMatch(/①|②|③|④/)
    expect(choiceRow?.correctAnswer).not.toHaveLength(0)

    expect(numberRow).toBeDefined()
    expect(numberRow?.correctChoiceLabel).toBeNull()
    expect(numberRow?.correctAnswer).not.toHaveLength(0)
  })
})
