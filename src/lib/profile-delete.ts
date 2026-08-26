import {
  LOCAL_PROFILE_REGISTRY_KEY,
  createInitialLocalProfileRegistry,
  isLocalProfileId,
  parseLocalProfileRegistry,
  type LocalProfileIdentityDependencies,
  type LocalProfileRegistryV1,
} from './local-profile'
import { PROFILE_SCOPED_STORAGE_PREFIX } from './profile-scoped-storage'

/**
 * T4 profile deletion and device-wide reset (spec §6).
 *
 * Boundary: this module clears Math Assist localStorage only. IndexedDB,
 * Cache Storage and service-worker deregistration are owned by the offline
 * task integration and are reported as a deferred step instead of being
 * touched here.
 */

export interface EnumerableDeletionStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  readonly length: number
  key(index: number): string | null
}

export type LocalProfileDeletionErrorCode =
  | 'CONFIRM_TOKEN_MISMATCH'
  | 'PROFILE_NOT_FOUND'
  | 'WRITE_FAILED'

const LOCAL_PROFILE_DELETION_TOKEN = 'confirm-local-profile-delete:v1'
const DELETION_BACKUP_LEGACY_PREFIX = 'mathAssist_progressBackup_v1:profile-deletion-v1:'
const MATH_ASSIST_KEY_PREFIX = 'mathAssist_'

export function prepareLocalProfileDeletionToken(_profileId: string): string {
  void _profileId
  return LOCAL_PROFILE_DELETION_TOKEN
}

function enumerableKeys(storage: EnumerableDeletionStorage): string[] {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key !== null) keys.push(key)
  }
  return Array.from(new Set(keys))
}

function captureAllBytes(storage: EnumerableDeletionStorage): Map<string, string | null> {
  const snapshot = new Map<string, string | null>()
  for (const key of enumerableKeys(storage)) {
    snapshot.set(key, storage.getItem(key))
  }
  return snapshot
}

function restoreAllBytes(storage: EnumerableDeletionStorage, snapshot: Map<string, string | null>): boolean {
  let allRestored = true
  for (const [key, original] of snapshot) {
    try {
      if (original === null) storage.removeItem(key)
      else storage.setItem(key, original)
    } catch {
      allRestored = false
    }
  }
  return allRestored
}

function registryWithoutProfile(
  registry: LocalProfileRegistryV1,
  profileId: string,
  identityDependencies: LocalProfileIdentityDependencies,
): { registry: LocalProfileRegistryV1; createdDefaultProfileId: string | null } {
  const survivors = registry.profiles.filter((profile) => profile.profileId !== profileId)
  const migrationIntact = registry.migration.targetProfileId !== null
    && registry.migration.targetProfileId !== profileId
  const migration = migrationIntact
    ? registry.migration
    : ({ schemaVersion: 1, status: 'not-needed', targetProfileId: null, backupKey: null } as const)

  if (survivors.length > 0) {
    return {
      registry: {
        ...registry,
        profiles: survivors,
        activeProfileId: registry.activeProfileId === profileId ? survivors[0].profileId : registry.activeProfileId,
        migration,
      },
      createdDefaultProfileId: null,
    }
  }

  const fresh = createInitialLocalProfileRegistry({ ...identityDependencies, migrationStatus: 'not-needed' })
  return {
    registry: fresh,
    createdDefaultProfileId: fresh.activeProfileId,
  }
}

export interface LocalProfileDeletionDependencies extends LocalProfileIdentityDependencies {
  storage: EnumerableDeletionStorage
}

export type LocalProfileDeletionResult =
  | {
    status: 'deleted'
    deletedKeys: number
    createdDefaultProfileId: string | null
    restoredFromBackup: false
  }
  | {
    status: 'failed'
    errorCode: LocalProfileDeletionErrorCode
    createdDefaultProfileId: null
    restoredFromBackup: boolean
  }

export function deleteLocalProfile(
  profileId: string,
  confirmToken: string,
  dependencies: LocalProfileDeletionDependencies,
): LocalProfileDeletionResult {
  const { storage } = dependencies
  const failed = (
    errorCode: LocalProfileDeletionErrorCode,
    restoredFromBackup: boolean,
  ): LocalProfileDeletionResult => ({ status: 'failed', errorCode, createdDefaultProfileId: null, restoredFromBackup })

  if (confirmToken !== prepareLocalProfileDeletionToken(profileId)) return failed('CONFIRM_TOKEN_MISMATCH', false)
  if (!isLocalProfileId(profileId)) return failed('PROFILE_NOT_FOUND', false)

  const registry = parseLocalProfileRegistry(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY))
  if (!registry || !registry.profiles.some((profile) => profile.profileId === profileId)) {
    return failed('PROFILE_NOT_FOUND', false)
  }

  const nowValue = Math.floor((dependencies.now ?? Date.now)())
  const scopedPrefix = `${PROFILE_SCOPED_STORAGE_PREFIX}${profileId}:`
  const deletionKeys = enumerableKeys(storage)
    .filter((key) => key.startsWith(scopedPrefix))
    .sort()

  const fullSnapshot = captureAllBytes(storage)
  const identityDependencies: LocalProfileIdentityDependencies = {
    now: dependencies.now,
    randomUUID: dependencies.randomUUID,
  }
  const replacement = registryWithoutProfile(registry, profileId, identityDependencies)
  const nextRegistryJson = JSON.stringify(replacement.registry)
  const backupScopeId = replacement.registry.activeProfileId

  const backupFullKey = `${PROFILE_SCOPED_STORAGE_PREFIX}${backupScopeId}:${DELETION_BACKUP_LEGACY_PREFIX}${nowValue}`
  const backupPayload = JSON.stringify({
    schemaVersion: 1,
    kind: 'profile-deletion-v1',
    deletedProfileId: profileId,
    createdAt: nowValue,
    values: Object.fromEntries([
      ...deletionKeys.map((key) => [key, fullSnapshot.get(key) ?? null]),
      [LOCAL_PROFILE_REGISTRY_KEY, fullSnapshot.get(LOCAL_PROFILE_REGISTRY_KEY) ?? null],
    ]),
  })

  try {
    storage.setItem(backupFullKey, backupPayload)
    if (storage.getItem(backupFullKey) !== backupPayload) throw new Error('deletion backup verification failed')
  } catch {
    try {
      storage.removeItem(backupFullKey)
    } catch {
      // Nothing else was written; dropping the unusable backup is best-effort.
    }
    return failed('WRITE_FAILED', false)
  }

  try {
    storage.setItem(LOCAL_PROFILE_REGISTRY_KEY, nextRegistryJson)
    for (const key of deletionKeys) {
      storage.removeItem(key)
    }
  } catch {
    return failed('WRITE_FAILED', restoreAfterDeletionFailure(storage, fullSnapshot, backupFullKey))
  }

  const registryValidAfterWrite = parseLocalProfileRegistry(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY)) !== null
  const allRemoved = deletionKeys.every((key) => storage.getItem(key) === null)
  const othersUntouched = Array.from(fullSnapshot.entries()).every(([key, original]) => {
    if (key === LOCAL_PROFILE_REGISTRY_KEY || deletionKeys.includes(key)) return true
    return storage.getItem(key) === original
  })

  if (!registryValidAfterWrite || !allRemoved || !othersUntouched) {
    return failed('WRITE_FAILED', restoreAfterDeletionFailure(storage, fullSnapshot, backupFullKey))
  }

  return {
    status: 'deleted',
    deletedKeys: deletionKeys.length,
    createdDefaultProfileId: replacement.createdDefaultProfileId,
    restoredFromBackup: false,
  }
}

function restoreAfterDeletionFailure(
  storage: EnumerableDeletionStorage,
  fullSnapshot: Map<string, string | null>,
  backupFullKey: string,
): boolean {
  let restored = restoreAllBytes(storage, fullSnapshot)
  try {
    storage.removeItem(backupFullKey)
  } catch {
    restored = false
  }
  return restored
}

export const DEVICE_DATA_RESET_CONFIRM_PHRASE = '이 기기의 모든 데이터 삭제' as const

export function prepareDeviceDataResetToken(): string {
  return DEVICE_DATA_RESET_CONFIRM_PHRASE
}

export interface DeviceDataResetResult {
  status: 'reset' | 'failed'
  errorCode: LocalProfileDeletionErrorCode | null
  removedMathAssistKeyCount: number
  indexedDbAndCacheStep: 'deferred-to-offline-integration'
  reloadRecommended: boolean
}

export function resetAllDeviceData(
  confirmToken: string,
  dependencies: LocalProfileDeletionDependencies,
): DeviceDataResetResult {
  const { storage } = dependencies
  if (confirmToken !== prepareDeviceDataResetToken()) {
    return {
      status: 'failed',
      errorCode: 'CONFIRM_TOKEN_MISMATCH',
      removedMathAssistKeyCount: 0,
      indexedDbAndCacheStep: 'deferred-to-offline-integration',
      reloadRecommended: true,
    }
  }

  const mathAssistKeys = enumerableKeys(storage).filter((key) => key.startsWith(MATH_ASSIST_KEY_PREFIX)).sort()
  let removedCount = 0
  let allRemoved = true
  for (const key of mathAssistKeys) {
    try {
      storage.removeItem(key)
      removedCount += 1
    } catch {
      allRemoved = false
    }
  }

  const nowValue = Math.floor((dependencies.now ?? Date.now)())
  let recreated = true
  try {
    const fresh = createInitialLocalProfileRegistry({
      migrationStatus: 'not-needed',
      now: () => nowValue,
      randomUUID: dependencies.randomUUID,
    })
    storage.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(fresh))
  } catch {
    recreated = false
  }

  return {
    status: allRemoved && recreated ? 'reset' : 'failed',
    errorCode: allRemoved && recreated ? null : 'WRITE_FAILED',
    removedMathAssistKeyCount: removedCount,
    indexedDbAndCacheStep: 'deferred-to-offline-integration',
    reloadRecommended: true,
  }
}
