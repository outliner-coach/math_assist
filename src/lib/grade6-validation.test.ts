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
}

describe('Grade 6 release validation', () => {
  it('validates every released concept instead of a hard-coded ratio file', () => {
    const result = validateGrade6Release({ units, concepts, ledger, templatesByConcept })

    expect(result.errors).toEqual([])
    expect(result.summary).toMatchObject({
      unitCount: 7,
      conceptCount: 7,
      templateCount: 210,
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
})
