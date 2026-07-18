import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import ScratchPad from './ScratchPad'

describe('ScratchPad', () => {
  it('renders tablet-friendly pen, eraser, clear controls and a temporary canvas', () => {
    const html = renderToStaticMarkup(createElement(ScratchPad))

    expect(html).toContain('data-testid="scratch-pad"')
    expect(html).toContain('펜')
    expect(html).toContain('지우개')
    expect(html).toContain('전체 지우기')
    expect(html).toContain('aria-label="문제 풀이를 쓰는 임시 캔버스"')
    expect(html).toContain('touch-none')
  })
})
