import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import ScratchPad, { canStartScratchStroke, isActiveScratchPointer } from './ScratchPad'

describe('ScratchPad', () => {
  it('renders tablet-friendly pen, eraser, clear controls and a temporary canvas', () => {
    const html = renderToStaticMarkup(createElement(ScratchPad))

    expect(html).toContain('data-testid="scratch-pad"')
    expect(html).toContain('펜')
    expect(html).toContain('지우개')
    expect(html).toContain('전체 지우기')
    expect(html).toContain('aria-label="문제 풀이를 쓰는 임시 캔버스"')
    expect(html).toContain('data-drawing="false"')
    expect(html).toContain('select-none')
    expect(html).toContain('overscroll-contain')
    expect(html).toContain('touch-none')
    expect(html).toContain('disabled:pointer-events-none')
  })

  it('keeps one active touch or pen stroke isolated from other pointers', () => {
    expect(canStartScratchStroke(null, { button: 0, pointerId: 7, pointerType: 'touch' })).toBe(true)
    expect(canStartScratchStroke(7, { button: 0, pointerId: 8, pointerType: 'touch' })).toBe(false)
    expect(canStartScratchStroke(null, { button: 2, pointerId: 9, pointerType: 'mouse' })).toBe(false)

    expect(isActiveScratchPointer(7, 7)).toBe(true)
    expect(isActiveScratchPointer(7, 8)).toBe(false)
  })
})
