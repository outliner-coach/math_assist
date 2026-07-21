import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { validateCurriculumLedger } from '../../scripts/curriculum-validation-core.js'

const root = process.cwd()
const ledger = JSON.parse(
  readFileSync(join(root, 'public/data/curriculum-allocations-v1.json'), 'utf8')
)

const grade3Source = readFileSync(join(root, 'src/lib/grade3-problems.ts'), 'utf8')
const grade4Source = readFileSync(join(root, 'src/lib/grade4-problems.ts'), 'utf8')
const guestHomeSource = readFileSync(join(root, 'src/lib/guest-home.ts'), 'utf8')
const units = JSON.parse(readFileSync(join(root, 'public/data/units.json'), 'utf8'))
const concepts = JSON.parse(readFileSync(join(root, 'public/data/concepts.json'), 'utf8'))
const templates = Object.fromEntries(
  concepts.map((concept: { id: string }) => {
    const prefix = concept.id.split('-')[0]
    return [
      concept.id,
      JSON.parse(readFileSync(join(root, `public/data/templates/${prefix}.json`), 'utf8')),
    ]
  })
)

function currentInput(overrides: Record<string, unknown> = {}) {
  return {
    ledger,
    grade3Source,
    grade4Source,
    guestHomeSource,
    units,
    concepts,
    templates,
    ...overrides,
  }
}

describe('curriculum allocation ledger', () => {
  it('covers every 3-4 and 5-6 standard exactly once with reviewed allocation evidence', () => {
    const result = validateCurriculumLedger(currentInput())

    expect(result.errors).toEqual([])
    expect(result.summary).toMatchObject({
      total: 92,
      grade34Total: 47,
      grade56Total: 45,
      missingCount: 0,
      duplicateCount: 0,
      existingReferenceCount: 43,
      unreleasedGradeCount: 0,
    })
  })

  it('tracks every current Grade 3, 4, 5, and 6 curriculum reference', () => {
    const result = validateCurriculumLedger(currentInput())

    expect(result.summary.grade3ReferenceCount).toBe(22)
    expect(result.summary.grade4ReferenceCount).toBe(2)
    expect(result.summary.grade5ReferenceCount).toBe(17)
    expect(result.summary.grade6ReferenceCount).toBe(2)
    expect(result.summary.untrackedReferenceCount).toBe(0)
  })

  it('rejects missing, duplicate, invalid prerequisite, and unsupported release records', () => {
    const first = ledger.allocations[0]
    const invalid = {
      ...ledger,
      allocations: [
        ...ledger.allocations.slice(1),
        { ...first, prerequisiteCodes: ['[4수99-99]'] },
        { ...first },
      ],
    }
    const result = validateCurriculumLedger(currentInput({
      ledger: { ...invalid, releaseState: { ...invalid.releaseState, grade6: 'release-candidate' } },
      supportedGrades: [1, 2, 3, 4, 5, 6],
    }))

    expect(result.errors.map((error: { code: string }) => error.code)).toEqual(expect.arrayContaining([
      'duplicate_standard',
      'invalid_prerequisite',
      'unreleased_grade_exposed',
    ]))
  })

  it('allows Grade 4 home exposure only after the ledger reaches released', () => {
    const released = { ...ledger, releaseState: { ...ledger.releaseState, grade4: 'released' } }
    const result = validateCurriculumLedger(currentInput({ ledger: released, supportedGrades: [1, 2, 3, 4, 5, 6] }))

    expect(result.errors).toEqual([])
  })

  it('exposes Grade 6 only when its reviewed ledger state is released', () => {
    const result = validateCurriculumLedger(currentInput({ supportedGrades: [1, 2, 3, 4, 5, 6] }))

    expect(result.errors).toEqual([])
    expect(ledger.releaseState.grade6).toBe('released')
  })
})
