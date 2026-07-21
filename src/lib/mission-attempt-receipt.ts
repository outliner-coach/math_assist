import {
  LocalAttemptReceiptStore,
  createAttemptReceipt,
  createContentDedupeKey,
  type AppendReceiptResult,
  type AttemptReceipt,
} from './attempt-receipt'

export type MissionReceiptGrade = 1 | 2 | 3

export interface MissionReceiptContent {
  id: string
  prompt: string
  correctAnswer: string
  choices?: string[]
  visualModel: string
  visualConfig: Record<string, string | number | boolean>
}

export interface MissionAttemptReceiptInput {
  grade: MissionReceiptGrade
  mission: MissionReceiptContent
  sessionRunKey: string | number
  attemptIndex: number
  variantKey: string
  correct: boolean
  usedHint: boolean
  checkedAt?: number
}

const CONTENT_RELEASE_IDS: Record<MissionReceiptGrade, string> = {
  1: 'grade1-missions-static-v1',
  2: 'grade2-missions-static-v1',
  3: 'grade3-missions-static-v1',
}

/**
 * Bridges the current retry-in-place mission UI to immutable receipts.
 * Each valid check gets an item ordinal; repeated event delivery before the
 * UI advances that ordinal resolves to the same receipt identity.
 */
export function createMissionAttemptReceipt(input: MissionAttemptReceiptInput): AttemptReceipt {
  if (!Number.isSafeInteger(input.attemptIndex) || input.attemptIndex < 0) {
    throw new Error('Mission receipt attemptIndex must be a non-negative integer')
  }

  const sessionRunKey = String(input.sessionRunKey).trim()
  if (!sessionRunKey) throw new Error('Mission receipt sessionRunKey is required')

  const receipt = createAttemptReceipt({
    learnerId: null,
    sessionId: `grade${input.grade}:mission:${input.mission.id}:${sessionRunKey}`,
    activityId: input.mission.id,
    grade: input.grade,
    itemId: input.mission.id,
    attemptOrdinal: input.attemptIndex,
    variantKey: input.variantKey,
    contentReleaseId: CONTENT_RELEASE_IDS[input.grade],
    responseStatus: 'checked',
    correct: input.correct,
    usedHint: input.usedHint,
    checkedAt: input.checkedAt ?? Date.now(),
    dedupeKey: createContentDedupeKey({
      prompt: input.mission.prompt,
      correctAnswer: input.mission.correctAnswer,
      choices: input.mission.choices,
      visualModel: input.mission.visualModel,
      visualConfig: input.mission.visualConfig,
    }),
  })

  if (!receipt) throw new Error('A checked mission response must create a receipt')
  return receipt
}

export async function appendMissionAttemptReceipt(
  input: MissionAttemptReceiptInput,
  store = new LocalAttemptReceiptStore(),
): Promise<AppendReceiptResult> {
  return store.append(createMissionAttemptReceipt(input))
}
