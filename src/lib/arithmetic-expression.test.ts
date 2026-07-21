import { describe, expect, it } from 'vitest'

import {
  ArithmeticExpressionError,
  evaluateArithmeticExpression,
} from './arithmetic-expression'

describe('safe arithmetic expression evaluator', () => {
  it.each([
    ['1 + 2 * 3', 7],
    ['(1 + 2) * 3', 9],
    ['8 / 4 / 2', 1],
    ['-2 * (3 + 4)', -14],
    ['1 + -2', -1],
    ['-(2.5 + .5)', -3],
    ['+4', 4],
    ['4.', 4],
  ])('evaluates %s with deterministic precedence', (expression, expected) => {
    expect(evaluateArithmeticExpression(expression)).toBe(expected)
  })

  it.each([
    '',
    '   ',
    '.',
    '1e3',
    '2 ** 3',
    'value + 1',
    'NaN',
    'Infinity',
    '1 / 0',
    '1 / (2 - 2)',
    '0 / 0',
    '1 2',
    '1 + 2 trailing',
    '(1 + 2',
    '1 + 2)',
    '1 +',
    '()'
  ])('rejects invalid or non-finite expression %j', (expression) => {
    expect(() => evaluateArithmeticExpression(expression)).toThrow(ArithmeticExpressionError)
  })

  it('rejects expressions outside bounded parser limits', () => {
    expect(() => evaluateArithmeticExpression('1+'.repeat(300) + '1'))
      .toThrow(ArithmeticExpressionError)
    expect(() => evaluateArithmeticExpression('('.repeat(70) + '1' + ')'.repeat(70)))
      .toThrow(ArithmeticExpressionError)
    expect(() => evaluateArithmeticExpression('9'.repeat(400)))
      .toThrow(ArithmeticExpressionError)
  })
})
