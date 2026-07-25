import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import GeometryProblemVisual, { buildPolygonLayout } from './GeometryProblemVisual'

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

  it('derives polygon proportions from the same quantitative model', () => {
    const wide = buildPolygonLayout({
      type: 'polygon',
      shape: 'rectangle',
      a: 12,
      b: 3,
    })
    const compact = buildPolygonLayout({
      type: 'polygon',
      shape: 'rectangle',
      a: 6,
      b: 5,
    })

    expect(wide.width / wide.height).toBeCloseTo(4, 5)
    expect(compact.width / compact.height).toBeCloseTo(1.2, 5)
    expect(wide.width / wide.height).toBeGreaterThan(compact.width / compact.height)

    for (const layout of [wide, compact]) {
      expect(Math.min(...layout.points.map(point => point.x))).toBeGreaterThanOrEqual(40)
      expect(Math.max(...layout.points.map(point => point.x))).toBeLessThanOrEqual(260)
      expect(Math.min(...layout.points.map(point => point.y))).toBeGreaterThanOrEqual(25)
      expect(Math.max(...layout.points.map(point => point.y))).toBeLessThanOrEqual(150)
    }
  })

  it('preserves all three side ratios for perimeter triangles', () => {
    const layout = buildPolygonLayout({
      type: 'polygon',
      shape: 'triangle',
      a: 6,
      b: 7,
      c: 9,
      measurementMode: 'sides',
    })
    const distance = (left: { x: number; y: number }, right: { x: number; y: number }) => (
      Math.hypot(left.x - right.x, left.y - right.y)
    )
    const [left, right, apex] = layout.points
    const scale = distance(left, right) / 6

    expect(distance(left, apex) / scale).toBeCloseTo(7, 5)
    expect(distance(right, apex) / scale).toBeCloseTo(9, 5)
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

    const maskedLayout = buildPolygonLayout(polygon, false)
    const revealedLayout = buildPolygonLayout(polygon, true)
    expect(maskedLayout.width / maskedLayout.height).not.toBeCloseTo(
      revealedLayout.width / revealedLayout.height,
      5
    )
    expect(revealedLayout.width / revealedLayout.height).toBeCloseTo(2, 5)

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
