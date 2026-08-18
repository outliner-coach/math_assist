import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  auditApplicationProblemQuality,
  classifyStoredApplicationPacks,
  loadProductionApplicationProblemQualityInput,
  parseApplicationAuditSelection,
} from '../../scripts/application-problem-quality-core.js'

const approval = {
  ownerStatus: 'pending',
  evidenceRefs: [],
  expertStatus: 'not-reviewed',
}

let cachedRolloutContext: Record<string, unknown> | undefined

function rolloutContext() {
  if (!cachedRolloutContext) {
    const production = loadProductionApplicationProblemQualityInput()
    cachedRolloutContext = {
      rollout: production.rollout,
      unitInventory: production.unitInventory,
      unitBaseBankEvidence: production.unitBaseBankEvidence ?? [],
      authoringCatalog: {
        schemaVersion: 'application-problem-authoring-catalog-v1',
        unitCandidates: [],
      },
      canonicalReleaseLedger: [],
    }
  }
  return cachedRolloutContext
}

function pack(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'unit-knowledge-pack-v1',
    packId: 'pack-g5-area',
    version: 1,
    unitId: 'g5-1-area',
    grade: 5,
    semester: '5-1',
    coverageStatus: 'pilot',
    releaseStatus: 'draft',
    coveredStandardCodes: ['5S-AREA'],
    concepts: [{
      conceptId: 'area-001',
      name: '넓이',
      standardCodes: ['5S-AREA'],
      prerequisites: [],
      allowedScope: ['rectangle'],
      excludedScope: ['fraction'],
      misconceptions: [{
        id: 'area-addition',
        description: '겹친 넓이를 두 번 더합니다.',
        diagnosticEvidence: '합집합을 묻는 문제에서 교집합을 두 번 더합니다.',
        correctionStrategy: '겹친 부분을 한 번만 세게 합니다.',
      }],
    }],
    familyRefs: [{ familyId: 'g5-area-inverse', version: 1 }],
    approval,
    ...overrides,
  }
}

function family(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'application-problem-family-v1',
    familyId: 'g5-area-inverse',
    version: 1,
    packId: 'pack-g5-area',
    unitId: 'g5-1-area',
    conceptIds: ['area-001'],
    primaryStandard: '5S-AREA',
    connectedStandards: [],
    cognitiveDomain: 'reasoning',
    reasoningPattern: 'inverse',
    representations: ['text', 'diagram'],
    contextType: 'real_world',
    readingLoad: 'medium',
    estimatedSteps: 2,
    modelId: 'area-model',
    unknownRole: 'missing-side',
    requiredStudentActions: ['choose_model', 'infer_missing_value', 'execute_calculation'],
    misconceptionRefs: ['area-addition'],
    visualPolicy: {
      role: 'required',
      semantics: 'quantitative',
      generatorId: 'area-visual',
      answerCritical: true,
    },
    proofMode: 'exhaustive',
    runtimeMode: 'deterministic-generator',
    releaseStatus: 'draft',
    approval,
    ...overrides,
  }
}

function problem(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'generated-application-problem-v1',
    instanceId: 'area-instance-1',
    familyId: 'g5-area-inverse',
    generatorVersion: 1,
    packId: 'pack-g5-area',
    params: { width: 4, area: 20 },
    prompt: '넓이가 20 cm²인 직사각형의 다른 한 변은 몇 cm인가요?',
    answer: { format: 'number', normalized: '5' },
    solutionSteps: ['20 ÷ 4 = 5'],
    hintSteps: ['넓이를 알려진 변의 길이로 나눕니다.'],
    misconceptionRefs: ['area-addition'],
    visual: {
      role: 'required',
      semantics: 'quantitative',
      generatorId: 'area-visual',
      generatorVersion: 1,
      answerCritical: true,
      mathModel: { width: 4, height: 5, area: 20, unit: 'cm' },
    },
    ...overrides,
  }
}

function baseline(overrides: Record<string, unknown> = {}) {
  const currentFamily = family()
  return {
    ...rolloutContext(),
    packs: [pack()],
    families: [currentFamily],
    ledgerAllocations: [{ standardCode: '5S-AREA', unitId: 'g5-1-area', assignedGrade: 5, semester: '5-1' }],
    registries: [],
    generatedSnapshots: [{ family: currentFamily, seed: 7, first: problem(), second: problem() }],
    proofReports: [{ family: currentFamily, mode: 'exhaustive', proven: true, checkedCount: 1, issues: [] }],
    proofAuthorities: [{ familyId: currentFamily.familyId, familyVersion: currentFamily.version, mode: 'exhaustive', expectedCount: 1 }],
    oracleResults: [{ family: currentFamily, problem: problem(), answer: '5', solution: '20 ÷ 4 = 5', unit: 'cm' }],
    visualResults: [{ family: currentFamily, problem: problem(), valid: true }],
    answerExposureResults: [{ family: currentFamily, problem: problem(), exposed: false }],
    sessionContracts: [
      { grade: 2, legacyCount: 144, candidateCount: 1, sessionCount: 145, difficultyDistribution: { easy: 48, medium: 48, applied: 48 }, storageKey: 'mathAssist_grade2Progress' },
      { grade: 5, legacyCount: 10, candidateCount: 1, sessionCount: 10, difficultyDistribution: { 1: 4, 2: 4, 3: 2 }, storageKey: 'mathAssist_currentSession' },
      {
        grade: 6,
        legacyCount: 10,
        candidateCount: 1,
        sessionCount: 5,
        allowedSessionCounts: [5, 10],
        difficultyDistribution: { 1: 2, 2: 2, 3: 1 },
        generatedSessions: [
          { count: 5, difficultyDistribution: { 1: 2, 2: 2, 3: 1 } },
          { count: 10, difficultyDistribution: { 1: 4, 2: 4, 3: 2 } },
        ],
        storageKey: 'mathAssist_grade6CurrentSession',
      },
    ],
    ...overrides,
  }
}

function codes(input: Record<string, unknown>) {
  return auditApplicationProblemQuality(input).errors.map((issue: { code: string }) => issue.code)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function authoringSafetyCatalog(overrides: Record<string, unknown> = {}) {
  const draftFamily = family({ unitId: 'unit-5-1-perimeter-area' })
  return {
    schemaVersion: 'application-problem-authoring-catalog-v1',
    unitCandidates: [{
      pack: pack({ unitId: draftFamily.unitId }),
      familyCandidates: [{
        family: draftFamily,
        runtime: {
          kind: 'deterministic-generator',
          generator: {
            familyId: draftFamily.familyId,
            version: draftFamily.version,
            packId: draftFamily.packId,
            packVersion: 1,
            maxAttempts: 1,
            sample: () => ({ params: { width: 4, area: 20 }, mathModel: { width: 4, height: 5, area: 20, unit: 'cm' } }),
            render: () => ({
              prompt: '넓이가 20 cm²인 직사각형의 다른 한 변은 몇 cm인가요?',
              answer: { format: 'number', normalized: '5' },
              solutionSteps: ['20 ÷ 4 = 5'],
              hintSteps: ['넓이를 알려진 변의 길이로 나눕니다.'],
            }),
          },
        },
        oracle: () => '5',
        visualValidator: () => true,
        placementProposal: {
          familyId: draftFamily.familyId,
          version: draftFamily.version,
          grade: 5,
          unitId: draftFamily.unitId,
          conceptId: draftFamily.conceptIds[0],
          cognitiveDomain: draftFamily.cognitiveDomain,
        },
        reviewCases: [
          { caseId: 'representative-area', kind: 'representative', seed: 7, variantIndex: 0 },
          { caseId: 'boundary-area', kind: 'boundary', seed: 11, variantIndex: 1 },
        ],
        ...overrides,
      }],
      completeness: { coreConceptIds: [], requiredRepresentations: [], hasKnowingCoverage: false },
    }],
  }
}

function completeClaimInput() {
  const production = loadProductionApplicationProblemQualityInput()
  const unitId = 'unit-5-1-perimeter-area'
  const conceptIds = ['area-001', 'areaunit-001', 'perimeter-001', 'polygonarea-001']
  const requiredRepresentations = ['diagram', 'equation', 'manipulative', 'text']
  const standardCodes = ['[6수03-11]', '[6수03-12]', '[6수03-13]', '[6수03-14]']
  const familyBase = {
    packId: 'pack-test-complete-area',
    unitId,
    primaryStandard: standardCodes[0],
    connectedStandards: standardCodes.slice(1),
    representations: requiredRepresentations,
  }
  const applyingFamilies = conceptIds.map((conceptId: string, index: number) => family({
    ...familyBase,
    familyId: `g5-complete-applying-${index}`,
    conceptIds: [conceptId],
    cognitiveDomain: 'applying',
    reasoningPattern: 'multi_step',
    modelId: `complete-applying-model-${index}`,
    unknownRole: `complete-applying-unknown-${index}`,
    misconceptionRefs: [`mis-${conceptId}`],
  }))
  const reasoningFamilies = ['inverse', 'model_and_check', 'error_analysis'].map((reasoningPattern, index) => family({
    ...familyBase,
    familyId: `g5-complete-reasoning-${index}`,
    conceptIds,
    reasoningPattern,
    modelId: `complete-reasoning-model-${index}`,
    unknownRole: `complete-reasoning-unknown-${index}`,
    misconceptionRefs: [`mis-${conceptIds[index]}`],
  }))
  const families = [...applyingFamilies, ...reasoningFamilies]
  const completePack = pack({
    packId: familyBase.packId,
    unitId: familyBase.unitId,
    coverageStatus: 'complete',
    coveredStandardCodes: standardCodes,
    concepts: conceptIds.map((conceptId: string) => ({
      conceptId,
      name: conceptId,
      standardCodes,
      prerequisites: [],
      allowedScope: ['source-derived complete coverage'],
      excludedScope: ['outside canonical unit'],
      misconceptions: [{
        id: `mis-${conceptId}`,
        description: '검토용 오개념',
        diagnosticEvidence: '독립 검산으로 확인합니다.',
        correctionStrategy: '표현과 식을 다시 연결합니다.',
      }],
    })),
    familyRefs: families.map((entry) => ({ familyId: entry.familyId, version: entry.version })),
  })
  return baseline({
    packs: [completePack],
    families,
    registries: [],
    ledgerAllocations: production.ledgerAllocations,
    unitBaseBankEvidence: production.unitBaseBankEvidence,
    completeCoverageContexts: [{
      packId: completePack.packId,
      version: completePack.version,
      coreConceptIds: conceptIds,
      requiredRepresentations,
      hasKnowingCoverage: true,
    }],
  })
}

describe('application problem quality audit', () => {
  it('keeps unlinked draft pack files out of the production audit until the authoring catalog connects them', () => {
    const approvedPack = pack({
      packId: 'approved-pack',
      releaseStatus: 'approved',
      approval: {
        ownerStatus: 'approved',
        ownerId: 'project-owner',
        approvedAt: '2026-08-18T00:00:00.000Z',
        evidenceRefs: ['docs/standards.md'],
        expertStatus: 'not-reviewed',
      },
    })
    const linkedDraftPack = pack({ packId: 'linked-draft-pack' })
    const unlinkedDraftPack = pack({ packId: 'unlinked-draft-pack' })

    const classified = classifyStoredApplicationPacks(
      [approvedPack, linkedDraftPack, unlinkedDraftPack],
      {
        schemaVersion: 'application-problem-authoring-catalog-v1',
        unitCandidates: [{ pack: linkedDraftPack, familyCandidates: [], completeness: {} }],
      },
    )

    expect(classified.productionPacks).toEqual([approvedPack])
    expect(classified.authoringPackFiles).toEqual([linkedDraftPack])
    expect(classified.unlinkedDraftPacks).toEqual([unlinkedDraftPack])
  })

  it('materializes actual production evidence for every registered family and session contract', () => {
    const input = loadProductionApplicationProblemQualityInput()

    const report = auditApplicationProblemQuality(input)

    expect(input.generatedSnapshots).toHaveLength(input.families.length)
    expect(input.proofReports).toHaveLength(input.families.length)
    expect(input.oracleResults).toHaveLength(input.families.length)
    expect(input.visualResults).toHaveLength(input.families.length)
    expect(input.answerExposureResults).toHaveLength(input.families.length)
    expect(input.unitBaseBankEvidence).toHaveLength(62)
    expect(input.unitBaseBankEvidence.every((evidence: {
      coreConceptIds: string[]
      requiredRepresentations: string[]
      hasKnowingCoverage: boolean
    }) => (
      evidence.coreConceptIds.length > 0 &&
      evidence.requiredRepresentations.length > 0 &&
      evidence.hasKnowingCoverage
    ))).toBe(true)
    expect(report.familyEvidence).toHaveLength(input.families.length)
    expect(report.familyEvidence.every((evidence: { status: string }) => evidence.status === 'passed')).toBe(true)
    expect(report.summary).toMatchObject({
      unitCount: 62,
      approvedFamilyCount: 9,
      draftFamilyCount: 0,
      errorCount: 0,
    })
    expect(report.unitReports).toHaveLength(62)
    expect(report.unitReports.filter((unit: { grade: number }) => unit.grade === 1)).toEqual([])
    expect(report.unitReports.find((unit: { unitId: string }) => unit.unitId === 'unit-5-1-perimeter-area'))
      .toMatchObject({ rolloutStatus: 'pending', baselinePilot: true, gradeComplete: false })
    expect(report.unitReports.filter((unit: { grade: number }) => unit.grade > 2)
      .every((unit: { rolloutStatus: string }) => unit.rolloutStatus === 'pending')).toBe(true)
    expect(input.sessionContracts).toMatchObject([
      { grade: 2, storageKey: 'mathAssist_grade2Progress', legacyCount: 144 },
      { grade: 5, storageKey: 'mathAssist_currentSession', legacyCount: 10 },
      { grade: 6, storageKey: 'mathAssist_grade6CurrentSession', legacyCount: 10 },
    ])
  })

  it('derives the canonical 62-unit denominator while flagging absent audit contract inputs', () => {
    const report = auditApplicationProblemQuality({})

    expect(report.unitReports).toHaveLength(62)
    expect(report.summary.unitCount).toBe(62)
    expect(report.errors.map((error: { code: string }) => error.code)).toEqual(
      expect.arrayContaining(['APQ_UNIT_INVENTORY_INPUT', 'APQ_ROLLOUT_INPUT']),
    )
  })

  it('rejects missing canonical base-bank evidence even when no pack claims completeness', () => {
    const input = loadProductionApplicationProblemQualityInput()
    input.unitBaseBankEvidence = []

    const report = auditApplicationProblemQuality(input)

    expect(report.errors.map((error: { code: string }) => error.code)).toContain('APQ_BASE_BANK_EVIDENCE')
  })

  it('rejects a registry-local ledger that does not match exactly one immutable canonical snapshot', () => {
    const approved = deepFreeze(family({
      releaseStatus: 'approved',
      approval: {
        ownerStatus: 'approved',
        ownerId: 'owner',
        approvedAt: '2026-07-01T00:00:00Z',
        evidenceRefs: ['docs/standards.md'],
        expertStatus: 'not-reviewed',
      },
    }))
    const forged = deepFreeze({ ...approved, modelId: 'forged-local-ledger-model' })
    const report = auditApplicationProblemQuality(baseline({
      families: [forged],
      canonicalReleaseLedger: [approved],
      registries: [{
        grade: 5,
        entries: [{ family: forged, runtime: { kind: 'deterministic-generator' } }],
        releaseLedger: [forged],
      }],
    }), { mode: 'release', grade: 2 })

    expect(report.errors.map((error: { code: string }) => error.code)).toContain('APQ_RELEASE_LEDGER')
  })

  it('rejects non-approved production entries in release mode even when their local ledger matches', () => {
    const draft = deepFreeze(family())
    const report = auditApplicationProblemQuality(baseline({
      families: [draft],
      canonicalReleaseLedger: [draft],
      registries: [{
        grade: 5,
        entries: [{ family: draft, runtime: { kind: 'deterministic-generator' } }],
        releaseLedger: [draft],
      }],
    }), { mode: 'release', grade: 2 })

    expect(report.errors.map((error: { code: string }) => error.code)).toContain('APQ_RELEASE_APPROVAL')
  })

  it('rejects a draft production entry in default work mode even when the caller supplies matching ledgers', () => {
    const input = loadProductionApplicationProblemQualityInput()
    const targetRegistry = input.registries[0]
    const targetEntry = targetRegistry.entries[0]
    const draftFamily = deepFreeze({
      ...targetEntry.family,
      releaseStatus: 'draft',
      approval: { ownerStatus: 'pending', evidenceRefs: [], expertStatus: 'not-reviewed' },
    })
    input.registries = input.registries.map((registry: any, index: number) => index === 0
      ? {
          ...registry,
          entries: registry.entries.map((entry: any, entryIndex: number) => entryIndex === 0
            ? { ...entry, family: draftFamily }
            : entry),
          releaseLedger: registry.releaseLedger.map((snapshot: any, snapshotIndex: number) => snapshotIndex === 0
            ? draftFamily
            : snapshot),
        }
      : registry)
    input.canonicalReleaseLedger = input.canonicalReleaseLedger.map((snapshot: any) => (
      snapshot.familyId === draftFamily.familyId && snapshot.version === draftFamily.version
        ? draftFamily
        : snapshot
    ))

    const report = auditApplicationProblemQuality(input)

    expect(report.errors.map((error: { code: string }) => error.code))
      .toContain('APQ_PRODUCTION_REGISTRY')
  })

  it('rejects an orphan production release-ledger snapshot with no executable entry', () => {
    const input = loadProductionApplicationProblemQualityInput()
    input.registries = input.registries.map((registry: any, index: number) => index === 0
      ? { ...registry, entries: registry.entries.slice(1) }
      : registry)

    const report = auditApplicationProblemQuality(input)

    expect(report.errors.map((error: { code: string }) => error.code))
      .toContain('APQ_RELEASE_LEDGER')
  })

  it.each([
    ['all pilot registries missing', (input: any) => {
      input.registries = []
    }],
    ['missing executable pilot', (input: any) => {
      input.registries[0] = { ...input.registries[0], entries: input.registries[0].entries.slice(1) }
    }],
    ['missing pilot ledger', (input: any) => {
      input.registries[0] = { ...input.registries[0], releaseLedger: input.registries[0].releaseLedger.slice(1) }
    }],
    ['duplicate executable pilot', (input: any) => {
      input.registries[0] = {
        ...input.registries[0],
        entries: [...input.registries[0].entries, input.registries[0].entries[0]],
      }
    }],
    ['changed pilot snapshot accepted from caller as canonical', (input: any) => {
      const original = input.registries[0].entries[0].family
      const changed = deepFreeze({ ...original, modelId: `${original.modelId}-changed` })
      input.registries[0] = {
        ...input.registries[0],
        entries: input.registries[0].entries.map((entry: any, index: number) => index === 0
          ? { ...entry, family: changed }
          : entry),
        releaseLedger: input.registries[0].releaseLedger.map((snapshot: any, index: number) => index === 0
          ? changed
          : snapshot),
      }
      input.canonicalReleaseLedger = input.canonicalReleaseLedger.map((snapshot: any) => (
        snapshot.familyId === changed.familyId && snapshot.version === changed.version ? changed : snapshot
      ))
    }],
  ])('preserves the fixed production pilots exactly once: %s', (_label, mutate) => {
    const input = loadProductionApplicationProblemQualityInput() as any
    mutate(input)

    const report = auditApplicationProblemQuality(input)

    expect(report.errors.map((error: { code: string }) => error.code))
      .toContain('APQ_FIXED_PILOT_REGISTRY')
  })

  it('runs the review-only production-separation contract in the real audit path', () => {
    const report = auditApplicationProblemQuality(baseline({
      authoringCatalog: authoringSafetyCatalog(),
    }))

    expect(report.errors.map((error: { code: string }) => error.code)).toContain('APQ_DRAFT_PRODUCTION_MIX')
  })

  it.each([
    ['forbidden release ledger', (catalog: any) => { catalog.releaseLedger = [] }],
    ['duplicate family identity', (catalog: any) => {
      catalog.unitCandidates = [...catalog.unitCandidates, catalog.unitCandidates[0]]
    }],
    ['approved authoring family', (catalog: any) => {
      catalog.unitCandidates[0].familyCandidates[0].family.releaseStatus = 'approved'
    }],
    ['missing boundary review evidence', (catalog: any) => {
      catalog.unitCandidates[0].familyCandidates[0].reviewCases = [
        catalog.unitCandidates[0].familyCandidates[0].reviewCases[0],
      ]
    }],
  ])('parses supplied authoring catalogs through the canonical contract: %s', (_label, mutate) => {
    const catalog = authoringSafetyCatalog() as any
    mutate(catalog)

    const report = auditApplicationProblemQuality(baseline({
      packs: [],
      authoringCatalog: catalog,
    }))

    expect(report.errors.map((error: { code: string }) => error.code))
      .toContain('APQ_DRAFT_SAFETY')
  })

  it.each([
    ['representative oracle mismatch', {
      oracle: (generated: { variantIndex: number; answer: { normalized: string } }) => (
        generated.variantIndex === 0 ? 'forged-answer' : generated.answer.normalized
      ),
    }],
    ['boundary visual failure', {
      visualValidator: (generated: { variantIndex: number }) => generated.variantIndex !== 1,
    }],
  ])('executes draft generators and rejects %s', (_label, unsafeEvidence) => {
    const report = auditApplicationProblemQuality(baseline({
      packs: [],
      authoringCatalog: authoringSafetyCatalog(unsafeEvidence),
    }))

    expect(report.errors.map((error: { code: string }) => error.code)).toContain('APQ_DRAFT_SAFETY')
  })

  it('accepts a complete claim only when its declarations match canonical base-bank evidence', () => {
    const report = auditApplicationProblemQuality(completeClaimInput())

    expect(report.errors.map((error: { code: string }) => error.code)).not.toContain('APQ_COMPLETE_PACK_RULE')
  })

  it('rejects a consistently forged 62-unit base-bank evidence set', () => {
    const input = loadProductionApplicationProblemQualityInput()
    input.unitBaseBankEvidence = input.unitBaseBankEvidence.map((evidence: any, index: number) => ({
      ...evidence,
      coreConceptIds: [`forged-concept-${index}`],
      requiredRepresentations: ['text'],
      knowingConceptIds: [`forged-concept-${index}`],
      hasKnowingCoverage: true,
      conceptUnitIdentities: [{ conceptId: `forged-concept-${index}`, unitId: evidence.unitId }],
    }))

    const report = auditApplicationProblemQuality(input)

    expect(report.errors).toContainEqual(expect.objectContaining({
      code: 'APQ_BASE_BANK_EVIDENCE',
      message: expect.stringMatching(/repository-derived/i),
    }))
  })

  it.each([
    ['coreConceptIds', (input: any) => {
      input.packs[0].concepts[0].conceptId = 'forged-core'
      input.families.forEach((entry: any) => { entry.conceptIds = ['forged-core'] })
      input.completeCoverageContexts[0].coreConceptIds = ['forged-core']
    }, 'canonical core concepts'],
    ['requiredRepresentations', (input: any) => {
      input.completeCoverageContexts[0].requiredRepresentations = ['text']
    }, 'canonical representations'],
    ['hasKnowingCoverage', (input: any) => {
      input.completeCoverageContexts[0].hasKnowingCoverage = false
    }, 'canonical knowing coverage'],
    ['concept-to-unit identity', (input: any) => {
      input.packs[0].concepts[0].conceptId = 'other-unit-concept'
      input.families.forEach((entry: any) => { entry.conceptIds = ['other-unit-concept'] })
      input.completeCoverageContexts[0].coreConceptIds = ['other-unit-concept']
      input.unitBaseBankEvidence.push({
        grade: 5,
        unitId: 'another-unit',
        coreConceptIds: ['other-unit-concept'],
        requiredRepresentations: ['text'],
        knowingConceptIds: ['other-unit-concept'],
        hasKnowingCoverage: true,
        conceptUnitIdentities: [{ conceptId: 'other-unit-concept', unitId: 'another-unit' }],
      })
    }, 'canonical concept identity'],
  ])('rejects forged complete-claim %s evidence', (_label, mutate, expectedMessage) => {
    const input = completeClaimInput() as any
    mutate(input)

    const errors = auditApplicationProblemQuality(input).errors
      .filter((error: { code: string }) => error.code === 'APQ_COMPLETE_PACK_RULE')

    expect(errors.some((error: { message: string }) => error.message.includes(expectedMessage))).toBe(true)
  })

  it('keeps work mode as the default and parses explicit candidate, release, and all selections', () => {
    expect(parseApplicationAuditSelection([])).toEqual({ mode: 'work' })
    expect(parseApplicationAuditSelection(['--mode', 'candidate', '--grade', '2']))
      .toEqual({ mode: 'candidate', grade: 2 })
    expect(parseApplicationAuditSelection(['--mode=release', '--grade=4']))
      .toEqual({ mode: 'release', grade: 4 })
    expect(parseApplicationAuditSelection(['--mode', 'all'])).toEqual({ mode: 'all', grade: 6 })
    expect(() => parseApplicationAuditSelection(['--mode', 'candidate', '--grade', '3']))
      .not.toThrow()
    expect(() => parseApplicationAuditSelection(['--mode', 'unknown'])).toThrow(/mode/i)
    expect(() => parseApplicationAuditSelection(['--mode', 'release'])).toThrow(/grade/i)
  })

  it('requires candidate grade to equal buildingGrade and never counts pilots as grade completion', () => {
    const input = loadProductionApplicationProblemQualityInput()
    const wrongGrade = auditApplicationProblemQuality(input, { mode: 'candidate', grade: 3 })
    const grade2Candidate = auditApplicationProblemQuality(input, { mode: 'candidate', grade: 2 })

    expect(wrongGrade.errors.map((error: { code: string }) => error.code))
      .toContain('APQ_ROLLOUT_MODE_GRADE')
    expect(grade2Candidate.errors.map((error: { code: string }) => error.code))
      .toContain('APQ_GRADE_CANDIDATE_INCOMPLETE')
    expect(grade2Candidate.unitReports.filter((unit: { grade: number }) => unit.grade === 2))
      .toHaveLength(12)
    expect(grade2Candidate.unitReports.filter((unit: { gradeComplete: boolean }) => unit.gradeComplete))
      .toEqual([])
  })

  it('requires final all mode to reach released Grade 6 with all 62 complete production units', () => {
    const report = auditApplicationProblemQuality(
      loadProductionApplicationProblemQualityInput(),
      { mode: 'all', grade: 6 },
    )

    expect(report.unitReports).toHaveLength(62)
    expect(report.errors.map((error: { code: string }) => error.code))
      .toEqual(expect.arrayContaining(['APQ_ROLLOUT_STATE', 'APQ_RELEASE_INCOMPLETE']))
  })

  it('fails an invalid complete claim even when the pack is only in the building or pending range', () => {
    const input = loadProductionApplicationProblemQualityInput()
    input.packs = input.packs.map((entry: { packId: string }) => entry.packId === 'pack-g2-2-length'
      ? { ...entry, coverageStatus: 'complete' }
      : entry)

    const report = auditApplicationProblemQuality(input)

    expect(report.errors.map((error: { code: string }) => error.code))
      .toContain('APQ_COMPLETE_PACK_RULE')
  })

  it('accepts a deterministic draft fixture without treating it as a released candidate', () => {
    const report = auditApplicationProblemQuality(baseline())

    expect(report.summary.errorCount).toBe(0)
    expect(report.summary.draftFamilyCount).toBe(1)
    expect(report.packReports[0]).toMatchObject({ packId: 'pack-g5-area', releaseStatus: 'draft' })
  })

  it('rejects approval evidence that is a symlink even when its target is inside the repository', () => {
    const evidenceLink = '.tmp-application-problem-quality-evidence-link'
    const evidencePath = path.join(process.cwd(), evidenceLink)
    fs.rmSync(evidencePath, { force: true })
    fs.symlinkSync('docs/standards.md', evidencePath)

    try {
      const approved = family({
        releaseStatus: 'approved',
        approval: {
          ownerStatus: 'approved',
          ownerId: 'owner',
          approvedAt: '2026-07-01T00:00:00Z',
          evidenceRefs: [evidenceLink],
          expertStatus: 'not-reviewed',
        },
      })
      expect(codes(baseline({
        families: [approved],
        registries: [{ grade: 5, entries: [{ family: approved, runtime: { kind: 'deterministic-generator' } }], releaseLedger: [approved] }],
      }))).toContain('APQ_APPROVAL_EVIDENCE')
    } finally {
      fs.rmSync(evidencePath, { force: true })
    }
  })

  it.each([
    ['pack schema and reference', () => baseline({ packs: [pack({ familyRefs: [{ familyId: 'missing', version: 1 }] })] }), 'APQ_PACK_REFERENCE'],
    ['reused identity and skipped version', () => baseline({ families: [family(), family({ version: 3 })] }), 'APQ_VERSION_CONTINUITY'],
    ['curriculum scope', () => baseline({ families: [family({ conceptIds: ['outside-scope'] })] }), 'APQ_CURRICULUM_SCOPE'],
    ['missing curriculum ledger prerequisite', () => baseline({ ledgerAllocations: [] }), 'APQ_LEDGER_REFERENCE'],
    ['direct calculation family', () => baseline({ families: [family({ reasoningPattern: 'direct', requiredStudentActions: ['execute_calculation'] })] }), 'APQ_APPLICATION_REASONING'],
    ['duplicate reasoning structure', () => baseline({ families: [family(), family({ familyId: 'g5-area-copy' })] }), 'APQ_DUPLICATE_STRUCTURE'],
    ['misconception references', () => baseline({ families: [family({ misconceptionRefs: ['missing-misconception'] })] }), 'APQ_MISCONCEPTION_REFERENCE'],
    ['generated misconception and hint contract', () => baseline({ generatedSnapshots: [{ family: family(), seed: 7, first: problem({ misconceptionRefs: ['not-declared'], hintSteps: [] }), second: problem({ misconceptionRefs: ['not-declared'], hintSteps: [] }) }] }), 'APQ_GENERATED_MISCONCEPTION'],
    ['non deterministic generated snapshot', () => baseline({ generatedSnapshots: [{ family: family(), seed: 9, first: problem(), second: problem({ prompt: '다른 문제' }) }] }), 'APQ_NON_DETERMINISTIC_OUTPUT'],
    ['independent oracle', () => baseline({ oracleResults: [{ family: family(), problem: problem(), answer: '6', solution: '20 ÷ 4 = 6', unit: 'm' }] }), 'APQ_ORACLE_MISMATCH'],
    ['choice oracle index', () => baseline({ oracleResults: [{ family: family(), problem: problem({ answer: { format: 'choice', normalized: 'B' }, choices: ['A', 'B', 'C', 'D'], correctChoiceIndex: 0 }), answer: 'B', solution: '20 ÷ 4 = 5', unit: 'cm' }] }), 'APQ_ORACLE_MISMATCH'],
    ['proof evidence mode', () => baseline({ proofReports: [{ family: family(), mode: 'invariant-boundary', proven: true, checkedCount: 1, issues: [] }] }), 'APQ_PROOF_MODE'],
    ['proof authority', () => baseline({ proofAuthorities: [] }), 'APQ_PROOF_AUTHORITY'],
    ['quantitative visual', () => baseline({ visualResults: [{ family: family(), problem: problem(), valid: false, reason: 'zero region rendered' }] }), 'APQ_QUANTITATIVE_VISUAL'],
    ['answer exposure before submit', () => baseline({ answerExposureResults: [{ family: family(), problem: problem(), exposed: true }] }), 'APQ_ANSWER_EXPOSURE'],
    ['unproven approved family', () => {
      const approved = family({ releaseStatus: 'approved', approval: { ownerStatus: 'approved', ownerId: 'owner', approvedAt: '2026-07-01T00:00:00Z', evidenceRefs: [], expertStatus: 'not-reviewed' } })
      return baseline({ families: [approved], registries: [{ grade: 5, entries: [{ family: approved, runtime: { kind: 'deterministic-generator' } }], releaseLedger: [approved] }] })
    }, 'APQ_APPROVAL_EVIDENCE'],
    ['missing approved evidence file', () => {
      const approved = family({ releaseStatus: 'approved', approval: { ownerStatus: 'approved', ownerId: 'owner', approvedAt: '2026-07-01T00:00:00Z', evidenceRefs: ['docs/missing-approval.md'], expertStatus: 'not-reviewed' } })
      return baseline({ families: [approved], registries: [{ grade: 5, entries: [{ family: approved, runtime: { kind: 'deterministic-generator' } }], releaseLedger: [approved] }] })
    }, 'APQ_APPROVAL_EVIDENCE'],
    ['malformed null family', () => baseline({ families: [null] }), 'APQ_FAMILY_SCHEMA'],
    ['quarantined candidate', () => {
      const quarantined = family({ releaseStatus: 'quarantined' })
      return baseline({ families: [quarantined], registries: [{ grade: 5, entries: [{ family: quarantined, runtime: { kind: 'deterministic-generator' } }], releaseLedger: [quarantined] }] })
    }, 'APQ_BLOCKED_RELEASE_CANDIDATE'],
    ['session contract regression', () => baseline({ sessionContracts: [{ grade: 5, legacyCount: 10, candidateCount: 1, sessionCount: 11, difficultyDistribution: { 1: 5, 2: 4, 3: 2 }, storageKey: 'changed-key' }] }), 'APQ_SESSION_CONTRACT'],
    ['Grade 2 approved-candidate count not included', () => baseline({ sessionContracts: [{ grade: 2, legacyCount: 144, candidateCount: 3, sessionCount: 144, difficultyDistribution: { easy: 48, medium: 48, applied: 48 }, storageKey: 'mathAssist_grade2Progress' }] }), 'APQ_SESSION_CONTRACT'],
  ])('reports %s with a stable code', (_label, arrange, expectedCode) => {
    expect(codes(arrange())).toContain(expectedCode)
  })
})
