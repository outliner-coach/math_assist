import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import MathText from './MathText'

describe('MathText', () => {
  it('renders text and KaTeX markup during server render', () => {
    const html = renderToStaticMarkup(
      createElement(MathText, null, '분수 $\\frac{1}{2}$ 를 읽어 보세요.')
    )

    expect(html).toContain('분수')
    expect(html).toContain('katex')
    expect(html).toContain('mfrac')
    expect(html).toContain('읽어 보세요')
  })
})
