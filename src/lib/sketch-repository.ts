import {
  createSketchDocument,
  parseSketchDocument,
  serializeSketchDocument,
  type SketchDocument,
  type SketchDocumentKey,
} from './sketch-document'

export const MAX_SKETCH_DOCUMENT_BYTES = 256 * 1024
export const MAX_SKETCH_DOCUMENTS_PER_LEARNER = 50

const DOCUMENT_KEY_PREFIX = 'mathAssist_sketch_v1:'
const INDEX_KEY_PREFIX = 'mathAssist_sketch_index_v1:'

interface SketchIndexEntry extends SketchDocumentKey {
  storageKey: string
  updatedAt: number
}

export interface SketchStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface SketchRepository {
  get(key: SketchDocumentKey): Promise<SketchDocument | null>
  put(document: SketchDocument): Promise<'saved' | 'quota-exceeded' | 'corrupt'>
  removeSession(learnerId: string | null, sessionId: string): Promise<void>
  prune(learnerId: string | null): Promise<number>
}

export interface LocalSketchRepositoryOptions {
  isSessionActive?: (key: SketchDocumentKey) => boolean
}

function browserStorage(): SketchStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function validateKey(key: SketchDocumentKey): void {
  if (
    (key.learnerId !== null && (typeof key.learnerId !== 'string' || key.learnerId.length === 0)) ||
    typeof key.sessionId !== 'string' || key.sessionId.length === 0 ||
    typeof key.itemId !== 'string' || key.itemId.length === 0
  ) {
    throw new TypeError('Sketch storage keys require stable learner, session, and item identity.')
  }
}

function encodedIdentity(parts: readonly (string | null)[]): string {
  return encodeURIComponent(JSON.stringify(parts))
}

export function createSketchStorageKey(key: SketchDocumentKey): string {
  validateKey(key)
  return `${DOCUMENT_KEY_PREFIX}${encodedIdentity([key.learnerId, key.sessionId, key.itemId])}`
}

function createSketchIndexKey(learnerId: string | null): string {
  if (learnerId !== null && (typeof learnerId !== 'string' || learnerId.length === 0)) {
    throw new TypeError('Learner identity must be null or a non-empty string.')
  }
  return `${INDEX_KEY_PREFIX}${encodedIdentity([learnerId])}`
}

function isIndexEntry(value: unknown, learnerId: string | null): value is SketchIndexEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entry = value as Partial<SketchIndexEntry>
  return entry.learnerId === learnerId &&
    typeof entry.sessionId === 'string' && entry.sessionId.length > 0 &&
    typeof entry.itemId === 'string' && entry.itemId.length > 0 &&
    typeof entry.storageKey === 'string' && entry.storageKey.length > 0 &&
    typeof entry.updatedAt === 'number' && Number.isFinite(entry.updatedAt) &&
    entry.storageKey === createSketchStorageKey({
      learnerId,
      sessionId: entry.sessionId,
      itemId: entry.itemId,
    })
}

function readIndex(storage: SketchStorage, learnerId: string | null): SketchIndexEntry[] {
  try {
    const raw = storage.getItem(createSketchIndexKey(learnerId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every((entry) => isIndexEntry(entry, learnerId))) return []
    const deduplicated = new Map<string, SketchIndexEntry>()
    for (const entry of parsed) deduplicated.set(entry.storageKey, entry)
    return Array.from(deduplicated.values())
  } catch {
    return []
  }
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

class LocalSketchRepository implements SketchRepository {
  private readonly isSessionActive: (key: SketchDocumentKey) => boolean

  constructor(
    private readonly storage: SketchStorage | null,
    options: LocalSketchRepositoryOptions,
  ) {
    this.isSessionActive = options.isSessionActive ?? (() => false)
  }

  private active(entry: SketchIndexEntry): boolean {
    try {
      return this.isSessionActive(entry)
    } catch {
      // Retention must fail safe: an unknown session must not be auto-deleted.
      return true
    }
  }

  async get(key: SketchDocumentKey): Promise<SketchDocument | null> {
    validateKey(key)
    if (!this.storage) return null
    try {
      const raw = this.storage.getItem(createSketchStorageKey(key))
      if (raw === null) return null
      return parseSketchDocument(raw, key) ?? createSketchDocument(key, 0)
    } catch {
      return null
    }
  }

  async put(document: SketchDocument): Promise<'saved' | 'quota-exceeded' | 'corrupt'> {
    validateKey(document)
    if (!this.storage) return 'quota-exceeded'

    let serialized: string
    try {
      serialized = serializeSketchDocument(document)
    } catch {
      return 'quota-exceeded'
    }
    if (byteLength(serialized) > MAX_SKETCH_DOCUMENT_BYTES) return 'quota-exceeded'

    const storageKey = createSketchStorageKey(document)
    const indexKey = createSketchIndexKey(document.learnerId)
    const currentEntries = readIndex(this.storage, document.learnerId)
    const previousEntry = currentEntries.find((entry) => entry.storageKey === storageKey)
    const nextEntry: SketchIndexEntry = {
      learnerId: document.learnerId,
      sessionId: document.sessionId,
      itemId: document.itemId,
      storageKey,
      updatedAt: document.updatedAt,
    }
    const nextEntries = [
      ...currentEntries.filter((entry) => entry.storageKey !== storageKey),
      nextEntry,
    ]
    const overflow = Math.max(0, nextEntries.length - MAX_SKETCH_DOCUMENTS_PER_LEARNER)
    const evictable = currentEntries
      .filter((entry) => entry.storageKey !== storageKey && !this.active(entry))
      .sort((left, right) => left.updatedAt - right.updatedAt)
    if (evictable.length < overflow) return 'quota-exceeded'

    const evicted = evictable.slice(0, overflow)
    const evictedKeys = new Set(evicted.map((entry) => entry.storageKey))
    const retainedEntries = nextEntries.filter((entry) => !evictedKeys.has(entry.storageKey))
    let previousRaw: string | null = null

    try {
      previousRaw = this.storage.getItem(storageKey)
      if (previousRaw !== null && !parseSketchDocument(previousRaw, document)) {
        // Preserve damaged evidence. Recovery must be an explicit user action,
        // not an automatic overwrite triggered by the next drawing gesture.
        return 'corrupt'
      }
      this.storage.setItem(storageKey, serialized)
      this.storage.setItem(indexKey, JSON.stringify(retainedEntries))
    } catch {
      try {
        if (previousRaw === null && !previousEntry) this.storage.removeItem(storageKey)
        else if (previousRaw !== null) this.storage.setItem(storageKey, previousRaw)
      } catch {
        // The storage backend is already failing; report the failed write.
      }
      return 'quota-exceeded'
    }

    for (const entry of evicted) {
      try {
        this.storage.removeItem(entry.storageKey)
      } catch {
        // The index no longer references this stale document; retry is optional.
      }
    }
    return 'saved'
  }

  async removeSession(learnerId: string | null, sessionId: string): Promise<void> {
    if (!this.storage || typeof sessionId !== 'string' || sessionId.length === 0) return
    const entries = readIndex(this.storage, learnerId)
    const removed = entries.filter((entry) => entry.sessionId === sessionId)
    if (removed.length === 0) return
    const retained = entries.filter((entry) => entry.sessionId !== sessionId)
    try {
      this.storage.setItem(createSketchIndexKey(learnerId), JSON.stringify(retained))
      for (const entry of removed) this.storage.removeItem(entry.storageKey)
    } catch {
      // Removal is best effort; callers can retry without affecting other sessions.
    }
  }

  async prune(learnerId: string | null): Promise<number> {
    if (!this.storage) return 0
    const entries = readIndex(this.storage, learnerId)
    const overflow = Math.max(0, entries.length - MAX_SKETCH_DOCUMENTS_PER_LEARNER)
    if (overflow === 0) return 0
    const evicted = entries
      .filter((entry) => !this.active(entry))
      .sort((left, right) => left.updatedAt - right.updatedAt)
      .slice(0, overflow)
    if (evicted.length === 0) return 0
    const evictedKeys = new Set(evicted.map((entry) => entry.storageKey))
    const retained = entries.filter((entry) => !evictedKeys.has(entry.storageKey))
    try {
      this.storage.setItem(createSketchIndexKey(learnerId), JSON.stringify(retained))
      for (const entry of evicted) this.storage.removeItem(entry.storageKey)
      return evicted.length
    } catch {
      return 0
    }
  }
}

export function createLocalSketchRepository(
  storage: SketchStorage | null = browserStorage(),
  options: LocalSketchRepositoryOptions = {},
): SketchRepository {
  return new LocalSketchRepository(storage, options)
}
