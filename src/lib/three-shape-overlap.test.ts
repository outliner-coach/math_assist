import { describe, expect, it } from 'vitest'

import { buildThreeShapeOverlapModel } from './three-shape-overlap'

describe('buildThreeShapeOverlapModel', () => {
  it('derives every exclusive intersection from the same three shape totals', () => {
    const model = buildThreeShapeOverlapModel({
      shapeArea: 29,
      exclusiveAreas: [18, 20, 22],
      tripleOverlap: 5
    })

    expect(model.regions).toEqual({
      aOnly: 18,
      bOnly: 20,
      cOnly: 22,
      abOnly: 4,
      acOnly: 2,
      bcOnly: 0,
      abc: 5
    })
    expect(model.shapeAreas).toEqual([29, 29, 29])
    expect(model.unionArea).toBe(71)
  })

  it('rejects impossible or non-cell-based region data', () => {
    expect(() => buildThreeShapeOverlapModel({
      shapeArea: 10,
      exclusiveAreas: [9, 1, 1],
      tripleOverlap: 2
    })).toThrow(/negative/i)

    expect(() => buildThreeShapeOverlapModel({
      shapeArea: 10.5,
      exclusiveAreas: [4, 4, 4],
      tripleOverlap: 1
    })).toThrow(/integer/i)
  })
})
