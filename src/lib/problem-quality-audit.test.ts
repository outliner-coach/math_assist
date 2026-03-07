import { describe, expect, it } from 'vitest'
import {
  analyzeRenderedPromptQuality,
  calculateDifficultySignal
} from '../../scripts/problem-quality-core.js'

describe('problem quality audit helpers', () => {
  it('warns when fraction prompts hide the operands', () => {
    const warnings = analyzeRenderedPromptQuality(
      {
        concept_id: 'commonden-001',
        solver_rule: 'convertNum1(n1, d1, d2)'
      },
      '통분한 뒤 첫 번째 분자에서 두 번째 분자를 빼면?'
    )

    expect(warnings.map((warning: { code: string }) => warning.code)).toContain(
      'fraction_operands_hidden'
    )
    expect(warnings.map((warning: { code: string }) => warning.code)).toContain(
      'ambiguous_operand_reference'
    )
  })

  it('does not treat ordinal wording as an operand reference', () => {
    const warnings = analyzeRenderedPromptQuality(
      {
        concept_id: 'divisor-001',
        solver_rule: 'secondLargestDivisor(n)'
      },
      '24의 두 번째로 큰 약수는?'
    )

    expect(warnings).toEqual([])
  })

  it('assigns higher difficulty signal to multi-step fraction templates', () => {
    const easySignal = calculateDifficultySignal(
      {
        prompt_template: '{{n}}의 약수는?',
        solver_rule: 'n',
        param_schema: { n: { min: 2, max: 9 } },
        type: 'choice',
        solution_steps_template: ['{{n}}'],
        hint_steps_template: ['{{n}}']
      },
      [{ answer: '6', answerMagnitude: 6 }]
    )

    const hardSignal = calculateDifficultySignal(
      {
        prompt_template: '$\\frac{ {{n1}} }{ {{d1}} }$와 $\\frac{ {{n2}} }{ {{d2}} }$를 통분한 뒤, 첫 번째 분자에서 두 번째 분자를 빼면?',
        solver_rule: 'convertNum1(n1, d1, d2) - convertNum2(n2, d1, d2)',
        param_schema: {
          n1: { min: 5, max: 8 },
          d1: { min: 6, max: 10 },
          n2: { min: 5, max: 8 },
          d2: { min: 7, max: 11 }
        },
        type: 'number',
        solution_steps_template: ['a', 'b'],
        hint_steps_template: ['a', 'b']
      },
      [{ answer: '12', answerMagnitude: 12 }]
    )

    expect(hardSignal).toBeGreaterThan(easySignal)
  })
})
