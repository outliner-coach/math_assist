import { describe, expect, it } from 'vitest'

import { ATTEMPT_RECEIPT_STORAGE_KEY } from './attempt-receipt'
import { LOCAL_PROFILE_REGISTRY_KEY, writeLocalProfileRegistry, type LocalProfileRegistryV1 } from './local-profile'
import {
  DEVICE_DATA_RESET_CONFIRM_PHRASE,
  deleteLocalProfile,
  prepareDeviceDataResetToken,
  prepareLocalProfileDeletionToken,
  resetAllDeviceData,
  type EnumerableDeletionStorage,
} from './profile-delete'
import { createProfileScopedStorageKey } from './profile-scoped-storage'

const NOW = 1_721_520_000_000
const PROFILE_A = 'local_11111111-1111-4111-8111-111111111111'
const PROFILE_B = 'local_22222222-2222-4222-9222-222222222222'
const NEW_DEFAULT_UUID = '33333333-3333-4333-a333-333333333333'
const NEW_DEFAULT_ID = `local_${NEW_DEFAULT_UUID}`

class MemoryStorage implements EnumerableDeletionStorage {
  private readonly map = new Map<string, string>()

  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }

  get length(): number {
    return this.map.size
  }

  key(index: number): string | null {
    return Array.from(this.map.keys()).sort()[index] ?? null
  }

  dump(): Record<string, string> {
    return Object.fromEntries(this.map)
  }

  failRemovalsFor(failingKey: string): void {
    const original = this.removeItem.bind(this)
    let failed = false
    this.removeItem = (key: string) => {
      if (key === failingKey && !failed) {
        failed = true
        throw new Error('storage unavailable')
      }
      original(key)
    }
  }
}

function seedTwoProfiles(): MemoryStorage {
  const storage = new MemoryStorage()
  const registry: LocalProfileRegistryV1 = {
    schemaVersion: 1,
    activeProfileId: PROFILE_A,
    profiles: [
      { profileId: PROFILE_A, nickname: '철수', createdAt: NOW - 10_000, updatedAt: NOW - 9_000 },
      { profileId: PROFILE_B, nickname: null, createdAt: NOW - 8_000, updatedAt: NOW - 7_000 },
    ],
    migration: { schemaVersion: 1, status: 'verified', targetProfileId: PROFILE_A, backupKey: 'backup' },
  }
  writeLocalProfileRegistry(storage, registry)

  storage.setItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_grade2Progress'), '{"schemaVersion":4}')
  storage.setItem(createProfileScopedStorageKey(PROFILE_A, ATTEMPT_RECEIPT_STORAGE_KEY), '{"schemaVersion":1,"receipts":[]}')
  storage.setItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_sketch_index_v1:[null]'), '[]')
  storage.setItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_progressBackup_v1:1'), '{}')
  storage.setItem(createProfileScopedStorageKey(PROFILE_B, 'mathAssist_grade6Progress'), '{"g6":{"conceptId":"g6"}}')
  storage.setItem('mathAssist_releaseMetadata', '{"appRelease":"keep"}')
  storage.setItem('mathAssist_offlineState', '{"grades":{}}')
  return storage
}

describe('deleteLocalProfile', () => {
  it('requires the explicit two-step confirmation token', () => {
    const storage = seedTwoProfiles()
    const before = storage.dump()
    const token = prepareLocalProfileDeletionToken(PROFILE_A)

    expect(deleteLocalProfile(PROFILE_A, 'wrong-token', { storage })).toMatchObject({
      status: 'failed',
      errorCode: 'CONFIRM_TOKEN_MISMATCH',
    })
    expect(storage.dump()).toEqual(before)
    expect(token).not.toContain(PROFILE_A)
    expect(deleteLocalProfile(PROFILE_A, token, { storage }).status).toBe('deleted')
  })

  it('deletes only the target scoped keys and keeps other profiles and device-global keys', () => {
    const storage = seedTwoProfiles()
    const result = deleteLocalProfile(PROFILE_A, prepareLocalProfileDeletionToken(PROFILE_A), { storage })

    expect(result).toEqual({
      status: 'deleted',
      deletedKeys: 4,
      createdDefaultProfileId: null,
      restoredFromBackup: false,
    })
    expect(storage.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_grade2Progress'))).toBeNull()
    expect(storage.getItem(createProfileScopedStorageKey(PROFILE_A, ATTEMPT_RECEIPT_STORAGE_KEY))).toBeNull()
    expect(storage.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_sketch_index_v1:[null]'))).toBeNull()
    expect(storage.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_progressBackup_v1:1'))).toBeNull()
    expect(storage.getItem(createProfileScopedStorageKey(PROFILE_B, 'mathAssist_grade6Progress')))
      .toBe('{"g6":{"conceptId":"g6"}}')
    expect(storage.getItem('mathAssist_releaseMetadata')).toBe('{"appRelease":"keep"}')
    expect(storage.getItem('mathAssist_offlineState')).toBe('{"grades":{}}')

    const registry = JSON.parse(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY)!)
    expect(registry.profiles.map((p: { profileId: string }) => p.profileId)).toEqual([PROFILE_B])
    expect(registry.activeProfileId).toBe(PROFILE_B)
  })

  it('activates the first remaining profile when the active profile is deleted', () => {
    const storage = seedTwoProfiles()
    deleteLocalProfile(PROFILE_A, prepareLocalProfileDeletionToken(PROFILE_A), { storage })
    const registry = JSON.parse(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY)!)
    expect(registry.activeProfileId).toBe(PROFILE_B)
  })

  it('keeps the active profile when a non-active profile is deleted', () => {
    const storage = seedTwoProfiles()
    deleteLocalProfile(PROFILE_B, prepareLocalProfileDeletionToken(PROFILE_B), { storage })
    const registry = JSON.parse(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY)!)
    expect(registry.activeProfileId).toBe(PROFILE_A)
    expect(registry.profiles).toHaveLength(1)
  })

  it('creates and activates an empty default profile when deleting the last profile', () => {
    const storage = seedTwoProfiles()
    deleteLocalProfile(PROFILE_B, prepareLocalProfileDeletionToken(PROFILE_B), { storage })
    const result = deleteLocalProfile(PROFILE_A, prepareLocalProfileDeletionToken(PROFILE_A), {
      storage,
      randomUUID: () => NEW_DEFAULT_UUID,
      now: () => NOW,
    })

    expect(result.status).toBe('deleted')
    expect(result.createdDefaultProfileId).toBe(NEW_DEFAULT_ID)

    const registry = JSON.parse(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY)!)
    expect(registry.profiles).toHaveLength(1)
    expect(registry.profiles[0]).toEqual({
      profileId: NEW_DEFAULT_ID,
      nickname: null,
      createdAt: NOW,
      updatedAt: NOW,
    })
    expect(registry.activeProfileId).toBe(NEW_DEFAULT_ID)
    expect(storage.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_grade2Progress'))).toBeNull()
    expect(JSON.parse(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY)!).migration.status).toBe('not-needed')
  })

  it('restores the registry and every record when deletion fails midway', () => {
    const storage = seedTwoProfiles()
    const before = storage.dump()
    storage.failRemovalsFor(createProfileScopedStorageKey(PROFILE_A, ATTEMPT_RECEIPT_STORAGE_KEY))

    const result = deleteLocalProfile(PROFILE_A, prepareLocalProfileDeletionToken(PROFILE_A), { storage })
    expect(result).toMatchObject({ status: 'failed', errorCode: 'WRITE_FAILED', restoredFromBackup: true })
    expect(storage.dump()).toEqual(before)

    const stillThere = JSON.parse(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY)!)
    expect(stillThere.profiles).toHaveLength(2)
    expect(stillThere.activeProfileId).toBe(PROFILE_A)
  })

  it('restores everything when the last-profile default creation fails midway', () => {
    const storage = seedTwoProfiles()
    deleteLocalProfile(PROFILE_B, prepareLocalProfileDeletionToken(PROFILE_B), { storage })
    const before = storage.dump()

    let calls = 0
    const originalSet = storage.setItem.bind(storage)
    storage.setItem = (key: string, value: string) => {
      calls += 1
      if (calls === 2) throw new Error('quota')
      originalSet(key, value)
    }

    const result = deleteLocalProfile(PROFILE_A, prepareLocalProfileDeletionToken(PROFILE_A), {
      storage,
      randomUUID: () => NEW_DEFAULT_UUID,
      now: () => NOW,
    })
    expect(result.status).toBe('failed')
    storage.setItem = originalSet
    expect(storage.dump()).toEqual(before)
    expect(JSON.parse(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY)!).profiles.map((p: { profileId: string }) => p.profileId))
      .toEqual([PROFILE_A])
  })

  it('reports failure without writes when the profile does not exist', () => {
    const storage = seedTwoProfiles()
    const before = storage.dump()
    const missing = 'local_44444444-4444-4444-b444-444444444444'
    expect(deleteLocalProfile(missing, prepareLocalProfileDeletionToken(missing), { storage })).toMatchObject({
      status: 'failed',
      errorCode: 'PROFILE_NOT_FOUND',
    })
    expect(storage.dump()).toEqual(before)
  })
})

describe('resetAllDeviceData', () => {
  it('requires the typed confirmation phrase as the token', () => {
    const storage = seedTwoProfiles()
    const before = storage.dump()

    expect(resetAllDeviceData('다른 문구', { storage })).toMatchObject({
      status: 'failed',
      errorCode: 'CONFIRM_TOKEN_MISMATCH',
    })
    expect(storage.dump()).toEqual(before)
    expect(prepareDeviceDataResetToken()).toBe(DEVICE_DATA_RESET_CONFIRM_PHRASE)
  })

  it('clears all Math Assist localStorage keys and recreates one empty default profile', () => {
    const storage = seedTwoProfiles()
    storage.setItem('unrelated_app_key', 'untouched')

    const result = resetAllDeviceData(DEVICE_DATA_RESET_CONFIRM_PHRASE, {
      storage,
      randomUUID: () => NEW_DEFAULT_UUID,
      now: () => NOW,
    })

    expect(result.status).toBe('reset')
    expect(result.removedMathAssistKeyCount).toBe(8)
    expect(result.indexedDbAndCacheStep).toBe('deferred-to-offline-integration')
    expect(result.reloadRecommended).toBe(true)
    expect(storage.getItem('unrelated_app_key')).toBe('untouched')

    const remainingMathAssistKeys = Object.keys(storage.dump()).filter((key) => key.startsWith('mathAssist'))
    expect(remainingMathAssistKeys).toEqual([LOCAL_PROFILE_REGISTRY_KEY])
    const registry = JSON.parse(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY)!)
    expect(registry.profiles).toHaveLength(1)
    expect(registry.profiles[0].profileId).toBe(NEW_DEFAULT_ID)
    expect(registry.migration.status).toBe('not-needed')
  })
})
