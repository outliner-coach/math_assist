import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { getGrade3MissionById, getGrade3Missions, getSafeGrade3Mission } from '@/lib/grade3-problems'

import Grade3MissionCard from './Grade3MissionCard'
import Grade3MissionVisual from './Grade3MissionVisual'

const noop = vi.fn()

function renderCard(missionId = 'g3-1-add-sub-01', overrides = {}) {
  const mission = getGrade3MissionById(missionId, 42)
  return renderToStaticMarkup(
    createElement(Grade3MissionCard, {
      mission,
      selectedAnswer: null,
      textAnswer: '',
      fractionAnswer: { numerator: '', denominator: '' },
      lengthAnswer: { kilometers: '', meters: '', centimeters: '', millimeters: '' },
      timeAnswer: { hours: '', minutes: '', seconds: '' },
      capacityAnswer: { liters: '', milliliters: '' },
      weightAnswer: { kilograms: '', grams: '' },
      scaffoldSelection: null,
      showHint: false,
      wrongAttemptCount: 0,
      inputError: null,
      solved: false,
      missionCount: 3,
      onScaffoldSelect: noop,
      onChoiceAnswer: noop,
      onTextAnswerChange: noop,
      onFractionAnswerChange: noop,
      onLengthAnswerChange: noop,
      onTimeAnswerChange: noop,
      onCapacityAnswerChange: noop,
      onWeightAnswerChange: noop,
      onSubmitText: noop,
      onSubmitFraction: noop,
      onSubmitLength: noop,
      onSubmitTime: noop,
      onSubmitCapacity: noop,
      onSubmitWeight: noop,
      onShowHint: noop,
      ...overrides,
    })
  )
}

describe('Grade3MissionVisual', () => {
  it('renders every Grade 3 visual model', () => {
    const byModel = new Map(getGrade3Missions(42).map((mission) => [mission.visualModel, mission]))

    for (const [visualModel, mission] of byModel) {
      const html = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission }))
      expect(html).toContain(`grade3-visual-${visualModel}`)
    }
  })

  it('hides answer-only values before reveal and shows them after success', () => {
    const verticalMission = getSafeGrade3Mission(42)
    const hiddenVertical = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: verticalMission }))
    const shownVertical = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: verticalMission, showAnswer: true }))

    expect(hiddenVertical).toContain('data-testid="grade3-vertical-result"')
    expect(hiddenVertical).toContain('□')
    expect(hiddenVertical).not.toContain('385')
    expect(shownVertical).toContain('385')

    const fractionMission = getGrade3MissionById('g3-1-fraction-decimal-01', 42)
    const hiddenFraction = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: fractionMission }))
    const shownFraction = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: fractionMission, showAnswer: true }))

    expect(hiddenFraction).toContain('data-testid="grade3-fraction-result"')
    expect(hiddenFraction).not.toContain('2/5')
    expect(shownFraction).toContain('2/5')
  })

  it('derives capacity, tonne, and weight visuals from the given quantities without exposing results', () => {
    const capacityMission = getGrade3MissionById('g3-2-capacity-weight-03', 42)
    const hiddenCapacity = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: capacityMission }))
    const shownCapacity = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: capacityMission, showAnswer: true }))

    expect(hiddenCapacity).toContain('2L 750mL')
    expect(hiddenCapacity).toContain('650mL')
    expect(hiddenCapacity).not.toContain('3L400mL')
    expect(shownCapacity).toContain('3L400mL')

    const tonneMission = getGrade3MissionById('g3-2-capacity-weight-06', 42)
    const hiddenTonne = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: tonneMission }))
    const shownTonne = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: tonneMission, showAnswer: true }))

    expect(hiddenTonne.match(/data-tonne-block="true"/g)).toHaveLength(4)
    expect(hiddenTonne).toContain('1t = 1000kg')
    expect(hiddenTonne).not.toContain('4000kg')
    expect(shownTonne).toContain('4000kg')

    const weightMission = getGrade3MissionById('g3-2-capacity-weight-07', 42)
    const hiddenWeight = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: weightMission }))
    const shownWeight = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: weightMission, showAnswer: true }))

    expect(hiddenWeight).toContain('4kg 200g')
    expect(hiddenWeight).toContain('1kg 750g')
    expect(hiddenWeight).not.toContain('2kg450g')
    expect(shownWeight).toContain('2kg450g')
  })

  it('renders the Grade 3 angle classification from two rays without numeric measurement', () => {
    const mission = getGrade3MissionById('g3-1-lines-03', 42)
    const html = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission }))

    expect(html).toContain('data-testid="grade3-angle-ray-base"')
    expect(html).toContain('data-testid="grade3-angle-ray-compare"')
    expect(html).toContain('data-testid="grade3-right-angle-guide"')
    expect(html).toContain('aria-label="직각과 비교할 두 반직선"')
    expect(html).not.toMatch(/120\s*도|각도기|각도:/)
  })
})

describe('Grade3MissionCard', () => {
  it('renders scaffold buttons and integer input for the safe mission', () => {
    const html = renderCard()

    expect(html).toContain('grade3-scaffold')
    expect(html).toContain('grade3-integer-input')
    expect(html).toContain('grade3-visual-vertical-operation')
  })

  it('renders structured input fields for Grade 3 answer types', () => {
    expect(renderCard('g3-1-fraction-decimal-01')).toContain('grade3-fraction-numerator')
    expect(renderCard('g3-1-fraction-decimal-02')).toContain('grade3-decimal-input')
    expect(renderCard('g3-1-length-time-01')).toContain('grade3-length-millimeters')
    expect(renderCard('g3-1-length-time-02')).toContain('grade3-time-seconds')
    expect(renderCard('g3-2-capacity-weight-01')).toContain('grade3-capacity-milliliters')
    expect(renderCard('g3-2-capacity-weight-02')).toContain('grade3-weight-grams')
    expect(renderCard('g3-1-lines-03')).toContain('grade3-choice-둔각')
    expect(renderCard('g3-1-lines-03')).not.toContain('grade3-angle-input')
  })

  it('shows input errors without solution reveal', () => {
    const html = renderCard('g3-1-fraction-decimal-01', {
      inputError: '분모는 0이 될 수 없어요.',
      wrongAttemptCount: 0,
    })

    expect(html).toContain('grade3-input-error')
    expect(html).not.toContain('grade3-solution-path')
  })

  it('reveals solution path after repeated valid wrong attempts', () => {
    const html = renderCard('g3-1-add-sub-01', {
      selectedAnswer: '111',
      wrongAttemptCount: 3,
      showHint: true,
    })

    expect(html).toContain('grade3-mission-hint')
    expect(html).toContain('grade3-solution-path')
  })
})
