import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { ProblemVisual } from '@/lib/types'
import ProblemDiagram, { buildRatioGraphModel } from './ProblemDiagram'

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

  it('derives band widths and circle sectors from one 100-percent model', () => {
    const props = {
      caption: '좋아하는 계절',
      kind: 'band' as const,
      segments: [
        { label: '봄', percent: 20 },
        { label: '여름', percent: 30 },
        { label: '가을·겨울', percent: 50 },
      ],
      maskedValueIndex: 1,
    }
    const model = buildRatioGraphModel(props)

    expect(model.segments.map((segment) => [segment.startPercent, segment.endPercent]))
      .toEqual([[0, 20], [20, 50], [50, 100]])

    const band = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'ratio_graph',
        semantics: 'quantitative',
        props,
      } as ProblemVisual,
    }))
    const circle = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'ratio_graph',
        semantics: 'quantitative',
        props: { ...props, kind: 'circle' },
      } as ProblemVisual,
    }))

    expect(band).toContain('problem-diagram-ratio-graph')
    expect(band.match(/data-ratio-band-segment=/g)).toHaveLength(3)
    expect(band).toContain('20%')
    expect(band).toContain('?')
    expect(band).not.toContain('30%')
    expect(circle.match(/data-ratio-circle-segment=/g)).toHaveLength(3)
    expect(circle.match(/<path/g)).toHaveLength(3)
    expect(circle).not.toContain('data-answer')
    expect(circle).not.toContain('정답:')
  })

  it('renders inclusive and exclusive number-range endpoints without a derived answer label', () => {
    const html = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'number_range',
        semantics: 'quantitative',
        props: {
          caption: '12 이상 18 미만',
          start: 10,
          end: 20,
          lower: 12,
          lowerInclusive: true,
          upper: 18,
          upperInclusive: false,
        },
      } as ProblemVisual,
    }))

    expect(html).toContain('problem-diagram-number-range')
    expect(html).toContain('data-range-lower-inclusive="true"')
    expect(html).toContain('data-range-upper-inclusive="false"')
    expect(html).toContain('12 이상 18 미만')
    expect(html).not.toContain('6개')
  })

  it('derives equal-length fraction bars from only the two given fractions', () => {
    const html = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'fraction_comparison',
        semantics: 'quantitative',
        props: {
          caption: '2/3와 3/5 비교',
          left: { label: '가', numerator: 2, denominator: 3 },
          right: { label: '나', numerator: 3, denominator: 5 },
        },
      } as ProblemVisual,
    }))

    expect(html).toContain('problem-diagram-fraction-comparison')
    expect(html.match(/data-fraction-part="left"/g)).toHaveLength(3)
    expect(html.match(/data-fraction-part="right"/g)).toHaveLength(5)
    expect(html.match(/data-fraction-filled="true"/g)).toHaveLength(5)
    expect(html).toContain('2/3')
    expect(html).toContain('3/5')
    expect(html).not.toContain('data-answer')
    expect(html).not.toContain('더 큰 쪽')
  })

  it('shows both length directions without exposing the squared conversion result', () => {
    const html = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'area_unit_square',
        semantics: 'quantitative',
        props: {
          caption: '1m²의 두 방향 변환',
          largerLengthUnit: 'm',
          smallerLengthUnit: 'cm',
        },
      } as ProblemVisual,
    }))

    expect(html).toContain('problem-diagram-area-unit-square')
    expect(html).toContain('data-area-side-scale="100"')
    expect(html.match(/1m = 100cm/g)).toHaveLength(3)
    expect(html).toContain('100cm × 100cm')
    expect(html).not.toContain('10000')
    expect(html).not.toContain('data-answer')
  })

  it('renders exact observed trial counts without a derived prediction', () => {
    const html = renderToStaticMarkup(createElement(ProblemDiagram, {
      visual: {
        type: 'possibility_trials',
        semantics: 'quantitative',
        props: {
          caption: '두 사건의 관찰 기록',
          rows: [
            { label: '가', favorable: 3, total: 10 },
            { label: '나', favorable: 7, total: 10 },
          ],
        },
      } as ProblemVisual,
    }))

    expect(html).toContain('problem-diagram-possibility-trials')
    expect(html.match(/data-trial-outcome=/g)).toHaveLength(20)
    expect(html.match(/data-trial-outcome="favorable"/g)).toHaveLength(10)
    expect(html).toContain('전체 10번 · 사건 3번')
    expect(html).toContain('전체 10번 · 사건 7번')
    expect(html).not.toContain('예상')
    expect(html).not.toContain('data-answer')
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
