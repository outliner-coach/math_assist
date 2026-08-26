import {
  LOCAL_PROFILE_REGISTRY_KEY,
  isLocalProfileId,
  parseLocalProfileRegistry,
  type ProfileRegistryStorage,
} from './local-profile'
import { createProfileScopedStorageKey } from './profile-scoped-storage'

export const PROFILE_SESSION_LEASE_LEGACY_KEY = 'mathAssist_profileSessionLease_v1'
export const PROFILE_COORDINATION_CHANNEL_NAME = 'mathAssist_profile_coordination_v1'
export const PROFILE_COORDINATION_EVENT_KEY = 'mathAssist_offline_profileCoordination_v1'
export const DEFAULT_PROFILE_SESSION_LEASE_DURATION_MS = 2 * 60 * 1000

export interface ProfileSessionLeaseV1 {
  schemaVersion: 1
  profileId: string
  holderId: string
  acquiredAt: number
  expiresAt: number
}

export type ProfileCoordinationMessage =
  | { schemaVersion: 1; type: 'profile-changed'; profileId: string }
  | { schemaVersion: 1; type: 'lease-changed'; profileId: string }

export interface ProfileCoordinationChannel {
  post(message: ProfileCoordinationMessage): void
  subscribe(listener: (message: ProfileCoordinationMessage) => void): () => void
  close(): void
}

export type ProfileLeaseRevocationReason = 'profile-changed' | 'lease-lost'

export type AcquireProfileLeaseResult =
  | { status: 'acquired'; lease: ProfileSessionLeaseV1 }
  | { status: 'held'; lease: ProfileSessionLeaseV1 }
  | { status: 'blocked'; lease: null; reason: 'inactive-profile' | 'corrupt' | 'storage-unavailable' }

export interface ProfileSessionLeaseOptions {
  holderId: string
  now?: () => number
  leaseDurationMs?: number
  channel?: ProfileCoordinationChannel | null
}

export interface ProfileSessionLeaseController {
  acquire(profileId: string): AcquireProfileLeaseResult
  inspect(profileId: string): ProfileSessionLeaseV1 | null
  renew(): boolean
  release(): boolean
  hasWritePermission(): boolean
  publishProfileChange(profileId: string): void
  onRevoked(listener: (reason: ProfileLeaseRevocationReason) => void): () => void
  dispose(): void
}

function safeTimestamp(value: number): number | null {
  return Number.isSafeInteger(value) && value >= 0 ? value : null
}

function parseLease(raw: string | null, profileId: string): { lease: ProfileSessionLeaseV1 | null; corrupt: boolean } {
  if (raw === null) return { lease: null, corrupt: false }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { lease: null, corrupt: true }
    const candidate = parsed as Partial<ProfileSessionLeaseV1>
    if (
      candidate.schemaVersion !== 1 ||
      candidate.profileId !== profileId ||
      typeof candidate.holderId !== 'string' || candidate.holderId.trim().length === 0 ||
      safeTimestamp(candidate.acquiredAt as number) === null ||
      safeTimestamp(candidate.expiresAt as number) === null ||
      (candidate.expiresAt as number) <= (candidate.acquiredAt as number)
    ) {
      return { lease: null, corrupt: true }
    }
    return { lease: candidate as ProfileSessionLeaseV1, corrupt: false }
  } catch {
    return { lease: null, corrupt: true }
  }
}

function isCoordinationMessage(value: unknown): value is ProfileCoordinationMessage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<ProfileCoordinationMessage>
  return candidate.schemaVersion === 1 &&
    (candidate.type === 'profile-changed' || candidate.type === 'lease-changed') &&
    isLocalProfileId(candidate.profileId)
}

function noopChannel(): ProfileCoordinationChannel {
  return { post() {}, subscribe() { return () => {} }, close() {} }
}

export function createBrowserProfileCoordinationChannel(
  storage?: Pick<ProfileRegistryStorage, 'setItem' | 'removeItem'>,
): ProfileCoordinationChannel {
  const listeners = new Set<(message: ProfileCoordinationMessage) => void>()
  const BroadcastChannelConstructor = globalThis.BroadcastChannel
  if (typeof window !== 'undefined' && typeof BroadcastChannelConstructor === 'function') {
    try {
      const broadcast = new BroadcastChannelConstructor(PROFILE_COORDINATION_CHANNEL_NAME)
      const onMessage = (event: MessageEvent<unknown>) => {
        if (isCoordinationMessage(event.data)) {
          const message = event.data
          listeners.forEach((listener) => listener(message))
        }
      }
      broadcast.addEventListener('message', onMessage)
      return {
        post(message) { broadcast.postMessage(message) },
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
        close() {
          broadcast.removeEventListener('message', onMessage)
          listeners.clear()
          broadcast.close()
        },
      }
    } catch {
      // Fall through to the storage-event channel when BroadcastChannel is
      // unavailable in a restricted browser context.
    }
  }

  if (typeof window === 'undefined') return noopChannel()
  let fallbackStorage = storage
  if (!fallbackStorage) {
    try {
      fallbackStorage = window.localStorage
    } catch {
      return noopChannel()
    }
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PROFILE_COORDINATION_EVENT_KEY || event.newValue === null) return
    try {
      const envelope: unknown = JSON.parse(event.newValue)
      if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) return
      const message = (envelope as { message?: unknown }).message
      if (isCoordinationMessage(message)) {
        listeners.forEach((listener) => listener(message))
      }
    } catch {
      // Unknown cross-tab events are ignored without changing permissions.
    }
  }
  window.addEventListener('storage', onStorage)
  return {
    post(message) {
      try {
        fallbackStorage.setItem(PROFILE_COORDINATION_EVENT_KEY, JSON.stringify({
          message,
          nonce: `${Date.now()}:${Math.random()}`,
        }))
        fallbackStorage.removeItem(PROFILE_COORDINATION_EVENT_KEY)
      } catch {
        // Direct lease checks remain authoritative when events cannot be sent.
      }
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    close() {
      window.removeEventListener('storage', onStorage)
      listeners.clear()
    },
  }
}

export function createProfileSessionLeaseStorageKey(profileId: string): string {
  return createProfileScopedStorageKey(profileId, PROFILE_SESSION_LEASE_LEGACY_KEY)
}

export function createProfileSessionLease(
  storage: ProfileRegistryStorage,
  options: ProfileSessionLeaseOptions,
): ProfileSessionLeaseController {
  if (typeof options.holderId !== 'string' || options.holderId.trim().length === 0) {
    throw new TypeError('A stable holder identity is required for a profile session lease.')
  }
  const duration = options.leaseDurationMs ?? DEFAULT_PROFILE_SESSION_LEASE_DURATION_MS
  if (!Number.isSafeInteger(duration) || duration < 1) {
    throw new TypeError('Profile lease duration must be a positive safe integer.')
  }
  const now = options.now ?? Date.now
  const channel = options.channel === undefined
    ? createBrowserProfileCoordinationChannel(storage)
    : (options.channel ?? noopChannel())
  const revocationListeners = new Set<(reason: ProfileLeaseRevocationReason) => void>()
  let heldProfileId: string | null = null

  const currentTime = (): number | null => safeTimestamp(now())
  const currentRegistryProfile = (): string | null =>
    parseLocalProfileRegistry(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY))?.activeProfileId ?? null

  const inspectRaw = (profileId: string): { lease: ProfileSessionLeaseV1 | null; corrupt: boolean } => {
    if (!isLocalProfileId(profileId)) return { lease: null, corrupt: true }
    try {
      return parseLease(storage.getItem(createProfileSessionLeaseStorageKey(profileId)), profileId)
    } catch {
      return { lease: null, corrupt: true }
    }
  }

  const revoke = (reason: ProfileLeaseRevocationReason): void => {
    if (heldProfileId === null) return
    heldProfileId = null
    revocationListeners.forEach((listener) => listener(reason))
  }

  const ownsCurrentLease = (): boolean => {
    if (heldProfileId === null || currentRegistryProfile() !== heldProfileId) return false
    const at = currentTime()
    if (at === null) return false
    const { lease, corrupt } = inspectRaw(heldProfileId)
    return !corrupt && lease?.holderId === options.holderId && lease.expiresAt > at
  }

  const handleMessage = (message: ProfileCoordinationMessage): void => {
    if (heldProfileId === null) return
    if (message.type === 'profile-changed' && message.profileId !== heldProfileId) {
      revoke('profile-changed')
      return
    }
    if (message.type === 'lease-changed' && message.profileId === heldProfileId && !ownsCurrentLease()) {
      revoke('lease-lost')
    }
  }

  const unsubscribe = channel.subscribe(handleMessage)

  const publish = (message: ProfileCoordinationMessage): void => {
    handleMessage(message)
    channel.post(message)
  }

  return {
    acquire(profileId: string): AcquireProfileLeaseResult {
      if (!isLocalProfileId(profileId) || currentRegistryProfile() !== profileId) {
        return { status: 'blocked', lease: null, reason: 'inactive-profile' }
      }
      const at = currentTime()
      if (at === null || at > Number.MAX_SAFE_INTEGER - duration) {
        return { status: 'blocked', lease: null, reason: 'storage-unavailable' }
      }
      const current = inspectRaw(profileId)
      if (current.corrupt) return { status: 'blocked', lease: null, reason: 'corrupt' }
      if (current.lease && current.lease.expiresAt > at && current.lease.holderId !== options.holderId) {
        return { status: 'held', lease: current.lease }
      }
      const acquiredAt = current.lease?.holderId === options.holderId ? current.lease.acquiredAt : at
      const lease: ProfileSessionLeaseV1 = {
        schemaVersion: 1,
        profileId,
        holderId: options.holderId,
        acquiredAt,
        expiresAt: at + duration,
      }
      try {
        storage.setItem(createProfileSessionLeaseStorageKey(profileId), JSON.stringify(lease))
      } catch {
        return { status: 'blocked', lease: null, reason: 'storage-unavailable' }
      }
      const stored = inspectRaw(profileId)
      if (stored.corrupt || !stored.lease) return { status: 'blocked', lease: null, reason: 'corrupt' }
      if (stored.lease.holderId !== options.holderId) return { status: 'held', lease: stored.lease }
      heldProfileId = profileId
      publish({ schemaVersion: 1, type: 'lease-changed', profileId })
      return { status: 'acquired', lease: stored.lease }
    },
    inspect(profileId: string): ProfileSessionLeaseV1 | null {
      const at = currentTime()
      const result = inspectRaw(profileId)
      if (at === null || result.corrupt || !result.lease || result.lease.expiresAt <= at) return null
      return result.lease
    },
    renew(): boolean {
      if (!ownsCurrentLease() || heldProfileId === null) {
        revoke('lease-lost')
        return false
      }
      const at = currentTime()
      if (at === null || at > Number.MAX_SAFE_INTEGER - duration) {
        revoke('lease-lost')
        return false
      }
      const existing = inspectRaw(heldProfileId).lease
      if (!existing || existing.holderId !== options.holderId) {
        revoke('lease-lost')
        return false
      }
      const renewed = { ...existing, expiresAt: at + duration }
      try {
        storage.setItem(createProfileSessionLeaseStorageKey(heldProfileId), JSON.stringify(renewed))
      } catch {
        revoke('lease-lost')
        return false
      }
      if (!ownsCurrentLease()) {
        revoke('lease-lost')
        return false
      }
      publish({ schemaVersion: 1, type: 'lease-changed', profileId: heldProfileId })
      return true
    },
    release(): boolean {
      if (heldProfileId === null) return false
      const profileId = heldProfileId
      const current = inspectRaw(profileId)
      if (current.corrupt || current.lease?.holderId !== options.holderId) {
        revoke('lease-lost')
        return false
      }
      try {
        storage.removeItem(createProfileSessionLeaseStorageKey(profileId))
      } catch {
        return false
      }
      heldProfileId = null
      publish({ schemaVersion: 1, type: 'lease-changed', profileId })
      return true
    },
    hasWritePermission(): boolean {
      const permitted = ownsCurrentLease()
      if (!permitted) revoke(currentRegistryProfile() === heldProfileId ? 'lease-lost' : 'profile-changed')
      return permitted
    },
    publishProfileChange(profileId: string): void {
      if (!isLocalProfileId(profileId)) throw new TypeError('A valid local profile identity is required.')
      publish({ schemaVersion: 1, type: 'profile-changed', profileId })
    },
    onRevoked(listener: (reason: ProfileLeaseRevocationReason) => void): () => void {
      revocationListeners.add(listener)
      return () => revocationListeners.delete(listener)
    },
    dispose(): void {
      unsubscribe()
      channel.close()
      revocationListeners.clear()
      heldProfileId = null
    },
  }
}
