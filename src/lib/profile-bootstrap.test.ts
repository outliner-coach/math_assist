import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  LOCAL_PROFILE_REGISTRY_KEY,
  createInitialLocalProfileRegistry,
} from './local-profile'
import { createInitialGrade2Progress, loadGrade2Progress } from './grade2-progress'
import { PROFILE_SESSION_LEASE_LEGACY_KEY } from './profile-session-lease'
import { createProfileScopedStorageKey } from './profile-scoped-storage'
import { getActiveProfileId, getLearnerStorage } from './profile-bootstrap'

const UUID_A = '00000000-0000-4000-8000-000000000001'
const UUID_B = '00000000-0000-4000-8000-000000000002'
const PROFILE_A = `local_${UUID_A}`
const PROFILE_B = `local_${UUID_B}`

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

type MemoryStorage = ReturnType<typeof memoryStorage>

function singleProfileRegistry(): string {
  return JSON.stringify(createInitialLocalProfileRegistry({
    now: () => 1,
    randomUUID: () => UUID_A,
    migrationStatus: 'not-needed',
  }))
}

function twoProfileRegistry(): string {
  const first = createInitialLocalProfileRegistry({
    now: () => 1,
    randomUUID: () => UUID_A,
    migrationStatus: 'not-needed',
  })
  return JSON.stringify({
    ...first,
    activeProfileId: PROFILE_B,
    profiles: [...first.profiles, {
      profileId: PROFILE_B,
      nickname: null,
      createdAt: 2,
      updatedAt: 2,
    }],
  })
}

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

let base: MemoryStorage

beforeEach(() => {
  base = memoryStorage()
  vi.stubGlobal('window', { localStorage: base })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('learner storage bootstrap', () => {
  it('returns null without a window (server safety)', () => {
    vi.unstubAllGlobals()
    expect(getLearnerStorage()).toBeNull()
    expect(getActiveProfileId()).toBeNull()
  })

  it('returns null fail-closed when the registry is corrupt', () => {
    base.setItem(LOCAL_PROFILE_REGISTRY_KEY, '{bad json')
    expect(getLearnerStorage()).toBeNull()
  })

  it('builds the adapter and preserves originals when migration fails on a corrupt legacy value', () => {
    base.setItem('mathAssist_grade1Progress', '{bad json')
    const storage = getLearnerStorage()
    expect(storage).not.toBeNull()
    expect(storage?.getItem('mathAssist_grade1Progress')).toBeNull()
    expect(base.getItem('mathAssist_grade1Progress')).toBe('{bad json')
    expect(base.getItem(LOCAL_PROFILE_REGISTRY_KEY)).toContain('"status":"failed"')
  })

  it('keeps a readable registry usable after failed migration: valid mascot copies, corrupt grade 2 stays raw', () => {
    base.setItem('mathAssist_grade2Progress', '{corrupt-grade2-progress')
    base.setItem('mathAssist_mascot_v1', '{"avatarId":"lumi"}')

    const storage = getLearnerStorage()
    expect(storage).not.toBeNull()
    const profileId = storage?.profileId as string
    expect(JSON.parse(base.getItem(LOCAL_PROFILE_REGISTRY_KEY) ?? '{}').activeProfileId).toBe(profileId)

    expect(base.getItem(createProfileScopedStorageKey(profileId, 'mathAssist_mascot_v1')))
      .toBe('{"avatarId":"lumi"}')
    expect(base.getItem(createProfileScopedStorageKey(profileId, 'mathAssist_grade2Progress'))).toBeNull()
    expect(base.getItem('mathAssist_grade2Progress')).toBe('{corrupt-grade2-progress')

    const loaded = loadGrade2Progress(storage)
    expect(loaded.storageAvailable).toBe(true)
    expect(loaded.progress.completedMissionIds).toEqual([])
    expect(loaded.progress.latestMissionId).toBeNull()
    expect(loaded.progress).toEqual(createInitialGrade2Progress(loaded.progress.lastPlayedAt))
  })

  it('persists the lease holder identity in sessionStorage across full-page navigations', async () => {
    const sessionStorageData = memoryStorage()
    vi.stubGlobal('window', { localStorage: base, sessionStorage: sessionStorageData })
    base.setItem(LOCAL_PROFILE_REGISTRY_KEY, singleProfileRegistry())

    vi.resetModules()
    const { getLearnerStorage: freshGetLearnerStorage } = await import('./profile-bootstrap')
    const storage = freshGetLearnerStorage()
    expect(storage).not.toBeNull()
    const holderId = sessionStorageData.getItem('mathAssist_tabHolderId_v1')
    expect(typeof holderId).toBe('string')
    expect((holderId as string).length).toBeGreaterThan(0)
    const leaseRaw = base.getItem(createProfileScopedStorageKey(PROFILE_A, PROFILE_SESSION_LEASE_LEGACY_KEY))
    expect(leaseRaw).not.toBeNull()
    expect(JSON.parse(leaseRaw ?? '{}').holderId).toBe(holderId)

    vi.resetModules()
    const { getLearnerStorage: secondDocumentGet } = await import('./profile-bootstrap')
    const rebuilt = secondDocumentGet()
    expect(rebuilt?.profileId).toBe(storage?.profileId)
    expect(sessionStorageData.getItem('mathAssist_tabHolderId_v1')).toBe(holderId)
    const leaseAfter = JSON.parse(base.getItem(createProfileScopedStorageKey(PROFILE_A, PROFILE_SESSION_LEASE_LEGACY_KEY)) ?? '{}')
    expect(leaseAfter.holderId).toBe(holderId)
  })

  it('recovers on a later call once the blocking legacy value is repaired', () => {
    base.setItem('mathAssist_grade1Progress', '{bad json')
    const before = getLearnerStorage()
    expect(before?.getItem('mathAssist_grade1Progress')).toBeNull()

    base.setItem('mathAssist_grade1Progress', grade1ProgressRaw())
    const storage = getLearnerStorage()
    expect(storage).not.toBeNull()
    expect(storage?.getItem('mathAssist_grade1Progress')).toBe(grade1ProgressRaw())
    expect(base.getItem(LOCAL_PROFILE_REGISTRY_KEY)).toContain('"status":"verified"')
  })

  it('(a) lands scoped writes at mathAssist_profile_v1:<id>:<legacyKey> and leaves legacy raw keys untouched', () => {
    base.setItem('mathAssist_grade1Progress', grade1ProgressRaw())
    const storage = getLearnerStorage()
    expect(storage).not.toBeNull()
    const migratedProfileId = JSON.parse(base.getItem(LOCAL_PROFILE_REGISTRY_KEY) ?? '{}').activeProfileId as string
    expect(storage?.profileId).toBe(migratedProfileId)

    storage?.setItem('mathAssist_grade1Progress', '{"schemaVersion":3,"updated":true}')

    expect(base.getItem(createProfileScopedStorageKey(migratedProfileId, 'mathAssist_grade1Progress')))
      .toBe('{"schemaVersion":3,"updated":true}')
    expect(base.getItem('mathAssist_grade1Progress')).toBe(grade1ProgressRaw())
  })

  it('migrates existing legacy values so they are readable through the adapter', () => {
    base.setItem('mathAssist_grade1Progress', grade1ProgressRaw())
    const storage = getLearnerStorage()
    expect(storage?.getItem('mathAssist_grade1Progress')).toBe(grade1ProgressRaw())
  })

  it('(d) memoizes one instance per active profile identity', () => {
    base.setItem(LOCAL_PROFILE_REGISTRY_KEY, singleProfileRegistry())
    const first = getLearnerStorage()
    const second = getLearnerStorage()
    expect(first).not.toBeNull()
    expect(first).toBe(second)

    base.setItem(LOCAL_PROFILE_REGISTRY_KEY, twoProfileRegistry())
    const third = getLearnerStorage()
    expect(third).not.toBe(first)
    expect(third?.profileId).toBe(PROFILE_B)
    expect(third?.getItem('mathAssist_grade1Progress')).toBeNull()

    first?.setItem('mathAssist_mascot_v1', '{"avatarId":"suri"}')
    expect(base.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_mascot_v1'))).toBeNull()
    expect(base.getItem(createProfileScopedStorageKey(PROFILE_B, 'mathAssist_mascot_v1'))).toBeNull()
  })

  it('(e) refuses writes without writing when another tab holds the lease, while reads stay available', () => {
    base.setItem(LOCAL_PROFILE_REGISTRY_KEY, singleProfileRegistry())
    const storage = getLearnerStorage()
    expect(storage).not.toBeNull()

    base.setItem(
      createProfileScopedStorageKey(PROFILE_A, PROFILE_SESSION_LEASE_LEGACY_KEY),
      JSON.stringify({
        schemaVersion: 1,
        profileId: PROFILE_A,
        holderId: 'other-tab',
        acquiredAt: Date.now() - 1000,
        expiresAt: Date.now() + 60_000,
      }),
    )

    expect(() => storage?.setItem('mathAssist_mascot_v1', '{"avatarId":"suri"}')).not.toThrow()
    expect(base.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_mascot_v1'))).toBeNull()

    base.setItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_mascot_v1'), '{"avatarId":"moa"}')
    expect(storage?.getItem('mathAssist_mascot_v1')).toBe('{"avatarId":"moa"}')
  })

  it('(b) keeps progress, session, result, receipt, mascot, and guest home keys separate across profiles', () => {
    base.setItem(LOCAL_PROFILE_REGISTRY_KEY, singleProfileRegistry())
    const first = getLearnerStorage()
    const learnerKeys = [
      'mathAssist_progress_v1',
      'mathAssist_currentSession',
      'mathAssist_lastResult',
      'mathAssist_attemptReceipts_v1',
      'mathAssist_mascot_v1',
      'mathAssist_guestHome_v1',
    ] as const
    learnerKeys.forEach((key, index) => {
      first?.setItem(key, `{"a":${index}}`)
    })

    base.setItem(LOCAL_PROFILE_REGISTRY_KEY, twoProfileRegistry())
    const second = getLearnerStorage()
    learnerKeys.forEach((key) => {
      expect(second?.getItem(key)).toBeNull()
    })

    learnerKeys.forEach((key, index) => {
      second?.setItem(key, `{"b":${index}}`)
      expect(base.getItem(createProfileScopedStorageKey(PROFILE_A, key))).toBe(`{"a":${index}}`)
      expect(base.getItem(createProfileScopedStorageKey(PROFILE_B, key))).toBe(`{"b":${index}}`)
    })
  })

  it('(c) isolates corruption of a single grade so other grades and profiles stay readable', () => {
    base.setItem(LOCAL_PROFILE_REGISTRY_KEY, singleProfileRegistry())
    const storage = getLearnerStorage()
    storage?.setItem('mathAssist_grade1Progress', '{corrupt-grade1')
    storage?.setItem('mathAssist_grade3Progress', grade1ProgressRaw().replace('count-cove-01', 'g3-1'))

    const reloaded = getLearnerStorage()
    const corruptGrade1 = reloaded?.getItem('mathAssist_grade1Progress')
    expect(corruptGrade1).toBe('{corrupt-grade1')
    expect(reloaded?.getItem('mathAssist_grade3Progress')).toContain('g3-1')

    base.setItem(LOCAL_PROFILE_REGISTRY_KEY, twoProfileRegistry())
    const otherProfile = getLearnerStorage()
    expect(otherProfile?.getItem('mathAssist_grade3Progress')).toBeNull()
  })

  it('exposes the active profile id for new receipts after bootstrap', () => {
    base.setItem(LOCAL_PROFILE_REGISTRY_KEY, singleProfileRegistry())
    expect(getActiveProfileId()).toBe(PROFILE_A)
  })
})
