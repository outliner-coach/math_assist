import {
  LOCAL_PROFILE_REGISTRY_KEY,
  createInitialLocalProfileRegistry,
  isLocalProfileId,
  parseLocalProfileRegistry,
  writeLocalProfileRegistry,
  type LocalProfileIdentityDependencies,
  type LocalProfileMigrationStatus,
  type LocalProfileRegistryV1,
  type ProfileRegistryStorage,
} from './local-profile'
import { loadGrade1Progress } from './grade1-progress'
import { loadGrade2Progress } from './grade2-progress'
import { loadGrade3Progress } from './grade3-progress'
import { loadGrade4Progress } from './grade4-progress'
import { readLearningSetCompletionRecord } from './learning-activity'
import { BACKED_UP_LOCAL_PROGRESS_KEYS } from './local-progress-backup'
import { isMascotId } from './mascot'
import {
  PROFILE_SCOPED_STORAGE_PREFIX,
  classifyMathAssistStorageKey,
  createProfileScopedStorageKey,
} from './profile-scoped-storage'
import { parseSketchDocument, type SketchDocumentKey } from './sketch-document'
import { createSketchStorageKey } from './sketch-repository'

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

type JsonRecord = Record<string, unknown>

const SKETCH_DOCUMENT_PREFIX = 'mathAssist_sketch_v1:'
const SKETCH_INDEX_PREFIX = 'mathAssist_sketch_index_v1:'
const PROGRESS_BACKUP_PREFIX = 'mathAssist_progressBackup_v1:'

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function hasUnsupportedSchemaMarker(value: JsonRecord): boolean {
  return Object.prototype.hasOwnProperty.call(value, 'schemaVersion')
}

function validateWithGradeProgressLoader(
  key: string,
  raw: string,
  loader: (
    storage: { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void },
    now: number,
  ) => { storageAvailable: boolean; recovered: boolean },
): boolean {
  const isolatedStorage = {
    getItem(requestedKey: string) { return requestedKey === key ? raw : null },
    setItem() {},
    removeItem() {},
  }
  const result = loader(isolatedStorage, 0)
  return result.storageAvailable && !result.recovered
}

function isConceptProgressMap(value: unknown): boolean {
  if (!isRecord(value)) return false
  return Object.entries(value).every(([conceptId, summary]) => {
    if (!isRecord(summary)) return false
    const completion = readLearningSetCompletionRecord(summary.completionRecord)
    return summary.conceptId === conceptId
      && Number.isInteger(summary.attemptCount)
      && typeof summary.bestScore === 'number'
      && typeof summary.latestScore === 'number'
      && typeof summary.lastCompletedAt === 'number'
      && typeof summary.needsReview === 'boolean'
      && (summary.lastMode === 'standard' || summary.lastMode === 'retry-wrong')
      && completion.status !== 'corrupt'
      && (summary.legacyCompleted === undefined || typeof summary.legacyCompleted === 'boolean')
  })
}

function hasCompatiblePracticeIdentity(value: JsonRecord, grade: 5 | 6): boolean {
  if (grade === 6) {
    return value.grade === 6 && (value.itemCount === 5 || value.itemCount === 10)
  }
  return (value.grade === undefined || value.grade === 5)
    && (value.itemCount === undefined || value.itemCount === 5 || value.itemCount === 10)
}

function isLegacyProblem(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (!Number.isInteger(value.index) || !isNonEmptyString(value.templateId)) return false
  if (value.setId !== undefined && value.setId !== 'A' && value.setId !== 'B' && value.setId !== 'C') return false
  if (value.type !== 'choice' && value.type !== 'number') return false
  if (typeof value.prompt !== 'string') return false
  if (value.params !== undefined && !isRecord(value.params)) return false
  if (value.correctAnswer !== undefined && typeof value.correctAnswer !== 'string') return false
  if (value.choices !== undefined && (!Array.isArray(value.choices) || !value.choices.every((item) => typeof item === 'string'))) return false
  if (value.solutionSteps !== undefined && (!Array.isArray(value.solutionSteps) || !value.solutionSteps.every((item) => typeof item === 'string'))) return false
  return true
}

function isPracticeSession(value: unknown, grade: 5 | 6): boolean {
  if (!isRecord(value) || hasUnsupportedSchemaMarker(value)) return false
  if (!hasCompatiblePracticeIdentity(value, grade)) return false
  if (!isNonEmptyString(value.sessionId) || !isNonEmptyString(value.conceptId)) return false
  if (value.setId !== 'A' && value.setId !== 'B' && value.setId !== 'C') return false
  if (value.mode !== 'standard' && value.mode !== 'retry-wrong') return false
  if (!Array.isArray(value.problems) || !value.problems.every(isLegacyProblem)) return false
  if (!Array.isArray(value.answers) || value.answers.length !== value.problems.length) return false
  if (!value.answers.every((answer) => answer === null || typeof answer === 'string')) return false
  if (value.checkedAnswers !== undefined && (
    !Array.isArray(value.checkedAnswers)
    || value.checkedAnswers.length !== value.problems.length
    || !value.checkedAnswers.every((answer) => answer === null || typeof answer === 'boolean')
  )) return false
  if (!Number.isInteger(value.currentIndex) || Number(value.currentIndex) < 0) return false
  if (!isFiniteNumber(value.startedAt) || !isFiniteNumber(value.expiresAt)) return false
  if (value.sourceResultId !== undefined && !isNonEmptyString(value.sourceResultId)) return false
  if (value.sourceProblemIndexes !== undefined && (
    !Array.isArray(value.sourceProblemIndexes)
    || !value.sourceProblemIndexes.every((index) => Number.isInteger(index) && Number(index) >= 0)
  )) return false
  return true
}

function isSubmissionResult(value: unknown): boolean {
  if (!isRecord(value)) return false
  return Number.isInteger(value.index)
    && typeof value.correct === 'boolean'
    && (value.userAnswer === null || typeof value.userAnswer === 'string')
    && typeof value.correctAnswer === 'string'
    && Array.isArray(value.solutionSteps)
    && value.solutionSteps.every((step) => typeof step === 'string')
    && isLegacyProblem(value.problem)
}

function isPracticeResult(value: unknown, grade: 5 | 6): boolean {
  if (!isRecord(value) || hasUnsupportedSchemaMarker(value)) return false
  if (!hasCompatiblePracticeIdentity(value, grade)) return false
  return isNonEmptyString(value.sessionId)
    && isNonEmptyString(value.conceptId)
    && (value.setId === 'A' || value.setId === 'B' || value.setId === 'C')
    && (value.mode === 'standard' || value.mode === 'retry-wrong')
    && Number.isInteger(value.score)
    && Number(value.score) >= 0
    && Number.isInteger(value.total)
    && Number(value.total) >= 0
    && Number.isInteger(value.wrongCount)
    && Number(value.wrongCount) >= 0
    && Array.isArray(value.results)
    && value.results.every(isSubmissionResult)
    && isFiniteNumber(value.completedAt)
}

function isGuestHomePreferences(value: unknown): boolean {
  return isRecord(value)
    && !hasUnsupportedSchemaMarker(value)
    && [1, 2, 3, 4, 5, 6].includes(value.activeGrade as number)
}

function isAttemptReceipt(value: unknown): value is JsonRecord {
  if (!isRecord(value)) return false
  return value.schemaVersion === 1
    && isNonEmptyString(value.attemptId)
    && (value.learnerId === null || isNonEmptyString(value.learnerId))
    && isNonEmptyString(value.sessionId)
    && isNonEmptyString(value.activityId)
    && [1, 2, 3, 4, 5, 6].includes(value.grade as number)
    && isNonEmptyString(value.itemId)
    && Number.isSafeInteger(value.attemptOrdinal)
    && Number(value.attemptOrdinal) >= 0
    && isNonEmptyString(value.variantKey)
    && isNonEmptyString(value.contentReleaseId)
    && typeof value.correct === 'boolean'
    && typeof value.usedHint === 'boolean'
    && isFiniteNumber(value.checkedAt)
    && isNonEmptyString(value.dedupeKey)
}

function isAttemptReceiptLedger(value: unknown): boolean {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.receipts)) return false
  if (!value.receipts.every(isAttemptReceipt)) return false
  const attemptIds = value.receipts.map((receipt) => receipt.attemptId)
  return new Set(attemptIds).size === attemptIds.length
}

function isMascotPreference(value: unknown): boolean {
  return isRecord(value) && !hasUnsupportedSchemaMarker(value) && isMascotId(value.avatarId)
}

function isProfileSessionLease(value: unknown): boolean {
  if (!isRecord(value)) return false
  return value.schemaVersion === 1
    && isLocalProfileId(value.profileId)
    && isNonEmptyString(value.holderId)
    && Number.isSafeInteger(value.acquiredAt)
    && Number(value.acquiredAt) >= 0
    && Number.isSafeInteger(value.expiresAt)
    && Number(value.expiresAt) > Number(value.acquiredAt)
}

function decodeKeyIdentity(key: string, prefix: string, expectedLength: number): unknown[] | null {
  try {
    const suffix = key.slice(prefix.length)
    const parsed: unknown = JSON.parse(decodeURIComponent(suffix))
    return Array.isArray(parsed) && parsed.length === expectedLength ? parsed : null
  } catch {
    return null
  }
}

function isSketchDocumentValue(key: string, raw: string): boolean {
  const identity = decodeKeyIdentity(key, SKETCH_DOCUMENT_PREFIX, 3)
  if (!identity) return false
  const [learnerId, sessionId, itemId] = identity
  const expectedKey: SketchDocumentKey = {
    learnerId: learnerId === null ? null : typeof learnerId === 'string' ? learnerId : '',
    sessionId: typeof sessionId === 'string' ? sessionId : '',
    itemId: typeof itemId === 'string' ? itemId : '',
  }
  try {
    return key === createSketchStorageKey(expectedKey)
      && parseSketchDocument(raw, expectedKey) !== null
  } catch {
    return false
  }
}

function isSketchIndexEntry(value: unknown, learnerId: string | null): boolean {
  if (!isRecord(value)) return false
  if (value.learnerId !== learnerId || !isNonEmptyString(value.sessionId) || !isNonEmptyString(value.itemId)) return false
  if (!isNonEmptyString(value.storageKey) || !isFiniteNumber(value.updatedAt)) return false
  try {
    return value.storageKey === createSketchStorageKey({
      learnerId,
      sessionId: value.sessionId,
      itemId: value.itemId,
    })
  } catch {
    return false
  }
}

function isSketchIndexValue(key: string, value: unknown): boolean {
  const identity = decodeKeyIdentity(key, SKETCH_INDEX_PREFIX, 1)
  if (!identity) return false
  const learnerId = identity[0]
  if (learnerId !== null && !isNonEmptyString(learnerId)) return false
  const canonicalKey = `${SKETCH_INDEX_PREFIX}${encodeURIComponent(JSON.stringify([learnerId]))}`
  return key === canonicalKey
    && Array.isArray(value)
    && value.every((entry) => isSketchIndexEntry(entry, learnerId))
}

function isProgressBackupValue(key: string, value: unknown): boolean {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isFiniteNumber(value.createdAt)) return false
  if (value.createdAt < 0 || key.slice(PROGRESS_BACKUP_PREFIX.length) !== String(value.createdAt)) return false
  if (!isRecord(value.values)) return false
  const backupValues = value.values
  return BACKED_UP_LOCAL_PROGRESS_KEYS.every((learnerKey) => (
    backupValues[learnerKey] === null || typeof backupValues[learnerKey] === 'string'
  ))
}

function isValidLegacyValue(key: string, raw: string, value: unknown): boolean {
  switch (key) {
    case 'mathAssist_grade1Progress':
      return validateWithGradeProgressLoader(key, raw, loadGrade1Progress)
    case 'mathAssist_grade2Progress':
      return validateWithGradeProgressLoader(key, raw, loadGrade2Progress)
    case 'mathAssist_grade3Progress':
      return validateWithGradeProgressLoader(key, raw, loadGrade3Progress)
    case 'mathAssist_grade4Progress':
      return validateWithGradeProgressLoader(key, raw, loadGrade4Progress)
    case 'mathAssist_progress_v1':
    case 'mathAssist_grade6Progress':
      return isConceptProgressMap(value)
    case 'mathAssist_currentSession':
      return isPracticeSession(value, 5)
    case 'mathAssist_grade6CurrentSession':
      return isPracticeSession(value, 6)
    case 'mathAssist_lastResult':
      return isPracticeResult(value, 5)
    case 'mathAssist_grade6LastResult':
      return isPracticeResult(value, 6)
    case 'mathAssist_guestHome_v1':
      return isGuestHomePreferences(value)
    case 'mathAssist_attemptReceipts_v1':
      return isAttemptReceiptLedger(value)
    case 'mathAssist_mascot_v1':
      return isMascotPreference(value)
    case 'mathAssist_profileSessionLease_v1':
      return isProfileSessionLease(value)
    default:
      if (key.startsWith(SKETCH_DOCUMENT_PREFIX)) return isSketchDocumentValue(key, raw)
      if (key.startsWith(SKETCH_INDEX_PREFIX)) return isSketchIndexValue(key, value)
      if (key.startsWith(PROGRESS_BACKUP_PREFIX)) return isProgressBackupValue(key, value)
      return false
  }
}

function projectLegacyValue(key: string, raw: string): LegacyEntry['projection'] | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isValidLegacyValue(key, raw, parsed)) return null
    return Array.isArray(parsed) ? 'array' : 'object'
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
