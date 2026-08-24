import { describe, expect, it, vi } from 'vitest'

import { getGrade2MissionSet, getSafeGrade2Mission } from './grade2-problems'
import { LOCAL_PROFILE_REGISTRY_KEY, createInitialLocalProfileRegistry } from './local-profile'
import {
  GRADE2_PROGRESS_KEY,
  GRADE2_PROGRESS_SCHEMA_VERSION,
  createInitialGrade2Progress,
  dismissGrade2Intro,
  isGrade2UnitComplete,
  loadGrade2Progress,
  recordGrade2Attempt,
  resetGrade2Progress,
  saveGrade2Progress,
  selectGrade2Unit,
  type StorageLike,
} from './grade2-progress'

const BOOTSTRAP_PROFILE_A = 'local_00000000-0000-4000-8000-000000000001'

function bootstrapBaseStorage(): { data: Map<string, string> } {
  const data = new Map<string, string>()
  const base = {
    get length() { return data.size },
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
    removeItem: (key: string) => { data.delete(key) },
    data,
  }
  data.set(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(createInitialLocalProfileRegistry({
    now: () => 1,
    randomUUID: () => '00000000-0000-4000-8000-000000000001',
    migrationStatus: 'not-needed',
  })))
  vi.stubGlobal('window', { localStorage: base })
  return base
}

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  return {
    data: { ...initial },
    getItem(key: string) {
      return this.data[key] ?? null
    },
    setItem(key: string, value: string) {
      this.data[key] = value
    },
    removeItem(key: string) {
      delete this.data[key]
    },
  }
}

describe('grade2 progress', () => {
  it('loads initial progress in a separate grade2 storage namespace', () => {
    const storage = createMemoryStorage()
    const result = loadGrade2Progress(storage, 100)

    expect(result.progress.completedMissionIds).toEqual([])
    expect(result.progress.selectedUnitId).toBeNull()
    expect(storage.getItem('mathAssist_grade1Progress')).toBeNull()
  })

  it('saves and reloads grade2 progress', () => {
    const storage = createMemoryStorage()
    const mission = getSafeGrade2Mission(42)
    const progress = recordGrade2Attempt(createInitialGrade2Progress(100), mission, true, {
      now: 200,
    })

    expect(saveGrade2Progress(progress, storage)).toBe(true)
    const loaded = loadGrade2Progress(storage, 300)

    expect(loaded.progress.completedMissionIds).toContain(mission.id)
    expect(loaded.progress.todaySolvedCount).toBe(1)
    expect(loaded.progress.selectedUnitId).toBe(mission.unitId)
    expect(loaded.progress.xp).toBe(15)
  })

  it('marks wrong answers for review and avoids duplicate solved counts', () => {
    const mission = getSafeGrade2Mission(42)
    const wrong = recordGrade2Attempt(createInitialGrade2Progress(100), mission, false, {
      now: 200,
    })
    const correct = recordGrade2Attempt(wrong, mission, true, {
      hadHint: true,
      now: 300,
    })
    const duplicate = recordGrade2Attempt(correct, mission, true, {
      countSolved: false,
      now: 400,
    })

    expect(correct.reviewMissionIds).toContain(mission.id)
    expect(duplicate.todaySolvedCount).toBe(1)
    expect(duplicate.completedMissionIds).toEqual([mission.id])
  })

  it('does not complete a unit from basic work and completes it after the full practice set is checked', () => {
    const unitId = 'g2-1-place-value'
    const basic = getGrade2MissionSet(unitId, 'basic', 42)
    const practice = getGrade2MissionSet(unitId, 'practice', 42)
    const afterBasic = basic.reduce(
      (progress, mission) => recordGrade2Attempt(progress, mission, true, { now: 200 }),
      createInitialGrade2Progress(100),
    )
    const afterPractice = practice.reduce(
      (progress, mission) => recordGrade2Attempt(progress, mission, false, { now: 300 }),
      afterBasic,
    )

    expect(isGrade2UnitComplete(afterBasic, unitId)).toBe(false)
    expect(isGrade2UnitComplete(afterPractice, unitId)).toBe(true)
    expect(afterBasic.completedUnitIds).toEqual([])
    expect(afterPractice.completedUnitIds).toEqual([unitId])
    expect(afterPractice.checkedMissionIds).toEqual([
      ...basic.map((mission) => mission.id),
      ...practice.map((mission) => mission.id),
    ])
    expect(afterPractice.reviewMissionIds).toEqual(practice.map((mission) => mission.id))
  })

  it('tracks selected unit and intro dismissal', () => {
    const progress = createInitialGrade2Progress(100)
    const selected = selectGrade2Unit(progress, 'g2-2-time', 200)
    const dismissed = dismissGrade2Intro(selected, 300)

    expect(selected.selectedUnitId).toBe('g2-2-time')
    expect(dismissed.introDismissedAt).toBe(300)
  })

  it('recovers corrupt progress without touching grade1 storage', () => {
    const storage = createMemoryStorage({
      [GRADE2_PROGRESS_KEY]: '{bad json',
      mathAssist_grade1Progress: '{"keep":true}',
    })
    const result = loadGrade2Progress(storage, 100)

    expect(result.recovered).toBe(true)
    expect(result.progress.completedMissionIds).toEqual([])
    expect(storage.getItem(GRADE2_PROGRESS_KEY)).toBe('{bad json')
    expect(saveGrade2Progress(result.progress, storage)).toBe(false)
    expect(storage.getItem('mathAssist_grade1Progress')).toBe('{"keep":true}')
  })

  it('resets grade2 progress only', () => {
    const storage = createMemoryStorage({ mathAssist_grade1Progress: '{"keep":true}' })
    const progress = resetGrade2Progress(storage, 100)

    expect(progress.todaySolvedCount).toBe(0)
    expect(storage.getItem(GRADE2_PROGRESS_KEY)).toContain(
      `"schemaVersion":${GRADE2_PROGRESS_SCHEMA_VERSION}`,
    )
    expect(storage.getItem('mathAssist_grade1Progress')).toBe('{"keep":true}')
  })

  it('migrates v1 completion into mastery and preserves the selected unit', () => {
    const storage = createMemoryStorage({
      [GRADE2_PROGRESS_KEY]: JSON.stringify({
        schemaVersion: 1,
        completedMissionIds: ['g2-1-place-value-01'],
        reviewMissionIds: [],
        latestMissionId: 'g2-1-place-value-01',
        selectedUnitId: 'g2-1-place-value',
        todaySolvedCount: 1,
        skillSummaryByTag: {},
        introDismissedAt: 50,
        lastPlayedAt: 100,
      }),
    })

    const loaded = loadGrade2Progress(storage, 100)

    expect(loaded.recovered).toBe(false)
    expect(loaded.progress.schemaVersion).toBe(GRADE2_PROGRESS_SCHEMA_VERSION)
    expect(loaded.progress.selectedUnitId).toBe('g2-1-place-value')
    expect(loaded.progress.xp).toBe(10)
    expect(loaded.progress.masteryByMissionId['g2-1-place-value-01'].correct).toBe(1)
    expect(loaded.progress.missionSketchRunOrdinal).toBe(0)
    expect(loaded.progress.checkedMissionIds).toEqual(['g2-1-place-value-01'])
  })

  it('preserves basic and existing v1 practice records while using practice checks for completion', () => {
    const unitId = 'g2-1-place-value'
    const practiceIds = getGrade2MissionSet(unitId, 'practice', 42).map((mission) => mission.id)
    const storage = createMemoryStorage({
      [GRADE2_PROGRESS_KEY]: JSON.stringify({
        ...createInitialGrade2Progress(100),
        schemaVersion: 2,
        completedMissionIds: ['g2-1-place-value-01'],
        checkedMissionIds: ['g2-1-place-value-01', ...practiceIds],
        reviewMissionIds: [practiceIds[1]],
        latestMissionId: practiceIds[5],
        selectedUnitId: unitId,
      }),
    })

    const loaded = loadGrade2Progress(storage, 200)

    expect(loaded.progress.completedMissionIds).toEqual(['g2-1-place-value-01'])
    expect(loaded.progress.checkedMissionIds).toEqual(['g2-1-place-value-01', ...practiceIds])
    expect(loaded.progress.reviewMissionIds).toEqual([practiceIds[1]])
    expect(loaded.progress.latestMissionId).toBe(practiceIds[5])
    expect(isGrade2UnitComplete(loaded.progress, unitId)).toBe(true)
    expect(loaded.progress.completedUnitIds).toContain(unitId)
  })

  it('preserves a fully checked legacy basic unit as completed during migration', () => {
    const unitId = 'g2-1-place-value'
    const basicIds = getGrade2MissionSet(unitId, 'basic', 42).map((mission) => mission.id)
    const storage = createMemoryStorage({
      [GRADE2_PROGRESS_KEY]: JSON.stringify({
        ...createInitialGrade2Progress(100),
        schemaVersion: 2,
        completedMissionIds: basicIds,
        checkedMissionIds: basicIds,
        completedUnitIds: undefined,
      }),
    })

    const loaded = loadGrade2Progress(storage, 200)

    expect(loaded.progress.completedUnitIds).toContain(unitId)
    expect(isGrade2UnitComplete(loaded.progress, unitId)).toBe(true)
  })
})

describe('grade2 progress learner bootstrap routing', () => {
  it('routes the default storage source through the learner bootstrap adapter', () => {
    const base = bootstrapBaseStorage()

    const mission = getSafeGrade2Mission(42)
    const next = recordGrade2Attempt(createInitialGrade2Progress(100), mission, true, { now: 200 })
    expect(saveGrade2Progress(next)).toBe(true)

    const scopedKey = `mathAssist_profile_v1:${BOOTSTRAP_PROFILE_A}:${GRADE2_PROGRESS_KEY}`
    expect(base.data.get(scopedKey)).toContain(mission.id)
    expect(base.data.has(GRADE2_PROGRESS_KEY)).toBe(false)

    const loaded = loadGrade2Progress(undefined, 300)
    expect(loaded.storageAvailable).toBe(true)
    expect(loaded.progress.completedMissionIds).toContain(mission.id)
    vi.unstubAllGlobals()
  })

  it('keeps damaged-source tracking tied to the memoized learner adapter identity', () => {
    const base = bootstrapBaseStorage()
    base.data.set(
      `mathAssist_profile_v1:${BOOTSTRAP_PROFILE_A}:${GRADE2_PROGRESS_KEY}`,
      JSON.stringify({
        schemaVersion: GRADE2_PROGRESS_SCHEMA_VERSION,
        completedMissionIds: [],
        checkedMissionIds: [],
        completedUnitIds: [],
        reviewMissionIds: [],
        latestMissionId: null,
        selectedUnitId: null,
        todaySolvedCount: 0,
        skillSummaryByTag: {},
        introDismissedAt: null,
        lastPlayedAt: 100,
        applicationMissionSnapshotsByInstanceId: { 'broken-instance': 'not-an-object' },
        activeApplicationInstanceIdByMissionId: {},
      }),
    )

    const loaded = loadGrade2Progress()
    expect(loaded.recovered).toBe(true)
    expect(saveGrade2Progress(createInitialGrade2Progress(100))).toBe(false)

    resetGrade2Progress(undefined, 400)
    expect(loadGrade2Progress().recovered).toBe(false)
    vi.unstubAllGlobals()
  })
})
