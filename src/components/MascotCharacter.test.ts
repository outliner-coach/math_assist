import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import MascotCharacter from './MascotCharacter'

describe('MascotCharacter', () => {
  it('uses the base path and the requested state frame', () => {
    const previousBasePath = process.env.NEXT_PUBLIC_BASE_PATH
    process.env.NEXT_PUBLIC_BASE_PATH = '/math_assist'

    const markup = renderToStaticMarkup(createElement(MascotCharacter, {
      mascotId: 'moa',
      state: 'hint',
      mode: 'companion',
    }))

    expect(markup).toContain('data-mascot-id="moa"')
    expect(markup).toContain('data-mascot-state="hint"')
    expect(markup).toContain('data-mascot-mode="companion"')
    expect(markup).toContain('/math_assist/assets/mascots/moa-states.png')
    expect(markup).toContain('background-position:50% center')
    expect(markup).toContain('모아가 힌트를 알려 주는 모습')

    process.env.NEXT_PUBLIC_BASE_PATH = previousBasePath
  })
})
