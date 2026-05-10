import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { getGrade2MissionById, getGrade2Missions, getSafeGrade2Mission } from '@/lib/grade2-problems'

import Grade2MissionCard from './Grade2MissionCard'
import Grade2MissionVisual from './Grade2MissionVisual'

describe('grade 2 components', () => {
  it('renders each Alpha visual model without dropping the problem surface', () => {
    const missionsByVisual = new Map(
      getGrade2Missions(42).map((mission) => [mission.visualModel, mission])
    )

    for (const [visualModel, mission] of missionsByVisual.entries()) {
      const html = renderToStaticMarkup(createElement(Grade2MissionVisual, { mission }))

      expect(html).toContain(`grade2-visual-${visualModel}`)
    }
  })

  it('renders the safe integer mission with a simple numeric input', () => {
    const mission = getSafeGrade2Mission(42)
    const html = renderToStaticMarkup(
      createElement(Grade2MissionCard, {
        mission,
        selectedAnswer: null,
        textAnswer: '',
        lengthAnswer: { meters: '', centimeters: '' },
        timeAnswer: { hours: '', minutes: '' },
        showHint: false,
        wrongAttemptCount: 0,
        inputError: null,
        solved: false,
        onChoiceAnswer: vi.fn(),
        onTextAnswerChange: vi.fn(),
        onLengthAnswerChange: vi.fn(),
        onTimeAnswerChange: vi.fn(),
        onSubmitText: vi.fn(),
        onSubmitLength: vi.fn(),
        onSubmitTime: vi.fn(),
        onShowHint: vi.fn(),
      })
    )

    expect(html).toContain('그림의 백, 십, 일 모형')
    expect(html).toContain('grade2-integer-input')
    expect(html).toContain('grade2-visual-place-value-blocks')
  })

  it('renders structured length and time inputs instead of unit text entry', () => {
    const centimeterLengthMission = getGrade2MissionById('g2-1-length-02', 42)
    const mixedLengthMission = getGrade2MissionById('g2-2-length-03', 42)
    const timeMission = getGrade2MissionById('g2-2-time-01', 42)

    const centimeterLengthHtml = renderToStaticMarkup(
      createElement(Grade2MissionCard, {
        mission: centimeterLengthMission,
        selectedAnswer: null,
        textAnswer: '',
        lengthAnswer: { meters: '', centimeters: '120' },
        timeAnswer: { hours: '', minutes: '' },
        showHint: false,
        wrongAttemptCount: 0,
        inputError: null,
        solved: false,
        onChoiceAnswer: vi.fn(),
        onTextAnswerChange: vi.fn(),
        onLengthAnswerChange: vi.fn(),
        onTimeAnswerChange: vi.fn(),
        onSubmitText: vi.fn(),
        onSubmitLength: vi.fn(),
        onSubmitTime: vi.fn(),
        onShowHint: vi.fn(),
      })
    )
    const mixedLengthHtml = renderToStaticMarkup(
      createElement(Grade2MissionCard, {
        mission: mixedLengthMission,
        selectedAnswer: null,
        textAnswer: '',
        lengthAnswer: { meters: '1', centimeters: '20' },
        timeAnswer: { hours: '', minutes: '' },
        showHint: false,
        wrongAttemptCount: 0,
        inputError: null,
        solved: false,
        onChoiceAnswer: vi.fn(),
        onTextAnswerChange: vi.fn(),
        onLengthAnswerChange: vi.fn(),
        onTimeAnswerChange: vi.fn(),
        onSubmitText: vi.fn(),
        onSubmitLength: vi.fn(),
        onSubmitTime: vi.fn(),
        onShowHint: vi.fn(),
      })
    )
    const timeHtml = renderToStaticMarkup(
      createElement(Grade2MissionCard, {
        mission: timeMission,
        selectedAnswer: null,
        textAnswer: '',
        lengthAnswer: { meters: '', centimeters: '' },
        timeAnswer: { hours: '3', minutes: '25' },
        showHint: false,
        wrongAttemptCount: 0,
        inputError: null,
        solved: false,
        onChoiceAnswer: vi.fn(),
        onTextAnswerChange: vi.fn(),
        onLengthAnswerChange: vi.fn(),
        onTimeAnswerChange: vi.fn(),
        onSubmitText: vi.fn(),
        onSubmitLength: vi.fn(),
        onSubmitTime: vi.fn(),
        onShowHint: vi.fn(),
      })
    )

    expect(centimeterLengthHtml).toContain('길이를 cm로 써요')
    expect(centimeterLengthHtml).not.toContain('grade2-length-meters')
    expect(centimeterLengthHtml).toContain('grade2-length-centimeters')
    expect(mixedLengthHtml).toContain('grade2-length-meters')
    expect(mixedLengthHtml).toContain('grade2-length-centimeters')
    expect(timeHtml).toContain('grade2-time-hours')
    expect(timeHtml).toContain('grade2-time-minutes')
  })

  it('aligns ruler length markers to the same coordinate system as the tick labels', () => {
    const rulerMission = getGrade2MissionById('g2-1-length-01', 42)
    const html = renderToStaticMarkup(createElement(Grade2MissionVisual, { mission: rulerMission }))

    expect(html).toContain('aria-label="8cm 끝 눈금"')
    expect(html).toContain('left:66.66666666666666%')
    expect(html).not.toContain('calc(1rem')
  })

  it('masks answer-only visual values until the answer is revealed', () => {
    const placeValueMission = getGrade2MissionById('g2-1-place-value-01', 42)
    const hiddenPlaceValueHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: placeValueMission })
    )
    const revealedPlaceValueHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: placeValueMission, showAnswer: true })
    )

    expect(hiddenPlaceValueHtml).toContain('data-testid="grade2-place-value-count-hundreds"')
    expect(hiddenPlaceValueHtml).toContain('>□</div>')
    expect(hiddenPlaceValueHtml).not.toContain('>3</div>')
    expect(hiddenPlaceValueHtml).not.toContain('>4</div>')
    expect(hiddenPlaceValueHtml).not.toContain('>2</div>')
    expect(revealedPlaceValueHtml).toContain('>3</div>')
    expect(revealedPlaceValueHtml).toContain('>4</div>')
    expect(revealedPlaceValueHtml).toContain('>2</div>')

    const subtractionMission = getGrade2MissionById('g2-1-add-sub-02', 42)
    const hiddenSubtractionHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: subtractionMission })
    )
    const revealedSubtractionHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: subtractionMission, showAnswer: true })
    )

    expect(hiddenSubtractionHtml).toContain('data-testid="grade2-vertical-result"')
    expect(hiddenSubtractionHtml).toContain('>□</div>')
    expect(hiddenSubtractionHtml).not.toContain('>24</div>')
    expect(revealedSubtractionHtml).toContain('>24</div>')

    const expandedMission = getGrade2MissionById('g2-1-place-value-03', 42)
    const hiddenExpandedHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: expandedMission })
    )
    const revealedExpandedHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: expandedMission, showAnswer: true })
    )

    expect(hiddenExpandedHtml).toContain('= □')
    expect(hiddenExpandedHtml).not.toContain('= 567')
    expect(revealedExpandedHtml).toContain('= 567')

    const multiplicationMission = getGrade2MissionById('g2-2-facts-01', 42)
    const hiddenMultiplicationHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: multiplicationMission })
    )
    const revealedMultiplicationHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: multiplicationMission, showAnswer: true })
    )

    expect(hiddenMultiplicationHtml).toContain('data-testid="grade2-multiplication-product-4"')
    expect(hiddenMultiplicationHtml).not.toContain('>24</div>')
    expect(revealedMultiplicationHtml).toContain('>24</div>')

    const equivalentLengthMission = getGrade2MissionById('g2-2-length-03', 42)
    const hiddenLengthHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: equivalentLengthMission })
    )
    const revealedLengthHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: equivalentLengthMission, showAnswer: true })
    )

    expect(hiddenLengthHtml).not.toContain('1m 20cm')
    expect(revealedLengthHtml).toContain('1m 20cm')

    const classificationMission = getGrade2MissionById('g2-1-classification-01', 42)
    const hiddenClassificationHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: classificationMission })
    )
    const revealedClassificationHtml = renderToStaticMarkup(
      createElement(Grade2MissionVisual, { mission: classificationMission, showAnswer: true })
    )

    expect(hiddenClassificationHtml).toContain('data-testid="grade2-classification-marks-0"')
    expect(hiddenClassificationHtml).not.toContain('>4</span>')
    expect(revealedClassificationHtml).toContain('>4</span>')
  })

  it('does not target-highlight answer cards before the visual answer is revealed', () => {
    const targetHighlightMissions = [
      getGrade2MissionById('g2-1-place-value-02', 42),
      getGrade2MissionById('g2-1-shapes-01', 42),
      getGrade2MissionById('g2-1-classification-02', 42),
      getGrade2MissionById('g2-2-table-graph-02', 42),
    ]

    for (const mission of targetHighlightMissions) {
      const hiddenHtml = renderToStaticMarkup(
        createElement(Grade2MissionVisual, { mission, emphasize: true })
      )
      const revealedHtml = renderToStaticMarkup(
        createElement(Grade2MissionVisual, { mission, emphasize: true, showAnswer: true })
      )

      expect(hiddenHtml).not.toContain('border-[#16a34a]')
      expect(hiddenHtml).not.toContain('bg-[#dcfce7]')
      expect(revealedHtml.includes('border-[#16a34a]') || revealedHtml.includes('bg-[#dcfce7]')).toBe(true)
    }
  })

  it('keeps hints and solution path visible after repeated mistakes', () => {
    const mission = getGrade2MissionById('g2-2-table-graph-03', 42)
    const html = renderToStaticMarkup(
      createElement(Grade2MissionCard, {
        mission,
        selectedAnswer: '1',
        textAnswer: '1',
        lengthAnswer: { meters: '', centimeters: '' },
        timeAnswer: { hours: '', minutes: '' },
        showHint: true,
        wrongAttemptCount: 3,
        inputError: '숫자만 써요.',
        solved: false,
        onChoiceAnswer: vi.fn(),
        onTextAnswerChange: vi.fn(),
        onLengthAnswerChange: vi.fn(),
        onTimeAnswerChange: vi.fn(),
        onSubmitText: vi.fn(),
        onSubmitLength: vi.fn(),
        onSubmitTime: vi.fn(),
        onShowHint: vi.fn(),
      })
    )

    expect(html).toContain('grade2-mission-hint')
    expect(html).toContain('grade2-solution-path')
    expect(html).toContain('grade2-input-error')
  })
})
