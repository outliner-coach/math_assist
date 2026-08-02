export const LOCAL_PROFILE_REGISTRY_KEY = 'mathAssist_profiles_v1'
export const DEFAULT_MAX_LOCAL_PROFILES = 6

export type LocalProfileMigrationStatus =
  | 'not-needed'
  | 'pending'
  | 'copying'
  | 'verified'
  | 'failed'

export interface LocalProfileRegistryV1 {
  schemaVersion: 1
  activeProfileId: string
  profiles: Array<{
    profileId: string
    nickname: string | null
    createdAt: number
    updatedAt: number
  }>
  migration: {
    schemaVersion: 1
    status: LocalProfileMigrationStatus
    targetProfileId: string | null
    backupKey: string | null
  }
}

export interface ProfileRegistryStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface LocalProfileIdentityDependencies {
  now?: () => number
  randomUUID?: () => string
}

export interface InitialLocalProfileRegistryOptions extends LocalProfileIdentityDependencies {
  migrationStatus: 'not-needed' | 'pending'
}

const LOCAL_PROFILE_ID_PATTERN = /^local_[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MIGRATION_STATUSES = new Set<LocalProfileMigrationStatus>([
  'not-needed',
  'pending',
  'copying',
  'verified',
  'failed',
])

function systemRandomUUID(): string {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('crypto.randomUUID() is required to create a local learner profile.')
  }
  return globalThis.crypto.randomUUID()
}

function requireTimestamp(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError('Profile timestamps must be non-negative safe integer milliseconds.')
  }
  return value
}

function requireProfileId(randomUUID: () => string): string {
  const profileId = `local_${randomUUID()}`
  if (!isLocalProfileId(profileId)) {
    throw new TypeError('Profile identity must be local_ followed by a UUID.')
  }
  return profileId
}

export function isLocalProfileId(value: unknown): value is string {
  return typeof value === 'string' && LOCAL_PROFILE_ID_PATTERN.test(value)
}

function normalizeNickname(nickname: string | null): string | null {
  if (nickname === null) return null
  if (typeof nickname !== 'string') throw new TypeError('Nickname must be a string or null.')
  const normalized = nickname.trim()
  const length = Array.from(normalized).length
  if (length < 1 || length > 20) {
    throw new TypeError('Nickname must contain 1 to 20 trimmed characters.')
  }
  return normalized
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isStoredNickname(value: unknown): value is string | null {
  if (value === null) return true
  if (typeof value !== 'string' || value !== value.trim()) return false
  const length = Array.from(value).length
  return length >= 1 && length <= 20
}

export function isLocalProfileRegistry(value: unknown): value is LocalProfileRegistryV1 {
  if (!isRecord(value) || value.schemaVersion !== 1) return false
  if (!isLocalProfileId(value.activeProfileId)) {
    return false
  }
  if (!Array.isArray(value.profiles) || value.profiles.length === 0) return false

  const profileIds = new Set<string>()
  for (const item of value.profiles) {
    if (!isRecord(item)) return false
    if (!isLocalProfileId(item.profileId)) return false
    if (profileIds.has(item.profileId)) return false
    if (!isStoredNickname(item.nickname)) return false
    if (!isTimestamp(item.createdAt) || !isTimestamp(item.updatedAt) || item.updatedAt < item.createdAt) {
      return false
    }
    profileIds.add(item.profileId)
  }
  if (!profileIds.has(value.activeProfileId)) return false

  if (!isRecord(value.migration) || value.migration.schemaVersion !== 1) return false
  if (!MIGRATION_STATUSES.has(value.migration.status as LocalProfileMigrationStatus)) return false
  const status = value.migration.status as LocalProfileMigrationStatus
  const targetProfileId = value.migration.targetProfileId
  const backupKey = value.migration.backupKey
  if (targetProfileId !== null && (typeof targetProfileId !== 'string' || !profileIds.has(targetProfileId))) {
    return false
  }
  if (backupKey !== null && (typeof backupKey !== 'string' || backupKey.length === 0)) return false
  if (status === 'not-needed' && (targetProfileId !== null || backupKey !== null)) return false
  if (status !== 'not-needed' && targetProfileId === null) return false
  if (status === 'verified' && backupKey === null) return false
  return true
}

export function parseLocalProfileRegistry(raw: string | null): LocalProfileRegistryV1 | null {
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isLocalProfileRegistry(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function createInitialLocalProfileRegistry(
  options: InitialLocalProfileRegistryOptions,
): LocalProfileRegistryV1 {
  const now = requireTimestamp((options.now ?? Date.now)())
  const profileId = requireProfileId(options.randomUUID ?? systemRandomUUID)
  const migrationNeeded = options.migrationStatus === 'pending'
  return {
    schemaVersion: 1,
    activeProfileId: profileId,
    profiles: [{ profileId, nickname: null, createdAt: now, updatedAt: now }],
    migration: {
      schemaVersion: 1,
      status: options.migrationStatus,
      targetProfileId: migrationNeeded ? profileId : null,
      backupKey: null,
    },
  }
}

export function addLocalProfile(
  registry: LocalProfileRegistryV1,
  nickname: string | null,
  dependencies: LocalProfileIdentityDependencies = {},
  maxProfiles = DEFAULT_MAX_LOCAL_PROFILES,
): LocalProfileRegistryV1 {
  if (!isLocalProfileRegistry(registry)) throw new TypeError('A valid profile registry is required.')
  if (!Number.isSafeInteger(maxProfiles) || maxProfiles < 1) {
    throw new TypeError('Maximum profile count must be a positive safe integer.')
  }
  if (registry.profiles.length >= maxProfiles) {
    throw new RangeError(`The maximum of ${maxProfiles} local profiles has been reached.`)
  }
  const now = requireTimestamp((dependencies.now ?? Date.now)())
  const profileId = requireProfileId(dependencies.randomUUID ?? systemRandomUUID)
  if (registry.profiles.some((profile) => profile.profileId === profileId)) {
    throw new Error('Generated profile identity already exists.')
  }
  return {
    ...registry,
    profiles: [...registry.profiles, {
      profileId,
      nickname: normalizeNickname(nickname),
      createdAt: now,
      updatedAt: now,
    }],
  }
}

export function renameLocalProfile(
  registry: LocalProfileRegistryV1,
  profileId: string,
  nickname: string | null,
  now: () => number = Date.now,
): LocalProfileRegistryV1 {
  if (!isLocalProfileRegistry(registry)) throw new TypeError('A valid profile registry is required.')
  const index = registry.profiles.findIndex((profile) => profile.profileId === profileId)
  if (index < 0) throw new RangeError('Profile identity is not present in the registry.')
  const timestamp = requireTimestamp(now())
  const normalized = normalizeNickname(nickname)
  const profiles = registry.profiles.map((profile, profileIndex) => profileIndex === index
    ? { ...profile, nickname: normalized, updatedAt: Math.max(profile.updatedAt, timestamp) }
    : profile)
  return { ...registry, profiles }
}

export function activateLocalProfile(
  registry: LocalProfileRegistryV1,
  profileId: string,
): LocalProfileRegistryV1 {
  if (!isLocalProfileRegistry(registry)) throw new TypeError('A valid profile registry is required.')
  if (!registry.profiles.some((profile) => profile.profileId === profileId)) {
    throw new RangeError('Profile identity is not present in the registry.')
  }
  return registry.activeProfileId === profileId ? registry : { ...registry, activeProfileId: profileId }
}

export function getLocalProfileDisplayLabel(
  registry: LocalProfileRegistryV1,
  profileId: string,
): string {
  if (!isLocalProfileRegistry(registry)) throw new TypeError('A valid profile registry is required.')
  const index = registry.profiles.findIndex((profile) => profile.profileId === profileId)
  if (index < 0) throw new RangeError('Profile identity is not present in the registry.')
  return registry.profiles[index].nickname ?? `학습자 ${index + 1}`
}

export function readLocalProfileRegistry(storage: Pick<ProfileRegistryStorage, 'getItem'>): LocalProfileRegistryV1 | null {
  return parseLocalProfileRegistry(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY))
}

export function writeLocalProfileRegistry(
  storage: Pick<ProfileRegistryStorage, 'setItem'>,
  registry: LocalProfileRegistryV1,
): void {
  if (!isLocalProfileRegistry(registry)) throw new TypeError('Refusing to store an invalid profile registry.')
  storage.setItem(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(registry))
}
