import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

import { cuboidOppositeFace, geometryOption, geometryOptionIndex, symmetryAxisCount } from './math'
import { generateProblems } from './problem-generator'
import type { ProblemTemplate } from './types'

describe('grade 5 geometry problem core', () => {
  const banks = [
    ['perimeter', 'unit-5-1-perimeter-area'],
    ['polygonarea', 'unit-5-1-perimeter-area'],
    ['congruence', 'unit-5-2-congruence-symmetry'],
    ['symmetry', 'unit-5-2-congruence-symmetry'],
    ['cuboid', 'unit-5-2-cuboid'],
    ['cuboidnet', 'unit-5-2-cuboid'],
  ] as const

  function readBank(name: string): ProblemTemplate[] {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'templates', `${name}.json`), 'utf8')
    )
  }

  it('keeps geometry choices deterministic and unique', () => {
    for (const kind of [1, 2, 3]) {
      for (let variant = 1; variant <= 12; variant++) {
        const labels = [0, 1, 2, 3].map(offset => geometryOption(kind, variant, offset))
        expect(new Set(labels).size).toBe(4)
        expect(labels[0]).toBe(['가', '나', '다', '라'][geometryOptionIndex(kind, variant) - 1])
      }
    }
  })

  it('returns elementary symmetry and cuboid invariants', () => {
    expect([1, 2, 3, 4, 5, 6].map(symmetryAxisCount)).toEqual([4, 2, 3, 1, 2, 0])
    expect([1, 2, 3, 4, 5, 6].map(cuboidOppositeFace)).toEqual([6, 3, 2, 5, 4, 1])
  })

  it('resolves visual templates from the same parameters as the answer', () => {
    const templates: ProblemTemplate[] = Array.from({ length: 10 }, (_, index) => ({
      id: `geometry-${index}`,
      concept_id: 'perimeter-001',
      type: 'number',
      difficulty: index < 4 ? 1 : index < 8 ? 2 : 3,
      set_id: 'A',
      param_schema: { width: { min: 8, max: 8 }, height: { min: 5, max: 5 } },
      prompt_template: `도형 ${index + 1}: 가로 {{width}}cm, 세로 {{height}}cm인 직사각형의 둘레는?`,
      solver_rule: '2 * (width + height)',
      solution_steps_template: ['둘레는 {{2 * (width + height)}}cm입니다.'],
      problem_family: `family-${index}`,
      visual_template: {
        type: 'polygon',
        shape: 'rectangle',
        a: '{{width}}',
        b: '{{height}}',
        unit: 'cm',
      },
    }))

    const problems = generateProblems(templates, { setId: 'A', seed: 5 })

    expect(problems).toHaveLength(10)
    expect(problems[0].correctAnswer).toBe('26')
    expect(problems[0].visual).toMatchObject({ type: 'polygon', a: 8, b: 5 })
    expect(problems[0].problemFamily).toMatch(/^family-/)
  })

  it('ships at least twenty distinct problem families per geometry unit', () => {
    const familiesByUnit = new Map<string, Set<string>>()

    for (const [name, unitId] of banks) {
      const templates = readBank(name)
      expect(templates).toHaveLength(30)
      const families = familiesByUnit.get(unitId) ?? new Set<string>()
      templates.forEach(template => families.add(template.problem_family ?? ''))
      familiesByUnit.set(unitId, families)

      for (const setId of ['A', 'B', 'C'] as const) {
        const setTemplates = templates.filter(template => template.set_id === setId)
        expect(setTemplates).toHaveLength(10)
        expect(setTemplates.filter(template => template.difficulty === 1)).toHaveLength(4)
        expect(setTemplates.filter(template => template.difficulty === 2)).toHaveLength(4)
        expect(setTemplates.filter(template => template.difficulty === 3)).toHaveLength(2)
      }
    }

    expect(Object.fromEntries(
      Array.from(familiesByUnit, ([unitId, families]) => [unitId, families.size])
    )).toEqual({
      'unit-5-1-perimeter-area': 20,
      'unit-5-2-congruence-symmetry': 20,
      'unit-5-2-cuboid': 20,
    })
  })

  it('marks every reverse geometry measurement as unknown before submission', () => {
    const expectedUnknownMeasurements = {
      'perimeter-rectangle-width-from-area': 'a',
      'perimeter-rectangle-height-from-area': 'b',
      'polygonarea-parallelogram-height': 'height',
      'polygonarea-triangle-height': 'height',
      'polygonarea-trapezoid-bottom': 'b',
      'cuboid-missing-width-from-edges': 'width',
    } as const

    const geometryTemplates = banks.flatMap(([name]) => readBank(name))
    const gatedFamilies = new Set(
      geometryTemplates
        .filter(template => (template.visual_template as { unknownMeasurement?: string }).unknownMeasurement)
        .map(template => template.problem_family)
    )
    expect(gatedFamilies).toEqual(new Set(Object.keys(expectedUnknownMeasurements)))

    for (const [family, measurement] of Object.entries(expectedUnknownMeasurements)) {
      const familyTemplates = geometryTemplates.filter(template => template.problem_family === family)
      expect(familyTemplates).toHaveLength(3)
      expect(familyTemplates.every(template => (
        template.visual_template as { unknownMeasurement?: string }
      ).unknownMeasurement === measurement)).toBe(true)
    }
  })

  it('keeps every cuboid visual focused on only the measurements the task uses', () => {
    const expectations = {
      'cuboid-face-count': { focus: 'face', dimensions: [] },
      'cuboid-edge-count': { focus: 'edge', dimensions: [] },
      'cuboid-vertex-count': { focus: 'vertex', dimensions: [] },
      'cuboid-edges-at-vertex': { focus: 'edges-at-vertex', dimensions: [] },
      'cuboid-total-edge-length': {
        focus: 'total-edge-length',
        dimensions: ['depth', 'height', 'width'],
      },
      'cuboid-missing-width-from-edges': {
        focus: 'total-edge-length',
        dimensions: ['depth', 'height', 'width'],
      },
      'cuboid-front-face-area': {
        focus: 'front-face',
        dimensions: ['height', 'width'],
      },
      'cuboid-front-face-perimeter': {
        focus: 'front-face',
        dimensions: ['height', 'width'],
      },
      'cuboid-half-edge-count-error': {
        focus: 'total-edge-length',
        dimensions: ['depth', 'height', 'width'],
      },
      'cuboid-one-of-each-face-area-error': {
        focus: 'surface-area',
        dimensions: ['depth', 'height', 'width'],
      },
    } as const
    const templates = readBank('cuboid')

    for (const template of templates) {
      const expected = expectations[template.problem_family as keyof typeof expectations]
      const visual = template.visual_template as Record<string, unknown>
      const dimensionKeys = ['depth', 'height', 'width'].filter(key => key in visual).sort()

      expect(expected, template.id).toBeDefined()
      expect(visual.focus, template.id).toBe(expected.focus)
      expect(dimensionKeys, template.id).toEqual([...expected.dimensions])
      expect(Object.keys(template.param_schema).sort(), template.id).toEqual(
        expected.dimensions.map(dimension => (
          dimension === 'width' ? 'w' : dimension === 'height' ? 'h' : 'd'
        )).sort()
      )
    }
  })

  it('introduces A, B, and C consistently in every three-shape overlap prompt', () => {
    const templates = readBank('area').filter(template => (
      template.problem_family === 'triple-overlap-inclusion'
    ))
    const expectedSolver = (
      '(3 * (e + 8 + k) - e - (e + 2) - (e + 4) - 3 * (2 + k)) / 2 + (2 + k)'
    )

    expect(templates).toHaveLength(3)
    for (const template of templates) {
      expect(template.prompt_template).toMatch(
        /^파랑 ● (?:도형|색종이) A, 초록 ▲ (?:도형|색종이) B, 분홍 ■ (?:도형|색종이) C/
      )
      expect(template.prompt_template).toContain('A만 있는 부분은 {{e}} cm²')
      expect(template.prompt_template).toContain('B만 있는 부분은 {{e + 2}} cm²')
      expect(template.prompt_template).toContain('C만 있는 부분은 {{e + 4}} cm²')
      expect(template.prompt_template).toContain('A, B, C가 모두 겹친 부분은 {{2 + k}} cm²')
      expect(template.solver_rule).toBe(expectedSolver)
      expect(template.visual_template).toEqual({
        type: 'three_shape_overlap',
        semantics: 'quantitative',
        props: {
          shapeArea: '{{e + 8 + k}}',
          exclusiveAreas: ['{{e}}', '{{e + 2}}', '{{e + 4}}'],
          tripleOverlap: '{{2 + k}}',
          unit: 'cm',
        },
      })
    }
  })

  it('generates every geometry practice set with unique prompts and safe visuals', () => {
    for (const [name] of banks) {
      const templates = readBank(name)
      for (const setId of ['A', 'B', 'C'] as const) {
        for (const seed of [11, 29, 47]) {
          const problems = generateProblems(templates, { count: 10, setId, seed })
          expect(new Set(problems.map(problem => problem.prompt)).size).toBe(10)
          expect(problems.every(problem => Boolean(problem.visual))).toBe(true)
          expect(problems.every(problem => Boolean(problem.problemFamily))).toBe(true)
          for (const problem of problems) {
            expect(JSON.stringify(problem.visual)).not.toMatch(/"(answer|correct|result|target|product)"/i)
          }
        }
      }
    }
  })

  it('generates every cuboid-net set across a broad seed range', () => {
    const templates = readBank('cuboidnet')

    for (const setId of ['A', 'B', 'C'] as const) {
      for (let seed = 0; seed < 200; seed += 1) {
        const problems = generateProblems(templates, { count: 10, setId, seed })
        expect(new Set(problems.map(problem => problem.prompt)).size).toBe(10)
      }
    }
  })
})
