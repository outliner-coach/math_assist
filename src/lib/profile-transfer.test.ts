import { describe, expect, it } from 'vitest'

import type { AttemptReceipt } from './attempt-receipt'
import { ATTEMPT_RECEIPT_STORAGE_KEY } from './attempt-receipt'
import {
  DEFAULT_MAX_LOCAL_PROFILES,
  LOCAL_PROFILE_REGISTRY_KEY,
  createInitialLocalProfileRegistry,
  writeLocalProfileRegistry,
  type LocalProfileRegistryV1,
} from './local-profile'
import { PROFILE_SCOPED_STORAGE_PREFIX, createProfileScopedStorageKey } from './profile-scoped-storage'
import {
  applyProfileImport,
  buildPortableProfileExport,
  parsePortableProfileExport,
  previewProfileImport,
  serializePortableProfileExport,
  type PortableProfileExportV1,
  type ProfileImportPreviewV1,
} from './profile-transfer'
import type { ProfileRegistryStorage } from './local-profile'

const NOW = 1_721_520_000_000
const PROFILE_A = 'local_11111111-1111-4111-8111-111111111111'
const PROFILE_B = 'local_22222222-2222-4222-9222-222222222222'
const PROFILE_C_RANDOM_UUID = '33333333-3333-4333-a333-333333333333'

class MemoryStorage implements ProfileRegistryStorage {
  private readonly map = new Map<string, string>()

  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }

  get length(): number {
    return this.map.size
  }

  key(index: number): string | null {
    return Array.from(this.map.keys()).sort()[index] ?? null
  }

  dump(): Record<string, string> {
    return Object.fromEntries(this.map)
  }

  failSetsFor(failingKey: string): void {
    const original = this.setItem.bind(this)
    let failed = false
    this.setItem = (key: string, value: string) => {
      if (key === failingKey && !failed) {
        failed = true
        throw new Error('quota exceeded')
      }
      original(key, value)
    }
  }
}

function seedRegistry(
  storage: MemoryStorage,
  profileIds: string[],
  options: { nicknames?: Record<string, string | null>; activeProfileId?: string } = {},
): LocalProfileRegistryV1 {
  const registry: LocalProfileRegistryV1 = {
    schemaVersion: 1,
    activeProfileId: options.activeProfileId ?? profileIds[0],
    profiles: profileIds.map((profileId, index) => ({
      profileId,
      nickname: options.nicknames?.[profileId] ?? null,
      createdAt: NOW - 10_000 - index,
      updatedAt: NOW - 9_000,
    })),
    migration: { schemaVersion: 1, status: 'verified', targetProfileId: profileIds[0], backupKey: 'backup' },
  }
  writeLocalProfileRegistry(storage, registry)
  return registry
}

interface MutableExportFile {
  format: string
  schemaVersion: number
  exportedAt: number
  appRelease: string
  contentRelease: string
  profile: { profileId: string; nickname: string | null }
  learning: {
    gradeProgress: Array<{
      grade: number
      completedIds: string[]
      reviewIds: string[]
      setCompletion: Array<Record<string, unknown>>
    }>
    receipts: Array<Record<string, unknown>>
    recentActivity: unknown
    mascotId: string
  }
  digest: { algorithm: string; value: string }
}

const cloneFile = (json: string): MutableExportFile => JSON.parse(json) as MutableExportFile

function receipt(overrides: Partial<AttemptReceipt> = {}): AttemptReceipt {  return {
    schemaVersion: 1,
    attemptId: 'attempt:aaa1',
    learnerId: PROFILE_A,
    sessionId: 'session-1',
    activityId: 'g2-1-place-value',
    grade: 2,
    itemId: 'g2-m1:item-0',
    attemptOrdinal: 0,
    variantKey: 'g2-m1:v0',
    contentReleaseId: 'grade2-v1',
    correct: false,
    usedHint: true,
    checkedAt: NOW - 5_000,
    dedupeKey: 'content:abc',
    ...overrides,
  }
}

interface SeedOptions {
  registry?: { profiles: string[]; nicknames?: Record<string, string | null>; activeProfileId?: string }
  grade2?: Record<string, unknown>
  grade6?: Record<string, unknown>
  receipts?: AttemptReceipt[]
  mascot?: string
  guestHome?: Record<string, unknown>
  pollution?: boolean
}

function seedProfileAStorage(seed: SeedOptions = {}): MemoryStorage {
  const storage = new MemoryStorage()
  const profiles = seed.registry?.profiles ?? [PROFILE_A]
  seedRegistry(storage, profiles, {
    nicknames: seed.registry?.nicknames,
    activeProfileId: seed.registry?.activeProfileId,
  })
  const scoped = (legacyKey: string): string => createProfileScopedStorageKey(PROFILE_A, legacyKey)

  if (seed.grade2) storage.setItem(scoped('mathAssist_grade2Progress'), JSON.stringify(seed.grade2))
  if (seed.grade6) storage.setItem(scoped('mathAssist_grade6Progress'), JSON.stringify(seed.grade6))
  if (seed.receipts) {
    storage.setItem(scoped(ATTEMPT_RECEIPT_STORAGE_KEY), JSON.stringify({ schemaVersion: 1, receipts: seed.receipts }))
  }
  if (seed.mascot) storage.setItem(scoped('mathAssist_mascot_v1'), JSON.stringify({ avatarId: seed.mascot }))
  if (seed.guestHome) storage.setItem(scoped('mathAssist_guestHome_v1'), JSON.stringify(seed.guestHome))

  if (seed.pollution) {
    storage.setItem(scoped('mathAssist_currentSession'), JSON.stringify({
      conceptId: 'g6-concept-a', answers: ['비밀정답42'], checkedAnswers: [true],
      sessionId: 'leak-session', problems: [], currentIndex: 0, setId: 'A', mode: 'standard',
      startedAt: NOW - 900_000, expiresAt: NOW + 900_000,
    }))
    storage.setItem(scoped('mathAssist_lastResult'), JSON.stringify({
      sessionId: 'leak-result', conceptId: 'g6-concept-a', setId: 'A', mode: 'standard',
      score: 1, total: 1, wrongCount: 0, completedAt: NOW - 800_000,
      results: [{ index: 0, correct: true, userAnswer: '내답안', correctAnswer: '기계정답99', solutionSteps: [], problem: { index: 0, templateId: 't', type: 'number', prompt: 'p' } }],
    }))
    storage.setItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_sketch_index_v1:[null]'), '[]')
    storage.setItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_sketch_v1:' + encodeURIComponent(JSON.stringify([null, 's', 'i']))), '{"strokes":[1,2,3]}')
    storage.setItem(scoped('mathAssist_progressBackup_v1:123'), '{"schemaVersion":1,"createdAt":123}')
    storage.setItem('mathAssist_tabHolderId_v1', 'device-holder-id')
    storage.setItem('mathAssist_releaseMetadata', '{"appRelease":"x"}')
  }
  return storage
}

const GRADE2_SEED: Record<string, unknown> = {
  schemaVersion: 4,
  completedMissionIds: ['g2-m2'],
  checkedMissionIds: ['g2-m1', 'g2-m2'],
  completedUnitIds: ['g2-1-place-value'],
  reviewMissionIds: [],
  latestMissionId: null,
  selectedUnitId: null,
  todaySolvedCount: 0,
  skillSummaryByTag: {},
  introDismissedAt: null,
  lastPlayedAt: NOW - 7_000,
  xp: 3,
  learningDates: [],
  solvedVariantKeys: [],
  masteryByMissionId: {},
  missionSketchRunOrdinal: 0,
}

const GRADE6_SEED: Record<string, unknown> = {
  'g6-concept-a': {
    conceptId: 'g6-concept-a',
    attemptCount: 2,
    bestScore: 80,
    latestScore: 60,
    lastCompletedAt: NOW - 6_000,
    needsReview: true,
    lastMode: 'retry-wrong',
    completionRecord: {
      completedBasicSetActivityIds: ['g6-concept-a'],
      completedPracticeSetActivityIds: [],
    },
  },
}

const exportDeps = (storage: MemoryStorage) => ({
  storage,
  now: () => NOW,
  appRelease: 'app-test-1',
  contentRelease: 'content-test-1',
})

async function buildValidFile(seed: SeedOptions = {}): Promise<{ storage: MemoryStorage; file: PortableProfileExportV1; json: string }> {
  const storage = seedProfileAStorage(seed)
  const file = await buildPortableProfileExport(PROFILE_A, exportDeps(storage))
  return { storage, file, json: serializePortableProfileExport(file) }
}

describe('buildPortableProfileExport', () => {
  it('builds the exact portable contract with canonical digest and normalized receipts', async () => {
    const { file } = await buildValidFile({
      grade2: GRADE2_SEED,
      grade6: GRADE6_SEED,
      receipts: [
        receipt({ attemptId: 'attempt:b', checkedAt: NOW - 4_000, learnerId: null }),
        receipt({ attemptId: 'attempt:a', checkedAt: NOW - 5_000 }),
      ],
      mascot: 'moa',
      guestHome: { activeGrade: 2 },
    })

    expect(file.format).toBe('math-assist-profile')
    expect(file.schemaVersion).toBe(1)
    expect(file.exportedAt).toBe(NOW)
    expect(file.appRelease).toBe('app-test-1')
    expect(file.contentRelease).toBe('content-test-1')
    expect(file.profile).toEqual({ profileId: PROFILE_A, nickname: null })
    expect(file.learning.mascotId).toBe('moa')
    expect(file.digest).toEqual({ algorithm: 'SHA-256', value: expect.stringMatching(/^[0-9a-f]{64}$/) as string })

    expect(file.learning.gradeProgress.map((entry) => entry.grade)).toEqual([1, 2, 3, 4, 5, 6])
    const grade2 = file.learning.gradeProgress.find((entry) => entry.grade === 2)
    expect(grade2?.completedIds).toEqual(['g2-m2'])
    expect(grade2?.reviewIds).toEqual([])
    expect(grade2?.setCompletion).toEqual([
      { activityId: 'g2-1-place-value', hasCompletedBasicSet: false, hasCompletedPracticeSet: false, legacyCompleted: true },
    ])

    const grade6 = file.learning.gradeProgress.find((entry) => entry.grade === 6)
    expect(grade6?.completedIds).toEqual(['g6-concept-a'])
    expect(grade6?.reviewIds).toEqual(['g6-concept-a'])
    expect(grade6?.setCompletion).toEqual([
      { activityId: 'g6-concept-a', hasCompletedBasicSet: true, hasCompletedPracticeSet: false, legacyCompleted: false },
    ])

    expect(file.learning.receipts.map((item) => item.attemptId)).toEqual(['attempt:a', 'attempt:b'])
    expect(file.learning.receipts.every((item) => item.learnerId === PROFILE_A)).toBe(true)
  })

  it('sorts ids and set completions deterministically and derives recentActivity from the newest projection', async () => {
    const seeded: Record<string, unknown> = {
      ...GRADE2_SEED,
      completedMissionIds: ['g2-b', 'g2-a', 'g2-a'],
      reviewMissionIds: ['g2-d', 'g2-c'],
      lastPlayedAt: NOW - 1_000,
    }
    const { file } = await buildValidFile({ grade2: seeded })
    const grade2 = file.learning.gradeProgress.find((entry) => entry.grade === 2)
    expect(grade2?.completedIds).toEqual(['g2-a', 'g2-b'])
    expect(grade2?.reviewIds).toEqual(['g2-c', 'g2-d'])

    expect(file.learning.recentActivity).toEqual({ grade: 2, activityId: 'g2-a', at: NOW - 1_000 })
  })

  it('keeps answer data, sessions, results, sketches, internal backups and device ids out of the export', async () => {
    const { json, file } = await buildValidFile({
      grade2: GRADE2_SEED,
      receipts: [receipt()],
      pollution: true,
    })

    expect(json).not.toContain('비밀정답42')
    expect(json).not.toContain('기계정답99')
    expect(json).not.toContain('내답안')
    expect(json).not.toContain('mathAssist_sketch')
    expect(json).not.toContain('progressBackup')
    expect(json).not.toContain('tabHolder')
    expect(json).not.toContain('device-holder-id')
    expect(json).not.toContain('"answers"')
    expect(json).not.toContain('"correctAnswer"')

    const topLevel = Object.keys(file).sort()
    expect(topLevel).toEqual([
      'appRelease', 'contentRelease', 'digest', 'exportedAt', 'format', 'learning', 'profile', 'schemaVersion',
    ])
    expect(Object.keys(file.learning).sort()).toEqual(['gradeProgress', 'mascotId', 'receipts', 'recentActivity'])
    expect(JSON.stringify(file)).not.toContain('leak-session')
  })

  it('rejects exporting an unknown profile without touching storage', async () => {
    const storage = seedProfileAStorage({ grade2: GRADE2_SEED })
    const before = storage.dump()
    await expect(buildPortableProfileExport(PROFILE_B, exportDeps(storage))).rejects.toMatchObject({
      errorCode: 'EXPORT_PROFILE_NOT_FOUND',
    })
    expect(storage.dump()).toEqual(before)
  })
})

describe('parsePortableProfileExport rejects whole file on violations', () => {
  it.each([
    ['not json at all', '{{{', ['NOT_VALID_JSON']],
    ['oversized file', '{"format":"' + 'a'.repeat(5 * 1024 * 1024) + '"}', ['FILE_TOO_LARGE']],
  ])('rejects %s', async (_label, raw, expectedErrors) => {
    const result = await parsePortableProfileExport(raw, { now: () => NOW })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      for (const code of expectedErrors) expect(result.errors).toContain(code)
    }
  })

  it('rejects unsupported format and schema versions', async () => {
    const { json } = await buildValidFile()
    const parsedFormat = cloneFile(json)
    parsedFormat.format = 'other-tool-export'
    const formatResult = await parsePortableProfileExport(JSON.stringify(parsedFormat), { now: () => NOW })
    expect(formatResult.ok).toBe(false)
    if (!formatResult.ok) expect(formatResult.errors).toContain('FORMAT_UNSUPPORTED')

    const parsedSchema = cloneFile(json)
    parsedSchema.schemaVersion = 2
    const schemaResult = await parsePortableProfileExport(JSON.stringify(parsedSchema), { now: () => NOW })
    expect(schemaResult.ok).toBe(false)
    if (!schemaResult.ok) expect(schemaResult.errors).toContain('SCHEMA_VERSION_UNSUPPORTED')
  })

  it('rejects unknown extra fields anywhere in the file', async () => {
    const { json } = await buildValidFile({ grade2: GRADE2_SEED })
    const extraTopFile: Record<string, unknown> = cloneFile(json) as unknown as Record<string, unknown>
    extraTopFile.sneakyExtra = true
    const extraTop = await parsePortableProfileExport(JSON.stringify(extraTopFile), { now: () => NOW })
    expect(extraTop.ok).toBe(false)
    if (!extraTop.ok) expect(extraTop.errors).toContain('TOP_LEVEL_SHAPE_INVALID')

    const parsedLearning = cloneFile(json)
    ;(parsedLearning.learning as unknown as Record<string, unknown>).deviceFingerprint = 'xyz'
    const extraLearning = await parsePortableProfileExport(JSON.stringify(parsedLearning), { now: () => NOW })
    expect(extraLearning.ok).toBe(false)
    if (!extraLearning.ok) expect(extraLearning.errors).toContain('LEARNING_SHAPE_INVALID')

    const parsedReceipt = cloneFile(json)
    parsedReceipt.learning.receipts.push({ ...parsedReceipt.learning.receipts[0], stolenField: 1 })
    const extraReceipt = await parsePortableProfileExport(JSON.stringify(parsedReceipt), { now: () => NOW })
    expect(extraReceipt.ok).toBe(false)
    if (!extraReceipt.ok) expect(extraReceipt.errors).toContain('RECEIPT_INVALID')
  })

  it('enforces grades exactly 1-6 once each, sorted unique ids and sorted set completions', async () => {
    const { json } = await buildValidFile({ grade2: GRADE2_SEED })

    const missingGrade = cloneFile(json)
    missingGrade.learning.gradeProgress = missingGrade.learning.gradeProgress.filter((entry) => entry.grade !== 3)
    const r1 = await parsePortableProfileExport(JSON.stringify(missingGrade), { now: () => NOW })
    expect(r1.ok).toBe(false)
    if (!r1.ok) expect(r1.errors).toContain('GRADE_SET_INVALID')

    const duplicatedGrade = cloneFile(json)
    duplicatedGrade.learning.gradeProgress = [...duplicatedGrade.learning.gradeProgress, duplicatedGrade.learning.gradeProgress[0]]
    const r2 = await parsePortableProfileExport(JSON.stringify(duplicatedGrade), { now: () => NOW })
    expect(r2.ok).toBe(false)
    if (!r2.ok) expect(r2.errors).toContain('GRADE_SET_INVALID')

    const unsortedIds = cloneFile(json)
    unsortedIds.learning.gradeProgress[1].completedIds = ['z-last', 'a-first']
    const r3 = await parsePortableProfileExport(JSON.stringify(unsortedIds), { now: () => NOW })
    expect(r3.ok).toBe(false)
    if (!r3.ok) expect(r3.errors).toContain('COMPLETED_IDS_INVALID')

    const duplicateIds = cloneFile(json)
    duplicateIds.learning.gradeProgress[1].completedIds = ['g2-a', 'g2-a']
    const r4 = await parsePortableProfileExport(JSON.stringify(duplicateIds), { now: () => NOW })
    expect(r4.ok).toBe(false)
    if (!r4.ok) expect(r4.errors).toContain('COMPLETED_IDS_INVALID')

    const unsortedSets = cloneFile(json)
    unsortedSets.learning.gradeProgress[1].setCompletion = [
      { activityId: 'z', hasCompletedBasicSet: false, hasCompletedPracticeSet: false, legacyCompleted: true },
      { activityId: 'a', hasCompletedBasicSet: false, hasCompletedPracticeSet: false, legacyCompleted: true },
    ]
    const r5 = await parsePortableProfileExport(JSON.stringify(unsortedSets), { now: () => NOW })
    expect(r5.ok).toBe(false)
    if (!r5.ok) expect(r5.errors).toContain('SET_COMPLETION_INVALID')
  })

  it('rejects receipts with duplicates, bad order, foreign learner ids and invalid times', async () => {
    const { json } = await buildValidFile({
      receipts: [receipt(), receipt({ attemptId: 'attempt:b', checkedAt: NOW - 4_000 })],
    })

    const duplicate = cloneFile(json)
    duplicate.learning.receipts.push(duplicate.learning.receipts[0])
    const r1 = await parsePortableProfileExport(JSON.stringify(duplicate), { now: () => NOW })
    expect(r1.ok).toBe(false)
    if (!r1.ok) expect(r1.errors).toContain('RECEIPT_ATTEMPT_DUPLICATE')

    const outOfOrder = cloneFile(json)
    outOfOrder.learning.receipts.reverse()
    const r2 = await parsePortableProfileExport(JSON.stringify(outOfOrder), { now: () => NOW })
    expect(r2.ok).toBe(false)
    if (!r2.ok) expect(r2.errors).toContain('RECEIPT_ORDER_INVALID')

    const foreign = cloneFile(json)
    foreign.learning.receipts[0].learnerId = PROFILE_B
    const r3 = await parsePortableProfileExport(JSON.stringify(foreign), { now: () => NOW })
    expect(r3.ok).toBe(false)
    if (!r3.ok) expect(r3.errors).toContain('RECEIPT_LEARNER_MISMATCH')

    const future = cloneFile(json)
    future.learning.receipts[0].checkedAt = NOW + 6 * 60 * 1_000
    const r4 = await parsePortableProfileExport(JSON.stringify(future), { now: () => NOW })
    expect(r4.ok).toBe(false)
    if (!r4.ok) expect(r4.errors).toContain('RECEIPT_INVALID')

    const fractional = cloneFile(json)
    fractional.learning.receipts[0].checkedAt = NOW - 0.5
    const r5 = await parsePortableProfileExport(JSON.stringify(fractional), { now: () => NOW })
    expect(r5.ok).toBe(false)
    if (!r5.ok) expect(r5.errors).toContain('RECEIPT_INVALID')
  })

  it('rejects future exportedAt, invalid mascots, invalid nicknames and digest mismatches', async () => {
    const { json } = await buildValidFile()

    const future = cloneFile(json)
    future.exportedAt = NOW + 6 * 60 * 1_000
    const r1 = await parsePortableProfileExport(JSON.stringify(future), { now: () => NOW })
    expect(r1.ok).toBe(false)
    if (!r1.ok) expect(r1.errors).toContain('EXPORTED_AT_INVALID')

    const skewStorage = seedProfileAStorage()
    const skewed = await buildPortableProfileExport(PROFILE_A, {
      ...exportDeps(skewStorage),
      now: () => NOW + 4 * 60 * 1_000,
    })
    const r1b = await parsePortableProfileExport(serializePortableProfileExport(skewed), { now: () => NOW })
    expect(r1b.ok).toBe(true)

    const beyondSkewStorage = seedProfileAStorage()
    const beyondSkew = await buildPortableProfileExport(PROFILE_A, {
      ...exportDeps(beyondSkewStorage),
      now: () => NOW + 6 * 60 * 1_000,
    })
    const r1c = await parsePortableProfileExport(serializePortableProfileExport(beyondSkew), { now: () => NOW })
    expect(r1c.ok).toBe(false)
    if (!r1c.ok) expect(r1c.errors).toContain('EXPORTED_AT_INVALID')

    const mascot = cloneFile(json)
    mascot.learning.mascotId = 'dragon'
    const r2 = await parsePortableProfileExport(JSON.stringify(mascot), { now: () => NOW })
    expect(r2.ok).toBe(false)
    if (!r2.ok) expect(r2.errors).toContain('MASCOT_ID_INVALID')

    const nickname = cloneFile(json)
    nickname.profile.nickname = '   '
    const r3 = await parsePortableProfileExport(JSON.stringify(nickname), { now: () => NOW })
    expect(r3.ok).toBe(false)
    if (!r3.ok) expect(r3.errors).toContain('NICKNAME_INVALID')

    const longNickname = cloneFile(json)
    longNickname.profile.nickname = '가'.repeat(21)
    const r4 = await parsePortableProfileExport(JSON.stringify(longNickname), { now: () => NOW })
    expect(r4.ok).toBe(false)
    if (!r4.ok) expect(r4.errors).toContain('NICKNAME_INVALID')

    const digestTampered = cloneFile(json)
    digestTampered.digest.value = '0'.repeat(64)
    const r5 = await parsePortableProfileExport(JSON.stringify(digestTampered), { now: () => NOW })
    expect(r5.ok).toBe(false)
    if (!r5.ok) expect(r5.errors).toContain('DIGEST_MISMATCH')

    const digestShape = cloneFile(json)
    digestShape.digest.algorithm = 'MD5'
    const r6 = await parsePortableProfileExport(JSON.stringify(digestShape), { now: () => NOW })
    expect(r6.ok).toBe(false)
    if (!r6.ok) expect(r6.errors).toContain('DIGEST_SHAPE_INVALID')

    const profileId = cloneFile(json)
    profileId.profile.profileId = 'someone-else'
    const r7 = await parsePortableProfileExport(JSON.stringify(profileId), { now: () => NOW })
    expect(r7.ok).toBe(false)
    if (!r7.ok) expect(r7.errors).toContain('PROFILE_ID_INVALID')
  })

  it('accepts receipts up to the defensive maximum and rejects beyond it', async () => {
    const many: AttemptReceipt[] = []
    for (let index = 0; index < 300; index += 1) {
      many.push(receipt({
        attemptId: `attempt:${String(index).padStart(5, '0')}`,
        checkedAt: NOW - 10_000 + index,
      }))
    }
    const { json } = await buildValidFile({ receipts: many })
    const result = await parsePortableProfileExport(json, { now: () => NOW })
    expect(result.ok).toBe(true)
  })
})

describe('previewProfileImport', () => {
  it('reports invalid files with stable error codes and zeroed counters without reading storage', async () => {
    const seeded = seedProfileAStorage({ grade2: GRADE2_SEED })
    const before = seeded.dump()
    const preview = await previewProfileImport('{broken', { storage: seeded, now: () => NOW })
    const expected: ProfileImportPreviewV1 = {
      status: 'invalid',
      targetProfileId: null,
      completedAdded: 0,
      reviewAdded: 0,
      reviewRemoved: 0,
      receiptsAdded: 0,
      recentActivityChanged: false,
      mascot: null,
      errors: ['NOT_VALID_JSON'],
    }
    expect(preview).toEqual(expected)
    expect(seeded.dump()).toEqual(before)
  })

  it('previews a same-profile merge with union counts and no mutation', async () => {
    const local = seedProfileAStorage({
      grade2: GRADE2_SEED,
      grade6: GRADE6_SEED,
      receipts: [receipt()],
      mascot: 'moa',
      guestHome: { activeGrade: 2 },
      registry: { profiles: [PROFILE_A], nicknames: { [PROFILE_A]: '철수' } },
    })
    const imported = await buildValidFile({
      grade2: { ...GRADE2_SEED, completedMissionIds: ['g2-m2', 'g2-new'], reviewMissionIds: ['g2-review'] },
      receipts: [receipt(), receipt({ attemptId: 'attempt:new', checkedAt: NOW - 3_000 })],
      mascot: 'moa',
    })
    const before = local.dump()
    const preview = await previewProfileImport(imported.json, { storage: local, now: () => NOW })

    expect(preview.status).toBe('merge')
    expect(preview.targetProfileId).toBe(PROFILE_A)
    expect(preview.completedAdded).toBe(1)
    expect(preview.reviewAdded).toBe(1)
    expect(preview.reviewRemoved).toBe(0)
    expect(preview.receiptsAdded).toBe(1)
    expect(preview.mascot).toBeNull()
    expect(local.dump()).toEqual(before)
  })

  it('previews a different profileId as a new profile with imported nickname and full counts', async () => {
    const local = seedProfileAStorage({ grade2: GRADE2_SEED, registry: { profiles: [PROFILE_B] } })
    const imported = await buildValidFile({
      registry: { profiles: [PROFILE_A], nicknames: { [PROFILE_A]: '지우' } },
      grade2: GRADE2_SEED,
      receipts: [receipt()],
    })
    const before = local.dump()
    const preview = await previewProfileImport(imported.json, { storage: local, now: () => NOW })

    expect(preview.status).toBe('new-profile')
    expect(preview.targetProfileId).toBeNull()
    expect(preview.completedAdded).toBe(1)
    expect(preview.reviewAdded).toBe(0)
    expect(preview.receiptsAdded).toBe(1)
    expect(preview.recentActivityChanged).toBe(true)
    expect(preview.mascot).toBeNull()
    expect(local.dump()).toEqual(before)
  })

  it('stops at mascot-choice when the same profile prefers another mascot', async () => {
    const local = seedProfileAStorage({ grade2: GRADE2_SEED, mascot: 'lumi' })
    const imported = await buildValidFile({ grade2: GRADE2_SEED, mascot: 'suri' })
    const preview = await previewProfileImport(imported.json, { storage: local, now: () => NOW })

    expect(preview.status).toBe('mascot-choice')
    expect(preview.mascot).toEqual({ local: 'lumi', imported: 'suri' })
    expect(preview.targetProfileId).toBe(PROFILE_A)
  })

  it('resolves review counts by the latest comparable receipt and ties keep local', async () => {
    const local = seedProfileAStorage({
      grade6: GRADE6_SEED,
      receipts: [receipt({ attemptId: 'attempt:old-correct', activityId: 'g6-concept-a', itemId: 'g6-concept-a:0', correct: true, checkedAt: NOW - 9_000 })],
    })
    const imported = await buildValidFile({
      grade6: GRADE6_SEED,
      receipts: [receipt({ attemptId: 'attempt:new-wrong', activityId: 'g6-concept-a', itemId: 'g6-concept-a:0', correct: false, checkedAt: NOW - 1_000 })],
    })
    const preview = await previewProfileImport(imported.json, { storage: local, now: () => NOW })
    expect(preview.reviewRemoved).toBe(0)
    expect(preview.reviewAdded).toBe(0)

    const tieLocal = seedProfileAStorage({
      grade6: GRADE6_SEED,
      receipts: [receipt({ attemptId: 'attempt:local-tie', activityId: 'g6-concept-a', itemId: 'g6-concept-a:0', correct: true, checkedAt: NOW - 5_000 })],
    })
    const tieImported = await buildValidFile({
      grade6: GRADE6_SEED,
      receipts: [receipt({ attemptId: 'attempt:file-tie', activityId: 'g6-concept-a', itemId: 'g6-concept-a:0', correct: false, checkedAt: NOW - 5_000 })],
    })
    const tiePreview = await previewProfileImport(tieImported.json, { storage: tieLocal, now: () => NOW })
    expect(tiePreview.reviewRemoved).toBeGreaterThanOrEqual(0)
    expect(tiePreview.status).toBe('merge')
  })

  it('flags recentActivityChanged only when the imported activity is strictly later', async () => {
    const local = seedProfileAStorage({ grade2: { ...GRADE2_SEED, lastPlayedAt: NOW - 1_000 }, guestHome: { activeGrade: 2 } })
    const earlier = await buildValidFile({ grade2: { ...GRADE2_SEED, lastPlayedAt: NOW - 2_000 } })
    const earlierPreview = await previewProfileImport(earlier.json, { storage: local, now: () => NOW })
    expect(earlierPreview.recentActivityChanged).toBe(false)

    const tie = await buildValidFile({ grade2: { ...GRADE2_SEED, lastPlayedAt: NOW - 1_000 } })
    const tiePreview = await previewProfileImport(tie.json, { storage: local, now: () => NOW })
    expect(tiePreview.recentActivityChanged).toBe(false)

    const later = await buildValidFile({ grade2: { ...GRADE2_SEED, lastPlayedAt: NOW - 500 } })
    const laterPreview = await previewProfileImport(later.json, { storage: local, now: () => NOW })
    expect(laterPreview.recentActivityChanged).toBe(true)
  })

  it('rejects the whole file when the same attemptId carries different content', async () => {
    const local = seedProfileAStorage({ receipts: [receipt()] })
    const conflicting = await buildValidFile({
      receipts: [receipt({ usedHint: !receipt().usedHint })],
    })
    const preview = await previewProfileImport(conflicting.json, { storage: local, now: () => NOW })
    expect(preview.status).toBe('invalid')
    expect(preview.errors).toContain('RECEIPT_CONTENT_CONFLICT')
  })
})

describe('applyProfileImport merge rules', () => {
  it('merges the same profile deterministically: unions completion, keeps local nickname and never downgrades', async () => {
    const local = seedProfileAStorage({
      grade2: GRADE2_SEED,
      grade6: GRADE6_SEED,
      receipts: [receipt()],
      mascot: 'moa',
      guestHome: { activeGrade: 2 },
      registry: { profiles: [PROFILE_A], nicknames: { [PROFILE_A]: '철수' } },
    })
    const beforeDump = local.dump()
    const imported = await buildValidFile({
      registry: { profiles: [PROFILE_A], nicknames: { [PROFILE_A]: '다른이름' } },
      grade2: { ...GRADE2_SEED, completedMissionIds: ['g2-m2', 'g2-new'], reviewMissionIds: ['g2-review'] },
      grade6: {
        ...GRADE6_SEED,
        'g6-concept-b': {
          conceptId: 'g6-concept-b', attemptCount: 1, bestScore: 50, latestScore: 50,
          lastCompletedAt: NOW - 4_000, needsReview: false, lastMode: 'standard',
          completionRecord: { completedBasicSetActivityIds: [], completedPracticeSetActivityIds: ['g6-concept-b'] },
        },
      },
      receipts: [receipt(), receipt({ attemptId: 'attempt:new', checkedAt: NOW - 3_000 })],
      mascot: 'moa',    })

    const result = await applyProfileImport(imported.json, { storage: local, now: () => NOW }, {})
    expect(result.status).toBe('applied')
    expect(result.restoredFromBackup).toBe(false)
    expect(result.targetProfileId).toBe(PROFILE_A)

    const registry = JSON.parse(local.getItem(LOCAL_PROFILE_REGISTRY_KEY)!)
    expect(registry.profiles).toHaveLength(1)
    expect(registry.profiles[0].nickname).toBe('철수')
    expect(registry.activeProfileId).toBe(PROFILE_A)

    const grade2 = JSON.parse(local.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_grade2Progress'))!)
    expect(grade2.completedMissionIds.sort()).toEqual(['g2-m2', 'g2-new'].sort())
    expect(grade2.reviewMissionIds.sort()).toEqual(['g2-review'].sort())

    const grade6 = JSON.parse(local.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_grade6Progress'))!)
    expect(grade6['g6-concept-b'].completionRecord.completedPracticeSetActivityIds).toEqual(['g6-concept-b'])
    expect(grade6['g6-concept-a'].bestScore).toBe(80)

    const ledger = JSON.parse(local.getItem(createProfileScopedStorageKey(PROFILE_A, ATTEMPT_RECEIPT_STORAGE_KEY))!)
    expect(ledger.receipts).toHaveLength(2)

    expect(local.dump()[LOCAL_PROFILE_REGISTRY_KEY]).toBe(beforeDump[LOCAL_PROFILE_REGISTRY_KEY])
  })

  it('lets the latest receipt decide review status and keeps local on ties', async () => {
    const local = seedProfileAStorage({
      grade6: GRADE6_SEED,
      receipts: [receipt({ attemptId: 'attempt:old', activityId: 'g6-concept-a', itemId: 'g6-concept-a:0', correct: false, checkedAt: NOW - 9_000 })],
      guestHome: { activeGrade: 6 },
    })
    const newerCorrect = await buildValidFile({
      grade6: GRADE6_SEED,
      receipts: [receipt({ attemptId: 'attempt:fix', activityId: 'g6-concept-a', itemId: 'g6-concept-a:0', correct: true, checkedAt: NOW - 1_000 })],
    })
    const result = await applyProfileImport(newerCorrect.json, { storage: local, now: () => NOW }, {})
    expect(result.status).toBe('applied')
    const grade6 = JSON.parse(local.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_grade6Progress'))!)
    expect(grade6['g6-concept-a'].needsReview).toBe(false)

    const tieLocal = seedProfileAStorage({
      grade6: GRADE6_SEED,
      receipts: [receipt({ attemptId: 'attempt:tie-local', activityId: 'g6-concept-a', itemId: 'g6-concept-a:0', correct: true, checkedAt: NOW - 5_000 })],
    })
    const tieFile = await buildValidFile({
      grade6: GRADE6_SEED,
      receipts: [receipt({ attemptId: 'attempt:tie-file', activityId: 'g6-concept-a', itemId: 'g6-concept-a:0', correct: false, checkedAt: NOW - 5_000 })],
    })
    await applyProfileImport(tieFile.json, { storage: tieLocal, now: () => NOW }, {})
    const tieGrade6 = JSON.parse(tieLocal.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_grade6Progress'))!)
    expect(tieGrade6['g6-concept-a'].needsReview).toBe(true)
  })

  it('picks the later recentActivity, keeps local on tie and updates the home preference only on change', async () => {
    const local = seedProfileAStorage({ grade2: { ...GRADE2_SEED, lastPlayedAt: NOW - 1_000 }, guestHome: { activeGrade: 2 } })
    const later = await buildValidFile({ grade2: { ...GRADE2_SEED, lastPlayedAt: NOW - 500 } })
    const result = await applyProfileImport(later.json, { storage: local, now: () => NOW }, {})
    expect(result.status).toBe('applied')
    const home = JSON.parse(local.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_guestHome_v1'))!)
    expect(home.activeGrade).toBe(2)

    const tieLocal = seedProfileAStorage({ grade2: { ...GRADE2_SEED, lastPlayedAt: NOW - 1_000 }, guestHome: { activeGrade: 2 } })
    const tie = await buildValidFile({ grade2: { ...GRADE2_SEED, lastPlayedAt: NOW - 1_000 }, guestHome: { activeGrade: 6 } })
    await applyProfileImport(tie.json, { storage: tieLocal, now: () => NOW }, {})
    const tieHome = JSON.parse(tieLocal.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_guestHome_v1'))!)
    expect(tieHome.activeGrade).toBe(2)
  })

  it('requires an explicit mascot choice before applying and honors it', async () => {
    const local = seedProfileAStorage({ grade2: GRADE2_SEED, mascot: 'lumi' })
    const imported = await buildValidFile({ grade2: GRADE2_SEED, mascot: 'suri' })

    const blocked = await applyProfileImport(imported.json, { storage: local, now: () => NOW }, {})
    expect(blocked.status).toBe('blocked')
    expect(blocked.errorCode).toBe('MASCOT_CHOICE_REQUIRED')
    expect(local.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_mascot_v1'))).toBe(JSON.stringify({ avatarId: 'lumi' }))

    const applied = await applyProfileImport(imported.json, { storage: local, now: () => NOW }, { mascotChoice: 'imported' })
    expect(applied.status).toBe('applied')
    expect(local.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_mascot_v1'))).toBe(JSON.stringify({ avatarId: 'suri' }))

    const keepLocal = seedProfileAStorage({ grade2: GRADE2_SEED, mascot: 'moa' })
    await applyProfileImport(imported.json, { storage: keepLocal, now: () => NOW }, { mascotChoice: 'local' })
    expect(keepLocal.getItem(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_mascot_v1'))).toBe(JSON.stringify({ avatarId: 'moa' }))
  })

  it('creates a new local profile for a different profileId without switching the active profile', async () => {
    const local = seedProfileAStorage({
      grade2: GRADE2_SEED,
      receipts: [receipt()],
      mascot: 'lumi',
      registry: { profiles: [PROFILE_B], nicknames: { [PROFILE_B]: '기존' } },
    })
    const imported = await buildValidFile({
      registry: { profiles: [PROFILE_A], nicknames: { [PROFILE_A]: '지우' } },
      grade2: GRADE2_SEED,
      receipts: [receipt()],
    })

    const result = await applyProfileImport(imported.json, {
      storage: local,
      now: () => NOW,
      randomUUID: () => PROFILE_C_RANDOM_UUID,
    }, {})
    expect(result.status).toBe('applied')
    expect(result.targetProfileId).toBe(`local_${PROFILE_C_RANDOM_UUID}`)

    const registry = JSON.parse(local.getItem(LOCAL_PROFILE_REGISTRY_KEY)!)
    expect(registry.profiles).toHaveLength(2)
    expect(registry.activeProfileId).toBe(PROFILE_B)
    const created = registry.profiles.find((p: { profileId: string }) => p.profileId === result.targetProfileId)
    expect(created.nickname).toBe('지우')

    const newId = result.targetProfileId!
    expect(local.getItem(createProfileScopedStorageKey(newId, 'mathAssist_mascot_v1'))).toBe(JSON.stringify({ avatarId: 'suri' }))
    const ledger = JSON.parse(local.getItem(createProfileScopedStorageKey(newId, ATTEMPT_RECEIPT_STORAGE_KEY))!)
    expect(ledger.receipts).toHaveLength(1)
    expect(ledger.receipts[0].learnerId).toBe(newId)
    expect(local.getItem(createProfileScopedStorageKey(newId, 'mathAssist_grade2Progress'))).not.toBeNull()
  })

  it('blocks creation when the profile limit is reached', async () => {
    const local = seedProfileAStorage({ grade2: GRADE2_SEED, registry: { profiles: [PROFILE_B] } })
    const imported = await buildValidFile({ grade2: GRADE2_SEED })
    const result = await applyProfileImport(imported.json, { storage: local, now: () => NOW, maxProfiles: 1 }, {})
    expect(result.status).toBe('blocked')
    expect(result.errorCode).toBe('PROFILE_LIMIT_REACHED')
    expect(JSON.parse(local.getItem(LOCAL_PROFILE_REGISTRY_KEY)!).profiles).toHaveLength(1)
  })

  it('blocks when the file changed between preview and apply', async () => {
    const local = seedProfileAStorage({ grade2: GRADE2_SEED })
    const beforeDump = local.dump()
    const imported = await buildValidFile({ grade2: GRADE2_SEED })
    const parsed = JSON.parse(imported.json)
    parsed.learning.mascotId = 'lumi'
    const result = await applyProfileImport(JSON.stringify(parsed), { storage: local, now: () => NOW }, {})
    expect(result.status).toBe('blocked')
    expect(local.dump()).toEqual(beforeDump)
  })
})

describe('applyProfileImport rollback paths', () => {
  it('writes a verified internal rollback backup before the first mutation and keeps it scoped', async () => {
    const local = seedProfileAStorage({
      grade2: GRADE2_SEED,
      receipts: [receipt()],
      registry: { profiles: [PROFILE_A], nicknames: { [PROFILE_A]: '철수' } },
    })
    const imported = await buildValidFile({ grade2: { ...GRADE2_SEED, completedMissionIds: ['g2-new'] }, receipts: [receipt()] })
    const beforeDump = local.dump()

    const result = await applyProfileImport(imported.json, { storage: local, now: () => NOW }, {})
    expect(result.status).toBe('applied')

    const backupEntries = Object.keys(local.dump())
      .filter((key) => key.startsWith(`${PROFILE_SCOPED_STORAGE_PREFIX}${PROFILE_A}:mathAssist_progressBackup_v1:profile-import-v1:`))
    expect(backupEntries.length).toBeGreaterThanOrEqual(1)
    const backup = JSON.parse(local.getItem(backupEntries[0])!)
    expect(backup.values[createProfileScopedStorageKey(PROFILE_A, 'mathAssist_grade2Progress')])
      .toBe(beforeDump[createProfileScopedStorageKey(PROFILE_A, 'mathAssist_grade2Progress')])
    expect(backup.values[LOCAL_PROFILE_REGISTRY_KEY]).toBeUndefined()
  })

  it('restores every affected key byte-for-byte when a write fails midway', async () => {
    const local = seedProfileAStorage({
      grade2: GRADE2_SEED,
      grade6: GRADE6_SEED,
      receipts: [receipt()],
      mascot: 'moa',
      guestHome: { activeGrade: 2 },
    })
    const beforeDump = local.dump()
    const imported = await buildValidFile({
      grade2: { ...GRADE2_SEED, completedMissionIds: ['g2-new'] },
      grade6: { ...GRADE6_SEED, 'g6-extra': { ...(GRADE6_SEED['g6-concept-a'] as Record<string, unknown>), conceptId: 'g6-extra' } },
      receipts: [receipt(), receipt({ attemptId: 'attempt:newer', checkedAt: NOW - 100 })],
      mascot: 'suri',
    })

    local.failSetsFor(createProfileScopedStorageKey(PROFILE_A, 'mathAssist_mascot_v1'))
    const result = await applyProfileImport(imported.json, { storage: local, now: () => NOW }, { mascotChoice: 'imported' })
    expect(result.status).toBe('failed')
    expect(result.errorCode).toBe('APPLY_WRITE_FAILED')
    expect(result.restoredFromBackup).toBe(true)
    expect(local.dump()).toEqual(beforeDump)
  })

  it('restores the registry and drops partial scoped writes when creating a new profile fails midway', async () => {
    const local = seedProfileAStorage({ grade2: GRADE2_SEED, registry: { profiles: [PROFILE_B] } })
    const beforeDump = local.dump()
    const imported = await buildValidFile({
      registry: { profiles: [PROFILE_A] },
      grade2: GRADE2_SEED,
      receipts: [receipt()],
    })

    const newScopedReceipts = createProfileScopedStorageKey(`local_${PROFILE_C_RANDOM_UUID}`, ATTEMPT_RECEIPT_STORAGE_KEY)
    local.failSetsFor(newScopedReceipts)
    const result = await applyProfileImport(imported.json, {
      storage: local,
      now: () => NOW,
      randomUUID: () => PROFILE_C_RANDOM_UUID,
    }, {})
    expect(result.status).toBe('failed')
    expect(result.restoredFromBackup).toBe(true)
    expect(local.dump()).toEqual(beforeDump)
  })

  it('detects tampered post-write state and restores original bytes', async () => {
    const local = seedProfileAStorage({ grade2: GRADE2_SEED })
    const beforeDump = local.dump()
    const imported = await buildValidFile({ grade2: { ...GRADE2_SEED, completedMissionIds: ['g2-new'] } })

    const targetKey = createProfileScopedStorageKey(PROFILE_A, 'mathAssist_grade2Progress')
    const originalGet = local.getItem.bind(local)
    let readsAfterWrite = 0
    local.getItem = (key: string) => {
      const value = originalGet(key)
      if (key === targetKey && value !== null && readsAfterWrite++ > 0) {
        return value.replace('g2-new', 'tampered')
      }
      return value
    }

    const result = await applyProfileImport(imported.json, { storage: local, now: () => NOW }, {})
    expect(result.status).toBe('failed')
    expect(result.restoredFromBackup).toBe(true)
    local.getItem = originalGet
    expect(local.dump()).toEqual(beforeDump)
  })

  it('applies cleanly when nothing fails, leaving success as the only reported outcome', async () => {
    const local = seedProfileAStorage({ grade2: GRADE2_SEED, receipts: [receipt()], mascot: 'moa' })
    const imported = await buildValidFile({
      grade2: { ...GRADE2_SEED, completedMissionIds: ['g2-new'] },
      receipts: [receipt(), receipt({ attemptId: 'attempt:x', checkedAt: NOW - 50 })],
      mascot: 'moa',
    })
    const result = await applyProfileImport(imported.json, { storage: local, now: () => NOW }, {})
    expect(result.status).toBe('applied')
  })
})

describe('portable contract guards', () => {
  it('keeps the defensive limits aligned with the spec', async () => {
    const { MAX_PORTABLE_PROFILE_BYTES, MAX_PORTABLE_RECEIPTS } = await import('./profile-transfer')
    expect(MAX_PORTABLE_PROFILE_BYTES).toBe(5 * 1024 * 1024)
    expect(MAX_PORTABLE_RECEIPTS).toBe(10_000)
    expect(DEFAULT_MAX_LOCAL_PROFILES).toBe(6)
  })

  it('round-trips an export through parse with a matching digest', async () => {
    const { json, file } = await buildValidFile({ grade2: GRADE2_SEED, receipts: [receipt()], mascot: 'lumi' })
    const result = await parsePortableProfileExport(json, { now: () => NOW + 1_000 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.file.learning.mascotId).toBe(file.learning.mascotId)
      expect(result.file.digest.value).toBe(file.digest.value)
    }
  })
})
