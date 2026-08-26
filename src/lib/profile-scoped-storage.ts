import {
  LOCAL_PROFILE_REGISTRY_KEY,
  isLocalProfileId,
  parseLocalProfileRegistry,
  type ProfileRegistryStorage,
} from './local-profile'

export const PROFILE_SCOPED_STORAGE_PREFIX = 'mathAssist_profile_v1:'

export const LEARNER_OWNED_STORAGE_KEYS = new Set([
  'mathAssist_grade1Progress',
  'mathAssist_grade2Progress',
  'mathAssist_grade3Progress',
  'mathAssist_grade4Progress',
  'mathAssist_progress_v1',
  'mathAssist_currentSession',
  'mathAssist_lastResult',
  'mathAssist_grade6Progress',
  'mathAssist_grade6CurrentSession',
  'mathAssist_grade6LastResult',
  'mathAssist_guestHome_v1',
  'mathAssist_attemptReceipts_v1',
  'mathAssist_mascot_v1',
  'mathAssist_profileSessionLease_v1',
  'mathAssist_grade2ProgressRecoveryEvidence_v1',
  'mathAssist_grade5ApplicationProblemRecoveryEvidence_v1',
  'mathAssist_grade6ApplicationProblemRecoveryEvidence_v1',
])

export const LEARNER_OWNED_STORAGE_PREFIXES = [
  'mathAssist_sketch_v1:',
  'mathAssist_sketch_index_v1:',
  'mathAssist_progressBackup_v1:',
] as const

const DEVICE_GLOBAL_PATTERNS = [
  /^mathAssist_release(?:Metadata|State)?(?:[_:].*)?$/i,
  /^mathAssist_serviceWorker(?:[_:].*)?$/i,
  /^mathAssist_offline(?:[_:].*)?$/i,
]

export type MathAssistStorageScope = 'learner' | 'device-global' | 'unknown' | 'profile-scoped'

export class ProfileStorageScopeError extends Error {
  constructor(key: string) {
    super(`Storage key is not a declared learner-owned key: ${key}`)
    this.name = 'ProfileStorageScopeError'
  }
}

export class ProfileWriteRevokedError extends Error {
  constructor() {
    super('Profile-scoped write permission has been revoked.')
    this.name = 'ProfileWriteRevokedError'
  }
}

export function classifyMathAssistStorageKey(key: string): MathAssistStorageScope {
  if (key.startsWith(PROFILE_SCOPED_STORAGE_PREFIX)) return 'profile-scoped'
  if (LEARNER_OWNED_STORAGE_KEYS.has(key) || LEARNER_OWNED_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return 'learner'
  }
  if (key === LOCAL_PROFILE_REGISTRY_KEY || DEVICE_GLOBAL_PATTERNS.some((pattern) => pattern.test(key))) {
    return 'device-global'
  }
  return 'unknown'
}

export function isLearnerOwnedStorageKey(key: string): boolean {
  return classifyMathAssistStorageKey(key) === 'learner'
}

function requireLearnerKey(key: string): void {
  if (!isLearnerOwnedStorageKey(key)) throw new ProfileStorageScopeError(key)
}

function requireProfileId(profileId: string): void {
  if (!isLocalProfileId(profileId)) {
    throw new TypeError('A valid local profile identity is required for scoped storage.')
  }
}

export function createProfileScopedStorageKey(profileId: string, legacyKey: string): string {
  requireProfileId(profileId)
  requireLearnerKey(legacyKey)
  return `${PROFILE_SCOPED_STORAGE_PREFIX}${profileId}:${legacyKey}`
}

export interface ProfileScopedStorageOptions {
  profileId?: string
  writePermission?: () => boolean
}

export interface ProfileScopedStorage {
  readonly profileId: string
  getItem(legacyKey: string): string | null
  setItem(legacyKey: string, value: string): void
  removeItem(legacyKey: string): void
}

export function createProfileScopedStorage(
  storage: ProfileRegistryStorage,
  options: ProfileScopedStorageOptions = {},
): ProfileScopedStorage {
  const registry = parseLocalProfileRegistry(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY))
  if (!registry) throw new ProfileWriteRevokedError()
  const capturedProfileId = options.profileId ?? registry.activeProfileId
  if (!registry.profiles.some((profile) => profile.profileId === capturedProfileId)) {
    throw new ProfileWriteRevokedError()
  }
  const canWrite = options.writePermission ?? (() => true)

  const assertWritePermission = (): void => {
    const current = parseLocalProfileRegistry(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY))
    if (!current || current.activeProfileId !== capturedProfileId || !canWrite()) {
      throw new ProfileWriteRevokedError()
    }
  }

  return {
    profileId: capturedProfileId,
    getItem(legacyKey: string): string | null {
      requireLearnerKey(legacyKey)
      return storage.getItem(createProfileScopedStorageKey(capturedProfileId, legacyKey))
    },
    setItem(legacyKey: string, value: string): void {
      requireLearnerKey(legacyKey)
      assertWritePermission()
      storage.setItem(createProfileScopedStorageKey(capturedProfileId, legacyKey), value)
    },
    removeItem(legacyKey: string): void {
      requireLearnerKey(legacyKey)
      assertWritePermission()
      storage.removeItem(createProfileScopedStorageKey(capturedProfileId, legacyKey))
    },
  }
}
