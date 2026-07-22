import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { validateCurriculumLedger } from '../../scripts/curriculum-validation-core.js'
import {
  ContractValidationError,
  parseUnitKnowledgePackV1,
} from './application-problems/contracts'

const root = process.cwd()
const ledger = JSON.parse(
  readFileSync(join(root, 'public/data/curriculum-allocations-v1.json'), 'utf8')
)

const grade2Source = readFileSync(join(root, 'src/lib/grade2-problems.ts'), 'utf8')
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
    grade2Source,
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
  it('adds the four reviewed 1-2 pilot standards without changing the 92 upper-grade allocations', () => {
    const result = validateCurriculumLedger(currentInput())

    expect(result.errors).toEqual([])
    expect(result.summary).toMatchObject({
      total: 96,
      grade12PilotTotal: 4,
      grade34Total: 47,
      grade56Total: 45,
      upperGradeTotal: 92,
      missingCount: 0,
      duplicateCount: 0,
      existingReferenceCount: 45,
      unreleasedGradeCount: 0,
    })
  })

  it('tracks the two honest Grade 2 references and every current upper-grade reference', () => {
    const result = validateCurriculumLedger(currentInput())

    expect(result.summary.grade2ReferenceCount).toBe(2)
    expect(result.summary.grade3ReferenceCount).toBe(22)
    expect(result.summary.grade4ReferenceCount).toBe(2)
    expect(result.summary.grade5ReferenceCount).toBe(17)
    expect(result.summary.grade6ReferenceCount).toBe(2)
    expect(result.summary.untrackedReferenceCount).toBe(0)
  })

  it('keeps measurement and estimation planned while tracing only represented Grade 2 work', () => {
    const pilot = Object.fromEntries(
      ledger.allocations
        .filter((allocation: { standardCode: string }) => allocation.standardCode.startsWith('[2수'))
        .map((allocation: { standardCode: string }) => [allocation.standardCode, allocation]),
    )

    expect(pilot['[2수03-10]']).toMatchObject({
      band: '1-2',
      assignedGrade: 2,
      semester: '2-1',
      unitId: 'g2-1-length',
      coverageStatus: 'planned',
      existingContentRefs: [],
    })
    expect(pilot['[2수03-12]']).toMatchObject({
      band: '1-2',
      assignedGrade: 2,
      semester: '2-1',
      unitId: 'g2-1-length',
      coverageStatus: 'planned',
      existingContentRefs: [],
    })
    expect(pilot['[2수03-11]']).toMatchObject({
      band: '1-2',
      assignedGrade: 2,
      semester: '2-2',
      unitId: 'g2-2-length',
      coverageStatus: 'existing-reference',
      existingContentRefs: ['grade2:g2-2-length'],
    })
    expect(pilot['[2수03-13]']).toMatchObject({
      band: '1-2',
      assignedGrade: 2,
      semester: '2-2',
      unitId: 'g2-2-length',
      coverageStatus: 'existing-reference',
      existingContentRefs: ['grade2:g2-2-length'],
    })

    expect(Object.fromEntries(
      Object.entries(pilot).map(([standardCode, allocation]) => [
        standardCode,
        (allocation as { officialText: string }).officialText,
      ]),
    )).toEqual({
      '[2수03-10]': '길이 단위 1cm와 1m를 알고, 이를 이용하여 주변 사물의 길이를 측정할 수 있다.',
      '[2수03-11]': '1m와 1cm의 관계를 이해하고, 길이를 ‘몇 m 몇 cm’와 ‘몇 cm’로 표현할 수 있다.',
      '[2수03-12]': '여러 가지 물건의 길이를 어림하고, 길이에 대한 양감을 기른다.',
      '[2수03-13]': '실생활 문제 상황과 연결하여 길이의 덧셈과 뺄셈을 할 수 있다.',
    })
    expect(Object.values(pilot).every((allocation) =>
      (allocation as { allocationRationale: string }).allocationRationale.includes(
        '교육과정 자체는 학기와 단원을 배정하지 않으므로',
      ),
    )).toBe(true)
  })

  it.each([
    ['missing', (allocations: Record<string, unknown>[]) => allocations.filter((entry) => entry.standardCode !== '[2수03-11]'), 'missing_standard'],
    ['duplicate', (allocations: Record<string, unknown>[]) => [...allocations, { ...allocations.find((entry) => entry.standardCode === '[2수03-11]') }], 'duplicate_standard'],
    ['wrong band', (allocations: Record<string, unknown>[]) => allocations.map((entry) => entry.standardCode === '[2수03-11]' ? { ...entry, band: '3-4' } : entry), 'band_mismatch'],
    ['wrong grade', (allocations: Record<string, unknown>[]) => allocations.map((entry) => entry.standardCode === '[2수03-11]' ? { ...entry, assignedGrade: 1 } : entry), 'grade_mismatch'],
    ['wrong semester', (allocations: Record<string, unknown>[]) => allocations.map((entry) => entry.standardCode === '[2수03-11]' ? { ...entry, semester: '2-1' } : entry), 'semester_mismatch'],
    ['wrong unit', (allocations: Record<string, unknown>[]) => allocations.map((entry) => entry.standardCode === '[2수03-11]' ? { ...entry, unitId: 'g2-1-length' } : entry), 'unit_mismatch'],
    ['wrong source', (allocations: Record<string, unknown>[]) => allocations.map((entry) => entry.standardCode === '[2수03-11]' ? { ...entry, sourceUrl: 'https://example.invalid/curriculum' } : entry), 'invalid_source'],
    ['wrong source page', (allocations: Record<string, unknown>[]) => allocations.map((entry) => entry.standardCode === '[2수03-11]' ? { ...entry, sourcePage: 15 } : entry), 'invalid_source'],
    ['wrong official text', (allocations: Record<string, unknown>[]) => allocations.map((entry) => entry.standardCode === '[2수03-11]' ? { ...entry, officialText: '길이 표현을 이해할 수 있다.' } : entry), 'invalid_official_text'],
    ['missing product-allocation distinction', (allocations: Record<string, unknown>[]) => allocations.map((entry) => entry.standardCode === '[2수03-11]' ? { ...entry, allocationRationale: '현재 제품은 2-2 단원으로 운영한다.' } : entry), 'missing_product_allocation_rationale'],
    ['wrong content reference', (allocations: Record<string, unknown>[]) => allocations.map((entry) => entry.standardCode === '[2수03-11]' ? { ...entry, existingContentRefs: ['grade2:g2-1-length'] } : entry), 'invalid_grade2_reference'],
  ])('rejects a %s in the Grade 2 pilot ledger', (_label, mutate, expectedCode) => {
    const hasPilot = ledger.allocations.some(
      (allocation: { standardCode: string }) => allocation.standardCode === '[2수03-11]',
    )
    expect(hasPilot, 'the Grade 2 pilot allocation must exist before mutation').toBe(true)
    if (!hasPilot) return

    const allocations = mutate(ledger.allocations.map((entry: Record<string, unknown>) => ({ ...entry })))
    const result = validateCurriculumLedger(currentInput({ ledger: { ...ledger, allocations } }))

    expect(result.errors.map((error: { code: string }) => error.code)).toContain(expectedCode)
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

const packExpectations = [
  {
    fileName: 'g2-2-length.json',
    packId: 'pack-g2-2-length',
    unitId: 'g2-2-length',
    grade: 2,
    semester: '2-2',
    coveredStandardCodes: ['[2수03-11]', '[2수03-13]'],
    familyIds: [
      'g2-length-route-total',
      'g2-length-missing-segment',
      'g2-length-claim-check',
    ],
  },
  {
    fileName: 'unit-5-1-perimeter-area.json',
    packId: 'pack-unit-5-1-perimeter-area',
    unitId: 'unit-5-1-perimeter-area',
    grade: 5,
    semester: '5-1',
    coveredStandardCodes: ['[6수03-11]', '[6수03-13]', '[6수03-14]'],
    familyIds: [
      'g5-perimeter-boundary-rebuild',
      'g5-area-composite-inverse',
      'g5-area-overlap-reconstruction',
    ],
  },
  {
    fileName: 'unit-6-1-ratio.json',
    packId: 'pack-unit-6-1-ratio',
    unitId: 'unit-6-1-ratio',
    grade: 6,
    semester: '6-1',
    coveredStandardCodes: ['[6수02-02]', '[6수02-03]'],
    familyIds: [
      'g6-ratio-part-whole',
      'g6-ratio-relative-comparison',
      'g6-ratio-representation-check',
    ],
  },
] as const

function packPath(fileName: string) {
  return join(root, 'public/data/application-problems/packs', fileName)
}

describe('pilot unit knowledge packs', () => {
  it.each(packExpectations)('parses $fileName as an unapproved pilot with stable family refs', (expected) => {
    const path = packPath(expected.fileName)
    expect(existsSync(path), `missing ${expected.fileName}`).toBe(true)
    if (!existsSync(path)) return

    const pack = parseUnitKnowledgePackV1(JSON.parse(readFileSync(path, 'utf8')))

    expect(pack).toMatchObject({
      schemaVersion: 'unit-knowledge-pack-v1',
      packId: expected.packId,
      version: 1,
      unitId: expected.unitId,
      grade: expected.grade,
      semester: expected.semester,
      coverageStatus: 'pilot',
      releaseStatus: 'draft',
      coveredStandardCodes: expected.coveredStandardCodes,
      approval: {
        ownerStatus: 'pending',
        expertStatus: 'not-reviewed',
      },
    })
    expect(pack.familyRefs).toEqual(
      expected.familyIds.map((familyId) => ({ familyId, version: 1 })),
    )
  })

  it.each(packExpectations)('rejects an incomplete misconception derived from $fileName', (expected) => {
    const path = packPath(expected.fileName)
    expect(existsSync(path), `missing ${expected.fileName}`).toBe(true)
    if (!existsSync(path)) return

    const invalid = JSON.parse(readFileSync(path, 'utf8'))
    invalid.concepts[0].misconceptions[0].diagnosticEvidence = ''

    expect(() => parseUnitKnowledgePackV1(invalid)).toThrow(ContractValidationError)
  })

  it.each(packExpectations)('matches $fileName to the curriculum allocation unit and covered standards', (expected) => {
    const path = packPath(expected.fileName)
    expect(existsSync(path), `missing ${expected.fileName}`).toBe(true)
    if (!existsSync(path)) return

    const pack = parseUnitKnowledgePackV1(JSON.parse(readFileSync(path, 'utf8')))
    const allocations = pack.coveredStandardCodes.map((standardCode) =>
      ledger.allocations.find(
        (allocation: { standardCode: string }) => allocation.standardCode === standardCode,
      ),
    )

    expect(allocations).toHaveLength(expected.coveredStandardCodes.length)
    expect(allocations.every(Boolean)).toBe(true)
    expect(allocations).toEqual(
      expect.arrayContaining(
        pack.coveredStandardCodes.map((standardCode) =>
          expect.objectContaining({
            standardCode,
            unitId: pack.unitId,
            assignedGrade: pack.grade,
            semester: pack.semester,
          }),
        ),
      ),
    )
  })
})
