import {
  LOCAL_PROFILE_REGISTRY_KEY,
  createInitialLocalProfileRegistry,
  parseLocalProfileRegistry,
  writeLocalProfileRegistry,
  type LocalProfileIdentityDependencies,
  type LocalProfileMigrationStatus,
  type LocalProfileRegistryV1,
  type ProfileRegistryStorage,
} from './local-profile'
import {
  PROFILE_SCOPED_STORAGE_PREFIX,
  classifyMathAssistStorageKey,
  createProfileScopedStorageKey,
} from './profile-scoped-storage'

export interface EnumerableProfileMigrationStorage extends ProfileRegistryStorage {
  readonly length: number
  key(index: number): string | null
}

export interface ProfileMigrationResult {
  status: LocalProfileMigrationStatus
  registry: LocalProfileRegistryV1
  copiedKeys: number
  failedKeys: string[]
}

interface LegacyEntry {
  key: string
  raw: string
  hash: string
  projection: 'object' | 'array'
}

interface ProfileMigrationRecoveryBackupV1 {
  schemaVersion: 1
  profileId: string
  createdAt: number
  values: Record<string, string>
  entries: Array<Pick<LegacyEntry, 'key' | 'hash' | 'projection'>>
}

export function hashProfileStorageBytes(raw: string): string {
  let hash = 0x811c9dc5
  for (const byte of Array.from(new TextEncoder().encode(raw))) {
    hash ^= byte
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function projectLegacyValue(key: string, raw: string): LegacyEntry['projection'] | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (key.startsWith('mathAssist_sketch_index_v1:')) {
      return Array.isArray(parsed) ? 'array' : null
    }
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? 'object' : null
  } catch {
    return null
  }
}

function storageKeys(storage: EnumerableProfileMigrationStorage): string[] {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key !== null) keys.push(key)
  }
  return Array.from(new Set(keys)).sort()
}

function discoverLegacyEntries(storage: EnumerableProfileMigrationStorage): {
  entries: LegacyEntry[]
  invalidKeys: string[]
  hasLegacyCandidate: boolean
} {
  const entries: LegacyEntry[] = []
  const invalidKeys: string[] = []
  let hasLegacyCandidate = false

  for (const key of storageKeys(storage)) {
    if (key === LOCAL_PROFILE_REGISTRY_KEY || key.startsWith(PROFILE_SCOPED_STORAGE_PREFIX)) continue
    if (!key.startsWith('mathAssist_')) continue
    const scope = classifyMathAssistStorageKey(key)
    if (scope === 'device-global') continue
    hasLegacyCandidate = true
    if (scope !== 'learner') {
      invalidKeys.push(key)
      continue
    }
    const raw = storage.getItem(key)
    if (raw === null) continue
    const projection = projectLegacyValue(key, raw)
    if (!projection) {
      invalidKeys.push(key)
      continue
    }
    entries.push({ key, raw, hash: hashProfileStorageBytes(raw), projection })
  }

  return { entries, invalidKeys, hasLegacyCandidate }
}

function migrationBackupKey(profileId: string, createdAt: number): string {
  return createProfileScopedStorageKey(
    profileId,
    `mathAssist_progressBackup_v1:profile-migration-v1:${createdAt}`,
  )
}

function asCopyingRegistry(
  registry: LocalProfileRegistryV1,
  backupKey: string,
): LocalProfileRegistryV1 {
  return {
    ...registry,
    migration: {
      schemaVersion: 1,
      status: 'copying',
      targetProfileId: registry.migration.targetProfileId,
      backupKey,
    },
  }
}

function finishRegistry(
  registry: LocalProfileRegistryV1,
  status: 'verified' | 'failed',
): LocalProfileRegistryV1 {
  return { ...registry, migration: { ...registry.migration, status } }
}

function backupFor(
  entries: LegacyEntry[],
  profileId: string,
  createdAt: number,
): ProfileMigrationRecoveryBackupV1 {
  return {
    schemaVersion: 1,
    profileId,
    createdAt,
    values: Object.fromEntries(entries.map((entry) => [entry.key, entry.raw])),
    entries: entries.map(({ key, hash, projection }) => ({ key, hash, projection })),
  }
}

function isMatchingBackup(raw: string, entries: LegacyEntry[], profileId: string): boolean {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false
    const candidate = parsed as Partial<ProfileMigrationRecoveryBackupV1>
    if (candidate.schemaVersion !== 1 || candidate.profileId !== profileId) return false
    if (!candidate.values || typeof candidate.values !== 'object' || Array.isArray(candidate.values)) return false
    if (!Array.isArray(candidate.entries) || candidate.entries.length !== entries.length) return false
    const values = candidate.values as Record<string, unknown>
    const expectedKeys = new Set(entries.map((entry) => entry.key))
    const backupKeys = Object.keys(values)
    const entryKeys = candidate.entries.map((entry) => entry.key)
    return backupKeys.length === entries.length &&
      backupKeys.every((key) => expectedKeys.has(key)) &&
      new Set(entryKeys).size === entries.length &&
      entries.every((entry) => values[entry.key] === entry.raw) &&
      candidate.entries.every((item) => {
        if (!item || typeof item !== 'object') return false
        const expected = entries.find((entry) => entry.key === item.key)
        return Boolean(expected && expected.hash === item.hash && expected.projection === item.projection)
      })
  } catch {
    return false
  }
}

function storeFailedRegistry(
  storage: EnumerableProfileMigrationStorage,
  registry: LocalProfileRegistryV1,
): LocalProfileRegistryV1 {
  const failed = finishRegistry(registry, 'failed')
  try {
    writeLocalProfileRegistry(storage, failed)
  } catch {
    // The caller still receives failure. The last persisted pending/copying
    // state keeps the same target identity available for a later retry.
  }
  return failed
}

export function migrateLegacyLearnerStorage(
  storage: EnumerableProfileMigrationStorage,
  dependencies: LocalProfileIdentityDependencies = {},
): ProfileMigrationResult {
  const registryRaw = storage.getItem(LOCAL_PROFILE_REGISTRY_KEY)
  let registry = parseLocalProfileRegistry(registryRaw)
  if (registryRaw !== null && !registry) {
    throw new Error('The local profile registry is corrupt; migration is blocked without overwriting it.')
  }

  const discovery = discoverLegacyEntries(storage)
  if (!registry) {
    registry = createInitialLocalProfileRegistry({
      ...dependencies,
      migrationStatus: discovery.hasLegacyCandidate ? 'pending' : 'not-needed',
    })
    writeLocalProfileRegistry(storage, registry)
  }

  if (registry.migration.status === 'verified' || registry.migration.status === 'not-needed') {
    return {
      status: registry.migration.status,
      registry,
      copiedKeys: 0,
      failedKeys: [],
    }
  }

  if (discovery.invalidKeys.length > 0) {
    const failed = storeFailedRegistry(storage, registry)
    return { status: 'failed', registry: failed, copiedKeys: 0, failedKeys: discovery.invalidKeys }
  }

  const targetProfileId = registry.migration.targetProfileId
  if (!targetProfileId || !registry.profiles.some((profile) => profile.profileId === targetProfileId)) {
    const failed = storeFailedRegistry(storage, registry)
    return { status: 'failed', registry: failed, copiedKeys: 0, failedKeys: [LOCAL_PROFILE_REGISTRY_KEY] }
  }

  const createdAt = registry.profiles.find((profile) => profile.profileId === targetProfileId)!.createdAt
  const backupKey = registry.migration.backupKey ?? migrationBackupKey(targetProfileId, createdAt)
  registry = asCopyingRegistry(registry, backupKey)
  try {
    writeLocalProfileRegistry(storage, registry)
  } catch {
    const failed = finishRegistry(registry, 'failed')
    return { status: 'failed', registry: failed, copiedKeys: 0, failedKeys: [LOCAL_PROFILE_REGISTRY_KEY] }
  }

  let copiedKeys = 0
  try {
    const existingBackup = storage.getItem(backupKey)
    if (existingBackup === null) {
      storage.setItem(backupKey, JSON.stringify(backupFor(discovery.entries, targetProfileId, createdAt)))
    } else if (!isMatchingBackup(existingBackup, discovery.entries, targetProfileId)) {
      throw new Error(backupKey)
    }

    for (const entry of discovery.entries) {
      const scopedKey = createProfileScopedStorageKey(targetProfileId, entry.key)
      const existing = storage.getItem(scopedKey)
      if (existing !== null && existing !== entry.raw) throw new Error(scopedKey)
      if (existing === null) storage.setItem(scopedKey, entry.raw)
      copiedKeys += 1
    }

    const storedBackup = storage.getItem(backupKey)
    if (storedBackup === null || !isMatchingBackup(storedBackup, discovery.entries, targetProfileId)) {
      throw new Error(backupKey)
    }
    for (const entry of discovery.entries) {
      const scopedKey = createProfileScopedStorageKey(targetProfileId, entry.key)
      const copied = storage.getItem(scopedKey)
      const source = storage.getItem(entry.key)
      if (source !== entry.raw || hashProfileStorageBytes(source) !== entry.hash) {
        throw new Error(entry.key)
      }
      if (copied !== entry.raw || hashProfileStorageBytes(copied) !== entry.hash) {
        throw new Error(scopedKey)
      }
      if (projectLegacyValue(entry.key, copied) !== entry.projection) throw new Error(scopedKey)
    }
  } catch (error) {
    const failedKey = error instanceof Error && error.message ? error.message : 'storage-write'
    const failed = storeFailedRegistry(storage, registry)
    return { status: 'failed', registry: failed, copiedKeys, failedKeys: [failedKey] }
  }

  const verified = finishRegistry(registry, 'verified')
  try {
    writeLocalProfileRegistry(storage, verified)
  } catch {
    const failed = finishRegistry(registry, 'failed')
    return { status: 'failed', registry: failed, copiedKeys, failedKeys: [LOCAL_PROFILE_REGISTRY_KEY] }
  }
  return { status: 'verified', registry: verified, copiedKeys, failedKeys: [] }
}
