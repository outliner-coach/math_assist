import { describe, expect, it, vi } from 'vitest'

import {
  appendSketchStroke,
  createSketchDocument,
  type SketchDocument,
  type SketchDocumentKey,
} from './sketch-document'
import {
  MAX_SKETCH_DOCUMENT_BYTES,
  MAX_SKETCH_DOCUMENTS_PER_LEARNER,
  createLocalSketchRepository,
  createSketchStorageKey,
  type SketchStorage,
} from './sketch-repository'

function memoryStorage(initial: Record<string, string> = {}): SketchStorage & {
  data: Record<string, string>
} {
  return {
    data: { ...initial },
    getItem(key: string) {
      return this.data[key] ?? null
    },
    setItem(key: string, value: string) {
      this.data[key] = value
    },
    removeItem(key: string) {
      delete this.data[key]
    },
  }
}

function documentFor(
  key: SketchDocumentKey,
  updatedAt: number,
  pointCount = 1,
): SketchDocument {
  return appendSketchStroke(createSketchDocument(key, updatedAt - 1), {
    id: `stroke-${updatedAt}`,
    tool: 'pen',
    points: Array.from({ length: pointCount }, (_, index) => ({
      x: (index % 100) / 100,
      y: ((index * 7) % 100) / 100,
      pressure: 0.5,
    })),
  }, updatedAt)
}

describe('local sketch repository', () => {
  it('creates stable collision-safe keys from learner, session, and item identity', () => {
    const guest = createSketchStorageKey({ learnerId: null, sessionId: 'a:b', itemId: 'c' })
    const learner = createSketchStorageKey({ learnerId: 'guest', sessionId: 'a', itemId: 'b:c' })

    expect(guest).toBe(createSketchStorageKey({ learnerId: null, sessionId: 'a:b', itemId: 'c' }))
    expect(guest).not.toBe(learner)
    expect(() => createSketchStorageKey({ learnerId: null, sessionId: '', itemId: 'item' }))
      .toThrow(TypeError)
  })

  it('isolates documents by item and session', async () => {
    const storage = memoryStorage()
    const repository = createLocalSketchRepository(storage)
    const firstKey = { learnerId: null, sessionId: 'session-1', itemId: 'item-1' }
    const secondKey = { learnerId: null, sessionId: 'session-1', itemId: 'item-2' }
    const otherSessionKey = { learnerId: null, sessionId: 'session-2', itemId: 'item-1' }

    expect(await repository.put(documentFor(firstKey, 100))).toBe('saved')
    expect(await repository.put(documentFor(secondKey, 200))).toBe('saved')
    expect(await repository.put(documentFor(otherSessionKey, 300))).toBe('saved')

    expect((await repository.get(firstKey))?.itemId).toBe('item-1')
    expect((await repository.get(secondKey))?.updatedAt).toBe(200)
    expect((await repository.get(otherSessionKey))?.sessionId).toBe('session-2')

    await repository.removeSession(null, 'session-1')
    expect(await repository.get(firstKey)).toBeNull()
    expect(await repository.get(secondKey)).toBeNull()
    expect(await repository.get(otherSessionKey)).not.toBeNull()
  })

  it('recovers one corrupt item as an empty document without deleting another item', async () => {
    const goodKey = { learnerId: null, sessionId: 'session-1', itemId: 'good' }
    const badKey = { learnerId: null, sessionId: 'session-1', itemId: 'bad' }
    const storage = memoryStorage({ [createSketchStorageKey(badKey)]: '{bad json' })
    const repository = createLocalSketchRepository(storage)
    await repository.put(documentFor(goodKey, 100))

    expect(await repository.get(badKey)).toEqual(createSketchDocument(badKey, 0))
    expect((await repository.get(goodKey))?.commands).toHaveLength(1)
    expect(storage.getItem(createSketchStorageKey(badKey))).toBe('{bad json')

    const replacement = documentFor(badKey, 200)
    expect(await repository.put(replacement)).toBe('corrupt')
    expect(storage.getItem(createSketchStorageKey(badKey))).toBe('{bad json')
  })

  it('reports quota-exceeded without replacing the stored item above 256 KiB', async () => {
    const key = { learnerId: null, sessionId: 'session-1', itemId: 'large' }
    const storage = memoryStorage()
    const repository = createLocalSketchRepository(storage)
    const original = documentFor(key, 100)
    expect(await repository.put(original)).toBe('saved')
    const originalRaw = storage.getItem(createSketchStorageKey(key))

    let pointCount = 8_000
    let oversized = documentFor(key, 200, pointCount)
    while (new TextEncoder().encode(JSON.stringify(oversized)).byteLength <= MAX_SKETCH_DOCUMENT_BYTES) {
      pointCount += 2_000
      oversized = documentFor(key, 200, pointCount)
    }

    expect(await repository.put(oversized)).toBe('quota-exceeded')
    expect(storage.getItem(createSketchStorageKey(key))).toBe(originalRaw)
  })

  it('keeps at most the recent 50 documents while preserving active sessions', async () => {
    const storage = memoryStorage()
    const activeSessionId = 'active-session'
    const repository = createLocalSketchRepository(storage, {
      isSessionActive: ({ sessionId }) => sessionId === activeSessionId,
    })
    const activeKey = { learnerId: null, sessionId: activeSessionId, itemId: 'active-item' }
    await repository.put(documentFor(activeKey, 1))

    const completedKeys: SketchDocumentKey[] = []
    for (let index = 0; index < MAX_SKETCH_DOCUMENTS_PER_LEARNER; index += 1) {
      const key = {
        learnerId: null,
        sessionId: `completed-${index}`,
        itemId: `item-${index}`,
      }
      completedKeys.push(key)
      expect(await repository.put(documentFor(key, index + 10))).toBe('saved')
    }

    expect(await repository.get(activeKey)).not.toBeNull()
    expect(await repository.get(completedKeys[0])).toBeNull()
    expect(await repository.get(completedKeys.at(-1)!)).not.toBeNull()
  })

  it('returns quota-exceeded instead of deleting active documents when retention cannot make room', async () => {
    const storage = memoryStorage()
    const repository = createLocalSketchRepository(storage, {
      isSessionActive: () => true,
    })
    for (let index = 0; index < MAX_SKETCH_DOCUMENTS_PER_LEARNER; index += 1) {
      const key = { learnerId: null, sessionId: `active-${index}`, itemId: `item-${index}` }
      expect(await repository.put(documentFor(key, index + 1))).toBe('saved')
    }
    const overflowKey = { learnerId: null, sessionId: 'active-overflow', itemId: 'overflow' }

    expect(await repository.put(documentFor(overflowKey, 100))).toBe('quota-exceeded')
    expect(await repository.get(overflowKey)).toBeNull()
  })

  it('reports browser write quota errors and is safe when storage is unavailable', async () => {
    const key = { learnerId: 'learner-1', sessionId: 'session-1', itemId: 'item-1' }
    const failingStorage = memoryStorage()
    failingStorage.setItem = vi.fn(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    expect(await createLocalSketchRepository(failingStorage).put(documentFor(key, 100)))
      .toBe('quota-exceeded')

    const unavailable = createLocalSketchRepository(null)
    expect(await unavailable.get(key)).toBeNull()
    expect(await unavailable.put(documentFor(key, 100))).toBe('quota-exceeded')
    expect(await unavailable.prune('learner-1')).toBe(0)
    await expect(unavailable.removeSession('learner-1', 'session-1')).resolves.toBeUndefined()
  })
})
