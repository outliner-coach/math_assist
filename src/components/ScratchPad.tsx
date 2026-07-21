'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  appendSketchClear,
  appendSketchStroke,
  createSketchDocument,
  normalizeSketchPoint,
  projectSketchPoint,
  redoSketchDocument,
  replaySketchDocument,
  undoSketchDocument,
  type NormalizedPoint,
  type ScratchToolId,
  type SketchDocument,
  type SketchDocumentKey,
} from '@/lib/sketch-document'
import { createLocalSketchRepository, type SketchRepository } from '@/lib/sketch-repository'

type ScratchTool = ScratchToolId
type CanvasPoint = { x: number; y: number }
export type ScratchSessionStatus = 'active' | 'completed' | 'expired'

export interface ScratchPadProps {
  learnerId?: string | null
  sessionId?: string
  itemId?: string
  sessionStatus?: ScratchSessionStatus
  repository?: SketchRepository
  sketchDocument?: SketchDocument
  onSketchDocumentChange?: (document: SketchDocument) => void
}

type ScratchPointer = Pick<React.PointerEvent<HTMLCanvasElement>, 'button' | 'pointerId' | 'pointerType'>
type CanvasPointerPosition = Pick<PointerEvent, 'clientX' | 'clientY' | 'pressure'>

interface ActiveStroke {
  id: string
  tool: ScratchTool
  points: NormalizedPoint[]
}

type SaveState = 'idle' | 'saving' | 'saved' | 'quota-exceeded' | 'corrupt'

const LEGACY_KEY: SketchDocumentKey = {
  learnerId: null,
  sessionId: 'unpersisted-session',
  itemId: 'unpersisted-item',
}

export function canStartScratchStroke(activePointerId: number | null, event: ScratchPointer) {
  if (activePointerId !== null) return false
  return event.pointerType !== 'mouse' || event.button === 0
}

export function isActiveScratchPointer(activePointerId: number | null, pointerId: number) {
  return activePointerId === pointerId
}

export function shouldCaptureScratchPointer(pointerType: string) {
  return pointerType === 'mouse'
}

function getCanvasPoint(canvas: HTMLCanvasElement, event: CanvasPointerPosition) {
  const rect = canvas.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function getNormalizedCanvasPoint(canvas: HTMLCanvasElement, event: CanvasPointerPosition) {
  const rect = canvas.getBoundingClientRect()
  return normalizeSketchPoint({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pressure: event.pressure,
  }, rect)
}

function applyTool(context: CanvasRenderingContext2D, tool: ScratchTool) {
  context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
  context.strokeStyle = '#172554'
  context.fillStyle = '#172554'
  context.lineWidth = tool === 'eraser' ? 24 : 3.5
  context.lineCap = 'round'
  context.lineJoin = 'round'
}

function drawStrokeStart(canvas: HTMLCanvasElement, point: CanvasPoint, tool: ScratchTool) {
  const context = canvas.getContext('2d')
  if (!context) return

  context.save()
  applyTool(context, tool)
  context.beginPath()
  context.arc(point.x, point.y, context.lineWidth / 2, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function clearCanvasPixels(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.restore()
}

function renderSketchDocument(canvas: HTMLCanvasElement, document: SketchDocument) {
  const rect = canvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return

  const ratio = Math.max(1, window.devicePixelRatio || 1)
  const nextWidth = Math.round(rect.width * ratio)
  const nextHeight = Math.round(rect.height * ratio)
  if (canvas.width !== nextWidth) canvas.width = nextWidth
  if (canvas.height !== nextHeight) canvas.height = nextHeight

  const context = canvas.getContext('2d')
  if (!context) return
  clearCanvasPixels(canvas, context)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)

  for (const command of replaySketchDocument(document)) {
    if (command.type === 'clear') {
      clearCanvasPixels(canvas, context)
      continue
    }

    const points = command.points.map((point) => projectSketchPoint(point, rect))
    drawStrokeStart(canvas, points[0], command.tool)
    if (points.length === 1) continue

    context.save()
    applyTool(context, command.tool)
    for (let index = 1; index < points.length; index += 1) {
      context.beginPath()
      context.moveTo(points[index - 1].x, points[index - 1].y)
      context.lineTo(points[index].x, points[index].y)
      context.stroke()
    }
    context.restore()
  }
}

function stableKeyFromProps(props: ScratchPadProps): SketchDocumentKey | null {
  if (
    (props.learnerId === null || typeof props.learnerId === 'string') &&
    typeof props.sessionId === 'string' && props.sessionId.length > 0 &&
    typeof props.itemId === 'string' && props.itemId.length > 0
  ) {
    return {
      learnerId: props.learnerId ?? null,
      sessionId: props.sessionId,
      itemId: props.itemId,
    }
  }
  return null
}

export default function ScratchPad(props: ScratchPadProps = {}) {
  const {
    learnerId,
    sessionId,
    itemId,
    sessionStatus: requestedSessionStatus,
    repository: requestedRepository,
    sketchDocument,
    onSketchDocumentChange,
  } = props
  const stableKey = useMemo(
    () => stableKeyFromProps({ learnerId, sessionId, itemId }),
    [itemId, learnerId, sessionId],
  )
  const sessionStatus = requestedSessionStatus ?? 'active'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const lastPointRef = useRef<CanvasPoint | null>(null)
  const activeStrokeRef = useRef<ActiveStroke | null>(null)
  const commandSequenceRef = useRef(0)
  const saveSequenceRef = useRef(0)
  const [tool, setTool] = useState<ScratchTool>('pen')
  const [isDrawing, setIsDrawing] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [isReady, setIsReady] = useState(() => sketchDocument !== undefined || stableKey === null)
  const [internalDocument, setInternalDocument] = useState(() => (
    sketchDocument ?? createSketchDocument(stableKey ?? LEGACY_KEY)
  ))
  const currentDocument = sketchDocument ?? internalDocument
  const documentRef = useRef(currentDocument)
  documentRef.current = currentDocument

  const localRepository = useMemo(() => createLocalSketchRepository(undefined, {
    isSessionActive: (key) => key.sessionId === stableKey?.sessionId
      ? sessionStatus === 'active'
      : true,
  }), [sessionStatus, stableKey?.sessionId])
  const repository = requestedRepository ?? localRepository
  const canEdit = isReady && sessionStatus === 'active'

  const nextCommandId = useCallback((kind: 'stroke' | 'clear') => {
    commandSequenceRef.current += 1
    return `${kind}-${Date.now()}-${commandSequenceRef.current}`
  }, [])

  useEffect(() => {
    if (sketchDocument) {
      documentRef.current = sketchDocument
      setIsReady(true)
      return
    }
    if (!stableKey) {
      const next = createSketchDocument(LEGACY_KEY)
      documentRef.current = next
      setInternalDocument(next)
      setIsReady(true)
      return
    }

    let cancelled = false
    const pending = createSketchDocument(stableKey)
    documentRef.current = pending
    setInternalDocument(pending)
    setIsReady(false)
    setSaveState('idle')
    repository.get(stableKey).then((restored) => {
      if (cancelled) return
      const next = restored ?? createSketchDocument(stableKey)
      documentRef.current = next
      setInternalDocument(next)
      setIsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [
    sketchDocument,
    repository,
    stableKey,
  ])

  const repaint = useCallback(() => {
    const canvas = canvasRef.current
    if (canvas) renderSketchDocument(canvas, documentRef.current)
  }, [])

  useEffect(() => {
    documentRef.current = currentDocument
    repaint()
  }, [currentDocument, repaint])

  useEffect(() => {
    repaint()
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(repaint)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [repaint])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const preventNativeGesture = (event: Event) => {
      if (event.cancelable) event.preventDefault()
    }
    const listenerOptions: AddEventListenerOptions = { capture: true, passive: false }

    canvas.addEventListener('pointerdown', preventNativeGesture, listenerOptions)
    canvas.addEventListener('pointermove', preventNativeGesture, listenerOptions)
    canvas.addEventListener('touchstart', preventNativeGesture, listenerOptions)
    canvas.addEventListener('touchmove', preventNativeGesture, listenerOptions)

    return () => {
      canvas.removeEventListener('pointerdown', preventNativeGesture, true)
      canvas.removeEventListener('pointermove', preventNativeGesture, true)
      canvas.removeEventListener('touchstart', preventNativeGesture, true)
      canvas.removeEventListener('touchmove', preventNativeGesture, true)
    }
  }, [])

  const commitDocument = useCallback((next: SketchDocument) => {
    documentRef.current = next
    if (sketchDocument === undefined) setInternalDocument(next)
    onSketchDocumentChange?.(next)

    if (!stableKey) return
    const saveSequence = ++saveSequenceRef.current
    setSaveState('saving')
    void repository.put(next).then((result) => {
      if (saveSequence !== saveSequenceRef.current) return
      setSaveState(result)
    })
  }, [onSketchDocumentChange, repository, sketchDocument, stableKey])

  const finishDrawing = useCallback((pointerId: number) => {
    if (!isActiveScratchPointer(activePointerIdRef.current, pointerId)) return

    const activeStroke = activeStrokeRef.current
    activePointerIdRef.current = null
    activeStrokeRef.current = null
    lastPointRef.current = null
    setIsDrawing(false)

    if (activeStroke && activeStroke.points.length > 0) {
      commitDocument(appendSketchStroke(documentRef.current, activeStroke))
    }

    const canvas = canvasRef.current
    if (!canvas || typeof canvas.hasPointerCapture !== 'function' || !canvas.hasPointerCapture(pointerId)) return

    try {
      canvas.releasePointerCapture(pointerId)
    } catch {
      // WebKit can already have released capture; the local stroke is still safely finished.
    }
  }, [commitDocument])

  useEffect(() => {
    const finishFromWindow = (event: PointerEvent) => finishDrawing(event.pointerId)
    window.addEventListener('pointerup', finishFromWindow)
    window.addEventListener('pointercancel', finishFromWindow)
    return () => {
      window.removeEventListener('pointerup', finishFromWindow)
      window.removeEventListener('pointercancel', finishFromWindow)
    }
  }, [finishDrawing])

  const drawTo = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const previous = lastPointRef.current
    const activeStroke = activeStrokeRef.current
    if (
      !canvas || !activeStroke ||
      !isActiveScratchPointer(activePointerIdRef.current, event.pointerId) ||
      !previous
    ) return

    event.preventDefault()
    const context = canvas.getContext('2d')
    if (!context) return

    const coalescedEvents = event.nativeEvent.getCoalescedEvents?.() ?? []
    const pointerEvents = coalescedEvents.length > 0 ? coalescedEvents : [event.nativeEvent]

    context.save()
    applyTool(context, activeStroke.tool)
    let lastPoint = previous
    for (const pointerEvent of pointerEvents) {
      const next = getCanvasPoint(canvas, pointerEvent)
      context.beginPath()
      context.moveTo(lastPoint.x, lastPoint.y)
      context.lineTo(next.x, next.y)
      context.stroke()
      activeStroke.points.push(getNormalizedCanvasPoint(canvas, pointerEvent))
      lastPoint = next
    }
    context.restore()
    lastPointRef.current = lastPoint
  }, [])

  const startDrawing = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canEdit || !canvas || !canStartScratchStroke(activePointerIdRef.current, event)) return

    event.preventDefault()
    const startPoint = getCanvasPoint(canvas, event.nativeEvent)
    activePointerIdRef.current = event.pointerId
    lastPointRef.current = startPoint
    activeStrokeRef.current = {
      id: nextCommandId('stroke'),
      tool,
      points: [getNormalizedCanvasPoint(canvas, event.nativeEvent)],
    }
    setIsDrawing(true)
    drawStrokeStart(canvas, startPoint, tool)

    if (shouldCaptureScratchPointer(event.pointerType) && typeof canvas.setPointerCapture === 'function') {
      try {
        canvas.setPointerCapture(event.pointerId)
      } catch {
        // Drawing remains active even if WebKit rejects explicit pointer capture.
      }
    }
  }, [canEdit, nextCommandId, tool])

  const stopDrawing = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActiveScratchPointer(activePointerIdRef.current, event.pointerId)) return

    event.preventDefault()
    finishDrawing(event.pointerId)
  }, [finishDrawing])

  const clearDocument = useCallback(() => {
    if (!canEdit || isDrawing) return
    commitDocument(appendSketchClear(documentRef.current, nextCommandId('clear')))
  }, [canEdit, commitDocument, isDrawing, nextCommandId])

  const undoDocument = useCallback(() => {
    if (!canEdit || isDrawing) return
    const next = undoSketchDocument(documentRef.current)
    if (next !== documentRef.current) commitDocument(next)
  }, [canEdit, commitDocument, isDrawing])

  const redoDocument = useCallback(() => {
    if (!canEdit || isDrawing) return
    const next = redoSketchDocument(documentRef.current)
    if (next !== documentRef.current) commitDocument(next)
  }, [canEdit, commitDocument, isDrawing])

  const controlsDisabled = !canEdit || isDrawing
  const saveMessage = sessionStatus === 'expired'
    ? '끝난 활동의 풀이예요. 읽기만 할 수 있어요.'
    : sessionStatus === 'completed'
      ? '확인한 활동의 풀이예요. 읽기만 할 수 있어요.'
      : saveState === 'corrupt'
        ? '기존 풀이 기록이 손상되어 덮어쓰지 않았어요.'
      : saveState === 'quota-exceeded'
    ? '저장 공간이 부족해요. 이 풀이를 기기에 저장하지 못했어요.'
    : saveState === 'saving'
      ? '기기에 저장 중이에요.'
      : saveState === 'saved'
        ? '이 문제의 풀이를 기기에 자동 저장했어요.'
          : stableKey
            ? '이 문제의 풀이를 기기에 자동 저장해요.'
            : '문제와 연결되면 풀이를 기기에 자동 저장해요.'

  return (
    <section
      className="select-none overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-md"
      data-drawing={isDrawing ? 'true' : 'false'}
      data-testid="scratch-pad"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="font-bold text-slate-800">내 풀이장</h2>
          <p className="text-xs text-slate-500">손가락이나 펜으로 자유롭게 써 보세요.</p>
        </div>
        <div className="flex flex-wrap gap-2" role="toolbar" aria-label="풀이장 도구">
          <button
            type="button"
            aria-pressed={tool === 'pen'}
            disabled={controlsDisabled}
            onClick={() => setTool('pen')}
            className={`min-h-[48px] min-w-[48px] touch-manipulation rounded-xl px-3 text-sm font-bold disabled:pointer-events-none ${tool === 'pen' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            펜
          </button>
          <button
            type="button"
            aria-pressed={tool === 'eraser'}
            disabled={controlsDisabled}
            onClick={() => setTool('eraser')}
            className={`min-h-[48px] min-w-[48px] touch-manipulation rounded-xl px-3 text-sm font-bold disabled:pointer-events-none ${tool === 'eraser' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            지우개
          </button>
          <button
            type="button"
            disabled={controlsDisabled || currentDocument.historyCursor === 0}
            onClick={undoDocument}
            className="min-h-[48px] min-w-[48px] touch-manipulation rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700 disabled:pointer-events-none"
          >
            되돌리기
          </button>
          <button
            type="button"
            disabled={controlsDisabled || currentDocument.historyCursor >= currentDocument.commands.length}
            onClick={redoDocument}
            className="min-h-[48px] min-w-[48px] touch-manipulation rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700 disabled:pointer-events-none"
          >
            다시하기
          </button>
          <button
            type="button"
            disabled={controlsDisabled}
            onClick={clearDocument}
            className="min-h-[48px] min-w-[48px] touch-manipulation rounded-xl bg-rose-50 px-3 text-sm font-bold text-rose-700 disabled:pointer-events-none"
          >
            전체 지우기
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="문제 풀이를 쓰는 캔버스"
        aria-disabled={!canEdit}
        className="block h-[360px] w-full cursor-crosshair select-none overscroll-contain bg-[linear-gradient(#eef2ff_1px,transparent_1px),linear-gradient(90deg,#eef2ff_1px,transparent_1px)] bg-[size:24px_24px] touch-none md:h-[440px]"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={startDrawing}
        onPointerMove={drawTo}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
      />
      <p
        aria-live="polite"
        className={`border-t border-slate-100 px-4 py-2 text-xs ${saveState === 'quota-exceeded' || saveState === 'corrupt' ? 'font-semibold text-rose-700' : 'text-slate-500'}`}
      >
        {saveMessage}
      </p>
    </section>
  )
}
