import { describe, expect, it } from 'vitest'

import { getGrade2Missions, getSafeGrade2Mission } from './grade2-problems'
import { GRADE2_APPLICATION_PROBLEM_REGISTRY_V1 } from './application-problems/grade2-registry'
import { buildApprovedGrade2ApplicationMissions } from './application-problems/grade2-runtime'
import { isGrade2ApplicationMissionSemanticallyValid } from './application-problems/grade2-snapshot-validator'
import {
  GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY,
  GRADE2_PROGRESS_KEY,
  activateGrade2ApplicationMissionSnapshot,
  createInitialGrade2Progress,
  dismissGrade2Intro,
  getActiveGrade2ApplicationMissionSnapshot,
  loadGrade2Progress,
  recordGrade2Attempt,
  resetGrade2Progress,
  saveGrade2Progress,
  selectGrade2Unit,
  mergeGrade2ApplicationMissionSnapshots,
  persistGrade2ApplicationMissionReplacement,
  type StorageLike,
} from './grade2-progress'

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

function buildApprovedLengthApplicationMission(seed = 42) {
  const approveRouteFamily = <T extends typeof GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger[number]>(
    family: T,
  ): T => family.familyId === 'g2-length-route-total'
    ? {
        ...family,
        releaseStatus: 'approved' as const,
        approval: {
          ownerStatus: 'approved' as const,
          ownerId: 'grade2-progress-test-owner',
          approvedAt: '2026-07-23T00:00:00.000Z',
          evidenceRefs: ['src/lib/grade2-progress.test.ts'],
          expertStatus: 'not-reviewed' as const,
        },
      }
    : family
  const registry = {
    entries: GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => ({
      ...entry,
      family: approveRouteFamily(entry.family),
    })),
    releaseLedger: GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger.map(approveRouteFamily),
  }
  return buildApprovedGrade2ApplicationMissions(seed, registry)[0]
}

describe('grade2 progress', () => {
  it('adds an approved application completion without changing legacy completion or resume data', () => {
    const applicationMission = buildApprovedLengthApplicationMission()
    const legacyMission = getSafeGrade2Mission(42)
    const initial = {
      ...createInitialGrade2Progress(100),
      completedMissionIds: [legacyMission.id],
      reviewMissionIds: [legacyMission.id],
      latestMissionId: legacyMission.id,
      selectedUnitId: legacyMission.unitId,
    }
    const completed = recordGrade2Attempt(
      activateGrade2ApplicationMissionSnapshot(initial, applicationMission),
      applicationMission,
      true,
      {
      now: 200,
      variantKey: `${applicationMission.id}:${applicationMission.applicationSource.instanceId}`,
      },
    )
    const storage = createMemoryStorage()

    expect(completed.completedMissionIds).toEqual([legacyMission.id, applicationMission.id])
    expect(completed.reviewMissionIds).toEqual([legacyMission.id])
    expect(completed.latestMissionId).toBe(applicationMission.id)
    expect(completed.selectedUnitId).toBe('g2-2-length')
    expect(applicationMission.rewardId).toBe('measureTape')
    expect(saveGrade2Progress(completed, storage)).toBe(true)
    const reloaded = loadGrade2Progress(storage, 200).progress
    expect(reloaded.completedMissionIds).toEqual([legacyMission.id, applicationMission.id])
    expect(reloaded.latestMissionId).toBe(applicationMission.id)
    expect(reloaded.selectedUnitId).toBe('g2-2-length')
    expect(reloaded.reviewMissionIds).toEqual([legacyMission.id])
    expect(reloaded.xp).toBe(15)
    expect(reloaded.solvedVariantKeys).toContain(
      `${applicationMission.id}:${applicationMission.applicationSource.instanceId}`,
    )
    expect(reloaded.masteryByMissionId[applicationMission.id]).toMatchObject({
      attempted: 1,
      correct: 1,
    })
    expect(reloaded.applicationMissionSnapshotsByInstanceId[applicationMission.applicationSource.instanceId])
      .toEqual(applicationMission)
    expect(reloaded.activeApplicationInstanceIdByMissionId[applicationMission.id])
      .toBe(applicationMission.applicationSource.instanceId)

    const currentCatalogWithoutApprovedFamily = getGrade2Missions(42)
    const restoredCatalog = mergeGrade2ApplicationMissionSnapshots(
      currentCatalogWithoutApprovedFamily,
      reloaded,
    )
    const restored = restoredCatalog.find((mission) => mission.id === reloaded.latestMissionId)
    const earnedMeasureTapeCount = restoredCatalog.filter((mission) => (
      mission.rewardId === 'measureTape' && reloaded.completedMissionIds.includes(mission.id)
    )).length

    expect(currentCatalogWithoutApprovedFamily.some((mission) => mission.id === applicationMission.id))
      .toBe(false)
    expect(restored).toEqual(applicationMission)
    expect(earnedMeasureTapeCount).toBeGreaterThan(0)

    const regeneratedSameId = buildApprovedLengthApplicationMission(999)
    const sameIdCatalog = mergeGrade2ApplicationMissionSnapshots(
      [...currentCatalogWithoutApprovedFamily, regeneratedSameId],
      reloaded,
    )
    expect(sameIdCatalog.find((mission) => mission.id === applicationMission.id))
      .toEqual(applicationMission)
    const explicitReplayCatalog = mergeGrade2ApplicationMissionSnapshots(
      [...currentCatalogWithoutApprovedFamily, regeneratedSameId],
      reloaded,
      { preferLiveMissionIds: [applicationMission.id] },
    )
    expect(explicitReplayCatalog.find((mission) => mission.id === applicationMission.id))
      .toEqual(regeneratedSameId)
  })

  it('archives every immutable application instance while moving only the active pointer', () => {
    const firstMission = buildApprovedLengthApplicationMission(42)
    const replayMission = buildApprovedLengthApplicationMission(999)
    const first = activateGrade2ApplicationMissionSnapshot(
      createInitialGrade2Progress(100),
      firstMission,
    )
    const replayed = activateGrade2ApplicationMissionSnapshot(first, replayMission)

    expect(Object.keys(replayed.applicationMissionSnapshotsByInstanceId).sort()).toEqual([
      firstMission.applicationSource.instanceId,
      replayMission.applicationSource.instanceId,
    ].sort())
    expect(replayed.applicationMissionSnapshotsByInstanceId[firstMission.applicationSource.instanceId])
      .toEqual(firstMission)
    expect(replayed.activeApplicationInstanceIdByMissionId[firstMission.id])
      .toBe(replayMission.applicationSource.instanceId)
    expect(mergeGrade2ApplicationMissionSnapshots([], replayed)).toEqual([replayMission])

    const collidingMission = { ...firstMission, learnerGoal: '같은 인스턴스를 다른 내용으로 바꿈' }
    const collision = activateGrade2ApplicationMissionSnapshot(replayed, collidingMission)
    expect(collision).toBe(replayed)
    expect(collision.applicationMissionSnapshotsByInstanceId[firstMission.applicationSource.instanceId])
      .toEqual(firstMission)
  })

  it('preserves the exact damaged progress source and blocks every automatic save', () => {
    const applicationMission = buildApprovedLengthApplicationMission()
    const progress = recordGrade2Attempt(
      activateGrade2ApplicationMissionSnapshot(
        createInitialGrade2Progress(100),
        applicationMission,
      ),
      applicationMission,
      true,
      { now: 200 },
    )
    const alteredProgress = {
      ...progress,
      applicationMissionSnapshotsByInstanceId: {
        [applicationMission.applicationSource.instanceId]: {
          ...applicationMission,
          correctAnswer: '999cm',
        },
      },
    }
    const raw = JSON.stringify(alteredProgress)
    const storage = createMemoryStorage({ [GRADE2_PROGRESS_KEY]: raw })

    const loaded = loadGrade2Progress(storage, 200)

    expect(loaded.recovered).toBe(true)
    expect(loaded.progress.completedMissionIds).toContain(applicationMission.id)
    expect(loaded.progress.applicationMissionSnapshotsByInstanceId[applicationMission.applicationSource.instanceId])
      .toMatchObject({ correctAnswer: '999cm' })
    expect(saveGrade2Progress(loaded.progress, storage)).toBe(false)
    expect(storage.getItem(GRADE2_PROGRESS_KEY)).toBe(raw)
    expect(storage.getItem(GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY)).toBeNull()
  })

  it('makes completed application progress read-only when its immutable reward shell is changed', () => {
    const applicationMission = buildApprovedLengthApplicationMission()
    const completed = recordGrade2Attempt(
      activateGrade2ApplicationMissionSnapshot(
        createInitialGrade2Progress(100),
        applicationMission,
      ),
      applicationMission,
      true,
      { now: 200 },
    )
    const instanceId = applicationMission.applicationSource.instanceId
    const raw = JSON.stringify({
      ...completed,
      applicationMissionSnapshotsByInstanceId: {
        ...completed.applicationMissionSnapshotsByInstanceId,
        [instanceId]: {
          ...applicationMission,
          rewardId: 'clockStar',
        },
      },
    })
    const storage = createMemoryStorage({ [GRADE2_PROGRESS_KEY]: raw })

    const loaded = loadGrade2Progress(storage, 200)

    expect(loaded.recovered).toBe(true)
    expect(loaded.progress.completedMissionIds).toContain(applicationMission.id)
    expect(loaded.progress.activeApplicationInstanceIdByMissionId[applicationMission.id])
      .toBe(instanceId)
    expect(isGrade2ApplicationMissionSemanticallyValid(
      loaded.progress.applicationMissionSnapshotsByInstanceId[instanceId] as typeof applicationMission,
    )).toBe(false)
    expect(getActiveGrade2ApplicationMissionSnapshot(
      loaded.progress,
      applicationMission.id,
    )).toBeUndefined()
    expect(mergeGrade2ApplicationMissionSnapshots(
      [applicationMission],
      loaded.progress,
    )).toEqual([expect.objectContaining({ rewardId: 'clockStar' })])
    expect(saveGrade2Progress(loaded.progress, storage)).toBe(false)
    expect(storage.getItem(GRADE2_PROGRESS_KEY)).toBe(raw)
    expect(storage.getItem(GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY)).toBeNull()
  })

  it('archives the exact damaged source before an explicit safe replacement', () => {
    const damagedMission = buildApprovedLengthApplicationMission(42)
    const replacementMission = buildApprovedLengthApplicationMission(999)
    const completed = recordGrade2Attempt(
      activateGrade2ApplicationMissionSnapshot(
        createInitialGrade2Progress(100),
        damagedMission,
      ),
      damagedMission,
      true,
      { now: 200 },
    )
    const damagedInstanceId = damagedMission.applicationSource.instanceId
    const raw = JSON.stringify({
      ...completed,
      applicationMissionSnapshotsByInstanceId: {
        ...completed.applicationMissionSnapshotsByInstanceId,
        [damagedInstanceId]: { ...damagedMission, correctAnswer: '999cm' },
      },
    })
    const storage = createMemoryStorage({ [GRADE2_PROGRESS_KEY]: raw })
    const loaded = loadGrade2Progress(storage, 200)

    const recovered = persistGrade2ApplicationMissionReplacement(
      loaded.progress,
      replacementMission,
      storage,
    )

    expect(recovered).not.toBeNull()
    expect(recovered?.completedMissionIds).toContain(damagedMission.id)
    expect(recovered?.xp).toBe(completed.xp)
    expect(recovered?.activeApplicationInstanceIdByMissionId[damagedMission.id])
      .toBe(replacementMission.applicationSource.instanceId)
    expect(recovered?.applicationMissionSnapshotsByInstanceId[damagedInstanceId])
      .toBeUndefined()
    expect(recovered?.applicationMissionSnapshotsByInstanceId[replacementMission.applicationSource.instanceId])
      .toEqual(replacementMission)
    expect(JSON.parse(storage.getItem(GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY) ?? 'null'))
      .toEqual({ schemaVersion: 1, damagedProgressSources: [raw] })
    expect(JSON.parse(storage.getItem(GRADE2_PROGRESS_KEY) ?? 'null'))
      .toEqual(recovered)
    expect(saveGrade2Progress(recovered!, storage)).toBe(true)
  })

  it('does not replace a damaged source that changed after it was loaded', () => {
    const damagedMission = buildApprovedLengthApplicationMission(42)
    const replacementMission = buildApprovedLengthApplicationMission(999)
    const activated = activateGrade2ApplicationMissionSnapshot(
      createInitialGrade2Progress(100),
      damagedMission,
    )
    const damagedInstanceId = damagedMission.applicationSource.instanceId
    const raw = JSON.stringify({
      ...activated,
      applicationMissionSnapshotsByInstanceId: {
        [damagedInstanceId]: { ...damagedMission, correctAnswer: '999cm' },
      },
    })
    const storage = createMemoryStorage({ [GRADE2_PROGRESS_KEY]: raw })
    const loaded = loadGrade2Progress(storage, 100)
    const concurrentlyChangedRaw = `${raw} `
    storage.setItem(GRADE2_PROGRESS_KEY, concurrentlyChangedRaw)

    expect(persistGrade2ApplicationMissionReplacement(
      loaded.progress,
      replacementMission,
      storage,
    )).toBeNull()
    expect(storage.getItem(GRADE2_PROGRESS_KEY)).toBe(concurrentlyChangedRaw)
    expect(storage.getItem(GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY)).toBeNull()
  })

  it('leaves the damaged primary source untouched when recovery evidence is corrupt', () => {
    const damagedMission = buildApprovedLengthApplicationMission(42)
    const replacementMission = buildApprovedLengthApplicationMission(999)
    const activated = activateGrade2ApplicationMissionSnapshot(
      createInitialGrade2Progress(100),
      damagedMission,
    )
    const damagedInstanceId = damagedMission.applicationSource.instanceId
    const raw = JSON.stringify({
      ...activated,
      applicationMissionSnapshotsByInstanceId: {
        [damagedInstanceId]: { ...damagedMission, correctAnswer: '999cm' },
      },
    })
    const storage = createMemoryStorage({
      [GRADE2_PROGRESS_KEY]: raw,
      [GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY]: '{bad evidence',
    })
    const loaded = loadGrade2Progress(storage, 100)

    expect(persistGrade2ApplicationMissionReplacement(
      loaded.progress,
      replacementMission,
      storage,
    )).toBeNull()
    expect(storage.getItem(GRADE2_PROGRESS_KEY)).toBe(raw)
    expect(storage.getItem(GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY)).toBe('{bad evidence')
  })

  it('migrates the v2 mission-id snapshot map into an immutable instance archive', () => {
    const applicationMission = buildApprovedLengthApplicationMission()
    const current = recordGrade2Attempt(
      activateGrade2ApplicationMissionSnapshot(
        createInitialGrade2Progress(100),
        applicationMission,
      ),
      applicationMission,
      true,
      { now: 200 },
    )
    const {
      applicationMissionSnapshotsByInstanceId: _archive,
      activeApplicationInstanceIdByMissionId: _activePointers,
      ...legacyFields
    } = current
    const storage = createMemoryStorage({
      [GRADE2_PROGRESS_KEY]: JSON.stringify({
        ...legacyFields,
        schemaVersion: 2,
        applicationMissionSnapshotsById: {
          [applicationMission.id]: applicationMission,
        },
      }),
    })

    const loaded = loadGrade2Progress(storage, 200)

    expect(loaded.recovered).toBe(false)
    expect(loaded.progress.schemaVersion).toBe(3)
    expect(loaded.progress.applicationMissionSnapshotsByInstanceId[applicationMission.applicationSource.instanceId])
      .toEqual(applicationMission)
    expect(loaded.progress.activeApplicationInstanceIdByMissionId[applicationMission.id])
      .toBe(applicationMission.applicationSource.instanceId)
  })

  it('preserves unkeyable v2 application evidence and its blocking active pointer', () => {
    const missionId = 'g2-2-length-application-route-total-v1'
    const rawEvidence = { broken: true, correctAnswer: '999cm' }
    const storage = createMemoryStorage({
      [GRADE2_PROGRESS_KEY]: JSON.stringify({
        ...createInitialGrade2Progress(100),
        schemaVersion: 2,
        applicationMissionSnapshotsByInstanceId: undefined,
        activeApplicationInstanceIdByMissionId: undefined,
        applicationMissionSnapshotsById: { [missionId]: rawEvidence },
      }),
    })

    const loaded = loadGrade2Progress(storage, 100)

    expect(loaded.recovered).toBe(true)
    expect(loaded.progress.activeApplicationInstanceIdByMissionId[missionId])
      .toBe(`unresolved-v2:${missionId}`)
    expect(loaded.progress.applicationMissionSnapshotsByInstanceId[`unresolved-v2:${missionId}`])
      .toEqual(rawEvidence)
    expect(mergeGrade2ApplicationMissionSnapshots(
      [buildApprovedLengthApplicationMission()],
      loaded.progress,
    ).some((mission) => mission.id === missionId)).toBe(false)
  })

  it('does not grade an application mission that was never activated', () => {
    const applicationMission = buildApprovedLengthApplicationMission()
    const initial = createInitialGrade2Progress(100)

    expect(recordGrade2Attempt(initial, applicationMission, true, { now: 200 }))
      .toBe(initial)
  })

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
    expect(storage.getItem(GRADE2_PROGRESS_KEY)).toContain('"schemaVersion":3')
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
    expect(loaded.progress.schemaVersion).toBe(3)
    expect(loaded.progress.selectedUnitId).toBe('g2-1-place-value')
    expect(loaded.progress.xp).toBe(10)
    expect(loaded.progress.masteryByMissionId['g2-1-place-value-01'].correct).toBe(1)
    expect(loaded.progress.missionSketchRunOrdinal).toBe(0)
    expect(loaded.progress.applicationMissionSnapshotsByInstanceId).toEqual({})
    expect(loaded.progress.activeApplicationInstanceIdByMissionId).toEqual({})
  })
})
