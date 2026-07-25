import { describe, expect, it } from 'vitest'

import { ATTEMPT_RECEIPT_STORAGE_KEY, LocalAttemptReceiptStore, type ReceiptStorage } from './attempt-receipt'
import { appendGrade4AttemptReceipt, createGrade4AttemptReceipt } from './grade4-attempt-receipt'
import {
  GRADE4_CONTENT_RELEASE_ID,
  GRADE4_DECIMAL_UNIT_ID,
  GRADE4_DECIMAL_ADD_SUB_UNIT_ID,
  GRADE4_DIVISION_UNIT_ID,
  GRADE4_ESTIMATION_UNIT_ID,
  GRADE4_EQUALITY_UNIT_ID,
  GRADE4_FRACTION_ADD_SUB_UNIT_ID,
  GRADE4_PATTERNS_UNIT_ID,
  GRADE4_PERPENDICULAR_PARALLEL_UNIT_ID,
  GRADE4_QUADRILATERALS_UNIT_ID,
  GRADE4_SHAPE_TRANSFORMATIONS_UNIT_ID,
  GRADE4_TRIANGLES_UNIT_ID,
  getGrade4Activity,
  SAFE_GRADE4_UNIT_ID,
} from './grade4-problems'

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

  it('uses a unit-specific content release without changing the legacy unit identity', () => {
    const divisionMission = getGrade4Activity(GRADE4_DIVISION_UNIT_ID, 20260721, 0)[0]
    const receipt = createGrade4AttemptReceipt({
      mission: divisionMission,
      activityRun: 0,
      attemptOrdinal: 0,
      correct: true,
      usedHint: false,
    })

    expect(receipt.contentReleaseId).toBe('grade4-bridge-two-digit-division-v1')
    expect(GRADE4_CONTENT_RELEASE_ID).toBe('grade4-bridge-big-numbers-v1')
  })

  it('uses the arithmetic-estimation release identity', () => {
    const estimationMission = getGrade4Activity(GRADE4_ESTIMATION_UNIT_ID, 20260721, 0)[0]
    const receipt = createGrade4AttemptReceipt({
      mission: estimationMission,
      activityRun: 0,
      attemptOrdinal: 0,
      correct: true,
      usedHint: false,
    })

    expect(receipt.contentReleaseId).toBe('grade4-bridge-arithmetic-estimation-v1')
  })

  it('uses the decimal-unit release identity', () => {
    const decimalMission = getGrade4Activity(GRADE4_DECIMAL_UNIT_ID, 20260721, 0)[0]
    const receipt = createGrade4AttemptReceipt({
      mission: decimalMission,
      activityRun: 0,
      attemptOrdinal: 0,
      correct: true,
      usedHint: false,
    })

    expect(receipt.contentReleaseId).toBe('grade4-bridge-decimals-v1')
  })

  it('uses the fraction-add-sub release identity', () => {
    const fractionMission = getGrade4Activity(GRADE4_FRACTION_ADD_SUB_UNIT_ID, 20260721, 0)[0]
    const receipt = createGrade4AttemptReceipt({
      mission: fractionMission,
      activityRun: 0,
      attemptOrdinal: 0,
      correct: true,
      usedHint: false,
    })

    expect(receipt.contentReleaseId).toBe('grade4-bridge-fraction-add-sub-v1')
  })

  it('uses the decimal-add-sub release identity', () => {
    const decimalOperationMission = getGrade4Activity(GRADE4_DECIMAL_ADD_SUB_UNIT_ID, 20260721, 0)[0]
    const receipt = createGrade4AttemptReceipt({
      mission: decimalOperationMission,
      activityRun: 0,
      attemptOrdinal: 0,
      correct: true,
      usedHint: false,
    })

    expect(receipt.contentReleaseId).toBe('grade4-bridge-decimal-add-sub-v1')
  })

  it('uses the patterns release identity', () => {
    const patternMission = getGrade4Activity(GRADE4_PATTERNS_UNIT_ID, 20260721, 0)[0]
    const receipt = createGrade4AttemptReceipt({
      mission: patternMission,
      activityRun: 0,
      attemptOrdinal: 0,
      correct: true,
      usedHint: false,
    })

    expect(receipt.contentReleaseId).toBe('grade4-bridge-patterns-v1')
  })

  it('uses the equality release identity', () => {
    const equalityMission = getGrade4Activity(GRADE4_EQUALITY_UNIT_ID, 20260721, 0)[0]
    const receipt = createGrade4AttemptReceipt({
      mission: equalityMission,
      activityRun: 0,
      attemptOrdinal: 0,
      correct: true,
      usedHint: false,
    })

    expect(receipt.contentReleaseId).toBe('grade4-bridge-equality-v1')
  })

  it('uses the perpendicular-parallel release identity', () => {
    const lineMission = getGrade4Activity(GRADE4_PERPENDICULAR_PARALLEL_UNIT_ID, 20260721, 0)[0]
    const receipt = createGrade4AttemptReceipt({
      mission: lineMission,
      activityRun: 0,
      attemptOrdinal: 0,
      correct: true,
      usedHint: false,
    })

    expect(receipt.contentReleaseId).toBe('grade4-bridge-perpendicular-parallel-v1')
  })

  it('uses the shape-transformations release identity', () => {
    const movementMission = getGrade4Activity(GRADE4_SHAPE_TRANSFORMATIONS_UNIT_ID, 20260721, 0)[0]
    const receipt = createGrade4AttemptReceipt({
      mission: movementMission,
      activityRun: 0,
      attemptOrdinal: 0,
      correct: true,
      usedHint: false,
    })

    expect(receipt.contentReleaseId).toBe('grade4-bridge-shape-transformations-v1')
  })

  it('uses the triangles release identity', () => {
    const triangleMission = getGrade4Activity(GRADE4_TRIANGLES_UNIT_ID, 20260721, 0)[0]
    const receipt = createGrade4AttemptReceipt({
      mission: triangleMission,
      activityRun: 0,
      attemptOrdinal: 0,
      correct: true,
      usedHint: false,
    })

    expect(receipt.contentReleaseId).toBe('grade4-bridge-triangles-v1')
  })

  it('uses the quadrilaterals release identity', () => {
    const quadrilateralMission = getGrade4Activity(GRADE4_QUADRILATERALS_UNIT_ID, 20260721, 0)[0]
    const receipt = createGrade4AttemptReceipt({
      mission: quadrilateralMission,
      activityRun: 0,
      attemptOrdinal: 0,
      correct: true,
      usedHint: false,
    })

    expect(receipt.contentReleaseId).toBe('grade4-bridge-quadrilaterals-v1')
  })
})
