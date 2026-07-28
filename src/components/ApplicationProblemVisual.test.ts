import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { parseApplicationVisualSceneV1 } from '../lib/application-problems/visual-model'
import { validateApplicationVisualScene } from '../lib/application-problems/visual-validator'
import { getApplicationProblemReviewData } from '../lib/problem-review'
import { diagramScene } from '../lib/application-problems/visual-model.test'
import ApplicationProblemVisual from './ApplicationProblemVisual'

function validatedDiagram() {
  const result = validateApplicationVisualScene(parseApplicationVisualSceneV1(diagramScene()))
  if (!result.ok) throw new Error('fixture should validate')
  return result.scene
}

describe('ApplicationProblemVisual', () => {
  it('omits answer-only and intermediate nodes from every pre-answer markup channel', () => {
    const hidden = renderToStaticMarkup(
      createElement(ApplicationProblemVisual, { scene: validatedDiagram(), showAnswer: false }),
    )
    const revealed = renderToStaticMarkup(
      createElement(ApplicationProblemVisual, { scene: validatedDiagram(), showAnswer: true }),
    )

    expect(hidden).toContain('? cm')
    expect(hidden).not.toContain('ANSWER-SENTINEL-731')
    expect(hidden).not.toContain('ANSWER-DESCRIPTION-731')
    expect(hidden).not.toContain('route-segment')
    expect(hidden).not.toContain('application-visual--answer')
    expect(revealed).toContain('ANSWER-SENTINEL-731')
    expect(revealed).toContain('ANSWER-DESCRIPTION-731')
    expect(revealed).not.toContain('? cm')
  })

  it('uses a uniform SVG viewport and semantic table markup', () => {
    const diagram = renderToStaticMarkup(
      createElement(ApplicationProblemVisual, { scene: validatedDiagram(), showAnswer: false }),
    )
    expect(diagram).toContain('preserveAspectRatio="xMidYMid meet"')

    const tableScene = parseApplicationVisualSceneV1({
      schemaVersion: 'application-visual-v1',
      surface: 'table',
      semantics: 'quantitative',
      caption: { before: { text: '비율표', disclosure: 'given' } },
      columns: [
        { before: { text: '부분', disclosure: 'identifier' } },
        { before: { text: '전체', disclosure: 'identifier' } },
      ],
      rows: [
        {
          key: 'a',
          cells: [
            {
              before: { text: '3', disclosure: 'given' },
              numericValue: 3,
              numericDisclosure: 'given',
            },
            {
              before: { text: '?', disclosure: 'identifier' },
              after: { text: '5', disclosure: 'intermediate' },
              numericValue: 5,
              numericDisclosure: 'intermediate',
            },
          ],
        },
      ],
      constraints: [
        {
          kind: 'table-ratio',
          numerator: { rowKey: 'a', columnIndex: 0 },
          denominator: { rowKey: 'a', columnIndex: 1 },
          expected: 0.6,
        },
      ],
    })
    const result = validateApplicationVisualScene(tableScene)
    if (!result.ok) throw new Error('table fixture should validate')

    const hidden = renderToStaticMarkup(
      createElement(ApplicationProblemVisual, { scene: result.scene, showAnswer: false }),
    )
    const revealed = renderToStaticMarkup(
      createElement(ApplicationProblemVisual, { scene: result.scene, showAnswer: true }),
    )
    expect(hidden).toContain('<table')
    expect(hidden).toContain('<caption>비율표</caption>')
    expect(hidden).not.toContain('>5</td>')
    expect(revealed).toContain('>5</td>')
    expect(revealed).not.toContain('>?</td>')
  })

  it('keeps an answer-only label out of the actual quantitative review representative until reveal', () => {
    const row = getApplicationProblemReviewData().rows.find((entry) => (
      entry.familyId === 'g5-perimeter-boundary-rebuild'
    ))
    const revealedScene = row?.visual.after.scene
    if (!row || !revealedScene || revealedScene.surface !== 'diagram') {
      throw new Error('expected the registered Grade 5 quantitative representative')
    }
    const answerOnlyLabel = revealedScene.labels.find((label) => label.content.after)?.content.after?.text
    if (!answerOnlyLabel) throw new Error('expected an answer-only visual label')

    const hidden = renderToStaticMarkup(
      createElement(ApplicationProblemVisual, { scene: row.visual.before.scene, showAnswer: false }),
    )
    const revealed = renderToStaticMarkup(
      createElement(ApplicationProblemVisual, { scene: row.visual.after.scene, showAnswer: true }),
    )

    expect(hidden).not.toContain(answerOnlyLabel)
    expect(revealed).toContain(answerOnlyLabel)
  })
})
