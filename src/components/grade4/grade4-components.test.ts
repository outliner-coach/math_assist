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
