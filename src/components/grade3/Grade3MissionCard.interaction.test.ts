// @vitest-environment jsdom

import React, { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { checkGrade3Answer } from '@/lib/grade3-answer-normalizers'
import { getGrade3MissionById } from '@/lib/grade3-problems'

import Grade3MissionCard from './Grade3MissionCard'

const mission = getGrade3MissionById('g3-2-circle-03', 42)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function Harness({ onSubmit }: { onSubmit: (answer: string) => void }) {
  const [textAnswer, setTextAnswer] = useState('')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [wrongAttemptCount, setWrongAttemptCount] = useState(0)
  const [solved, setSolved] = useState(false)

  const submit = () => {
    onSubmit(textAnswer)
    const result = checkGrade3Answer(mission.answerType, textAnswer, mission.correctAnswer)
    setSelectedAnswer(textAnswer)
    setSolved(result.ok && result.correct)
    if (result.ok && !result.correct) setWrongAttemptCount((count) => count + 1)
  }

  return React.createElement(Grade3MissionCard, {
    mission,
    selectedAnswer,
    textAnswer,
    fractionAnswer: { numerator: '', denominator: '' },
    lengthAnswer: { kilometers: '', meters: '', centimeters: '', millimeters: '' },
    timeAnswer: { hours: '', minutes: '', seconds: '' },
    capacityAnswer: { liters: '', milliliters: '' },
    weightAnswer: { kilograms: '', grams: '' },
    scaffoldSelection: null,
    showHint: wrongAttemptCount > 0,
    wrongAttemptCount,
    inputError: null,
    solved,
    missionCount: 3,
    onScaffoldSelect: vi.fn(),
    onChoiceAnswer: vi.fn(),
    onTextAnswerChange: setTextAnswer,
    onFractionAnswerChange: vi.fn(),
    onLengthAnswerChange: vi.fn(),
    onTimeAnswerChange: vi.fn(),
    onCapacityAnswerChange: vi.fn(),
    onWeightAnswerChange: vi.fn(),
    onSubmitText: submit,
    onSubmitFraction: vi.fn(),
    onSubmitLength: vi.fn(),
    onSubmitTime: vi.fn(),
    onSubmitCapacity: vi.fn(),
    onSubmitWeight: vi.fn(),
    onShowHint: vi.fn(),
  })
}

function click(element: Element) {
  act(() => {
    ;(element as HTMLElement).click()
  })
}

function fill(input: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function pressEnter(input: HTMLInputElement) {
  act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
}

describe('Grade3MissionCard compass construction', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('requires a drawn circle whose compass width matches the written response', () => {
    const onSubmit = vi.fn()
    act(() => root.render(React.createElement(Harness, { onSubmit })))

    const card = container.querySelector('[data-testid="grade3-mission-card"]') as HTMLElement
    const answer = container.querySelector('[data-testid="grade3-integer-input"]') as HTMLInputElement
    const submit = container.querySelector('[data-testid="grade3-integer-submit"]') as HTMLButtonElement

    expect(card.outerHTML).not.toContain('6cm')
    expect(card.outerHTML).not.toMatch(/data-(?:answer|correct-answer|radius)=/)

    fill(answer, '6')
    expect(submit.disabled).toBe(true)
    pressEnter(answer)
    click(submit)
    expect(onSubmit).not.toHaveBeenCalled()

    click(container.querySelector('[data-testid="grade3-compass-draw"]') as Element)
    expect(container.querySelector('[data-testid="grade3-compass-drawn-circle"]')).not.toBeNull()
    expect(submit.disabled).toBe(true)
    pressEnter(answer)
    expect(onSubmit).not.toHaveBeenCalled()

    fill(answer, '4')
    expect(submit.disabled).toBe(false)
    click(submit)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-testid="grade3-mission-success"]')).toBeNull()

    click(container.querySelector('[data-testid="grade3-compass-increase"]') as Element)
    click(container.querySelector('[data-testid="grade3-compass-increase"]') as Element)
    expect(container.querySelector('[data-testid="grade3-compass-drawn-circle"]')).toBeNull()

    fill(answer, '6')
    click(container.querySelector('[data-testid="grade3-compass-draw"]') as Element)
    expect(submit.disabled).toBe(false)
    click(submit)

    expect(onSubmit).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[data-testid="grade3-mission-success"]')).not.toBeNull()
  })

  it('resets the construction when the learning card is restarted', () => {
    const onSubmit = vi.fn()
    act(() => root.render(React.createElement(Harness, { key: 'run-0', onSubmit })))
    click(container.querySelector('[data-testid="grade3-compass-draw"]') as Element)
    expect(container.querySelector('[data-testid="grade3-compass-drawn-circle"]')).not.toBeNull()

    act(() => root.render(React.createElement(Harness, { key: 'run-1', onSubmit })))

    expect(container.querySelector('[data-testid="grade3-compass-drawn-circle"]')).toBeNull()
    expect(container.querySelector('[data-testid="grade3-compass-width"]')?.textContent).toBe('4')
    expect((container.querySelector('[data-testid="grade3-integer-submit"]') as HTMLButtonElement).disabled).toBe(true)
  })
})
