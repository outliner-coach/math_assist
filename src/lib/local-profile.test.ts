import { describe, expect, it } from 'vitest'

import {
  DEFAULT_MAX_LOCAL_PROFILES,
  LOCAL_PROFILE_REGISTRY_KEY,
  activateLocalProfile,
  addLocalProfile,
  createInitialLocalProfileRegistry,
  getLocalProfileDisplayLabel,
  parseLocalProfileRegistry,
  renameLocalProfile,
} from './local-profile'

const UUIDS = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000006',
  '00000000-0000-4000-8000-000000000007',
]

describe('local learner profile registry', () => {
  it('creates a valid unnamed profile with a stable local UUID identity', () => {
    const registry = createInitialLocalProfileRegistry({
      now: () => 100,
      randomUUID: () => UUIDS[0],
      migrationStatus: 'not-needed',
    })

    expect(LOCAL_PROFILE_REGISTRY_KEY).toBe('mathAssist_profiles_v1')
    expect(registry).toEqual({
      schemaVersion: 1,
      activeProfileId: `local_${UUIDS[0]}`,
      profiles: [{
        profileId: `local_${UUIDS[0]}`,
        nickname: null,
        createdAt: 100,
        updatedAt: 100,
      }],
      migration: {
        schemaVersion: 1,
        status: 'not-needed',
        targetProfileId: null,
        backupKey: null,
      },
    })
    expect(parseLocalProfileRegistry(JSON.stringify(registry))).toEqual(registry)
  })

  it('rejects empty, duplicate, missing-active, invalid nickname, and invalid timestamp registries', () => {
    const base = createInitialLocalProfileRegistry({
      now: () => 100,
      randomUUID: () => UUIDS[0],
      migrationStatus: 'not-needed',
    })
    const invalid = [
      { ...base, profiles: [] },
      { ...base, activeProfileId: `local_${UUIDS[1]}` },
      { ...base, profiles: [...base.profiles, { ...base.profiles[0] }] },
      { ...base, profiles: [{ ...base.profiles[0], nickname: ' ' }] },
      { ...base, profiles: [{ ...base.profiles[0], nickname: '가'.repeat(21) }] },
      { ...base, profiles: [{ ...base.profiles[0], createdAt: -1 }] },
      { ...base, profiles: [{ ...base.profiles[0], updatedAt: 99 }] },
      { ...base, profiles: [{ ...base.profiles[0], updatedAt: 1.5 }] },
    ]

    for (const value of invalid) {
      expect(parseLocalProfileRegistry(JSON.stringify(value))).toBeNull()
    }
    expect(parseLocalProfileRegistry('{bad json')).toBeNull()
  })

  it('trims nicknames without changing identity and assigns stable default display labels', () => {
    const first = createInitialLocalProfileRegistry({
      now: () => 100,
      randomUUID: () => UUIDS[0],
      migrationStatus: 'not-needed',
    })
    const second = addLocalProfile(first, '  민준  ', {
      now: () => 200,
      randomUUID: () => UUIDS[1],
    })
    const renamed = renameLocalProfile(second, second.profiles[0].profileId, '  수학왕  ', () => 300)

    expect(renamed.profiles[0].profileId).toBe(first.profiles[0].profileId)
    expect(renamed.profiles[0].nickname).toBe('수학왕')
    expect(renamed.profiles[1].nickname).toBe('민준')
    expect(getLocalProfileDisplayLabel(renameLocalProfile(renamed, renamed.profiles[0].profileId, null, () => 400), renamed.profiles[0].profileId)).toBe('학습자 1')
    expect(getLocalProfileDisplayLabel(renamed, renamed.profiles[1].profileId)).toBe('민준')
    expect(activateLocalProfile(renamed, renamed.profiles[1].profileId).activeProfileId)
      .toBe(renamed.profiles[1].profileId)
  })

  it('enforces the tunable profile limit and safe integer clock contract', () => {
    let registry = createInitialLocalProfileRegistry({
      now: () => 0,
      randomUUID: () => UUIDS[0],
      migrationStatus: 'not-needed',
    })
    for (let index = 1; index < DEFAULT_MAX_LOCAL_PROFILES; index += 1) {
      registry = addLocalProfile(registry, null, {
        now: () => index,
        randomUUID: () => UUIDS[index],
      })
    }
    expect(() => addLocalProfile(registry, null, {
      now: () => 10,
      randomUUID: () => UUIDS[6],
    })).toThrow(/maximum/i)
    expect(() => createInitialLocalProfileRegistry({
      now: () => Number.MAX_SAFE_INTEGER + 1,
      randomUUID: () => UUIDS[0],
      migrationStatus: 'not-needed',
    })).toThrow(TypeError)
  })
})
