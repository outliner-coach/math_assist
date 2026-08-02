import { describe, expect, it } from 'vitest'

import { LOCAL_PROFILE_REGISTRY_KEY, parseLocalProfileRegistry } from './local-profile'
import { migrateLegacyLearnerStorage } from './profile-migration'
import { createProfileScopedStorageKey } from './profile-scoped-storage'

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
const deps = { now: () => 123, randomUUID: () => UUID }

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
    const legacy = {
      mathAssist_grade1Progress: '{"checked":["g1"]}',
      mathAssist_grade2Progress: '{"review":["g2"]}',
      mathAssist_grade6CurrentSession: '{"answers":[null,"7"]}',
      mathAssist_grade6LastResult: '{"score":1}',
      mathAssist_guestHome_v1: '{"activeGrade":6}',
      mathAssist_attemptReceipts_v1: '{"schemaVersion":1,"receipts":[]}',
      mathAssist_mascot_v1: '{"avatarId":"lumi"}',
      'mathAssist_sketch_v1:raw-id': '{"commands":[]}',
      'mathAssist_sketch_index_v1:raw-id': '[]',
      'mathAssist_progressBackup_v1:100': '{"schemaVersion":1}',
    }
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
      mathAssist_grade1Progress: '{"checked":["g1"]}',
      mathAssist_grade2Progress: '{"checked":["g2"]}',
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
    expect(storage.getItem(createProfileScopedStorageKey(target!, 'mathAssist_grade1Progress'))).toBe('{"checked":["g1"]}')
    expect(storage.getItem(createProfileScopedStorageKey(target!, 'mathAssist_grade2Progress'))).toBe('{"checked":["g2"]}')
  })

  it('fails closed for corrupt or unknown learner values without shrinking another grade', () => {
    const validGrade = '{"completed":["safe"]}'
    const corrupt = memoryStorage({
      mathAssist_grade1Progress: validGrade,
      mathAssist_grade2Progress: '{bad json',
    })
    const corruptResult = migrateLegacyLearnerStorage(corrupt, deps)
    expect(corruptResult.status).toBe('failed')
    expect(corrupt.getItem('mathAssist_grade1Progress')).toBe(validGrade)
    expect(corrupt.getItem('mathAssist_grade2Progress')).toBe('{bad json')
    expect(corrupt.getItem(createProfileScopedStorageKey(corruptResult.registry.activeProfileId, 'mathAssist_grade1Progress'))).toBeNull()

    const unknown = memoryStorage({ mathAssist_unknownLearnerState: '{"value":1}' })
    const unknownResult = migrateLegacyLearnerStorage(unknown, deps)
    expect(unknownResult.status).toBe('failed')
    expect(unknown.getItem('mathAssist_unknownLearnerState')).toBe('{"value":1}')
  })

  it('does not overwrite a conflicting scoped value and rejects a corrupt registry', () => {
    const storage = memoryStorage({ mathAssist_grade1Progress: '{"legacy":true}' })
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
