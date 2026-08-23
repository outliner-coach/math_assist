import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  G6_RATIO_PART_WHOLE_CASES,
  G6_RATIO_RELATIVE_COMPARISON_CASES,
  G6_RATIO_REPRESENTATION_CASES,
  generateG6RatioPartWhole,
  generateG6RatioRelativeComparison,
  generateG6RatioRepresentationCheck,
} from '../lib/application-problems/families/g6-ratio'
import Grade6ApplicationRatioVisual, {
  resolveGrade6ApplicationRatioVisual,
} from './Grade6ApplicationRatioVisual'

function markup(
  visual: ReturnType<typeof generateG6RatioPartWhole>['visual'],
  showAnswer: boolean,
): string {
  return renderToStaticMarkup(
    createElement(Grade6ApplicationRatioVisual, { visual, showAnswer }),
  )
}

describe('Grade6ApplicationRatioVisual', () => {
  it('pairs pre/post disclosure for the proportional part-whole bar without leaking targets', () => {
    const caseIndex = G6_RATIO_PART_WHOLE_CASES.findIndex(
      (entry) => entry.numerator === 7 && entry.denominator === 10 && entry.scale === 5,
    )
    const problem = generateG6RatioPartWhole({ seed: caseIndex, variantIndex: 0 })
    const hidden = markup(problem.visual, false)
    const revealed = markup(problem.visual, true)

    expect(hidden).toContain('<svg')
    expect(hidden).toContain('?')
    expect(hidden).not.toContain('35개')
    expect(hidden).not.toContain('7/10')
    expect(hidden).not.toContain('data-answer')
    expect(revealed).toContain('35개')
    expect(revealed).toContain('7/10')
    expect(revealed).not.toContain('>?<')
  })

  it('pairs pre/post disclosure for comparison target cells and keeps percent in the heading', () => {
    const caseIndex = G6_RATIO_RELATIVE_COMPARISON_CASES.findIndex(
      (entry) => entry.higherNumerator === 3 && entry.higherDenominator === 4,
    )
    const problem = generateG6RatioRelativeComparison({ seed: caseIndex, variantIndex: 0 })
    const hidden = markup(problem.visual, false)
    const revealed = markup(problem.visual, true)

    expect(hidden).toContain('<table')
    expect(hidden).toContain('성공 비율 (%)')
    expect(hidden).not.toContain('>75</td>')
    expect(hidden).not.toMatch(/numericValue|numericDisclosure|data-answer/)
    expect(revealed).toContain('>75</td>')
  })

  it('pairs pre/post disclosure for fraction, decimal, and percent representation cells', () => {
    const caseIndex = G6_RATIO_REPRESENTATION_CASES.findIndex(
      (entry) => entry.numerator === 7 && entry.denominator === 20,
    )
    const problem = generateG6RatioRepresentationCheck({ seed: caseIndex, variantIndex: 0 })
    const hidden = markup(problem.visual, false)
    const revealed = markup(problem.visual, true)

    expect(hidden).toContain('비율 (%)')
    expect(hidden).not.toContain('>7/20</td>')
    expect(hidden).not.toContain('>0.35</td>')
    expect(hidden).not.toContain('>35</td>')
    expect(hidden).not.toMatch(/numericValue|numericDisclosure|data-answer/)
    expect(revealed).toContain('>7/20</td>')
    expect(revealed).toContain('>0.35</td>')
    expect(revealed).toContain('>35</td>')
  })

  it('fails closed for a required visual with an invalid or mismatched scene', () => {
    const problem = generateG6RatioPartWhole({ seed: 0, variantIndex: 0 })
    const invalidVisual = {
      ...problem.visual,
      mathModel: {
        schemaVersion: 'application-visual-v1',
        surface: 'table',
        semantics: 'quantitative',
      },
    }
    expect(resolveGrade6ApplicationRatioVisual(invalidVisual).status).toBe('blocked')
    const output = markup(invalidVisual, false)
    expect(output).toContain('role="alert"')
    expect(output).not.toContain('<svg')
    expect(output).not.toContain('<table')
  })
})
