import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { getProblemReviewData } from '@/lib/problem-review'

import ProblemReviewRenderer from './ProblemReviewRenderer'

describe('ProblemReviewRenderer', () => {
  it('routes every grade family through its actual visual component', async () => {
    const data = await getProblemReviewData()
    const rendererKinds = ['grade1', 'grade2', 'grade3', 'grade4', 'practice'] as const
    const actualMarkers = {
      grade1: 'data-testid="grade1-visual-',
      grade2: 'data-testid="grade2-visual-',
      grade3: 'data-testid="grade3-visual-',
      grade4: 'data-testid="grade4-visual-',
      practice: 'data-testid="problem-diagram-',
    }

    for (const renderer of rendererKinds) {
      const row = data.rows.find(item => item.renderer === renderer && item.hasVisual)
      expect(row, renderer).toBeDefined()
      const markup = renderToStaticMarkup(
        createElement(ProblemReviewRenderer, { row: row!, state: 'pre' })
      )

      expect(markup, renderer).toContain(`data-actual-renderer="${renderer}"`)
      expect(markup, renderer).toContain('data-review-visual-state="pre"')
      expect(markup, renderer).toContain(actualMarkers[renderer])
    }
  })

  it('keeps the same source on explicit pre, hint, and revealed surfaces', async () => {
    const data = await getProblemReviewData()
    const row = data.rows.find(
      item => item.renderer === 'grade4' && item.hasVisual
    )!

    for (const state of ['pre', 'hint', 'revealed'] as const) {
      const markup = renderToStaticMarkup(
        createElement(ProblemReviewRenderer, { row, state })
      )
      expect(markup).toContain(`data-review-visual-state="${state}"`)
      expect(markup).toContain(`data-review-source-id="${row.sourceId}"`)
    }
  })

  it('shows source-owned scaffold and tool evidence on the matching renderer', async () => {
    const data = await getProblemReviewData()
    const grade3 = data.rows.find(item => item.renderer === 'grade3')!
    const grade4 = data.rows.find(
      item => item.renderer === 'grade4' && item.mission.supportTool !== 'none'
    )!

    const grade3Hint = renderToStaticMarkup(
      createElement(ProblemReviewRenderer, { row: grade3, state: 'hint' })
    )
    const grade4Pre = renderToStaticMarkup(
      createElement(ProblemReviewRenderer, { row: grade4, state: 'pre' })
    )

    expect(grade3Hint).toContain('data-testid="problem-review-scaffold"')
    expect(grade3Hint).toContain(grade3.mission.scaffoldConfig.prompt)
    expect(grade4Pre).toContain('data-testid="problem-review-tool"')
    expect(grade4Pre).toContain(grade4.mission.supportTool)
  })

  it('keeps the same answer-safe overlapping-shape artwork in every review state', async () => {
    const data = await getProblemReviewData()
    const row = data.rows.find(
      item => item.problem?.visual?.type === 'three_shape_overlap'
    )!

    const pre = renderToStaticMarkup(
      createElement(ProblemReviewRenderer, { row, state: 'pre' })
    )
    const hint = renderToStaticMarkup(
      createElement(ProblemReviewRenderer, { row, state: 'hint' })
    )
    const revealed = renderToStaticMarkup(
      createElement(ProblemReviewRenderer, { row, state: 'revealed' })
    )

    for (const markup of [pre, hint, revealed]) {
      expect((markup.match(/data-overlap-shape=/g) ?? [])).toHaveLength(3)
      expect((markup.match(/data-overlap-shape-label=/g) ?? [])).toHaveLength(3)
      expect(markup).not.toContain('data-cell-region')
      expect(markup).not.toContain('data-overlap-mask')
      expect(markup).not.toContain('data-region-callout')
      expect(markup).not.toContain('A∩B')
      expect(markup).not.toContain('A∩C')
      expect(markup).not.toContain('B∩C')
    }
  })
})
