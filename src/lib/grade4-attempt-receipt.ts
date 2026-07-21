import {
  LocalAttemptReceiptStore,
  createAttemptReceipt,
  createContentDedupeKey,
  type AppendReceiptResult,
  type AttemptReceipt,
} from './attempt-receipt'
import { GRADE4_CONTENT_RELEASE_ID, type Grade4Mission } from './grade4-problems'

export interface Grade4AttemptReceiptInput {
  mission: Grade4Mission
  activityRun: number
  attemptOrdinal: number
  correct: boolean
  usedHint: boolean
  checkedAt?: number
}

export function createGrade4AttemptReceipt(input: Grade4AttemptReceiptInput): AttemptReceipt {
  if (!Number.isSafeInteger(input.activityRun) || input.activityRun < 0) throw new Error('Grade 4 activityRun must be a non-negative integer')
  if (!Number.isSafeInteger(input.attemptOrdinal) || input.attemptOrdinal < 0) throw new Error('Grade 4 attemptOrdinal must be a non-negative integer')
  const receipt = createAttemptReceipt({
    learnerId: null,
    sessionId: `grade4:${input.mission.unitId}:activity-${input.activityRun}`,
    activityId: input.mission.unitId,
    grade: 4,
    itemId: input.mission.id,
    attemptOrdinal: input.attemptOrdinal,
    variantKey: input.mission.variantKey,
    contentReleaseId: GRADE4_CONTENT_RELEASE_ID,
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
  if (!receipt) throw new Error('A checked Grade 4 response must create a receipt')
  return receipt
}

export async function appendGrade4AttemptReceipt(
  input: Grade4AttemptReceiptInput,
  store = new LocalAttemptReceiptStore(),
): Promise<AppendReceiptResult> {
  return store.append(createGrade4AttemptReceipt(input))
}
