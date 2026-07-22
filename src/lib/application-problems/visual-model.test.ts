import { describe, expect, it } from 'vitest'

import {
  ApplicationVisualModelError,
  parseApplicationVisualSceneV1,
} from './visual-model'

function diagramScene() {
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: 120, height: 80 },
    scale: { x: 1, y: 1 },
    description: {
      before: { text: '길이와 넓이를 나타낸 그림', disclosure: 'given' },
      after: { text: 'ANSWER-DESCRIPTION-731', disclosure: 'solution' },
    },
    primitives: [
      {
        key: 'route-segment',
        kind: 'line',
        x1: 10,
        y1: 15,
        x2: 50,
        y2: 15,
        disclosure: 'given',
        styleRole: 'primary',
        emphasis: 'normal',
      },
      {
        key: 'area-block',
        kind: 'rect',
        x: 10,
        y: 30,
        width: 20,
        height: 10,
        disclosure: 'given',
        styleRole: 'secondary',
        emphasis: 'normal',
      },
      {
        key: 'comparison-block',
        kind: 'polygon',
        points: [
          { x: 60, y: 30 },
          { x: 80, y: 30 },
          { x: 80, y: 50 },
          { x: 60, y: 50 },
        ],
        disclosure: 'given',
        styleRole: 'muted',
        emphasis: 'normal',
      },
    ],
    labels: [
      {
        key: 'route-label',
        targetKey: 'route-segment',
        x: 30,
        y: 15,
        content: {
          before: { text: '? cm', disclosure: 'identifier' },
          after: { text: 'ANSWER-SENTINEL-731', disclosure: 'solution' },
        },
        styleRole: 'primary',
      },
    ],
    constraints: [
      { kind: 'segment-length', primitiveKey: 'route-segment', expected: 40 },
      { kind: 'area', primitiveKey: 'area-block', expected: 200 },
      {
        kind: 'ratio',
        numeratorKey: 'area-block',
        denominatorKey: 'comparison-block',
        metric: 'area',
        expected: 0.5,
      },
      {
        kind: 'topology',
        firstKey: 'area-block',
        secondKey: 'comparison-block',
        relation: 'disjoint',
      },
    ],
  }
}

describe('application visual scene parser', () => {
  it('parses the exact versioned diagram contract', () => {
    const scene = parseApplicationVisualSceneV1(diagramScene())

    expect(scene.schemaVersion).toBe('application-visual-v1')
    expect(scene.surface).toBe('diagram')
    expect(scene.primitives).toHaveLength(3)
  })

  it('rejects unsupported versions, arbitrary renderer props, and non-finite coordinates', () => {
    const unsupported = { ...diagramScene(), schemaVersion: 'application-visual-v2' }
    expect(() => parseApplicationVisualSceneV1(unsupported)).toThrow(ApplicationVisualModelError)

    const injected = diagramScene()
    ;(injected.primitives[0] as Record<string, unknown>).dataAnswer = '731'
    expect(() => parseApplicationVisualSceneV1(injected)).toThrow(ApplicationVisualModelError)

    const nonFinite = diagramScene()
    ;(nonFinite.primitives[0] as Record<string, unknown>).x2 = Number.POSITIVE_INFINITY
    expect(() => parseApplicationVisualSceneV1(nonFinite)).toThrow(ApplicationVisualModelError)
  })

  it('parses a semantic table with independently checkable numeric cells', () => {
    const table = parseApplicationVisualSceneV1({
      schemaVersion: 'application-visual-v1',
      surface: 'table',
      semantics: 'quantitative',
      caption: {
        before: { text: '두 모둠의 비율', disclosure: 'given' },
      },
      columns: [
        { before: { text: '모둠', disclosure: 'identifier' } },
        { before: { text: '성공', disclosure: 'identifier' } },
        { before: { text: '전체', disclosure: 'identifier' } },
      ],
      rows: [
        {
          key: 'group-a',
          cells: [
            { before: { text: '가', disclosure: 'identifier' } },
            { before: { text: '3', disclosure: 'given' }, numericValue: 3 },
            { before: { text: '5', disclosure: 'given' }, numericValue: 5 },
          ],
        },
      ],
      constraints: [
        {
          kind: 'table-ratio',
          numerator: { rowKey: 'group-a', columnIndex: 1 },
          denominator: { rowKey: 'group-a', columnIndex: 2 },
          expected: 0.6,
        },
      ],
    })

    expect(table.surface).toBe('table')
    expect(table.rows[0].cells).toHaveLength(3)
  })
})

export { diagramScene }
