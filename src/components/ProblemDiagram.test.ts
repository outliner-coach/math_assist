import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { ProblemVisual } from '@/lib/types'
import ProblemDiagram from './ProblemDiagram'

describe('ProblemDiagram', () => {
  it('renders all Grade 5 geometry models without an answer field', () => {
    const visuals: ProblemVisual[] = [
      { type: 'basic_shape', props: { shape: 'triangle', width: 12, height: 7 } },
      { type: 'l_shape', props: { width: 21, height: 15, notchWidth: 8, notchHeight: 6 } },
      { type: 'overlap_rectangles', props: { totalWidth: 30, overlapWidth: 4, overlapArea: 60 } },
      { type: 'rectangle_square', props: { totalWidth: 18, rectangleHeight: 11, totalArea: 212 } },
      { type: 'three_shape_overlap', props: { shapeArea: 28, exclusiveAreas: [20, 21, 22], tripleOverlap: 3 } }
    ]

    for (const visual of visuals) {
      const html = renderToStaticMarkup(createElement(ProblemDiagram, { visual }))
      expect(html).toContain(`problem-diagram-${visual.type === 'basic_shape' ? 'triangle' : visual.type.replaceAll('_', '-')}`)
      expect(html).not.toContain('data-answer')
    }
  })

  it('shows only the given measurements for the reverse rectangle-square problem', () => {
    const html = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'rectangle_square',
        props: { totalWidth: 18, rectangleHeight: 11, totalArea: 212 }
      }
    }))

    expect(html).toContain('18 cm')
    expect(html).toContain('11 cm')
    expect(html).toContain('212 cm²')
    expect(html).toContain('?')
  })
})
