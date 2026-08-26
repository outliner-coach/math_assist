import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  LOCAL_PROFILE_REGISTRY_KEY,
  createInitialLocalProfileRegistry,
} from './local-profile'
import { createProfileSessionLease } from './profile-session-lease'
import { createProfileScopedStorageKey } from './profile-scoped-storage'
import { getLearnerStorage, subscribeLeaseRevocation } from './profile-bootstrap'
import { subscribeToLeaseLoss, useLearnerLeaseStatus } from './use-lease-status'

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

let base: ReturnType<typeof memoryStorage>

beforeEach(() => {
  base = memoryStorage()
  vi.stubGlobal('window', { localStorage: base })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

function seedSingleProfile(): void {
  base.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(createInitialLocalProfileRegistry({
    now: () => 1,
    randomUUID: () => UUID_A,
    migrationStatus: 'not-needed',
  })))
}

function seedTwoProfiles(): void {
  const first = createInitialLocalProfileRegistry({
    now: () => 1,
    randomUUID: () => UUID_A,
    migrationStatus: 'not-needed',
  })
  base.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify({
    ...first,
    activeProfileId: PROFILE_B,
    profiles: [...first.profiles, {
      profileId: PROFILE_B,
      nickname: null,
      createdAt: 2,
      updatedAt: 2,
    }],
  }))
}

async function flushBroadcast(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10))
}

describe('lease revocation subscription', () => {
  it('is a no-op unsubscribe before the learner storage exists', () => {
    const unsubscribe = subscribeLeaseRevocation(() => {})
    expect(typeof unsubscribe).toBe('function')
    expect(() => unsubscribe()).not.toThrow()
  })

  it('forwards profile-changed revocation from the memoized lease controller', async () => {
    seedTwoProfiles()
    const storage = getLearnerStorage()
    expect(storage?.profileId).toBe(PROFILE_B)

    const reasons: string[] = []
    const unsubscribe = subscribeLeaseRevocation((reason) => reasons.push(reason))

    const otherTab = createProfileSessionLease(base, { holderId: 'other-tab' })
    const registryRaw = base.getItem(LOCAL_PROFILE_REGISTRY_KEY)
    if (registryRaw === null) throw new Error('registry missing')
    const switchedRegistry = { ...JSON.parse(registryRaw) as { activeProfileId: string }, activeProfileId: PROFILE_A }
    base.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(switchedRegistry))
    otherTab.publishProfileChange(PROFILE_A)
    await flushBroadcast()

    expect(reasons).toEqual(['profile-changed'])

    storage?.setItem('mathAssist_mascot_v1', '{"avatarId":"suri"}')
    expect(base.getItem(createProfileScopedStorageKey(PROFILE_B, 'mathAssist_mascot_v1'))).toBeNull()

    unsubscribe()
    otherTab.publishProfileChange(PROFILE_A)
    await flushBroadcast()
    expect(reasons).toEqual(['profile-changed'])
  })
})

describe('use-lease-status overlay trigger path', () => {
  it('flips the overlay trigger once the same bootstrap lease is revoked', async () => {
    seedTwoProfiles()
    expect(getLearnerStorage()).not.toBeNull()

    let lost = false
    const unsubscribe = subscribeToLeaseLoss(() => {
      lost = true
    })

    expect(useLearnerLeaseStatus).toBeTypeOf('function')

    const otherTab = createProfileSessionLease(base, { holderId: 'other-tab' })
    otherTab.publishProfileChange(PROFILE_A)
    await flushBroadcast()

    expect(lost).toBe(true)
    unsubscribe()

    expect(subscribeToLeaseLoss(() => {})).toBeInstanceOf(Function)
  })
})
