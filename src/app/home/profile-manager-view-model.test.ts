import { describe, expect, it } from 'vitest'

import { MASCOT_PREFERENCE_KEY } from '@/lib/mascot'
import type { LocalProfileRegistryV1 } from '@/lib/local-profile'
import { createProfileScopedStorageKey } from '@/lib/profile-scoped-storage'

import { buildProfileManagerViewModel, readProfileMascotId } from './profile-manager-view-model'

const PROFILE_A = 'local_11111111-1111-4111-8111-111111111111'
const PROFILE_B = 'local_22222222-2222-4222-9222-222222222222'

const REGISTRY: LocalProfileRegistryV1 = {
  schemaVersion: 1,
  activeProfileId: PROFILE_A,
  profiles: [
    { profileId: PROFILE_A, nickname: '수리', createdAt: 1, updatedAt: 1 },
    { profileId: PROFILE_B, nickname: null, createdAt: 2, updatedAt: 2 },
  ],
  migration: { schemaVersion: 1, status: 'not-needed', targetProfileId: null, backupKey: null },
}

describe('profile manager view model', () => {
  it('projects each registry entry with its own scoped mascot preference', () => {
    const values = new Map<string, string>([
      [createProfileScopedStorageKey(PROFILE_A, MASCOT_PREFERENCE_KEY), JSON.stringify({ avatarId: 'moa' })],
      [createProfileScopedStorageKey(PROFILE_B, MASCOT_PREFERENCE_KEY), JSON.stringify({ avatarId: 'lumi' })],
    ])

    expect(buildProfileManagerViewModel(REGISTRY, { getItem: (key) => values.get(key) ?? null })).toEqual([
      { profileId: PROFILE_A, nickname: '수리', mascotId: 'moa' },
      { profileId: PROFILE_B, nickname: null, mascotId: 'lumi' },
    ])
  })

  it('falls back without writing when a preference is absent, invalid, or unreadable', () => {
    expect(readProfileMascotId(PROFILE_A, { getItem: () => null })).toBe('suri')
    expect(readProfileMascotId(PROFILE_A, { getItem: () => '{invalid' })).toBe('suri')
    expect(readProfileMascotId(PROFILE_A, { getItem: () => JSON.stringify({ avatarId: 'unknown' }) })).toBe('suri')
    expect(readProfileMascotId(PROFILE_A, { getItem: () => { throw new Error('blocked') } })).toBe('suri')
  })
})
