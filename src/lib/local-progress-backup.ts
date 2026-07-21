export const LOCAL_PROGRESS_BACKUP_PREFIX = 'mathAssist_progressBackup_v1:'

export const BACKED_UP_LOCAL_PROGRESS_KEYS = [
  'mathAssist_grade1Progress',
  'mathAssist_grade2Progress',
  'mathAssist_grade3Progress',
  'mathAssist_grade4Progress',
  'mathAssist_progress_v1',
  'mathAssist_currentSession',
  'mathAssist_grade6Progress',
  'mathAssist_grade6CurrentSession',
  'mathAssist_guestHome_v1',
  'mathAssist_attemptReceipts_v1',
] as const

export interface MutableLocalProgressStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface LocalProgressBackup {
  schemaVersion: 1
  createdAt: number
  values: Record<(typeof BACKED_UP_LOCAL_PROGRESS_KEYS)[number], string | null>
}

function readBackup(
  storage: MutableLocalProgressStorage,
  backupKey: string,
): LocalProgressBackup | null {
  try {
    const raw = storage.getItem(backupKey)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const candidate = value as Partial<LocalProgressBackup>
    if (candidate.schemaVersion !== 1 || !Number.isFinite(candidate.createdAt)) return null
    if (!candidate.values || typeof candidate.values !== 'object' || Array.isArray(candidate.values)) return null
    const values = candidate.values as Record<string, unknown>
    if (!BACKED_UP_LOCAL_PROGRESS_KEYS.every((key) => values[key] === null || typeof values[key] === 'string')) {
      return null
    }
    return candidate as LocalProgressBackup
  } catch {
    return null
  }
}

export function createLocalProgressBackup(
  storage: MutableLocalProgressStorage,
  createdAt = Date.now(),
): { status: 'saved' | 'failed'; backupKey: string | null } {
  if (!Number.isFinite(createdAt) || createdAt < 0) return { status: 'failed', backupKey: null }
  const backupKey = `${LOCAL_PROGRESS_BACKUP_PREFIX}${createdAt}`
  try {
    const values = Object.fromEntries(
      BACKED_UP_LOCAL_PROGRESS_KEYS.map((key) => [key, storage.getItem(key)]),
    ) as LocalProgressBackup['values']
    const backup: LocalProgressBackup = { schemaVersion: 1, createdAt, values }
    storage.setItem(backupKey, JSON.stringify(backup))
    return { status: 'saved', backupKey }
  } catch {
    return { status: 'failed', backupKey: null }
  }
}

export function previewLocalProgressRestore(
  storage: MutableLocalProgressStorage,
  backupKey: string,
): { valid: boolean; changedKeys: string[] } {
  const backup = readBackup(storage, backupKey)
  if (!backup) return { valid: false, changedKeys: [] }
  const changedKeys = BACKED_UP_LOCAL_PROGRESS_KEYS.filter(
    (key) => storage.getItem(key) !== backup.values[key],
  )
  return { valid: true, changedKeys }
}

function applyValue(storage: MutableLocalProgressStorage, key: string, value: string | null): void {
  if (value === null) storage.removeItem(key)
  else storage.setItem(key, value)
}

export function restoreLocalProgressBackup(
  storage: MutableLocalProgressStorage,
  backupKey: string,
): { status: 'restored' | 'invalid' | 'failed'; restoredKeys: number } {
  const backup = readBackup(storage, backupKey)
  if (!backup) return { status: 'invalid', restoredKeys: 0 }
  const before = Object.fromEntries(
    BACKED_UP_LOCAL_PROGRESS_KEYS.map((key) => [key, storage.getItem(key)]),
  ) as Record<(typeof BACKED_UP_LOCAL_PROGRESS_KEYS)[number], string | null>
  try {
    for (const key of BACKED_UP_LOCAL_PROGRESS_KEYS) applyValue(storage, key, backup.values[key])
    return { status: 'restored', restoredKeys: BACKED_UP_LOCAL_PROGRESS_KEYS.length }
  } catch {
    try {
      for (const key of BACKED_UP_LOCAL_PROGRESS_KEYS) applyValue(storage, key, before[key])
    } catch {
      // The storage backend is unavailable; callers still receive an explicit failure.
    }
    return { status: 'failed', restoredKeys: 0 }
  }
}
