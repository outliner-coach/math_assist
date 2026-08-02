import { describe, expect, it } from 'vitest'

import { LOCAL_PROFILE_REGISTRY_KEY, createInitialLocalProfileRegistry } from './local-profile'
import {
  createProfileSessionLease,
  createProfileSessionLeaseStorageKey,
  type ProfileCoordinationChannel,
  type ProfileCoordinationMessage,
} from './profile-session-lease'
import { ProfileWriteRevokedError, createProfileScopedStorage } from './profile-scoped-storage'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    get length() { return data.size },
    key(index: number) { return Array.from(data.keys())[index] ?? null },
    getItem(key: string) { return data.get(key) ?? null },
    setItem(key: string, value: string) { data.set(key, value) },
    removeItem(key: string) { data.delete(key) },
  }
}

function channelHub(): { channel(): ProfileCoordinationChannel } {
  const listeners = new Set<(message: ProfileCoordinationMessage) => void>()
  return {
    channel() {
      return {
        post(message) { listeners.forEach((listener) => listener(message)) },
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
        close() {},
      }
    },
  }
}

const UUID_A = '00000000-0000-4000-8000-000000000001'
const UUID_B = '00000000-0000-4000-8000-000000000002'

describe('profile session lease and cross-tab coordination', () => {
  it('prevents a second holder and lets it inspect the active lease', () => {
    let now = 100
    const registry = createInitialLocalProfileRegistry({ now: () => 1, randomUUID: () => UUID_A, migrationStatus: 'not-needed' })
    const storage = memoryStorage({ [LOCAL_PROFILE_REGISTRY_KEY]: JSON.stringify(registry) })
    const hub = channelHub()
    const first = createProfileSessionLease(storage, { holderId: 'tab-a', now: () => now, leaseDurationMs: 50, channel: hub.channel() })
    const second = createProfileSessionLease(storage, { holderId: 'tab-b', now: () => now, leaseDurationMs: 50, channel: hub.channel() })

    expect(first.acquire(registry.activeProfileId)).toMatchObject({ status: 'acquired' })
    expect(second.acquire(registry.activeProfileId)).toMatchObject({
      status: 'held',
      lease: { holderId: 'tab-a', profileId: registry.activeProfileId },
    })
    expect(second.inspect(registry.activeProfileId)?.holderId).toBe('tab-a')
    expect(first.hasWritePermission()).toBe(true)

    now = 151
    expect(second.acquire(registry.activeProfileId)).toMatchObject({ status: 'acquired' })
    expect(first.hasWritePermission()).toBe(false)
  })

  it('revokes a holder when another tab takes the lease or changes profile', () => {
    let now = 10
    const firstRegistry = createInitialLocalProfileRegistry({ now: () => 1, randomUUID: () => UUID_A, migrationStatus: 'not-needed' })
    const secondRegistry = {
      ...firstRegistry,
      activeProfileId: `local_${UUID_B}`,
      profiles: [...firstRegistry.profiles, {
        profileId: `local_${UUID_B}`,
        nickname: null,
        createdAt: 2,
        updatedAt: 2,
      }],
    }
    const storage = memoryStorage({ [LOCAL_PROFILE_REGISTRY_KEY]: JSON.stringify(firstRegistry) })
    const hub = channelHub()
    const oldTab = createProfileSessionLease(storage, { holderId: 'tab-a', now: () => now, leaseDurationMs: 10, channel: hub.channel() })
    const otherTab = createProfileSessionLease(storage, { holderId: 'tab-b', now: () => now, leaseDurationMs: 10, channel: hub.channel() })
    const reasons: string[] = []
    oldTab.onRevoked((reason) => reasons.push(reason))
    oldTab.acquire(firstRegistry.activeProfileId)

    now = 21
    otherTab.acquire(firstRegistry.activeProfileId)
    expect(oldTab.hasWritePermission()).toBe(false)
    expect(reasons).toContain('lease-lost')

    storage.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(secondRegistry))
    otherTab.publishProfileChange(secondRegistry.activeProfileId)
    expect(otherTab.hasWritePermission()).toBe(false)
  })

  it('renews and releases only the current holder, preserving another holder record', () => {
    let now = 10
    const registry = createInitialLocalProfileRegistry({ now: () => 1, randomUUID: () => UUID_A, migrationStatus: 'not-needed' })
    const storage = memoryStorage({ [LOCAL_PROFILE_REGISTRY_KEY]: JSON.stringify(registry) })
    const first = createProfileSessionLease(storage, { holderId: 'tab-a', now: () => now, leaseDurationMs: 20 })
    expect(first.acquire(registry.activeProfileId).status).toBe('acquired')
    now = 15
    expect(first.renew()).toBe(true)
    expect(first.inspect(registry.activeProfileId)?.expiresAt).toBe(35)

    storage.setItem(createProfileSessionLeaseStorageKey(registry.activeProfileId), JSON.stringify({
      schemaVersion: 1,
      profileId: registry.activeProfileId,
      holderId: 'tab-b',
      acquiredAt: 16,
      expiresAt: 36,
    }))
    expect(first.release()).toBe(false)
    expect(first.inspect(registry.activeProfileId)?.holderId).toBe('tab-b')
  })

  it('revokes a scoped storage writer when its lease is lost', () => {
    let now = 10
    const registry = createInitialLocalProfileRegistry({ now: () => 1, randomUUID: () => UUID_A, migrationStatus: 'not-needed' })
    const storage = memoryStorage({ [LOCAL_PROFILE_REGISTRY_KEY]: JSON.stringify(registry) })
    const hub = channelHub()
    const first = createProfileSessionLease(storage, { holderId: 'tab-a', now: () => now, leaseDurationMs: 10, channel: hub.channel() })
    const second = createProfileSessionLease(storage, { holderId: 'tab-b', now: () => now, leaseDurationMs: 10, channel: hub.channel() })
    expect(first.acquire(registry.activeProfileId).status).toBe('acquired')
    const scoped = createProfileScopedStorage(storage, { writePermission: () => first.hasWritePermission() })
    scoped.setItem('mathAssist_grade3Progress', '{"owner":"tab-a"}')

    now = 21
    expect(second.acquire(registry.activeProfileId).status).toBe('acquired')
    expect(() => scoped.setItem('mathAssist_grade3Progress', '{"owner":"stale-tab"}'))
      .toThrow(ProfileWriteRevokedError)
    expect(createProfileScopedStorage(storage).getItem('mathAssist_grade3Progress'))
      .toBe('{"owner":"tab-a"}')
  })
})
