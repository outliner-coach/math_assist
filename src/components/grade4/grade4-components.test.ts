import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { getGrade4MissionBank } from '@/lib/grade4-problems'

import Grade4MissionCard from './Grade4MissionCard'
import Grade4MissionVisual from './Grade4MissionVisual'

const noop = vi.fn()

describe('Grade4MissionVisual', () => {
  it('renders every release representation', () => {
    const byModel = new Map(getGrade4MissionBank(42).map((mission) => [mission.visualModel, mission]))
    for (const [model, mission] of byModel) {
      expect(renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))).toContain(`grade4-visual-${model}`)
    }
  })

  it('does not create the number-line answer before reveal', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-big-06')!
    const hidden = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const shown = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission, showAnswer: true }))
    expect(hidden).toContain('grade4-number-line-end')
    expect(hidden).not.toContain(Number(mission.correctAnswer).toLocaleString('ko-KR'))
    expect(shown).toContain(Number(mission.correctAnswer).toLocaleString('ko-KR'))
  })

  it('does not compose the place-value answer in the DOM before reveal', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-big-02')!
    const hidden = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const shown = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission, showAnswer: true }))

    expect(hidden).not.toContain(mission.correctAnswer)
    expect(hidden).not.toContain('grade4-composite-result')
    expect(shown).toContain(`data-composite="${mission.correctAnswer}"`)
  })

  it('renders the constraint comparison instead of fallback zeroes', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-big-09')!
    const html = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))

    expect(html).toContain('4□5,000')
    expect(html).toContain(Number(mission.visualConfig.right).toLocaleString('ko-KR'))
    expect(html).not.toContain('000000')
  })

  it('keeps division results out of the DOM until the answer is solved', () => {
    const direct = getGrade4MissionBank(42).find((item) => item.id === 'g4-div-01')!
    const hidden = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission: direct }))
    const shown = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission: direct, showAnswer: true }))

    expect(hidden).toContain('grade4-visual-division-model')
    expect(hidden).not.toContain('data-quotient=')
    expect(hidden).not.toContain('data-remainder=')
    expect(shown).toContain(`data-quotient="${direct.correctAnswer}"`)

    const inverse = getGrade4MissionBank(42).find((item) => item.id === 'g4-div-08')!
    const inverseHidden = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission: inverse }))
    const inverseShown = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission: inverse, showAnswer: true }))
    expect(inverseHidden).not.toContain(`data-dividend="${inverse.correctAnswer}"`)
    expect(inverseShown).toContain(`data-dividend="${inverse.correctAnswer}"`)
  })

  it('keeps a composed decimal out of the DOM until reveal', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-dec-03')!
    const hidden = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const shown = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission, showAnswer: true }))

    expect(hidden).toContain('십분의 일')
    expect(hidden).toContain('천분의 일')
    expect(hidden).not.toContain(mission.correctAnswer)
    expect(hidden).not.toContain('grade4-decimal-composite-result')
    expect(shown).toContain(`data-composite="${mission.correctAnswer}"`)
  })

  it('renders fraction operands from their model and withholds the result until reveal', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-frac-05')!
    const hidden = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const shown = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission, showAnswer: true }))

    expect(hidden).toContain('grade4-visual-fraction-strip')
    expect(hidden).toContain(`data-denominator="${mission.visualConfig.denominator}"`)
    expect(hidden).not.toContain('grade4-fraction-result')
    expect(hidden).not.toContain(`data-result="${mission.correctAnswer}"`)
    expect(hidden).not.toContain(mission.correctAnswer)
    expect(shown).toContain(`data-result="${mission.correctAnswer}"`)

    const missing = getGrade4MissionBank(20260721).find((item) => item.id === 'g4-frac-07')!
    const missingHidden = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission: missing }))
    expect(missingHidden).not.toContain(missing.correctAnswer)
  })

  it('aligns decimal operands by place and withholds the calculated result until reveal', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-dop-02')!
    const hidden = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const shown = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission, showAnswer: true }))

    expect(hidden).toContain('grade4-visual-decimal-operation')
    expect(hidden).toContain('소수점')
    expect(hidden).not.toContain('grade4-decimal-operation-result')
    expect(hidden).not.toContain(mission.correctAnswer)
    expect(shown).toContain(`data-result="${mission.correctAnswer}"`)
  })

  it('shows the given pattern rows without creating the requested value before reveal', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-pat-05')!
    const hidden = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const shown = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission, showAnswer: true }))

    expect(hidden).toContain('grade4-visual-pattern-table')
    expect(hidden).toContain('단계')
    expect(hidden).not.toContain('grade4-pattern-result')
    expect(hidden).not.toContain(`>${mission.correctAnswer}<`)
    expect(shown).toContain(`data-result="${mission.correctAnswer}"`)
  })

  it('shows equal sides without creating the missing quantity before reveal', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-eq-05')!
    const hidden = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const shown = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission, showAnswer: true }))

    expect(hidden).toContain('grade4-visual-equation-balance')
    expect(hidden).toContain('두 양이 같아요')
    expect(hidden).not.toContain('grade4-equality-result')
    expect(hidden).not.toContain(`>${mission.correctAnswer}<`)
    expect(shown).toContain(`data-result="${mission.correctAnswer}"`)
  })

  it('draws line directions and right-angle marks from the mission geometry', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-line-05')!
    const html = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))

    expect(html).toContain('grade4-visual-line-relationship')
    expect(html).toContain('data-angle-a=')
    expect(html).toContain('data-angle-b=')
    expect(html).toContain('grade4-right-angle-mark')
  })

  it('reveals a transformed point only after solving from the movement model', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-move-05')!
    const hidden = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const shown = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission, showAnswer: true }))

    expect(hidden).toContain('grade4-visual-shape-transformation')
    expect(hidden).toContain('grade4-movement-arrow')
    expect(hidden).not.toContain('grade4-transformation-result')
    expect(shown).toContain('grade4-transformation-result')
  })

  it('draws a right triangle and its right-angle mark from the side model', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-tri-03')!
    const html = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))

    expect(html).toContain('grade4-visual-triangle-model')
    expect(html).toContain('data-side-a=')
    expect(html).toContain('grade4-triangle-right-angle')
  })

  it('draws quadrilateral property marks from the shared shape model', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-quad-02')!
    const html = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))

    expect(html).toContain('grade4-visual-quadrilateral-model')
    expect(html).toContain('data-shape-type="square"')
    expect(html).toContain('grade4-quadrilateral-right-angle')
    expect(html).toContain('grade4-quadrilateral-equal-side')
    expect(html).toContain('grade4-quadrilateral-parallel-mark')
  })

  it('does not reveal three inferred right-angle marks when only one is given', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-quad-08')!
    const html = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))

    expect(html.match(/data-testid="grade4-quadrilateral-right-angle"/g)).toHaveLength(1)
  })

  it('draws every diagonal from one vertex from the polygon side count', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-poly-04')!
    const html = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const expected = Number(mission.visualConfig.sideCount) - 3

    expect(html).toContain('grade4-visual-polygon-model')
    expect(html.match(/data-testid="grade4-polygon-diagonal"/g)).toHaveLength(expected)
  })

  it('draws tile cells from rows and columns and preserves an intentional gap', () => {
    const squareMission = getGrade4MissionBank(42).find((item) => item.id === 'g4-poly-07')!
    const gapMission = getGrade4MissionBank(42).find((item) => item.id === 'g4-poly-10')!
    const squareHtml = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission: squareMission }))
    const gapHtml = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission: gapMission }))
    const expected = Number(squareMission.visualConfig.rows) * Number(squareMission.visualConfig.columns)

    expect(squareHtml.match(/data-testid="grade4-tiling-cell"/g)).toHaveLength(expected)
    expect(squareHtml).not.toContain('data-result=')
    expect(gapHtml.match(/data-testid="grade4-tiling-cell"/g)).toHaveLength(3)
    expect(gapHtml).toContain('data-testid="grade4-tiling-gap"')
  })

  it('joins adjacent triangle tiles along one complete shared edge', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-poly-08')!
    const html = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const pointSets = Array.from(html.matchAll(/data-testid="grade4-tiling-cell" points="([^"]+)"/g))
      .map((match) => match[1].split(' '))

    expect(pointSets.length).toBeGreaterThanOrEqual(2)
    expect(pointSets[0].filter((point) => pointSets[1].includes(point))).toHaveLength(2)
  })

  it('places the angle ray on the matching protractor tick without a degree answer label', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-ang-01')!
    const html = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const ray = html.match(/data-testid="grade4-angle-ray" x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"/)

    expect(html).toContain('grade4-visual-angle-model')
    expect(ray).not.toBeNull()
    const renderedAngle = Math.round(Math.atan2(Number(ray![2]) - Number(ray![4]), Number(ray![3]) - Number(ray![1])) * 180 / Math.PI)
    expect(renderedAngle).toBe(Number(mission.visualConfig.angle))
    expect(html).not.toContain(`${mission.correctAnswer}</text>`)
  })

  it('hides the unknown angle label while deriving triangle and parallelogram vertices', () => {
    const triangle = getGrade4MissionBank(42).find((item) => item.id === 'g4-ang-05')!
    const quadrilateral = getGrade4MissionBank(42).find((item) => item.id === 'g4-ang-06')!
    const triangleHtml = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission: triangle }))
    const quadrilateralHtml = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission: quadrilateral }))

    expect(triangleHtml).toContain('data-shape-type="triangle"')
    expect(triangleHtml).toMatch(/data-testid="grade4-angle-unknown"[^>]*>□<\/text>/)
    expect(quadrilateralHtml).toContain('data-shape-type="parallelogram"')
    expect(quadrilateralHtml).toMatch(/data-testid="grade4-angle-unknown"[^>]*>□<\/text>/)
  })

  it('plots every line-graph value at a derived point with matching labels and scale', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-graph-02')!
    const html = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission }))
    const labels = String(mission.visualConfig.labelsCsv).split(',')
    const values = String(mission.visualConfig.valuesCsv).split(',').map(Number)
    const points = Array.from(html.matchAll(/data-testid="grade4-line-point"[^>]*data-value="([^"]+)"[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"/g))

    expect(html).toContain('grade4-visual-line-graph-model')
    expect(html.match(/data-testid="grade4-line-label"/g)).toHaveLength(labels.length)
    expect(html.match(/data-testid="grade4-line-segment"/g)).toHaveLength(values.length - 1)
    expect(html.match(/data-testid="grade4-line-minor-grid"/g)?.length).toBeGreaterThan(0)
    expect(points.map((point) => Number(point[1]))).toEqual(values)
    expect(points.map((point) => Number(point[2]))).toEqual([...points.map((point) => Number(point[2]))].sort((a, b) => a - b))
    for (let index = 1; index < points.length; index += 1) {
      if (values[index] > values[index - 1]) expect(Number(points[index][3])).toBeLessThan(Number(points[index - 1][3]))
      if (values[index] < values[index - 1]) expect(Number(points[index][3])).toBeGreaterThan(Number(points[index - 1][3]))
    }
  })

  it('renders source tables and hides only the requested graph-derived cell', () => {
    const source = getGrade4MissionBank(42).find((item) => item.id === 'g4-graph-05')!
    const missing = getGrade4MissionBank(42).find((item) => item.id === 'g4-graph-08')!
    const sourceHtml = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission: source }))
    const missingHtml = renderToStaticMarkup(createElement(Grade4MissionVisual, { mission: missing }))
    const hiddenIndex = Number(missing.visualConfig.hiddenIndex)

    expect(sourceHtml).toContain('grade4-visual-data-table-model')
    expect(sourceHtml.match(/data-testid="grade4-data-table-value-/g)).toHaveLength(String(source.visualConfig.valuesCsv).split(',').length)
    expect(missingHtml).toContain('grade4-line-source-table')
    expect(missingHtml).toMatch(new RegExp(`data-testid="grade4-data-table-value-${hiddenIndex}"[^>]*>□<`))
  })
})

describe('Grade4MissionCard', () => {
  it('keeps format errors separate from wrong-answer feedback', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.answerType === 'integer')!
    const html = renderToStaticMarkup(createElement(Grade4MissionCard, {
      mission, selectedAnswer: null, textAnswer: '-', inputError: '답을 빠짐없는 숫자로 써요.', wrongAttemptCount: 0,
      showHint: false, solved: false, onChoiceAnswer: noop, onTextAnswerChange: noop, onSubmitText: noop, onShowHint: noop,
    }))
    expect(html).toContain('grade4-input-error')
    expect(html).not.toContain('grade4-wrong-feedback')
    expect(html).not.toContain('grade4-solution')
  })

  it('uses a decimal keypad hint for decimal missions', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-dec-01')!
    const html = renderToStaticMarkup(createElement(Grade4MissionCard, {
      mission, selectedAnswer: null, textAnswer: '0.', inputError: '답을 빠짐없는 소수로 써요.', wrongAttemptCount: 0,
      showHint: false, solved: false, onChoiceAnswer: noop, onTextAnswerChange: noop, onSubmitText: noop, onShowHint: noop,
    }))

    expect(html).toContain('답을 소수로 써요')
    expect(html).toContain('inputMode="decimal"')
    expect(html).toContain('답을 빠짐없는 소수로 써요.')
    expect(html).not.toContain('grade4-wrong-feedback')
  })

  it('uses a fraction text input without turning incomplete syntax into feedback', () => {
    const mission = getGrade4MissionBank(42).find((item) => item.id === 'g4-frac-01')!
    const html = renderToStaticMarkup(createElement(Grade4MissionCard, {
      mission, selectedAnswer: null, textAnswer: '1/', inputError: '분자/분모를 빠짐없이 써요.', wrongAttemptCount: 0,
      showHint: false, solved: false, onChoiceAnswer: noop, onTextAnswerChange: noop, onSubmitText: noop, onShowHint: noop,
    }))

    expect(html).toContain('답을 분수로 써요')
    expect(html).toContain('inputMode="text"')
    expect(html).not.toContain('grade4-wrong-feedback')
  })
})
