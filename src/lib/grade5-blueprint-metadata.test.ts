import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

import {
  BLOCKED_CONTENT_TEMPLATE_IDS,
  REVIEWED_FAMILY_BLUEPRINTS,
  getReviewedBlueprint
} from '../../scripts/migrate-grade5-blueprints.js'
import { templates as generatedAverageTemplates } from '../../scripts/generate-grade5-average-templates.js'
import { templates as generatedDecimalMultiplicationTemplates } from '../../scripts/generate-grade5-decimalmul-templates.js'
import { templates as generatedEstimateTemplates } from '../../scripts/generate-grade5-estimate-templates.js'
import {
  banks as generatedFractionAddSubBanks
} from '../../scripts/generate-grade5-fraction-addsub-templates.js'
import {
  banks as generatedFractionSimplifyBanks
} from '../../scripts/generate-grade5-fraction-simplify-templates.js'
import {
  banks as generatedDivisorMultipleBanks
} from '../../scripts/generate-grade5-divisor-multiple-templates.js'
import { templates as generatedFractionMultiplicationTemplates } from '../../scripts/generate-grade5-fracmul-templates.js'
import { banks as generatedGeometryBanks } from '../../scripts/generate-grade5-geometry-templates.js'
import { templates as generatedMixedCalculationTemplates } from '../../scripts/generate-grade5-mixedcalc-templates.js'
import { templates as generatedRoundingTemplates } from '../../scripts/generate-grade5-rounding-templates.js'
import {
  buildProblemBlueprintCoverage,
  evaluateTemplate,
  inspectProblemBlueprintMeta
} from '../../scripts/problem-quality-core.js'
import type { ProblemTemplate } from './types'

const migratedBanks = [
  'area', 'average', 'commonden', 'congruence', 'cuboid', 'cuboidnet',
  'decimalmul', 'divisor', 'estimate', 'fracadd', 'fracmul', 'fracsub',
  'gcd', 'lcm', 'mixedcalc', 'multiple', 'pattern', 'perimeter',
  'polygonarea', 'rounding', 'simplify', 'symmetry'
]

function readMigratedTemplates(): ProblemTemplate[] {
  return migratedBanks.flatMap(name => JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'public', 'data', 'templates', `${name}.json`),
      'utf8'
    )
  ) as ProblemTemplate[])
}

function collectExhaustiveTemplateIssues(
  templates: ProblemTemplate[],
  answerPattern: RegExp
): string[] {
  const issues: string[] = []

  for (const template of templates) {
    let samples: Record<string, number>[] = [{}]

    for (const [name, range] of Object.entries(template.param_schema)) {
      samples = samples.flatMap(sample => Array.from(
        { length: range.max - range.min + 1 },
        (_, offset) => ({ ...sample, [name]: range.min + offset })
      ))
    }

    for (const params of samples) {
      const sampleKey = `${template.id} ${JSON.stringify(params)}`
      const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)
      const renderedTexts = [
        evaluateTemplate(template.prompt_template, params),
        ...template.solution_steps_template.map(step => evaluateTemplate(step, params)),
        ...(template.hint_steps_template ?? []).map(step => evaluateTemplate(step, params))
      ]

      if (!answerPattern.test(answer)) issues.push(`${sampleKey}: invalid answer ${answer}`)
      if (renderedTexts.some(text => text.includes('?]'))) {
        issues.push(`${sampleKey}: unresolved expression`)
      }

      if (template.type === 'choice') {
        const choices = template.choices_template!.map(choice => (
          evaluateTemplate(choice, params)
        ))
        if (new Set(choices).size !== 4) issues.push(`${sampleKey}: duplicate choices`)
        if (choices.filter(choice => choice === answer).length !== 1) {
          issues.push(`${sampleKey}: answer choice mismatch`)
        }
      }
    }
  }

  return issues
}

describe('Grade 5 reviewed blueprint metadata', () => {
  it('defines one explicit reviewed mapping for every structured problem family', () => {
    const templates = readMigratedTemplates()
    const families = new Set(
      templates
        .filter(template => !BLOCKED_CONTENT_TEMPLATE_IDS.has(template.id))
        .map(template => template.problem_family)
    )

    expect(templates).toHaveLength(660)
    expect(BLOCKED_CONTENT_TEMPLATE_IDS.size).toBe(0)
    expect(families.size).toBe(217)
    expect(new Set(Object.keys(REVIEWED_FAMILY_BLUEPRINTS))).toEqual(families)
  })

  it('keeps regenerated geometry banks on the reviewed contract', () => {
    const generated = Object.values(generatedGeometryBanks).flat() as ProblemTemplate[]

    expect(generated).toHaveLength(180)
    expect(generated.every(template => (
      JSON.stringify(template.blueprint) === JSON.stringify(getReviewedBlueprint(template))
    ))).toBe(true)
  })

  it('keeps the reviewed average bank reproducible from its generator', () => {
    const committed = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'public', 'data', 'templates', 'average.json'),
        'utf8'
      )
    ) as ProblemTemplate[]

    expect(generatedAverageTemplates).toEqual(committed)
    expect(generatedAverageTemplates.every(template => (
      JSON.stringify(template.blueprint) === JSON.stringify(getReviewedBlueprint(template))
    ))).toBe(true)

    expect(collectExhaustiveTemplateIssues(
      generatedAverageTemplates,
      /^\d+$/
    )).toEqual([])
  })

  it('keeps the reviewed fraction-multiplication bank reproducible from its generator', () => {
    const committed = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'public', 'data', 'templates', 'fracmul.json'),
        'utf8'
      )
    ) as ProblemTemplate[]

    expect(generatedFractionMultiplicationTemplates).toEqual(committed)
    expect(generatedFractionMultiplicationTemplates.every(template => (
      JSON.stringify(template.blueprint) === JSON.stringify(getReviewedBlueprint(template))
    ))).toBe(true)

    expect(collectExhaustiveTemplateIssues(
      generatedFractionMultiplicationTemplates,
      /^\d+(?:\/\d+)?$/
    )).toEqual([])
  })

  it('keeps the reviewed fraction-addition and subtraction banks reproducible and exhaustive', () => {
    for (const [name, generated] of Object.entries(generatedFractionAddSubBanks)) {
      const committed = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), 'public', 'data', 'templates', `${name}.json`),
          'utf8'
        )
      ) as ProblemTemplate[]

      expect(generated).toEqual(committed)
      expect(generated).toHaveLength(30)
      expect(generated.every(template => (
        JSON.stringify(template.blueprint) === JSON.stringify(getReviewedBlueprint(template))
      ))).toBe(true)

      const domainCounts = generated.reduce<Record<string, number>>((counts, template) => {
        const domain = template.blueprint!.cognitiveDomain
        counts[domain] = (counts[domain] ?? 0) + 1
        return counts
      }, {})
      expect(domainCounts).toEqual({ knowing: 12, applying: 12, reasoning: 6 })
      expect(new Set(generated.map(template => template.problem_family))).toHaveLength(10)
      expect(new Set(
        generated
          .filter(template => template.blueprint!.cognitiveDomain === 'reasoning')
          .map(template => template.problem_family)
      )).toHaveLength(2)

      expect(collectExhaustiveTemplateIssues(
        generated,
        name === 'fracsub'
          ? /^(?!0(?:\/|$))\d+(?:\/\d+)?$/
          : /^\d+(?:\/\d+)?$/
      )).toEqual([])

      for (const setId of ['A', 'B', 'C']) {
        const direct = generated.find(template => template.id === `tmpl-${name}-${setId}-01`)!
        if (name === 'fracadd') {
          expect(direct.solver_rule).toBe(
            'fracAdd(n, n + b, m, n + b + m + c)'
          )
          const complement = generated.find(
            template => template.id === `tmpl-fracadd-${setId}-03`
          )!
          expect(complement.solver_rule).toBe('reduceFrac(b, n + b)')
        } else {
          expect(direct.solver_rule).toBe(
            'fracSub(n + m, n + m + b, n, n + m + b + c)'
          )
        }
      }
    }
  })

  it('keeps fraction simplification and common-denominator banks reproducible and exhaustive', () => {
    for (const [name, generated] of Object.entries(generatedFractionSimplifyBanks)) {
      const committed = JSON.parse(fs.readFileSync(
        path.join(process.cwd(), 'public', 'data', 'templates', `${name}.json`),
        'utf8'
      )) as ProblemTemplate[]
      expect(generated).toEqual(committed)
      expect(generated).toHaveLength(30)
      expect(new Set(generated.map(template => template.problem_family))).toHaveLength(10)
      expect(generated.reduce<Record<string, number>>((counts, template) => {
        const domain = template.blueprint!.cognitiveDomain
        counts[domain] = (counts[domain] ?? 0) + 1
        return counts
      }, {})).toEqual({ knowing: 12, applying: 12, reasoning: 6 })
      expect(collectExhaustiveTemplateIssues(generated, /^\d+(?:\/\d+)?$/)).toEqual([])
    }
  })

  it('keeps divisor and multiple unit banks reproducible and exhaustive', () => {
    for (const [name, generated] of Object.entries(generatedDivisorMultipleBanks)) {
      const committed = JSON.parse(fs.readFileSync(
        path.join(process.cwd(), 'public', 'data', 'templates', `${name}.json`),
        'utf8'
      )) as ProblemTemplate[]
      expect(generated).toEqual(committed)
      expect(generated).toHaveLength(30)
      expect(new Set(generated.map(template => template.problem_family))).toHaveLength(10)
      expect(generated.reduce<Record<string, number>>((counts, template) => {
        const domain = template.blueprint!.cognitiveDomain
        counts[domain] = (counts[domain] ?? 0) + 1
        return counts
      }, {})).toEqual({ knowing: 12, applying: 12, reasoning: 6 })
      expect(collectExhaustiveTemplateIssues(generated, /^\d+$/)).toEqual([])
    }
  })

  it('keeps the reviewed rounding bank reproducible from its generator', () => {
    const committed = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'public', 'data', 'templates', 'rounding.json'),
        'utf8'
      )
    ) as ProblemTemplate[]

    expect(generatedRoundingTemplates).toEqual(committed)
    expect(generatedRoundingTemplates.every(template => (
      JSON.stringify(template.blueprint) === JSON.stringify(getReviewedBlueprint(template))
    ))).toBe(true)
  })

  it('keeps the reviewed directed-estimation bank reproducible from its generator', () => {
    const committed = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'public', 'data', 'templates', 'estimate.json'),
        'utf8'
      )
    ) as ProblemTemplate[]

    expect(generatedEstimateTemplates).toEqual(committed)
    expect(generatedEstimateTemplates.every(template => (
      JSON.stringify(template.blueprint) === JSON.stringify(getReviewedBlueprint(template))
    ))).toBe(true)
  })

  it('keeps the reviewed mixed-calculation bank reproducible from its generator', () => {
    const committed = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'public', 'data', 'templates', 'mixedcalc.json'),
        'utf8'
      )
    ) as ProblemTemplate[]

    expect(generatedMixedCalculationTemplates).toEqual(committed)
    expect(generatedMixedCalculationTemplates.every(template => (
      JSON.stringify(template.blueprint) === JSON.stringify(getReviewedBlueprint(template))
    ))).toBe(true)
  })

  it('keeps the reviewed decimal-multiplication bank reproducible from its generator', () => {
    const committed = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'public', 'data', 'templates', 'decimalmul.json'),
        'utf8'
      )
    ) as ProblemTemplate[]

    expect(generatedDecimalMultiplicationTemplates).toEqual(committed)
    expect(generatedDecimalMultiplicationTemplates.every(template => (
      JSON.stringify(template.blueprint) === JSON.stringify(getReviewedBlueprint(template))
    ))).toBe(true)
  })

  it('migrates all 660 semantically reviewed Grade 5 templates', () => {
    const templates = readMigratedTemplates()
    const coverage = buildProblemBlueprintCoverage(templates)

    expect(coverage.summary).toEqual({
      templateCount: 660,
      completeCount: 660,
      missingCount: 0,
      invalidCount: 0,
      coveragePercent: 100
    })
    expect(coverage.byConcept).toHaveLength(22)
    expect(coverage.byConcept.every(concept => (
      concept.completeCount === 30 && concept.missingCount === 0
    ))).toBe(true)

    for (const template of templates) {
      expect(inspectProblemBlueprintMeta(template)).toEqual({ status: 'complete', issues: [] })
      expect(template.blueprint).toEqual(getReviewedBlueprint(template))
    }
  })

  it('keeps the approved fraction and average corrections mathematically aligned', () => {
    const byId = Object.fromEntries(readMigratedTemplates().map(template => [template.id, template]))

    for (const setId of ['A', 'B', 'C']) {
      const multiplication = byId[`tmpl-fracmul-${setId}-06`]
      expect(multiplication.problem_family).toBe('fracmul-context-part-of-part')
      expect(multiplication.prompt_template).toContain('그중')
      expect(multiplication.solver_rule).toBe(
        'reduceFrac(n * m, n * m + n * c + b * m + b * c)'
      )

      const subtraction = byId[`tmpl-fracsub-${setId}-06`]
      expect(subtraction.problem_family).toBe('fracsub-context-distance-gap')
      expect(subtraction.solver_rule).toBe('fracSub(n, n + b, n, n + b + c)')
      expect(collectExhaustiveTemplateIssues(
        [subtraction],
        /^(?!0(?:\/|$))\d+(?:\/\d+)?$/
      )).toEqual([])

      const average = byId[`tmpl-average-${setId}-06`]
      expect(average.problem_family).toBe('average-context-four')
      expect(average.prompt_template).toContain('평균')
      expect(average.solver_rule).toBe('a')
    }
  })

  it('keeps representative classifications tied to mathematical meaning', () => {
    const byId = Object.fromEntries(
      readMigratedTemplates().map(template => [template.id, template.blueprint])
    )

    expect(byId['tmpl-area-A-09']).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'model_and_check',
      primaryStandard: '6수03-14',
      contextType: 'puzzle',
      visualSemantics: 'quantitative'
    })
    expect(byId['tmpl-perimeter-A-07']).toMatchObject({
      cognitiveDomain: 'applying',
      reasoningPattern: 'inverse',
      primaryStandard: '6수03-13',
      visualSemantics: 'quantitative'
    })
    expect(byId['tmpl-congruence-A-01']).toMatchObject({
      cognitiveDomain: 'knowing',
      primaryStandard: '6수03-01',
      visualSemantics: 'schematic'
    })
    expect(byId['tmpl-symmetry-A-05']).toMatchObject({
      cognitiveDomain: 'applying',
      reasoningPattern: 'representation_shift',
      primaryStandard: '6수03-02',
      visualSemantics: 'quantitative'
    })
    expect(byId['tmpl-cuboidnet-A-04']).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'model_and_check',
      primaryStandard: '6수03-04',
      visualSemantics: 'schematic'
    })
    expect(byId['tmpl-mixedcalc-A-09']).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'error_analysis',
      primaryStandard: '6수01-01',
      contextType: 'puzzle'
    })
    expect(byId['tmpl-pattern-A-01']).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'pattern_generalization',
      primaryStandard: '6수02-01'
    })
    expect(byId['tmpl-gcd-A-05']).toMatchObject({
      cognitiveDomain: 'applying',
      reasoningPattern: 'model_and_check',
      primaryStandard: '6수01-04',
      contextType: 'real_world'
    })
    expect(byId['tmpl-rounding-A-09']).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'systematic_counting',
      primaryStandard: '6수01-03',
      contextType: 'puzzle'
    })
    expect(byId['tmpl-estimate-A-09']).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'error_analysis',
      primaryStandard: '6수01-03',
      contextType: 'real_world'
    })
    expect(byId['tmpl-decimalmul-A-09']).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'error_analysis',
      primaryStandard: '6수01-13',
      contextType: 'puzzle'
    })
    expect(byId['tmpl-fracmul-A-09']).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'error_analysis',
      primaryStandard: '6수01-09',
      contextType: 'puzzle'
    })
    expect(byId['tmpl-average-A-09']).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'error_analysis',
      primaryStandard: '6수04-01',
      contextType: 'real_world'
    })
  })

  it('does not relabel familiar inverse procedures as reasoning to satisfy a quota', () => {
    const coverage = buildProblemBlueprintCoverage(readMigratedTemplates())
    const perimeter = coverage.byConcept.find(entry => entry.conceptId === 'perimeter-001')
    const polygonArea = coverage.byConcept.find(entry => entry.conceptId === 'polygonarea-001')

    expect(perimeter?.cognitiveCounts).toEqual({ knowing: 18, applying: 12, reasoning: 0 })
    expect(polygonArea?.cognitiveCounts).toEqual({ knowing: 12, applying: 18, reasoning: 0 })
    expect(perimeter?.targetGaps).toEqual(
      expect.arrayContaining(['reasoning_family_minimum', 'cognitive_domain_mix'])
    )
    expect(polygonArea?.targetGaps).toEqual(
      expect.arrayContaining(['reasoning_family_minimum', 'cognitive_domain_mix'])
    )
  })

  it('gives every average set a reviewed K4/A4/R2 application mix', () => {
    const templates = readMigratedTemplates()
      .filter(template => template.concept_id === 'average-001')
    const coverage = buildProblemBlueprintCoverage(templates)
    const average = coverage.byConcept[0]

    expect(templates).toHaveLength(30)
    expect(average.cognitiveCounts).toEqual({
      knowing: 12,
      applying: 12,
      reasoning: 6
    })
    expect(average.problemFamilyCount).toBe(10)
    expect(average.reasoningFamilyCount).toBe(2)
    expect(average.targetGaps).toEqual([])

    for (const setId of ['A', 'B', 'C']) {
      const setTemplates = templates.filter(template => template.set_id === setId)
      const cognitiveCounts = setTemplates.reduce(
        (counts, template) => {
          counts[template.blueprint!.cognitiveDomain] += 1
          return counts
        },
        { knowing: 0, applying: 0, reasoning: 0 }
      )

      expect(cognitiveCounts).toEqual({
        knowing: 4,
        applying: 4,
        reasoning: 2
      })
      expect(new Set(setTemplates.map(template => template.prompt_template)).size).toBe(10)
    }
  })

  it('gives every fraction-multiplication set a reviewed K4/A4/R2 application mix', () => {
    const templates = readMigratedTemplates()
      .filter(template => template.concept_id === 'fracmul-001')
    const coverage = buildProblemBlueprintCoverage(templates)
    const fractionMultiplication = coverage.byConcept[0]

    expect(templates).toHaveLength(30)
    expect(fractionMultiplication.cognitiveCounts).toEqual({
      knowing: 12,
      applying: 12,
      reasoning: 6
    })
    expect(fractionMultiplication.problemFamilyCount).toBe(10)
    expect(fractionMultiplication.reasoningFamilyCount).toBe(2)
    expect(fractionMultiplication.targetGaps).toEqual([])

    for (const setId of ['A', 'B', 'C']) {
      const setTemplates = templates.filter(template => template.set_id === setId)
      const cognitiveCounts = setTemplates.reduce(
        (counts, template) => {
          counts[template.blueprint!.cognitiveDomain] += 1
          return counts
        },
        { knowing: 0, applying: 0, reasoning: 0 }
      )

      expect(cognitiveCounts).toEqual({
        knowing: 4,
        applying: 4,
        reasoning: 2
      })
      expect(new Set(setTemplates.map(template => template.prompt_template)).size).toBe(10)
    }
  })

  it('gives every rounding set a reviewed K4/A4/R2 application mix', () => {
    const templates = readMigratedTemplates()
      .filter(template => template.concept_id === 'rounding-001')
    const coverage = buildProblemBlueprintCoverage(templates)
    const rounding = coverage.byConcept[0]

    expect(templates).toHaveLength(30)
    expect(rounding.cognitiveCounts).toEqual({
      knowing: 12,
      applying: 12,
      reasoning: 6
    })
    expect(rounding.problemFamilyCount).toBe(10)
    expect(rounding.reasoningFamilyCount).toBe(2)
    expect(rounding.targetGaps).toEqual([])

    for (const setId of ['A', 'B', 'C']) {
      const setTemplates = templates.filter(template => template.set_id === setId)
      const cognitiveCounts = setTemplates.reduce(
        (counts, template) => {
          counts[template.blueprint!.cognitiveDomain] += 1
          return counts
        },
        { knowing: 0, applying: 0, reasoning: 0 }
      )

      expect(cognitiveCounts).toEqual({
        knowing: 4,
        applying: 4,
        reasoning: 2
      })
      expect(new Set(setTemplates.map(template => template.prompt_template)).size).toBe(10)
    }
  })

  it('gives every directed-estimation set a reviewed K4/A4/R2 application mix', () => {
    const templates = readMigratedTemplates()
      .filter(template => template.concept_id === 'estimate-001')
    const coverage = buildProblemBlueprintCoverage(templates)
    const estimate = coverage.byConcept[0]

    expect(templates).toHaveLength(30)
    expect(estimate.cognitiveCounts).toEqual({
      knowing: 12,
      applying: 12,
      reasoning: 6
    })
    expect(estimate.problemFamilyCount).toBe(10)
    expect(estimate.reasoningFamilyCount).toBe(2)
    expect(estimate.targetGaps).toEqual([])

    for (const setId of ['A', 'B', 'C']) {
      const setTemplates = templates.filter(template => template.set_id === setId)
      const cognitiveCounts = setTemplates.reduce(
        (counts, template) => {
          counts[template.blueprint!.cognitiveDomain] += 1
          return counts
        },
        { knowing: 0, applying: 0, reasoning: 0 }
      )

      expect(cognitiveCounts).toEqual({
        knowing: 4,
        applying: 4,
        reasoning: 2
      })
      expect(new Set(setTemplates.map(template => template.prompt_template)).size).toBe(10)
    }
  })

  it('gives every mixed-calculation set a reviewed K4/A4/R2 application mix', () => {
    const templates = readMigratedTemplates()
      .filter(template => template.concept_id === 'mixedcalc-001')
    const coverage = buildProblemBlueprintCoverage(templates)
    const mixedCalculation = coverage.byConcept[0]

    expect(templates).toHaveLength(30)
    expect(mixedCalculation.cognitiveCounts).toEqual({
      knowing: 12,
      applying: 12,
      reasoning: 6
    })
    expect(mixedCalculation.problemFamilyCount).toBe(10)
    expect(mixedCalculation.reasoningFamilyCount).toBe(2)
    expect(mixedCalculation.targetGaps).toEqual([])

    for (const setId of ['A', 'B', 'C']) {
      const setTemplates = templates.filter(template => template.set_id === setId)
      const cognitiveCounts = setTemplates.reduce(
        (counts, template) => {
          counts[template.blueprint!.cognitiveDomain] += 1
          return counts
        },
        { knowing: 0, applying: 0, reasoning: 0 }
      )

      expect(cognitiveCounts).toEqual({
        knowing: 4,
        applying: 4,
        reasoning: 2
      })
      expect(new Set(setTemplates.map(template => template.prompt_template)).size).toBe(10)
    }
  })

  it('gives every decimal-multiplication set a reviewed K4/A4/R2 application mix', () => {
    const templates = readMigratedTemplates()
      .filter(template => template.concept_id === 'decimalmul-001')
    const coverage = buildProblemBlueprintCoverage(templates)
    const decimalMultiplication = coverage.byConcept[0]

    expect(templates).toHaveLength(30)
    expect(decimalMultiplication.cognitiveCounts).toEqual({
      knowing: 12,
      applying: 12,
      reasoning: 6
    })
    expect(decimalMultiplication.problemFamilyCount).toBe(10)
    expect(decimalMultiplication.reasoningFamilyCount).toBe(2)
    expect(decimalMultiplication.targetGaps).toEqual([])

    for (const setId of ['A', 'B', 'C']) {
      const setTemplates = templates.filter(template => template.set_id === setId)
      const cognitiveCounts = setTemplates.reduce(
        (counts, template) => {
          counts[template.blueprint!.cognitiveDomain] += 1
          return counts
        },
        { knowing: 0, applying: 0, reasoning: 0 }
      )

      expect(cognitiveCounts).toEqual({
        knowing: 4,
        applying: 4,
        reasoning: 2
      })
      expect(new Set(setTemplates.map(template => template.prompt_template)).size).toBe(10)
    }
  })
})
