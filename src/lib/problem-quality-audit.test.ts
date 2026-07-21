import { describe, expect, it } from 'vitest'
import {
  analyzeRenderedMeasurementUnits,
  analyzeRenderedPromptQuality,
  analyzeThreeShapeOverlapVisual,
  buildProblemBlueprintCoverage,
  calculateDifficultySignal,
  inspectProblemBlueprintMeta,
  loadProblemGenerator
} from '../../scripts/problem-quality-core.js'

const completeBlueprint = {
  problemFamily: 'inverse-area',
  cognitiveDomain: 'reasoning',
  reasoningPattern: 'inverse',
  primaryStandard: '6수03-06',
  connectedStandards: ['6수01-11'],
  representations: ['text', 'equation'],
  contextType: 'pure_math',
  estimatedSteps: 3,
  readingLoad: 'medium',
  visualSemantics: undefined
}

describe('problem quality audit helpers', () => {
  it('loads the runtime generator with its safe arithmetic dependency', () => {
    const { generateProblems } = loadProblemGenerator()
    const [problem] = generateProblems([
      {
        id: 'safe-arithmetic-loader',
        concept_id: 'test-concept',
        type: 'number',
        difficulty: 1,
        set_id: 'A',
        param_schema: { n: { min: 3, max: 3 } },
        prompt_template: '{{n}}',
        solver_rule: 'n * 2 + 1',
        solution_steps_template: ['{{n}}']
      }
    ], {
      count: 1,
      setId: 'A',
      difficultyMix: { 1: 1, 2: 0, 3: 0 },
      seed: 1
    })

    expect(problem.correctAnswer).toBe('7')
  })

  it('warns when fraction prompts hide the operands', () => {
    const warnings = analyzeRenderedPromptQuality(
      {
        concept_id: 'commonden-001',
        solver_rule: 'convertNum1(n1, d1, d2)'
      },
      '통분한 뒤 첫 번째 분자에서 두 번째 분자를 빼면?'
    )

    expect(warnings.map((warning: { code: string }) => warning.code)).toContain(
      'fraction_operands_hidden'
    )
    expect(warnings.map((warning: { code: string }) => warning.code)).toContain(
      'ambiguous_operand_reference'
    )
  })

  it('does not treat ordinal wording as an operand reference', () => {
    const warnings = analyzeRenderedPromptQuality(
      {
        concept_id: 'divisor-001',
        solver_rule: 'secondLargestDivisor(n)'
      },
      '24의 두 번째로 큰 약수는?'
    )

    expect(warnings).toEqual([])
  })

  it('assigns higher difficulty signal to multi-step fraction templates', () => {
    const easySignal = calculateDifficultySignal(
      {
        prompt_template: '{{n}}의 약수는?',
        solver_rule: 'n',
        param_schema: { n: { min: 2, max: 9 } },
        type: 'choice',
        solution_steps_template: ['{{n}}'],
        hint_steps_template: ['{{n}}']
      },
      [{ answer: '6', answerMagnitude: 6 }]
    )

    const hardSignal = calculateDifficultySignal(
      {
        prompt_template: '$\\frac{ {{n1}} }{ {{d1}} }$와 $\\frac{ {{n2}} }{ {{d2}} }$를 통분한 뒤, 첫 번째 분자에서 두 번째 분자를 빼면?',
        solver_rule: 'convertNum1(n1, d1, d2) - convertNum2(n2, d1, d2)',
        param_schema: {
          n1: { min: 5, max: 8 },
          d1: { min: 6, max: 10 },
          n2: { min: 5, max: 8 },
          d2: { min: 7, max: 11 }
        },
        type: 'number',
        solution_steps_template: ['a', 'b'],
        hint_steps_template: ['a', 'b']
      },
      [{ answer: '12', answerMagnitude: 12 }]
    )

    expect(hardSignal).toBeGreaterThan(easySignal)
  })

  it('rejects a diagram unit that disagrees with the rendered problem', () => {
    const issue = analyzeRenderedMeasurementUnits(
      { concept_id: 'area-001' },
      '전체 가로는 24 m이고 둘레는 몇 m인가요?',
      ['둘레는 80 m입니다.'],
      { type: 'l_shape', props: { unit: 'cm' } }
    )

    expect(issue).toMatchObject({ code: 'measurement_unit_mismatch' })
  })

  it('rejects impossible quantitative overlap topology', () => {
    const issue = analyzeThreeShapeOverlapVisual({
      type: 'three_shape_overlap',
      semantics: 'quantitative',
      props: {
        shapeArea: 10,
        exclusiveAreas: [9, 1, 1],
        tripleOverlap: 2,
        unit: 'cm'
      }
    })

    expect(issue).toMatchObject({ code: 'invalid_three_shape_overlap_model' })
  })

  it('accepts a complete reviewed problem blueprint', () => {
    const result = inspectProblemBlueprintMeta({
      id: 'reviewed',
      concept_id: 'area-001',
      problem_family: 'inverse-area',
      blueprint: completeBlueprint
    })

    expect(result).toEqual({ status: 'complete', issues: [] })
  })

  it('rejects partial or invalid declared blueprint metadata', () => {
    const result = inspectProblemBlueprintMeta({
      id: 'invalid',
      concept_id: 'area-001',
      problem_family: 'legacy-family',
      visual_template: { type: 'basic_shape' },
      blueprint: {
        problemFamily: 'different-family',
        cognitiveDomain: 'hard',
        reasoningPattern: 'guess',
        primaryStandard: '',
        representations: [],
        contextType: 'story',
        estimatedSteps: 0,
        readingLoad: 'very-high'
      }
    })

    expect(result.status).toBe('invalid')
    expect(result.issues.map((issue: { code: string }) => issue.code)).toEqual(
      expect.arrayContaining([
        'problem_family_mismatch',
        'invalid_cognitive_domain',
        'invalid_reasoning_pattern',
        'missing_primary_standard',
        'missing_representations',
        'invalid_context_type',
        'invalid_estimated_steps',
        'invalid_reading_load',
        'missing_visual_semantics'
      ])
    )
  })

  it('reports missing and invalid metadata separately without inferring from difficulty', () => {
    const coverage = buildProblemBlueprintCoverage([
      {
        id: 'complete',
        concept_id: 'area-001',
        difficulty: 1,
        blueprint: completeBlueprint
      },
      {
        id: 'missing',
        concept_id: 'area-001',
        difficulty: 3
      },
      {
        id: 'invalid',
        concept_id: 'average-001',
        difficulty: 3,
        blueprint: { ...completeBlueprint, cognitiveDomain: 'hard' }
      }
    ])

    expect(coverage.summary).toMatchObject({
      templateCount: 3,
      completeCount: 1,
      missingCount: 1,
      invalidCount: 1,
      coveragePercent: 33.33
    })
    expect(coverage.byConcept).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conceptId: 'area-001',
          completeCount: 1,
          missingCount: 1,
          invalidCount: 0
        }),
        expect.objectContaining({
          conceptId: 'average-001',
          completeCount: 0,
          missingCount: 0,
          invalidCount: 1
        })
      ])
    )
  })
})
