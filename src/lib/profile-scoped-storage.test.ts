import { describe, expect, it } from 'vitest'

import { LOCAL_PROFILE_REGISTRY_KEY, createInitialLocalProfileRegistry } from './local-profile'
import {
  ProfileStorageScopeError,
  ProfileWriteRevokedError,
  classifyMathAssistStorageKey,
  createProfileScopedStorage,
  createProfileScopedStorageKey,
} from './profile-scoped-storage'

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

const UUID_A = '00000000-0000-4000-8000-000000000001'
const UUID_B = '00000000-0000-4000-8000-000000000002'

describe('profile-scoped learner storage', () => {
  it('separates profiles and grades while preserving raw bytes', () => {
    const first = createInitialLocalProfileRegistry({ now: () => 1, randomUUID: () => UUID_A, migrationStatus: 'not-needed' })
    const second = {
      ...first,
      activeProfileId: `local_${UUID_B}`,
      profiles: [...first.profiles, {
        profileId: `local_${UUID_B}`,
        nickname: null,
        createdAt: 2,
        updatedAt: 2,
      }],
    }
    const storage = memoryStorage({ [LOCAL_PROFILE_REGISTRY_KEY]: JSON.stringify(first) })
    const firstStorage = createProfileScopedStorage(storage)
    firstStorage.setItem('mathAssist_grade1Progress', '{"grade":1}')
    firstStorage.setItem('mathAssist_grade6Progress', '{"grade":6}')

    storage.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(second))
    const secondStorage = createProfileScopedStorage(storage)
    secondStorage.setItem('mathAssist_grade1Progress', '{"grade":1,"second":true}')

    expect(storage.getItem(createProfileScopedStorageKey(first.activeProfileId, 'mathAssist_grade1Progress'))).toBe('{"grade":1}')
    expect(storage.getItem(createProfileScopedStorageKey(first.activeProfileId, 'mathAssist_grade6Progress'))).toBe('{"grade":6}')
    expect(secondStorage.getItem('mathAssist_grade6Progress')).toBeNull()
    expect(secondStorage.getItem('mathAssist_grade1Progress')).toBe('{"grade":1,"second":true}')
  })

  it('allows only declared learner keys and keeps device-global keys outside the adapter', () => {
    expect(classifyMathAssistStorageKey('mathAssist_grade4Progress')).toBe('learner')
    expect(classifyMathAssistStorageKey('mathAssist_sketch_v1:document')).toBe('learner')
    expect(classifyMathAssistStorageKey('mathAssist_sketch_index_v1:index')).toBe('learner')
    expect(classifyMathAssistStorageKey('mathAssist_progressBackup_v1:123')).toBe('learner')
    expect(classifyMathAssistStorageKey(LOCAL_PROFILE_REGISTRY_KEY)).toBe('device-global')
    expect(classifyMathAssistStorageKey('mathAssist_releaseMetadata_v1')).toBe('device-global')
    expect(classifyMathAssistStorageKey('mathAssist_unknown_v1')).toBe('unknown')

    const registry = createInitialLocalProfileRegistry({ now: () => 1, randomUUID: () => UUID_A, migrationStatus: 'not-needed' })
    const scoped = createProfileScopedStorage(memoryStorage({
      [LOCAL_PROFILE_REGISTRY_KEY]: JSON.stringify(registry),
    }))
    expect(() => scoped.setItem(LOCAL_PROFILE_REGISTRY_KEY, 'bad')).toThrow(ProfileStorageScopeError)
    expect(() => scoped.setItem('mathAssist_unknown_v1', 'bad')).toThrow(ProfileStorageScopeError)
  })

  it('classifies production recovery evidence keys as learner-owned', () => {
    const registry = createInitialLocalProfileRegistry({ now: () => 1, randomUUID: () => UUID_A, migrationStatus: 'not-needed' })
    const recoveryEvidenceKeys = [
      'mathAssist_grade2ProgressRecoveryEvidence_v1',
      'mathAssist_grade5ApplicationProblemRecoveryEvidence_v1',
      'mathAssist_grade6ApplicationProblemRecoveryEvidence_v1',
    ]

    for (const key of recoveryEvidenceKeys) {
      expect(classifyMathAssistStorageKey(key)).toBe('learner')
      expect(createProfileScopedStorageKey(`local_${UUID_A}`, key)).toBe(
        `mathAssist_profile_v1:local_${UUID_A}:${key}`,
      )
    }

    const scoped = createProfileScopedStorage(memoryStorage({
      [LOCAL_PROFILE_REGISTRY_KEY]: JSON.stringify(registry),
    }))
    scoped.setItem(recoveryEvidenceKeys[0], '{"schemaVersion":1}')
    expect(scoped.getItem(recoveryEvidenceKeys[0])).toBe('{"schemaVersion":1}')
    expect(() => scoped.setItem('mathAssist_grade7RecoveryEvidence_v1', 'bad')).toThrow(ProfileStorageScopeError)
  })

  it('revokes an old adapter after the active profile changes and never redirects its write', () => {
    const first = createInitialLocalProfileRegistry({ now: () => 1, randomUUID: () => UUID_A, migrationStatus: 'not-needed' })
    const second = {
      ...first,
      activeProfileId: `local_${UUID_B}`,
      profiles: [...first.profiles, {
        profileId: `local_${UUID_B}`,
        nickname: null,
        createdAt: 2,
        updatedAt: 2,
      }],
    }
    const storage = memoryStorage({ [LOCAL_PROFILE_REGISTRY_KEY]: JSON.stringify(first) })
    const scoped = createProfileScopedStorage(storage)
    storage.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(second))

    expect(() => scoped.setItem('mathAssist_grade2Progress', 'must-not-write'))
      .toThrow(ProfileWriteRevokedError)
    expect(storage.getItem(createProfileScopedStorageKey(first.activeProfileId, 'mathAssist_grade2Progress'))).toBeNull()
    expect(storage.getItem(createProfileScopedStorageKey(second.activeProfileId, 'mathAssist_grade2Progress'))).toBeNull()
  })

  it('fails closed when registry state becomes corrupt', () => {
    const registry = createInitialLocalProfileRegistry({ now: () => 1, randomUUID: () => UUID_A, migrationStatus: 'not-needed' })
    const storage = memoryStorage({ [LOCAL_PROFILE_REGISTRY_KEY]: JSON.stringify(registry) })
    const scoped = createProfileScopedStorage(storage)
    storage.setItem(LOCAL_PROFILE_REGISTRY_KEY, '{bad json')
    expect(() => scoped.removeItem('mathAssist_grade1Progress')).toThrow(ProfileWriteRevokedError)
  })
})
