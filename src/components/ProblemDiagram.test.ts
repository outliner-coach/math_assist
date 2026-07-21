import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { ProblemVisual } from '@/lib/types'
import ProblemDiagram from './ProblemDiagram'

describe('ProblemDiagram', () => {
  it('renders all Grade 5 geometry models without an answer field', () => {
    const visuals: ProblemVisual[] = [
      { type: 'basic_shape', props: { shape: 'triangle', width: 12, height: 7, unit: 'cm' } },
      { type: 'l_shape', props: { width: 21, height: 15, notchWidth: 8, notchHeight: 6, unit: 'cm' } },
      { type: 'overlap_rectangles', props: { totalWidth: 30, overlapWidth: 4, overlapArea: 60, unit: 'cm' } },
      { type: 'rectangle_square', props: { totalWidth: 18, rectangleHeight: 8, squareSide: 10, unit: 'cm' } },
      { type: 'three_shape_overlap', semantics: 'quantitative', props: { shapeArea: 28, exclusiveAreas: [20, 21, 22], tripleOverlap: 3, unit: 'cm' } },
      {
        type: 'ratio_table',
        semantics: 'quantitative',
        props: {
          caption: '두 모둠 성공 기록',
          columns: ['모둠', '해낸 수', '전체 수'],
          rows: [
            { label: '가', values: [3, 6] },
            { label: '나', values: [4, 8] },
          ],
        },
      },
    ]

    for (const visual of visuals) {
      const html = renderToStaticMarkup(createElement(ProblemDiagram, { visual }))
      expect(html).toContain(`problem-diagram-${visual.type === 'basic_shape' ? 'triangle' : visual.type.replaceAll('_', '-')}`)
      expect(html).not.toContain('data-answer')
    }
  })

  it('renders an accessible ratio table from only the quantities given in the problem', () => {
    const html = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'ratio_table',
        semantics: 'quantitative',
        props: {
          caption: '자유투 성공 기록',
          columns: ['모둠', '해낸 수', '전체 수'],
          rows: [
            { label: '가', values: [4, 8] },
            { label: '나', values: [6, 10] },
          ],
        },
      },
    }))

    expect(html).toContain('problem-diagram-ratio-table')
    expect(html).toContain('<table')
    expect(html).toContain('<caption')
    expect(html).toContain('자유투 성공 기록')
    expect(html).not.toContain('data-answer')
    expect(html).not.toContain('정답')
  })

  it('labels the given square side without an ambiguous question mark', () => {
    const html = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'rectangle_square',
        props: { totalArea: 156, rectangleHeight: 8, squareSide: 10, unit: 'cm' }
      }
    }))

    expect(html).toContain('8 cm')
    expect(html).toContain('한 변 10 cm')
    expect(html).toContain('156 cm²')
    expect(html).not.toContain('&gt;?&lt;')
  })

  it('uses the unit supplied by the problem template', () => {
    const html = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'l_shape',
        props: { width: 24, height: 16, notchWidth: 8, notchHeight: 6, unit: 'm' }
      }
    }))

    expect(html).toContain('24 m')
    expect(html).toContain('16 m')
    expect(html).not.toContain('cm')
  })

  it('places narrow overlap area text outside the highlighted region', () => {
    const html = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'overlap_rectangles',
        props: { totalWidth: 33, overlapWidth: 5, overlapArea: 55, unit: 'cm' }
      }
    }))

    expect(html).toContain('겹친 넓이 55 cm²')
    expect(html).toContain('<line')
  })

  it('renders exact unit-cell ratios and omits a zero pairwise-only region', () => {
    const html = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'three_shape_overlap',
        semantics: 'quantitative',
        props: {
          shapeArea: 29,
          exclusiveAreas: [18, 20, 22],
          tripleOverlap: 5,
          unit: 'cm'
        }
      }
    }))

    expect((html.match(/data-cell-region="aOnly"/g) ?? [])).toHaveLength(18)
    expect((html.match(/data-cell-region="abOnly"/g) ?? [])).toHaveLength(4)
    expect((html.match(/data-cell-region="acOnly"/g) ?? [])).toHaveLength(2)
    expect((html.match(/data-cell-region="abc"/g) ?? [])).toHaveLength(5)
    expect(html).not.toContain('data-cell-region="bcOnly"')
    expect(html).toContain('한 칸 = 1 cm²')
    expect(html).not.toContain('AB만 4')
    expect(html).not.toContain('AC만 2')
  })
})
