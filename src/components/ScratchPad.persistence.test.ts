// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  appendSketchStroke,
  createSketchDocument,
  type SketchDocument,
  type SketchDocumentKey,
} from '@/lib/sketch-document'
import type { SketchRepository } from '@/lib/sketch-repository'
import ScratchPad from './ScratchPad'

type ResizeCallback = () => void

function repositoryWith(document: SketchDocument | null) {
  return {
    get: vi.fn(async () => document),
    put: vi.fn(async () => 'saved' as const),
    removeSession: vi.fn(async () => undefined),
    prune: vi.fn(async () => 0),
  } satisfies SketchRepository
}

function buttonByText(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button'))
    .find((candidate) => candidate.textContent === label)
  if (!button) throw new Error(`Missing button: ${label}`)
  return button
}

function pointerEvent(
  type: string,
  values: {
    pointerId: number
    clientX: number
    clientY: number
    pressure?: number
    pointerType?: string
    button?: number
    coalesced?: Array<{ clientX: number; clientY: number; pressure: number }>
  },
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, {
    button: values.button ?? 0,
    pointerId: values.pointerId,
    pointerType: values.pointerType ?? 'pen',
    clientX: values.clientX,
    clientY: values.clientY,
    pressure: values.pressure ?? 0.5,
    getCoalescedEvents: () => values.coalesced ?? [],
  })
  return event
}

describe('ScratchPad persistence', () => {
  let container: HTMLDivElement
  let root: Root
  let resizeCallback: ResizeCallback | null
  let rect = { width: 200, height: 100 }
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    globalCompositeOperation: 'source-over',
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineCap: 'round',
    lineJoin: 'round',
  }

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    resizeCallback = null
    rect = { width: 200, height: 100 }
    Object.values(context).forEach((value) => {
      if (typeof value === 'function' && 'mockClear' in value) value.mockClear()
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => context as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: rect.width,
        bottom: rect.height,
        width: rect.width,
        height: rect.height,
        toJSON: () => ({}),
      }))
    Object.defineProperties(HTMLCanvasElement.prototype, {
      hasPointerCapture: { configurable: true, value: vi.fn(() => false) },
      releasePointerCapture: { configurable: true, value: vi.fn() },
      setPointerCapture: { configurable: true, value: vi.fn() },
    })
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeCallback) {
        resizeCallback = callback
      }
      observe() {}
      disconnect() {}
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function renderPersisted(repository: SketchRepository, key: SketchDocumentKey) {
    await act(async () => {
      root.render(createElement(ScratchPad, {
        ...key,
        sessionStatus: 'active',
        repository,
      }))
    })
    await act(async () => {
      await Promise.resolve()
    })
  }

  it('restores the item document on mount and reprojects normalized points after resize', async () => {
    const key = { learnerId: null, sessionId: 'session-1', itemId: 'item-1' }
    const restored = appendSketchStroke(createSketchDocument(key, 100), {
      id: 'stroke-1',
      tool: 'pen',
      points: [{ x: 0.5, y: 0.5, pressure: 0.7 }],
    }, 110)
    const repository = repositoryWith(restored)

    await renderPersisted(repository, key)

    expect(repository.get).toHaveBeenCalledWith(key)
    expect(context.arc).toHaveBeenCalledWith(100, 50, expect.any(Number), 0, Math.PI * 2)
    expect(buttonByText(container, '되돌리기').disabled).toBe(false)

    context.arc.mockClear()
    rect = { width: 400, height: 200 }
    await act(async () => resizeCallback?.())
    expect(context.arc).toHaveBeenCalledWith(200, 100, expect.any(Number), 0, Math.PI * 2)
  })

  it('clears the previous item immediately while the next item is still restoring', async () => {
    const firstKey = { learnerId: null, sessionId: 'session-1', itemId: 'item-1' }
    const secondKey = { learnerId: null, sessionId: 'session-1', itemId: 'item-2' }
    const firstDocument = appendSketchStroke(createSketchDocument(firstKey, 100), {
      id: 'stroke-1',
      tool: 'pen',
      points: [{ x: 0.5, y: 0.5, pressure: 0.7 }],
    }, 110)
    let resolveSecond: ((document: SketchDocument | null) => void) | null = null
    const repository = repositoryWith(null)
    repository.get.mockImplementation((key) => (
      key.itemId === firstKey.itemId
        ? Promise.resolve(firstDocument)
        : new Promise((resolve) => { resolveSecond = resolve })
    ))

    await renderPersisted(repository, firstKey)
    expect(context.arc).toHaveBeenCalled()
    context.arc.mockClear()
    context.clearRect.mockClear()

    await act(async () => {
      root.render(createElement(ScratchPad, {
        ...secondKey,
        sessionStatus: 'active',
        repository,
      }))
      await Promise.resolve()
    })

    expect(context.clearRect).toHaveBeenCalled()
    expect(context.arc).not.toHaveBeenCalled()
    expect(container.querySelector('canvas')?.getAttribute('aria-disabled')).toBe('true')

    await act(async () => {
      resolveSecond?.(null)
      await Promise.resolve()
    })
    expect(container.querySelector('canvas')?.getAttribute('aria-disabled')).toBe('false')
  })

  it('persists ordered coalesced pen points and keeps pointercancel as an end safety net', async () => {
    const key = { learnerId: null, sessionId: 'session-1', itemId: 'item-1' }
    const repository = repositoryWith(null)
    await renderPersisted(repository, key)
    const canvas = container.querySelector('canvas')!

    await act(async () => {
      canvas.dispatchEvent(pointerEvent('pointerdown', {
        pointerId: 7,
        clientX: 20,
        clientY: 10,
        pressure: 0.4,
      }))
      canvas.dispatchEvent(pointerEvent('pointermove', {
        pointerId: 7,
        clientX: 60,
        clientY: 30,
        coalesced: [
          { clientX: 40, clientY: 20, pressure: 0.5 },
          { clientX: 60, clientY: 30, pressure: 0.6 },
        ],
      }))
      window.dispatchEvent(pointerEvent('pointercancel', {
        pointerId: 7,
        clientX: 60,
        clientY: 30,
      }))
    })

    const saved = repository.put.mock.calls.at(-1)?.[0]
    expect(saved?.commands[0]).toMatchObject({
      type: 'stroke',
      tool: 'pen',
      points: [
        { x: 0.1, y: 0.1, pressure: 0.4 },
        { x: 0.2, y: 0.2, pressure: 0.5 },
        { x: 0.3, y: 0.3, pressure: 0.6 },
      ],
    })
  })

  it('supports a controlled document without writing to a repository', async () => {
    const controlled = createSketchDocument({
      learnerId: null,
      sessionId: 'controlled-session',
      itemId: 'controlled-item',
    }, 100)
    const onSketchDocumentChange = vi.fn()

    await act(async () => {
      root.render(createElement(ScratchPad, {
        sketchDocument: controlled,
        onSketchDocumentChange,
      }))
    })
    const canvas = container.querySelector('canvas')!

    await act(async () => {
      canvas.dispatchEvent(pointerEvent('pointerdown', {
        pointerId: 9,
        clientX: 50,
        clientY: 25,
      }))
      canvas.dispatchEvent(pointerEvent('pointerup', {
        pointerId: 9,
        clientX: 50,
        clientY: 25,
      }))
    })

    expect(onSketchDocumentChange).toHaveBeenCalledWith(expect.objectContaining({
      historyCursor: 1,
      commands: [expect.objectContaining({ type: 'stroke', tool: 'pen' })],
    }))
  })

  it('persists eraser, clear, undo, and redo as document history', async () => {
    const key = { learnerId: null, sessionId: 'session-1', itemId: 'item-1' }
    const repository = repositoryWith(null)
    await renderPersisted(repository, key)
    const canvas = container.querySelector('canvas')!

    await act(async () => buttonByText(container, '지우개').click())
    await act(async () => {
      canvas.dispatchEvent(pointerEvent('pointerdown', {
        pointerId: 8,
        clientX: 30,
        clientY: 20,
      }))
      canvas.dispatchEvent(pointerEvent('pointerup', {
        pointerId: 8,
        clientX: 30,
        clientY: 20,
      }))
    })
    expect(repository.put.mock.calls.at(-1)?.[0].commands[0]).toMatchObject({ tool: 'eraser' })

    await act(async () => buttonByText(container, '전체 지우기').click())
    expect(repository.put.mock.calls.at(-1)?.[0].commands.at(-1)).toMatchObject({ type: 'clear' })

    await act(async () => buttonByText(container, '되돌리기').click())
    expect(repository.put.mock.calls.at(-1)?.[0]).toMatchObject({ historyCursor: 1 })

    await act(async () => buttonByText(container, '다시하기').click())
    expect(repository.put.mock.calls.at(-1)?.[0]).toMatchObject({ historyCursor: 2 })
  })

  it('disables editing for completed and expired sessions and reports quota failures', async () => {
    const key = { learnerId: null, sessionId: 'session-1', itemId: 'item-1' }
    const quotaRepository = repositoryWith(null)
    quotaRepository.put.mockResolvedValue('quota-exceeded')
    await renderPersisted(quotaRepository, key)

    await act(async () => buttonByText(container, '전체 지우기').click())
    await act(async () => await Promise.resolve())
    expect(container.textContent).toContain('저장 공간이 부족해요')

    await act(async () => {
      root.render(createElement(ScratchPad, {
        ...key,
        sessionStatus: 'completed',
        repository: quotaRepository,
      }))
    })
    expect(buttonByText(container, '펜').disabled).toBe(true)
    expect(buttonByText(container, '전체 지우기').disabled).toBe(true)
    expect(container.textContent).toContain('확인한 활동의 풀이예요. 읽기만 할 수 있어요.')

    await act(async () => {
      root.render(createElement(ScratchPad, {
        ...key,
        sessionStatus: 'expired',
        repository: quotaRepository,
      }))
    })
    expect(container.querySelector('canvas')?.getAttribute('aria-disabled')).toBe('true')
    expect(buttonByText(container, '지우개').disabled).toBe(true)
    expect(container.textContent).toContain('끝난 활동의 풀이예요. 읽기만 할 수 있어요.')
  })
})
