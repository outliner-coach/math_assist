import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import AppReliabilityShell, {
  resolveServiceWorkerScriptUrl,
  shouldRegisterServiceWorker,
} from './AppReliabilityShell'

describe('shouldRegisterServiceWorker', () => {
  it('registers only in production with a service-worker-capable navigator', () => {
    expect(shouldRegisterServiceWorker({ serviceWorker: {} }, 'production')).toBe(true)
    expect(shouldRegisterServiceWorker({ serviceWorker: {} }, 'development')).toBe(false)
    expect(shouldRegisterServiceWorker({}, 'production')).toBe(false)
    expect(shouldRegisterServiceWorker(undefined, 'production')).toBe(false)
    expect(shouldRegisterServiceWorker(null, 'production')).toBe(false)
  })
})

describe('resolveServiceWorkerScriptUrl', () => {
  it('points at the static worker under the configured base path', () => {
    expect(resolveServiceWorkerScriptUrl('/math_assist')).toBe('/math_assist/sw.js')
    expect(resolveServiceWorkerScriptUrl(undefined)).toBe('/sw.js')
  })
})

describe('AppReliabilityShell markup', () => {
  it('renders children unchanged and no visual output of its own', () => {
    const markup = renderToStaticMarkup(
      createElement(AppReliabilityShell, {}, createElement('p', {}, '학습 화면')),
    )
    expect(markup).toContain('<p>학습 화면</p>')
    expect(markup.startsWith('<p>')).toBe(true)
    expect(markup).not.toContain('section')
    expect(markup).not.toContain('role=')
  })
})
