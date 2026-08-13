import { getGrade2MissionSet, grade2Units, type Grade2Mission } from './grade2-problems'
import {
  hasGrade2ApplicationProblemSource,
  isGrade2ApplicationMission,
  type Grade2ApplicationMissionV1,
} from './application-problems/grade2-adapter'
import { isGrade2ApplicationMissionSemanticallyValid } from './application-problems/grade2-snapshot-validator'
import {
  createAdventureState,
  normalizeAdventureState,
  recordAdventureAttempt,
  type AdventureMastery,
} from './adventure-progression'
import { normalizeMissionSketchRunOrdinal } from './mission-sketch-identity'

export const GRADE2_PROGRESS_KEY = 'mathAssist_grade2Progress'
export const GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY =
  'mathAssist_grade2ProgressRecoveryEvidence_v1'
export const GRADE2_PROGRESS_SCHEMA_VERSION = 5

export interface Grade2SkillSummary {
  attempted: number
  correct: number
}

export interface Grade2Progress {
  schemaVersion: number
  completedMissionIds: string[]
  checkedMissionIds: string[]
  completedUnitIds: string[]
  reviewMissionIds: string[]
  latestMissionId: string | null
  selectedUnitId: string | null
  todaySolvedCount: number
  skillSummaryByTag: Record<string, Grade2SkillSummary>
  introDismissedAt: number | null
  lastPlayedAt: number | null
  xp: number
  learningDates: string[]
  solvedVariantKeys: string[]
  masteryByMissionId: Record<string, AdventureMastery>
  missionSketchRunOrdinal: number
  applicationMissionSnapshotsByInstanceId: Record<string, unknown>
  activeApplicationInstanceIdByMissionId: Record<string, string>
}

export interface Grade2ProgressLoadResult {
  progress: Grade2Progress
  storageAvailable: boolean
  recovered: boolean
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const corruptProgressStorages = new WeakSet<object>()
const damagedApplicationProgressSourceByStorage = new WeakMap<object, string>()

export function createInitialGrade2Progress(now = Date.now()): Grade2Progress {
  return {
    schemaVersion: GRADE2_PROGRESS_SCHEMA_VERSION,
    completedMissionIds: [],
    checkedMissionIds: [],
    completedUnitIds: [],
    reviewMissionIds: [],
    latestMissionId: null,
    selectedUnitId: null,
    todaySolvedCount: 0,
    skillSummaryByTag: {},
    introDismissedAt: null,
    lastPlayedAt: now,
    ...createAdventureState(),
    missionSketchRunOrdinal: 0,
    applicationMissionSnapshotsByInstanceId: {},
    activeApplicationInstanceIdByMissionId: {},
  }
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isSameLocalDay(a: number | null, b: number): boolean {
  if (!a) return false
  const left = new Date(a)
  const right = new Date(b)
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return Array.from(new Set(values.filter((id): id is string => typeof id === 'string')))
}

function containsEvery(values: ReadonlySet<string>, required: readonly string[]): boolean {
  return required.length > 0 && required.every((id) => values.has(id))
}

function deriveCompletedUnitIds(
  checkedMissionIds: readonly string[],
  savedUnitIds: unknown,
  acceptLegacyCompletion: boolean,
): string[] {
  const checked = new Set(checkedMissionIds)
  const completed = new Set(uniqueStrings(savedUnitIds))
  for (const unit of grade2Units) {
    const practiceIds = getGrade2MissionSet(unit.id, 'practice').map((mission) => mission.id)
    if (containsEvery(checked, practiceIds)) completed.add(unit.id)
    if (acceptLegacyCompletion) {
      const legacyIds = getGrade2MissionSet(unit.id, 'basic').map((mission) => mission.id)
      if (containsEvery(checked, legacyIds)) completed.add(unit.id)
    }
  }
  return Array.from(completed)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isStructurallyStoredGrade2ApplicationMission(
  value: unknown,
): value is Grade2ApplicationMissionV1 {
  if (!isRecord(value)) return false
  const mission = value as unknown as Grade2Mission
  if (!isGrade2ApplicationMission(mission)) return false
  const source = mission.applicationSource
  return (
    typeof mission.id === 'string' &&
    typeof mission.unitId === 'string' &&
    typeof mission.semester === 'string' &&
    (mission.mode === 'basic' || mission.mode === 'practice') &&
    ['knowing', 'applying', 'reasoning'].includes(mission.cognitiveDomain) &&
    Number.isSafeInteger(mission.stageOrder) &&
    Number.isSafeInteger(mission.unitMissionOrder) &&
    typeof mission.skill === 'string' &&
    typeof mission.difficultyStep === 'string' &&
    typeof mission.curriculumCode === 'string' &&
    isStringArray(mission.directCurriculumCodes) &&
    typeof mission.curriculumText === 'string' &&
    isStringArray(mission.taskActions) &&
    ['decorative', 'schematic', 'quantitative'].includes(mission.visualSemantics) &&
    typeof mission.learnerGoal === 'string' &&
    typeof mission.parentSummaryTag === 'string' &&
    typeof mission.prompt === 'string' &&
    typeof mission.answerType === 'string' &&
    isRecord(mission.answerConfig) &&
    isRecord(mission.params) &&
    (mission.choices === undefined || isStringArray(mission.choices)) &&
    typeof mission.correctAnswer === 'string' &&
    typeof mission.visualModel === 'string' &&
    isRecord(mission.visualConfig) &&
    isStringArray(mission.hintSteps) &&
    isStringArray(mission.solutionSteps) &&
    typeof mission.rewardId === 'string' &&
    typeof source.instanceId === 'string' &&
    typeof source.familyId === 'string' &&
    Number.isSafeInteger(source.generatorVersion) &&
    Number.isSafeInteger(source.seed) &&
    Number.isSafeInteger(source.variantIndex) &&
    source.variantIndex >= 0 &&
    isStringArray(source.curriculumCodes)
  )
}

interface NormalizedApplicationMissionSnapshots {
  snapshotsByInstanceId: Record<string, unknown>
  activeInstanceIdByMissionId: Record<string, string>
  invalid: boolean
}

function normalizeApplicationMissionSnapshots(
  candidate: Record<string, unknown>,
  schemaVersion: number,
): NormalizedApplicationMissionSnapshots {
  const snapshotsByInstanceId: Record<string, unknown> = {}
  const activeInstanceIdByMissionId: Record<string, string> = {}
  let invalid = false

  if (schemaVersion === 2 && candidate.applicationMissionSnapshotsById !== undefined) {
    const legacySnapshots = candidate.applicationMissionSnapshotsById
    if (!isRecord(legacySnapshots)) {
      invalid = true
    } else {
      Object.entries(legacySnapshots).forEach(([missionId, value]) => {
        if (!isStructurallyStoredGrade2ApplicationMission(value) || value.id !== missionId) {
          const unresolvedKey = `unresolved-v2:${missionId}`
          snapshotsByInstanceId[unresolvedKey] = value
          activeInstanceIdByMissionId[missionId] = unresolvedKey
          invalid = true
          return
        }
        const instanceId = value.applicationSource.instanceId
        snapshotsByInstanceId[instanceId] = value
        activeInstanceIdByMissionId[missionId] = instanceId
        if (!isGrade2ApplicationMissionSemanticallyValid(value)) invalid = true
      })
    }
  }

  const hasCurrentArchive = candidate.applicationMissionSnapshotsByInstanceId !== undefined
    || candidate.activeApplicationInstanceIdByMissionId !== undefined
  if (schemaVersion >= 3 && (hasCurrentArchive || schemaVersion === GRADE2_PROGRESS_SCHEMA_VERSION)) {
    const archive = candidate.applicationMissionSnapshotsByInstanceId
    if (!isRecord(archive)) {
      invalid = true
    } else {
      Object.entries(archive).forEach(([instanceId, value]) => {
        snapshotsByInstanceId[instanceId] = value
        if (
          !isStructurallyStoredGrade2ApplicationMission(value) ||
          value.applicationSource.instanceId !== instanceId
        ) {
          invalid = true
          return
        }
        if (!isGrade2ApplicationMissionSemanticallyValid(value)) invalid = true
      })
    }

    const activePointers = candidate.activeApplicationInstanceIdByMissionId
    if (!isRecord(activePointers)) {
      invalid = true
    } else {
      Object.entries(activePointers).forEach(([missionId, instanceId]) => {
        if (typeof instanceId !== 'string') {
          invalid = true
          return
        }
        activeInstanceIdByMissionId[missionId] = instanceId
        const snapshot = snapshotsByInstanceId[instanceId]
        if (
          !isStructurallyStoredGrade2ApplicationMission(snapshot) ||
          snapshot.id !== missionId
        ) {
          invalid = true
        }
      })
    }
  }

  return { snapshotsByInstanceId, activeInstanceIdByMissionId, invalid }
}

interface NormalizedGrade2Progress {
  progress: Grade2Progress
  invalidApplicationSnapshots: boolean
}

function normalizeProgress(value: unknown, now: number): NormalizedGrade2Progress | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown> & Partial<Grade2Progress>

  if (![1, 2, 3, 4, GRADE2_PROGRESS_SCHEMA_VERSION].includes(candidate.schemaVersion as number)) return null
  if (!Array.isArray(candidate.completedMissionIds)) return null
  if (!Array.isArray(candidate.reviewMissionIds)) return null
  if (
    candidate.latestMissionId !== null &&
    candidate.latestMissionId !== undefined &&
    typeof candidate.latestMissionId !== 'string'
  ) {
    return null
  }
  if (
    candidate.selectedUnitId !== null &&
    candidate.selectedUnitId !== undefined &&
    typeof candidate.selectedUnitId !== 'string'
  ) {
    return null
  }
  if (!candidate.skillSummaryByTag || typeof candidate.skillSummaryByTag !== 'object') {
    return null
  }

  const completedMissionIds = uniqueStrings(candidate.completedMissionIds)
  const checkedMissionIds = Array.isArray(candidate.checkedMissionIds)
    ? uniqueStrings(candidate.checkedMissionIds)
    : uniqueStrings([...candidate.completedMissionIds, ...candidate.reviewMissionIds])
  const lastPlayedAt = typeof candidate.lastPlayedAt === 'number' ? candidate.lastPlayedAt : now
  const adventure = normalizeAdventureState(candidate, completedMissionIds, lastPlayedAt)
  const applicationSnapshots = normalizeApplicationMissionSnapshots(
    candidate,
    candidate.schemaVersion as number,
  )

  return {
    progress: {
      schemaVersion: GRADE2_PROGRESS_SCHEMA_VERSION,
      completedMissionIds,
      checkedMissionIds,
      completedUnitIds: deriveCompletedUnitIds(
        checkedMissionIds,
        candidate.completedUnitIds,
        Number(candidate.schemaVersion) < 4,
      ),
      reviewMissionIds: uniqueStrings(candidate.reviewMissionIds),
      latestMissionId: candidate.latestMissionId ?? null,
      selectedUnitId: candidate.selectedUnitId ?? null,
      todaySolvedCount: isSameLocalDay(candidate.lastPlayedAt ?? null, now)
        ? Number(candidate.todaySolvedCount ?? 0)
        : 0,
      skillSummaryByTag: candidate.skillSummaryByTag as Record<string, Grade2SkillSummary>,
      introDismissedAt:
        typeof candidate.introDismissedAt === 'number' ? candidate.introDismissedAt : null,
      lastPlayedAt,
      ...adventure,
      missionSketchRunOrdinal: normalizeMissionSketchRunOrdinal(candidate.missionSketchRunOrdinal),
      applicationMissionSnapshotsByInstanceId: applicationSnapshots.snapshotsByInstanceId,
      activeApplicationInstanceIdByMissionId: applicationSnapshots.activeInstanceIdByMissionId,
    },
    invalidApplicationSnapshots: applicationSnapshots.invalid,
  }
}

export function loadGrade2Progress(
  storage: StorageLike | null = getBrowserStorage(),
  now = Date.now()
): Grade2ProgressLoadResult {
  if (!storage) {
    return {
      progress: createInitialGrade2Progress(now),
      storageAvailable: false,
      recovered: false,
    }
  }

  try {
    const raw = storage.getItem(GRADE2_PROGRESS_KEY)
    if (!raw) {
      return {
        progress: createInitialGrade2Progress(now),
        storageAvailable: true,
        recovered: false,
      }
    }

    const normalized = normalizeProgress(JSON.parse(raw), now)
    if (!normalized) {
      corruptProgressStorages.add(storage)
      return {
        progress: createInitialGrade2Progress(now),
        storageAvailable: true,
        recovered: true,
      }
    }

    if (normalized.invalidApplicationSnapshots) {
      corruptProgressStorages.add(storage)
      damagedApplicationProgressSourceByStorage.set(storage, raw)
    }

    return {
      progress: normalized.progress,
      storageAvailable: true,
      recovered: normalized.invalidApplicationSnapshots,
    }
  } catch {
    corruptProgressStorages.add(storage)
    return {
      progress: createInitialGrade2Progress(now),
      storageAvailable: false,
      recovered: true,
    }
  }
}

export function saveGrade2Progress(
  progress: Grade2Progress,
  storage: StorageLike | null = getBrowserStorage()
): boolean {
  if (!storage || corruptProgressStorages.has(storage)) return false
  try {
    storage.setItem(GRADE2_PROGRESS_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

interface Grade2ProgressRecoveryEvidenceV1 {
  schemaVersion: 1
  damagedProgressSources: string[]
}

function parseGrade2ProgressRecoveryEvidence(
  raw: string | null,
): Grade2ProgressRecoveryEvidenceV1 | null {
  if (raw === null) return { schemaVersion: 1, damagedProgressSources: [] }
  try {
    const candidate = JSON.parse(raw) as unknown
    if (!isRecord(candidate) || candidate.schemaVersion !== 1) return null
    if (!isStringArray(candidate.damagedProgressSources)) return null
    return {
      schemaVersion: 1,
      damagedProgressSources: Array.from(new Set(candidate.damagedProgressSources)),
    }
  } catch {
    return null
  }
}

function withoutInvalidApplicationSnapshots(progress: Grade2Progress): Grade2Progress {
  const applicationMissionSnapshotsByInstanceId = Object.fromEntries(
    Object.entries(progress.applicationMissionSnapshotsByInstanceId).filter(
      ([instanceId, snapshot]) => (
        isStructurallyStoredGrade2ApplicationMission(snapshot) &&
        snapshot.applicationSource.instanceId === instanceId &&
        isGrade2ApplicationMissionSemanticallyValid(snapshot)
      ),
    ),
  )
  const activeApplicationInstanceIdByMissionId = Object.fromEntries(
    Object.entries(progress.activeApplicationInstanceIdByMissionId).filter(
      ([missionId, instanceId]) => {
        const snapshot = applicationMissionSnapshotsByInstanceId[instanceId]
        return isStructurallyStoredGrade2ApplicationMission(snapshot) && snapshot.id === missionId
      },
    ),
  )
  return {
    ...progress,
    applicationMissionSnapshotsByInstanceId,
    activeApplicationInstanceIdByMissionId,
  }
}

/**
 * Persists a learner-requested replacement for a blocked application mission.
 * Automatic saves remain disabled for damaged progress. This explicit recovery
 * path first archives the exact original storage source, then writes a clean
 * authoritative progress record with the validated replacement activated.
 */
export function persistGrade2ApplicationMissionReplacement(
  progress: Grade2Progress,
  replacementMission: Grade2Mission,
  storage: StorageLike | null = getBrowserStorage(),
): Grade2Progress | null {
  if (!storage) return null
  const activated = activateGrade2ApplicationMissionSnapshot(progress, replacementMission)
  const activeReplacement = getActiveGrade2ApplicationMissionSnapshot(
    activated,
    replacementMission.id,
  )
  if (
    !isGrade2ApplicationMission(replacementMission) ||
    !activeReplacement ||
    !sameSnapshot(activeReplacement, replacementMission)
  ) {
    return null
  }

  const damagedSource = damagedApplicationProgressSourceByStorage.get(storage)
  if (!damagedSource) {
    return saveGrade2Progress(activated, storage) ? activated : null
  }

  const recoveredProgress = withoutInvalidApplicationSnapshots(activated)
  const recoveredActiveReplacement = getActiveGrade2ApplicationMissionSnapshot(
    recoveredProgress,
    replacementMission.id,
  )
  if (!recoveredActiveReplacement || !sameSnapshot(recoveredActiveReplacement, replacementMission)) {
    return null
  }

  try {
    if (storage.getItem(GRADE2_PROGRESS_KEY) !== damagedSource) return null
    const evidence = parseGrade2ProgressRecoveryEvidence(
      storage.getItem(GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY),
    )
    if (!evidence) return null
    const damagedProgressSources = evidence.damagedProgressSources.includes(damagedSource)
      ? evidence.damagedProgressSources
      : [...evidence.damagedProgressSources, damagedSource]
    storage.setItem(
      GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY,
      JSON.stringify({ schemaVersion: 1, damagedProgressSources }),
    )
    storage.setItem(GRADE2_PROGRESS_KEY, JSON.stringify(recoveredProgress))
    corruptProgressStorages.delete(storage)
    damagedApplicationProgressSourceByStorage.delete(storage)
    return recoveredProgress
  } catch {
    return null
  }
}

function toggleId(ids: string[], id: string, present: boolean): string[] {
  const set = new Set(ids)
  if (present) {
    set.add(id)
  } else {
    set.delete(id)
  }
  return Array.from(set)
}

export function selectGrade2Unit(
  progress: Grade2Progress,
  unitId: string,
  now = Date.now()
): Grade2Progress {
  return {
    ...progress,
    selectedUnitId: unitId,
    lastPlayedAt: now,
  }
}

export function getGrade2PracticeMissionIds(unitId: string): string[] {
  return getGrade2MissionSet(unitId, 'practice').map((mission) => mission.id)
}

export function isGrade2UnitComplete(
  progress: Pick<Grade2Progress, 'checkedMissionIds' | 'completedUnitIds'>,
  unitId: string,
): boolean {
  if (progress.completedUnitIds.includes(unitId)) return true
  const checked = new Set(progress.checkedMissionIds)
  const practiceMissionIds = getGrade2PracticeMissionIds(unitId)
  return practiceMissionIds.length === 6
    && practiceMissionIds.every((missionId) => checked.has(missionId))
}

export function dismissGrade2Intro(progress: Grade2Progress, now = Date.now()): Grade2Progress {
  if (progress.introDismissedAt !== null) return progress
  return {
    ...progress,
    introDismissedAt: now,
    lastPlayedAt: now,
  }
}

function canonical(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(canonical)
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonical(entry)]),
  )
}

function sameSnapshot(left: Grade2Mission, right: Grade2Mission): boolean {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right))
}

export function activateGrade2ApplicationMissionSnapshot(
  progress: Grade2Progress,
  mission: Grade2Mission,
): Grade2Progress {
  if (
    !isGrade2ApplicationMission(mission) ||
    !isGrade2ApplicationMissionSemanticallyValid(mission)
  ) {
    return progress
  }

  const instanceId = mission.applicationSource.instanceId
  const existing = progress.applicationMissionSnapshotsByInstanceId[instanceId]
  if (
    existing !== undefined &&
    (!isStructurallyStoredGrade2ApplicationMission(existing) || !sameSnapshot(existing, mission))
  ) return progress
  if (
    existing &&
    progress.activeApplicationInstanceIdByMissionId[mission.id] === instanceId
  ) {
    return progress
  }

  return {
    ...progress,
    applicationMissionSnapshotsByInstanceId: existing
      ? progress.applicationMissionSnapshotsByInstanceId
      : {
          ...progress.applicationMissionSnapshotsByInstanceId,
          [instanceId]: JSON.parse(JSON.stringify(mission)) as Grade2Mission,
        },
    activeApplicationInstanceIdByMissionId: {
      ...progress.activeApplicationInstanceIdByMissionId,
      [mission.id]: instanceId,
    },
  }
}

export function getActiveGrade2ApplicationMissionSnapshot(
  progress: Pick<
    Grade2Progress,
    'applicationMissionSnapshotsByInstanceId' | 'activeApplicationInstanceIdByMissionId'
  >,
  missionId: string,
): Grade2Mission | undefined {
  const instanceId = progress.activeApplicationInstanceIdByMissionId[missionId]
  if (!instanceId) return undefined
  const snapshot = progress.applicationMissionSnapshotsByInstanceId[instanceId]
  return isStructurallyStoredGrade2ApplicationMission(snapshot) &&
    snapshot.id === missionId &&
    isGrade2ApplicationMissionSemanticallyValid(snapshot)
    ? snapshot
    : undefined
}

export function recordGrade2Attempt(
  progress: Grade2Progress,
  mission: Grade2Mission,
  correct: boolean,
  options: {
    hadHint?: boolean
    countSolved?: boolean
    now?: number
    variantKey?: string
    wrongAttempts?: number
    difficultyBonus?: number
  } = {}
): Grade2Progress {
  if (hasGrade2ApplicationProblemSource(mission)) {
    if (!isGrade2ApplicationMission(mission)) return progress
    const activeSnapshot = getActiveGrade2ApplicationMissionSnapshot(progress, mission.id)
    if (
      !activeSnapshot ||
      !isGrade2ApplicationMissionSemanticallyValid(mission) ||
      !sameSnapshot(activeSnapshot, mission)
    ) {
      return progress
    }
  }
  const now = options.now ?? Date.now()
  const countSolved = options.countSolved ?? true
  const variantKey = options.variantKey ?? `${mission.id}:legacy`
  const alreadySolvedVariant = progress.solvedVariantKeys.includes(variantKey)
  const summary = progress.skillSummaryByTag[mission.parentSummaryTag] ?? {
    attempted: 0,
    correct: 0,
  }

  const adventure = recordAdventureAttempt({
    xp: progress.xp,
    learningDates: progress.learningDates,
    solvedVariantKeys: progress.solvedVariantKeys,
    masteryByMissionId: progress.masteryByMissionId,
  }, mission.id, correct, {
    variantKey,
    now,
    hadHint: options.hadHint,
    wrongAttempts: options.wrongAttempts,
    difficultyBonus: options.difficultyBonus,
  })
  const checkedMissionIds = toggleId(progress.checkedMissionIds, mission.id, true)
  const completedUnitIds = containsEvery(
    new Set(checkedMissionIds),
    getGrade2PracticeMissionIds(mission.unitId),
  )
    ? toggleId(progress.completedUnitIds, mission.unitId, true)
    : progress.completedUnitIds

  return {
    ...progress,
    checkedMissionIds,
    completedUnitIds,
    completedMissionIds: correct
      ? toggleId(progress.completedMissionIds, mission.id, true)
      : progress.completedMissionIds,
    reviewMissionIds:
      correct && !options.hadHint
        ? toggleId(progress.reviewMissionIds, mission.id, false)
        : toggleId(progress.reviewMissionIds, mission.id, true),
    latestMissionId: mission.id,
    selectedUnitId: mission.unitId,
    todaySolvedCount: correct && countSolved && !alreadySolvedVariant
      ? progress.todaySolvedCount + 1
      : progress.todaySolvedCount,
    skillSummaryByTag: {
      ...progress.skillSummaryByTag,
      [mission.parentSummaryTag]: {
        attempted: summary.attempted + 1,
        correct: summary.correct + (correct ? 1 : 0),
      },
    },
    lastPlayedAt: now,
    ...adventure,
  }
}

export function mergeGrade2ApplicationMissionSnapshots(
  missions: readonly Grade2Mission[],
  progress: Pick<
    Grade2Progress,
    'applicationMissionSnapshotsByInstanceId' | 'activeApplicationInstanceIdByMissionId'
  >,
  options: { preferLiveMissionIds?: readonly string[] } = {},
): Grade2Mission[] {
  const preferLiveMissionIds = new Set(options.preferLiveMissionIds ?? [])
  const merged = missions.flatMap((mission) => {
    if (preferLiveMissionIds.has(mission.id)) return [mission]
    const activeInstanceId = progress.activeApplicationInstanceIdByMissionId[mission.id]
    if (!activeInstanceId) return [mission]
    const stored = progress.applicationMissionSnapshotsByInstanceId[activeInstanceId]
    return isStructurallyStoredGrade2ApplicationMission(stored) && stored.id === mission.id
      ? [stored]
      : []
  })
  const currentIds = new Set(merged.map((mission) => mission.id))
  for (const missionId of Object.keys(progress.activeApplicationInstanceIdByMissionId)) {
    const snapshot = getActiveGrade2ApplicationMissionSnapshot(progress, missionId)
    if (!snapshot) continue
    if (currentIds.has(snapshot.id)) continue
    currentIds.add(snapshot.id)
    merged.push(snapshot)
  }
  return merged.sort((left, right) => (
    left.stageOrder - right.stageOrder ||
    left.unitMissionOrder - right.unitMissionOrder ||
    left.id.localeCompare(right.id)
  ))
}

export function resetGrade2Progress(
  storage: StorageLike | null = getBrowserStorage(),
  now = Date.now()
): Grade2Progress {
  const progress = createInitialGrade2Progress(now)
  if (storage) {
    try {
      storage.removeItem(GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY)
    } catch {
      corruptProgressStorages.add(storage)
      return progress
    }
    corruptProgressStorages.delete(storage)
    damagedApplicationProgressSourceByStorage.delete(storage)
  }
  saveGrade2Progress(progress, storage)
  return progress
}
