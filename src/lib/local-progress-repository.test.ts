import { describe, expect, it, vi } from 'vitest'

import {
  createLocalProgressRepository,
  type ReadonlyLearningStorage,
} from './local-progress-repository'
import { grade1MissionTemplates } from './grade1-problems'
import { getGrade2MissionSet } from './grade2-problems'
import { getGrade3MissionSession } from './grade3-problems'

function memoryStorage(initial: Record<string, string>): ReadonlyLearningStorage & {
  data: Record<string, string>
  setItem: ReturnType<typeof vi.fn>
  removeItem: ReturnType<typeof vi.fn>
} {
  return {
    data: { ...initial },
    getItem(key: string) {
      return this.data[key] ?? null
    },
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }
}

function legacyFixtures() {
  return {
    mathAssist_grade1Progress: JSON.stringify({
      schemaVersion: 1,
      completedStageIds: ['g1-done'],
      reviewStageIds: ['g1-review'],
      latestStageId: 'g1-review',
      todaySolvedCount: 2,
      skillSummaryByTag: { number: { attempted: 3, correct: 2 } },
      lastPlayedAt: 100,
      unknownLegacyField: { keep: true },
    }),
    mathAssist_grade2Progress: JSON.stringify({
      schemaVersion: 1,
      completedMissionIds: ['g2-done'],
      reviewMissionIds: ['g2-review'],
      latestMissionId: 'g2-done',
      selectedUnitId: 'g2-unit',
      todaySolvedCount: 3,
      skillSummaryByTag: {},
      lastPlayedAt: 200,
    }),
    mathAssist_grade3Progress: JSON.stringify({
      schemaVersion: 1,
      completedMissionIds: ['g3-done'],
      reviewMissionIds: ['g3-review'],
      latestMissionId: 'g3-review',
      selectedUnitId: 'g3-unit',
      todaySolvedCount: 1,
      skillSummaryByTag: {},
      lastPlayedAt: 300,
    }),
    mathAssist_grade4Progress: JSON.stringify({
      schemaVersion: 1,
      completedVariantKeys: ['g4-big-02:seed-20260721:variant-8'],
      reviewVariantKeys: ['g4-big-02:seed-20260721:variant-8'],
      latestMissionId: 'g4-big-02',
      selectedUnitId: 'unit-4-1-large-numbers',
      activityRun: 0,
      activeItemIndex: 1,
      todaySolvedCount: 1,
      skillSummaryByTag: {},
      lastPlayedAt: 350,
    }),
    mathAssist_progress_v1: JSON.stringify({
      'divisor-001': {
        conceptId: 'divisor-001',
        attemptCount: 2,
        bestScore: 90,
        latestScore: 80,
        lastCompletedAt: 400,
        needsReview: true,
        lastMode: 'standard',
      },
      'multiple-001': {
        conceptId: 'multiple-001',
        attemptCount: 1,
        bestScore: 100,
        latestScore: 100,
        lastCompletedAt: 350,
        needsReview: false,
        lastMode: 'standard',
      },
    }),
    mathAssist_currentSession: JSON.stringify({
      sessionId: 'legacy-session',
      conceptId: 'fraction-001',
      setId: 'B',
      mode: 'retry-wrong',
      problems: [
        { index: 0, templateId: 'fraction-item-1', type: 'number', prompt: '문제' },
        { index: 1, templateId: 'fraction-item-2', type: 'number', prompt: '문제' },
      ],
      answers: ['1/2', null],
      currentIndex: 1,
      startedAt: 500,
      expiresAt: 2_000,
      unknownSessionField: 'keep',
    }),
    mathAssist_grade6Progress: JSON.stringify({
      'g6ratio-001': {
        conceptId: 'g6ratio-001',
        attemptCount: 1,
        bestScore: 80,
        latestScore: 80,
        lastCompletedAt: 450,
        needsReview: true,
        lastMode: 'standard',
      },
    }),
    mathAssist_grade6CurrentSession: JSON.stringify({
      sessionId: 'grade6_session_600_active',
      conceptId: 'g6ratio-001',
      setId: 'C',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: [{ index: 0, templateId: 'tmpl-g6ratio-C-01', type: 'number', prompt: '문제' }],
      answers: [null],
      checkedAnswers: [null],
      currentIndex: 0,
      startedAt: 600,
      expiresAt: 2_000,
    }),
  }
}

describe('local read-only progress repository', () => {
  it.each(['basic', 'practice'] as const)(
    'projects %s completion evidence consistently across Grades 1-6',
    (mode) => {
      const grade1ActivityId = 'count-cove'
      const grade2ActivityId = 'g2-1-place-value'
      const grade3ActivityId = 'g3-1-add-sub'
      const grade4ActivityId = 'unit-4-1-large-numbers'
      const grade5ActivityId = 'divisor-001'
      const grade6ActivityId = 'g6ratio-001'
      const grade1Ids = grade1MissionTemplates
        .filter((mission) => mission.islandId === grade1ActivityId && mission.mode === mode)
        .map((mission) => mission.id)
      const grade2Ids = getGrade2MissionSet(grade2ActivityId, mode).map((mission) => mission.id)
      const grade3Ids = getGrade3MissionSession(grade3ActivityId, mode).map((mission) => mission.id)
      const completionRecord = {
        completedBasicSetActivityIds: mode === 'basic' ? [grade4ActivityId] : [],
        completedPracticeSetActivityIds: mode === 'practice' ? [grade4ActivityId] : [],
      }
      const conceptCompletion = (conceptId: string) => ({
        conceptId,
        attemptCount: 1,
        bestScore: 80,
        latestScore: 80,
        lastCompletedAt: 500,
        needsReview: false,
        lastMode: 'standard',
        completionRecord: {
          completedBasicSetActivityIds: mode === 'basic' ? [conceptId] : [],
          completedPracticeSetActivityIds: mode === 'practice' ? [conceptId] : [],
        },
        legacyCompleted: false,
      })
      const storage = memoryStorage({
        mathAssist_grade1Progress: JSON.stringify({
          schemaVersion: 3,
          completedStageIds: grade1Ids,
          checkedStageIds: grade1Ids,
          completedIslandIds: mode === 'practice' ? [grade1ActivityId] : [],
          reviewStageIds: [],
          latestStageId: grade1Ids.at(-1),
          lastPlayedAt: 100,
        }),
        mathAssist_grade2Progress: JSON.stringify({
          schemaVersion: 4,
          completedMissionIds: grade2Ids,
          checkedMissionIds: grade2Ids,
          completedUnitIds: mode === 'practice' ? [grade2ActivityId] : [],
          reviewMissionIds: [],
          latestMissionId: grade2Ids.at(-1),
          selectedUnitId: grade2ActivityId,
          lastPlayedAt: 200,
        }),
        mathAssist_grade3Progress: JSON.stringify({
          schemaVersion: 2,
          completedMissionIds: grade3Ids,
          checkedMissionIds: grade3Ids,
          completedUnitIds: mode === 'practice' ? [grade3ActivityId] : [],
          practiceMissionIdsByUnit: mode === 'practice' ? { [grade3ActivityId]: grade3Ids } : {},
          reviewMissionIds: [],
          latestMissionId: grade3Ids.at(-1),
          selectedUnitId: grade3ActivityId,
          lastPlayedAt: 300,
        }),
        mathAssist_grade4Progress: JSON.stringify({
          schemaVersion: 1,
          completedVariantKeys: [],
          reviewVariantKeys: [],
          latestMissionId: null,
          selectedUnitId: grade4ActivityId,
          activityRun: 0,
          activeItemIndex: 0,
          lastPlayedAt: 400,
          completionRecord,
        }),
        mathAssist_progress_v1: JSON.stringify({
          [grade5ActivityId]: conceptCompletion(grade5ActivityId),
        }),
        mathAssist_grade6Progress: JSON.stringify({
          [grade6ActivityId]: conceptCompletion(grade6ActivityId),
        }),
      })

      const projections = createLocalProgressRepository(storage).readAllProgress(1_000)
      const activities = [
        [1, grade1ActivityId],
        [2, grade2ActivityId],
        [3, grade3ActivityId],
        [4, grade4ActivityId],
        [5, grade5ActivityId],
        [6, grade6ActivityId],
      ] as const

      for (const [grade, activityId] of activities) {
        expect(projections[grade].completionByActivityId[activityId], `${grade}:${activityId}`)
          .toEqual({
            hasCompletedBasicSet: mode === 'basic',
            hasCompletedPracticeSet: mode === 'practice',
            isComplete: mode === 'practice',
            recommendedMode: mode === 'basic' ? 'practice' : 'basic',
          })
      }
    },
  )

  it('projects 1/2/3/4/5/6 completion, review, and resume without rewriting storage', () => {
    const storage = memoryStorage(legacyFixtures())
    const before = { ...storage.data }
    const repository = createLocalProgressRepository(storage)

    expect(repository.readProgress(1, 1_000)).toMatchObject({
      grade: 1,
      completed: ['g1-done'],
      review: ['g1-review'],
      resume: { activityId: 'g1-review', mode: 'review' },
      lastActivityAt: 100,
      corrupted: false,
    })
    expect(repository.readProgress(2, 1_000)).toMatchObject({
      grade: 2,
      completed: ['g2-done'],
      review: ['g2-review'],
      resume: { activityId: 'g2-done', contextId: 'g2-unit', mode: 'mission' },
      lastActivityAt: 200,
    })
    expect(repository.readProgress(3, 1_000)).toMatchObject({
      grade: 3,
      completed: ['g3-done'],
      review: ['g3-review'],
      resume: { activityId: 'g3-review', contextId: 'g3-unit', mode: 'review' },
      lastActivityAt: 300,
    })
    expect(repository.readProgress(4, 1_000)).toMatchObject({
      grade: 4,
      completed: ['g4-big-02:seed-20260721:variant-8'],
      review: ['g4-big-02:seed-20260721:variant-8'],
      resume: {
        activityId: 'g4-big-02',
        contextId: 'unit-4-1-large-numbers',
        mode: 'review',
        currentIndex: 1,
      },
      lastActivityAt: 350,
      corrupted: false,
      sourceKey: 'mathAssist_grade4Progress',
      schemaVersion: 1,
    })
    expect(repository.readProgress(5, 1_000)).toMatchObject({
      grade: 5,
      completed: ['divisor-001', 'multiple-001'],
      review: ['divisor-001'],
      resume: { activityId: 'fraction-001', mode: 'review', currentIndex: 1 },
      lastActivityAt: 500,
    })
    expect(repository.readProgress(6, 1_000)).toMatchObject({
      grade: 6,
      completed: ['g6ratio-001'],
      review: ['g6ratio-001'],
      resume: { activityId: 'g6ratio-001', mode: 'practice', currentIndex: 0 },
      lastActivityAt: 600,
      corrupted: false,
      sessionCorrupted: false,
    })

    expect(storage.data).toEqual(before)
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(storage.removeItem).not.toHaveBeenCalled()
  })

  it('adapts an isolated Grade 6 practice session without changing Grade 5 bytes', () => {
    const storage = memoryStorage(legacyFixtures())
    const beforeGrade5 = storage.data.mathAssist_currentSession
    const session = createLocalProgressRepository(storage).readSession(6, 1_000)

    expect(session).toMatchObject({
      sessionId: 'grade6_session_600_active',
      grade: 6,
      activityId: 'g6ratio-001',
      currentIndex: 0,
      status: 'active',
      source: 'native',
    })
    expect(session?.items).toEqual([{ itemId: 'tmpl-g6ratio-C-01', sourceIndex: 0 }])
    expect(storage.data.mathAssist_currentSession).toBe(beforeGrade5)
  })

  it('adapts an old Grade 5 session without checkedAnswers into the common session contract', () => {
    const storage = memoryStorage(legacyFixtures())
    const session = createLocalProgressRepository(storage).readSession(5, 1_000)

    expect(session).toMatchObject({
      sessionId: 'legacy-session',
      learnerId: null,
      grade: 5,
      activityId: 'fraction-001',
      mode: 'review',
      currentIndex: 1,
      status: 'active',
      startedAt: 500,
      updatedAt: 500,
      expiresAt: 2_000,
      source: 'legacy-grade5-session',
    })
    expect(session?.items.map((item) => item.itemId)).toEqual([
      'fraction-item-1',
      'fraction-item-2',
    ])
    expect(session?.responses).toEqual([
      { itemId: 'fraction-item-1', answer: '1/2', checked: null },
      { itemId: 'fraction-item-2', answer: null, checked: null },
    ])
    expect(createLocalProgressRepository(storage).readSession(5, 2_000)?.status).toBe('active')
    expect(createLocalProgressRepository(storage).readAttemptReceipts(5)).toEqual([])
  })

  it('normalizes partial and mismatched Grade 5 response arrays without inventing answers', () => {
    const fixtures = legacyFixtures()
    const session = JSON.parse(fixtures.mathAssist_currentSession)
    session.answers = ['7']
    session.checkedAnswers = [true, false, true]
    fixtures.mathAssist_currentSession = JSON.stringify(session)

    const adapted = createLocalProgressRepository(memoryStorage(fixtures)).readSession(5, 1_000)

    expect(adapted?.responses).toEqual([
      { itemId: 'fraction-item-1', answer: '7', checked: true },
      { itemId: 'fraction-item-2', answer: null, checked: false },
    ])
  })

  it('isolates corrupt storage to one grade and leaves every raw key untouched', () => {
    const fixtures = legacyFixtures()
    fixtures.mathAssist_grade2Progress = '{bad json'
    const storage = memoryStorage(fixtures)
    const before = { ...storage.data }
    const repository = createLocalProgressRepository(storage)

    const all = repository.readAllProgress(1_000)

    expect(all[1].completed).toEqual(['g1-done'])
    expect(all[2]).toMatchObject({
      completed: [],
      review: [],
      resume: null,
      corrupted: true,
    })
    expect(all[3].completed).toEqual(['g3-done'])
    expect(all[4].completed).toEqual(['g4-big-02:seed-20260721:variant-8'])
    expect(all[5].completed).toEqual(['divisor-001', 'multiple-001'])
    expect(all[6].completed).toEqual(['g6ratio-001'])
    expect(storage.data).toEqual(before)
    expect(storage.removeItem).not.toHaveBeenCalled()
  })

  it('isolates corrupt Grade 6 progress and session without rewriting another grade', () => {
    const fixtures = legacyFixtures()
    fixtures.mathAssist_grade6Progress = '{bad progress'
    fixtures.mathAssist_grade6CurrentSession = '{bad session'
    const storage = memoryStorage(fixtures)
    const before = { ...storage.data }
    const repository = createLocalProgressRepository(storage)

    expect(repository.readProgress(6, 1_000)).toMatchObject({
      completed: [],
      review: [],
      resume: null,
      corrupted: true,
      sessionCorrupted: true,
    })
    expect(repository.readSession(6, 1_000)).toBeNull()
    expect(repository.readProgress(5, 1_000).completed).toEqual(['divisor-001', 'multiple-001'])
    expect(storage.data).toEqual(before)
  })

  it('isolates corrupt Grade 4 progress without rewriting other grade records', () => {
    const fixtures = legacyFixtures()
    fixtures.mathAssist_grade4Progress = '{bad json'
    const storage = memoryStorage(fixtures)
    const before = { ...storage.data }
    const all = createLocalProgressRepository(storage).readAllProgress(1_000)

    expect(all[4]).toMatchObject({ completed: [], review: [], resume: null, corrupted: true })
    expect(all[1].completed).toEqual(['g1-done'])
    expect(all[2].completed).toEqual(['g2-done'])
    expect(all[3].completed).toEqual(['g3-done'])
    expect(all[5].completed).toEqual(['divisor-001', 'multiple-001'])
    expect(storage.data).toEqual(before)
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(storage.removeItem).not.toHaveBeenCalled()
  })

  it('does not offer an expired Grade 5 session as resumable progress', () => {
    const fixtures = legacyFixtures()
    fixtures.mathAssist_currentSession = JSON.stringify({
      sessionId: 'expired',
      conceptId: 'fraction-001',
      setId: 'A',
      mode: 'standard',
      problems: [{ index: 0, templateId: 'expired-item', type: 'number', prompt: '문제' }],
      answers: [null],
      checkedAnswers: [null],
      currentIndex: 0,
      startedAt: 100,
      expiresAt: 900,
    })
    const expiredRepository = createLocalProgressRepository(memoryStorage(fixtures))

    expect(expiredRepository.readSession(5, 1_000)?.status).toBe('expired')
    expect(expiredRepository.readProgress(5, 1_000).resume).toMatchObject({
      activityId: 'divisor-001',
      mode: 'review',
    })
  })

  it.each([
    {
      label: 'empty item list',
      changes: { problems: [], answers: [], checkedAnswers: [], currentIndex: 0 },
    },
    {
      label: 'out-of-range current index',
      changes: { currentIndex: 2 },
    },
  ])('marks a structurally invalid Grade 5 session as corrupt: $label', ({ changes }) => {
    const fixtures = legacyFixtures()
    const session = JSON.parse(fixtures.mathAssist_currentSession)
    fixtures.mathAssist_currentSession = JSON.stringify({ ...session, ...changes })
    const repository = createLocalProgressRepository(memoryStorage(fixtures))

    expect(repository.readSession(5, 1_000)).toBeNull()
    expect(repository.readProgress(5, 1_000)).toMatchObject({
      sessionCorrupted: true,
      resume: { activityId: 'divisor-001', mode: 'review' },
    })
  })

  it('marks malformed Grade 5 session JSON as corrupt without touching progress', () => {
    const fixtures = legacyFixtures()
    fixtures.mathAssist_currentSession = '{bad json'
    const malformedRepository = createLocalProgressRepository(memoryStorage(fixtures))
    expect(malformedRepository.readSession(5, 1_000)).toBeNull()
    expect(malformedRepository.readProgress(5, 1_000).sessionCorrupted).toBe(true)
  })
})
