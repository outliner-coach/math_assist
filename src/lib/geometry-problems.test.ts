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
      'perimeter-rectangle-side-from-perimeter': 'b',
      'polygonarea-parallelogram-height': 'height',
      'polygonarea-triangle-height': 'height',
      'polygonarea-trapezoid-bottom': 'b',
      'polygonarea-rhombus-missing-diagonal': 'b',
      'cuboid-missing-width-from-edges': 'width',
      'cuboid-missing-depth-from-edges': 'depth',
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
})
