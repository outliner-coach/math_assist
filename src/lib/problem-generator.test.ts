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
    param_schema: { n: { min: 2, max: 3 } },
    prompt_template: '{{n}}',
    solver_rule: 'n',
    solution_steps_template: ['{{n}}'],
    ...overrides
  }
}

describe('generateProblems', () => {
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
})
