import { describe, expect, it } from 'vitest'

import {
  APPLICATION_PROBLEM_AUTHORING_CATALOG_V1,
  APPLICATION_UNIT_INVENTORY_V1,
  createReviewOnlyAuthoringCatalog,
  validateAuthoringProductionSeparation,
} from './authoring-catalog'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade5-registry'
import { selectApprovedRuntimeCandidates } from './registry'

describe('application unit inventory', () => {
  it('is the single public Grade 2-6 inventory with the exact current counts', () => {
    expect(APPLICATION_UNIT_INVENTORY_V1).toHaveLength(62)
    expect(Object.fromEntries([2, 3, 4, 5, 6].map((grade) => [
      grade,
      APPLICATION_UNIT_INVENTORY_V1.filter((unit) => unit.grade === grade).length,
    ]))).toEqual({ 2: 12, 3: 12, 4: 15, 5: 12, 6: 11 })
    expect(APPLICATION_UNIT_INVENTORY_V1.some((unit) => unit.grade === 1)).toBe(false)
    expect(new Set(APPLICATION_UNIT_INVENTORY_V1.map((unit) => `${unit.grade}:${unit.unitId}`)).size).toBe(62)
  })
})

describe('review-only authoring catalog', () => {
  it('starts empty and has no immutable release ledger or learner registry entries', () => {
    expect(APPLICATION_PROBLEM_AUTHORING_CATALOG_V1).toEqual({
      schemaVersion: 'application-problem-authoring-catalog-v1',
      unitCandidates: [],
    })
    expect('releaseLedger' in APPLICATION_PROBLEM_AUTHORING_CATALOG_V1).toBe(false)
    expect('entries' in APPLICATION_PROBLEM_AUTHORING_CATALOG_V1).toBe(false)
    expect(selectApprovedRuntimeCandidates({
      entries: [],
      releaseLedger: [],
    })).toEqual([])
  })

  it('rejects release ledgers and approved families at the review boundary', () => {
    expect(() => createReviewOnlyAuthoringCatalog({
      schemaVersion: 'application-problem-authoring-catalog-v1',
      unitCandidates: [],
      releaseLedger: [],
    })).toThrow(/release ledger/i)

    const productionEntry = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries[0]
    expect(() => createReviewOnlyAuthoringCatalog({
      schemaVersion: 'application-problem-authoring-catalog-v1',
      unitCandidates: [{
        pack: {
          schemaVersion: 'unit-knowledge-pack-v1',
          packId: productionEntry.family.packId,
          version: 1,
          unitId: productionEntry.family.unitId,
          grade: 5,
          semester: '5-1',
          coverageStatus: 'pilot',
          releaseStatus: 'draft',
          coveredStandardCodes: [productionEntry.family.primaryStandard],
          concepts: [],
          familyRefs: [{ familyId: productionEntry.family.familyId, version: 1 }],
          approval: { ownerStatus: 'pending', evidenceRefs: [], expertStatus: 'not-reviewed' },
        },
        familyCandidates: [{ ...productionEntry, family: { ...productionEntry.family, releaseStatus: 'approved' } }],
        completeness: { coreConceptIds: [], requiredRepresentations: [], hasKnowingCoverage: false },
      }],
    })).toThrow(/draft/i)
  })

  it('rejects any draft identity mixed into the learner production registry', () => {
    const productionEntry = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries[0]
    const catalog = createReviewOnlyAuthoringCatalog({
      schemaVersion: 'application-problem-authoring-catalog-v1',
      unitCandidates: [],
    })

    expect(validateAuthoringProductionSeparation({
      authoringCatalog: catalog,
      productionRegistries: [GRADE5_APPLICATION_PROBLEM_REGISTRY_V1],
      productionPacks: [],
    })).toEqual([])

    const mixed = {
      ...catalog,
      unitCandidates: [{
        pack: { packId: productionEntry.family.packId, version: 1 },
        familyCandidates: [{ family: { familyId: productionEntry.family.familyId, version: 1 } }],
      }],
    }
    expect(validateAuthoringProductionSeparation({
      authoringCatalog: mixed as typeof catalog,
      productionRegistries: [GRADE5_APPLICATION_PROBLEM_REGISTRY_V1],
      productionPacks: [],
    }).map((issue) => issue.code)).toContain('draft_family_in_production')
  })

  it('requires executable representative and boundary cases for every draft family', () => {
    const productionEntry = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries[0]
    const draftFamily = {
      ...productionEntry.family,
      releaseStatus: 'draft' as const,
      approval: { ownerStatus: 'pending' as const, evidenceRefs: [], expertStatus: 'not-reviewed' as const },
    }
    const [conceptId] = draftFamily.conceptIds
    const [misconceptionId] = draftFamily.misconceptionRefs

    expect(() => createReviewOnlyAuthoringCatalog({
      schemaVersion: 'application-problem-authoring-catalog-v1',
      unitCandidates: [{
        pack: {
          schemaVersion: 'unit-knowledge-pack-v1',
          packId: draftFamily.packId,
          version: 1,
          unitId: draftFamily.unitId,
          grade: 5,
          semester: '5-1',
          coverageStatus: 'pilot',
          releaseStatus: 'draft',
          coveredStandardCodes: [draftFamily.primaryStandard],
          concepts: [{
            conceptId,
            name: '검토용 개념',
            standardCodes: [draftFamily.primaryStandard],
            prerequisites: [],
            allowedScope: ['결정적 생성 검토'],
            excludedScope: ['승인된 학습자 콘텐츠'],
            misconceptions: [{
              id: misconceptionId,
              description: '검토용 오개념',
              diagnosticEvidence: '대표 사례에서 독립 답과 비교합니다.',
              correctionStrategy: '경계 사례의 수학 모델을 다시 확인합니다.',
            }],
          }],
          familyRefs: [{ familyId: draftFamily.familyId, version: draftFamily.version }],
          approval: { ownerStatus: 'pending', evidenceRefs: [], expertStatus: 'not-reviewed' },
        },
        familyCandidates: [{
          family: draftFamily,
          runtime: productionEntry.runtime,
          oracle: () => '0',
          visualValidator: () => true,
          placementProposal: {
            familyId: draftFamily.familyId,
            version: draftFamily.version,
            grade: 5,
            unitId: draftFamily.unitId,
            conceptId,
            cognitiveDomain: draftFamily.cognitiveDomain,
          },
        }],
        completeness: { coreConceptIds: [], requiredRepresentations: [], hasKnowingCoverage: false },
      }],
    })).toThrow(/representative.*boundary/i)
  })
})
