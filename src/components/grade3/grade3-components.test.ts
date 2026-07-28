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

  it('renders every multiplication array cell in mobile-readable groups without exposing the product', () => {
    const arrayMissionIds = [
      'g3-1-multiply-01',
      'g3-1-multiply-02',
      'g3-1-multiply-03',
      'g3-2-multiply-01',
      'g3-2-multiply-02',
      'g3-2-multiply-03',
    ]

    for (const missionId of arrayMissionIds) {
      const mission = getGrade3MissionById(missionId, 42)
      const rows = Number(mission.visualConfig.rows)
      const columns = Number(mission.visualConfig.cols)
      const html = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission }))

      expect(html.match(/data-testid="grade3-array-cell"/g)).toHaveLength(rows * columns)
      expect(html.match(/data-testid="grade3-array-group"/g)).toHaveLength(Math.ceil(columns / 10))
      expect(html).not.toContain(`>${mission.correctAnswer}<`)
    }
  })

  it('renders a measurable 0–6cm ruler and a model-derived object endpoint without answer text', () => {
    const mission = getGrade3MissionById('g3-1-length-time-01', 42)
    const html = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission }))

    expect(html.match(/data-testid="grade3-ruler-tick"/g)).toHaveLength(61)
    expect(html.match(/data-testid="grade3-ruler-label"/g)).toHaveLength(7)
    expect(html).toContain('data-testid="grade3-ruler-object"')
    expect(html).toContain('x2="468.67"')
    expect(html).not.toContain('4cm 7mm')
    expect(html).not.toContain('4cm7mm')
    expect(html).not.toMatch(/aria-label="[^"]*47/)
  })

  it('provides graph axes, ticks, grid, and unit without a direct pre-answer bar label', () => {
    const mission = getGrade3MissionById('g3-2-graph-01', 42)
    const html = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission }))

    expect(html).toContain('data-testid="grade3-graph-y-axis"')
    expect(html).toContain('data-testid="grade3-graph-x-axis"')
    expect(html.match(/data-testid="grade3-graph-gridline"/g)).toHaveLength(7)
    expect(html.match(/data-testid="grade3-graph-y-tick"/g)).toHaveLength(7)
    expect(html).toContain('눈금 한 칸 = 1개')
    expect(html).toMatch(/data-testid="grade3-graph-count-0"[^>]*>□<\/span>/)
    expect(html).not.toContain('aria-label="사과 6개"')
  })

  it('shows only the relevant center evidence for the center-name problem', () => {
    const centerMission = getGrade3MissionById('g3-2-circle-01', 42)
    const centerHtml = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: centerMission }))

    expect(centerHtml).toContain('data-testid="grade3-circle-center-point"')
    expect(centerHtml).not.toContain('data-testid="grade3-circle-radius"')
    expect(centerHtml).not.toContain('data-testid="grade3-circle-diameter"')
    expect(centerHtml).not.toContain('반지름 5cm')
    expect(centerHtml).not.toContain('지름 10cm')

    const radiusDiameterMission = getGrade3MissionById('g3-2-circle-02', 42)
    const radiusDiameterHtml = renderToStaticMarkup(
      createElement(Grade3MissionVisual, { mission: radiusDiameterMission })
    )

    expect(radiusDiameterHtml).toContain('data-testid="grade3-circle-radius"')
    expect(radiusDiameterHtml).toContain('data-testid="grade3-circle-diameter"')
  })

  it('supports the two-stage compass construction without visual answer exposure', () => {
    const mission = getGrade3MissionById('g3-2-circle-03', 42)
    const hidden = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission }))
    const revealed = renderToStaticMarkup(
      createElement(Grade3MissionVisual, { mission, showAnswer: true })
    )

    expect(hidden).toContain('data-testid="grade3-construction-given-circle"')
    expect(hidden).toContain('data-testid="grade3-construction-given-diameter"')
    expect(hidden).toContain('data-testid="grade3-compass-center-O"')
    expect(hidden).toContain('지름 12cm')
    expect(hidden).not.toContain('6cm')
    expect(hidden).not.toMatch(/aria-label="[^"]*6/)
    expect(revealed).toContain('6cm')
  })

  it('renders quantitative capacity and weight scales without pre-answer numeric labels', () => {
    const capacity = getGrade3MissionById('g3-2-capacity-weight-01', 42)
    const hiddenCapacity = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: capacity }))
    const revealedCapacity = renderToStaticMarkup(
      createElement(Grade3MissionVisual, { mission: capacity, showAnswer: true })
    )

    expect(hiddenCapacity).toContain('data-testid="grade3-capacity-water-level"')
    expect(hiddenCapacity.match(/data-testid="grade3-capacity-scale-tick"/g)).toHaveLength(9)
    expect(hiddenCapacity).toContain('작은 눈금 한 칸 = 250mL')
    expect(hiddenCapacity).not.toContain('1L 250mL')
    expect(hiddenCapacity).not.toMatch(/aria-label="[^"]*1250/)
    expect(revealedCapacity).toContain('1L 250mL')

    const weight = getGrade3MissionById('g3-2-capacity-weight-02', 42)
    const hiddenWeight = renderToStaticMarkup(createElement(Grade3MissionVisual, { mission: weight }))
    const revealedWeight = renderToStaticMarkup(
      createElement(Grade3MissionVisual, { mission: weight, showAnswer: true })
    )

    expect(hiddenWeight).toContain('data-testid="grade3-weight-scale-pointer"')
    expect(hiddenWeight.match(/data-testid="grade3-weight-scale-tick"/g)).toHaveLength(31)
    expect(hiddenWeight).toContain('작은 눈금 한 칸 = 100g')
    expect(hiddenWeight).not.toContain('2kg 300g')
    expect(hiddenWeight).not.toMatch(/aria-label="[^"]*2300/)
    expect(revealedWeight).toContain('2kg 300g')
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

  it('keeps the complete compass card free of the answer before success, including hints and repeated-attempt support', () => {
    const html = renderCard('g3-2-circle-03', {
      wrongAttemptCount: 3,
      showHint: true,
    })

    expect(html).toContain('지름 12cm')
    expect(html).toContain('grade3-compass-construction')
    expect(html).not.toContain('6cm')
    expect(html).not.toContain('6센티미터')
    expect(html).not.toMatch(/data-(?:answer|correct-answer|radius)=/)
    expect(html).not.toMatch(/aria-label="[^"]*6cm/)
  })
})
