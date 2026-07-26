import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import GeometryProblemVisual, {
  buildCuboidLayout,
  buildCuboidNetOptions,
  buildCongruencePairLayout,
  buildPolygonLayout,
  buildPolySolidLayout,
  buildPrismNetLayout,
  buildRoundSolidLayout,
  buildCylinderNetLayout,
  isValidCubeNet,
} from './GeometryProblemVisual'

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

  it('derives every displayed congruent pair from one rigidly transformed polygon', () => {
    const distance = (left: { x: number; y: number }, right: { x: number; y: number }) => (
      Math.hypot(left.x - right.x, left.y - right.y)
    )

    for (const shape of ['quadrilateral', 'rectangle'] as const) {
      const layout = buildCongruencePairLayout(shape, { a: 8, b: 5, c: 7 })

      expect(layout.left).toHaveLength(4)
      expect(layout.right).toHaveLength(4)
      for (let leftIndex = 0; leftIndex < 4; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < 4; rightIndex += 1) {
          expect(distance(layout.left[leftIndex], layout.left[rightIndex])).toBeCloseTo(
            distance(layout.right[leftIndex], layout.right[rightIndex]),
            8
          )
        }
      }

      const edgeLengths = layout.left.map((point, index) => (
        distance(point, layout.left[(index + 1) % layout.left.length])
      ))
      expect(edgeLengths[0] / edgeLengths[1]).toBeCloseTo(8 / 5, 8)
      if (shape === 'quadrilateral') {
        expect(edgeLengths[2] / edgeLengths[1]).toBeCloseTo(7 / 5, 8)
      } else {
        expect(edgeLengths[2]).toBeCloseTo(edgeLengths[0], 8)
        expect(edgeLengths[3]).toBeCloseTo(edgeLengths[1], 8)
      }
    }
  })

  it('keeps every generated congruence measurement combination quantitative and in bounds', () => {
    const distance = (left: { x: number; y: number }, right: { x: number; y: number }) => (
      Math.hypot(left.x - right.x, left.y - right.y)
    )

    for (let a = 4; a <= 14; a += 1) {
      for (let b = 3; b <= 13; b += 1) {
        for (let c = 6; c <= 16; c += 1) {
          const { left, right } = buildCongruencePairLayout(
            'quadrilateral',
            { a, b, c }
          )
          const leftEdges = left.map((point, index) => (
            distance(point, left[(index + 1) % left.length])
          ))
          const rightEdges = right.map((point, index) => (
            distance(point, right[(index + 1) % right.length])
          ))

          expect(leftEdges[0] / leftEdges[1]).toBeCloseTo(a / b, 8)
          expect(leftEdges[2] / leftEdges[1]).toBeCloseTo(c / b, 8)
          for (let index = 0; index < leftEdges.length; index += 1) {
            expect(rightEdges[index]).toBeCloseTo(leftEdges[index], 8)
          }
          for (const point of [...left, ...right]) {
            expect(point.x).toBeGreaterThanOrEqual(20)
            expect(point.x).toBeLessThanOrEqual(270)
            expect(point.y).toBeGreaterThanOrEqual(40)
            expect(point.y).toBeLessThanOrEqual(140)
          }
        }
      }
    }
  })

  it('renders rectangle application contexts as actual rectangles', () => {
    const html = renderToStaticMarkup(createElement(GeometryProblemVisual, {
      visual: {
        type: 'congruence',
        mode: 'pair',
        variant: 1,
        shape: 'rectangle',
        a: 8,
        b: 5,
        unit: 'cm',
      },
    }))

    expect(html).toContain('합동인 두 직사각형')
    expect(html).toContain('8cm')
    expect(html).toContain('5cm')
  })

  it('derives the cuboid projection from all three dimensions and masks inverse dimensions', () => {
    const visual = {
      type: 'cuboid' as const,
      width: 8,
      height: 4,
      depth: 3,
    }
    const distance = (left: { x: number; y: number }, right: { x: number; y: number }) => (
      Math.hypot(left.x - right.x, left.y - right.y)
    )
    const layout = buildCuboidLayout(visual)
    const frontWidth = distance(layout.front[0], layout.front[1])
    const frontHeight = distance(layout.front[0], layout.front[3])
    const projectedDepth = distance(layout.front[0], layout.back[0])

    expect(frontWidth / frontHeight).toBeCloseTo(2, 8)
    expect(projectedDepth / frontWidth).toBeCloseTo(
      (3 / 8) * Math.hypot(0.65, 0.45),
      8
    )

    const inverse = { ...visual, unknownMeasurement: 'width' as const }
    const hidden = buildCuboidLayout(inverse, false)
    const revealed = buildCuboidLayout(inverse, true)
    const hiddenRatio = distance(hidden.front[0], hidden.front[1]) /
      distance(hidden.front[0], hidden.front[3])
    const revealedRatio = distance(revealed.front[0], revealed.front[1]) /
      distance(revealed.front[0], revealed.front[3])

    expect(hiddenRatio).not.toBeCloseTo(revealedRatio, 8)
    expect(revealedRatio).toBeCloseTo(2, 8)
  })

  it('keeps every generated cuboid dimension combination quantitative and in bounds', () => {
    const distance = (left: { x: number; y: number }, right: { x: number; y: number }) => (
      Math.hypot(left.x - right.x, left.y - right.y)
    )

    for (let width = 5; width <= 14; width += 1) {
      for (let height = 3; height <= 12; height += 1) {
        for (let depth = 2; depth <= 11; depth += 1) {
          const layout = buildCuboidLayout({
            type: 'cuboid',
            width,
            height,
            depth,
          })
          const frontWidth = distance(layout.front[0], layout.front[1])
          const frontHeight = distance(layout.front[0], layout.front[3])
          const projectedDepth = distance(layout.front[0], layout.back[0])

          expect(frontWidth / frontHeight).toBeCloseTo(width / height, 8)
          expect(projectedDepth / frontWidth).toBeCloseTo(
            (depth / width) * Math.hypot(0.65, 0.45),
            8
          )
          for (const point of [...layout.front, ...layout.back]) {
            expect(point.x).toBeGreaterThanOrEqual(45)
            expect(point.x).toBeLessThanOrEqual(265)
            expect(point.y).toBeGreaterThanOrEqual(25)
            expect(point.y).toBeLessThanOrEqual(145)
          }
        }
      }
    }

    const hiddenNarrow = buildCuboidLayout({
      type: 'cuboid',
      width: 5,
      height: 6,
      depth: 4,
      unknownMeasurement: 'width',
    }, false)
    const hiddenWide = buildCuboidLayout({
      type: 'cuboid',
      width: 14,
      height: 6,
      depth: 4,
      unknownMeasurement: 'width',
    }, false)
    expect(hiddenNarrow).toEqual(hiddenWide)
  })

  it('keeps four distinct net options with exactly one foldable cube net', () => {
    for (let variant = 1; variant <= 4; variant += 1) {
      const { answerIndex, layouts } = buildCuboidNetOptions(variant)

      expect(layouts).toHaveLength(4)
      expect(new Set(layouts.map(layout => JSON.stringify(layout))).size).toBe(4)
      expect(layouts.map(isValidCubeNet).filter(Boolean)).toHaveLength(1)
      expect(isValidCubeNet(layouts[answerIndex])).toBe(true)
    }
  })

  it('shows a given square-face side length without exposing a derived net answer', () => {
    const html = renderToStaticMarkup(createElement(GeometryProblemVisual, {
      visual: {
        type: 'cuboid-net',
        mode: 'single',
        variant: 1,
        side: 5,
      },
    }))

    expect(html).toContain('5cm')
    expect(html).not.toContain('50cm')
  })

  it('derives prism and pyramid topology from one base polygon', () => {
    for (let baseSides = 3; baseSides <= 8; baseSides += 1) {
      const prism = buildPolySolidLayout('prism', baseSides)
      const pyramid = buildPolySolidLayout('pyramid', baseSides)

      expect(prism.basePolygons).toHaveLength(2)
      expect(prism.lateralEdges).toHaveLength(baseSides)
      expect(prism.vertices).toHaveLength(baseSides * 2)
      expect(pyramid.basePolygons).toHaveLength(1)
      expect(pyramid.lateralEdges).toHaveLength(baseSides)
      expect(pyramid.vertices).toHaveLength(baseSides + 1)

      for (const point of [
        ...prism.basePolygons.flat(),
        ...pyramid.basePolygons.flat(),
        ...prism.vertices,
        ...pyramid.vertices,
      ]) {
        expect(point.x).toBeGreaterThanOrEqual(25)
        expect(point.x).toBeLessThanOrEqual(275)
        expect(point.y).toBeGreaterThanOrEqual(20)
        expect(point.y).toBeLessThanOrEqual(170)
      }
    }
  })

  it('renders countable polyhedra without spelling out a derived answer', () => {
    const prism = renderToStaticMarkup(createElement(GeometryProblemVisual, {
      visual: {
        type: 'poly-solid',
        semantics: 'quantitative',
        kind: 'prism',
        baseSides: 5,
      },
    }))
    const pyramid = renderToStaticMarkup(createElement(GeometryProblemVisual, {
      visual: {
        type: 'poly-solid',
        semantics: 'quantitative',
        kind: 'pyramid',
        baseSides: 6,
      },
    }))

    expect(prism.match(/data-solid-base=/g)).toHaveLength(2)
    expect(prism.match(/data-solid-lateral-edge=/g)).toHaveLength(5)
    expect(prism.match(/data-solid-vertex=/g)).toHaveLength(10)
    expect(prism).toContain('오각기둥 모형')
    expect(prism).not.toContain('15개')
    expect(pyramid.match(/data-solid-base=/g)).toHaveLength(1)
    expect(pyramid.match(/data-solid-lateral-edge=/g)).toHaveLength(6)
    expect(pyramid.match(/data-solid-vertex=/g)).toHaveLength(7)
    expect(pyramid).toContain('육각뿔 모형')
    expect(pyramid).not.toContain('12개')
  })

  it('derives complete, missing, and extra prism nets from the requested pieces', () => {
    for (let baseSides = 3; baseSides <= 8; baseSides += 1) {
      const complete = buildPrismNetLayout(baseSides, baseSides, 2)
      const missingLateral = buildPrismNetLayout(baseSides, baseSides - 1, 2)
      const extraLateral = buildPrismNetLayout(baseSides, baseSides + 1, 2)
      const missingBase = buildPrismNetLayout(baseSides, baseSides, 1)

      expect(complete.lateralFaces).toHaveLength(baseSides)
      expect(complete.basePolygons).toHaveLength(2)
      expect(missingLateral.lateralFaces).toHaveLength(baseSides - 1)
      expect(extraLateral.lateralFaces).toHaveLength(baseSides + 1)
      expect(missingBase.basePolygons).toHaveLength(1)
      for (const point of [
        ...complete.basePolygons.flat(),
        ...complete.lateralFaces.flatMap((face) => [
          { x: face.x, y: face.y },
          { x: face.x + face.width, y: face.y + face.height },
        ]),
      ]) {
        expect(point.x).toBeGreaterThanOrEqual(8)
        expect(point.x).toBeLessThanOrEqual(312)
        expect(point.y).toBeGreaterThanOrEqual(8)
        expect(point.y).toBeLessThanOrEqual(202)
      }
    }

    const html = renderToStaticMarkup(createElement(GeometryProblemVisual, {
      visual: {
        type: 'prism-net',
        semantics: 'quantitative',
        baseSides: 6,
        lateralFaces: 5,
        baseCount: 2,
      },
    }))
    expect(html.match(/data-net-lateral-face=/g)).toHaveLength(5)
    expect(html.match(/data-net-base=/g)).toHaveLength(2)
    expect(html).toContain('육각기둥 전개도')
    expect(html).not.toContain('1개 부족')
  })

  it('derives round-solid structure for every displayed copy', () => {
    expect(buildRoundSolidLayout('cylinder', 1).copies[0].width).toBeGreaterThanOrEqual(140)

    for (let copies = 1; copies <= 6; copies += 1) {
      for (const kind of ['cylinder', 'cone', 'sphere'] as const) {
        const layout = buildRoundSolidLayout(kind, copies)
        expect(layout.copies).toHaveLength(copies)
        for (const copy of layout.copies) {
          expect(copy.x).toBeGreaterThanOrEqual(8)
          expect(copy.x + copy.width).toBeLessThanOrEqual(312)
          expect(copy.y).toBeGreaterThanOrEqual(8)
          expect(copy.y + copy.height).toBeLessThanOrEqual(192)
        }
      }
    }

    const cylinder = renderToStaticMarkup(createElement(GeometryProblemVisual, {
      visual: {
        type: 'round-solid',
        semantics: 'quantitative',
        kind: 'cylinder',
        copies: 3,
      },
    }))
    const cone = renderToStaticMarkup(createElement(GeometryProblemVisual, {
      visual: {
        type: 'round-solid',
        semantics: 'quantitative',
        kind: 'cone',
        copies: 2,
      },
    }))
    const sphere = renderToStaticMarkup(createElement(GeometryProblemVisual, {
      visual: {
        type: 'round-solid',
        semantics: 'quantitative',
        kind: 'sphere',
        copies: 4,
      },
    }))

    expect(cylinder.match(/data-round-copy=/g)).toHaveLength(3)
    expect(cylinder.match(/data-round-base=/g)).toHaveLength(6)
    expect(cylinder.match(/data-round-curved-surface=/g)).toHaveLength(3)
    expect(cylinder.match(/data-round-vertex=/g) ?? []).toHaveLength(0)
    expect(cone.match(/data-round-base=/g)).toHaveLength(2)
    expect(cone.match(/data-round-curved-surface=/g)).toHaveLength(2)
    expect(cone.match(/data-round-vertex=/g)).toHaveLength(2)
    expect(sphere.match(/data-round-base=/g) ?? []).toHaveLength(0)
    expect(sphere.match(/data-round-curved-surface=/g)).toHaveLength(4)
    expect(sphere.match(/data-round-vertex=/g) ?? []).toHaveLength(0)
    expect(cylinder).toContain('원기둥 3개 모형')
    expect(cylinder).not.toContain('면은 9개')
  })

  it('derives complete, missing, and extra cylinder nets from actual pieces', () => {
    for (let copies = 1; copies <= 6; copies += 1) {
      const layout = buildCylinderNetLayout(copies, 2, 1)
      expect(layout.copies).toHaveLength(copies)
      expect(layout.circles).toHaveLength(copies * 2)
      expect(layout.rectangles).toHaveLength(copies)
      for (const rectangle of layout.rectangles) {
        expect(rectangle.x).toBeGreaterThanOrEqual(8)
        expect(rectangle.x + rectangle.width).toBeLessThanOrEqual(312)
        expect(rectangle.y).toBeGreaterThanOrEqual(8)
        expect(rectangle.y + rectangle.height).toBeLessThanOrEqual(192)
      }
      for (const circle of layout.circles) {
        expect(circle.cx - circle.r).toBeGreaterThanOrEqual(8)
        expect(circle.cx + circle.r).toBeLessThanOrEqual(312)
        expect(circle.cy - circle.r).toBeGreaterThanOrEqual(8)
        expect(circle.cy + circle.r).toBeLessThanOrEqual(192)
      }
    }

    const missing = renderToStaticMarkup(createElement(GeometryProblemVisual, {
      visual: {
        type: 'cylinder-net',
        semantics: 'quantitative',
        copies: 1,
        circleCount: 1,
        rectangleCount: 1,
      },
    }))
    const extra = renderToStaticMarkup(createElement(GeometryProblemVisual, {
      visual: {
        type: 'cylinder-net',
        semantics: 'quantitative',
        copies: 1,
        circleCount: 3,
        rectangleCount: 1,
      },
    }))

    expect(missing.match(/data-cylinder-net-circle=/g)).toHaveLength(1)
    expect(missing.match(/data-cylinder-net-rectangle=/g)).toHaveLength(1)
    expect(extra.match(/data-cylinder-net-circle=/g)).toHaveLength(3)
    expect(extra).toContain('원기둥 전개도')
    expect(extra).not.toContain('1개 남음')
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
