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
})
