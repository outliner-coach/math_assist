import { describe, expect, it } from 'vitest'
import {
  parseApplicationProblemFamilyV1,
  parseGeneratedApplicationProblemV1,
  type ApplicationProblemFamilyV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from './contracts'
import { runApplicationProblemProof } from './proof'

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
  evaluate: ({ params }: { params: Readonly<Record<string, JsonValue>> }) =>
    String(numeric(params, 'left') + numeric(params, 'right')),
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
      generator: {
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => {
          generatedKeys.push(`${seed}:${variantIndex}`)
          return generated(seed, variantIndex)
        },
      },
      oracle: {
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
      generator: {
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

  it('rejects an oracle that declares the generator identity as its own', () => {
    const report = runApplicationProblemProof({
      mode: 'exhaustive',
      family: family(),
      domain: {
        kind: 'finite-complete',
        cases: [{ caseId: 'only', seed: 1 }],
        variantIndexes: [0],
      },
      generator: {
        generatorId: 'shared-claim-function',
        generate: ({ seed, variantIndex }) => generated(seed, variantIndex),
      },
      oracle: {
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
      generator: {
        generatorId: 'generator-label',
        generate: sharedImplementation as never,
      },
      oracle: {
        oracleId: 'oracle-label',
        evaluate: sharedImplementation as never,
      },
    })

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
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
      generator: {
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => generated(seed, variantIndex),
      },
      oracle: {
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
      generator: {
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

  it('reports generation and oracle failures with stable seed provenance', () => {
    const report = runApplicationProblemProof({
      mode: 'invariant-boundary',
      family: family({ proofMode: 'invariant-boundary' }),
      boundaries: ['minimum', 'maximum'],
      cases: [
        { caseId: 'generation', boundary: 'minimum', seed: 1, variantIndex: 0 },
        { caseId: 'oracle', boundary: 'maximum', seed: 2, variantIndex: 1 },
      ],
      generator: {
        generatorId: 'proof-generator-v1',
        generate: ({ seed, variantIndex }) => {
          if (seed === 1) throw new Error('candidate unavailable')
          return generated(seed, variantIndex)
        },
      },
      oracle: {
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
    })

    expect(report.proven).toBe(false)
    expect(report.provenProblems).toEqual([])
    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'CORPUS_REVIEW_REQUIRED',
      corpusId: 'proof-corpus-unreviewed',
    }))
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
