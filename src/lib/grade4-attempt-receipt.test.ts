import { describe, expect, it } from 'vitest'

import { ATTEMPT_RECEIPT_STORAGE_KEY, LocalAttemptReceiptStore, type ReceiptStorage } from './attempt-receipt'
import { appendGrade4AttemptReceipt, createGrade4AttemptReceipt } from './grade4-attempt-receipt'
import { GRADE4_CONTENT_RELEASE_ID, getGrade4Activity, SAFE_GRADE4_UNIT_ID } from './grade4-problems'

class MemoryStorage implements ReceiptStorage {
  readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const mission = getGrade4Activity(SAFE_GRADE4_UNIT_ID, 20260721, 0)[0]

describe('Grade 4 attempt receipt', () => {
  it('uses the versioned bank identity and stores neither raw answers nor strokes', () => {
    const receipt = createGrade4AttemptReceipt({ mission, activityRun: 0, attemptOrdinal: 0, correct: false, usedHint: false, checkedAt: 1_721_520_000_000 })
    expect(receipt).toMatchObject({
      grade: 4,
      activityId: SAFE_GRADE4_UNIT_ID,
      itemId: mission.id,
      attemptOrdinal: 0,
      variantKey: mission.variantKey,
      contentReleaseId: GRADE4_CONTENT_RELEASE_ID,
      correct: false,
      usedHint: false,
      dedupeKey: expect.stringMatching(/^content:/),
    })
    expect(JSON.stringify(receipt)).not.toContain('learnerAnswer')
    expect(JSON.stringify(receipt)).not.toContain('strokes')
  })

  it('appends wrong and corrected checks with separate ordinals', async () => {
    const storage = new MemoryStorage()
    const store = new LocalAttemptReceiptStore(storage)
    await appendGrade4AttemptReceipt({ mission, activityRun: 0, attemptOrdinal: 0, correct: false, usedHint: false }, store)
    await appendGrade4AttemptReceipt({ mission, activityRun: 0, attemptOrdinal: 1, correct: true, usedHint: true }, store)
    const ledger = JSON.parse(storage.getItem(ATTEMPT_RECEIPT_STORAGE_KEY) ?? 'null')
    expect(ledger.receipts.map((receipt: { attemptOrdinal: number; correct: boolean; usedHint: boolean }) => ({ ordinal: receipt.attemptOrdinal, correct: receipt.correct, usedHint: receipt.usedHint })))
      .toEqual([{ ordinal: 0, correct: false, usedHint: false }, { ordinal: 1, correct: true, usedHint: true }])
  })
})
