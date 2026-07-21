import type { AttemptReceipt } from './attempt-receipt'

export type { AttemptReceipt } from './attempt-receipt'

export const LEARNING_GRADES = [1, 2, 3, 4, 5, 6] as const

export type LearningGrade = (typeof LEARNING_GRADES)[number]
export type LearningActivityMode = 'mission' | 'practice' | 'review'
export type LearningActivityStatus = 'active' | 'completed' | 'expired'

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
