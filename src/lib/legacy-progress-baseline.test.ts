import { describe, expect, it } from 'vitest'

import { createLegacyProgressBaselines } from './legacy-progress-baseline'

function readonlyStorage(initial: Record<string, string>) {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem(key: string) { return values.get(key) ?? null },
  }
}

describe('legacy progress baselines', () => {
  it('creates idempotent baselines without inventing attempt receipts or rewriting raw keys', () => {
    const raw = JSON.stringify({
      schemaVersion: 2,
      completedMissionIds: ['g2-a', 'g2-a'],
      reviewMissionIds: ['g2-a'],
      latestMissionId: 'g2-a',
      selectedUnitId: 'g2-unit',
      lastPlayedAt: 123,
      xp: 40,
    })
    const local = readonlyStorage({ mathAssist_grade2Progress: raw })

    const first = createLegacyProgressBaselines(local, 500)
    const second = createLegacyProgressBaselines(local, 900)

    expect(first).toEqual(second)
    expect(first).toEqual({
      baselines: [{
        sourceKey: 'mathAssist_grade2Progress',
        sourceSchemaVersion: 2,
        sourceHash: expect.stringMatching(/^content:/),
        grade: 2,
        completedIds: ['g2-a'],
        reviewIds: ['g2-a'],
        recentActivityId: 'g2-a',
        recentActivityAt: 123,
        selectedUnitId: 'g2-unit',
      }],
      corruptedGrades: [],
    })
    expect(local.values.get('mathAssist_grade2Progress')).toBe(raw)
    expect(JSON.stringify(first)).not.toContain('attemptId')
    expect(JSON.stringify(first)).not.toContain('xp')
  })

  it('isolates a corrupt grade and continues valid grades', () => {
    const local = readonlyStorage({
      mathAssist_grade1Progress: '{bad json',
      mathAssist_grade3Progress: JSON.stringify({
        completedMissionIds: ['g3-a'],
        reviewMissionIds: [],
        latestMissionId: 'g3-a',
        lastPlayedAt: 300,
      }),
    })

    const result = createLegacyProgressBaselines(local, 500)
    expect(result.corruptedGrades).toEqual([1])
    expect(result.baselines.map((item) => item.grade)).toEqual([3])
  })

  it('creates a Grade 4 baseline from the read-only variant projection', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      completedVariantKeys: ['g4-big-02:seed-1'],
      reviewVariantKeys: ['g4-big-02:seed-1'],
      latestMissionId: 'g4-big-02',
      selectedUnitId: 'unit-4-1-large-numbers',
      activityRun: 0,
      activeItemIndex: 1,
      skillSummaryByTag: {},
      lastPlayedAt: 400,
    })
    const local = readonlyStorage({ mathAssist_grade4Progress: raw })

    expect(createLegacyProgressBaselines(local, 500)).toEqual({
      baselines: [{
        sourceKey: 'mathAssist_grade4Progress',
        sourceSchemaVersion: 1,
        sourceHash: expect.stringMatching(/^content:/),
        grade: 4,
        completedIds: ['g4-big-02:seed-1'],
        reviewIds: ['g4-big-02:seed-1'],
        recentActivityId: 'g4-big-02',
        recentActivityAt: 400,
        selectedUnitId: 'unit-4-1-large-numbers',
      }],
      corruptedGrades: [],
    })
    expect(local.values.get('mathAssist_grade4Progress')).toBe(raw)
  })

  it('does not let an active Grade 5 session alter the progress-key baseline hash or recent activity', () => {
    const progressRaw = JSON.stringify({
      'concept-a': { conceptId: 'concept-a', lastCompletedAt: 100, needsReview: false },
    })
    const local = readonlyStorage({
      mathAssist_progress_v1: progressRaw,
      mathAssist_currentSession: JSON.stringify({
        conceptId: 'concept-session',
        startedAt: 400,
        expiresAt: 1_000,
      }),
    })

    const result = createLegacyProgressBaselines(local, 500)
    expect(result.baselines[0]).toMatchObject({
      grade: 5,
      recentActivityId: 'concept-a',
      recentActivityAt: 100,
      sourceHash: expect.stringMatching(/^content:/),
    })
  })

  it('creates an isolated Grade 6 baseline without including the active answer snapshot', () => {
    const progressRaw = JSON.stringify({
      'g6ratio-001': { conceptId: 'g6ratio-001', lastCompletedAt: 600, needsReview: true },
    })
    const local = readonlyStorage({
      mathAssist_grade6Progress: progressRaw,
      mathAssist_grade6CurrentSession: JSON.stringify({
        grade: 6,
        itemCount: 5,
        conceptId: 'g6ratio-001',
        answers: ['secret-draft-answer'],
        startedAt: 800,
        expiresAt: 1_000,
      }),
    })

    const result = createLegacyProgressBaselines(local, 900)

    expect(result.baselines).toEqual([expect.objectContaining({
      sourceKey: 'mathAssist_grade6Progress',
      grade: 6,
      completedIds: ['g6ratio-001'],
      reviewIds: ['g6ratio-001'],
      recentActivityId: 'g6ratio-001',
      recentActivityAt: 600,
    })])
    expect(JSON.stringify(result)).not.toContain('secret-draft-answer')
  })
})
