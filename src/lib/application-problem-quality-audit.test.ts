import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  auditApplicationProblemQuality,
  loadProductionApplicationProblemQualityInput,
} from '../../scripts/application-problem-quality-core.js'

const approval = {
  ownerStatus: 'pending',
  evidenceRefs: [],
  expertStatus: 'not-reviewed',
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
    packs: [pack()],
    families: [currentFamily],
    ledgerAllocations: [{ standardCode: '5S-AREA', unitId: 'g5-1-area', assignedGrade: 5, semester: '5-1' }],
    registries: [{ grade: 5, entries: [{ family: currentFamily, runtime: { kind: 'deterministic-generator' } }], releaseLedger: [currentFamily] }],
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

describe('application problem quality audit', () => {
  it('materializes actual production evidence for every registered family and session contract', () => {
    const input = loadProductionApplicationProblemQualityInput()

    const report = auditApplicationProblemQuality(input)

    expect(input.generatedSnapshots).toHaveLength(input.families.length)
    expect(input.proofReports).toHaveLength(input.families.length)
    expect(input.oracleResults).toHaveLength(input.families.length)
    expect(input.visualResults).toHaveLength(input.families.length)
    expect(input.answerExposureResults).toHaveLength(input.families.length)
    expect(report.familyEvidence).toHaveLength(input.families.length)
    expect(report.familyEvidence.every((evidence: { status: string }) => evidence.status === 'passed')).toBe(true)
    expect(report.summary).toMatchObject({
      approvedFamilyCount: 9,
      draftFamilyCount: 0,
      errorCount: 0,
    })
    expect(input.sessionContracts).toMatchObject([
      { grade: 2, storageKey: 'mathAssist_grade2Progress', legacyCount: 144 },
      { grade: 5, storageKey: 'mathAssist_currentSession', legacyCount: 10 },
      { grade: 6, storageKey: 'mathAssist_grade6CurrentSession', legacyCount: 10 },
    ])
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
