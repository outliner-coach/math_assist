import type { AttemptReceipt } from './attempt-receipt'

export type { AttemptReceipt } from './attempt-receipt'

export const LEARNING_GRADES = [1, 2, 3, 4, 5, 6] as const

export type LearningGrade = (typeof LEARNING_GRADES)[number]
export type LearningActivityMode = 'mission' | 'practice' | 'review'
export type LearningActivityStatus = 'active' | 'completed' | 'expired'
export type LearningSetMode = 'basic' | 'practice'

export interface LearningSetCompletionRecord {
  completedBasicSetActivityIds: readonly string[]
  completedPracticeSetActivityIds: readonly string[]
}

export interface LearningSetResponse {
  itemId: string
  checked: boolean
  correct: boolean | null
}

export interface LearningSetCompletionInput {
  activityId: string
  mode: LearningSetMode
  expectedItemCount: number
  responses: readonly LearningSetResponse[]
}

export interface LearningSetCompletionResult {
  completed: boolean
  record: LearningSetCompletionRecord
  reviewItemIds: readonly string[]
}

export interface LearningCompletionProjection {
  hasCompletedBasicSet: boolean
  hasCompletedPracticeSet: boolean
  isComplete: boolean
  recommendedMode: LearningSetMode
}

export type LearningSetCompletionRecordReadResult =
  | { status: 'missing'; record: LearningSetCompletionRecord }
  | { status: 'valid'; record: LearningSetCompletionRecord }
  | { status: 'corrupt'; record: null }

export interface ActivityItemSnapshot {
  itemId: string
  sourceIndex: number
}

export interface ActivityResponse {
  itemId: string
  answer: string | null
  checked: boolean | null
}

/**
 * A common read model for both a one-item mission and a multi-item practice.
 * Legacy device records do not identify a learner, so learnerId remains null
 * until an explicit guest/profile boundary is introduced.
 */
export interface LearningActivitySession {
  sessionId: string
  learnerId: string | null
  grade: LearningGrade
  activityId: string
  mode: LearningActivityMode
  items: readonly ActivityItemSnapshot[]
  responses: readonly ActivityResponse[]
  currentIndex: number
  status: LearningActivityStatus
  startedAt: number
  updatedAt: number
  expiresAt: number | null
  source: 'legacy-grade5-session' | 'native'
}

export interface ProgressResume {
  activityId: string
  contextId: string | null
  mode: LearningActivityMode
  currentIndex: number
}

export interface LearningProgressProjection {
  grade: LearningGrade
  resume: ProgressResume | null
  completed: readonly string[]
  review: readonly string[]
  lastActivityAt: number | null
  corrupted: boolean
  sessionCorrupted: boolean
  sourceKey: string
  schemaVersion: number | null
}

export type LearningProgressProjectionMap = Record<LearningGrade, LearningProgressProjection>

export interface ProgressRepository {
  readProgress(grade: LearningGrade, now?: number): LearningProgressProjection
  readAllProgress(now?: number): LearningProgressProjectionMap
  readSession(grade: LearningGrade, now?: number): LearningActivitySession | null
  readAttemptReceipts(grade: LearningGrade): readonly AttemptReceipt[]
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function uniqueStrings(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || !value.every(nonEmptyString)) return null
  return Array.from(new Set(value.filter(nonEmptyString)))
}

export function createLearningSetCompletionRecord(): LearningSetCompletionRecord {
  return {
    completedBasicSetActivityIds: [],
    completedPracticeSetActivityIds: [],
  }
}

/**
 * Normalizes only a present, structurally valid record without writing it.
 * Use readLearningSetCompletionRecord when missing and corrupt must differ.
 */
export function normalizeLearningSetCompletionRecord(
  value: unknown,
): LearningSetCompletionRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Partial<LearningSetCompletionRecord>
  const completedBasicSetActivityIds = uniqueStrings(candidate.completedBasicSetActivityIds)
  const completedPracticeSetActivityIds = uniqueStrings(candidate.completedPracticeSetActivityIds)
  if (!completedBasicSetActivityIds || !completedPracticeSetActivityIds) return null
  return {
    completedBasicSetActivityIds,
    completedPracticeSetActivityIds,
  }
}

export function readLearningSetCompletionRecord(
  value: unknown,
): LearningSetCompletionRecordReadResult {
  if (value === undefined) {
    return { status: 'missing', record: createLearningSetCompletionRecord() }
  }
  const record = normalizeLearningSetCompletionRecord(value)
  return record ? { status: 'valid', record } : { status: 'corrupt', record: null }
}

function appendUnique(values: readonly string[], value: string): readonly string[] {
  return values.includes(value) ? values : [...values, value]
}

/**
 * Records only a fully checked set. Correctness does not affect completion;
 * wrong item identities are returned additively for the owning grade adapter.
 */
export function recordLearningSetCompletion(
  record: LearningSetCompletionRecord,
  input: LearningSetCompletionInput,
): LearningSetCompletionResult {
  const normalizedRecord = normalizeLearningSetCompletionRecord(record)
  if (!normalizedRecord) throw new Error('A valid completion record is required')
  if (!nonEmptyString(input.activityId)) throw new Error('A completion activityId is required')
  if (!Number.isSafeInteger(input.expectedItemCount) || input.expectedItemCount <= 0) {
    throw new Error('A positive expectedItemCount is required')
  }

  const itemIds = input.responses.map((response) => response.itemId)
  if (itemIds.some((itemId) => !nonEmptyString(itemId))) {
    throw new Error('Every completion response requires an itemId')
  }
  if (new Set(itemIds).size !== itemIds.length) {
    throw new Error('Completion response item identities must be unique')
  }
  for (const response of input.responses) {
    if (!response.checked && response.correct !== null) {
      throw new Error('An unchecked response cannot have a correctness result')
    }
    if (response.checked && typeof response.correct !== 'boolean') {
      throw new Error('A checked response requires a correctness result')
    }
  }

  const reviewItemIds = input.responses
    .filter((response) => response.checked && response.correct === false)
    .map((response) => response.itemId)
  const completed = input.responses.length === input.expectedItemCount
    && input.responses.every((response) => response.checked)
  if (!completed) {
    return {
      completed: false,
      record: normalizedRecord,
      reviewItemIds,
    }
  }

  return {
    completed: true,
    record: input.mode === 'basic'
      ? {
          ...normalizedRecord,
          completedBasicSetActivityIds: appendUnique(
            normalizedRecord.completedBasicSetActivityIds,
            input.activityId,
          ),
        }
      : {
          ...normalizedRecord,
          completedPracticeSetActivityIds: appendUnique(
            normalizedRecord.completedPracticeSetActivityIds,
            input.activityId,
          ),
        },
    reviewItemIds,
  }
}

/**
 * Legacy completion remains a separate fact. It can make the activity complete
 * but is never rewritten as evidence of either a basic or practice set.
 */
export function projectLearningCompletion(input: {
  activityId: string
  record: LearningSetCompletionRecord
  legacyCompleted: boolean
}): LearningCompletionProjection {
  if (!nonEmptyString(input.activityId)) throw new Error('A completion activityId is required')
  const record = normalizeLearningSetCompletionRecord(input.record)
  if (!record) throw new Error('A valid completion record is required')
  const hasCompletedBasicSet = record.completedBasicSetActivityIds.includes(input.activityId)
  const hasCompletedPracticeSet = record.completedPracticeSetActivityIds.includes(input.activityId)
  return {
    hasCompletedBasicSet,
    hasCompletedPracticeSet,
    isComplete: input.legacyCompleted || hasCompletedPracticeSet,
    recommendedMode: hasCompletedBasicSet ? 'practice' : 'basic',
  }
}
