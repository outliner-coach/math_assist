import { describe, expect, it } from 'vitest'

import { BACKED_UP_LOCAL_PROGRESS_KEYS } from './local-progress-backup'
import { LOCAL_PROFILE_REGISTRY_KEY, parseLocalProfileRegistry } from './local-profile'
import { migrateLegacyLearnerStorage } from './profile-migration'
import { createProfileScopedStorageKey } from './profile-scoped-storage'
import { createSketchDocument, serializeSketchDocument } from './sketch-document'
import { createSketchStorageKey } from './sketch-repository'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    get length() { return data.size },
    key(index: number) { return Array.from(data.keys())[index] ?? null },
    getItem(key: string) { return data.get(key) ?? null },
    setItem(key: string, value: string) { data.set(key, value) },
    removeItem(key: string) { data.delete(key) },
    data,
  }
}

const UUID = '00000000-0000-4000-8000-000000000001'
const PROFILE_ID = `local_${UUID}`
const deps = { now: () => 123, randomUUID: () => UUID }

function grade1ProgressRaw(): string {
  return JSON.stringify({
    schemaVersion: 1,
    completedStageIds: ['count-cove-01'],
    reviewStageIds: [],
    latestStageId: 'count-cove-01',
    todaySolvedCount: 1,
    skillSummaryByTag: {},
    lastPlayedAt: 100,
  })
}

function grade2ProgressRaw(): string {
  return JSON.stringify({
    schemaVersion: 1,
    completedMissionIds: ['g2-1-place-value-01'],
    reviewMissionIds: [],
    latestMissionId: 'g2-1-place-value-01',
    selectedUnitId: 'g2-1-place-value',
    todaySolvedCount: 1,
    skillSummaryByTag: {},
    introDismissedAt: 50,
    lastPlayedAt: 100,
  })
}

function grade3ProgressRaw(): string {
  return JSON.stringify({
    schemaVersion: 1,
    completedMissionIds: ['g3-1-add-sub-01'],
    reviewMissionIds: ['g3-1-add-sub-02'],
    latestMissionId: 'g3-1-add-sub-01',
    selectedUnitId: 'g3-1-add-sub',
    todaySolvedCount: 1,
    skillSummaryByTag: {},
    introDismissedAt: 50,
    lastPlayedAt: 100,
  })
}

function grade4ProgressRaw(): string {
  return JSON.stringify({
    schemaVersion: 1,
    completedVariantKeys: ['g4-big-02:seed-1'],
    reviewVariantKeys: ['g4-big-07:seed-1'],
    latestMissionId: 'g4-big-07',
    selectedUnitId: 'unit-4-1-large-numbers',
    activityRun: 3,
    activeItemIndex: 1,
    todaySolvedCount: 8,
    skillSummaryByTag: { '큰 수 비교': { attempted: 4, correct: 3 } },
    lastPlayedAt: 100,
  })
}

function practiceProblem(index = 0) {
  return {
    index,
    templateId: `template-${index}`,
    setId: 'A',
    params: { value: index + 1 },
    prompt: '1을 써 보세요.',
    type: 'number',
    correctAnswer: '1',
    solutionSteps: ['1을 확인합니다.'],
  }
}

function practiceSessionRaw(grade: 5 | 6): string {
  return JSON.stringify({
    sessionId: `grade-${grade}-session`,
    conceptId: `grade-${grade}-concept`,
    setId: 'A',
    mode: 'standard',
    ...(grade === 6 ? { grade: 6, itemCount: 5 } : {}),
    problems: [practiceProblem()],
    answers: [null],
    checkedAnswers: [null],
    currentIndex: 0,
    startedAt: 100,
    expiresAt: 1000,
  })
}

function practiceResultRaw(grade: 5 | 6): string {
  const problem = practiceProblem()
  return JSON.stringify({
    sessionId: `grade-${grade}-session`,
    conceptId: `grade-${grade}-concept`,
    setId: 'A',
    mode: 'standard',
    ...(grade === 6 ? { grade: 6, itemCount: 5 } : {}),
    score: 1,
    total: 1,
    wrongCount: 0,
    results: [{
      index: 0,
      correct: true,
      userAnswer: '1',
      correctAnswer: '1',
      solutionSteps: ['1을 확인합니다.'],
      problem,
    }],
    completedAt: 100,
  })
}

function representativeLegacyValues(): Record<string, string> {
  const sketch = createSketchDocument({ learnerId: null, sessionId: 'session-1', itemId: 'item-1' }, 100)
  const sketchKey = createSketchStorageKey(sketch)
  const sketchIndexKey = `mathAssist_sketch_index_v1:${encodeURIComponent(JSON.stringify([null]))}`
  const backupValues = Object.fromEntries(BACKED_UP_LOCAL_PROGRESS_KEYS.map((key) => [key, null]))

  return {
    mathAssist_grade1Progress: grade1ProgressRaw(),
    mathAssist_grade2Progress: grade2ProgressRaw(),
    mathAssist_grade3Progress: grade3ProgressRaw(),
    mathAssist_grade4Progress: grade4ProgressRaw(),
    mathAssist_progress_v1: '{}',
    mathAssist_currentSession: practiceSessionRaw(5),
    mathAssist_lastResult: practiceResultRaw(5),
    mathAssist_grade6Progress: '{}',
    mathAssist_grade6CurrentSession: practiceSessionRaw(6),
    mathAssist_grade6LastResult: practiceResultRaw(6),
    mathAssist_guestHome_v1: '{"activeGrade":6}',
    mathAssist_attemptReceipts_v1: '{"schemaVersion":1,"receipts":[]}',
    mathAssist_mascot_v1: '{"avatarId":"lumi"}',
    mathAssist_profileSessionLease_v1: JSON.stringify({
      schemaVersion: 1,
      profileId: PROFILE_ID,
      holderId: 'tab-1',
      acquiredAt: 100,
      expiresAt: 200,
    }),
    [sketchKey]: serializeSketchDocument(sketch),
    [sketchIndexKey]: JSON.stringify([{
      learnerId: null,
      sessionId: sketch.sessionId,
      itemId: sketch.itemId,
      storageKey: sketchKey,
      updatedAt: sketch.updatedAt,
    }]),
    'mathAssist_progressBackup_v1:100': JSON.stringify({
      schemaVersion: 1,
      createdAt: 100,
      values: backupValues,
    }),
  }
}

describe('legacy learner storage migration', () => {
  it('creates one blank profile when no learner data exists', () => {
    const storage = memoryStorage({ mathAssist_releaseMetadata_v1: '{"version":1}' })
    const result = migrateLegacyLearnerStorage(storage, deps)

    expect(result.status).toBe('not-needed')
    expect(result.registry.profiles).toHaveLength(1)
    expect(result.registry.migration).toEqual({
      schemaVersion: 1,
      status: 'not-needed',
      targetProfileId: null,
      backupKey: null,
    })
  })

  it('copies every declared learner byte into one profile and verifies a recovery backup', () => {
    const legacy = representativeLegacyValues()
    const storage = memoryStorage(legacy)
    const registryStatuses: string[] = []
    const originalSetItem = storage.setItem.bind(storage)
    storage.setItem = (key: string, value: string) => {
      if (key === LOCAL_PROFILE_REGISTRY_KEY) {
        registryStatuses.push((JSON.parse(value) as { migration: { status: string } }).migration.status)
      }
      originalSetItem(key, value)
    }
    const result = migrateLegacyLearnerStorage(storage, deps)

    expect(result.status).toBe('verified')
    expect(registryStatuses).toEqual(['pending', 'copying', 'verified'])
    expect(result.registry.profiles).toHaveLength(1)
    expect(result.registry.profiles[0].nickname).toBeNull()
    expect(result.registry.migration.targetProfileId).toBe(result.registry.activeProfileId)
    expect(result.registry.migration.backupKey).toMatch(/^mathAssist_profile_v1:local_.*:mathAssist_progressBackup_v1:profile-migration-v1:/)
    for (const [key, raw] of Object.entries(legacy)) {
      expect(storage.getItem(key)).toBe(raw)
      expect(storage.getItem(createProfileScopedStorageKey(result.registry.activeProfileId, key))).toBe(raw)
    }
    const backup = JSON.parse(storage.getItem(result.registry.migration.backupKey!)!) as {
      values: Record<string, string>
    }
    expect(backup.values).toEqual(legacy)
  })

  it('resumes the same target after an interrupted/quota write without duplicating profiles', () => {
    const storage = memoryStorage({
      mathAssist_grade1Progress: grade1ProgressRaw(),
      mathAssist_grade2Progress: grade2ProgressRaw(),
    })
    const originalSetItem = storage.setItem.bind(storage)
    let failed = false
    storage.setItem = (key: string, value: string) => {
      if (!failed && key.includes(':mathAssist_grade2Progress')) {
        failed = true
        throw new DOMException('quota', 'QuotaExceededError')
      }
      originalSetItem(key, value)
    }

    const first = migrateLegacyLearnerStorage(storage, deps)
    expect(first.status).toBe('failed')
    const target = first.registry.migration.targetProfileId
    expect(first.registry.profiles).toHaveLength(1)

    const second = migrateLegacyLearnerStorage(storage, {
      now: () => 999,
      randomUUID: () => '00000000-0000-4000-8000-000000000099',
    })
    expect(second.status).toBe('verified')
    expect(second.registry.profiles).toHaveLength(1)
    expect(second.registry.migration.targetProfileId).toBe(target)
    expect(storage.getItem(createProfileScopedStorageKey(target!, 'mathAssist_grade1Progress'))).toBe(grade1ProgressRaw())
    expect(storage.getItem(createProfileScopedStorageKey(target!, 'mathAssist_grade2Progress'))).toBe(grade2ProgressRaw())
  })

  it('isolates corrupt or unknown learner values without shrinking another grade', () => {
    const validGrade = grade1ProgressRaw()
    const corrupt = memoryStorage({
      mathAssist_grade1Progress: validGrade,
      mathAssist_grade2Progress: '{bad json',
    })
    const corruptResult = migrateLegacyLearnerStorage(corrupt, deps)
    expect(corruptResult.status).toBe('failed')
    expect(corruptResult.failedKeys).toEqual(['mathAssist_grade2Progress'])
    expect(corruptResult.copiedKeys).toBe(1)
    expect(corrupt.getItem('mathAssist_grade1Progress')).toBe(validGrade)
    expect(corrupt.getItem('mathAssist_grade2Progress')).toBe('{bad json')
    const corruptProfileId = corruptResult.registry.activeProfileId
    expect(corrupt.getItem(createProfileScopedStorageKey(corruptProfileId, 'mathAssist_grade1Progress'))).toBe(validGrade)
    expect(corrupt.getItem(createProfileScopedStorageKey(corruptProfileId, 'mathAssist_grade2Progress'))).toBeNull()

    const rerun = migrateLegacyLearnerStorage(corrupt, deps)
    expect(rerun.status).toBe('failed')
    expect(rerun.failedKeys).toEqual(['mathAssist_grade2Progress'])
    expect(rerun.copiedKeys).toBe(1)
    expect(rerun.registry.profiles).toHaveLength(1)
    expect(rerun.registry.migration.targetProfileId).toBe(corruptProfileId)
    expect(corrupt.getItem(createProfileScopedStorageKey(corruptProfileId, 'mathAssist_grade1Progress'))).toBe(validGrade)

    const unknown = memoryStorage({ mathAssist_unknownLearnerState: '{"value":1}' })
    const unknownResult = migrateLegacyLearnerStorage(unknown, deps)
    expect(unknownResult.status).toBe('failed')
    expect(unknownResult.copiedKeys).toBe(0)
    expect(unknown.getItem('mathAssist_unknownLearnerState')).toBe('{"value":1}')
  })

  it('copies a valid sibling when an unknown progress schema blocks only its own key', () => {
    const validGrade = grade2ProgressRaw()
    const storage = memoryStorage({
      mathAssist_grade1Progress: '{"schemaVersion":999}',
      mathAssist_grade2Progress: validGrade,
    })

    const result = migrateLegacyLearnerStorage(storage, deps)
    const profileId = result.registry.activeProfileId

    expect(result.status).toBe('failed')
    expect(result.failedKeys).toContain('mathAssist_grade1Progress')
    expect(result.copiedKeys).toBe(1)
    expect(storage.getItem('mathAssist_grade1Progress')).toBe('{"schemaVersion":999}')
    expect(storage.getItem('mathAssist_grade2Progress')).toBe(validGrade)
    expect(storage.getItem(createProfileScopedStorageKey(profileId, 'mathAssist_grade1Progress'))).toBeNull()
    expect(storage.getItem(createProfileScopedStorageKey(profileId, 'mathAssist_grade2Progress'))).toBe(validGrade)
  })

  it('copies a valid sibling when a wrong-type known value blocks only its own key', () => {
    const validGrade = grade1ProgressRaw()
    const storage = memoryStorage({
      mathAssist_grade1Progress: validGrade,
      mathAssist_guestHome_v1: '{"activeGrade":"2"}',
    })

    const result = migrateLegacyLearnerStorage(storage, deps)
    const profileId = result.registry.activeProfileId

    expect(result.status).toBe('failed')
    expect(result.failedKeys).toContain('mathAssist_guestHome_v1')
    expect(result.copiedKeys).toBe(1)
    expect(storage.getItem('mathAssist_guestHome_v1')).toBe('{"activeGrade":"2"}')
    expect(storage.getItem('mathAssist_grade1Progress')).toBe(validGrade)
    expect(storage.getItem(createProfileScopedStorageKey(profileId, 'mathAssist_guestHome_v1'))).toBeNull()
    expect(storage.getItem(createProfileScopedStorageKey(profileId, 'mathAssist_grade1Progress'))).toBe(validGrade)
  })

  it('does not overwrite a conflicting scoped value and rejects a corrupt registry', () => {
    const storage = memoryStorage({ mathAssist_grade1Progress: grade1ProgressRaw() })
    const first = migrateLegacyLearnerStorage(storage, deps)
    const scopedKey = createProfileScopedStorageKey(first.registry.activeProfileId, 'mathAssist_grade1Progress')
    storage.setItem(scopedKey, '{corrupt-or-foreign:true}')
    storage.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify({
      ...first.registry,
      migration: { ...first.registry.migration, status: 'copying' },
    }))

    const conflict = migrateLegacyLearnerStorage(storage, deps)
    expect(conflict.status).toBe('failed')
    expect(storage.getItem(scopedKey)).toBe('{corrupt-or-foreign:true}')

    storage.setItem(LOCAL_PROFILE_REGISTRY_KEY, '{bad json')
    expect(() => migrateLegacyLearnerStorage(storage, deps)).toThrow(/registry/i)
    expect(parseLocalProfileRegistry(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY))).toBeNull()
  })
})
