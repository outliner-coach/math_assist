import type { AttemptReceipt, ReceiptGrade } from './attempt-receipt'

export const REMOTE_PROGRESS_ENABLED = false as const
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1_000
const MAX_IDENTIFIER_LENGTH = 256
const MAX_HASH_LENGTH = 512
const MAX_BASELINES = 64
const MAX_RECEIPTS = 10_000
const MAX_IDS_PER_BASELINE = 10_000

export interface LegacyProgressBaseline {
  sourceKey: string
  sourceSchemaVersion: number | null
  sourceHash: string
  grade: ReceiptGrade
  completedIds: string[]
  reviewIds: string[]
  recentActivityId: string | null
  recentActivityAt: number | null
  selectedUnitId: string | null
}

export interface RemoteProgressEnvelope {
  schemaVersion: 1
  learnerId: string
  revision: string
  legacyBaselines: LegacyProgressBaseline[]
  receipts: AttemptReceipt[]
  recentActivity: { grade: ReceiptGrade; activityId: string; at: number } | null
  avatarId: string | null
  updatedAt: number
}

export type RemoteProgressConflict = 'avatar'

export interface RemoteProgressMergePreview {
  local: RemoteProgressEnvelope
  remote: RemoteProgressEnvelope
  legacyBaselines: LegacyProgressBaseline[]
  receipts: AttemptReceipt[]
  recentActivity: RemoteProgressEnvelope['recentActivity']
  conflicts: RemoteProgressConflict[]
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function assertExactKeys(record: JsonRecord, allowed: readonly string[], field: string): void {
  const allowedKeys = new Set(allowed)
  if (Object.keys(record).some((key) => !allowedKeys.has(key))) {
    throw new Error(`${field} contains an unsupported field`)
  }
}

function assertBoundedString(value: unknown, field: string, max = MAX_IDENTIFIER_LENGTH): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    throw new Error(`${field} is invalid`)
  }
}

function assertTimestamp(value: unknown, now: number, field: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} is invalid`)
  }
  if (value > now + MAX_CLOCK_SKEW_MS) throw new Error(`${field} is in the future`)
}

function validateStringList(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length > MAX_IDS_PER_BASELINE) {
    throw new Error(`${field} is invalid`)
  }
  const result = value.map((item, index) => {
    assertBoundedString(item, `${field}[${index}]`)
    return item
  })
  if (new Set(result).size !== result.length) throw new Error(`${field} contains duplicates`)
  return result
}

function validateBaseline(value: unknown, now: number): LegacyProgressBaseline {
  if (!isRecord(value)) throw new Error('legacyBaseline is invalid')
  assertExactKeys(value, [
    'sourceKey',
    'sourceSchemaVersion',
    'sourceHash',
    'grade',
    'completedIds',
    'reviewIds',
    'recentActivityId',
    'recentActivityAt',
    'selectedUnitId',
  ], 'legacyBaseline')
  assertBoundedString(value.sourceKey, 'legacyBaseline.sourceKey')
  assertBoundedString(value.sourceHash, 'legacyBaseline.sourceHash', MAX_HASH_LENGTH)
  if (
    value.sourceSchemaVersion !== null &&
    (!Number.isSafeInteger(value.sourceSchemaVersion) || (value.sourceSchemaVersion as number) < 0)
  ) throw new Error('legacyBaseline.sourceSchemaVersion is invalid')
  if (![1, 2, 3, 4, 5, 6].includes(value.grade as number)) {
    throw new Error('legacyBaseline.grade is invalid')
  }
  const completedIds = validateStringList(value.completedIds, 'legacyBaseline.completedIds')
  const reviewIds = validateStringList(value.reviewIds, 'legacyBaseline.reviewIds')
  if (value.recentActivityId !== null) {
    assertBoundedString(value.recentActivityId, 'legacyBaseline.recentActivityId')
  }
  if (value.recentActivityAt !== null) {
    assertTimestamp(value.recentActivityAt, now, 'legacyBaseline.recentActivityAt')
  }
  if (value.selectedUnitId !== null) {
    assertBoundedString(value.selectedUnitId, 'legacyBaseline.selectedUnitId')
  }
  return {
    sourceKey: value.sourceKey,
    sourceSchemaVersion: value.sourceSchemaVersion as number | null,
    sourceHash: value.sourceHash,
    grade: value.grade as ReceiptGrade,
    completedIds,
    reviewIds,
    recentActivityId: value.recentActivityId as string | null,
    recentActivityAt: value.recentActivityAt as number | null,
    selectedUnitId: value.selectedUnitId as string | null,
  }
}

function validateReceipt(value: unknown, learnerId: string, now: number): AttemptReceipt {
  if (!isRecord(value)) throw new Error('receipt is invalid')
  assertExactKeys(value, [
    'schemaVersion',
    'attemptId',
    'learnerId',
    'sessionId',
    'activityId',
    'grade',
    'itemId',
    'attemptOrdinal',
    'variantKey',
    'contentReleaseId',
    'correct',
    'usedHint',
    'checkedAt',
    'dedupeKey',
  ], 'receipt')
  if (value.schemaVersion !== 1) throw new Error('receipt.schemaVersion is invalid')
  assertBoundedString(value.attemptId, 'receipt.attemptId')
  if (value.learnerId !== null) {
    assertBoundedString(value.learnerId, 'receipt.learnerId')
    if (value.learnerId !== learnerId) throw new Error('receipt learner mismatch')
  }
  assertBoundedString(value.sessionId, 'receipt.sessionId')
  assertBoundedString(value.activityId, 'receipt.activityId')
  if (![1, 2, 3, 4, 5, 6].includes(value.grade as number)) throw new Error('receipt.grade is invalid')
  assertBoundedString(value.itemId, 'receipt.itemId')
  if (!Number.isSafeInteger(value.attemptOrdinal) || (value.attemptOrdinal as number) < 0) {
    throw new Error('receipt.attemptOrdinal is invalid')
  }
  assertBoundedString(value.variantKey, 'receipt.variantKey')
  assertBoundedString(value.contentReleaseId, 'receipt.contentReleaseId')
  if (typeof value.correct !== 'boolean' || typeof value.usedHint !== 'boolean') {
    throw new Error('receipt result is invalid')
  }
  assertTimestamp(value.checkedAt, now, 'receipt.checkedAt')
  assertBoundedString(value.dedupeKey, 'receipt.dedupeKey', MAX_HASH_LENGTH)
  return {
    schemaVersion: 1,
    attemptId: value.attemptId,
    learnerId: value.learnerId as string | null,
    sessionId: value.sessionId,
    activityId: value.activityId,
    grade: value.grade as ReceiptGrade,
    itemId: value.itemId,
    attemptOrdinal: value.attemptOrdinal as number,
    variantKey: value.variantKey,
    contentReleaseId: value.contentReleaseId,
    correct: value.correct,
    usedHint: value.usedHint,
    checkedAt: value.checkedAt,
    dedupeKey: value.dedupeKey,
  }
}

export function validateRemoteProgressEnvelope(value: unknown, now = Date.now()): RemoteProgressEnvelope {
  assertTimestamp(now, now, 'now')
  if (!isRecord(value)) throw new Error('Remote progress envelope is invalid')
  assertExactKeys(value, [
    'schemaVersion',
    'learnerId',
    'revision',
    'legacyBaselines',
    'receipts',
    'recentActivity',
    'avatarId',
    'updatedAt',
  ], 'remote progress envelope')
  if (value.schemaVersion !== 1) throw new Error('Unsupported remote progress schema')
  assertBoundedString(value.learnerId, 'learnerId')
  const learnerId = value.learnerId
  assertBoundedString(value.revision, 'revision')
  assertTimestamp(value.updatedAt, now, 'updatedAt')
  if (!Array.isArray(value.legacyBaselines) || value.legacyBaselines.length > MAX_BASELINES) {
    throw new Error('legacyBaselines is invalid')
  }
  if (!Array.isArray(value.receipts) || value.receipts.length > MAX_RECEIPTS) {
    throw new Error('receipts is invalid')
  }
  const legacyBaselines = value.legacyBaselines.map((baseline) => validateBaseline(baseline, now))
  const receipts = value.receipts.map((receipt) => validateReceipt(receipt, learnerId, now))
  let recentActivity: RemoteProgressEnvelope['recentActivity'] = null
  if (value.recentActivity !== null) {
    if (!isRecord(value.recentActivity)) throw new Error('recentActivity is invalid')
    assertExactKeys(value.recentActivity, ['grade', 'activityId', 'at'], 'recentActivity')
    if (![1, 2, 3, 4, 5, 6].includes(value.recentActivity.grade as number)) {
      throw new Error('recentActivity.grade is invalid')
    }
    assertBoundedString(value.recentActivity.activityId, 'recentActivity.activityId')
    assertTimestamp(value.recentActivity.at, now, 'recentActivity.at')
    recentActivity = {
      grade: value.recentActivity.grade as ReceiptGrade,
      activityId: value.recentActivity.activityId,
      at: value.recentActivity.at,
    }
  }
  if (value.avatarId !== null) assertBoundedString(value.avatarId, 'avatarId')
  return {
    schemaVersion: 1,
    learnerId,
    revision: value.revision,
    legacyBaselines,
    receipts,
    recentActivity,
    avatarId: value.avatarId as string | null,
    updatedAt: value.updatedAt,
  }
}

function baselineIdentity(value: LegacyProgressBaseline): string {
  return [value.sourceKey, value.sourceSchemaVersion ?? 'null', value.sourceHash].join('\u001f')
}

function mergeUnique<T>(
  local: readonly T[],
  remote: readonly T[],
  identity: (value: T) => string,
  conflictLabel: string,
): T[] {
  const merged: T[] = []
  const byIdentity = new Map<string, T>()
  for (const value of [...local, ...remote]) {
    const key = identity(value)
    const existing = byIdentity.get(key)
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(value)) {
        throw new Error(`${conflictLabel} conflict for ${key}`)
      }
      continue
    }
    byIdentity.set(key, value)
    merged.push(value)
  }
  return merged
}

function newestActivity(
  left: RemoteProgressEnvelope['recentActivity'],
  right: RemoteProgressEnvelope['recentActivity'],
): RemoteProgressEnvelope['recentActivity'] {
  if (!left) return right
  if (!right) return left
  return right.at > left.at ? right : left
}

export function buildRemoteProgressMergePreview(
  local: RemoteProgressEnvelope,
  remote: RemoteProgressEnvelope,
  now = Date.now(),
): RemoteProgressMergePreview {
  const validatedLocal = validateRemoteProgressEnvelope(local, now)
  const validatedRemote = validateRemoteProgressEnvelope(remote, now)
  if (validatedLocal.learnerId !== validatedRemote.learnerId) throw new Error('Remote progress learner mismatch')

  const legacyBaselines = mergeUnique(
    validatedLocal.legacyBaselines,
    validatedRemote.legacyBaselines,
    baselineIdentity,
    'Baseline',
  )
  const receipts = mergeUnique(
    validatedLocal.receipts,
    validatedRemote.receipts,
    (receipt) => receipt.attemptId,
    'Receipt',
  )
  const avatarConflict = validatedLocal.avatarId !== null
    && validatedRemote.avatarId !== null
    && validatedLocal.avatarId !== validatedRemote.avatarId

  return {
    local: validatedLocal,
    remote: validatedRemote,
    legacyBaselines,
    receipts,
    recentActivity: newestActivity(validatedLocal.recentActivity, validatedRemote.recentActivity),
    conflicts: avatarConflict ? ['avatar'] : [],
  }
}

export function applyRemoteProgressMerge(
  preview: RemoteProgressMergePreview,
  avatarChoice?: 'local' | 'remote',
): RemoteProgressEnvelope {
  if (preview.conflicts.includes('avatar') && !avatarChoice) {
    throw new Error('An explicit avatar choice is required')
  }
  const avatarId = avatarChoice === 'remote'
    ? preview.remote.avatarId
    : preview.local.avatarId ?? preview.remote.avatarId
  return validateRemoteProgressEnvelope({
    schemaVersion: 1,
    learnerId: preview.remote.learnerId,
    revision: preview.remote.revision,
    legacyBaselines: preview.legacyBaselines,
    receipts: preview.receipts,
    recentActivity: preview.recentActivity,
    avatarId,
    updatedAt: Math.max(preview.local.updatedAt, preview.remote.updatedAt),
  })
}
