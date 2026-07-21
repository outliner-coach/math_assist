import { describe, expect, it } from 'vitest'

import type { AttemptReceipt } from './attempt-receipt'
import {
  REMOTE_PROGRESS_ENABLED,
  applyRemoteProgressMerge,
  buildRemoteProgressMergePreview,
  validateRemoteProgressEnvelope,
  type LegacyProgressBaseline,
  type RemoteProgressEnvelope,
} from './remote-progress'

const now = 1_721_520_000_000

function baseline(overrides: Partial<LegacyProgressBaseline> = {}): LegacyProgressBaseline {
  return {
    sourceKey: 'mathAssist_grade1Progress',
    sourceSchemaVersion: 2,
    sourceHash: 'sha256:grade1-a',
    grade: 1,
    completedIds: ['g1-a'],
    reviewIds: [],
    recentActivityId: 'g1-a',
    recentActivityAt: now - 2_000,
    selectedUnitId: null,
    ...overrides,
  }
}

function receipt(attemptId: string, checkedAt: number): AttemptReceipt {
  return {
    schemaVersion: 1,
    attemptId,
    learnerId: 'learner-1',
    sessionId: 'session-1',
    activityId: 'g1-a',
    grade: 1,
    itemId: `item-${attemptId}`,
    attemptOrdinal: 0,
    variantKey: `variant-${attemptId}`,
    contentReleaseId: 'grade1-v1',
    correct: true,
    usedHint: false,
    checkedAt,
    dedupeKey: `content-${attemptId}`,
  }
}

function envelope(overrides: Partial<RemoteProgressEnvelope> = {}): RemoteProgressEnvelope {
  return {
    schemaVersion: 1,
    learnerId: 'learner-1',
    revision: 'rev-1',
    legacyBaselines: [],
    receipts: [],
    recentActivity: null,
    avatarId: null,
    updatedAt: now - 1_000,
    ...overrides,
  }
}

describe('remote progress merge', () => {
  it('keeps the production remote flag off by default', () => {
    expect(REMOTE_PROGRESS_ENABLED).toBe(false)
  })

  it('accepts a Grade 6 legacy baseline and rejects unsupported grades', () => {
    const grade6 = validateRemoteProgressEnvelope(envelope({
      legacyBaselines: [baseline({
        sourceKey: 'mathAssist_grade6Progress',
        sourceHash: 'sha256:grade6-a',
        grade: 6,
        completedIds: ['g6-ratio-a'],
        recentActivityId: 'g6-ratio-a',
      })],
    }), now)

    expect(grade6.legacyBaselines[0]?.grade).toBe(6)
    expect(() => validateRemoteProgressEnvelope({
      ...envelope(),
      legacyBaselines: [{ ...baseline(), grade: 7 }],
    }, now)).toThrow(/legacyBaseline\.grade is invalid/i)
  })

  it('unions baseline identities and attemptIds idempotently', () => {
    const sharedBaseline = baseline()
    const sharedReceipt = receipt('attempt-a', now - 500)
    const local = envelope({
      revision: 'local',
      legacyBaselines: [sharedBaseline],
      receipts: [sharedReceipt, receipt('attempt-local', now - 400)],
      recentActivity: { grade: 1, activityId: 'local', at: now - 400 },
    })
    const remote = envelope({
      revision: 'remote',
      legacyBaselines: [sharedBaseline, baseline({ sourceKey: 'mathAssist_grade2Progress', grade: 2 })],
      receipts: [sharedReceipt, receipt('attempt-remote', now - 300)],
      recentActivity: { grade: 2, activityId: 'remote', at: now - 300 },
    })

    const preview = buildRemoteProgressMergePreview(local, remote, now)
    const result = applyRemoteProgressMerge(preview)

    expect(preview.conflicts).toEqual([])
    expect(result.legacyBaselines).toHaveLength(2)
    expect(result.receipts.map((item) => item.attemptId)).toEqual([
      'attempt-a',
      'attempt-local',
      'attempt-remote',
    ])
    expect(result.recentActivity).toEqual(remote.recentActivity)
    expect(result.revision).toBe('remote')
  })

  it('does not silently choose an avatar when both sides changed', () => {
    const preview = buildRemoteProgressMergePreview(
      envelope({ avatarId: 'otter' }),
      envelope({ avatarId: 'fox' }),
      now,
    )

    expect(preview.conflicts).toContain('avatar')
    expect(() => applyRemoteProgressMerge(preview)).toThrow(/avatar choice/i)
    expect(applyRemoteProgressMerge(preview, 'remote').avatarId).toBe('fox')
  })

  it('rejects conflicting records that reuse a baseline identity or attemptId', () => {
    expect(() => buildRemoteProgressMergePreview(
      envelope({ legacyBaselines: [baseline()] }),
      envelope({ legacyBaselines: [baseline({ completedIds: ['different'] })] }),
      now,
    )).toThrow(/baseline conflict/i)

    expect(() => buildRemoteProgressMergePreview(
      envelope({ receipts: [receipt('same', now - 200)] }),
      envelope({ receipts: [{ ...receipt('same', now - 200), correct: false }] }),
      now,
    )).toThrow(/receipt conflict/i)
  })

  it('rejects another learner and abnormal future timestamps', () => {
    expect(() => buildRemoteProgressMergePreview(
      envelope(),
      envelope({ learnerId: 'learner-2' }),
      now,
    )).toThrow(/learner mismatch/i)

    expect(() => buildRemoteProgressMergePreview(
      envelope(),
      envelope({ recentActivity: { grade: 1, activityId: 'future', at: now + 300_001 } }),
      now,
    )).toThrow(/future/i)
  })

  it('rejects raw answers, strokes, foreign learner receipts, and malformed runtime arrays', () => {
    expect(() => validateRemoteProgressEnvelope({
      ...envelope(),
      receipts: [{ ...receipt('raw-answer', now - 100), answer: '42' }],
    }, now)).toThrow(/unsupported field/i)

    expect(() => validateRemoteProgressEnvelope({
      ...envelope(),
      receipts: [{ ...receipt('raw-stroke', now - 100), commands: [{ type: 'stroke' }] }],
    }, now)).toThrow(/unsupported field/i)

    expect(() => validateRemoteProgressEnvelope({
      ...envelope(),
      receipts: [{ ...receipt('foreign', now - 100), learnerId: 'learner-2' }],
    }, now)).toThrow(/learner mismatch/i)

    expect(() => validateRemoteProgressEnvelope({
      ...envelope(),
      receipts: 'not-an-array',
    }, now)).toThrow(/receipts is invalid/i)
  })
})
