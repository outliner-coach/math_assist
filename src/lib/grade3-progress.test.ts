import { describe, expect, it } from 'vitest'

import { getGrade3MissionSession, getSafeGrade3Mission } from './grade3-problems'
import {
  GRADE3_PROGRESS_KEY,
  createInitialGrade3Progress,
  dismissGrade3Intro,
  getGrade3PracticeMissionIds,
  isGrade3UnitComplete,
  loadGrade3Progress,
  recordGrade3Attempt,
  recordGrade3PracticeSession,
  resetGrade3Progress,
  saveGrade3Progress,
  selectGrade3Unit,
  type StorageLike,
} from './grade3-progress'

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

describe('grade3 progress', () => {
  it('loads initial progress in a separate grade3 storage namespace', () => {
    const storage = createMemoryStorage()
    const result = loadGrade3Progress(storage, 100)

    expect(result.progress.completedMissionIds).toEqual([])
    expect(result.progress.selectedUnitId).toBeNull()
    expect(storage.getItem('mathAssist_grade2Progress')).toBeNull()
  })

  it('saves and reloads grade3 progress', () => {
    const storage = createMemoryStorage()
    const mission = getSafeGrade3Mission(42)
    const progress = recordGrade3Attempt(createInitialGrade3Progress(100), mission, true, { now: 200 })

    expect(saveGrade3Progress(progress, storage)).toBe(true)
    const loaded = loadGrade3Progress(storage, 300)

    expect(loaded.progress.completedMissionIds).toContain(mission.id)
    expect(loaded.progress.todaySolvedCount).toBe(1)
    expect(loaded.progress.selectedUnitId).toBe(mission.unitId)
  })

  it('tracks wrong answers for review but input errors can be skipped by callers', () => {
    const mission = getSafeGrade3Mission(42)
    const wrong = recordGrade3Attempt(createInitialGrade3Progress(100), mission, false, { now: 200 })
    const correct = recordGrade3Attempt(wrong, mission, true, { hadHint: true, now: 300 })

    expect(wrong.reviewMissionIds).toContain(mission.id)
    expect(wrong.todaySolvedCount).toBe(0)
    expect(correct.reviewMissionIds).toContain(mission.id)
    expect(correct.todaySolvedCount).toBe(1)
  })

  it('tracks selected unit and intro dismissal', () => {
    const progress = createInitialGrade3Progress(100)
    const selected = selectGrade3Unit(progress, 'g3-2-graph', 200)
    const dismissed = dismissGrade3Intro(selected, 300)

    expect(selected.selectedUnitId).toBe('g3-2-graph')
    expect(dismissed.introDismissedAt).toBe(300)
  })

  it('loads legacy progress without a sketch run ordinal without losing activity', () => {
    const storage = createMemoryStorage({
      [GRADE3_PROGRESS_KEY]: JSON.stringify({
        schemaVersion: 1,
        completedMissionIds: ['g3-1-add-sub-01'],
        reviewMissionIds: ['g3-1-add-sub-02'],
        latestMissionId: 'g3-1-add-sub-01',
        selectedUnitId: 'g3-1-add-sub',
        todaySolvedCount: 1,
        skillSummaryByTag: {},
        introDismissedAt: 50,
        lastPlayedAt: 100,
      }),
    })

    const loaded = loadGrade3Progress(storage, 100)

    expect(loaded.recovered).toBe(false)
    expect(loaded.progress.completedMissionIds).toEqual(['g3-1-add-sub-01'])
    expect(loaded.progress.checkedMissionIds).toEqual([
      'g3-1-add-sub-01',
      'g3-1-add-sub-02',
    ])
    expect(loaded.progress.missionSketchRunOrdinal).toBe(0)
  })

  it('does not complete a unit from basic mode and completes it after all practice items', () => {
    const unitId = 'g3-1-add-sub'
    const basic = getGrade3MissionSession(unitId, 'basic', 20260516)
    const practice = getGrade3MissionSession(unitId, 'practice', 20260516)
    const initial = createInitialGrade3Progress(100)
    const afterBasic = basic.reduce(
      (progress, mission, index) => recordGrade3Attempt(progress, mission, true, { now: 200 + index }),
      initial,
    )
    const afterPractice = practice.reduce(
      (progress, mission, index) => recordGrade3Attempt(progress, mission, true, { now: 300 + index }),
      afterBasic,
    )

    expect(isGrade3UnitComplete(afterBasic, unitId, 20260516)).toBe(false)
    expect(isGrade3UnitComplete(afterPractice, unitId, 20260516)).toBe(true)
    expect(afterBasic.completedUnitIds).toEqual([])
    expect(afterPractice.completedUnitIds).toEqual([unitId])
    expect(afterPractice.completedMissionIds).toEqual(expect.arrayContaining([
      ...basic.map((mission) => mission.id),
      ...practice.map((mission) => mission.id),
    ]))
  })

  it('completes a unit after every practice item is checked even when answers stay in review', () => {
    const unitId = 'g3-1-add-sub'
    const practice = getGrade3MissionSession(unitId, 'practice', 20260516)
    const checkedWithErrors = practice.reduce(
      (progress, mission, index) => recordGrade3Attempt(progress, mission, false, { now: 200 + index }),
      createInitialGrade3Progress(100),
    )

    expect(checkedWithErrors.completedMissionIds).toEqual([])
    expect(checkedWithErrors.checkedMissionIds).toEqual(practice.map((mission) => mission.id))
    expect(checkedWithErrors.reviewMissionIds).toEqual(practice.map((mission) => mission.id))
    expect(isGrade3UnitComplete(checkedWithErrors, unitId, 20260516)).toBe(true)
    expect(checkedWithErrors.completedUnitIds).toEqual([unitId])
  })

  it('completes the resolved practice session when a legacy mission replaces a canonical slot', () => {
    const unitId = 'g3-2-capacity-weight'
    const canonical = getGrade3MissionSession(unitId, 'practice', 20260516)
    const resolved = getGrade3MissionSession(
      unitId,
      'practice',
      20260516,
      'g3-2-capacity-weight-05',
    )
    const sessionProgress = recordGrade3PracticeSession(
      createInitialGrade3Progress(100),
      unitId,
      resolved,
    )
    const checkedWithErrors = resolved.reduce(
      (progress, mission, index) => recordGrade3Attempt(progress, mission, false, { now: 200 + index }),
      sessionProgress,
    )

    expect(canonical.map((mission) => mission.id)).toEqual([
      'g3-2-capacity-weight-02',
      'g3-2-capacity-weight-04',
      'g3-2-capacity-weight-07',
    ])
    expect(resolved.map((mission) => mission.id)).toEqual([
      'g3-2-capacity-weight-02',
      'g3-2-capacity-weight-05',
      'g3-2-capacity-weight-07',
    ])
    expect(getGrade3PracticeMissionIds(checkedWithErrors, unitId, 20260516)).toEqual(
      resolved.map((mission) => mission.id),
    )
    expect(checkedWithErrors.completedMissionIds).toEqual([])
    expect(checkedWithErrors.reviewMissionIds).toEqual(resolved.map((mission) => mission.id))
    expect(isGrade3UnitComplete(checkedWithErrors, unitId, 20260516)).toBe(true)
  })

  it('recovers corrupt progress without touching other grade storage', () => {
    const storage = createMemoryStorage({
      [GRADE3_PROGRESS_KEY]: '{bad json',
      mathAssist_grade1Progress: '{"keep":1}',
      mathAssist_grade2Progress: '{"keep":2}',
    })
    const result = loadGrade3Progress(storage, 100)

    expect(result.recovered).toBe(true)
    expect(result.progress.completedMissionIds).toEqual([])
    expect(storage.getItem(GRADE3_PROGRESS_KEY)).toBe('{bad json')
    expect(saveGrade3Progress(result.progress, storage)).toBe(false)
    expect(storage.getItem('mathAssist_grade1Progress')).toBe('{"keep":1}')
    expect(storage.getItem('mathAssist_grade2Progress')).toBe('{"keep":2}')
  })

  it('resets grade3 progress only', () => {
    const storage = createMemoryStorage({ mathAssist_grade2Progress: '{"keep":true}' })
    const progress = resetGrade3Progress(storage, 100)

    expect(progress.todaySolvedCount).toBe(0)
    expect(storage.getItem(GRADE3_PROGRESS_KEY)).toContain('"schemaVersion":2')
    expect(storage.getItem('mathAssist_grade2Progress')).toBe('{"keep":true}')
  })

  it('preserves a fully checked legacy basic unit as completed during migration', () => {
    const unitId = 'g3-1-add-sub'
    const basicIds = getGrade3MissionSession(unitId, 'basic', 20260516).map((mission) => mission.id)
    const storage = createMemoryStorage({
      [GRADE3_PROGRESS_KEY]: JSON.stringify({
        ...createInitialGrade3Progress(100),
        schemaVersion: 1,
        completedMissionIds: basicIds,
        checkedMissionIds: basicIds,
        completedUnitIds: undefined,
      }),
    })

    const loaded = loadGrade3Progress(storage, 200)

    expect(loaded.progress.schemaVersion).toBe(2)
    expect(loaded.progress.completedUnitIds).toContain(unitId)
    expect(isGrade3UnitComplete(loaded.progress, unitId)).toBe(true)
  })
})
