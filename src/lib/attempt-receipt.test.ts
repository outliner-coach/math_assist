import { describe, expect, it } from 'vitest'

import {
  LocalAttemptReceiptStore,
  applyResponseTransition,
  createAttemptReceipt,
  createContentDedupeKey,
  type ReceiptStorage,
} from './attempt-receipt'

class MemoryStorage implements ReceiptStorage {
  readonly values = new Map<string, string>()
  readonly writes: Array<{ key: string; value: string }> = []

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.writes.push({ key, value })
    this.values.set(key, value)
  }
}

const checkedInput = {
  learnerId: null,
  sessionId: 'session-1',
  activityId: 'mixedcalc-001',
  grade: 5 as const,
  itemId: 'mixedcalc-001-A-01',
  attemptOrdinal: 0,
  variantKey: 'mixedcalc-001-A-01:seed-7',
  contentReleaseId: 'grade5-2026-07-21',
  responseStatus: 'checked' as const,
  correct: true,
  usedHint: false,
  checkedAt: 1_721_520_000_000,
  dedupeKey: 'sha256:problem-content',
}

describe('attempt receipt', () => {
  it('derives dedupe from concrete content with stable object-key ordering', () => {
    const first = createContentDedupeKey({
      prompt: '3 + 4는?',
      correctAnswer: '7',
      choices: ['7', '6', '8'],
      visual: { width: 3, height: 4 },
    })
    const reordered = createContentDedupeKey({
      visual: { height: 4, width: 3 },
      choices: ['7', '6', '8'],
      correctAnswer: '7',
      prompt: '3 + 4는?',
    })

    expect(reordered).toBe(first)
    expect(createContentDedupeKey({ prompt: '3 + 5는?', correctAnswer: '8' })).not.toBe(first)
  })

  it('creates a stable receipt without storing the raw answer', () => {
    const first = createAttemptReceipt(checkedInput)
    const repeated = createAttemptReceipt({ ...checkedInput, checkedAt: checkedInput.checkedAt + 5_000 })

    expect(first).toEqual({
      schemaVersion: 1,
      attemptId: expect.stringMatching(/^attempt:/),
      learnerId: null,
      sessionId: 'session-1',
      activityId: 'mixedcalc-001',
      grade: 5,
      itemId: 'mixedcalc-001-A-01',
      attemptOrdinal: 0,
      variantKey: 'mixedcalc-001-A-01:seed-7',
      contentReleaseId: 'grade5-2026-07-21',
      correct: true,
      usedHint: false,
      checkedAt: checkedInput.checkedAt,
      dedupeKey: 'sha256:problem-content',
    })
    expect(repeated?.attemptId).toBe(first?.attemptId)
    expect(JSON.stringify(first)).not.toContain('answer')
  })

  it('does not create a receipt for draft or format-error responses', () => {
    expect(createAttemptReceipt({ ...checkedInput, responseStatus: 'draft', correct: null })).toBeNull()
    expect(createAttemptReceipt({ ...checkedInput, responseStatus: 'format-error', correct: null })).toBeNull()
  })

  it('allows draft and format-error recovery but freezes a checked response', () => {
    const draft = applyResponseTransition(null, {
      itemId: checkedInput.itemId,
      status: 'draft',
      answer: '1/',
      correct: null,
      usedHint: false,
      checkedAt: null,
    })
    const formatError = applyResponseTransition(draft, { ...draft, status: 'format-error' })
    const recovered = applyResponseTransition(formatError, { ...draft, answer: '1/2' })
    const checked = applyResponseTransition(recovered, {
      ...recovered,
      status: 'checked',
      correct: true,
      checkedAt: checkedInput.checkedAt,
    })

    expect(recovered.status).toBe('draft')
    expect(checked.status).toBe('checked')
    expect(() => applyResponseTransition(checked, { ...checked, answer: '3/4' })).toThrow(/checked response/i)
  })
})

describe('LocalAttemptReceiptStore', () => {
  it('appends once and treats a repeated check as a duplicate', async () => {
    const storage = new MemoryStorage()
    const store = new LocalAttemptReceiptStore(storage)
    const receipt = createAttemptReceipt(checkedInput)
    expect(receipt).not.toBeNull()

    await expect(store.append(receipt!)).resolves.toBe('inserted')
    await expect(store.append(receipt!)).resolves.toBe('duplicate')
    await expect(store.list()).resolves.toEqual({ receipts: [receipt], corrupted: false })
    expect(storage.writes).toHaveLength(1)
  })

  it('isolates a corrupt receipt ledger and never rewrites legacy progress keys', async () => {
    const storage = new MemoryStorage()
    storage.values.set('mathAssist_attemptReceipts_v1', '{bad json')
    storage.values.set('mathAssist_grade1Progress', '{"completedStageIds":["g1-stage-1"]}')
    const store = new LocalAttemptReceiptStore(storage)
    const receipt = createAttemptReceipt(checkedInput)!

    await expect(store.list()).resolves.toEqual({ receipts: [], corrupted: true })
    await expect(store.append(receipt)).resolves.toBe('corrupt')
    expect(storage.writes).toHaveLength(0)
    expect(storage.values.get('mathAssist_grade1Progress')).toBe('{"completedStageIds":["g1-stage-1"]}')
  })

  it('rejects malformed receipts without writing', async () => {
    const storage = new MemoryStorage()
    const store = new LocalAttemptReceiptStore(storage)
    const invalid = { ...createAttemptReceipt(checkedInput)!, checkedAt: Number.NaN }

    await expect(store.append(invalid)).rejects.toThrow(/invalid receipt/i)
    expect(storage.writes).toHaveLength(0)
  })
})
