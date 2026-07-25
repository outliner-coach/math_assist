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
}

describe('Grade 6 release validation', () => {
  it('validates every released concept instead of a hard-coded ratio file', () => {
    const result = validateGrade6Release({ units, concepts, ledger, templatesByConcept })

    expect(result.errors).toEqual([])
    expect(result.summary).toMatchObject({
      unitCount: 3,
      conceptCount: 3,
      templateCount: 90,
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
})
