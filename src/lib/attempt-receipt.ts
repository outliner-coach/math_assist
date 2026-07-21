export const ATTEMPT_RECEIPT_STORAGE_KEY = 'mathAssist_attemptReceipts_v1'

export type ReceiptGrade = 1 | 2 | 3 | 4 | 5 | 6
export type ActivityResponseStatus = 'unanswered' | 'draft' | 'format-error' | 'checked'

export interface CanonicalActivityResponse {
  itemId: string
  status: ActivityResponseStatus
  answer: string | null
  correct: boolean | null
  usedHint: boolean
  checkedAt: number | null
}

export interface AttemptReceipt {
  schemaVersion: 1
  attemptId: string
  learnerId: string | null
  sessionId: string
  activityId: string
  grade: ReceiptGrade
  itemId: string
  attemptOrdinal: number
  variantKey: string
  contentReleaseId: string
  correct: boolean
  usedHint: boolean
  checkedAt: number
  dedupeKey: string
}

export interface AttemptReceiptInput {
  learnerId: string | null
  sessionId: string
  activityId: string
  grade: ReceiptGrade
  itemId: string
  attemptOrdinal: number
  variantKey: string
  contentReleaseId: string
  responseStatus: ActivityResponseStatus
  correct: boolean | null
  usedHint: boolean
  checkedAt: number | null
  dedupeKey: string
}

export interface ReceiptStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type AppendReceiptResult = 'inserted' | 'duplicate' | 'corrupt'

interface StoredReceiptLedger {
  schemaVersion: 1
  receipts: AttemptReceipt[]
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(',')}}`
}

export function createContentDedupeKey(content: unknown): string {
  return `content:${stableHash(canonicalize(content))}`
}

function isReceipt(value: unknown): value is AttemptReceipt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<AttemptReceipt>
  return candidate.schemaVersion === 1
    && nonEmpty(candidate.attemptId)
    && (candidate.learnerId === null || nonEmpty(candidate.learnerId))
    && nonEmpty(candidate.sessionId)
    && nonEmpty(candidate.activityId)
    && [1, 2, 3, 4, 5, 6].includes(candidate.grade as number)
    && nonEmpty(candidate.itemId)
    && Number.isSafeInteger(candidate.attemptOrdinal)
    && (candidate.attemptOrdinal ?? -1) >= 0
    && nonEmpty(candidate.variantKey)
    && nonEmpty(candidate.contentReleaseId)
    && typeof candidate.correct === 'boolean'
    && typeof candidate.usedHint === 'boolean'
    && typeof candidate.checkedAt === 'number'
    && Number.isFinite(candidate.checkedAt)
    && nonEmpty(candidate.dedupeKey)
}

function parseLedger(raw: string | null): { ledger: StoredReceiptLedger; corrupted: boolean } {
  if (raw === null) return { ledger: { schemaVersion: 1, receipts: [] }, corrupted: false }
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ledger: { schemaVersion: 1, receipts: [] }, corrupted: true }
    }
    const candidate = value as Partial<StoredReceiptLedger>
    if (
      candidate.schemaVersion !== 1
      || !Array.isArray(candidate.receipts)
      || !candidate.receipts.every(isReceipt)
    ) {
      return { ledger: { schemaVersion: 1, receipts: [] }, corrupted: true }
    }
    const seen = new Set<string>()
    if (candidate.receipts.some((receipt) => seen.has(receipt.attemptId) || !seen.add(receipt.attemptId))) {
      return { ledger: { schemaVersion: 1, receipts: [] }, corrupted: true }
    }
    return { ledger: { schemaVersion: 1, receipts: candidate.receipts }, corrupted: false }
  } catch {
    return { ledger: { schemaVersion: 1, receipts: [] }, corrupted: true }
  }
}

export function createAttemptReceipt(input: AttemptReceiptInput): AttemptReceipt | null {
  if (input.responseStatus !== 'checked') return null
  if (typeof input.correct !== 'boolean' || input.checkedAt === null || !Number.isFinite(input.checkedAt)) {
    throw new Error('A checked response requires a deterministic result and checkedAt')
  }
  const identityFields = [
    input.sessionId,
    input.activityId,
    String(input.grade),
    input.itemId,
    String(input.attemptOrdinal),
    input.variantKey,
    input.contentReleaseId,
    input.dedupeKey,
  ]
  if (identityFields.some((value) => !nonEmpty(value))) {
    throw new Error('A checked response requires complete receipt identity fields')
  }
  if (!Number.isSafeInteger(input.attemptOrdinal) || input.attemptOrdinal < 0) {
    throw new Error('A checked response requires a non-negative attemptOrdinal')
  }
  return {
    schemaVersion: 1,
    attemptId: `attempt:${stableHash(identityFields.join('\u001f'))}`,
    learnerId: input.learnerId,
    sessionId: input.sessionId,
    activityId: input.activityId,
    grade: input.grade,
    itemId: input.itemId,
    attemptOrdinal: input.attemptOrdinal,
    variantKey: input.variantKey,
    contentReleaseId: input.contentReleaseId,
    correct: input.correct,
    usedHint: input.usedHint,
    checkedAt: input.checkedAt,
    dedupeKey: input.dedupeKey,
  }
}

export function applyResponseTransition(
  current: CanonicalActivityResponse | null,
  next: CanonicalActivityResponse,
): CanonicalActivityResponse {
  if (!nonEmpty(next.itemId)) throw new Error('Response itemId is required')
  if (current && current.itemId !== next.itemId) throw new Error('Response itemId cannot change')
  if (next.status === 'checked') {
    if (typeof next.correct !== 'boolean' || next.checkedAt === null || !Number.isFinite(next.checkedAt)) {
      throw new Error('Checked response requires correct and checkedAt')
    }
  } else if (next.correct !== null || next.checkedAt !== null) {
    throw new Error('Unchecked response cannot have a result or checkedAt')
  }
  if (current?.status === 'checked') {
    const unchanged = current.itemId === next.itemId
      && current.status === next.status
      && current.answer === next.answer
      && current.correct === next.correct
      && current.usedHint === next.usedHint
      && current.checkedAt === next.checkedAt
    if (!unchanged) throw new Error('Checked response is immutable')
    return current
  }
  return { ...next }
}

export class LocalAttemptReceiptStore {
  constructor(private readonly storage: ReceiptStorage | null = browserReceiptStorage()) {}

  async append(receipt: AttemptReceipt): Promise<AppendReceiptResult> {
    if (!isReceipt(receipt)) throw new Error('Invalid receipt')
    if (!this.storage) return 'corrupt'
    const parsed = parseLedger(this.storage.getItem(ATTEMPT_RECEIPT_STORAGE_KEY))
    if (parsed.corrupted) return 'corrupt'
    if (parsed.ledger.receipts.some((existing) => existing.attemptId === receipt.attemptId)) {
      return 'duplicate'
    }
    const next: StoredReceiptLedger = {
      schemaVersion: 1,
      receipts: [...parsed.ledger.receipts, receipt],
    }
    this.storage.setItem(ATTEMPT_RECEIPT_STORAGE_KEY, JSON.stringify(next))
    return 'inserted'
  }

  async list(): Promise<{ receipts: AttemptReceipt[]; corrupted: boolean }> {
    if (!this.storage) return { receipts: [], corrupted: false }
    const parsed = parseLedger(this.storage.getItem(ATTEMPT_RECEIPT_STORAGE_KEY))
    return { receipts: [...parsed.ledger.receipts], corrupted: parsed.corrupted }
  }
}

function browserReceiptStorage(): ReceiptStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}
