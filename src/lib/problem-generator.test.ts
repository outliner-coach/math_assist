import { describe, it, expect } from 'vitest'
import { generateProblems } from './problem-generator'
import type { ProblemTemplate } from './types'

function makeTemplate(overrides: Partial<ProblemTemplate>): ProblemTemplate {
  return {
    id: 'tmpl-1',
    concept_id: 'c-1',
    type: 'number',
    difficulty: 1,
    set_id: 'A',
    param_schema: { n: { min: 2, max: 20 } },
    prompt_template: `문제 ${overrides.id ?? 'tmpl-1'}: {{n}}`,
    solver_rule: 'n',
    solution_steps_template: ['{{n}}'],
    ...overrides
  }
}

describe('generateProblems', () => {
  it('attaches a feasible quantitative region model to three-shape overlap problems', () => {
    const template = makeTemplate({
      id: 'three-shape-overlap',
      difficulty: 1,
      visual_template: {
        type: 'three_shape_overlap',
        semantics: 'quantitative',
        props: {
          shapeArea: 29,
          exclusiveAreas: [18, 20, 22],
          tripleOverlap: 5,
          unit: 'cm'
        }
      }
    })

    const [problem] = generateProblems([template], {
      count: 1,
      setId: 'A',
      difficultyMix: { 1: 1, 2: 0, 3: 0 },
      seed: 7
    })

    expect(problem.visual).toMatchObject({
      type: 'three_shape_overlap',
      semantics: 'quantitative',
      model: {
        regions: { abOnly: 4, acOnly: 2, bcOnly: 0, abc: 5 },
        shapeAreas: [29, 29, 29],
        unionArea: 71
      }
    })
  })

  it('evaluates numeric expressions inside a problem visual without exposing derived answers', () => {
    const templates: ProblemTemplate[] = Array.from({ length: 10 }, (_, index) =>
      makeTemplate({
        id: `visual-${index}`,
        difficulty: index < 4 ? 1 : index < 8 ? 2 : 3,
        visual_template: {
          type: 'l_shape',
          props: {
            width: '{{n + 4}}',
            height: '{{n}}',
            notchWidth: 3,
            notchHeight: '{{n / 2}}'
          }
        }
      })
    )

    const [problem] = generateProblems(templates, { count: 10, setId: 'A', seed: 7 })

    expect(problem.visual?.type).toBe('l_shape')
    if (problem.visual?.type === 'l_shape') {
      expect(problem.visual.props.width).toBe(problem.params.n + 4)
      expect(problem.visual.props.height).toBe(problem.params.n)
      expect(problem.visual.props.notchWidth).toBe(3)
      expect(problem.visual.props).not.toHaveProperty('answer')
    }
  })

  it('selects problems by set and difficulty mix', () => {
    const templates: ProblemTemplate[] = [
      // set A
      makeTemplate({ id: 'a1', difficulty: 1, set_id: 'A' }),
      makeTemplate({ id: 'a2', difficulty: 1, set_id: 'A' }),
      makeTemplate({ id: 'a3', difficulty: 1, set_id: 'A' }),
      makeTemplate({ id: 'a4', difficulty: 1, set_id: 'A' }),
      makeTemplate({ id: 'a5', difficulty: 2, set_id: 'A' }),
      makeTemplate({ id: 'a6', difficulty: 2, set_id: 'A' }),
      makeTemplate({ id: 'a7', difficulty: 2, set_id: 'A' }),
      makeTemplate({ id: 'a8', difficulty: 2, set_id: 'A' }),
      makeTemplate({ id: 'a9', difficulty: 3, set_id: 'A' }),
      makeTemplate({ id: 'a10', difficulty: 3, set_id: 'A' }),
      // set B
      makeTemplate({ id: 'b1', difficulty: 1, set_id: 'B' }),
    ]
    const difficultyById = Object.fromEntries(templates.map(t => [t.id, t.difficulty]))

    const problems = generateProblems(templates, { count: 10, setId: 'A', seed: 123 })
    expect(problems).toHaveLength(10)
    const counts = problems.reduce((acc, p) => {
      const diff = difficultyById[p.templateId]
      acc[diff] += 1
      acc.sets[p.setId] = (acc.sets[p.setId] ?? 0) + 1
      return acc
    }, { 1: 0, 2: 0, 3: 0, sets: {} as Record<string, number> })

    expect(counts.sets.A).toBe(10)
    expect(counts[1]).toBe(4)
    expect(counts[2]).toBe(4)
    expect(counts[3]).toBe(2)
  })

  it('throws when templates are insufficient for difficulty mix', () => {
    const templates: ProblemTemplate[] = [
      makeTemplate({ id: 'a1', difficulty: 1, set_id: 'A' }),
      makeTemplate({ id: 'a2', difficulty: 2, set_id: 'A' }),
      makeTemplate({ id: 'a3', difficulty: 3, set_id: 'A' }),
    ]

    expect(() => generateProblems(templates, { count: 10, setId: 'A' })).toThrow()
  })

  it('regenerates params to avoid duplicate rendered prompts in one session', () => {
    const templates: ProblemTemplate[] = [
      makeTemplate({ id: 'a1', difficulty: 1, set_id: 'A', prompt_template: '값은 {{n}}' }),
      makeTemplate({ id: 'a2', difficulty: 1, set_id: 'A', prompt_template: '값은 {{n}}' }),
    ]

    const problems = generateProblems(templates, {
      count: 2,
      setId: 'A',
      seed: 7,
      difficultyMix: { 1: 2, 2: 0, 3: 0 }
    })

    expect(new Set(problems.map(problem => problem.prompt)).size).toBe(2)
  })
})
