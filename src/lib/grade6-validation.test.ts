import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { validateGrade6Release } from '../../scripts/grade6-validation-core.js'

const root = process.cwd()
const units = JSON.parse(readFileSync(join(root, 'public/data/units.json'), 'utf8'))
const concepts = JSON.parse(readFileSync(join(root, 'public/data/concepts.json'), 'utf8'))
const ledger = JSON.parse(readFileSync(join(root, 'public/data/curriculum-allocations-v1.json'), 'utf8'))
const templatesByConcept = {
  'g6ratio-001': JSON.parse(readFileSync(join(root, 'public/data/templates/g6ratio.json'), 'utf8')),
  'g6fractiondiv-001': JSON.parse(readFileSync(join(root, 'public/data/templates/g6fractiondiv.json'), 'utf8')),
  'g6fractiondecimal-001': JSON.parse(readFileSync(join(root, 'public/data/templates/g6fractiondecimal.json'), 'utf8')),
  'g6decimaldiv-001': JSON.parse(readFileSync(join(root, 'public/data/templates/g6decimaldiv.json'), 'utf8')),
  'g6proportion-001': JSON.parse(readFileSync(join(root, 'public/data/templates/g6proportion.json'), 'utf8')),
  'g6prismpyramid-001': JSON.parse(readFileSync(join(root, 'public/data/templates/g6prismpyramid.json'), 'utf8')),
  'g6roundsolid-001': JSON.parse(readFileSync(join(root, 'public/data/templates/g6roundsolid.json'), 'utf8')),
  'g6spatial-001': JSON.parse(readFileSync(join(root, 'public/data/templates/g6spatial.json'), 'utf8')),
  'g6circle-001': JSON.parse(readFileSync(join(root, 'public/data/templates/g6circle.json'), 'utf8')),
}

describe('Grade 6 release validation', () => {
  it('validates every released concept instead of a hard-coded ratio file', () => {
    const result = validateGrade6Release({ units, concepts, ledger, templatesByConcept })

    expect(result.errors).toEqual([])
    expect(result.summary).toMatchObject({
      unitCount: 9,
      conceptCount: 9,
      templateCount: 270,
    })
  })

  it('fails when a released concept has no matching template bank', () => {
    const result = validateGrade6Release({
      units,
      concepts,
      ledger,
      templatesByConcept: { 'g6ratio-001': templatesByConcept['g6ratio-001'] },
    })

    expect(result.errors).toContain('g6fractiondiv-001: missing template bank')
  })

  it('rejects prism visuals that decouple the drawing or include an answer field', () => {
    const invalidTemplates = structuredClone(templatesByConcept)
    invalidTemplates['g6prismpyramid-001'][0].visual_template.baseSides = 5
    invalidTemplates['g6prismpyramid-001'][1].visual_template.result = '{{3 * p}}'

    const result = validateGrade6Release({
      units,
      concepts,
      ledger,
      templatesByConcept: invalidTemplates,
    })

    expect(result.errors).toContain(
      'tmpl-g6prismpyramid-A-01: prism visual baseSides must be {{p}}',
    )
    expect(result.errors).toContain(
      'tmpl-g6prismpyramid-A-02: prism visual contains an answer-only key',
    )
  })

  it('rejects round-solid visuals with unsupported copies or answer fields', () => {
    const invalidTemplates = structuredClone(templatesByConcept)
    invalidTemplates['g6roundsolid-001'][0].visual_template.copies = 7
    invalidTemplates['g6roundsolid-001'][1].visual_template.answer = '1'

    const result = validateGrade6Release({
      units,
      concepts,
      ledger,
      templatesByConcept: invalidTemplates,
    })

    expect(result.errors).toContain(
      'tmpl-g6roundsolid-A-01: round-solid copies must be 1 or {{p}}',
    )
    expect(result.errors).toContain(
      'tmpl-g6roundsolid-A-02: round-solid visual contains an answer-only key',
    )
  })

  it('rejects cube-stack visuals that decouple the height model or expose an answer field', () => {
    const invalidTemplates = structuredClone(templatesByConcept)
    invalidTemplates['g6spatial-001'][0].visual_template.heights = [[7, 1], [2, 0]]
    invalidTemplates['g6spatial-001'][1].visual_template.result = '{{p + 3}}'
    invalidTemplates['g6spatial-001'][2].visual_template.mode = 'perspective'

    const result = validateGrade6Release({
      units,
      concepts,
      ledger,
      templatesByConcept: invalidTemplates,
    })

    expect(result.errors).toContain(
      'tmpl-g6spatial-A-01: cube-stack heights must be a 2-3 by 2-3 grid derived from p',
    )
    expect(result.errors).toContain(
      'tmpl-g6spatial-A-02: cube-stack visual contains an answer-only key',
    )
    expect(result.errors).toContain(
      'tmpl-g6spatial-A-03: unsupported cube-stack mode perspective',
    )
  })

  it('rejects circle visuals that decouple the radius or expose an answer field', () => {
    const invalidTemplates = structuredClone(templatesByConcept)
    invalidTemplates['g6circle-001'][0].visual_template.radius = 9
    invalidTemplates['g6circle-001'][1].visual_template.answer = '3.14'
    invalidTemplates['g6circle-001'][2].visual_template.pi = 3.14159

    const result = validateGrade6Release({
      units,
      concepts,
      ledger,
      templatesByConcept: invalidTemplates,
    })

    expect(result.errors).toContain(
      'tmpl-g6circle-A-01: circle radius must derive from p',
    )
    expect(result.errors).toContain(
      'tmpl-g6circle-A-02: circle visual contains an answer-only key',
    )
    expect(result.errors).toContain(
      'tmpl-g6circle-A-03: circle pi must be 3.14',
    )
  })
})
