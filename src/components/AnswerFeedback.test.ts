import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { SubmissionResult } from '@/lib/types'
import AnswerFeedback from './AnswerFeedback'

function makeResult(correct: boolean): SubmissionResult {
  return {
    index: 0,
    correct,
    userAnswer: correct ? '54' : '50',
    correctAnswer: '54',
    solutionSteps: ['전체 가로에서 정사각형 한 변을 뺍니다.', '둘레는 54 cm입니다.'],
    problem: {
      index: 0,
      templateId: 'area-feedback',
      setId: 'A',
      params: {},
      prompt: '붙인 도형의 둘레를 구하세요.',
      type: 'number',
      correctAnswer: '54',
      solutionSteps: ['둘레는 54 cm입니다.']
    }
  }
}

describe('AnswerFeedback', () => {
  it('shows the answer and solution immediately for a correct response', () => {
    const html = renderToStaticMarkup(createElement(AnswerFeedback, { result: makeResult(true) }))

    expect(html).toContain('정답이에요!')
    expect(html).toContain('54')
    expect(html).toContain('풀이 과정')
  })

  it('shows corrective feedback for a wrong response', () => {
    const html = renderToStaticMarkup(createElement(AnswerFeedback, { result: makeResult(false) }))

    expect(html).toContain('아쉬워요')
    expect(html).toContain('50')
    expect(html).toContain('54')
  })
})
