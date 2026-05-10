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

    expect(html).toContain('백 모형 3개')
    expect(html).toContain('grade2-integer-input')
    expect(html).toContain('grade2-visual-place-value-blocks')
  })

  it('renders structured length and time inputs instead of unit text entry', () => {
    const lengthMission = getGrade2MissionById('g2-1-length-02', 42)
    const timeMission = getGrade2MissionById('g2-2-time-01', 42)

    const lengthHtml = renderToStaticMarkup(
      createElement(Grade2MissionCard, {
        mission: lengthMission,
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

    expect(lengthHtml).toContain('grade2-length-meters')
    expect(lengthHtml).toContain('grade2-length-centimeters')
    expect(timeHtml).toContain('grade2-time-hours')
    expect(timeHtml).toContain('grade2-time-minutes')
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
