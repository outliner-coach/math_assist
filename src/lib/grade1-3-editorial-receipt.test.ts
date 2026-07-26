import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

interface ReceiptItem {
  reviewId: string
  status: string
  findingCategories: string[]
  note: string
  evidence: {
    preAnswer: boolean | null
    hint: boolean | null
    revealed: boolean | null
    mobile: boolean | null
    tablet: boolean | null
    artifacts: string[]
  }
}

function loadReceipt(): { items: ReceiptItem[] } {
  const receiptPath = path.join(
    process.cwd(),
    'docs/tracking/problem-editorial-review-work/grade1-3.json'
  )
  return JSON.parse(fs.readFileSync(receiptPath, 'utf8'))
}

function itemById(items: ReceiptItem[], reviewId: string) {
  const item = items.find((candidate) => candidate.reviewId === reviewId)
  if (!item) throw new Error(`Missing receipt item: ${reviewId}`)
  return item
}

describe('Grade 1-3 temporary editorial receipt', () => {
  it('preserves prior per-item findings instead of blanket-clearing the receipt', () => {
    const { items } = loadReceipt()
    const findingItems = items.filter((item) => item.findingCategories.length > 0)
    const findingCategoryEntries = findingItems.reduce(
      (total, item) => total + item.findingCategories.length,
      0
    )

    expect(items).toHaveLength(280)
    expect(findingItems.length).toBeGreaterThanOrEqual(86)
    expect(findingCategoryEntries).toBeGreaterThanOrEqual(109)
    expect(new Set(items.map((item) => item.note)).size).toBeGreaterThan(8)
    expect(findingItems.every((item) => (
      /교정|보강|제거|해결|제한|일치|바로잡|교체/.test(item.note)
    ))).toBe(true)
  })

  it('keeps content resolution evidence separate from the browser evidence blocker', () => {
    const { items } = loadReceipt()

    expect(items.every((item) => item.status === 'blocked')).toBe(true)
    expect(items.every((item) => item.note.includes('브라우저'))).toBe(true)
    expect(items.every((item) => (
      item.evidence.preAnswer === false
      && item.evidence.hint === false
      && item.evidence.revealed === false
      && item.evidence.mobile === false
      && item.evidence.tablet === false
      && item.evidence.artifacts.length === 0
    ))).toBe(true)
  })

  it('records concrete resolution evidence for the reworked Grade 3 activities', () => {
    const { items } = loadReceipt()
    const compass = itemById(items, '3:mission:g3-2-circle-03')
    const capacity = itemById(items, '3:mission:g3-2-capacity-weight-01')
    const weight = itemById(items, '3:mission:g3-2-capacity-weight-02')

    expect(compass.findingCategories).toEqual(
      expect.arrayContaining([
        'curriculum',
        'grade_appropriateness',
        'visual_semantics',
        'solvability',
        'answer_exposure',
      ])
    )
    expect(compass.note).toMatch(/컴퍼스.*원 구성.*construct/)
    expect(compass.note).toMatch(/지름 12cm.*6cm 선노출.*제거.*폭 조절.*원 그리기.*제출/)

    expect(capacity.findingCategories).toEqual(
      expect.arrayContaining(['curriculum', 'solvability', 'visual_semantics'])
    )
    expect(capacity.note).toMatch(/250mL 눈금.*물 높이.*measure/)

    expect(weight.findingCategories).toEqual(
      expect.arrayContaining(['curriculum', 'solvability', 'visual_semantics'])
    )
    expect(weight.note).toMatch(/100g 눈금.*저울 바늘.*measure/)
  })

  it('retains specific notes for the preceding renderer fixes', () => {
    const { items } = loadReceipt()

    expect(itemById(items, '2:mission:g2-2-time-01').note).toMatch(/접근성.*시각 노출.*제거/)
    expect(itemById(items, '3:mission:g3-1-multiply-01').note).toMatch(/10열.*전체 셀/)
    expect(itemById(items, '3:mission:g3-1-length-time-01').note).toMatch(/61개.*47mm/)
    expect(itemById(items, '3:mission:g3-2-graph-01').note).toMatch(/축.*격자.*단위/)
  })
})
