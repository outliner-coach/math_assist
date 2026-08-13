import { describe, expect, it } from 'vitest'
import type { Problem } from '@/lib/types'
import {
  ContractValidationError,
  parseApplicationProblemFamilyV1,
  parseGeneratedApplicationProblemV1,
  parseUnitKnowledgePackV1,
  validateApplicationProblemCatalog,
  validateReleaseTransition,
  validateUnitKnowledgePackCoverage,
  type ApplicationProblemFamilyV1,
  type CurriculumStandardAllocationV1,
  type GeneratedApplicationProblemV1,
  type UnitKnowledgePackV1,
} from './contracts'

const pendingApproval = {
  ownerStatus: 'pending' as const,
  evidenceRefs: [] as string[],
  expertStatus: 'not-reviewed' as const,
}

const approvedApproval = {
  ownerStatus: 'approved' as const,
  ownerId: 'project-owner',
  approvedAt: '2026-07-22T00:00:00.000Z',
  evidenceRefs: ['reports/application-problems/review.md'],
  expertStatus: 'not-reviewed' as const,
}

function allocation(
  standardCode: string,
  overrides: Record<string, unknown> = {},
): CurriculumStandardAllocationV1 {
  return {
    standardCode,
    unitId: 'g2-2-length',
    assignedGrade: 2,
    semester: '2-2',
    ...overrides,
  } as CurriculumStandardAllocationV1
}

function draftPack(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'unit-knowledge-pack-v1',
    packId: 'pack-g2-length',
    version: 1,
    unitId: 'g2-2-length',
    grade: 2,
    semester: '2-2',
    coverageStatus: 'pilot',
    releaseStatus: 'draft',
    coveredStandardCodes: ['[2수03-10]'],
    concepts: [
      {
        conceptId: 'length-compose',
        name: '길이의 합성과 분해',
        standardCodes: ['[2수03-10]'],
        prerequisites: [{ kind: 'standard', standardCode: '[2수03-09]' }],
        allowedScope: ['m와 cm를 같은 단위로 바꾸어 계산한다.'],
        excludedScope: ['문자를 사용한 비례식'],
        misconceptions: [
          {
            id: 'length-unit-place-value',
            description: '1 m를 10 cm로 바꾼다.',
            diagnosticEvidence: 'm와 cm가 섞인 보기에서 10배 작은 답을 고른다.',
            correctionStrategy: '1 m 길이 막대를 100개의 1 cm로 비교한다.',
          },
        ],
      },
    ],
    familyRefs: [{ familyId: 'g2-length-route-total', version: 1 }],
    approval: pendingApproval,
    ...overrides,
  }
}

function draftFamily(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'application-problem-family-v1',
    familyId: 'g2-length-route-total',
    version: 1,
    packId: 'pack-g2-length',
    unitId: 'g2-2-length',
    conceptIds: ['length-compose'],
    primaryStandard: '[2수03-10]',
    connectedStandards: [],
    cognitiveDomain: 'applying',
    reasoningPattern: 'multi_step',
    representations: ['text', 'diagram'],
    contextType: 'real_world',
    readingLoad: 'low',
    estimatedSteps: 2,
    modelId: 'segment-sum',
    unknownRole: 'total-length',
    requiredStudentActions: ['interpret_context', 'execute_calculation'],
    misconceptionRefs: ['length-unit-place-value'],
    visualPolicy: {
      role: 'required',
      semantics: 'quantitative',
      generatorId: 'length-segment-bar-v1',
      answerCritical: true,
    },
    proofMode: 'exhaustive',
    runtimeMode: 'deterministic-generator',
    releaseStatus: 'draft',
    approval: pendingApproval,
    ...overrides,
  }
}

function generatedProblem(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'generated-application-problem-v1',
    instanceId: 'g2-length-route-total@1:42:0',
    familyId: 'g2-length-route-total',
    generatorVersion: 1,
    packId: 'pack-g2-length',
    packVersion: 1,
    seed: 42,
    variantIndex: 0,
    curriculumCodes: ['[2수03-10]'],
    params: { firstCm: 120, secondCm: 80 },
    prompt: '두 구간의 전체 길이를 구하세요.',
    answer: { format: 'number', normalized: '200 cm' },
    solutionSteps: ['두 길이를 cm로 나타냅니다.', '120+80=200입니다.'],
    hintSteps: ['두 길이의 단위를 먼저 같게 해 보세요.'],
    misconceptionRefs: ['length-unit-place-value'],
    visual: {
      role: 'required',
      semantics: 'quantitative',
      generatorId: 'length-segment-bar-v1',
      generatorVersion: 1,
      answerCritical: true,
      mathModel: {
        kind: 'segment-bar',
        segments: [120, 80],
      },
    },
    ...overrides,
  }
}

function expectContractError(input: () => unknown, code: string) {
  try {
    input()
    throw new Error('expected contract validation to fail')
  } catch (error) {
    expect(error).toBeInstanceOf(ContractValidationError)
    expect((error as ContractValidationError).issues.map((issue) => issue.code)).toContain(code)
  }
}

describe('application problem authoring contracts', () => {
  it('parses a draft unit knowledge pack without approving it', () => {
    const pack = parseUnitKnowledgePackV1(draftPack())

    expect(pack.schemaVersion).toBe('unit-knowledge-pack-v1')
    expect(pack.coverageStatus).toBe('pilot')
    expect(pack.releaseStatus).toBe('draft')
    expect(pack.approval.ownerStatus).toBe('pending')
  })

  it('rejects invalid pack schema, duplicate references, and incomplete misconceptions', () => {
    expectContractError(
      () =>
        parseUnitKnowledgePackV1(
          draftPack({
            schemaVersion: 'unit-knowledge-pack-v2',
            coveredStandardCodes: ['[2수03-10]', '[2수03-10]'],
            familyRefs: [
              { familyId: 'g2-length-route-total', version: 1 },
              { familyId: 'g2-length-route-total', version: 1 },
            ],
            concepts: [
              {
                conceptId: 'length-compose',
                name: '길이의 합성과 분해',
                standardCodes: ['[2수03-10]'],
                prerequisites: [],
                allowedScope: ['m와 cm'],
                excludedScope: ['비례식'],
                misconceptions: [
                  {
                    id: 'broken-misconception',
                    description: '설명만 있습니다.',
                    diagnosticEvidence: '',
                    correctionStrategy: '',
                  },
                ],
              },
            ],
          }),
        ),
      'invalid_schema_version',
    )
  })

  it('rejects a semester identifier that does not match the pack grade', () => {
    expectContractError(
      () => parseUnitKnowledgePackV1(draftPack({ semester: '5-1' })),
      'invalid_semester',
    )
  })

  it('parses a non-direct application family with ordered reasoning actions', () => {
    const family = parseApplicationProblemFamilyV1(draftFamily())

    expect(family.requiredStudentActions).toEqual([
      'interpret_context',
      'execute_calculation',
    ])
    expect(family.visualPolicy.role).toBe('required')
  })

  it.each([
    ['direct reasoning', { reasoningPattern: 'direct' }, 'direct_reasoning_pattern'],
    [
      'calculation only',
      { requiredStudentActions: ['execute_calculation'] },
      'calculation_only_family',
    ],
    [
      'reasoning with one non-calculation action',
      {
        cognitiveDomain: 'reasoning',
        requiredStudentActions: ['interpret_context', 'execute_calculation'],
      },
      'insufficient_reasoning_actions',
    ],
    [
      'duplicate representations',
      { representations: ['text', 'text'] },
      'duplicate_value',
    ],
    [
      'required non-critical visual',
      {
        visualPolicy: {
          role: 'required',
          semantics: 'quantitative',
          generatorId: 'length-segment-bar-v1',
          answerCritical: false,
        },
      },
      'required_visual_not_answer_critical',
    ],
    [
      'none visual with generator',
      {
        visualPolicy: {
          role: 'none',
          generatorId: 'should-not-exist',
          answerCritical: false,
        },
      },
      'none_visual_has_payload',
    ],
    [
      'runtime generator backed only by a static proof',
      { proofMode: 'static-corpus' },
      'incompatible_runtime_proof',
    ],
  ])('rejects %s', (_label, overrides, code) => {
    expectContractError(
      () => parseApplicationProblemFamilyV1(draftFamily(overrides)),
      code,
    )
  })

  it('requires complete owner and expert approval records and evidence for release', () => {
    expectContractError(
      () =>
        parseApplicationProblemFamilyV1(
          draftFamily({
            releaseStatus: 'approved',
            approval: {
              ownerStatus: 'approved',
              ownerId: '',
              approvedAt: 'not-a-date',
              evidenceRefs: [],
              expertStatus: 'reviewed',
            },
          }),
        ),
      'invalid_owner_approval',
    )
  })

  it('parses a generated snapshot and preserves its exact provenance and math model', () => {
    const snapshot = parseGeneratedApplicationProblemV1(generatedProblem())

    expect(snapshot.instanceId).toBe('g2-length-route-total@1:42:0')
    expect(snapshot.params).toEqual({ firstCm: 120, secondCm: 80 })
    expect(snapshot.visual.mathModel).toEqual({
      kind: 'segment-bar',
      segments: [120, 80],
    })
  })

  it('rejects a snapshot whose identity, answer choices, or visual contract is inconsistent', () => {
    expectContractError(
      () =>
        parseGeneratedApplicationProblemV1(
          generatedProblem({
            instanceId: 'another-family@1:42:0',
            answer: { format: 'choice', normalized: 'B' },
            choices: ['A', 'B', 'B'],
            correctChoiceIndex: 5,
          }),
        ),
      'invalid_instance_id',
    )
  })

  it('keeps the application provenance optional on legacy Problem snapshots', () => {
    const legacyProblem: Problem = {
      index: 0,
      templateId: 'legacy-template',
      setId: 'A',
      params: { value: 3 },
      prompt: '3+2는 얼마인가요?',
      type: 'number',
      correctAnswer: '5',
      solutionSteps: ['3+2=5'],
    }

    expect(legacyProblem.applicationSource).toBeUndefined()
  })
})

describe('catalog and lifecycle validation', () => {
  it('rejects unknown ledger references and broken pack, concept, and misconception links', () => {
    const pack = parseUnitKnowledgePackV1(draftPack())
    const family = parseApplicationProblemFamilyV1(
      draftFamily({
        conceptIds: ['missing-concept'],
        primaryStandard: '[2수03-99]',
        misconceptionRefs: ['missing-misconception'],
      }),
    )

    const issues = validateApplicationProblemCatalog({
      packs: [pack],
      families: [family],
      ledgerAllocations: [allocation('[2수03-09]'), allocation('[2수03-10]')],
    })

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'unknown_concept_reference',
        'unknown_standard_reference',
        'unknown_misconception_reference',
      ]),
    )
  })

  it('rejects orphan families and standards that escape their declared pack coverage', () => {
    const pack = parseUnitKnowledgePackV1(draftPack())
    const referenced = parseApplicationProblemFamilyV1(
      draftFamily({ primaryStandard: '[2수03-11]' }),
    )
    const orphan = parseApplicationProblemFamilyV1(
      draftFamily({
        familyId: 'g2-length-orphan',
        reasoningPattern: 'inverse',
        modelId: 'segment-difference',
        unknownRole: 'missing-length',
        requiredStudentActions: ['infer_missing_value', 'execute_calculation'],
      }),
    )

    const issues = validateApplicationProblemCatalog({
      packs: [pack],
      families: [referenced, orphan],
      ledgerAllocations: [
        allocation('[2수03-09]'),
        allocation('[2수03-10]'),
        allocation('[2수03-11]'),
      ],
    })

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'primary_standard_outside_pack',
        'family_not_declared_by_pack',
      ]),
    )
  })

  it('requires explicit passing completeness evidence for every complete pack', () => {
    const pack = parseUnitKnowledgePackV1(
      draftPack({ coverageStatus: 'complete' }),
    )
    const family = parseApplicationProblemFamilyV1(draftFamily())
    const baseInput = {
      packs: [pack],
      families: [family],
      ledgerAllocations: [
        allocation('[2수03-09]'),
        allocation('[2수03-10]'),
      ],
    }

    const missingContext = validateApplicationProblemCatalog(baseInput)
    expect(missingContext.map((issue) => issue.code)).toContain(
      'missing_complete_coverage_context',
    )

    const failedEvidence = validateApplicationProblemCatalog({
      ...baseInput,
      completeCoverageContexts: [
        {
          packId: pack.packId,
          version: pack.version,
          coreConceptIds: ['length-compose'],
          requiredRepresentations: ['text', 'diagram'],
          hasKnowingCoverage: false,
        },
      ],
    })
    expect(failedEvidence.map((issue) => issue.code)).toContain('missing_knowing_coverage')
  })

  it('validates new and revised current versions against the previous catalog', () => {
    const family = parseApplicationProblemFamilyV1(draftFamily())
    const previousPack = parseUnitKnowledgePackV1(draftPack())
    const approvedPackV2 = parseUnitKnowledgePackV1(
      draftPack({
        version: 2,
        releaseStatus: 'approved',
        approval: approvedApproval,
      }),
    )
    const revisedIssues = validateApplicationProblemCatalog({
      packs: [approvedPackV2],
      families: [family],
      ledgerAllocations: [allocation('[2수03-09]'), allocation('[2수03-10]')],
      previous: {
        packs: [previousPack],
        families: [family],
      },
    })
    expect(revisedIssues.map((issue) => issue.code)).toContain('new_version_not_draft')

    const approvedFamily = parseApplicationProblemFamilyV1(
      draftFamily({ releaseStatus: 'approved', approval: approvedApproval }),
    )
    const approvedNewPack = parseUnitKnowledgePackV1(
      draftPack({ releaseStatus: 'approved', approval: approvedApproval }),
    )
    const newIdentityIssues = validateApplicationProblemCatalog({
      packs: [approvedNewPack],
      families: [approvedFamily],
      ledgerAllocations: [allocation('[2수03-09]'), allocation('[2수03-10]')],
      previous: { packs: [], families: [] },
    })
    expect(newIdentityIssues.map((issue) => issue.code)).toContain('new_version_not_draft')
  })

  it('allows an unchanged retired snapshot but rejects retired identity reuse', () => {
    const approved = parseApplicationProblemFamilyV1(
      draftFamily({ releaseStatus: 'approved', approval: approvedApproval }),
    )
    const retired = { ...approved, releaseStatus: 'retired' as const }
    const changedRetired = { ...retired, modelId: 'changed-model' }

    expect(validateReleaseTransition(retired, { ...retired })).toEqual([])
    expect(
      validateReleaseTransition(retired, changedRetired).map((issue) => issue.code),
    ).toContain('retired_identity_reused')
    expect(
      validateReleaseTransition(retired, {
        ...retired,
        version: 2,
        releaseStatus: 'draft',
        approval: pendingApproval,
      }).map((issue) => issue.code),
    ).toContain('retired_identity_reused')
  })

  it('rejects an approved pack that still activates a retired family', () => {
    const pack = parseUnitKnowledgePackV1(
      draftPack({ releaseStatus: 'approved', approval: approvedApproval }),
    )
    const family = parseApplicationProblemFamilyV1(
      draftFamily({ releaseStatus: 'retired', approval: approvedApproval }),
    )

    const issues = validateApplicationProblemCatalog({
      packs: [pack],
      families: [family],
      ledgerAllocations: [allocation('[2수03-09]'), allocation('[2수03-10]')],
    })

    expect(issues.map((issue) => issue.code)).toContain(
      'approved_pack_references_retired_family',
    )
  })

  it('rejects standards allocated to another unit, grade, or semester', () => {
    const pack = parseUnitKnowledgePackV1(draftPack())
    const family = parseApplicationProblemFamilyV1(
      draftFamily({ connectedStandards: ['[2수03-11]'] }),
    )

    const issues = validateApplicationProblemCatalog({
      packs: [pack],
      families: [family],
      ledgerAllocations: [
        allocation('[2수03-09]'),
        allocation('[2수03-10]', { unitId: 'g2-2-time' }),
        allocation('[2수03-11]', { assignedGrade: 3, semester: '3-1' }),
      ],
    })

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'standard_allocation_mismatch',
        'family_standard_allocation_mismatch',
      ]),
    )
  })

  it('rejects duplicate global versions and semantic reuse of a stable identity', () => {
    const firstPack = parseUnitKnowledgePackV1(draftPack())
    const movedPack = parseUnitKnowledgePackV1(draftPack({ unitId: 'g2-2-time' }))
    const firstFamily = parseApplicationProblemFamilyV1(draftFamily())
    const changedFamily = parseApplicationProblemFamilyV1(
      draftFamily({ modelId: 'different-model' }),
    )

    const issues = validateApplicationProblemCatalog({
      packs: [firstPack, movedPack],
      families: [firstFamily, changedFamily],
      ledgerAllocations: [allocation('[2수03-09]'), allocation('[2수03-10]')],
    })

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'duplicate_pack_version',
        'pack_identity_reused',
        'duplicate_family_version',
        'family_version_changed',
      ]),
    )
  })

  it('permits complete coverage only with all standards, concepts, applying/reasoning, misconceptions, and representations', () => {
    const pack = parseUnitKnowledgePackV1(
      draftPack({
        coverageStatus: 'complete',
        coveredStandardCodes: ['[2수03-10]', '[2수03-11]'],
        familyRefs: [
          { familyId: 'family-applying', version: 1 },
          { familyId: 'family-reasoning-a', version: 1 },
          { familyId: 'family-reasoning-b', version: 1 },
          { familyId: 'family-reasoning-c', version: 1 },
        ],
      }),
    )
    const applying = parseApplicationProblemFamilyV1(
      draftFamily({
        familyId: 'family-applying',
        primaryStandard: '[2수03-10]',
      }),
    )
    const reasoning = (
      familyId: string,
      reasoningPattern: ApplicationProblemFamilyV1['reasoningPattern'],
      representations: ApplicationProblemFamilyV1['representations'],
    ) =>
      parseApplicationProblemFamilyV1(
        draftFamily({
          familyId,
          cognitiveDomain: 'reasoning',
          reasoningPattern,
          representations,
          requiredStudentActions: [
            'interpret_context',
            'choose_model',
            'execute_calculation',
          ],
        }),
      )

    const issues = validateUnitKnowledgePackCoverage(pack, {
      unitStandardCodes: ['[2수03-10]', '[2수03-11]'],
      coreConceptIds: ['length-compose'],
      requiredRepresentations: ['text', 'diagram', 'table'],
      hasKnowingCoverage: true,
      families: [
        applying,
        reasoning('family-reasoning-a', 'inverse', ['text', 'diagram']),
        reasoning('family-reasoning-b', 'constraint', ['text', 'table']),
        reasoning('family-reasoning-c', 'error_analysis', ['text']),
      ],
    })

    expect(issues).toEqual([])
  })

  it('reports every missing complete-coverage proof instead of treating three families as complete', () => {
    const pack = parseUnitKnowledgePackV1(
      draftPack({ coverageStatus: 'complete' }),
    )
    const family = parseApplicationProblemFamilyV1(draftFamily())

    const issues = validateUnitKnowledgePackCoverage(pack, {
      unitStandardCodes: ['[2수03-10]', '[2수03-11]'],
      coreConceptIds: ['length-compose', 'length-compare'],
      requiredRepresentations: ['text', 'diagram', 'table'],
      hasKnowingCoverage: false,
      families: [family],
    })

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'incomplete_standard_coverage',
        'missing_core_concept',
        'insufficient_reasoning_families',
        'insufficient_reasoning_patterns',
        'missing_knowing_coverage',
        'missing_representation_coverage',
      ]),
    )
  })

  it('enforces draft-first versions, immutable approved versions, and quarantine repair by a new draft', () => {
    const approved = parseApplicationProblemFamilyV1(
      draftFamily({
        releaseStatus: 'approved',
        approval: {
          ownerStatus: 'approved',
          ownerId: 'project-owner',
          approvedAt: '2026-07-22T00:00:00.000Z',
          evidenceRefs: ['reports/application-problems/g2-length-v1.md'],
          expertStatus: 'not-reviewed',
        },
      }),
    )
    const quarantined = {
      ...approved,
      releaseStatus: 'quarantined' as const,
    }
    const repairedDraft = parseApplicationProblemFamilyV1(
      draftFamily({ version: 2 }),
    )

    expect(
      validateReleaseTransition(undefined, parseApplicationProblemFamilyV1(draftFamily())),
    ).toEqual([])
    expect(validateReleaseTransition(approved, quarantined)).toEqual([])
    expect(validateReleaseTransition(quarantined, repairedDraft)).toEqual([])

    const changedApprovedVersion = {
      ...approved,
      modelId: 'silently-changed-model',
    }
    expect(
      validateReleaseTransition(approved, changedApprovedVersion).map((issue) => issue.code),
    ).toContain('released_version_changed')
    expect(
      validateReleaseTransition(
        quarantined,
        { ...quarantined, releaseStatus: 'approved' },
      ).map((issue) => issue.code),
    ).toContain('quarantined_version_reapproved')
  })

  it('exposes typed contracts for downstream generators without widening legacy runtime types', () => {
    const pack: UnitKnowledgePackV1 = parseUnitKnowledgePackV1(draftPack())
    const family: ApplicationProblemFamilyV1 = parseApplicationProblemFamilyV1(
      draftFamily(),
    )
    const snapshot: GeneratedApplicationProblemV1 = parseGeneratedApplicationProblemV1(
      generatedProblem(),
    )

    expect([pack.packId, family.familyId, snapshot.instanceId]).toEqual([
      'pack-g2-length',
      'g2-length-route-total',
      'g2-length-route-total@1:42:0',
    ])
  })
})
