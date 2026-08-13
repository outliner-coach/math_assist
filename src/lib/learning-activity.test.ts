import { describe, expect, it } from 'vitest'

import {
  createLearningSetCompletionRecord,
  normalizeLearningSetCompletionRecord,
  projectLearningCompletion,
  readLearningSetCompletionRecord,
  recordLearningSetCompletion,
} from './learning-activity'

describe('learning set completion', () => {
  it('records basic completion separately without completing the activity', () => {
    const result = recordLearningSetCompletion(
      createLearningSetCompletionRecord(),
      {
        activityId: 'unit-a',
        mode: 'basic',
        expectedItemCount: 3,
        responses: [
          { itemId: 'a-1', checked: true, correct: true },
          { itemId: 'a-2', checked: true, correct: false },
          { itemId: 'a-3', checked: true, correct: true },
        ],
      },
    )

    expect(result.completed).toBe(true)
    expect(result.reviewItemIds).toEqual(['a-2'])
    expect(result.record).toEqual({
      completedBasicSetActivityIds: ['unit-a'],
      completedPracticeSetActivityIds: [],
    })
    expect(projectLearningCompletion({
      activityId: 'unit-a',
      record: result.record,
      legacyCompleted: false,
    })).toEqual({
      hasCompletedBasicSet: true,
      hasCompletedPracticeSet: false,
      isComplete: false,
      recommendedMode: 'practice',
    })
  })

  it('records a full practice set even with wrong answers and keeps the result idempotent', () => {
    const first = recordLearningSetCompletion(
      createLearningSetCompletionRecord(),
      {
        activityId: 'concept-a',
        mode: 'practice',
        expectedItemCount: 3,
        responses: [
          { itemId: 'p-1', checked: true, correct: true },
          { itemId: 'p-2', checked: true, correct: false },
          { itemId: 'p-3', checked: true, correct: true },
        ],
      },
    )
    const repeated = recordLearningSetCompletion(first.record, {
      activityId: 'concept-a',
      mode: 'practice',
      expectedItemCount: 3,
      responses: [
        { itemId: 'p-1', checked: true, correct: true },
        { itemId: 'p-2', checked: true, correct: true },
        { itemId: 'p-3', checked: true, correct: true },
      ],
    })

    expect(first.reviewItemIds).toEqual(['p-2'])
    expect(repeated.record).toEqual(first.record)
    expect(projectLearningCompletion({
      activityId: 'concept-a',
      record: repeated.record,
      legacyCompleted: false,
    })).toEqual({
      hasCompletedBasicSet: false,
      hasCompletedPracticeSet: true,
      isComplete: true,
      recommendedMode: 'basic',
    })
  })

  it('does not complete a partial or abandoned practice set', () => {
    const initial = createLearningSetCompletionRecord()
    const partial = recordLearningSetCompletion(initial, {
      activityId: 'unit-a',
      mode: 'practice',
      expectedItemCount: 3,
      responses: [
        { itemId: 'p-1', checked: true, correct: true },
        { itemId: 'p-2', checked: false, correct: null },
        { itemId: 'p-3', checked: false, correct: null },
      ],
    })
    const abandoned = recordLearningSetCompletion(initial, {
      activityId: 'unit-a',
      mode: 'practice',
      expectedItemCount: 3,
      responses: [
        { itemId: 'p-1', checked: true, correct: true },
        { itemId: 'p-2', checked: true, correct: true },
      ],
    })

    expect(partial).toMatchObject({ completed: false, record: initial })
    expect(abandoned).toMatchObject({ completed: false, record: initial })
  })

  it('keeps legacy completion as a separate input and never infers its source', () => {
    const record = createLearningSetCompletionRecord()

    expect(projectLearningCompletion({
      activityId: 'legacy-unit',
      record,
      legacyCompleted: true,
    })).toEqual({
      hasCompletedBasicSet: false,
      hasCompletedPracticeSet: false,
      isComplete: true,
      recommendedMode: 'basic',
    })
    expect(record).toEqual(createLearningSetCompletionRecord())
  })

  it('rejects malformed stored completion records instead of silently repairing them', () => {
    expect(normalizeLearningSetCompletionRecord(undefined)).toBeNull()
    expect(normalizeLearningSetCompletionRecord({
      completedBasicSetActivityIds: ['unit-a'],
      completedPracticeSetActivityIds: 'unit-b',
    })).toBeNull()
    expect(normalizeLearningSetCompletionRecord({
      completedBasicSetActivityIds: ['unit-a', 'unit-a'],
      completedPracticeSetActivityIds: ['unit-b'],
    })).toEqual({
      completedBasicSetActivityIds: ['unit-a'],
      completedPracticeSetActivityIds: ['unit-b'],
    })
    expect(readLearningSetCompletionRecord(undefined)).toEqual({
      status: 'missing',
      record: createLearningSetCompletionRecord(),
    })
    expect(readLearningSetCompletionRecord({
      completedBasicSetActivityIds: ['unit-a'],
      completedPracticeSetActivityIds: 'unit-b',
    })).toEqual({ status: 'corrupt', record: null })
  })

  it('rejects incoherent checked responses and duplicate item identities', () => {
    const record = createLearningSetCompletionRecord()

    expect(() => recordLearningSetCompletion(record, {
      activityId: 'unit-a',
      mode: 'practice',
      expectedItemCount: 2,
      responses: [
        { itemId: 'same', checked: true, correct: true },
        { itemId: 'same', checked: true, correct: false },
      ],
    })).toThrow(/unique/i)
    expect(() => recordLearningSetCompletion(record, {
      activityId: 'unit-a',
      mode: 'practice',
      expectedItemCount: 1,
      responses: [{ itemId: 'p-1', checked: false, correct: true }],
    })).toThrow(/unchecked/i)
  })
})
