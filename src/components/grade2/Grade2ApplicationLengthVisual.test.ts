import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { JsonValue } from '@/lib/application-problems/contracts'
import {
  G2_LENGTH_CLAIM_CHECK_CASES,
  generateG2LengthClaimCheck,
} from '@/lib/application-problems/families/g2-length-claim-check'
import {
  G2_LENGTH_MISSING_SEGMENT_CASES,
  generateG2LengthMissingSegment,
} from '@/lib/application-problems/families/g2-length-missing-segment'
import {
  G2_LENGTH_ROUTE_TOTAL_CASES,
  generateG2LengthRouteTotal,
} from '@/lib/application-problems/families/g2-length-route-total'
import { resolveGrade2ApplicationLengthVisual } from '@/lib/application-problems/grade2-visual-resolution'

import Grade2ApplicationLengthVisual from './Grade2ApplicationLengthVisual'

function renderProblem(
  problem: ReturnType<typeof generateG2LengthRouteTotal>,
  showAnswer: boolean,
): string {
  const resolution = resolveGrade2ApplicationLengthVisual(problem.visual, problem.params)
  if (resolution.status !== 'ready') throw new Error('test fixture visual must be valid')
  return renderToStaticMarkup(
    createElement(Grade2ApplicationLengthVisual, {
      scene: resolution.scene,
      showAnswer,
    }),
  )
}

function answerOnlyText(value: JsonValue | undefined): string[] {
  if (value === undefined || value === null || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap(answerOnlyText)
  const record = value as Record<string, JsonValue>
  const ownAfter = record.after
  const text =
    ownAfter && typeof ownAfter === 'object' && !Array.isArray(ownAfter)
      ? (ownAfter as Record<string, JsonValue>).text
      : undefined
  return [
    ...(typeof text === 'string' ? [text] : []),
    ...Object.entries(record)
      .filter(([key]) => key !== 'after')
      .flatMap(([, entry]) => answerOnlyText(entry)),
  ]
}

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

describe('Grade2ApplicationLengthVisual', () => {
  it('keeps a route total out of text, SVG accessibility, and data channels until disclosure', () => {
    const problem = generateG2LengthRouteTotal({ seed: 0, variantIndex: 0 })
    const answerToken = `${problem.answer.normalized}cm`
    const hidden = renderProblem(problem, false)
    const revealed = renderProblem(problem, true)

    expect(hidden).not.toContain(answerToken)
    expect(hidden).not.toMatch(new RegExp(`(?:aria-label|<title|data-[^=]+)[^>]*${answerToken}`))
    expect(hidden).toContain('1m 10cm')
    expect(revealed).toContain(answerToken)
  })

  it('shows ? before disclosure and the missing length only after disclosure', () => {
    const problem = generateG2LengthMissingSegment({ seed: 0, variantIndex: 0 })
    const answerToken = `${problem.answer.normalized}cm`
    const hidden = renderProblem(problem, false)
    const revealed = renderProblem(problem, true)

    expect(hidden).toContain('>?</text>')
    expect(hidden).not.toContain(answerToken)
    expect(hidden).not.toMatch(new RegExp(`(?:aria-label|<title|data-[^=]+)[^>]*${answerToken}`))
    expect(revealed).not.toContain('>?</text>')
    expect(revealed).toContain(answerToken)
  })

  it('renders only raw measurements for claim checking and never draws the false claim', () => {
    const problem = generateG2LengthClaimCheck({ seed: 0, variantIndex: 0 })
    const falseClaim = `${problem.params.claimBCm}cm`
    const hidden = renderProblem(problem, false)
    const revealed = renderProblem(problem, true)

    expect(hidden).toContain('1m 10cm')
    expect(hidden).toContain('25cm')
    expect(hidden).toContain('20cm')
    expect(hidden).not.toContain(falseClaim)
    expect(revealed).not.toContain(falseClaim)
    expect(revealed).toContain(`맞는 말은 ${problem.answer.normalized}예요.`)
  })

  it('treats a family scene-vs-params mismatch as fatal for the required visual', () => {
    const problem = generateG2LengthRouteTotal({ seed: 0, variantIndex: 0 })
    const mathModel = structuredClone(problem.visual.mathModel!) as {
      primitives: Array<Record<string, unknown>>
      constraints: Array<Record<string, unknown>>
    }
    mathModel.primitives[0].x2 = Number(mathModel.primitives[0].x2) + 1
    mathModel.constraints[0].expected = Number(mathModel.constraints[0].expected) + 1
    const visual = { ...problem.visual, mathModel: mathModel as unknown as JsonValue }

    expect(resolveGrade2ApplicationLengthVisual(visual, problem.params).status).toBe('blocked')
  })

  it('pairs pre/post leak scans for every one of the 18, 54, and 32 cases', () => {
    const problems = [
      ...G2_LENGTH_ROUTE_TOTAL_CASES.map((_, variantIndex) =>
        generateG2LengthRouteTotal({ seed: 0, variantIndex }),
      ),
      ...G2_LENGTH_MISSING_SEGMENT_CASES.map((_, variantIndex) =>
        generateG2LengthMissingSegment({ seed: 0, variantIndex }),
      ),
      ...G2_LENGTH_CLAIM_CHECK_CASES.map((_, variantIndex) =>
        generateG2LengthClaimCheck({ seed: 0, variantIndex }),
      ),
    ]

    problems.forEach((problem) => {
      const hidden = renderProblem(problem, false)
      const revealed = renderProblem(problem, true)
      const disclosureStrings = [...new Set(answerOnlyText(problem.visual.mathModel))]
      expect(disclosureStrings.length).toBeGreaterThan(0)
      disclosureStrings.forEach((text) => {
        expect(occurrences(revealed, text)).toBeGreaterThan(occurrences(hidden, text))
      })
    })
  })

  it('never promotes any of the 32 false numerical claims into the visual', () => {
    G2_LENGTH_CLAIM_CHECK_CASES.forEach((_, variantIndex) => {
      const problem = generateG2LengthClaimCheck({ seed: 0, variantIndex })
      const falseClaim = problem.answer.normalized === '가'
        ? problem.params.claimBCm
        : problem.params.claimACm
      const falseClaimToken = `${falseClaim}cm`
      expect(renderProblem(problem, false)).not.toContain(falseClaimToken)
      expect(renderProblem(problem, true)).not.toContain(falseClaimToken)
    })
  })
})
