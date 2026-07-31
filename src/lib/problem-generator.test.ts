import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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
  function readTemplates(name: string, conceptId: string): ProblemTemplate[] {
    const templates = JSON.parse(readFileSync(
      join(process.cwd(), 'public', 'data', 'templates', `${name}.json`),
      'utf8',
    )) as ProblemTemplate[]
    return templates.filter(template => template.concept_id === conceptId)
  }

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

  it('carries reviewed blueprint metadata without deriving it from difficulty', () => {
    const reviewed = makeTemplate({
      id: 'reviewed-blueprint',
      difficulty: 3,
      problem_family: 'inverse-area',
      blueprint: {
        problemFamily: 'inverse-area',
        cognitiveDomain: 'applying',
        reasoningPattern: 'inverse',
        primaryStandard: '6수03-06',
        connectedStandards: ['6수01-11'],
        representations: ['text', 'equation'],
        contextType: 'pure_math',
        estimatedSteps: 3,
        readingLoad: 'medium'
      }
    })
    const unreviewed = makeTemplate({
      id: 'unreviewed-blueprint',
      difficulty: 3
    })

    const [reviewedProblem] = generateProblems([reviewed], {
      count: 1,
      setId: 'A',
      difficultyMix: { 1: 0, 2: 0, 3: 1 },
      seed: 5
    })
    const [unreviewedProblem] = generateProblems([unreviewed], {
      count: 1,
      setId: 'A',
      difficultyMix: { 1: 0, 2: 0, 3: 1 },
      seed: 5
    })

    expect(reviewedProblem.blueprint).toEqual(reviewed.blueprint)
    expect(reviewedProblem.problemFamily).toBe('inverse-area')
    expect(unreviewedProblem.blueprint).toBeUndefined()
    expect(unreviewedProblem).not.toHaveProperty('cognitiveDomain')
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

  it.each([
    { count: 5 as const, expected: { 1: 2, 2: 2, 3: 1 } },
    { count: 10 as const, expected: { 1: 4, 2: 4, 3: 2 } },
  ])('uses the Grade 5/6 $count-item K/A/R mix for every set', ({ count, expected }) => {
    const templates: ProblemTemplate[] = (['A', 'B', 'C'] as const).flatMap((setId) =>
      Array.from({ length: 10 }, (_, index) => makeTemplate({
        id: `${setId.toLowerCase()}-${index + 1}`,
        set_id: setId,
        difficulty: index < 4 ? 1 : index < 8 ? 2 : 3,
      }))
    )
    const difficultyById = Object.fromEntries(templates.map(template => [
      template.id,
      template.difficulty,
    ]))

    for (const setId of ['A', 'B', 'C'] as const) {
      const problems = generateProblems(templates, { count, setId, seed: 20260731 })
      const mix = problems.reduce((counts, problem) => {
        counts[difficultyById[problem.templateId]] += 1
        return counts
      }, { 1: 0, 2: 0, 3: 0 })

      expect(problems).toHaveLength(count)
      expect(problems.every(problem => problem.setId === setId)).toBe(true)
      expect(mix).toEqual(expected)
    }
  })

  it.each([
    {
      grade: 5,
      bank: 'cuboidnet',
      conceptId: 'cuboidnet-001',
      setId: 'A' as const,
      seed: 19,
    },
    {
      grade: 5,
      bank: 'possibility',
      conceptId: 'possibility-001',
      setId: 'B' as const,
      seed: 7,
    },
    {
      grade: 5,
      bank: 'divisor',
      conceptId: 'divisor-001',
      setId: 'C' as const,
      seed: 31,
    },
    {
      grade: 6,
      bank: 'g6ratio',
      conceptId: 'g6ratio-001',
      setId: 'A' as const,
      seed: 19,
    },
    {
      grade: 6,
      bank: 'g6spatial',
      conceptId: 'g6spatial-001',
      setId: 'B' as const,
      seed: 7,
    },
  ])(
    'selects Grade $grade $conceptId set $setId by reviewed cognitive domain',
    ({ bank, conceptId, setId, seed }) => {
      const templates = readTemplates(bank, conceptId)

      for (const [count, expected] of [
        [5, { knowing: 2, applying: 2, reasoning: 1 }],
        [10, { knowing: 4, applying: 4, reasoning: 2 }],
      ] as const) {
        const first = generateProblems(templates, { count, setId, seed })
        const repeated = generateProblems(templates, { count, setId, seed })
        const domains = first.reduce((mix, problem) => {
          const domain = problem.blueprint?.cognitiveDomain
          if (domain) mix[domain] += 1
          return mix
        }, { knowing: 0, applying: 0, reasoning: 0 })
        const difficultyByTemplateId = Object.fromEntries(
          templates.map(template => [template.id, template.difficulty]),
        )
        const difficulties = first.reduce((mix, problem) => {
          mix[difficultyByTemplateId[problem.templateId]] += 1
          return mix
        }, { 1: 0, 2: 0, 3: 0 })

        expect(domains).toEqual(expected)
        expect(difficulties).toEqual(count === 5
          ? { 1: 2, 2: 2, 3: 1 }
          : { 1: 4, 2: 4, 3: 2 })
        expect(first.map(problem => problem.templateId)).toEqual(
          repeated.map(problem => problem.templateId),
        )
        expect(first.every(problem => problem.setId === setId)).toBe(true)
        expect(first.every(problem => (
          templates.some(template => template.id === problem.templateId)
        ))).toBe(true)
      }
    },
  )

  it('keeps explicit difficulty selection available for legacy callers', () => {
    const templates: ProblemTemplate[] = [
      makeTemplate({
        id: 'difficulty-1-reasoning',
        difficulty: 1,
        blueprint: {
          problemFamily: 'legacy-explicit',
          cognitiveDomain: 'reasoning',
          reasoningPattern: 'direct',
          primaryStandard: '5수01-01',
          representations: ['text'],
          contextType: 'pure_math',
          estimatedSteps: 1,
          readingLoad: 'low',
        },
      }),
      makeTemplate({
        id: 'difficulty-2-knowing',
        difficulty: 2,
        blueprint: {
          problemFamily: 'legacy-explicit',
          cognitiveDomain: 'knowing',
          reasoningPattern: 'direct',
          primaryStandard: '5수01-01',
          representations: ['text'],
          contextType: 'pure_math',
          estimatedSteps: 1,
          readingLoad: 'low',
        },
      }),
      makeTemplate({
        id: 'difficulty-3-applying',
        difficulty: 3,
        blueprint: {
          problemFamily: 'legacy-explicit',
          cognitiveDomain: 'applying',
          reasoningPattern: 'direct',
          primaryStandard: '5수01-01',
          representations: ['text'],
          contextType: 'pure_math',
          estimatedSteps: 1,
          readingLoad: 'low',
        },
      }),
    ]

    const selected = generateProblems(templates, {
      count: 1,
      setId: 'A',
      difficultyMix: { 1: 1, 2: 0, 3: 0 },
      seed: 1,
    })

    expect(selected.map(problem => problem.templateId)).toEqual(['difficulty-1-reasoning'])
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

  it('keeps registered functions and arithmetic arguments compatible without dynamic code execution', () => {
    const template = makeTemplate({
      id: 'function-arithmetic',
      param_schema: { n: { min: 4, max: 4 } },
      solver_rule: 'gcd(n * 2, n + 2) + 1',
    })

    const [problem] = generateProblems([template], {
      count: 1,
      setId: 'A',
      difficultyMix: { 1: 1, 2: 0, 3: 0 },
      seed: 1,
    })

    expect(problem.correctAnswer).toBe('3')
  })

  it('corrects Grade 5 numeric particles after rendering variable values', () => {
    const template = makeTemplate({
      id: 'grade5-particle',
      concept_id: 'possibility-001',
      param_schema: { n: { min: 77, max: 77 } },
      prompt_template: '{{n}}가 72보다 큽니다.',
      solver_rule: 'n',
      solution_steps_template: [
        '{{n}}가 더 큽니다.',
        '분수 6/12를 약분하면 답은 {{n}}입니다.',
      ],
      hint_steps_template: ['6를 더해요.', '10/8로 고쳐요.'],
    })

    const [problem] = generateProblems([template], {
      count: 1,
      setId: 'A',
      difficultyMix: { 1: 1, 2: 0, 3: 0 },
      seed: 1,
    })

    expect(problem.prompt).toBe('77이 72보다 큽니다.')
    expect(problem.solutionSteps).toEqual([
      '77이 더 큽니다.',
      '분수 6/12을 약분하면 답은 77입니다.',
    ])
    expect(problem.hintSteps).toEqual(['6을 더해요.', '10/8으로 고쳐요.'])
  })

  it.each([
    '2 ** 3',
    '1 / 0',
    'Infinity',
    '1 + 2 trailing',
  ])('renders an explicit unresolved marker for rejected expression %s', (solverRule) => {
    const template = makeTemplate({ id: `invalid-${solverRule}`, solver_rule: solverRule })
    const [problem] = generateProblems([template], {
      count: 1,
      setId: 'A',
      difficultyMix: { 1: 1, 2: 0, 3: 0 },
      seed: 1,
    })

    expect(problem.correctAnswer).toBe(`[${solverRule}?]`)
  })
})
