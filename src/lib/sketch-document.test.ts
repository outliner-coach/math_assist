import { describe, expect, it } from 'vitest'

import {
  appendSketchClear,
  appendSketchStroke,
  createSketchDocument,
  normalizeSketchPoint,
  parseSketchDocument,
  projectSketchPoint,
  redoSketchDocument,
  replaySketchDocument,
  serializeSketchDocument,
  undoSketchDocument,
  type SketchDocumentKey,
} from './sketch-document'

const key: SketchDocumentKey = {
  learnerId: null,
  sessionId: 'session-1',
  itemId: 'item-1',
}

describe('sketch document reducer', () => {
  it('normalizes coordinates and pressure independently from canvas size', () => {
    expect(normalizeSketchPoint({ x: 100, y: 50, pressure: 0.6 }, { width: 200, height: 100 }))
      .toEqual({ x: 0.5, y: 0.5, pressure: 0.6 })
    expect(normalizeSketchPoint({ x: -20, y: 240, pressure: 2 }, { width: 200, height: 100 }))
      .toEqual({ x: 0, y: 1, pressure: 1 })
    expect(normalizeSketchPoint({ x: 20, y: 10, pressure: Number.NaN }, { width: 40, height: 20 }))
      .toEqual({ x: 0.5, y: 0.5, pressure: null })
    expect(() => normalizeSketchPoint({ x: 1, y: 1 }, { width: 0, height: 10 }))
      .toThrow(RangeError)

    const normalized = normalizeSketchPoint(
      { x: 100, y: 50, pressure: 0.6 },
      { width: 200, height: 100 },
    )
    expect(projectSketchPoint(normalized, { width: 400, height: 300 }))
      .toEqual({ x: 200, y: 150, pressure: 0.6 })
  })

  it('preserves point and coalesced-event order for pen and eraser strokes', () => {
    const start = createSketchDocument(key, 100)
    const penPoints = [
      { x: 0.1, y: 0.2, pressure: 0.4 },
      { x: 0.3, y: 0.4, pressure: 0.5 },
      { x: 0.7, y: 0.8, pressure: null },
    ]
    const pen = appendSketchStroke(start, {
      id: 'stroke-1',
      tool: 'pen',
      points: penPoints,
    }, 110)
    const erased = appendSketchStroke(pen, {
      id: 'stroke-2',
      tool: 'eraser',
      points: [{ x: 0.3, y: 0.4, pressure: 0.2 }],
    }, 120)

    expect(erased.commands).toEqual([
      { type: 'stroke', id: 'stroke-1', tool: 'pen', points: penPoints },
      {
        type: 'stroke',
        id: 'stroke-2',
        tool: 'eraser',
        points: [{ x: 0.3, y: 0.4, pressure: 0.2 }],
      },
    ])
    expect(erased.historyCursor).toBe(2)
  })

  it('keeps clear as an undoable command and supports deterministic redo', () => {
    const drawn = appendSketchStroke(createSketchDocument(key, 100), {
      id: 'stroke-1',
      tool: 'pen',
      points: [{ x: 0.2, y: 0.2, pressure: null }],
    }, 110)
    const cleared = appendSketchClear(drawn, 'clear-1', 120)

    expect(replaySketchDocument(cleared).map((command) => command.type)).toEqual(['stroke', 'clear'])

    const restored = undoSketchDocument(cleared, 130)
    expect(restored.historyCursor).toBe(1)
    expect(restored.commands).toHaveLength(2)
    expect(replaySketchDocument(restored).map((command) => command.type)).toEqual(['stroke'])

    const redone = redoSketchDocument(restored, 140)
    expect(redone.historyCursor).toBe(2)
    expect(replaySketchDocument(redone).map((command) => command.type)).toEqual(['stroke', 'clear'])
  })

  it('drops the redo branch when a new command follows undo', () => {
    const first = appendSketchStroke(createSketchDocument(key, 100), {
      id: 'stroke-1',
      tool: 'pen',
      points: [{ x: 0.1, y: 0.1, pressure: null }],
    }, 110)
    const second = appendSketchClear(first, 'clear-old', 120)
    const undone = undoSketchDocument(second, 130)
    const branch = appendSketchStroke(undone, {
      id: 'stroke-new',
      tool: 'eraser',
      points: [{ x: 0.5, y: 0.5, pressure: 1 }],
    }, 140)

    expect(branch.commands.map((command) => command.id)).toEqual(['stroke-1', 'stroke-new'])
    expect(branch.historyCursor).toBe(2)
    expect(redoSketchDocument(branch, 150)).toBe(branch)
  })

  it('serializes and parses idempotently while rejecting corrupt or cross-item documents', () => {
    const document = appendSketchStroke(createSketchDocument(key, 100), {
      id: 'stroke-1',
      tool: 'pen',
      points: [{ x: 0.25, y: 0.75, pressure: 0 }],
    }, 110)
    const serialized = serializeSketchDocument(document)
    const parsed = parseSketchDocument(serialized, key)

    expect(parsed).toEqual(document)
    expect(serializeSketchDocument(parsed!)).toBe(serialized)
    expect(parseSketchDocument('{bad json', key)).toBeNull()
    expect(parseSketchDocument(JSON.stringify({ ...document, historyCursor: 99 }), key)).toBeNull()
    expect(parseSketchDocument(serialized, { ...key, itemId: 'other-item' })).toBeNull()
    expect(parseSketchDocument(JSON.stringify({
      ...document,
      commands: [{
        type: 'stroke',
        id: 'bad-point',
        tool: 'pen',
        points: [{ x: 2, y: 0.5, pressure: null }],
      }],
      historyCursor: 1,
    }), key)).toBeNull()
  })
})
