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

  it('hides reverse-problem measurements until the solution is shown', () => {
    const polygon = {
      type: 'polygon' as const,
      shape: 'rectangle' as const,
      a: 10,
      b: 5,
      unit: 'cm',
      unknownMeasurement: 'b' as const,
    }
    const hiddenPolygon = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual: polygon }))
    const revealedPolygon = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual: polygon, showAnswer: true }))

    expect(hiddenPolygon).toContain('?cm')
    expect(hiddenPolygon).not.toContain('5cm')
    expect(revealedPolygon).toContain('5cm')

    const cuboid = {
      type: 'cuboid' as const,
      width: 8,
      height: 4,
      depth: 3,
      unit: 'cm',
      unknownMeasurement: 'width' as const,
    }
    const hiddenCuboid = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual: cuboid }))
    const revealedCuboid = renderToStaticMarkup(createElement(GeometryProblemVisual, { visual: cuboid, showAnswer: true }))

    expect(hiddenCuboid).toContain('?cm')
    expect(hiddenCuboid).not.toContain('8cm')
    expect(revealedCuboid).toContain('8cm')
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
