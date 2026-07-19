'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

type ScratchTool = 'pen' | 'eraser'
type CanvasPoint = { x: number; y: number }

type ScratchPointer = Pick<React.PointerEvent<HTMLCanvasElement>, 'button' | 'pointerId' | 'pointerType'>
type CanvasPointerPosition = Pick<PointerEvent, 'clientX' | 'clientY'>

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

export default function ScratchPad() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const lastPointRef = useRef<CanvasPoint | null>(null)
  const [tool, setTool] = useState<ScratchTool>('pen')
  const [isDrawing, setIsDrawing] = useState(false)

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ratio = Math.max(1, window.devicePixelRatio || 1)
    const nextWidth = Math.round(rect.width * ratio)
    const nextHeight = Math.round(rect.height * ratio)
    if (canvas.width === nextWidth && canvas.height === nextHeight) return

    canvas.width = nextWidth
    canvas.height = nextHeight
    const context = canvas.getContext('2d')
    context?.setTransform(ratio, 0, 0, ratio, 0, 0)
  }, [])

  useEffect(() => {
    resizeCanvas()
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [resizeCanvas])

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

  const finishDrawing = useCallback((pointerId: number) => {
    if (!isActiveScratchPointer(activePointerIdRef.current, pointerId)) return

    activePointerIdRef.current = null
    lastPointRef.current = null
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas?.hasPointerCapture(pointerId)) return

    try {
      canvas.releasePointerCapture(pointerId)
    } catch {
      // WebKit can already have released capture; the local stroke is still safely finished.
    }
  }, [])

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
    if (!canvas || !isActiveScratchPointer(activePointerIdRef.current, event.pointerId) || !previous) return

    event.preventDefault()

    const context = canvas.getContext('2d')
    if (!context) return

    const coalescedEvents = event.nativeEvent.getCoalescedEvents?.() ?? []
    const pointerEvents = coalescedEvents.length > 0 ? coalescedEvents : [event.nativeEvent]

    context.save()
    applyTool(context, tool)
    let lastPoint = previous
    for (const pointerEvent of pointerEvents) {
      const next = getCanvasPoint(canvas, pointerEvent)
      context.beginPath()
      context.moveTo(lastPoint.x, lastPoint.y)
      context.lineTo(next.x, next.y)
      context.stroke()
      lastPoint = next
    }
    context.restore()
    lastPointRef.current = lastPoint
  }, [tool])

  const startDrawing = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !canStartScratchStroke(activePointerIdRef.current, event)) return

    event.preventDefault()
    const startPoint = getCanvasPoint(canvas, event.nativeEvent)
    activePointerIdRef.current = event.pointerId
    lastPointRef.current = startPoint
    setIsDrawing(true)
    drawStrokeStart(canvas, startPoint, tool)

    if (shouldCaptureScratchPointer(event.pointerType)) {
      try {
        canvas.setPointerCapture(event.pointerId)
      } catch {
        // Drawing remains active even if WebKit rejects explicit pointer capture.
      }
    }
  }, [tool])

  const stopDrawing = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActiveScratchPointer(activePointerIdRef.current, event.pointerId)) return

    event.preventDefault()
    finishDrawing(event.pointerId)
  }, [finishDrawing])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.restore()
  }, [])

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
        <div className="flex gap-2" role="toolbar" aria-label="풀이장 도구">
          <button
            type="button"
            aria-pressed={tool === 'pen'}
            disabled={isDrawing}
            onClick={() => setTool('pen')}
            className={`min-h-[44px] touch-manipulation rounded-xl px-3 text-sm font-bold disabled:pointer-events-none ${tool === 'pen' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            펜
          </button>
          <button
            type="button"
            aria-pressed={tool === 'eraser'}
            disabled={isDrawing}
            onClick={() => setTool('eraser')}
            className={`min-h-[44px] touch-manipulation rounded-xl px-3 text-sm font-bold disabled:pointer-events-none ${tool === 'eraser' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            지우개
          </button>
          <button
            type="button"
            disabled={isDrawing}
            onClick={clearCanvas}
            className="min-h-[44px] touch-manipulation rounded-xl bg-rose-50 px-3 text-sm font-bold text-rose-700 disabled:pointer-events-none"
          >
            전체 지우기
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="문제 풀이를 쓰는 임시 캔버스"
        className="block h-[360px] w-full cursor-crosshair select-none overscroll-contain bg-[linear-gradient(#eef2ff_1px,transparent_1px),linear-gradient(90deg,#eef2ff_1px,transparent_1px)] bg-[size:24px_24px] touch-none md:h-[440px]"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={startDrawing}
        onPointerMove={drawTo}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
      />
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">문제를 바꾸면 풀이장은 비워져요.</p>
    </section>
  )
}
