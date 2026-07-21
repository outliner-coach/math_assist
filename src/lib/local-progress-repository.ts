import {
  LEARNING_GRADES,
  type ActivityItemSnapshot,
  type ActivityResponse,
  type AttemptReceipt,
  type LearningActivityMode,
  type LearningActivitySession,
  type LearningGrade,
  type LearningProgressProjection,
  type LearningProgressProjectionMap,
  type ProgressRepository,
  type ProgressResume,
} from './learning-activity'

const PROGRESS_KEYS: Record<LearningGrade, string> = {
  1: 'mathAssist_grade1Progress',
  2: 'mathAssist_grade2Progress',
  3: 'mathAssist_grade3Progress',
  4: 'mathAssist_grade4Progress',
  5: 'mathAssist_progress_v1',
  6: 'mathAssist_grade6Progress',
}
const GRADE5_SESSION_KEY = 'mathAssist_currentSession'
const GRADE6_SESSION_KEY = 'mathAssist_grade6CurrentSession'

type JsonRecord = Record<string, unknown>
type ParsedRecord =
  | { state: 'missing'; value: null }
  | { state: 'corrupt'; value: null }
  | { state: 'valid'; value: JsonRecord }

export interface ReadonlyLearningStorage {
  getItem(key: string): string | null
}

function browserStorage(): ReadonlyLearningStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readRecord(storage: ReadonlyLearningStorage | null, key: string): ParsedRecord {
  if (!storage) return { state: 'missing', value: null }
  try {
    const raw = storage.getItem(key)
    if (raw === null) return { state: 'missing', value: null }
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { state: 'corrupt', value: null }
    }
    return { state: 'valid', value: value as JsonRecord }
  } catch {
    return { state: 'corrupt', value: null }
  }
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function stringList(record: JsonRecord, field: string): { values: string[]; valid: boolean } {
  const value = record[field]
  if (value === undefined) return { values: [], valid: true }
  if (!Array.isArray(value)) return { values: [], valid: false }
  return {
    values: Array.from(new Set(value.filter((item): item is string => typeof item === 'string'))),
    valid: value.every((item) => typeof item === 'string'),
  }
}

function optionalString(record: JsonRecord, field: string): { value: string | null; valid: boolean } {
  const value = record[field]
  if (value === undefined || value === null) return { value: null, valid: true }
  return typeof value === 'string'
    ? { value: value.length > 0 ? value : null, valid: true }
    : { value: null, valid: false }
}

function optionalNumber(record: JsonRecord, field: string): { value: number | null; valid: boolean } {
  const value = record[field]
  if (value === undefined || value === null) return { value: null, valid: true }
  const parsed = finiteNumber(value)
  return parsed === null
    ? { value: null, valid: false }
    : { value: parsed, valid: true }
}

function emptyProjection(grade: LearningGrade, corrupted: boolean): LearningProgressProjection {
  return {
    grade,
    resume: null,
    completed: [],
    review: [],
    lastActivityAt: null,
    corrupted,
    sessionCorrupted: false,
    sourceKey: PROGRESS_KEYS[grade],
    schemaVersion: null,
  }
}

function missionProgressProjection(
  grade: 1 | 2 | 3,
  record: ParsedRecord,
): LearningProgressProjection {
  if (record.state === 'missing') return emptyProjection(grade, false)
  if (record.state === 'corrupt') return emptyProjection(grade, true)

  const value = record.value
  const completedField = grade === 1 ? 'completedStageIds' : 'completedMissionIds'
  const reviewField = grade === 1 ? 'reviewStageIds' : 'reviewMissionIds'
  const latestField = grade === 1 ? 'latestStageId' : 'latestMissionId'
  const completed = stringList(value, completedField)
  const review = stringList(value, reviewField)
  const latest = optionalString(value, latestField)
  const context = grade === 1
    ? { value: null, valid: true }
    : optionalString(value, 'selectedUnitId')
  const lastActivity = optionalNumber(value, 'lastPlayedAt')
  const valid = completed.valid && review.valid && latest.valid && context.valid && lastActivity.valid

  if (!valid) return emptyProjection(grade, true)

  const activityId = latest.value ?? context.value
  const resume: ProgressResume | null = activityId
    ? {
        activityId,
        contextId: context.value,
        mode: latest.value && review.values.includes(latest.value) ? 'review' : 'mission',
        currentIndex: 0,
      }
    : null
  const hasProgress = completed.values.length > 0 || review.values.length > 0 || resume !== null

  return {
    grade,
    resume,
    completed: completed.values,
    review: review.values,
    lastActivityAt: hasProgress ? lastActivity.value : null,
    corrupted: false,
    sessionCorrupted: false,
    sourceKey: PROGRESS_KEYS[grade],
    schemaVersion: finiteNumber(value.schemaVersion),
  }
}

function grade4ProgressProjection(record: ParsedRecord): LearningProgressProjection {
  if (record.state === 'missing') return emptyProjection(4, false)
  if (record.state === 'corrupt') return emptyProjection(4, true)

  const value = record.value
  const completed = stringList(value, 'completedVariantKeys')
  const review = stringList(value, 'reviewVariantKeys')
  const latest = optionalString(value, 'latestMissionId')
  const context = optionalString(value, 'selectedUnitId')
  const activeItemIndex = optionalNumber(value, 'activeItemIndex')
  const activityRun = optionalNumber(value, 'activityRun')
  const lastActivity = optionalNumber(value, 'lastPlayedAt')
  const valid = value.schemaVersion === 1
    && completed.valid
    && review.valid
    && latest.valid
    && context.valid
    && activeItemIndex.valid
    && activityRun.valid
    && lastActivity.valid
    && activeItemIndex.value !== null
    && Number.isSafeInteger(activeItemIndex.value)
    && activeItemIndex.value >= 0
    && activeItemIndex.value <= 2
    && activityRun.value !== null
    && Number.isSafeInteger(activityRun.value)
    && activityRun.value >= 0

  if (!valid) return emptyProjection(4, true)

  const currentIndex = activeItemIndex.value as number

  const activityId = latest.value ?? context.value
  const resume: ProgressResume | null = activityId
    ? {
        activityId,
        contextId: context.value,
        mode: latest.value && review.values.some((variantKey) => variantKey.startsWith(`${latest.value}:`))
          ? 'review'
          : 'mission',
        currentIndex,
      }
    : null
  const hasProgress = completed.values.length > 0 || review.values.length > 0 || latest.value !== null

  return {
    grade: 4,
    resume,
    completed: completed.values,
    review: review.values,
    lastActivityAt: hasProgress ? lastActivity.value : null,
    corrupted: false,
    sessionCorrupted: false,
    sourceKey: PROGRESS_KEYS[4],
    schemaVersion: 1,
  }
}

function activityMode(value: unknown): LearningActivityMode {
  return value === 'retry-wrong' ? 'review' : 'practice'
}

function sessionItems(record: JsonRecord, conceptId: string): ActivityItemSnapshot[] {
  if (!Array.isArray(record.problems)) return []
  return record.problems.map((problem, sourceIndex) => {
    const candidate = problem && typeof problem === 'object' && !Array.isArray(problem)
      ? problem as JsonRecord
      : {}
    return {
      itemId: nonEmptyString(candidate.templateId) ?? `${conceptId}:item:${sourceIndex}`,
      sourceIndex,
    }
  })
}

function sessionResponses(
  record: JsonRecord,
  items: readonly ActivityItemSnapshot[],
): ActivityResponse[] {
  const answers = Array.isArray(record.answers) ? record.answers : []
  const checkedAnswers = Array.isArray(record.checkedAnswers) ? record.checkedAnswers : []

  return items.map((item, index) => ({
    itemId: item.itemId,
    answer: typeof answers[index] === 'string' ? answers[index] : null,
    checked: typeof checkedAnswers[index] === 'boolean' ? checkedAnswers[index] : null,
  }))
}

function adaptPracticeSession(
  parsed: ParsedRecord,
  now: number,
  grade: 5 | 6,
): { session: LearningActivitySession | null; corrupted: boolean } {
  if (parsed.state === 'missing') return { session: null, corrupted: false }
  if (parsed.state === 'corrupt') return { session: null, corrupted: true }

  const record = parsed.value
  if (grade === 6 && (record.grade !== 6 || (record.itemCount !== 5 && record.itemCount !== 10))) {
    return { session: null, corrupted: true }
  }
  const conceptId = nonEmptyString(record.conceptId)
  const startedAt = finiteNumber(record.startedAt)
  const expiresAt = finiteNumber(record.expiresAt)
  if (!conceptId || startedAt === null || expiresAt === null) {
    return { session: null, corrupted: true }
  }

  const items = sessionItems(record, conceptId)
  const storedIndex = finiteNumber(record.currentIndex)
  if (
    items.length === 0 ||
    storedIndex === null ||
    !Number.isInteger(storedIndex) ||
    storedIndex < 0 ||
    storedIndex >= items.length
  ) {
    return { session: null, corrupted: true }
  }
  const currentIndex = storedIndex
  const updatedAt = finiteNumber(record.updatedAt) ?? startedAt
  const sessionId = nonEmptyString(record.sessionId) ?? `legacy-grade${grade}:${conceptId}:${startedAt}`

  return {
    corrupted: false,
    session: {
      sessionId,
      learnerId: null,
      grade,
      activityId: conceptId,
      mode: activityMode(record.mode),
      items,
      responses: sessionResponses(record, items),
      currentIndex,
      status: now > expiresAt ? 'expired' : 'active',
      startedAt,
      updatedAt,
      expiresAt,
      source: grade === 5 ? 'legacy-grade5-session' : 'native',
    },
  }
}

function practiceProgressProjection(
  progressRecord: ParsedRecord,
  sessionRecord: ParsedRecord,
  now: number,
  grade: 5 | 6,
): LearningProgressProjection {
  const sessionResult = adaptPracticeSession(sessionRecord, now, grade)
  if (progressRecord.state === 'corrupt') {
    return {
      ...emptyProjection(grade, true),
      resume: sessionResult.session?.status === 'active'
        ? {
            activityId: sessionResult.session.activityId,
            contextId: null,
            mode: sessionResult.session.mode,
            currentIndex: sessionResult.session.currentIndex,
          }
        : null,
      lastActivityAt: sessionResult.session?.status === 'active'
        ? sessionResult.session.startedAt
        : null,
      sessionCorrupted: sessionResult.corrupted,
    }
  }

  const entries = progressRecord.state === 'valid'
    ? Object.entries(progressRecord.value)
    : []
  const validEntries: Array<{ id: string; value: JsonRecord }> = []
  let invalidEntry = false

  for (const [key, entry] of entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      invalidEntry = true
      continue
    }
    const value = entry as JsonRecord
    const id = nonEmptyString(value.conceptId) ?? key
    if (!id) {
      invalidEntry = true
      continue
    }
    validEntries.push({ id, value })
  }

  const completed = Array.from(new Set(validEntries.map((entry) => entry.id)))
  const review = Array.from(new Set(
    validEntries.filter((entry) => entry.value.needsReview === true).map((entry) => entry.id)
  ))
  const latest = validEntries
    .slice()
    .sort((left, right) => (
      (finiteNumber(right.value.lastCompletedAt) ?? 0) -
      (finiteNumber(left.value.lastCompletedAt) ?? 0)
    ))[0] ?? null
  const activeSession = sessionResult.session?.status === 'active' ? sessionResult.session : null
  const resume: ProgressResume | null = activeSession
    ? {
        activityId: activeSession.activityId,
        contextId: null,
        mode: activeSession.mode,
        currentIndex: activeSession.currentIndex,
      }
    : latest
      ? {
          activityId: latest.id,
          contextId: null,
          mode: latest.value.needsReview === true ? 'review' : 'practice',
          currentIndex: 0,
        }
      : null
  const latestCompletedAt = latest ? finiteNumber(latest.value.lastCompletedAt) : null
  const lastActivityAt = Math.max(
    latestCompletedAt ?? 0,
    activeSession?.startedAt ?? 0,
  ) || null

  return {
    grade,
    resume,
    completed,
    review,
    lastActivityAt,
    corrupted: invalidEntry,
    sessionCorrupted: sessionResult.corrupted,
    sourceKey: PROGRESS_KEYS[grade],
    schemaVersion: null,
  }
}

class LocalProgressRepository implements ProgressRepository {
  constructor(private readonly storage: ReadonlyLearningStorage | null) {}

  readProgress(grade: LearningGrade, now = Date.now()): LearningProgressProjection {
    if (grade === 5 || grade === 6) {
      return practiceProgressProjection(
        readRecord(this.storage, PROGRESS_KEYS[grade]),
        readRecord(this.storage, grade === 6 ? GRADE6_SESSION_KEY : GRADE5_SESSION_KEY),
        now,
        grade,
      )
    }
    if (grade === 4) return grade4ProgressProjection(readRecord(this.storage, PROGRESS_KEYS[4]))
    return missionProgressProjection(grade, readRecord(this.storage, PROGRESS_KEYS[grade]))
  }

  readAllProgress(now = Date.now()): LearningProgressProjectionMap {
    return Object.fromEntries(
      LEARNING_GRADES.map((grade) => [grade, this.readProgress(grade, now)])
    ) as LearningProgressProjectionMap
  }

  readSession(grade: LearningGrade, now = Date.now()): LearningActivitySession | null {
    if (grade !== 5 && grade !== 6) return null
    return adaptPracticeSession(
      readRecord(this.storage, grade === 6 ? GRADE6_SESSION_KEY : GRADE5_SESSION_KEY),
      now,
      grade,
    ).session
  }

  readAttemptReceipts(_grade: LearningGrade): readonly AttemptReceipt[] {
    // Legacy stores only aggregate progress. Creating receipt IDs, hint usage,
    // or timestamps here would invent learning history and break safe merging.
    return []
  }
}

export function createLocalProgressRepository(
  storage: ReadonlyLearningStorage | null = browserStorage(),
): ProgressRepository {
  return new LocalProgressRepository(storage)
}
