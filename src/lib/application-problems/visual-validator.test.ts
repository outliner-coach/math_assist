import { describe, expect, it } from 'vitest'

import type { GeneratedApplicationVisualV1 } from './contracts'
import { parseApplicationVisualSceneV1 } from './visual-model'
import {
  createApplicationVisualResolver,
  resolveApplicationVisual,
  validateApplicationVisualScene,
} from './visual-validator'
import { diagramScene } from './visual-model.test'

function requiredVisual(mathModel: unknown): GeneratedApplicationVisualV1 {
  return {
    role: 'required',
    semantics: 'quantitative',
    generatorId: 'visual-test-scene',
    answerCritical: true,
    generatorVersion: 1,
    mathModel: mathModel as never,
  }
}

describe('application visual validation', () => {
  it('validates independently measured length, area, ratio, topology, and label containment', () => {
    const result = validateApplicationVisualScene(
      parseApplicationVisualSceneV1(diagramScene()),
    )

    expect(result.ok).toBe(true)
  })

  it.each([
    ['zero geometry', (scene: ReturnType<typeof diagramScene>) => {
      ;(scene.primitives[1] as { width: number }).width = 0
    }, 'zero_geometry'],
    ['distorted scale', (scene: ReturnType<typeof diagramScene>) => {
      scene.scale.y = 2
    }, 'non_uniform_scale'],
    ['wrong declared length', (scene: ReturnType<typeof diagramScene>) => {
      ;(scene.constraints[0] as { expected: number }).expected = 39
    }, 'measurement_mismatch'],
    ['wrong declared area', (scene: ReturnType<typeof diagramScene>) => {
      ;(scene.constraints[1] as { expected: number }).expected = 201
    }, 'measurement_mismatch'],
    ['wrong declared ratio', (scene: ReturnType<typeof diagramScene>) => {
      ;(scene.constraints[2] as { expected: number }).expected = 0.75
    }, 'ratio_mismatch'],
    ['wrong topology', (scene: ReturnType<typeof diagramScene>) => {
      ;(scene.constraints[3] as { relation: string }).relation = 'overlap'
    }, 'topology_mismatch'],
    ['label outside target', (scene: ReturnType<typeof diagramScene>) => {
      scene.labels[0].x = 100
    }, 'label_outside_target'],
  ])('rejects %s', (_name, mutate, expectedCode) => {
    const scene = diagramScene()
    mutate(scene)
    const parsed = parseApplicationVisualSceneV1(scene)
    const result = validateApplicationVisualScene(parsed)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.map((issue) => issue.code)).toContain(expectedCode)
  })

  it('distinguishes support omission from required blocking without downgrading quantitative scenes', () => {
    const invalid = diagramScene()
    ;(invalid.constraints[0] as { expected: number }).expected = 99

    const blocked = resolveApplicationVisual(requiredVisual(invalid))
    expect(blocked.status).toBe('blocked')
    if (blocked.status === 'blocked') expect(blocked.semantics).toBe('quantitative')

    const omitted = resolveApplicationVisual({
      ...requiredVisual(invalid),
      role: 'support',
      answerCritical: false,
    })
    expect(omitted.status).toBe('omitted')
  })

  it('applies a family validator without allowing it to bypass common checks', () => {
    const familyFailure = resolveApplicationVisual(requiredVisual(diagramScene()), {
      familyValidator: () => [
        { code: 'family_topology_failure', path: 'scene', message: 'family topology failed' },
      ],
    })
    expect(familyFailure.status).toBe('blocked')

    const commonFailure = diagramScene()
    ;(commonFailure.constraints[0] as { expected: number }).expected = 99
    const cannotBypass = resolveApplicationVisual(requiredVisual(commonFailure), {
      familyValidator: () => [],
    })
    expect(cannotBypass.status).toBe('blocked')

    const resolver = createApplicationVisualResolver({})
    expect(resolver(requiredVisual(diagramScene())).status).toBe('blocked')
  })

  it('rejects a self-intersecting polygon and an inconsistent required policy', () => {
    const selfIntersecting = diagramScene()
    ;(selfIntersecting.primitives[2] as { points: Array<{ x: number; y: number }> }).points = [
      { x: 60, y: 30 },
      { x: 80, y: 50 },
      { x: 60, y: 50 },
      { x: 80, y: 30 },
    ]
    const invalidShape = validateApplicationVisualScene(
      parseApplicationVisualSceneV1(selfIntersecting),
    )
    expect(invalidShape.ok).toBe(false)
    if (!invalidShape.ok) {
      expect(invalidShape.issues.map((entry) => entry.code)).toEqual(
        expect.arrayContaining(['invalid_polygon', 'zero_geometry']),
      )
    }

    const policyFailure = resolveApplicationVisual({
      ...requiredVisual(diagramScene()),
      answerCritical: false,
    })
    expect(policyFailure.status).toBe('blocked')
  })

  it('rejects malformed table dimensions and incorrect table ratios', () => {
    const malformed = {
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
            { before: { text: '3', disclosure: 'given' }, numericValue: 3 },
          ],
        },
      ],
      constraints: [],
    }
    expect(() => parseApplicationVisualSceneV1(malformed)).toThrow()

    const wrongRatio = {
      ...malformed,
      rows: [
        {
          key: 'a',
          cells: [
            { before: { text: '3', disclosure: 'given' }, numericValue: 3 },
            { before: { text: '5', disclosure: 'given' }, numericValue: 5 },
          ],
        },
      ],
      constraints: [
        {
          kind: 'table-ratio',
          numerator: { rowKey: 'a', columnIndex: 0 },
          denominator: { rowKey: 'a', columnIndex: 1 },
          expected: 0.7,
        },
      ],
    }
    const result = validateApplicationVisualScene(parseApplicationVisualSceneV1(wrongRatio))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.map((issue) => issue.code)).toContain('ratio_mismatch')
  })

  it('distinguishes aligned rectangle overlap from boundary-only touching', () => {
    const scene = diagramScene()
    scene.primitives = [
      {
        key: 'first',
        kind: 'rect',
        x: 10,
        y: 10,
        width: 30,
        height: 20,
        disclosure: 'given',
        styleRole: 'primary',
        emphasis: 'normal',
      },
      {
        key: 'second',
        kind: 'rect',
        x: 25,
        y: 10,
        width: 30,
        height: 20,
        disclosure: 'given',
        styleRole: 'secondary',
        emphasis: 'normal',
      },
    ]
    scene.labels = []
    scene.constraints = [
      { kind: 'area', primitiveKey: 'first', expected: 600 },
      { kind: 'area', primitiveKey: 'second', expected: 600 },
      { kind: 'topology', firstKey: 'first', secondKey: 'second', relation: 'overlap' },
    ]
    expect(validateApplicationVisualScene(parseApplicationVisualSceneV1(scene)).ok).toBe(true)

    ;(scene.primitives[1] as { x: number }).x = 40
    ;(scene.constraints[2] as { relation: string }).relation = 'touching'
    expect(validateApplicationVisualScene(parseApplicationVisualSceneV1(scene)).ok).toBe(true)
  })
})
