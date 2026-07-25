import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import VisualAid from './VisualAid'

describe('VisualAid', () => {
  it('renders quantitative prism and net concept aids through the shared geometry model', () => {
    const prism = renderToStaticMarkup(createElement(VisualAid, {
      aid: {
        type: 'poly-solid',
        semantics: 'quantitative',
        kind: 'prism',
        baseSides: 5,
      },
    }))
    const net = renderToStaticMarkup(createElement(VisualAid, {
      aid: {
        type: 'prism-net',
        semantics: 'quantitative',
        baseSides: 5,
        lateralFaces: 5,
        baseCount: 2,
      },
    }))

    expect(prism).toContain('geometry-visual-poly-solid')
    expect(prism.match(/data-solid-base=/g)).toHaveLength(2)
    expect(net).toContain('geometry-visual-prism-net')
    expect(net.match(/data-net-lateral-face=/g)).toHaveLength(5)
  })
})
