import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import GeometryProblemVisual from './GeometryProblemVisual'

describe('GeometryProblemVisual', () => {
  it('renders polygon measurements without adding an answer value', () => {
    const html = renderToStaticMarkup(createElement(GeometryProblemVisual, {
      visual: { type: 'polygon', shape: 'rectangle', a: 8, b: 5, unit: 'cm' },
    }))

    expect(html).toContain('geometry-visual-polygon')
    expect(html).toContain('8cm')
    expect(html).toContain('5cm')
    expect(html).not.toContain('26cm')
  })

  it('reveals congruence and net answers only after submission', () => {
    const congruence = { type: 'congruence' as const, mode: 'pair' as const, variant: 2 }
    const hiddenCongruence = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual: congruence }))
    const revealedCongruence = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual: congruence, showAnswer: true }))

    expect(hiddenCongruence).not.toContain('정답:')
    expect(revealedCongruence).toContain('정답:')

    const net = { type: 'cuboid-net' as const, mode: 'options' as const, variant: 3 }
    const hiddenNet = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual: net }))
    const revealedNet = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual: net, showAnswer: true }))

    expect(hiddenNet).not.toContain('정답 전개도')
    expect(revealedNet).toContain('정답 전개도')
  })

  it('keeps the reflected point hidden until the solution is shown', () => {
    const visual = {
      type: 'symmetry' as const,
      mode: 'line-coordinate' as const,
      variant: 1,
      x: 2,
      y: 3,
      axis: 5,
    }
    const hidden = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual }))
    const revealed = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual, showAnswer: true }))

    expect(hidden).toContain('P(2, 3)')
    expect(hidden).not.toContain('P′(8, 3)')
    expect(revealed).toContain('P′(8, 3)')
  })

  it('shows all square symmetry axes only in the solution view', () => {
    const visual = { type: 'symmetry' as const, mode: 'axes' as const, variant: 1 }
    const hidden = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual }))
    const revealed = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual, showAnswer: true }))

    expect((hidden.match(/stroke-dasharray/g) ?? [])).toHaveLength(0)
    expect((revealed.match(/stroke-dasharray/g) ?? [])).toHaveLength(4)
  })
})
