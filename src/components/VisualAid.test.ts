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

  it('renders round solids and cylinder nets through the shared geometry model', () => {
    const cylinder = renderToStaticMarkup(createElement(VisualAid, {
      aid: {
        type: 'round-solid',
        semantics: 'quantitative',
        kind: 'cylinder',
        copies: 1,
      },
    }))
    const net = renderToStaticMarkup(createElement(VisualAid, {
      aid: {
        type: 'cylinder-net',
        semantics: 'quantitative',
        copies: 1,
        circleCount: 2,
        rectangleCount: 1,
      },
    }))

    expect(cylinder).toContain('geometry-visual-round-solid')
    expect(cylinder.match(/data-round-base=/g)).toHaveLength(2)
    expect(net).toContain('geometry-visual-cylinder-net')
    expect(net.match(/data-cylinder-net-circle=/g)).toHaveLength(2)
  })

  it('renders a cube stack through the shared quantitative geometry model', () => {
    const html = renderToStaticMarkup(createElement(VisualAid, {
      aid: {
        type: 'cube-stack',
        semantics: 'quantitative',
        heights: [[3, 1], [2, 0]],
        mode: 'all-views',
      },
    }))

    expect(html).toContain('geometry-visual-cube-stack')
    expect(html.match(/data-top-occupied=/g)).toHaveLength(3)
    expect(html.match(/data-front-cell=/g)).toHaveLength(4)
    expect(html.match(/data-side-cell=/g)).toHaveLength(5)
  })

  it('renders a measured circle through the shared quantitative geometry model', () => {
    const html = renderToStaticMarkup(createElement(VisualAid, {
      aid: {
        type: 'circle-measurement',
        semantics: 'quantitative',
        radius: 4,
        pi: 3.14,
        focus: 'area',
        measureLabel: 'radius',
        copies: 1,
      },
    }))

    expect(html).toContain('geometry-visual-circle-measurement')
    expect(html.match(/data-circle-copy=/g)).toHaveLength(1)
    expect(html).toContain('반지름 4cm')
    expect(html).not.toContain('50.24cm²')
  })

  it('renders a quantitative cuboid through the shared geometry model', () => {
    const html = renderToStaticMarkup(createElement(VisualAid, {
      aid: {
        type: 'cuboid',
        semantics: 'quantitative',
        width: 6,
        height: 3,
        depth: 4,
        focus: 'faces',
      },
    }))

    expect(html).toContain('geometry-visual-cuboid')
    expect(html.match(/data-cuboid-face=/g)).toHaveLength(3)
    expect(html).toContain('6cm')
    expect(html).toContain('3cm')
    expect(html).toContain('4cm')
    expect(html).not.toContain('108cm²')
  })

  it('renders a ratio graph concept aid through the shared percentage model', () => {
    const html = renderToStaticMarkup(createElement(VisualAid, {
      aid: {
        type: 'ratio_graph',
        semantics: 'quantitative',
        props: {
          caption: '희망 체험 활동',
          kind: 'circle',
          segments: [
            { label: '과학', percent: 40 },
            { label: '미술', percent: 30 },
            { label: '체육', percent: 30 },
          ],
        },
      },
    }))

    expect(html).toContain('problem-diagram-ratio-graph')
    expect(html.match(/data-ratio-circle-segment=/g)).toHaveLength(3)
    expect(html).toContain('40%')
    expect(html).not.toContain('data-answer')
  })
})
