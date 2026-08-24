import {
  DEFAULT_MAX_LOCAL_PROFILES,
  LOCAL_PROFILE_REGISTRY_KEY,
  isLocalProfileId,
  isLocalProfileRegistry,
  parseLocalProfileRegistry,
  type ProfileRegistryStorage,
} from './local-profile'
import { ATTEMPT_RECEIPT_STORAGE_KEY, type AttemptReceipt } from './attempt-receipt'
import {
  GRADE1_PROGRESS_KEY,
  loadGrade1Progress,
  saveGrade1Progress,
  type Grade1Progress,
} from './grade1-progress'
import {
  GRADE2_PROGRESS_KEY,
  loadGrade2Progress,
  saveGrade2Progress,
  type Grade2Progress,
} from './grade2-progress'
import {
  GRADE3_PROGRESS_KEY,
  loadGrade3Progress,
  saveGrade3Progress,
  type Grade3Progress,
} from './grade3-progress'
import {
  GRADE4_PROGRESS_KEY,
  loadGrade4Progress,
  saveGrade4Progress,
  type Grade4Progress,
} from './grade4-progress'
import { GRADE5_PROGRESS_KEY, GRADE6_PROGRESS_KEY, projectConceptProgressCompletion } from './progress'
import { GUEST_HOME_PREFERENCES_KEY } from './guest-home'
import { LEARNING_GRADES, type LearningGrade } from './learning-activity'
import { DEFAULT_MASCOT_ID, isMascotId, type MascotId } from './mascot'
import { createLocalProgressRepository, type ReadonlyLearningStorage } from './local-progress-repository'
import { createProfileScopedStorageKey } from './profile-scoped-storage'

/**
 * T4 portable profile transfer (spec §6).
 *
 * Exports contain ONLY: per-grade completion projections, attempt receipts,
 * home recent activity and the mascot choice. Answer texts, live sessions,
 * result snapshots, scratch strokes, internal backups and device identifiers
 * are structurally excluded: this module reads a fixed allow-list of scoped
 * keys and projects them into the closed PortableProfileExportV1 shape.
 *
 * Cache Storage / service-worker cleanup is owned by the offline task; this
 * module never touches it.
 */

export const PORTABLE_PROFILE_FORMAT = 'math-assist-profile' as const
export const MAX_PORTABLE_PROFILE_BYTES = 5 * 1024 * 1024
export const MAX_PORTABLE_RECEIPTS = 10_000
export const MAX_FUTURE_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1_000
const MAX_IDENTIFIER_LENGTH = 256
const MAX_IDS_PER_LIST = 10_000

export type ProfileTransferErrorCode =
  | 'NOT_VALID_JSON'
  | 'FILE_TOO_LARGE'
  | 'FORMAT_UNSUPPORTED'
  | 'SCHEMA_VERSION_UNSUPPORTED'
  | 'TOP_LEVEL_SHAPE_INVALID'
  | 'EXPORTED_AT_INVALID'
  | 'APP_RELEASE_INVALID'
  | 'CONTENT_RELEASE_INVALID'
  | 'PROFILE_BLOCK_INVALID'
  | 'PROFILE_ID_INVALID'
  | 'NICKNAME_INVALID'
  | 'LEARNING_SHAPE_INVALID'
  | 'GRADE_PROGRESS_SHAPE_INVALID'
  | 'GRADE_SET_INVALID'
  | 'COMPLETED_IDS_INVALID'
  | 'REVIEW_IDS_INVALID'
  | 'SET_COMPLETION_INVALID'
  | 'RECEIPTS_SHAPE_INVALID'
  | 'RECEIPTS_COUNT_EXCEEDED'
  | 'RECEIPT_INVALID'
  | 'RECEIPT_ATTEMPT_DUPLICATE'
  | 'RECEIPT_ORDER_INVALID'
  | 'RECEIPT_LEARNER_MISMATCH'
  | 'RECENT_ACTIVITY_INVALID'
  | 'MASCOT_ID_INVALID'
  | 'DIGEST_SHAPE_INVALID'
  | 'DIGEST_MISMATCH'
  | 'RECEIPT_CONTENT_CONFLICT'
  | 'MASCOT_CHOICE_REQUIRED'
  | 'PROFILE_LIMIT_REACHED'
  | 'APPLY_WRITE_FAILED'
  | 'EXPORT_PROFILE_NOT_FOUND'

export const PROFILE_TRANSFER_ERROR_CODES = [
  'NOT_VALID_JSON',
  'FILE_TOO_LARGE',
  'FORMAT_UNSUPPORTED',
  'SCHEMA_VERSION_UNSUPPORTED',
  'TOP_LEVEL_SHAPE_INVALID',
  'EXPORTED_AT_INVALID',
  'APP_RELEASE_INVALID',
  'CONTENT_RELEASE_INVALID',
  'PROFILE_BLOCK_INVALID',
  'PROFILE_ID_INVALID',
  'NICKNAME_INVALID',
  'LEARNING_SHAPE_INVALID',
  'GRADE_PROGRESS_SHAPE_INVALID',
  'GRADE_SET_INVALID',
  'COMPLETED_IDS_INVALID',
  'REVIEW_IDS_INVALID',
  'SET_COMPLETION_INVALID',
  'RECEIPTS_SHAPE_INVALID',
  'RECEIPTS_COUNT_EXCEEDED',
  'RECEIPT_INVALID',
  'RECEIPT_ATTEMPT_DUPLICATE',
  'RECEIPT_ORDER_INVALID',
  'RECEIPT_LEARNER_MISMATCH',
  'RECENT_ACTIVITY_INVALID',
  'MASCOT_ID_INVALID',
  'DIGEST_SHAPE_INVALID',
  'DIGEST_MISMATCH',
  'RECEIPT_CONTENT_CONFLICT',
  'MASCOT_CHOICE_REQUIRED',
  'PROFILE_LIMIT_REACHED',
  'APPLY_WRITE_FAILED',
  'EXPORT_PROFILE_NOT_FOUND',
] as const satisfies readonly ProfileTransferErrorCode[]

export class ProfileTransferError extends Error {
  readonly errorCode: ProfileTransferErrorCode

  constructor(errorCode: ProfileTransferErrorCode, message?: string) {
    super(message ?? errorCode)
    this.name = 'ProfileTransferError'
    this.errorCode = errorCode
  }
}

export type PortableGradeValue = LearningGrade

export interface PortableSetCompletionEntryV1 {
  activityId: string
  hasCompletedBasicSet: boolean
  hasCompletedPracticeSet: boolean
  legacyCompleted: boolean
}

export interface PortableGradeProgressV1 {
  grade: PortableGradeValue
  completedIds: string[]
  reviewIds: string[]
  setCompletion: PortableSetCompletionEntryV1[]
}

export interface PortableRecentActivityV1 {
  grade: PortableGradeValue
  activityId: string
  at: number
}

export interface PortableProfileLearningV1 {
  gradeProgress: PortableGradeProgressV1[]
  receipts: AttemptReceipt[]
  recentActivity: PortableRecentActivityV1 | null
  mascotId: MascotId
}

export interface PortableProfileExportV1 {
  format: typeof PORTABLE_PROFILE_FORMAT
  schemaVersion: 1
  exportedAt: number
  appRelease: string
  contentRelease: string
  profile: { profileId: string; nickname: string | null }
  learning: PortableProfileLearningV1
  digest: { algorithm: 'SHA-256'; value: string }
}

export interface ProfileImportPreviewV1 {
  status: 'invalid' | 'new-profile' | 'merge' | 'mascot-choice'
  targetProfileId: string | null
  completedAdded: number
  reviewAdded: number
  reviewRemoved: number
  receiptsAdded: number
  recentActivityChanged: boolean
  mascot: { local: MascotId; imported: MascotId } | null
  errors: string[]
}

export interface ProfileImportApplyResult {
  status: 'applied' | 'blocked' | 'failed'
  errorCode: ProfileTransferErrorCode | null
  errors: string[]
  restoredFromBackup: boolean
  targetProfileId: string | null
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/** Canonical serialization: recursively key-sorted JSON (repo convention). */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const entries = Object.entries(value as JsonRecord)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`
}

async function webCryptoSha256Hex(input: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('Web Crypto SHA-256 is required for portable profile digests.')
  const bytes = new TextEncoder().encode(input)
  const digestBuffer = await subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digestBuffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function byteLengthUtf8(raw: string): number {
  return new TextEncoder().encode(raw).length
}

function isBoundedString(value: unknown, maxLength = MAX_IDENTIFIER_LENGTH): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

function isNonNegativeSafeIntegerNotFarFuture(value: unknown, now: number): value is number {
  return typeof value === 'number'
    && Number.isSafeInteger(value)
    && value >= 0
    && value <= now + MAX_FUTURE_TIMESTAMP_TOLERANCE_MS
}

// ---------------------------------------------------------------------------
// Export builder
// ---------------------------------------------------------------------------

export interface PortableProfileExportDependencies {
  storage: ProfileRegistryStorage
  now?: () => number
  appRelease?: string
  contentRelease?: string
  sha256Hex?: (canonical: string) => Promise<string>
}

const MASCOT_PREFERENCE_KEY = 'mathAssist_mascot_v1'

interface SetFlags {
  hasCompletedBasicSet: boolean
  hasCompletedPracticeSet: boolean
  legacyCompleted: boolean
}

interface GradeProjectionSnapshot {
  completedIds: string[]
  reviewIds: string[]
  setCompletion: PortableSetCompletionEntryV1[]
}

const GRADE_PROGRESS_KEYS: Record<PortableGradeValue, string> = {
  1: GRADE1_PROGRESS_KEY,
  2: GRADE2_PROGRESS_KEY,
  3: GRADE3_PROGRESS_KEY,
  4: GRADE4_PROGRESS_KEY,
  5: GRADE5_PROGRESS_KEY,
  6: GRADE6_PROGRESS_KEY,
}

function readScopedRaw(storage: ProfileRegistryStorage, profileId: string, legacyKey: string): string | null {
  return storage.getItem(createProfileScopedStorageKey(profileId, legacyKey))
}

function readMascotId(raw: string | null): MascotId {
  if (raw === null) return DEFAULT_MASCOT_ID
  try {
    const parsed: unknown = JSON.parse(raw)
    return isRecord(parsed) && isMascotId(parsed.avatarId) ? parsed.avatarId : DEFAULT_MASCOT_ID
  } catch {
    return DEFAULT_MASCOT_ID
  }
}

function collectGradeSnapshots(
  storage: ProfileRegistryStorage,
  profileId: string,
  now: number,
): {
  snapshots: Record<PortableGradeValue, GradeProjectionSnapshot>
  resumeIds: Record<PortableGradeValue, string | null>
  lastPlayedAt: Record<PortableGradeValue, number | null>
} {
  const scopedView: ReadonlyLearningStorage = {
    getItem: (legacyKey: string) => readScopedRaw(storage, profileId, legacyKey),
  }
  const repository = createLocalProgressRepository(scopedView)
  const snapshots = {} as Record<PortableGradeValue, GradeProjectionSnapshot>
  const resumeIds = {} as Record<PortableGradeValue, string | null>
  const lastPlayedAt = {} as Record<PortableGradeValue, number | null>

  for (const grade of LEARNING_GRADES) {
    const projection = repository.readProgress(grade, now)
    const completed = projection.corrupted ? [] : [...projection.completed].sort()
    const review = projection.corrupted ? [] : [...projection.review].sort()
    const setCompletion: PortableSetCompletionEntryV1[] = []
    if (!projection.corrupted) {
      for (const [activityId, completion] of Object.entries(projection.completionByActivityId)) {
        if (!(completion.hasCompletedBasicSet || completion.hasCompletedPracticeSet || completion.isComplete)) {
          continue
        }
        setCompletion.push({
          activityId,
          hasCompletedBasicSet: completion.hasCompletedBasicSet,
          hasCompletedPracticeSet: completion.hasCompletedPracticeSet,
          // isComplete without practice evidence can only come from the legacy
          // fact; exporting it that way preserves completion under OR merges.
          legacyCompleted: completion.isComplete && !completion.hasCompletedPracticeSet,
        })
      }
      setCompletion.sort((left, right) => (left.activityId < right.activityId ? -1 : 1))
    }
    snapshots[grade] = { completedIds: completed, reviewIds: review, setCompletion }
    resumeIds[grade] = projection.resume?.activityId ?? completed[0] ?? review[0] ?? null
    lastPlayedAt[grade] = projection.lastActivityAt
  }
  return { snapshots, resumeIds, lastPlayedAt }
}

function pickRecentActivity(
  snapshots: Record<PortableGradeValue, GradeProjectionSnapshot>,
  resumeIds: Record<PortableGradeValue, string | null>,
  lastPlayedAt: Record<PortableGradeValue, number | null>,
): PortableRecentActivityV1 | null {
  let winner: PortableRecentActivityV1 | null = null
  for (const grade of LEARNING_GRADES) {
    const at = lastPlayedAt[grade]
    const activityId = resumeIds[grade]
    if (at === null || !Number.isSafeInteger(at) || at < 0 || activityId === null) continue
    const candidate: PortableRecentActivityV1 = { grade, activityId, at }
    if (winner === null || candidate.at > winner.at) winner = candidate
  }
  return winner
}

function collectExportableReceipts(
  storage: ProfileRegistryStorage,
  profileId: string,
  now: number,
): AttemptReceipt[] {
  const raw = readScopedRaw(storage, profileId, ATTEMPT_RECEIPT_STORAGE_KEY)
  if (raw === null) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.receipts)) return []
  const receipts: AttemptReceipt[] = []
  for (const candidate of parsed.receipts) {
    if (!isValidReceiptShape(candidate)) continue
    const receipt = candidate as AttemptReceipt
    if (!isNonNegativeSafeIntegerNotFarFuture(receipt.checkedAt, now)) continue
    if (receipt.learnerId !== null && receipt.learnerId !== profileId) continue
    receipts.push({ ...receipt, learnerId: profileId })
  }
  receipts.sort(compareReceipts)
  const unique: AttemptReceipt[] = []
  for (const receiptItem of receipts) {
    const previous = unique[unique.length - 1]
    if (previous && previous.attemptId === receiptItem.attemptId) continue
    unique.push(receiptItem)
  }
  return unique
}

function compareReceipts(left: AttemptReceipt, right: AttemptReceipt): number {
  if (left.checkedAt !== right.checkedAt) return left.checkedAt - right.checkedAt
  return left.attemptId < right.attemptId ? -1 : left.attemptId > right.attemptId ? 1 : 0
}

export async function buildPortableProfileExport(
  profileId: string,
  dependencies: PortableProfileExportDependencies,
): Promise<PortableProfileExportV1> {
  const { storage } = dependencies
  const now = Math.floor((dependencies.now ?? Date.now)())
  const registry = parseLocalProfileRegistry(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY))
  const profile = registry?.profiles.find((entry) => entry.profileId === profileId)
  if (!registry || !profile) {
    throw new ProfileTransferError('EXPORT_PROFILE_NOT_FOUND')
  }

  const { snapshots, resumeIds, lastPlayedAt } = collectGradeSnapshots(storage, profileId, now)
  const receipts = collectExportableReceipts(storage, profileId, now)

  const payload = {
    format: PORTABLE_PROFILE_FORMAT,
    schemaVersion: 1 as const,
    exportedAt: now,
    appRelease: dependencies.appRelease ?? 'unknown',
    contentRelease: dependencies.contentRelease ?? 'unknown',
    profile: { profileId, nickname: profile.nickname },
    learning: {
      gradeProgress: LEARNING_GRADES.map((grade) => ({
        grade: grade as PortableGradeValue,
        completedIds: snapshots[grade].completedIds,
        reviewIds: snapshots[grade].reviewIds,
        setCompletion: snapshots[grade].setCompletion,
      })),
      receipts,
      recentActivity: pickRecentActivity(snapshots, resumeIds, lastPlayedAt),
      mascotId: readMascotId(readScopedRaw(storage, profileId, MASCOT_PREFERENCE_KEY)),
    },
  }

  const canonical = canonicalJson(payload)
  const digestValue = await (dependencies.sha256Hex ?? webCryptoSha256Hex)(canonical)
  return {
    format: payload.format,
    schemaVersion: 1,
    exportedAt: payload.exportedAt,
    appRelease: payload.appRelease,
    contentRelease: payload.contentRelease,
    profile: payload.profile,
    learning: payload.learning,
    digest: { algorithm: 'SHA-256', value: digestValue },
  }
}

export function serializePortableProfileExport(file: PortableProfileExportV1): string {
  return JSON.stringify(file)
}

// ---------------------------------------------------------------------------
// Strict whole-file validation
// ---------------------------------------------------------------------------

function isValidReceiptShape(value: unknown): value is AttemptReceipt {
  if (!isRecord(value)) return false
  const allowed = [
    'schemaVersion', 'attemptId', 'learnerId', 'sessionId', 'activityId', 'grade', 'itemId',
    'attemptOrdinal', 'variantKey', 'contentReleaseId', 'correct', 'usedHint', 'checkedAt', 'dedupeKey',
  ]
  if (Object.keys(value).some((key) => !allowed.includes(key))) return false
  return value.schemaVersion === 1
    && isBoundedString(value.attemptId)
    && (value.learnerId === null || typeof value.learnerId === 'string')
    && isBoundedString(value.sessionId)
    && isBoundedString(value.activityId)
    && LEARNING_GRADES.includes(value.grade as LearningGrade)
    && isBoundedString(value.itemId)
    && typeof value.attemptOrdinal === 'number'
    && Number.isSafeInteger(value.attemptOrdinal)
    && value.attemptOrdinal >= 0
    && isBoundedString(value.variantKey)
    && isBoundedString(value.contentReleaseId)
    && typeof value.correct === 'boolean'
    && typeof value.usedHint === 'boolean'
    && typeof value.checkedAt === 'number'
    && isBoundedString(value.dedupeKey, 512)
}

class ErrorCollector {
  private readonly codes = new Set<ProfileTransferErrorCode>()

  add(code: ProfileTransferErrorCode): void {
    this.codes.add(code)
  }

  list(): ProfileTransferErrorCode[] {
    return PROFILE_TRANSFER_ERROR_CODES.filter((code) => this.codes.has(code))
  }

  get size(): number {
    return this.codes.size
  }
}

function validateSortedUniqueStringList(value: unknown, code: ProfileTransferErrorCode, errors: ErrorCollector): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_IDS_PER_LIST || !value.every((item) => isBoundedString(item))) {
    errors.add(code)
    return null
  }
  const list = value as string[]
  const sortedAndUnique = list.every((item, index) => index === 0 || list[index - 1] < item)
  if (!sortedAndUnique) {
    errors.add(code)
    return null
  }
  return list
}

function validateSetCompletion(value: unknown, errors: ErrorCollector): PortableSetCompletionEntryV1[] | null {
  if (!Array.isArray(value)) {
    errors.add('SET_COMPLETION_INVALID')
    return null
  }
  const entries: PortableSetCompletionEntryV1[] = []
  for (const item of value) {
    if (
      !isRecord(item)
      || Object.keys(item).some((key) => !['activityId', 'hasCompletedBasicSet', 'hasCompletedPracticeSet', 'legacyCompleted'].includes(key))
      || !isBoundedString(item.activityId)
      || typeof item.hasCompletedBasicSet !== 'boolean'
      || typeof item.hasCompletedPracticeSet !== 'boolean'
      || typeof item.legacyCompleted !== 'boolean'
    ) {
      errors.add('SET_COMPLETION_INVALID')
      return null
    }
    entries.push({
      activityId: item.activityId,
      hasCompletedBasicSet: item.hasCompletedBasicSet,
      hasCompletedPracticeSet: item.hasCompletedPracticeSet,
      legacyCompleted: item.legacyCompleted,
    })
  }
  const sorted = entries.every((entry, index) => index === 0 || entries[index - 1].activityId < entry.activityId)
  if (!sorted) {
    errors.add('SET_COMPLETION_INVALID')
    return null
  }
  return entries
}

export interface ParsePortableProfileOptions {
  now?: () => number
  sha256Hex?: (canonical: string) => Promise<string>
}

export type ParsedPortableProfile =
  | { ok: true; file: PortableProfileExportV1 }
  | { ok: false; errors: ProfileTransferErrorCode[] }

export async function parsePortableProfileExport(
  rawText: string,
  options: ParsePortableProfileOptions = {},
): Promise<ParsedPortableProfile> {
  const now = Math.floor((options.now ?? Date.now)())
  const errors = new ErrorCollector()
  const fail = (): { ok: false; errors: ProfileTransferErrorCode[] } => ({ ok: false, errors: errors.list() })

  if (typeof rawText !== 'string' || byteLengthUtf8(rawText) > MAX_PORTABLE_PROFILE_BYTES) {
    errors.add('FILE_TOO_LARGE')
    return fail()
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    errors.add('NOT_VALID_JSON')
    return fail()
  }
  if (!isRecord(parsed)) {
    errors.add('NOT_VALID_JSON')
    return fail()
  }

  const topLevelAllowed = ['format', 'schemaVersion', 'exportedAt', 'appRelease', 'contentRelease', 'profile', 'learning', 'digest']
  if (Object.keys(parsed).some((key) => !topLevelAllowed.includes(key))) errors.add('TOP_LEVEL_SHAPE_INVALID')
  if (parsed.format !== PORTABLE_PROFILE_FORMAT) errors.add('FORMAT_UNSUPPORTED')
  if (parsed.schemaVersion !== 1) errors.add('SCHEMA_VERSION_UNSUPPORTED')
  if (!isNonNegativeSafeIntegerNotFarFuture(parsed.exportedAt, now)) errors.add('EXPORTED_AT_INVALID')
  if (!isBoundedString(parsed.appRelease)) errors.add('APP_RELEASE_INVALID')
  if (!isBoundedString(parsed.contentRelease)) errors.add('CONTENT_RELEASE_INVALID')

  let profileId: string | null = null
  if (
    !isRecord(parsed.profile)
    || Object.keys(parsed.profile).some((key) => !['profileId', 'nickname'].includes(key))
  ) {
    errors.add('PROFILE_BLOCK_INVALID')
  } else {
    if (!isLocalProfileId(parsed.profile.profileId)) {
      errors.add('PROFILE_ID_INVALID')
    } else {
      profileId = parsed.profile.profileId
    }
    const nickname = parsed.profile.nickname
    if (nickname !== null) {
      if (typeof nickname !== 'string' || nickname !== nickname.trim()) {
        errors.add('NICKNAME_INVALID')
      } else {
        const length = Array.from(nickname).length
        if (length < 1 || length > 20) errors.add('NICKNAME_INVALID')
      }
    }
  }

  let learning: JsonRecord | null = null
  if (
    !isRecord(parsed.learning)
    || Object.keys(parsed.learning).some((key) => !['gradeProgress', 'receipts', 'recentActivity', 'mascotId'].includes(key))
  ) {
    errors.add('LEARNING_SHAPE_INVALID')
  } else {
    learning = parsed.learning
  }

  if (learning !== null) {
    validateLearningBlock(learning, profileId, now, errors)
  }

  if (
    !isRecord(parsed.digest)
    || Object.keys(parsed.digest).some((key) => !['algorithm', 'value'].includes(key))
    || parsed.digest.algorithm !== 'SHA-256'
    || typeof parsed.digest.value !== 'string'
    || !/^[0-9a-f]{64}$/.test(parsed.digest.value)
  ) {
    errors.add('DIGEST_SHAPE_INVALID')
    return fail()
  }

  if (errors.size > 0) return fail()

  const digestValue = parsed.digest.value as string
  const recomputable = parsed as Partial<PortableProfileExportV1>
  const canonical = canonicalJson({ ...recomputable, digest: undefined })
  const expectedDigest = await (options.sha256Hex ?? webCryptoSha256Hex)(canonical)
  if (expectedDigest !== digestValue) {
    errors.add('DIGEST_MISMATCH')
    return fail()
  }

  return { ok: true, file: parsed as unknown as PortableProfileExportV1 }
}

function validateLearningBlock(learning: JsonRecord, profileId: string | null, now: number, errors: ErrorCollector): void {
  const gradeProgress = learning.gradeProgress
  if (!Array.isArray(gradeProgress) || gradeProgress.length !== 6) {
    errors.add('GRADE_SET_INVALID')
  } else {
    const grades: number[] = []
    for (const entry of gradeProgress) {
      if (
        !isRecord(entry)
        || Object.keys(entry).some((key) => !['grade', 'completedIds', 'reviewIds', 'setCompletion'].includes(key))
      ) {
        errors.add('GRADE_PROGRESS_SHAPE_INVALID')
        continue
      }
      grades.push(entry.grade as number)
      validateSortedUniqueStringList(entry.completedIds, 'COMPLETED_IDS_INVALID', errors)
      validateSortedUniqueStringList(entry.reviewIds, 'REVIEW_IDS_INVALID', errors)
      validateSetCompletion(entry.setCompletion, errors)
    }
    const expectedGrades = [1, 2, 3, 4, 5, 6]
    const gradesValid = grades.length === 6
      && grades.every((grade, index) => grade === expectedGrades[index])
    if (!gradesValid) errors.add('GRADE_SET_INVALID')
  }

  const receipts = learning.receipts
  if (!Array.isArray(receipts)) {
    errors.add('RECEIPTS_SHAPE_INVALID')
  } else {
    if (receipts.length > MAX_PORTABLE_RECEIPTS) errors.add('RECEIPTS_COUNT_EXCEEDED')
    const seenAttemptIds = new Set<string>()
    let previous: AttemptReceipt | null = null
    for (const candidate of receipts) {
      if (!isValidReceiptShape(candidate) || !isNonNegativeSafeIntegerNotFarFuture((candidate as AttemptReceipt).checkedAt, now)) {
        errors.add('RECEIPT_INVALID')
        continue
      }
      const receipt = candidate as AttemptReceipt
      if (seenAttemptIds.has(receipt.attemptId)) {
        errors.add('RECEIPT_ATTEMPT_DUPLICATE')
        continue
      }
      seenAttemptIds.add(receipt.attemptId)
      if (receipt.learnerId !== null && receipt.learnerId !== profileId) {
        errors.add('RECEIPT_LEARNER_MISMATCH')
      }
      if (previous && !(previous.checkedAt < receipt.checkedAt
        || (previous.checkedAt === receipt.checkedAt && previous.attemptId <= receipt.attemptId))) {
        errors.add('RECEIPT_ORDER_INVALID')
      }
      previous = receipt
    }
  }

  const recentActivity = learning.recentActivity
  if (recentActivity !== null) {
    if (
      !isRecord(recentActivity)
      || Object.keys(recentActivity).some((key) => !['grade', 'activityId', 'at'].includes(key))
      || !LEARNING_GRADES.includes(recentActivity.grade as LearningGrade)
      || !isBoundedString(recentActivity.activityId)
      || !isNonNegativeSafeIntegerNotFarFuture(recentActivity.at, now)
    ) {
      errors.add('RECENT_ACTIVITY_INVALID')
    }
  }

  if (!isMascotId(learning.mascotId)) errors.add('MASCOT_ID_INVALID')
}

// ---------------------------------------------------------------------------
// Local state snapshot and deterministic merge plan
// ---------------------------------------------------------------------------

interface LocalStateSnapshot {
  registry: ReturnType<typeof parseLocalProfileRegistry>
  targetExists: boolean
  storedMascotAvatar: MascotId | null
  grades: Record<PortableGradeValue, { completed: string[]; review: string[] }>
  receipts: AttemptReceipt[]
  recentActivity: PortableRecentActivityV1 | null
}

interface ImportMergePlan {
  mode: 'merge' | 'create'
  targetProfileId: string | null
  status: 'merge' | 'new-profile' | 'mascot-choice' | 'invalid'
  completedAdded: number
  reviewAddedCount: number
  reviewRemovedCount: number
  receiptsAdded: AttemptReceipt[]
  receiptConflict: boolean
  recentWinner: PortableRecentActivityV1 | null
  recentActivityChanged: boolean
  mascotConflict: boolean
  mascotLocal: MascotId
  errors: ProfileTransferErrorCode[]
}

function normalizeLearnerForTarget(receipt: AttemptReceipt, targetProfileId: string): AttemptReceipt {
  return receipt.learnerId === targetProfileId ? receipt : { ...receipt, learnerId: targetProfileId }
}

function readLocalStateSnapshot(storage: ProfileRegistryStorage, file: PortableProfileExportV1): LocalStateSnapshot {
  const registry = parseLocalProfileRegistry(storage.getItem(LOCAL_PROFILE_REGISTRY_KEY))
  const targetExists = registry?.profiles.some((profile) => profile.profileId === file.profile.profileId) ?? false
  if (!targetExists) {
    return {
      registry,
      targetExists: false,
      storedMascotAvatar: null,
      grades: {
        1: { completed: [], review: [] },
        2: { completed: [], review: [] },
        3: { completed: [], review: [] },
        4: { completed: [], review: [] },
        5: { completed: [], review: [] },
        6: { completed: [], review: [] },
      },
      receipts: [],
      recentActivity: null,
    }
  }
  const storedMascotRaw = targetExists
    ? readScopedRaw(storage, file.profile.profileId, MASCOT_PREFERENCE_KEY)
    : null
  const storedAvatar = storedMascotRaw === null ? null : (() => {
    try {
      const parsed: unknown = JSON.parse(storedMascotRaw)
      return isRecord(parsed) && isMascotId(parsed.avatarId) ? parsed.avatarId : null
    } catch {
      return null
    }
  })()

  const repository = createLocalProgressRepository({
    getItem: (legacyKey: string) => readScopedRaw(storage, file.profile.profileId, legacyKey),
  })
  const grades = {} as LocalStateSnapshot['grades']
  for (const grade of LEARNING_GRADES) {
    const projection = repository.readProgress(grade)
    grades[grade] = {
      completed: projection.corrupted ? [] : [...projection.completed],
      review: projection.corrupted ? [] : [...projection.review],
    }
  }

  const receiptsRaw = readScopedRaw(storage, file.profile.profileId, ATTEMPT_RECEIPT_STORAGE_KEY)
  let receipts: AttemptReceipt[] = []
  if (receiptsRaw !== null) {
    try {
      const parsedLedger: unknown = JSON.parse(receiptsRaw)
      if (isRecord(parsedLedger) && parsedLedger.schemaVersion === 1 && Array.isArray(parsedLedger.receipts)) {
        receipts = (parsedLedger.receipts as unknown[]).filter(isValidReceiptShape) as AttemptReceipt[]
      }
    } catch {
      receipts = []
    }
  }

  const { snapshots, resumeIds, lastPlayedAt } = collectGradeSnapshots(
    storage,
    file.profile.profileId,
    Math.floor(Date.now()),
  )

  return {
    registry,
    targetExists,
    storedMascotAvatar: storedAvatar,
    grades,
    receipts,
    recentActivity: pickRecentActivity(snapshots, resumeIds, lastPlayedAt),
  }
}

/**
 * Review resolution: the latest comparable receipt decides; ties keep the
 * local state; without comparable receipts both sides' review marks union.
 */
export function resolveReviewMembership(input: {
  localReview: readonly string[]
  importedReview: readonly string[]
  comparableReceipts: readonly AttemptReceipt[]
}): { additions: string[]; removals: string[]; finalReview: string[] } {
  const union = Array.from(new Set([...input.localReview, ...input.importedReview]))
  const finalReview = new Set(union)
  const added: string[] = []
  const removed: string[] = []

  for (const activityId of union) {
    const comparable = input.comparableReceipts.filter(
      (receipt) => receipt.activityId === activityId || receipt.itemId === activityId,
    )
    const isLocallyInReview = input.localReview.includes(activityId)
    if (comparable.length === 0) {
      if (!isLocallyInReview && input.importedReview.includes(activityId)) added.push(activityId)
      continue
    }
    const latestAt = Math.max(...comparable.map((receipt) => receipt.checkedAt))
    const latest = comparable.filter((receipt) => receipt.checkedAt === latestAt)
    if (latest.length > 1) {
      // Same-timestamp disagreement: keep the local state untouched.
      if (!isLocallyInReview) finalReview.delete(activityId)
      continue
    }
    if (latest[0].correct) {
      finalReview.delete(activityId)
      if (isLocallyInReview) removed.push(activityId)
    } else {
      finalReview.add(activityId)
      if (!isLocallyInReview) added.push(activityId)
    }
  }

  return {
    additions: added,
    removals: removed,
    finalReview: Array.from(finalReview).sort(),
  }
}

function chooseRecentActivity(
  local: PortableRecentActivityV1 | null,
  imported: PortableRecentActivityV1 | null,
): { winner: PortableRecentActivityV1 | null; changed: boolean } {
  if (imported === null) return { winner: local, changed: false }
  if (local === null) return { winner: imported, changed: true }
  if (imported.at > local.at) return { winner: imported, changed: true }
  return { winner: local, changed: false }
}

function computeImportMergePlan(
  snapshot: LocalStateSnapshot,
  file: PortableProfileExportV1,
): ImportMergePlan {
  const importedGrades = new Map<number, PortableGradeProgressV1>(
    file.learning.gradeProgress.map((entry) => [entry.grade, entry]),
  )
  const mergedComparable = [...snapshot.receipts, ...file.learning.receipts]

  const receiptsAdded: AttemptReceipt[] = []
  let receiptConflict = false
  for (const importedReceipt of file.learning.receipts) {
    const localMatch = snapshot.receipts.find((receipt) => receipt.attemptId === importedReceipt.attemptId)
    if (!localMatch) {
      receiptsAdded.push(importedReceipt)
      continue
    }
    const left = normalizeLearnerForTarget(localMatch, file.profile.profileId)
    const right = normalizeLearnerForTarget(importedReceipt, file.profile.profileId)
    if (JSON.stringify(left) !== JSON.stringify(right)) receiptConflict = true
  }

  let completedAdded = 0
  let reviewAddedCount = 0
  let reviewRemovedCount = 0
  for (const grade of LEARNING_GRADES) {
    const imported = importedGrades.get(grade)
    if (!imported) continue
    const localCompleted = new Set(snapshot.grades[grade].completed)
    completedAdded += imported.completedIds.filter((id) => !localCompleted.has(id)).length
    const resolution = resolveReviewMembership({
      localReview: snapshot.grades[grade].review,
      importedReview: imported.reviewIds,
      comparableReceipts: mergedComparable,
    })
    reviewAddedCount += resolution.additions.length
    reviewRemovedCount += resolution.removals.length
  }

  const recent = chooseRecentActivity(snapshot.recentActivity, file.learning.recentActivity)
  const mascotConflict = snapshot.targetExists
    && snapshot.storedMascotAvatar !== null
    && snapshot.storedMascotAvatar !== file.learning.mascotId

  if (receiptConflict) {
    return {
      mode: snapshot.targetExists ? 'merge' : 'create',
      targetProfileId: snapshot.targetExists ? file.profile.profileId : null,
      status: 'invalid',
      completedAdded: 0,
      reviewAddedCount: 0,
      reviewRemovedCount: 0,
      receiptsAdded: [],
      receiptConflict,
      recentWinner: null,
      recentActivityChanged: false,
      mascotConflict: false,
      mascotLocal: snapshot.storedMascotAvatar ?? DEFAULT_MASCOT_ID,
      errors: ['RECEIPT_CONTENT_CONFLICT'],
    }
  }

  const status: ImportMergePlan['status'] = !snapshot.targetExists
    ? 'new-profile'
    : mascotConflict
      ? 'mascot-choice'
      : 'merge'

  return {
    mode: snapshot.targetExists ? 'merge' : 'create',
    targetProfileId: snapshot.targetExists ? file.profile.profileId : null,
    status,
    completedAdded,
    reviewAddedCount,
    reviewRemovedCount,
    receiptsAdded,
    receiptConflict: false,
    recentWinner: recent.winner,
    recentActivityChanged: recent.changed,
    mascotConflict,
    mascotLocal: snapshot.storedMascotAvatar ?? DEFAULT_MASCOT_ID,
    errors: [],
  }
}

// ---------------------------------------------------------------------------
// Preview (read-only)
// ---------------------------------------------------------------------------

export interface ProfileImportPreviewDependencies {
  storage: ProfileRegistryStorage
  now?: () => number
  sha256Hex?: (canonical: string) => Promise<string>
}

export async function previewProfileImport(
  rawText: string,
  dependencies: ProfileImportPreviewDependencies,
): Promise<ProfileImportPreviewV1> {
  const parsed = await parsePortableProfileExport(rawText, dependencies)
  if (!parsed.ok) {
    return {
      status: 'invalid',
      targetProfileId: null,
      completedAdded: 0,
      reviewAdded: 0,
      reviewRemoved: 0,
      receiptsAdded: 0,
      recentActivityChanged: false,
      mascot: null,
      errors: parsed.errors,
    }
  }
  const snapshot = readLocalStateSnapshot(dependencies.storage, parsed.file)
  const plan = computeImportMergePlan(snapshot, parsed.file)

  if (plan.status === 'invalid') {
    return {
      status: 'invalid',
      targetProfileId: null,
      completedAdded: 0,
      reviewAdded: 0,
      reviewRemoved: 0,
      receiptsAdded: 0,
      recentActivityChanged: false,
      mascot: null,
      errors: plan.errors,
    }
  }

  return {
    status: plan.status,
    targetProfileId: plan.targetProfileId,
    completedAdded: plan.completedAdded,
    reviewAdded: plan.reviewAddedCount,
    reviewRemoved: plan.reviewRemovedCount,
    receiptsAdded: plan.receiptsAdded.length,
    recentActivityChanged: plan.recentActivityChanged,
    mascot: plan.mascotConflict
      ? { local: plan.mascotLocal, imported: parsed.file.learning.mascotId }
      : null,
    errors: [],
  }
}

// ---------------------------------------------------------------------------
// Apply (backup → write → post-validate → rollback on any failure)
// ---------------------------------------------------------------------------

export interface ProfileImportApplyDependencies extends ProfileImportPreviewDependencies {
  randomUUID?: () => string
  maxProfiles?: number
}

export interface ProfileImportApplyOptions {
  mascotChoice?: 'local' | 'imported'
}

interface ImportWrites {
  fullKey: string
  value: string
  semantic: 'json-record' | 'grade1' | 'grade2' | 'grade3' | 'grade4' | 'concept-map' | 'receipt-ledger' | 'registry'
}

function isolatedStorageFor(raw: string | null): {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
} {
  return { getItem: () => raw, setItem: () => {}, removeItem: () => {} }
}

function captureViaSaver<T>(
  saver: (value: T, storage: { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }) => boolean,
  value: T,
): string | null {
  let captured: string | null = null
  const ok = saver(value, {
    getItem: () => null,
    setItem: (_key, raw) => {
      captured = raw
    },
    removeItem: () => {},
  })
  return ok ? captured : null
}

function appendUniqueSorted(base: readonly string[], additions: readonly string[], removals: readonly string[]): string[] {
  const set = new Set(base)
  for (const id of additions) set.add(id)
  for (const id of removals) set.delete(id)
  return Array.from(set).sort()
}

function buildGradeWritesForMissions(
  grade: 1 | 2 | 3,
  currentRaw: string | null,
  imported: PortableGradeProgressV1,
  resolution: { additions: string[]; removals: string[] },
  completeUnitAdditions: string[],
  nowValue: number,
): { value: string; semantic: 'grade1' | 'grade2' | 'grade3' } | null {
  if (grade === 1) {
    const loaded = loadGrade1Progress(isolatedStorageFor(currentRaw), nowValue)
    if (loaded.recovered || loaded.storageAvailable === false) return null
    const progress: Grade1Progress = loaded.progress
    progress.completedStageIds = appendUniqueSorted(progress.completedStageIds, imported.completedIds, [])
    progress.reviewStageIds = appendUniqueSorted(progress.reviewStageIds, resolution.additions, resolution.removals)
    progress.completedIslandIds = appendUniqueSorted(progress.completedIslandIds, completeUnitAdditions, [])
    const serialized = captureViaSaver(saveGrade1Progress, progress)
    return serialized === null ? null : { value: serialized, semantic: 'grade1' }
  }
  if (grade === 2) {
    const loaded = loadGrade2Progress(isolatedStorageFor(currentRaw), nowValue)
    if (loaded.recovered || loaded.storageAvailable === false) return null
    const progress: Grade2Progress = loaded.progress
    progress.completedMissionIds = appendUniqueSorted(progress.completedMissionIds, imported.completedIds, [])
    progress.reviewMissionIds = appendUniqueSorted(progress.reviewMissionIds, resolution.additions, resolution.removals)
    progress.completedUnitIds = appendUniqueSorted(progress.completedUnitIds, completeUnitAdditions, [])
    const serialized = captureViaSaver(saveGrade2Progress, progress)
    return serialized === null ? null : { value: serialized, semantic: 'grade2' }
  }
  const loaded = loadGrade3Progress(isolatedStorageFor(currentRaw), nowValue)
  if (loaded.recovered || loaded.storageAvailable === false) return null
  const progress: Grade3Progress = loaded.progress
  progress.completedMissionIds = appendUniqueSorted(progress.completedMissionIds, imported.completedIds, [])
  progress.reviewMissionIds = appendUniqueSorted(progress.reviewMissionIds, resolution.additions, resolution.removals)
  progress.completedUnitIds = appendUniqueSorted(progress.completedUnitIds, completeUnitAdditions, [])
  const serialized = captureViaSaver(saveGrade3Progress, progress)
  return serialized === null ? null : { value: serialized, semantic: 'grade3' }
}

function buildGrade4Write(
  currentRaw: string | null,
  imported: PortableGradeProgressV1,
  resolution: { additions: string[]; removals: string[] },
  nowValue: number,
): { value: string; semantic: 'grade4' } | null {
  const loaded = loadGrade4Progress(isolatedStorageFor(currentRaw), nowValue)
  if (loaded.recovered || loaded.storageAvailable === false) return null
  const progress: Grade4Progress = loaded.progress
  progress.completedVariantKeys = appendUniqueSorted(progress.completedVariantKeys, imported.completedIds, [])
  progress.reviewVariantKeys = appendUniqueSorted(progress.reviewVariantKeys, resolution.additions, resolution.removals)
  const record = { ...progress.completionRecord }
  const basic = new Set(record.completedBasicSetActivityIds)
  const practice = new Set(record.completedPracticeSetActivityIds)
  for (const entry of imported.setCompletion) {
    if (entry.hasCompletedBasicSet) basic.add(entry.activityId)
    if (entry.hasCompletedPracticeSet) practice.add(entry.activityId)
    // Grade 4 has no legacy fact of its own; preserve imported completeness
    // through basic-set evidence so the unit never regresses to incomplete.
    if (entry.legacyCompleted && !entry.hasCompletedPracticeSet) basic.add(entry.activityId)
  }
  progress.completionRecord = {
    completedBasicSetActivityIds: Array.from(basic).sort(),
    completedPracticeSetActivityIds: Array.from(practice).sort(),
  }
  const serialized = captureViaSaver(saveGrade4Progress, progress)
  return serialized === null ? null : { value: serialized, semantic: 'grade4' }
}

interface ConceptSummaryLike {
  conceptId: string
  attemptCount: number
  bestScore: number
  latestScore: number
  lastCompletedAt: number
  needsReview: boolean
  lastMode: 'standard' | 'retry-wrong'
  completionRecord?: { completedBasicSetActivityIds: string[]; completedPracticeSetActivityIds: string[] }
  legacyCompleted?: boolean
}

function isValidConceptSummary(value: unknown): value is ConceptSummaryLike {
  if (!isRecord(value)) return false
  const completionRead = isRecord(value.completionRecord) || value.completionRecord === undefined
  return typeof value.conceptId === 'string'
    && Number.isInteger(value.attemptCount)
    && typeof value.bestScore === 'number'
    && typeof value.latestScore === 'number'
    && Number.isInteger(value.lastCompletedAt)
    && typeof value.needsReview === 'boolean'
    && (value.lastMode === 'standard' || value.lastMode === 'retry-wrong')
    && completionRead
    && (value.legacyCompleted === undefined || typeof value.legacyCompleted === 'boolean')
}

function buildConceptMapWrite(
  currentRaw: string | null,
  imported: PortableGradeProgressV1,
  reviewResolution: { additions: string[]; removals: string[] },
  newestReceiptAtByActivity: Map<string, number>,
): { value: string; semantic: 'concept-map' } | null {
  let map: Record<string, ConceptSummaryLike> = {}
  if (currentRaw !== null) {
    try {
      const parsed: unknown = JSON.parse(currentRaw)
      if (!isRecord(parsed) || !Object.values(parsed).every(isValidConceptSummary)) return null
      map = parsed as Record<string, ConceptSummaryLike>
    } catch {
      return null
    }
  }

  const reviewFinal = new Set([
    ...Object.values(map).filter((summary) => summary.needsReview).map((summary) => summary.conceptId),
    ...imported.reviewIds,
  ])
  for (const removed of reviewResolution.removals) reviewFinal.delete(removed)
  for (const added of reviewResolution.additions) reviewFinal.add(added)

  const touchedActivities = new Set<string>([
    ...imported.completedIds,
    ...imported.reviewIds,
    ...imported.setCompletion.map((entry) => entry.activityId),
  ])

  for (const conceptId of touchedActivities) {
    const existing = map[conceptId] ?? null
    const flags = imported.setCompletion.find((entry) => entry.activityId === conceptId)
    const basicList = new Set(existing?.completionRecord?.completedBasicSetActivityIds ?? [])
    const practiceList = new Set(existing?.completionRecord?.completedPracticeSetActivityIds ?? [])
    if (flags?.hasCompletedBasicSet) basicList.add(conceptId)
    if (flags?.hasCompletedPracticeSet) practiceList.add(conceptId)
    const needsReview = reviewFinal.has(conceptId)
    const newestAt = newestReceiptAtByActivity.get(conceptId) ?? null

    if (existing) {
      map[conceptId] = {
        ...existing,
        completionRecord: {
          completedBasicSetActivityIds: Array.from(basicList).sort(),
          completedPracticeSetActivityIds: Array.from(practiceList).sort(),
        },
        legacyCompleted: existing.legacyCompleted === true || (flags?.legacyCompleted ?? false),
        needsReview,
      }
    } else {
      map[conceptId] = {
        conceptId,
        attemptCount: 0,
        bestScore: 0,
        latestScore: 0,
        lastCompletedAt: newestAt ?? 0,
        needsReview,
        lastMode: needsReview ? 'retry-wrong' : 'standard',
        completionRecord: {
          completedBasicSetActivityIds: Array.from(basicList).sort(),
          completedPracticeSetActivityIds: Array.from(practiceList).sort(),
        },
        legacyCompleted: flags?.legacyCompleted ?? false,
      }
    }
  }

  for (const summary of Object.values(map)) {
    try {
      projectConceptProgressCompletion(summary as never)
    } catch {
      return null
    }
  }
  return { value: JSON.stringify(map), semantic: 'concept-map' }
}

function buildReceiptLedgerWrite(
  localReceipts: AttemptReceipt[],
  importedReceipts: AttemptReceipt[],
  targetProfileId: string,
): { value: string; semantic: 'receipt-ledger' } {
  const byId = new Map<string, AttemptReceipt>()
  for (const receipt of localReceipts) {
    byId.set(receipt.attemptId, normalizeLearnerForTarget(receipt, targetProfileId))
  }
  for (const receipt of importedReceipts) {
    const existing = byId.get(receipt.attemptId)
    if (existing) continue
    byId.set(receipt.attemptId, normalizeLearnerForTarget(receipt, targetProfileId))
  }
  const merged = Array.from(byId.values()).sort(compareReceipts)
  return { value: JSON.stringify({ schemaVersion: 1, receipts: merged }), semantic: 'receipt-ledger' }
}

function newestReceiptTimestampByActivity(receipts: AttemptReceipt[]): Map<string, number> {
  const newest = new Map<string, number>()
  for (const receipt of receipts) {
    const current = newest.get(receipt.activityId)
    if (current === undefined || receipt.checkedAt > current) newest.set(receipt.activityId, receipt.checkedAt)
  }
  return newest
}

function postValidateWrittenValue(write: ImportWrites, readBack: string | null, nowValue: number): boolean {
  if (readBack !== write.value) return false
  switch (write.semantic) {
    case 'grade1':
      return !loadGrade1Progress(isolatedStorageFor(readBack), nowValue).recovered
    case 'grade2':
      return !loadGrade2Progress(isolatedStorageFor(readBack), nowValue).recovered
    case 'grade3':
      return !loadGrade3Progress(isolatedStorageFor(readBack), nowValue).recovered
    case 'grade4':
      return !loadGrade4Progress(isolatedStorageFor(readBack), nowValue).recovered
    case 'concept-map': {
      try {
        const parsed: unknown = JSON.parse(readBack)
        return isRecord(parsed) && Object.values(parsed).every(isValidConceptSummary)
      } catch {
        return false
      }
    }
    case 'receipt-ledger': {
      try {
        const parsed: unknown = JSON.parse(readBack)
        if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.receipts)) return false
        const seen = new Set<string>()
        return (parsed.receipts as unknown[]).every((receipt) => {
          if (!isValidReceiptShape(receipt)) return false
          const attemptId = (receipt as AttemptReceipt).attemptId
          if (seen.has(attemptId)) return false
          seen.add(attemptId)
          return true
        })
      } catch {
        return false
      }
    }
    case 'registry':
      return parseLocalProfileRegistry(readBack) !== null
    case 'json-record': {
      try {
        return isRecord(JSON.parse(readBack))
      } catch {
        return false
      }
    }
    default:
      return false
  }
}

export async function applyProfileImport(
  rawText: string,
  dependencies: ProfileImportApplyDependencies,
  options: ProfileImportApplyOptions = {},
): Promise<ProfileImportApplyResult> {
  const { storage } = dependencies
  const nowValue = Math.floor((dependencies.now ?? Date.now)())

  const blocked = (
    errorCode: ProfileTransferErrorCode,
    errors: string[],
    restoredFromBackup = false,
    targetProfileId: string | null = null,
  ): ProfileImportApplyResult => ({ status: 'blocked', errorCode, errors, restoredFromBackup, targetProfileId })

  const parsed = await parsePortableProfileExport(rawText, dependencies)
  if (!parsed.ok) return blocked('APPLY_WRITE_FAILED', parsed.errors)
  const file = parsed.file

  const snapshot = readLocalStateSnapshot(storage, file)
  const plan = computeImportMergePlan(snapshot, file)
  if (plan.status === 'invalid') return blocked(plan.errors[0] ?? 'APPLY_WRITE_FAILED', plan.errors)

  const importedGrades = new Map(file.learning.gradeProgress.map((entry) => [entry.grade, entry]))
  const writes: ImportWrites[] = []
  let createdProfileId: string | null = null

  if (plan.mode === 'merge') {
    const targetProfileId = file.profile.profileId
    if (plan.mascotConflict && options.mascotChoice !== 'local' && options.mascotChoice !== 'imported') {
      return blocked('MASCOT_CHOICE_REQUIRED', ['MASCOT_CHOICE_REQUIRED'], false, targetProfileId)
    }

    const comparable = [...snapshot.receipts, ...file.learning.receipts]
    for (const grade of LEARNING_GRADES) {
      const imported = importedGrades.get(grade)
      if (!imported) continue
      const localGrade = snapshot.grades[grade]
      const localCompletedSet = new Set(localGrade.completed)
      const completionChanged = imported.completedIds.some((id) => !localCompletedSet.has(id))
        || imported.setCompletion.length > 0
      const resolution = resolveReviewMembership({
        localReview: localGrade.review,
        importedReview: imported.reviewIds,
        comparableReceipts: comparable,
      })
      if (!completionChanged && resolution.additions.length === 0 && resolution.removals.length === 0) continue

      const currentRaw = readScopedRaw(storage, targetProfileId, GRADE_PROGRESS_KEYS[grade])
      if (grade <= 3) {
        const completeUnitAdditions = imported.setCompletion
          .filter((entry) => entry.hasCompletedBasicSet || entry.hasCompletedPracticeSet || entry.legacyCompleted)
          .map((entry) => entry.activityId)
        const write = buildGradeWritesForMissions(grade as 1 | 2 | 3, currentRaw, imported, resolution, completeUnitAdditions, nowValue)
        if (write === null) return blocked('APPLY_WRITE_FAILED', ['APPLY_WRITE_FAILED'], false, targetProfileId)
        writes.push({ fullKey: createProfileScopedStorageKey(targetProfileId, GRADE_PROGRESS_KEYS[grade]), ...write })
      } else if (grade === 4) {
        const write = buildGrade4Write(currentRaw, imported, resolution, nowValue)
        if (write === null) return blocked('APPLY_WRITE_FAILED', ['APPLY_WRITE_FAILED'], false, targetProfileId)
        writes.push({ fullKey: createProfileScopedStorageKey(targetProfileId, GRADE4_PROGRESS_KEY), ...write })
      } else {
        const write = buildConceptMapWrite(currentRaw, imported, resolution, newestReceiptTimestampByActivity(comparable))
        if (write === null) return blocked('APPLY_WRITE_FAILED', ['APPLY_WRITE_FAILED'], false, targetProfileId)
        writes.push({ fullKey: createProfileScopedStorageKey(targetProfileId, GRADE_PROGRESS_KEYS[grade]), ...write })
      }
    }

    if (plan.receiptsAdded.length > 0) {
      const ledger = buildReceiptLedgerWrite(snapshot.receipts, plan.receiptsAdded, targetProfileId)
      writes.push({ fullKey: createProfileScopedStorageKey(targetProfileId, ATTEMPT_RECEIPT_STORAGE_KEY), ...ledger })
    }

    if (plan.recentActivityChanged && plan.recentWinner !== null) {
      const raw = readScopedRaw(storage, targetProfileId, GUEST_HOME_PREFERENCES_KEY)
      let preferences: JsonRecord = {}
      if (raw !== null) {
        try {
          const parsedPreferences: unknown = JSON.parse(raw)
          if (isRecord(parsedPreferences)) preferences = parsedPreferences
        } catch {
          preferences = {}
        }
      }
      const next = JSON.stringify({ ...preferences, activeGrade: plan.recentWinner.grade })
      writes.push({
        fullKey: createProfileScopedStorageKey(targetProfileId, GUEST_HOME_PREFERENCES_KEY),
        value: next,
        semantic: 'json-record',
      })
    }

    if (options.mascotChoice === 'imported' || snapshot.storedMascotAvatar === null) {
      writes.push({
        fullKey: createProfileScopedStorageKey(targetProfileId, MASCOT_PREFERENCE_KEY),
        value: JSON.stringify({ avatarId: file.learning.mascotId }),
        semantic: 'json-record',
      })
    }
  } else {
    const maxProfiles = dependencies.maxProfiles ?? DEFAULT_MAX_LOCAL_PROFILES
    const registry = snapshot.registry
    if (!registry || registry.profiles.length >= maxProfiles) {
      return blocked('PROFILE_LIMIT_REACHED', ['PROFILE_LIMIT_REACHED'])
    }
    const randomUUID = dependencies.randomUUID ?? (() => {
      if (typeof globalThis.crypto?.randomUUID !== 'function') {
        throw new Error('crypto.randomUUID() is required to create a local profile during import.')
      }
      return globalThis.crypto.randomUUID()
    })
    const newProfileId = `local_${randomUUID()}`
    const nextRegistry = {
      ...registry,
      profiles: [
        ...registry.profiles,
        { profileId: newProfileId, nickname: file.profile.nickname, createdAt: nowValue, updatedAt: nowValue },
      ],
    }
    if (!isLocalProfileRegistry(nextRegistry)) {
      return blocked('APPLY_WRITE_FAILED', ['APPLY_WRITE_FAILED'])
    }
    writes.push({
      fullKey: LOCAL_PROFILE_REGISTRY_KEY,
      value: JSON.stringify(nextRegistry),
      semantic: 'registry',
    })

    const comparable = [...snapshot.receipts, ...file.learning.receipts]
    const newestByActivity = newestReceiptTimestampByActivity(comparable)
    for (const grade of LEARNING_GRADES) {
      const imported = importedGrades.get(grade)
      if (!imported) continue
      const resolution = resolveReviewMembership({
        localReview: [],
        importedReview: imported.reviewIds,
        comparableReceipts: comparable,
      })
      if (grade <= 3) {
        const completeUnitAdditions = imported.setCompletion
          .filter((entry) => entry.hasCompletedBasicSet || entry.hasCompletedPracticeSet || entry.legacyCompleted)
          .map((entry) => entry.activityId)
        const write = buildGradeWritesForMissions(grade as 1 | 2 | 3, null, imported, resolution, completeUnitAdditions, nowValue)
        if (write === null) return blocked('APPLY_WRITE_FAILED', ['APPLY_WRITE_FAILED'])
        writes.push({ fullKey: createProfileScopedStorageKey(newProfileId, GRADE_PROGRESS_KEYS[grade]), ...write })
      } else if (grade === 4) {
        const write = buildGrade4Write(null, imported, resolution, nowValue)
        if (write === null) return blocked('APPLY_WRITE_FAILED', ['APPLY_WRITE_FAILED'])
        writes.push({ fullKey: createProfileScopedStorageKey(newProfileId, GRADE4_PROGRESS_KEY), ...write })
      } else {
        const write = buildConceptMapWrite(null, imported, resolution, newestByActivity)
        if (write === null) return blocked('APPLY_WRITE_FAILED', ['APPLY_WRITE_FAILED'])
        writes.push({ fullKey: createProfileScopedStorageKey(newProfileId, GRADE_PROGRESS_KEYS[grade]), ...write })
      }
    }

    if (file.learning.receipts.length > 0) {
      const ledger = buildReceiptLedgerWrite([], file.learning.receipts, newProfileId)
      writes.push({ fullKey: createProfileScopedStorageKey(newProfileId, ATTEMPT_RECEIPT_STORAGE_KEY), ...ledger })
    }
    if (file.learning.recentActivity !== null) {
      writes.push({
        fullKey: createProfileScopedStorageKey(newProfileId, GUEST_HOME_PREFERENCES_KEY),
        value: JSON.stringify({ activeGrade: file.learning.recentActivity.grade }),
        semantic: 'json-record',
      })
    }
    writes.push({
      fullKey: createProfileScopedStorageKey(newProfileId, MASCOT_PREFERENCE_KEY),
      value: JSON.stringify({ avatarId: file.learning.mascotId }),
      semantic: 'json-record',
    })

    createdProfileId = newProfileId
  }

  const targetScopeId = plan.mode === 'merge' ? file.profile.profileId : (createdProfileId ?? '')
  const affectedOriginalBytes = new Map<string, string | null>()
  for (const write of writes) {
    affectedOriginalBytes.set(write.fullKey, storage.getItem(write.fullKey))
  }

  const backupLegacyKey = `mathAssist_progressBackup_v1:profile-import-v1:${nowValue}`
  const backupFullKey = createProfileScopedStorageKey(targetScopeId, backupLegacyKey)
  const backupPayload = JSON.stringify({
    schemaVersion: 1,
    kind: 'profile-import-v1',
    profileId: targetScopeId,
    createdAt: nowValue,
    values: Object.fromEntries(affectedOriginalBytes),
  })
  try {
    storage.setItem(backupFullKey, backupPayload)
    if (storage.getItem(backupFullKey) !== backupPayload) throw new Error('rollback backup verification failed')
  } catch {
    try {
      storage.removeItem(backupFullKey)
    } catch {
      // Best-effort cleanup on an abort that already wrote nothing else.
    }
    return blocked('APPLY_WRITE_FAILED', ['APPLY_WRITE_FAILED'], false, targetScopeId)
  }

  const restoreOriginalBytes = (): boolean => {
    let allRestored = true
    for (const [fullKey, original] of affectedOriginalBytes) {
      try {
        if (original === null) storage.removeItem(fullKey)
        else storage.setItem(fullKey, original)
      } catch {
        allRestored = false
      }
    }
    try {
      storage.removeItem(backupFullKey)
    } catch {
      allRestored = false
    }
    return allRestored
  }

  const failureResult = (): ProfileImportApplyResult => ({
    status: 'failed',
    errorCode: 'APPLY_WRITE_FAILED',
    errors: ['APPLY_WRITE_FAILED'],
    restoredFromBackup: restoreOriginalBytes(),
    targetProfileId: targetScopeId,
  })

  try {
    for (const write of writes) {
      storage.setItem(write.fullKey, write.value)
    }
  } catch {
    return failureResult()
  }

  for (const write of writes) {
    if (!postValidateWrittenValue(write, storage.getItem(write.fullKey), nowValue)) {
      return failureResult()
    }
  }

  return {
    status: 'applied',
    errorCode: null,
    errors: [],
    restoredFromBackup: false,
    targetProfileId: targetScopeId,
  }
}
