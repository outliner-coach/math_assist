import { describe, expect, it } from 'vitest'
import { calculateScore, gradeSession } from './grader'
import type { Problem } from './types'

function makeChoiceProblem(): Problem {
  return {
    index: 0,
    templateId: 'choice-1',
    setId: 'A',
    params: {},
    prompt: '2의 배수는?',
    type: 'choice',
    choices: ['3', '4', '5', '7'],
    correctAnswer: '4',
    correctChoiceIndex: 1,
    solutionSteps: ['2로 나누어 떨어지는 수를 찾습니다.']
  }
}

function makeNumberProblem(): Problem {
  return {
    index: 1,
    templateId: 'number-1',
    setId: 'A',
    params: {},
    prompt: '1/2와 같은 분수를 쓰세요.',
    type: 'number',
    correctAnswer: '1/2',
    solutionSteps: ['분자를 분모의 절반으로 맞춥니다.']
  }
}

describe('gradeSession', () => {
  it('stores a problem snapshot with each graded result', () => {
    const choiceProblem = makeChoiceProblem()
    const numberProblem = makeNumberProblem()

    const results = gradeSession(
      [choiceProblem, numberProblem],
      ['1', '2/4']
    )

    expect(results[0].correct).toBe(true)
    expect(results[1].correct).toBe(true)
    expect(results[0].problem).toEqual(choiceProblem)
    expect(results[1].problem).toEqual(numberProblem)
    expect(calculateScore(results)).toBe(2)
  })

  it('treats blank strings as unanswered', () => {
    const results = gradeSession([makeNumberProblem()], [''])

    expect(results[0].correct).toBe(false)
    expect(results[0].userAnswer).toBe('')
  })
})
