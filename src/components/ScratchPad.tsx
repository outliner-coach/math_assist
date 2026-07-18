'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

type ScratchTool = 'pen' | 'eraser'

function getCanvasPoint(canvas: HTMLCanvasElement, event: React.PointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

export default function ScratchPad() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [tool, setTool] = useState<ScratchTool>('pen')

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

  const drawTo = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const previous = lastPointRef.current
    if (!canvas || !drawingRef.current || !previous) return

    const next = getCanvasPoint(canvas, event)
    const context = canvas.getContext('2d')
    if (!context) return

    context.save()
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    context.strokeStyle = '#172554'
    context.lineWidth = tool === 'eraser' ? 24 : 3.5
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()
    context.moveTo(previous.x, previous.y)
    context.lineTo(next.x, next.y)
    context.stroke()
    context.restore()
    lastPointRef.current = next
  }, [tool])

  const startDrawing = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(event.pointerId)
    drawingRef.current = true
    lastPointRef.current = getCanvasPoint(canvas, event)
  }, [])

  const stopDrawing = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas?.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    drawingRef.current = false
    lastPointRef.current = null
  }, [])

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
    <section className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-md" data-testid="scratch-pad">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="font-bold text-slate-800">내 풀이장</h2>
          <p className="text-xs text-slate-500">손가락이나 펜으로 자유롭게 써 보세요.</p>
        </div>
        <div className="flex gap-2" role="toolbar" aria-label="풀이장 도구">
          <button
            type="button"
            aria-pressed={tool === 'pen'}
            onClick={() => setTool('pen')}
            className={`min-h-[44px] rounded-xl px-3 text-sm font-bold ${tool === 'pen' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            펜
          </button>
          <button
            type="button"
            aria-pressed={tool === 'eraser'}
            onClick={() => setTool('eraser')}
            className={`min-h-[44px] rounded-xl px-3 text-sm font-bold ${tool === 'eraser' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            지우개
          </button>
          <button type="button" onClick={clearCanvas} className="min-h-[44px] rounded-xl bg-rose-50 px-3 text-sm font-bold text-rose-700">
            전체 지우기
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="문제 풀이를 쓰는 임시 캔버스"
        className="block h-[360px] w-full cursor-crosshair bg-[linear-gradient(#eef2ff_1px,transparent_1px),linear-gradient(90deg,#eef2ff_1px,transparent_1px)] bg-[size:24px_24px] touch-none md:h-[440px]"
        onPointerDown={startDrawing}
        onPointerMove={drawTo}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
      />
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">문제를 바꾸면 풀이장은 비워져요.</p>
    </section>
  )
}
