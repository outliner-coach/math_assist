import { describe, expect, it } from 'vitest'

import g5GeometryPack from '../../public/data/application-problems/packs/unit-5-1-perimeter-area.json'

import {
  APPLICATION_PROBLEM_AUTHORING_CATALOG_V1,
  APPLICATION_UNIT_INVENTORY_V1,
  createReviewOnlyAuthoringCatalog,
} from './application-problems/authoring-catalog'
import {
  parseUnitKnowledgePackV1,
  type GeneratedApplicationProblemV1,
} from './application-problems/contracts'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from './application-problems/grade5-registry'
import { generateApplicationProblem } from './application-problems/generator'
import { EMPTY_APPLICATION_PROBLEM_REGISTRY } from './application-problems/registry'
import {
  buildApplicationProblemReviewData,
  getApplicationProblemReviewData,
} from './problem-review'

function draftCatalog({ duplicateProduction = false } = {}) {
  const productionEntry = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries[0]
  if (productionEntry.runtime.kind !== 'deterministic-generator') {
    throw new Error('test fixture requires a deterministic generator')
  }
  const family = {
    ...productionEntry.family,
    familyId: duplicateProduction ? productionEntry.family.familyId : 'review-draft-family',
    packId: duplicateProduction ? productionEntry.family.packId : 'review-draft-pack',
    releaseStatus: 'draft' as const,
    approval: {
      ownerStatus: 'pending' as const,
      evidenceRefs: [],
      expertStatus: 'not-reviewed' as const,
    },
  }
  const runtime = {
    kind: 'deterministic-generator' as const,
    generator: {
      ...productionEntry.runtime.generator,
      familyId: family.familyId,
      packId: family.packId,
    },
  }
  const conceptId = family.conceptIds[0]
  const misconceptionId = family.misconceptionRefs[0]

  return createReviewOnlyAuthoringCatalog({
    schemaVersion: 'application-problem-authoring-catalog-v1',
    unitCandidates: [{
      pack: {
        schemaVersion: 'unit-knowledge-pack-v1',
        packId: family.packId,
        version: 1,
        unitId: family.unitId,
        grade: 5,
        semester: '5-1',
        coverageStatus: 'pilot',
        releaseStatus: 'draft',
        coveredStandardCodes: [family.primaryStandard],
        concepts: [{
          conceptId,
          name: '검수용 개념',
          standardCodes: [family.primaryStandard],
          prerequisites: [],
          allowedScope: ['검수 화면에서만 실행한다.'],
          excludedScope: ['학습자 세션에 넣지 않는다.'],
          misconceptions: [{
            id: misconceptionId,
            description: '검수용 오개념',
            diagnosticEvidence: '대표 사례와 경계 사례를 비교한다.',
            correctionStrategy: '독립 검산으로 관계를 다시 확인한다.',
          }],
        }],
        familyRefs: [{ familyId: family.familyId, version: family.version }],
        approval: {
          ownerStatus: 'pending',
          evidenceRefs: [],
          expertStatus: 'not-reviewed',
        },
      },
      familyCandidates: [{
        family,
        runtime,
        oracle: (problem: { answer: { normalized: string } }) => problem.answer.normalized,
        visualValidator: () => true,
        placementProposal: {
          familyId: family.familyId,
          version: family.version,
          grade: 5,
          unitId: family.unitId,
          conceptId,
          cognitiveDomain: family.cognitiveDomain,
        },
        reviewCases: [
          { caseId: 'representative-case', kind: 'representative', seed: 101, variantIndex: 0 },
          { caseId: 'boundary-case', kind: 'boundary', seed: 909, variantIndex: 1 },
        ],
      }],
      completeness: {
        coreConceptIds: [],
        requiredRepresentations: [],
        hasKnowingCoverage: false,
      },
    }],
  })
}

describe('application problem review catalog', () => {
  it('uses the canonical 62-unit inventory even when grades have no prepared families', () => {
    const data = buildApplicationProblemReviewData({
      authoringCatalog: APPLICATION_PROBLEM_AUTHORING_CATALOG_V1,
      productionRegistry: EMPTY_APPLICATION_PROBLEM_REGISTRY,
      productionEvidence: { rows: [], generatedSnapshots: [] },
    })

    expect(data.rows).toEqual([])
    expect(data.units).toHaveLength(62)
    expect(data.summary).toMatchObject({
      totalRows: 0,
      totalUnits: 62,
      byGrade: { 2: 12, 3: 12, 4: 15, 5: 12, 6: 11 },
    })
    expect(data.filters.grades).toEqual([2, 3, 4, 5, 6])
    expect(data.filters.semesters.map((option) => option.value)).toEqual([
      '2-1', '2-2', '3-1', '3-2', '4-1', '4-2', '5-1', '5-2', '6-1', '6-2',
    ])
    expect(data.filters.units).toHaveLength(62)
  })

  it('combines review-only draft and production families without duplicate identities', () => {
    const data = buildApplicationProblemReviewData({ authoringCatalog: draftCatalog() })
    const deduplicated = buildApplicationProblemReviewData({
      authoringCatalog: draftCatalog({ duplicateProduction: true }),
    })
    const identities = data.rows.map((row) => `${row.familyId}@${row.version}`)

    expect(data.rows).toHaveLength(10)
    expect(new Set(identities).size).toBe(10)
    expect(data.rows.filter((row) => row.source === 'draft')).toHaveLength(1)
    expect(data.rows.filter((row) => row.source === 'production')).toHaveLength(9)
    expect(deduplicated.rows).toHaveLength(9)
    expect(deduplicated.rows.filter((row) => (
      row.familyId === GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries[0].family.familyId
    ))).toEqual([expect.objectContaining({ source: 'production' })])
    expect(data.filters.concepts.map((option) => option.value)).toContain(
      data.rows.find((row) => row.source === 'draft')?.conceptIds[0],
    )
    expect(data.filters.representations.map((option) => option.value)).toEqual(
      Array.from(new Set(data.rows.flatMap((row) => row.representations))).sort(),
    )
  })

  it('resolves production metadata by pack id and runtime pack version', () => {
    const entry = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries[0]
    if (entry.runtime.kind !== 'deterministic-generator') {
      throw new Error('test fixture requires a deterministic generator')
    }
    const approvedV1 = parseUnitKnowledgePackV1(g5GeometryPack)
    const draftV2 = parseUnitKnowledgePackV1({
      ...JSON.parse(JSON.stringify(g5GeometryPack)),
      version: 2,
      releaseStatus: 'draft',
      approval: {
        ownerStatus: 'pending',
        evidenceRefs: [],
        expertStatus: 'not-reviewed',
      },
      concepts: approvedV1.concepts.map((concept) => ({
        ...concept,
        name: `V2 ${concept.name}`,
        misconceptions: concept.misconceptions.map((misconception) => ({
          ...misconception,
          description: `V2 DRAFT ${misconception.description}`,
        })),
      })),
    })
    const row = buildApplicationProblemReviewData({
      productionRegistry: {
        entries: [entry],
        releaseLedger: [GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger[0]],
      },
      productionPacks: [approvedV1, draftV2],
      productionEvidence: { rows: [], generatedSnapshots: [] },
    }).rows[0]

    expect(row).toMatchObject({
      packId: approvedV1.packId,
      packVersion: 1,
      releaseStatus: 'approved',
    })
    expect(row.misconceptions.some((misconception) => (
      misconception.description.includes('V2 DRAFT')
    ))).toBe(false)
  })

  it('fails closed when a legacy production source cannot resolve one pack version', () => {
    const baseEntry = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries[0]
    if (baseEntry.runtime.kind !== 'deterministic-generator') {
      throw new Error('test fixture requires a deterministic generator')
    }
    const generated = generateApplicationProblem({
      family: baseEntry.family,
      generator: baseEntry.runtime.generator,
      packVersion: 1,
      seed: 0,
      variantIndex: 0,
    })
    const { packVersion: _packVersion, ...legacyProblem } = generated
    const family = { ...baseEntry.family, runtimeMode: 'static-corpus' as const }
    const approvedV1 = parseUnitKnowledgePackV1(g5GeometryPack)
    const draftV2 = parseUnitKnowledgePackV1({
      ...JSON.parse(JSON.stringify(g5GeometryPack)),
      version: 2,
      releaseStatus: 'draft',
      approval: {
        ownerStatus: 'pending',
        evidenceRefs: [],
        expertStatus: 'not-reviewed',
      },
    })
    const row = buildApplicationProblemReviewData({
      productionRegistry: {
        entries: [{
          family,
          runtime: {
            kind: 'static-corpus',
            entries: [{
              corpusId: 'legacy-review-corpus',
              problem: legacyProblem as GeneratedApplicationProblemV1,
              review: {
                status: 'approved',
                reviewerId: 'review-test',
                reviewedAt: '2026-08-18T00:00:00.000Z',
                evidenceRefs: ['src/lib/application-problem-review.test.ts'],
              },
            }],
          },
        }],
        releaseLedger: [family],
      },
      productionPacks: [approvedV1, draftV2],
      productionEvidence: { rows: [], generatedSnapshots: [] },
    }).rows[0]

    expect(row).toMatchObject({
      packVersion: null,
      metadataEvidence: { status: 'missing' },
      automaticChecks: {
        audit: {
          status: 'failed',
          issues: expect.arrayContaining([
            expect.stringContaining('ambiguous production pack version'),
          ]),
        },
      },
    })
  })

  it('re-executes the production generator instead of trusting a corrupted snapshot payload', () => {
    const entry = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries[0]
    if (entry.runtime.kind !== 'deterministic-generator') {
      throw new Error('test fixture requires a deterministic generator')
    }
    const generated = generateApplicationProblem({
      family: entry.family,
      generator: entry.runtime.generator,
      packVersion: entry.runtime.generator.packVersion,
      seed: 1703,
      variantIndex: 0,
    })
    const corrupted = {
      ...generated,
      answer: { ...generated.answer, normalized: 'CORRUPTED SNAPSHOT ANSWER' },
    }
    const representative = buildApplicationProblemReviewData({
      productionRegistry: {
        entries: [entry],
        releaseLedger: [GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger[0]],
      },
      productionPacks: [parseUnitKnowledgePackV1(g5GeometryPack)],
      productionEvidence: {
        rows: [],
        generatedSnapshots: [{
          family: entry.family,
          seed: 1703,
          first: corrupted,
          second: corrupted,
        }],
      },
    }).rows[0].reviewCases.find((reviewCase) => reviewCase.kind === 'representative')

    expect(representative?.problem.answer).not.toBe('CORRUPTED SNAPSHOT ANSWER')
    expect(representative?.independentVerification.oracleStatus).toBe('passed')
  })

  it('shows representative and boundary problems with reproducibility and independent checks', () => {
    const row = buildApplicationProblemReviewData({ authoringCatalog: draftCatalog() })
      .rows.find((candidate) => candidate.familyId === 'review-draft-family')

    expect(row).toBeDefined()
    expect(row?.semester).toBe('5-1')
    expect(row?.reviewCases.map((reviewCase) => reviewCase.kind)).toEqual([
      'representative',
      'boundary',
    ])
    for (const reviewCase of row?.reviewCases ?? []) {
      expect(reviewCase.reproducibility).toMatchObject({
        caseId: expect.any(String),
        seed: expect.any(Number),
        variantIndex: expect.any(Number),
        deterministic: true,
      })
      expect(reviewCase.problem.prompt).not.toBe('')
      expect(reviewCase.problem.answer).not.toBe('')
      expect(reviewCase.problem.solutionSteps.length).toBeGreaterThan(0)
      expect(reviewCase.problem.hintSteps.length).toBeGreaterThan(0)
      if (reviewCase.problem.correctChoiceIndex !== null) {
        expect(reviewCase.problem.distractors).not.toContain(
          reviewCase.problem.choices[reviewCase.problem.correctChoiceIndex],
        )
      }
      expect(reviewCase.independentVerification).toMatchObject({
        answerMatches: true,
        visualValid: true,
      })
    }
    expect(row?.familyEvidence).toMatchObject({
      status: 'missing',
      cases: [
        expect.objectContaining({ kind: 'representative', proofStatus: 'missing' }),
        expect.objectContaining({ kind: 'boundary', proofStatus: 'missing' }),
      ],
    })
  })

  it('fails only the corrupted declared boundary evidence instead of inheriting representative proof', () => {
    const baseEntry = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries[0]
    if (baseEntry.runtime.kind !== 'deterministic-generator') {
      throw new Error('test fixture requires a deterministic generator')
    }
    const originalGenerator = baseEntry.runtime.generator
    const entry = {
      ...baseEntry,
      runtime: {
        kind: 'deterministic-generator' as const,
        generator: {
          ...originalGenerator,
          sample(context: Parameters<typeof originalGenerator.sample>[0]) {
            const sample = originalGenerator.sample(context)
            if (!sample || context.variantIndex !== 1) return sample
            const answer = originalGenerator.render({
              params: sample.params,
              mathModel: sample.mathModel,
            }).answer.normalized
            return {
              ...sample,
              mathModel: {
                ...(sample.mathModel as Record<string, unknown>),
                disclosureProbe: { before: { text: answer } },
              },
            }
          },
          render(context: Parameters<typeof originalGenerator.render>[0]) {
            if (context.mathModel && typeof context.mathModel === 'object' && !Array.isArray(context.mathModel)) {
              const { disclosureProbe: _disclosureProbe, ...mathModel } = context.mathModel
              return originalGenerator.render({ ...context, mathModel })
            }
            return originalGenerator.render(context)
          },
        },
      },
    }
    const productionReviewDeclarations = [{
      family: { familyId: entry.family.familyId, version: entry.family.version },
      proofAuthorityId: 'test-declared-proof-authority',
      cases: [
        { caseId: 'declared-representative', kind: 'representative' as const, seed: 0, variantIndex: 0 },
        { caseId: 'declared-boundary', kind: 'boundary' as const, seed: 0, variantIndex: 1 },
      ],
      oracle(problem: GeneratedApplicationProblemV1) {
        return problem.variantIndex === 1 ? 'corrupted-boundary-answer' : problem.answer.normalized
      },
      visualValidator(problem: GeneratedApplicationProblemV1) {
        return problem.variantIndex !== 1
      },
    }]
    const data = buildApplicationProblemReviewData({
      productionRegistry: {
        entries: [entry],
        releaseLedger: [GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger[0]],
      },
      productionPacks: [parseUnitKnowledgePackV1(g5GeometryPack)],
      productionReviewDeclarations,
    } as Parameters<typeof buildApplicationProblemReviewData>[0] & {
      productionReviewDeclarations: typeof productionReviewDeclarations
    })
    const representative = data.rows[0].reviewCases.find((reviewCase) => reviewCase.kind === 'representative')
    const boundary = data.rows[0].reviewCases.find((reviewCase) => reviewCase.kind === 'boundary')

    expect(representative?.independentVerification).toMatchObject({
      oracleStatus: 'passed',
      visualStatus: 'passed',
      disclosureStatus: 'passed',
      proofStatus: 'passed',
    })
    expect(boundary?.reproducibility).toMatchObject({
      caseId: 'declared-boundary',
      seed: 0,
      variantIndex: 1,
    })
    expect(boundary?.independentVerification).toMatchObject({
      oracleStatus: 'failed',
      visualStatus: 'blocked',
      disclosureStatus: 'failed',
      proofStatus: 'blocked',
    })
    expect(data.rows[0]).toMatchObject({
      automaticChecks: { audit: { status: 'failed' } },
      familyEvidence: {
        status: 'blocked',
        cases: [
          expect.objectContaining({ kind: 'representative', status: 'passed' }),
          expect.objectContaining({ kind: 'boundary', status: 'blocked' }),
        ],
      },
    })
  })

  it('shows missing production evidence as a failed review instead of hiding the family', () => {
    const entry = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries[0]
    const data = buildApplicationProblemReviewData({
      productionRegistry: {
        entries: [entry],
        releaseLedger: [GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger[0]],
      },
      productionPacks: [parseUnitKnowledgePackV1(g5GeometryPack)],
      productionEvidence: { rows: [], generatedSnapshots: [] },
    })

    expect(data.rows).toHaveLength(1)
    expect(data.rows[0].automaticChecks).toMatchObject({
      deterministicSample: true,
      proof: { proven: false, checkedCount: 0 },
      audit: { status: 'failed', issues: ['missing production quality evidence'] },
    })
  })

  it('keeps the current nine approved pilot families while exposing all filter dimensions', () => {
    const data = getApplicationProblemReviewData()

    expect(APPLICATION_UNIT_INVENTORY_V1).toHaveLength(62)
    expect(data.rows).toHaveLength(9)
    expect(data.rows.every((row) => row.releaseStatus === 'approved')).toBe(true)
    expect(Object.keys(data.filters)).toEqual([
      'grades',
      'semesters',
      'units',
      'concepts',
      'families',
      'cognitiveDomains',
      'reasoningPatterns',
      'representations',
      'proofModes',
      'releaseStatuses',
    ])
    expect(data.rows.every((row) => row.reviewCases.length >= 2)).toBe(true)
  })
})
