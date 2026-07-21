import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

import {
  BLOCKED_CONTENT_TEMPLATE_IDS,
  REVIEWED_FAMILY_BLUEPRINTS,
  getReviewedBlueprint
} from '../../scripts/migrate-grade5-blueprints.js'
import { banks as generatedGeometryBanks } from '../../scripts/generate-grade5-geometry-templates.js'
import {
  buildProblemBlueprintCoverage,
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
    expect(families.size).toBe(147)
    expect(new Set(Object.keys(REVIEWED_FAMILY_BLUEPRINTS))).toEqual(families)
  })

  it('keeps regenerated geometry banks on the reviewed contract', () => {
    const generated = Object.values(generatedGeometryBanks).flat() as ProblemTemplate[]

    expect(generated).toHaveLength(180)
    expect(generated.every(template => (
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
      expect(multiplication.problem_family).toBe('fracmul-context-product')
      expect(multiplication.prompt_template).toContain('그중')
      expect(multiplication.solver_rule).toBe('fracMul(n1, d1, n2, d2)')

      const subtraction = byId[`tmpl-fracsub-${setId}-06`]
      expect(subtraction.problem_family).toBe('fracsub-context-difference')
      expect(subtraction.prompt_template).not.toContain('남은 양에서 먹은 양')
      expect(
        subtraction.param_schema.n1.min / subtraction.param_schema.d1.max,
      ).toBeGreaterThanOrEqual(
        subtraction.param_schema.n2.max / subtraction.param_schema.d2.min,
      )

      const average = byId[`tmpl-average-${setId}-08`]
      expect(average.problem_family).toBe('average-context-mean')
      expect(average.prompt_template).toContain('평균')
      expect(average.solver_rule).toBe('avg4(a, b, c, d)')
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
      cognitiveDomain: 'knowing',
      reasoningPattern: 'multi_step',
      primaryStandard: '6수01-01',
      contextType: 'pure_math'
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
      cognitiveDomain: 'knowing',
      primaryStandard: '6수01-03',
      contextType: 'real_world'
    })
    expect(byId['tmpl-average-A-09']).toMatchObject({
      cognitiveDomain: 'applying',
      reasoningPattern: 'inverse',
      primaryStandard: '6수04-01'
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
})
