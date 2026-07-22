import { describe, expect, it } from 'vitest'
import {
  parseApplicationProblemFamilyV1,
  parseGeneratedApplicationProblemV1,
  type ApplicationProblemFamilyV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from './contracts'
import {
  createApplicationProofManifestDigest,
  runApplicationProblemProof,
} from './proof'

const pendingApproval = {
  ownerStatus: 'pending' as const,
  evidenceRefs: [] as string[],
  expertStatus: 'not-reviewed' as const,
}

function family(
  overrides: Partial<ApplicationProblemFamilyV1> = {},
): ApplicationProblemFamilyV1 {
  return parseApplicationProblemFamilyV1({
    schemaVersion: 'application-problem-family-v1',
    familyId: 'proof-family',
    version: 1,
    packId: 'proof-pack',
    unitId: 'proof-unit',
    conceptIds: ['proof-concept'],
    primaryStandard: '[2수01-01]',
    connectedStandards: [],
    cognitiveDomain: 'applying',
    reasoningPattern: 'multi_step',
    representations: ['text'],
    contextType: 'real_world',
    readingLoad: 'low',
    estimatedSteps: 2,
    modelId: 'sum-model',
    unknownRole: 'sum',
    requiredStudentActions: ['interpret_context', 'execute_calculation'],
    misconceptionRefs: [],
    visualPolicy: { role: 'none', answerCritical: false },
    proofMode: 'exhaustive',
    runtimeMode: 'deterministic-generator',
    releaseStatus: 'draft',
    approval: pendingApproval,
    ...overrides,
  })
}

function generated(
  seed: number,
  variantIndex: number,
  answer = seed + variantIndex,
): GeneratedApplicationProblemV1 {
  return parseGeneratedApplicationProblemV1({
    schemaVersion: 'generated-application-problem-v1',
    instanceId: `proof-family@1:${seed}:${variantIndex}`,
    familyId: 'proof-family',
    generatorVersion: 1,
    packId: 'proof-pack',
    packVersion: 1,
    seed,
    variantIndex,
    curriculumCodes: ['[2수01-01]'],
    params: { left: seed, right: variantIndex },
    prompt: `${seed}와 ${variantIndex}의 합을 구하세요.`,
    answer: { format: 'number', normalized: String(answer) },
    solutionSteps: [`${seed}+${variantIndex}=${answer}`],
    hintSteps: ['두 수를 더하세요.'],
    misconceptionRefs: [],
    visual: { role: 'none', answerCritical: false },
  })
}

function numeric(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (typeof value !== 'number') throw new Error(`${key} is not numeric`)
  return value
}

const independentSumOracle = {
  oracleId: 'independent-sum-oracle-v1',
  oracleVersion: 1,
  sourceModule: 'src/lib/application-problems/oracles/independent-sum-v1.ts',
  evidenceRefs: ['reports/application-problems/independent-sum-oracle-v1.md'],
  dependencies: ['independent-integer-addition-v1'],
  evaluate: ({ params }: { params: Readonly<Record<string, JsonValue>> }) =>
    String(numeric(params, 'left') + numeric(params, 'right')),
}

const proofGeneratorMetadata = {
  dependencyId: 'proof-generator-answer-v1',
  sourceModule: 'src/lib/application-problems/generators/proof-generator-v1.ts',
}

describe('application proof manifest digest', () => {
  it('uses canonical JSON key order for a stable domain digest', () => {
    expect(createApplicationProofManifestDigest([
      { caseId: 'a', seed: 1, variantIndex: 0 },
    ])).toBe('fnv1a32:f32bd42c')
    expect(createApplicationProofManifestDigest([
      { variantIndex: 0, caseId: 'a', seed: 1 },
    ])).toBe('fnv1a32:f32bd42c')
  })
})

type ExhaustiveDomainCase = { caseId: string; seed: number }
type ExhaustiveEnumeratedCase = ExhaustiveDomainCase & { variantIndex: number }
type BoundaryDomainCase = ExhaustiveEnumeratedCase & { boundary: string }

const manifestReview = {
  reviewedBy: 'proof-manifest-reviewer',
  reviewedAt: '2026-07-22T00:00:00.000Z',
  evidenceRefs: ['reports/application-problems/proof-manifest-review.md'],
}

function proofManifest<T extends 'exhaustive' | 'invariant-boundary' | 'static-corpus'>(
  domainKind: T,
  entries: JsonValue[],
  overrides: Record<string, unknown> = {},
): ReturnType<typeof manifestShape<T>> {
  return manifestShape(domainKind, entries, overrides)
}

function manifestShape<T extends 'exhaustive' | 'invariant-boundary' | 'static-corpus'>(
  domainKind: T,
  entries: JsonValue[],
  overrides: Record<string, unknown>,
) {
  const manifest = {
    schemaVersion: 'application-proof-manifest-v1' as const,
    manifestId: `proof-family-${domainKind}-manifest`,
    manifestVersion: 1,
    familyId: 'proof-family',
    familyVersion: 1,
    domainKind,
    expectedCount: entries.length,
    domainDigest: createApplicationProofManifestDigest(entries),
    ...manifestReview,
    ...overrides,
  }
  return manifest as typeof manifest & { domainKind: T }
}

function exhaustiveAuthority(
  cases: readonly ExhaustiveDomainCase[],
  variantIndexes: readonly number[],
  overrides: Record<string, unknown> = {},
) {
  const enumerated: ExhaustiveEnumeratedCase[] = cases.flatMap((entry) =>
    variantIndexes.map((variantIndex) => ({ ...entry, variantIndex })),
  )
  return {
    manifest: proofManifest('exhaustive', enumerated as JsonValue[], overrides),
    enumerateDomain: () => enumerated,
  }
}

function boundaryAuthority(
  boundaries: readonly string[],
  cases: readonly BoundaryDomainCase[],
  overrides: Record<string, unknown> = {},
) {
  return {
    manifest: {
      ...proofManifest('invariant-boundary', cases as unknown as JsonValue[], overrides),
      requiredBoundaryClasses: [...boundaries],
    },
    enumerateDomain: () => cases,
  }
}

function staticAuthority(
  corpusIds: readonly string[],
  overrides: Record<string, unknown> = {},
) {
  return {
    manifest: {
      ...proofManifest('static-corpus', corpusIds as JsonValue[], overrides),
      approvedCorpusIds: [...corpusIds],
    },
  }
}

describe('exhaustive application proof', () => {
  it('executes every case and variant in the declared finite domain', () => {
    const generatedKeys: string[] = []
    const oracleInputs: unknown[] = []
    const report = runApplicationProblemProof({
      mode: 'exhaustive',
      family: family(),
      domain: {
        kind: 'finite-complete',
        cases: [
          { caseId: 'small', seed: 2 },
          { caseId: 'large', seed: 9 },
        ],
        variantIndexes: [0, 1, 2],
      },
      ...exhaustiveAuthority(
        [{ caseId: 'small', seed: 2 }, { caseId: 'large', seed: 9 }],
        [0, 1, 2],
      ),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => {
          generatedKeys.push(`${seed}:${variantIndex}`)
          return generated(seed, variantIndex)
        },
      },
      oracle: {
        ...independentSumOracle,
        oracleId: independentSumOracle.oracleId,
        evaluate: (input) => {
          oracleInputs.push(input)
          expect(input).not.toHaveProperty('answer')
          expect(input).not.toHaveProperty('problem')
          return independentSumOracle.evaluate(input)
        },
      },
    })

    expect(report).toMatchObject({
      proven: true,
      mode: 'exhaustive',
      familyId: 'proof-family',
      version: 1,
      checkedCount: 6,
      issues: [],
    })
    expect(generatedKeys).toEqual(['2:0', '2:1', '2:2', '9:0', '9:1', '9:2'])
    expect(oracleInputs).toHaveLength(6)
    expect(report.provenProblems).toHaveLength(6)
  })

  it('does not return any problem as proven when one answer claim fails', () => {
    const report = runApplicationProblemProof({
      mode: 'exhaustive',
      family: family(),
      domain: {
        kind: 'finite-complete',
        cases: [{ caseId: 'wrong', seed: 4 }],
        variantIndexes: [0, 1],
      },
      ...exhaustiveAuthority([{ caseId: 'wrong', seed: 4 }], [0, 1]),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) =>
          generated(seed, variantIndex, variantIndex === 1 ? 999 : seed + variantIndex),
      },
      oracle: independentSumOracle,
    })

    expect(report.proven).toBe(false)
    expect(report.provenProblems).toEqual([])
    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'ANSWER_MISMATCH',
      familyId: 'proof-family',
      version: 1,
      seed: 4,
      variantIndex: 1,
      caseId: 'wrong',
    }))
  })

  it('rejects a self-shrunk one-case authoritative domain', () => {
    const report = runApplicationProblemProof({
      mode: 'exhaustive',
      family: family(),
      domain: {
        kind: 'finite-complete',
        cases: [{ caseId: 'only', seed: 1 }],
        variantIndexes: [0],
      },
      ...exhaustiveAuthority([{ caseId: 'only', seed: 1 }], [0]),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => generated(seed, variantIndex),
      },
      oracle: independentSumOracle,
    })

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toContain('MANIFEST_DOMAIN_TOO_SMALL')
  })

  it('rejects submitted cases that do not exactly match the authoritative enumerator', () => {
    const report = runApplicationProblemProof({
      mode: 'exhaustive',
      family: family(),
      domain: {
        kind: 'finite-complete',
        cases: [{ caseId: 'submitted', seed: 1 }],
        variantIndexes: [0, 1],
      },
      ...exhaustiveAuthority(
        [{ caseId: 'submitted', seed: 1 }, { caseId: 'missing', seed: 2 }],
        [0],
      ),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => generated(seed, variantIndex),
      },
      oracle: independentSumOracle,
    })

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toContain('MANIFEST_CASE_SET_MISMATCH')
  })

  it('binds the reviewed manifest to family version, expected count, and digest', () => {
    const report = runApplicationProblemProof({
      mode: 'exhaustive',
      family: family(),
      domain: {
        kind: 'finite-complete',
        cases: [{ caseId: 'pair', seed: 1 }],
        variantIndexes: [0, 1],
      },
      ...exhaustiveAuthority([{ caseId: 'pair', seed: 1 }], [0, 1], {
        familyVersion: 2,
        expectedCount: 3,
        domainDigest: 'fnv1a32:00000000',
      }),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => generated(seed, variantIndex),
      },
      oracle: independentSumOracle,
    })

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'MANIFEST_FAMILY_MISMATCH',
      'MANIFEST_COUNT_MISMATCH',
      'MANIFEST_DIGEST_MISMATCH',
    ]))
  })

  it('requires explicit review evidence on the authoritative manifest', () => {
    const report = runApplicationProblemProof({
      mode: 'exhaustive',
      family: family(),
      domain: {
        kind: 'finite-complete',
        cases: [{ caseId: 'pair', seed: 1 }],
        variantIndexes: [0, 1],
      },
      ...exhaustiveAuthority([{ caseId: 'pair', seed: 1 }], [0, 1], {
        reviewedBy: '',
        evidenceRefs: [],
      }),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => generated(seed, variantIndex),
      },
      oracle: independentSumOracle,
    })

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toContain('MANIFEST_REVIEW_REQUIRED')
  })

  it('rejects an oracle that declares the generator identity as its own', () => {
    const report = runApplicationProblemProof({
      mode: 'exhaustive',
      family: family(),
      domain: {
        kind: 'finite-complete',
        cases: [{ caseId: 'only', seed: 1 }],
        variantIndexes: [0],
      },
      ...exhaustiveAuthority([{ caseId: 'only', seed: 1 }], [0]),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'shared-claim-function',
        generate: ({ seed, variantIndex }) => generated(seed, variantIndex),
      },
      oracle: {
        ...independentSumOracle,
        oracleId: 'shared-claim-function',
        evaluate: independentSumOracle.evaluate,
      },
    })

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toContain('ORACLE_NOT_INDEPENDENT')
  })

  it('rejects the same executable callback even when it is given two IDs', () => {
    const sharedImplementation = (input: Record<string, unknown>) =>
      'params' in input
        ? String(
            numeric(input.params as Readonly<Record<string, JsonValue>>, 'left') +
            numeric(input.params as Readonly<Record<string, JsonValue>>, 'right'),
          )
        : generated(input.seed as number, input.variantIndex as number)
    const report = runApplicationProblemProof({
      mode: 'exhaustive',
      family: family(),
      domain: {
        kind: 'finite-complete',
        cases: [{ caseId: 'only', seed: 1 }],
        variantIndexes: [0],
      },
      ...exhaustiveAuthority([{ caseId: 'only', seed: 1 }], [0]),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'generator-label',
        generate: sharedImplementation as never,
      },
      oracle: {
        ...independentSumOracle,
        oracleId: 'oracle-label',
        evaluate: sharedImplementation as never,
      },
    })

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.issues.map((issue) => issue.code)).toContain('ORACLE_NOT_INDEPENDENT')
  })

  it('rejects an oracle wrapper that depends on the generator answer dependency', () => {
    const sharedAnswerDependency = (seed: number, variantIndex: number) =>
      seed + variantIndex
    const report = runApplicationProblemProof({
      mode: 'exhaustive',
      family: family(),
      domain: {
        kind: 'finite-complete',
        cases: [{ caseId: 'shared-dependency', seed: 2 }],
        variantIndexes: [0, 1],
      },
      ...exhaustiveAuthority([{ caseId: 'shared-dependency', seed: 2 }], [0, 1]),
      generator: {
        generatorId: 'wrapped-generator-v1',
        dependencyId: 'shared-answer-dependency-v1',
        sourceModule: 'src/lib/application-problems/generators/wrapped-generator-v1.ts',
        generate: ({ seed, variantIndex }) =>
          generated(seed, variantIndex, sharedAnswerDependency(seed, variantIndex)),
      },
      oracle: {
        oracleId: 'wrapped-oracle-v1',
        oracleVersion: 1,
        sourceModule: 'src/lib/application-problems/oracles/wrapped-oracle-v1.ts',
        evidenceRefs: ['reports/application-problems/wrapped-oracle-v1.md'],
        dependencies: ['shared-answer-dependency-v1'],
        evaluate: ({ seed, variantIndex }) =>
          String(sharedAnswerDependency(seed, variantIndex)),
      },
    })

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toContain('ORACLE_NOT_INDEPENDENT')
  })

  it('rejects oracle metadata without a versioned distinct source and review evidence', () => {
    const report = runApplicationProblemProof({
      mode: 'exhaustive',
      family: family(),
      domain: {
        kind: 'finite-complete',
        cases: [{ caseId: 'unverifiable-oracle', seed: 3 }],
        variantIndexes: [0, 1],
      },
      ...exhaustiveAuthority([{ caseId: 'unverifiable-oracle', seed: 3 }], [0, 1]),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => generated(seed, variantIndex),
      },
      oracle: {
        ...independentSumOracle,
        oracleVersion: 0,
        sourceModule: proofGeneratorMetadata.sourceModule,
        evidenceRefs: [],
        dependencies: [],
      },
    })

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toContain('ORACLE_NOT_INDEPENDENT')
  })
})

describe('invariant-boundary application proof', () => {
  it('runs an independent oracle for every explicitly declared boundary class', () => {
    const visitedBoundaries: string[] = []
    const report = runApplicationProblemProof({
      mode: 'invariant-boundary',
      family: family({ proofMode: 'invariant-boundary' }),
      boundaries: ['minimum', 'interior', 'maximum'],
      cases: [
        { caseId: 'min', boundary: 'minimum', seed: 0, variantIndex: 0 },
        { caseId: 'middle', boundary: 'interior', seed: 5, variantIndex: 1 },
        { caseId: 'max', boundary: 'maximum', seed: 10, variantIndex: 2 },
      ],
      ...boundaryAuthority(
        ['minimum', 'interior', 'maximum'],
        [
          { caseId: 'min', boundary: 'minimum', seed: 0, variantIndex: 0 },
          { caseId: 'middle', boundary: 'interior', seed: 5, variantIndex: 1 },
          { caseId: 'max', boundary: 'maximum', seed: 10, variantIndex: 2 },
        ],
      ),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => generated(seed, variantIndex),
      },
      oracle: {
        ...independentSumOracle,
        oracleId: independentSumOracle.oracleId,
        evaluate: (input) => {
          visitedBoundaries.push(input.boundary!)
          expect(input).not.toHaveProperty('answer')
          return independentSumOracle.evaluate(input)
        },
      },
    })

    expect(report.proven).toBe(true)
    expect(report.checkedCount).toBe(3)
    expect(visitedBoundaries).toEqual(['minimum', 'interior', 'maximum'])
  })

  it('fails when a declared boundary classification did not execute', () => {
    const report = runApplicationProblemProof({
      mode: 'invariant-boundary',
      family: family({ proofMode: 'invariant-boundary' }),
      boundaries: ['minimum', 'maximum'],
      cases: [{ caseId: 'min', boundary: 'minimum', seed: 0, variantIndex: 0 }],
      ...boundaryAuthority(
        ['minimum', 'maximum'],
        [{ caseId: 'min', boundary: 'minimum', seed: 0, variantIndex: 0 }],
      ),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => generated(seed, variantIndex),
      },
      oracle: independentSumOracle,
    })

    expect(report.proven).toBe(false)
    expect(report.provenProblems).toEqual([])
    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'BOUNDARY_NOT_EXECUTED',
      familyId: 'proof-family',
      version: 1,
      boundary: 'maximum',
    }))
  })

  it('rejects a boundary submission that omits an authoritative class and case', () => {
    const submitted = [
      { caseId: 'min', boundary: 'minimum', seed: 0, variantIndex: 0 },
      { caseId: 'middle', boundary: 'interior', seed: 5, variantIndex: 1 },
    ]
    const report = runApplicationProblemProof({
      mode: 'invariant-boundary',
      family: family({ proofMode: 'invariant-boundary' }),
      boundaries: ['minimum', 'interior'],
      cases: submitted,
      ...boundaryAuthority(
        ['minimum', 'interior', 'maximum'],
        [
          ...submitted,
          { caseId: 'max', boundary: 'maximum', seed: 10, variantIndex: 2 },
        ],
      ),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => generated(seed, variantIndex),
      },
      oracle: independentSumOracle,
    })

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'BOUNDARY_SET_MISMATCH',
      'MANIFEST_CASE_SET_MISMATCH',
    ]))
  })

  it('reports generation and oracle failures with stable seed provenance', () => {
    const report = runApplicationProblemProof({
      mode: 'invariant-boundary',
      family: family({ proofMode: 'invariant-boundary' }),
      boundaries: ['minimum', 'maximum'],
      cases: [
        { caseId: 'generation', boundary: 'minimum', seed: 1, variantIndex: 0 },
        { caseId: 'oracle', boundary: 'maximum', seed: 2, variantIndex: 1 },
      ],
      ...boundaryAuthority(
        ['minimum', 'maximum'],
        [
          { caseId: 'generation', boundary: 'minimum', seed: 1, variantIndex: 0 },
          { caseId: 'oracle', boundary: 'maximum', seed: 2, variantIndex: 1 },
        ],
      ),
      generator: {
        ...proofGeneratorMetadata,
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => {
          if (seed === 1) throw new Error('candidate unavailable')
          return generated(seed, variantIndex)
        },
      },
      oracle: {
        ...independentSumOracle,
        oracleId: independentSumOracle.oracleId,
        evaluate: () => {
          throw new Error('oracle unavailable')
        },
      },
    })

    expect(report.proven).toBe(false)
    expect(report.provenProblems).toEqual([])
    expect(report.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'GENERATION_FAILED', seed: 1, variantIndex: 0 }),
      expect.objectContaining({ code: 'ORACLE_FAILED', seed: 2, variantIndex: 1 }),
    ]))
  })
})

const approvedCorpusReview = {
  status: 'approved' as const,
  reviewerId: 'curriculum-reviewer',
  reviewedAt: '2026-07-22T00:00:00.000Z',
  evidenceRefs: ['reports/application-problems/proof-family-corpus.md'],
}

describe('static corpus application proof', () => {
  const staticFamily = () => family({
    proofMode: 'static-corpus',
    runtimeMode: 'static-corpus',
  })

  it('accepts only the exhaustively reviewed corpus entries', () => {
    const report = runApplicationProblemProof({
      mode: 'static-corpus',
      family: staticFamily(),
      entries: [
        { corpusId: 'proof-corpus-001', problem: generated(1, 0), review: approvedCorpusReview },
        { corpusId: 'proof-corpus-002', problem: generated(2, 0), review: approvedCorpusReview },
      ],
      ...staticAuthority(['proof-corpus-001', 'proof-corpus-002']),
    })

    expect(report).toMatchObject({
      proven: true,
      checkedCount: 2,
      corpusIds: ['proof-corpus-001', 'proof-corpus-002'],
      issues: [],
    })
    expect(report.provenProblems).toHaveLength(2)
  })

  it('rejects unreviewed entries and includes their corpus IDs', () => {
    const report = runApplicationProblemProof({
      mode: 'static-corpus',
      family: staticFamily(),
      entries: [{
        corpusId: 'proof-corpus-unreviewed',
        problem: generated(1, 0),
        review: { ...approvedCorpusReview, status: 'pending' as const, evidenceRefs: [] },
      }],
      ...staticAuthority(['proof-corpus-unreviewed']),
    })

    expect(report.proven).toBe(false)
    expect(report.provenProblems).toEqual([])
    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'CORPUS_REVIEW_REQUIRED',
      corpusId: 'proof-corpus-unreviewed',
    }))
  })

  it('rejects a static corpus that omits a manifest-approved entry ID', () => {
    const report = runApplicationProblemProof({
      mode: 'static-corpus',
      family: staticFamily(),
      entries: [
        { corpusId: 'proof-corpus-001', problem: generated(1, 0), review: approvedCorpusReview },
        { corpusId: 'proof-corpus-002', problem: generated(2, 0), review: approvedCorpusReview },
      ],
      ...staticAuthority([
        'proof-corpus-001',
        'proof-corpus-002',
        'proof-corpus-003',
      ]),
    })

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toContain('MANIFEST_CASE_SET_MISMATCH')
  })

  it('rejects an empty corpus identity and non-ISO review evidence', () => {
    const report = runApplicationProblemProof({
      mode: 'static-corpus',
      family: staticFamily(),
      entries: [{
        corpusId: '',
        problem: generated(1, 0),
        review: { ...approvedCorpusReview, reviewedAt: 'tomorrow' },
      }],
      ...staticAuthority(['']),
    })

    expect(report.proven).toBe(false)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'INVALID_CORPUS_ID',
      'CORPUS_REVIEW_REQUIRED',
    ]))
  })

  it('rejects a dynamic generator disguised as a static corpus proof', () => {
    const report = runApplicationProblemProof({
      mode: 'static-corpus',
      family: staticFamily(),
      entries: [{ corpusId: 'proof-corpus-001', problem: generated(1, 0), review: approvedCorpusReview }],
      ...staticAuthority(['proof-corpus-001']),
      generate: () => generated(99, 0),
    } as Parameters<typeof runApplicationProblemProof>[0])

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toContain(
      'STATIC_CORPUS_DYNAMIC_GENERATOR_FORBIDDEN',
    )
  })

  it('rejects a generator object disguised as static corpus metadata', () => {
    const report = runApplicationProblemProof({
      mode: 'static-corpus',
      family: staticFamily(),
      entries: [{ corpusId: 'proof-corpus-001', problem: generated(1, 0), review: approvedCorpusReview }],
      ...staticAuthority(['proof-corpus-001']),
      generator: { generate: () => generated(99, 0) },
    } as Parameters<typeof runApplicationProblemProof>[0])

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toContain(
      'STATIC_CORPUS_DYNAMIC_GENERATOR_FORBIDDEN',
    )
  })
})
