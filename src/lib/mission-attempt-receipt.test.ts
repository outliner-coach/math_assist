import { describe, expect, it } from 'vitest'

import {
  ATTEMPT_RECEIPT_STORAGE_KEY,
  LocalAttemptReceiptStore,
  type ReceiptStorage,
} from './attempt-receipt'
import {
  appendMissionAttemptReceipt,
  createMissionAttemptReceipt,
  type MissionReceiptGrade,
} from './mission-attempt-receipt'

class MemoryStorage implements ReceiptStorage {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

const mission = {
  id: 'mission-01',
  prompt: '그림의 사과는 몇 개인가요?',
  correctAnswer: '7',
  choices: ['6', '7', '8'],
  visualModel: 'counting-grid',
  visualConfig: { object: 'apple', count: 7 },
}

function input(grade: MissionReceiptGrade, attemptIndex = 0) {
  return {
    grade,
    mission,
    sessionRunKey: 'seed-20260721',
    attemptIndex,
    variantKey: 'mission-01:content-fingerprint',
    correct: attemptIndex > 0,
    usedHint: attemptIndex > 0,
    checkedAt: 1_721_520_000_000 + attemptIndex,
  }
}

describe.each([1, 2, 3] as const)('grade %i mission receipt', (grade) => {
  it('uses stable complete identity and stores neither the learner answer nor drawing strokes', () => {
    const receipt = createMissionAttemptReceipt(input(grade))
    const repeated = createMissionAttemptReceipt({ ...input(grade), checkedAt: 1_800_000_000_000 })

    expect(receipt).toMatchObject({
      sessionId: `grade${grade}:mission:mission-01:seed-20260721`,
      activityId: 'mission-01',
      grade,
      itemId: 'mission-01',
      attemptOrdinal: 0,
      variantKey: 'mission-01:content-fingerprint',
      contentReleaseId: `grade${grade}-missions-static-v1`,
      correct: false,
      usedHint: false,
      dedupeKey: expect.stringMatching(/^content:/),
    })
    expect(repeated.attemptId).toBe(receipt.attemptId)
    expect(JSON.stringify(receipt)).not.toContain('learnerAnswer')
    expect(JSON.stringify(receipt)).not.toContain('strokes')
  })
})

it('appends each valid retry once and treats repeated delivery as duplicate', async () => {
  const storage = new MemoryStorage()
  const store = new LocalAttemptReceiptStore(storage)

  await expect(appendMissionAttemptReceipt(input(1), store)).resolves.toBe('inserted')
  await expect(appendMissionAttemptReceipt(input(1), store)).resolves.toBe('duplicate')
  await expect(appendMissionAttemptReceipt(input(1, 1), store)).resolves.toBe('inserted')

  const ledger = JSON.parse(storage.getItem(ATTEMPT_RECEIPT_STORAGE_KEY) ?? 'null')
  expect(ledger.receipts).toHaveLength(2)
  expect(ledger.receipts.map((receipt: { correct: boolean }) => receipt.correct)).toEqual([false, true])
})

it('rejects unstable attempt identity before writing', async () => {
  const storage = new MemoryStorage()
  const store = new LocalAttemptReceiptStore(storage)

  await expect(appendMissionAttemptReceipt({ ...input(3), attemptIndex: -1 }, store)).rejects.toThrow(
    /attemptIndex/,
  )
  expect(storage.getItem(ATTEMPT_RECEIPT_STORAGE_KEY)).toBeNull()
})
