import {
  type ProfileRegistryStorage,
  createInitialLocalProfileRegistry,
  isLocalProfileId,
  readLocalProfileRegistry,
  writeLocalProfileRegistry,
} from './local-profile'
import { migrateLegacyLearnerStorage, type EnumerableProfileMigrationStorage } from './profile-migration'
import { createProfileScopedStorage } from './profile-scoped-storage'
import { createProfileSessionLease, type ProfileSessionLeaseController } from './profile-session-lease'

export interface LearnerStorage {
  readonly profileId: string
  getItem(legacyKey: string): string | null
  setItem(legacyKey: string, value: string): void
  removeItem(legacyKey: string): void
}

interface WindowWithLocalStorage {
  localStorage?: unknown
}

let cachedBase: ProfileRegistryStorage | null = null
let cachedProfileId: string | null = null
let cachedStorage: LearnerStorage | null = null
let tabHolderId: string | null = null

const TAB_HOLDER_ID_STORAGE_KEY = 'mathAssist_tabHolderId_v1'

function randomHolderId(): string {
  return typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function ensureTabHolderId(): string {
  if (tabHolderId !== null) return tabHolderId
  try {
    const existing = window.sessionStorage.getItem(TAB_HOLDER_ID_STORAGE_KEY)
    if (typeof existing === 'string' && existing.trim().length > 0) {
      tabHolderId = existing
      return tabHolderId
    }
  } catch {
    // Session storage can be unavailable (privacy mode); fall through to memory-only.
  }
  const next = randomHolderId()
  try {
    window.sessionStorage.setItem(TAB_HOLDER_ID_STORAGE_KEY, next)
  } catch {
    // Memory-only holder id still works within the current document.
  }
  tabHolderId = next
  return tabHolderId
}

function isReadableWritableStorage(value: unknown): value is ProfileRegistryStorage {
  return Boolean(value) && typeof value === 'object'
    && typeof (value as ProfileRegistryStorage).getItem === 'function'
    && typeof (value as ProfileRegistryStorage).setItem === 'function'
    && typeof (value as ProfileRegistryStorage).removeItem === 'function'
}

function resolveBaseStorage(): ProfileRegistryStorage | null {
  try {
    const candidate = ((globalThis as { window?: WindowWithLocalStorage }).window)?.localStorage
    if (isReadableWritableStorage(candidate)) return candidate
  } catch {
    return null
  }
  try {
    const candidate = (globalThis as { localStorage?: unknown }).localStorage
    if (isReadableWritableStorage(candidate)) return candidate
  } catch {
    return null
  }
  return null
}

function isEnumerableStorage(value: ProfileRegistryStorage): value is EnumerableProfileMigrationStorage {
  const candidate = value as Partial<EnumerableProfileMigrationStorage>
  return typeof candidate.length === 'number' && typeof candidate.key === 'function'
}

export function ensureProfileStorageReady(base: ProfileRegistryStorage): void {
  if (!isEnumerableStorage(base)) {
    if (!readLocalProfileRegistry(base)) {
      writeLocalProfileRegistry(
        base,
        createInitialLocalProfileRegistry({ migrationStatus: 'not-needed' }),
      )
    }
    return
  }
  const existing = readLocalProfileRegistry(base)
  if (existing && (existing.migration.status === 'verified' || existing.migration.status === 'not-needed')) {
    return
  }
  const result = migrateLegacyLearnerStorage(base)
  if (result.status !== 'verified' && result.status !== 'not-needed' && result.status !== 'failed') {
    throw new Error(`Learner storage migration did not settle on a terminal status: ${result.status}`)
  }
}

function ensureWritePermission(
  lease: ProfileSessionLeaseController,
  profileId: string,
): boolean {
  if (lease.hasWritePermission()) return true
  return lease.acquire(profileId).status === 'acquired'
}

function buildLearnerStorage(base: ProfileRegistryStorage, activeProfileId: string): LearnerStorage {
  const lease = createProfileSessionLease(base, { holderId: ensureTabHolderId() })
  lease.acquire(activeProfileId)
  const scoped = createProfileScopedStorage(base, { profileId: activeProfileId })

  const learnerStorage: LearnerStorage = {
    profileId: activeProfileId,
    getItem(legacyKey: string): string | null {
      try {
        const value = scoped.getItem(legacyKey)
        return value
      } catch {
        return null
      }
    },
    setItem(legacyKey: string, value: string): void {
      if (!ensureWritePermission(lease, activeProfileId)) return
      try {
        scoped.setItem(legacyKey, value)
        } catch {
        }
    },
    removeItem(legacyKey: string): void {
      if (!ensureWritePermission(lease, activeProfileId)) return
      try {
        scoped.removeItem(legacyKey)
        } catch {
        }
    },
  }

  cachedBase = base
  cachedProfileId = activeProfileId
  cachedStorage = learnerStorage
  return learnerStorage
}

export function getLearnerStorage(): LearnerStorage | null {
  if (typeof window === 'undefined') return null

  let base: ProfileRegistryStorage | null = null
  let activeProfileId: string | null = null
  try {
    base = resolveBaseStorage()
    if (!base) return null
    ensureProfileStorageReady(base)
    activeProfileId = readLocalProfileRegistry(base)?.activeProfileId ?? null
    if (!activeProfileId || !isLocalProfileId(activeProfileId)) return null
  } catch {
    return null
  }

  if (cachedStorage && cachedBase === base && cachedProfileId === activeProfileId) {
    return cachedStorage
  }
  try {
    return buildLearnerStorage(base, activeProfileId)
  } catch {
    return null
  }
}

export function getActiveProfileId(): string | null {
  const storage = getLearnerStorage()
  return storage ? storage.profileId : null
}
