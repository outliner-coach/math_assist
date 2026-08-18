import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { getApplicationProblemReviewData } from '@/lib/problem-review'

import ApplicationProblemReviewClient from './ApplicationProblemReviewClient'

;(globalThis as typeof globalThis & { React: typeof React }).React = React

describe('ApplicationProblemReviewClient', () => {
  it('renders the all-grade read-only filters and both reproducible review cases', () => {
    const data = getApplicationProblemReviewData()
    const html = renderToStaticMarkup(React.createElement(ApplicationProblemReviewClient, { data }))

    expect(html).toContain('전 학년 응용문제 검수')
    for (const label of [
      '학년',
      '학기',
      '단원',
      '개념',
      '유형(family)',
      '인지영역',
      '추론 방식',
      '표현',
      '증명 방식',
      '출시 상태',
    ]) {
      expect(html).toContain(`aria-label="${label}"`)
    }
    expect(html).toContain('대표 사례')
    expect(html).toContain('경계 사례')
    expect(html).toContain('재현 정보')
    expect(html).toContain('독립 검산')
    expect(html).not.toMatch(/<button[^>]*>[^<]*(승인|저장|출시)/)
    expect(html).not.toContain('localStorage')
  })
})
