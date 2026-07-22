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
  type ApplicationProblemProofV1,
  type ApplicationProofOracleInputV1,
  type ExhaustiveApplicationProofV1,
  type InvariantBoundaryApplicationProofV1,
  type StaticCorpusApplicationProofV1,
} from './proof'
import {
  createTestApplicationProofAuthorityRegistryV1,
  createTestApplicationProofImplementationRegistryV1,
  runApplicationProblemProofWithTestTrust,
} from './__test-support__/proof-trust'
import type {
  ApplicationProofAuthorityEntryV1,
  ApplicationProofDependencyRecordV1,
  ApplicationProofDependencyRefV1,
  RegisteredProofGeneratorV1,
  RegisteredProofOracleV1,
} from './proof-trust.internal'

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

const defaultGenerator: RegisteredProofGeneratorV1 = ({ seed, variantIndex }) =>
  generated(seed, variantIndex)
const defaultOracle: RegisteredProofOracleV1 = ({ params }) =>
  String(numeric(params, 'left') + numeric(params, 'right'))

const manifestReview = {
  reviewedBy: 'proof-manifest-reviewer',
  reviewedAt: '2026-07-22T00:00:00.000Z',
  evidenceRefs: ['reports/application-problems/proof-manifest-review.md'],
}

const generatorPin = {
  implementationId: 'proof-generator-v1',
  implementationVersion: 1,
  sourceDigest: 'sha256:3333333333333333333333333333333333333333333333333333333333333333',
}
const oraclePin = {
  implementationId: 'independent-sum-oracle-v1',
  implementationVersion: 1,
  sourceDigest: 'sha256:4444444444444444444444444444444444444444444444444444444444444444',
}

const pairAuthority = {
  schemaVersion: 'application-proof-authority-entry-v1' as const,
  familyId: 'proof-family',
  familyVersion: 1,
  mode: 'exhaustive' as const,
  manifest: {
    schemaVersion: 'application-proof-authority-manifest-v1' as const,
    authorityId: 'proof-family-exhaustive-authority',
    authorityVersion: 1,
    familyId: 'proof-family',
    familyVersion: 1,
    mode: 'exhaustive' as const,
    expectedCount: 2,
    domainDigest: 'sha256:5890e29870fb7a2ddd52cd2fdabe7cc7c70f2f0cead1c836ef2268744d87f1d4',
    sourceModule: 'src/lib/application-problems/authorities/proof-family-exhaustive-v1.ts',
    sourceDigest: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    generatorRef: generatorPin,
    oracleRef: oraclePin,
    allowedSharedInfrastructure: [],
    ...manifestReview,
  },
  domain: [
    { caseId: 'pair', seed: 1, variantIndex: 0 },
    { caseId: 'pair', seed: 1, variantIndex: 1 },
  ],
} satisfies ApplicationProofAuthorityEntryV1

const boundaryClasses = ['minimum', 'interior', 'maximum'] as const
const boundaryCases = [
  { caseId: 'min', boundary: 'minimum', seed: 0, variantIndex: 0 },
  { caseId: 'middle', boundary: 'interior', seed: 5, variantIndex: 1 },
  { caseId: 'max', boundary: 'maximum', seed: 10, variantIndex: 2 },
] as const
const boundaryAuthority = {
  schemaVersion: 'application-proof-authority-entry-v1' as const,
  familyId: 'proof-family',
  familyVersion: 1,
  mode: 'invariant-boundary' as const,
  manifest: {
    ...pairAuthority.manifest,
    authorityId: 'proof-family-boundary-authority',
    mode: 'invariant-boundary' as const,
    expectedCount: 3,
    domainDigest: 'sha256:be9bfc6a2c2108d6af0205fcce26ae93bf1ed069c75444edde76e7f0122fb15e',
    sourceModule: 'src/lib/application-problems/authorities/proof-family-boundary-v1.ts',
    sourceDigest: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  },
  boundaryClasses,
  cases: boundaryCases,
} satisfies ApplicationProofAuthorityEntryV1

const corpusIds = ['proof-corpus-001', 'proof-corpus-002'] as const
const staticAuthority = {
  schemaVersion: 'application-proof-authority-entry-v1' as const,
  familyId: 'proof-family',
  familyVersion: 1,
  mode: 'static-corpus' as const,
  manifest: {
    schemaVersion: 'application-proof-authority-manifest-v1' as const,
    authorityId: 'proof-family-static-authority',
    authorityVersion: 1,
    familyId: 'proof-family',
    familyVersion: 1,
    mode: 'static-corpus' as const,
    expectedCount: 2,
    domainDigest: 'sha256:43793ae8aeff9b3cfaa4179dd7f1978811f8ed73daffb65e3d4e0cdb2a204448',
    sourceModule: 'src/lib/application-problems/authorities/proof-family-static-v1.ts',
    sourceDigest: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    ...manifestReview,
  },
  corpusIds,
} satisfies ApplicationProofAuthorityEntryV1

const generatorDependency = {
  schemaVersion: 'application-proof-dependency-v1' as const,
  dependencyId: 'proof-generator-answer',
  dependencyVersion: 1,
  kind: 'answer-logic' as const,
  sourceModule: 'src/lib/application-problems/generators/proof-answer.ts',
  digest: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
  imports: [],
} satisfies ApplicationProofDependencyRecordV1
const oracleDependency = {
  schemaVersion: 'application-proof-dependency-v1' as const,
  dependencyId: 'proof-oracle-answer',
  dependencyVersion: 1,
  kind: 'answer-logic' as const,
  sourceModule: 'src/lib/application-problems/oracles/proof-answer.ts',
  digest: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
  imports: [],
} satisfies ApplicationProofDependencyRecordV1

function implementationRegistry(
  generator: RegisteredProofGeneratorV1 = defaultGenerator,
  oracle: RegisteredProofOracleV1 = defaultOracle,
) {
  return createTestApplicationProofImplementationRegistryV1({
    dependencies: [generatorDependency, oracleDependency],
    implementations: [
      {
        schemaVersion: 'application-proof-implementation-v1',
        kind: 'generator',
        implementationId: generatorPin.implementationId,
        implementationVersion: generatorPin.implementationVersion,
        sourceModule: 'src/lib/application-problems/generators/proof-generator-v1.ts',
        sourceDigest: generatorPin.sourceDigest,
        evidenceRefs: ['reports/application-problems/proof-generator-v1.md'],
        rootDependency: {
          dependencyId: generatorDependency.dependencyId,
          dependencyVersion: generatorDependency.dependencyVersion,
          digest: generatorDependency.digest,
        },
        execute: generator,
      },
      {
        schemaVersion: 'application-proof-implementation-v1',
        kind: 'oracle',
        implementationId: oraclePin.implementationId,
        implementationVersion: oraclePin.implementationVersion,
        sourceModule: 'src/lib/application-problems/oracles/independent-sum-v1.ts',
        sourceDigest: oraclePin.sourceDigest,
        evidenceRefs: ['reports/application-problems/independent-sum-oracle-v1.md'],
        rootDependency: {
          dependencyId: oracleDependency.dependencyId,
          dependencyVersion: oracleDependency.dependencyVersion,
          digest: oracleDependency.digest,
        },
        execute: oracle,
      },
    ],
  })
}

function pairProof(
  generator: RegisteredProofGeneratorV1 = defaultGenerator,
  oracle: RegisteredProofOracleV1 = defaultOracle,
  overrides: Partial<ExhaustiveApplicationProofV1> = {},
): ExhaustiveApplicationProofV1 {
  return {
    mode: 'exhaustive',
    family: family(),
    domain: {
      kind: 'finite-complete',
      cases: [{ caseId: 'pair', seed: 1 }],
      variantIndexes: [0, 1],
    },
    generator: { generate: generator },
    oracle: { evaluate: oracle },
    ...overrides,
  }
}

function runPair(
  proof: ExhaustiveApplicationProofV1 = pairProof(),
  authority: ApplicationProofAuthorityEntryV1 = pairAuthority,
  implementations = implementationRegistry(),
) {
  return runApplicationProblemProofWithTestTrust(
    proof,
    createTestApplicationProofAuthorityRegistryV1([authority]),
    implementations,
  )
}

describe('application proof digest', () => {
  it('uses canonical JSON key order and SHA-256', () => {
    const expected = 'sha256:c83fbe7d1868f80e6f8cdbf88728e8a734589fa74e7bf4f87fcc318fd9cfaa09'
    expect(createApplicationProofManifestDigest([
      { caseId: 'a', seed: 1, variantIndex: 0 },
    ])).toBe(expected)
    expect(createApplicationProofManifestDigest([
      { variantIndex: 0, caseId: 'a', seed: 1 },
    ])).toBe(expected)
  })
})

describe('trusted proof registries', () => {
  it('freezes canonical authority records and rejects self-inconsistent records', () => {
    const registry = createTestApplicationProofAuthorityRegistryV1([pairAuthority])
    expect(Object.isFrozen(registry)).toBe(true)
    expect(Object.isFrozen(registry.entries[0])).toBe(true)
    expect(registry.entries[0]).not.toBe(pairAuthority)
    expect(() => createTestApplicationProofAuthorityRegistryV1([
      pairAuthority,
      pairAuthority,
    ])).toThrow(/unique/i)
    expect(() => createTestApplicationProofAuthorityRegistryV1([{
      ...pairAuthority,
      manifest: { ...pairAuthority.manifest, familyVersion: 2 },
    }])).toThrow(/bind/i)
    expect(() => createTestApplicationProofAuthorityRegistryV1([{
      ...pairAuthority,
      manifest: {
        ...pairAuthority.manifest,
        domainDigest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      },
    }])).toThrow(/domainDigest/i)
    expect(() => createTestApplicationProofAuthorityRegistryV1([{
      ...pairAuthority,
      manifest: { ...pairAuthority.manifest, expectedCount: 3 },
    }])).toThrow(/expectedCount/i)
    expect(() => createTestApplicationProofAuthorityRegistryV1([{
      ...pairAuthority,
      manifest: { ...pairAuthority.manifest, evidenceRefs: [] },
    }])).toThrow(/evidenceRefs/i)
    expect(() => createTestApplicationProofAuthorityRegistryV1([{
      ...pairAuthority,
      manifest: { ...pairAuthority.manifest, reviewedBy: '' },
    }])).toThrow(/reviewedBy/i)
    expect(() => createTestApplicationProofAuthorityRegistryV1([{
      ...pairAuthority,
      manifest: {
        ...pairAuthority.manifest,
        expectedCount: 1,
        domainDigest: 'sha256:c83fbe7d1868f80e6f8cdbf88728e8a734589fa74e7bf4f87fcc318fd9cfaa09',
      },
      domain: [{ caseId: 'a', seed: 1, variantIndex: 0 }],
    }])).toThrow(/at least two/i)
  })

  it('rejects duplicate, dangling, digest-mismatched, and cyclic dependency graphs', () => {
    expect(() => createTestApplicationProofImplementationRegistryV1({
      dependencies: [generatorDependency, generatorDependency],
      implementations: [],
    })).toThrow(/duplicate/i)
    expect(() => createTestApplicationProofImplementationRegistryV1({
      dependencies: [{
        ...generatorDependency,
        imports: [{
          dependencyId: 'missing-dependency',
          dependencyVersion: 1,
          digest: 'sha256:9999999999999999999999999999999999999999999999999999999999999999',
        }],
      }],
      implementations: [],
    })).toThrow(/dangling/i)
    expect(() => createTestApplicationProofImplementationRegistryV1({
      dependencies: [
        {
          ...generatorDependency,
          imports: [{
            dependencyId: oracleDependency.dependencyId,
            dependencyVersion: oracleDependency.dependencyVersion,
            digest: 'sha256:9999999999999999999999999999999999999999999999999999999999999999',
          }],
        },
        oracleDependency,
      ],
      implementations: [],
    })).toThrow(/digest mismatch/i)
    expect(() => createTestApplicationProofImplementationRegistryV1({
      dependencies: [
        {
          ...generatorDependency,
          imports: [{
            dependencyId: oracleDependency.dependencyId,
            dependencyVersion: oracleDependency.dependencyVersion,
            digest: oracleDependency.digest,
          }],
        },
        {
          ...oracleDependency,
          imports: [{
            dependencyId: generatorDependency.dependencyId,
            dependencyVersion: generatorDependency.dependencyVersion,
            digest: generatorDependency.digest,
          }],
        },
      ],
      implementations: [],
    })).toThrow(/cycle/i)

    const valid = implementationRegistry()
    expect(() => createTestApplicationProofImplementationRegistryV1({
      dependencies: valid.dependencies,
      implementations: [valid.implementations[0], valid.implementations[0]],
    })).toThrow(/unique/i)
  })
})

describe('exhaustive application proof', () => {
  it('does not accept caller-declared authority through the production runner', () => {
    const selfDeclared = {
      ...pairProof(),
      manifest: pairAuthority.manifest,
      enumerateDomain: () => pairAuthority.domain,
    } as unknown as ApplicationProblemProofV1

    const report = runApplicationProblemProof(selfDeclared)

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.issues.map((issue) => issue.code)).toContain('PROOF_AUTHORITY_NOT_FOUND')
  })

  it('fails closed for missing and wrong family-version authority', () => {
    const empty = createTestApplicationProofAuthorityRegistryV1([])
    const missing = runApplicationProblemProofWithTestTrust(
      pairProof(),
      empty,
      implementationRegistry(),
    )
    const wrongVersion = runApplicationProblemProofWithTestTrust(
      pairProof(defaultGenerator, defaultOracle, { family: family({ version: 2 }) }),
      createTestApplicationProofAuthorityRegistryV1([pairAuthority]),
      implementationRegistry(),
    )

    expect(missing.issues.map((issue) => issue.code)).toContain('PROOF_AUTHORITY_NOT_FOUND')
    expect(wrongVersion.issues.map((issue) => issue.code)).toContain(
      'PROOF_AUTHORITY_NOT_FOUND',
    )
    expect(missing.provenProblems).toEqual([])
    expect(wrongVersion.provenProblems).toEqual([])
  })

  it('executes only the exact registered authority and records all proof refs', () => {
    const report = runPair()

    expect(report).toMatchObject({
      proven: true,
      checkedCount: 2,
      issues: [],
      authorityRef: {
        authorityId: pairAuthority.manifest.authorityId,
        authorityVersion: 1,
        domainDigest: pairAuthority.manifest.domainDigest,
      },
      generatorRef: {
        implementationId: generatorPin.implementationId,
        implementationVersion: 1,
        sourceDigest: generatorPin.sourceDigest,
      },
      oracleRef: {
        implementationId: oraclePin.implementationId,
        implementationVersion: 1,
        sourceDigest: oraclePin.sourceDigest,
      },
    })
    expect(report.provenProblems).toHaveLength(2)
  })

  it('rejects a submitted domain that differs from registered authority', () => {
    const report = runPair(pairProof(defaultGenerator, defaultOracle, {
      domain: {
        kind: 'finite-complete',
        cases: [{ caseId: 'pair', seed: 1 }],
        variantIndexes: [0],
      },
    }))

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.issues.map((issue) => issue.code)).toContain('MANIFEST_CASE_SET_MISMATCH')
  })

  it('does not return proven problems when a registered generator answer is wrong', () => {
    const wrongGenerator: RegisteredProofGeneratorV1 = ({ seed, variantIndex }) =>
      generated(seed, variantIndex, variantIndex === 1 ? 999 : seed + variantIndex)
    const report = runPair(
      pairProof(wrongGenerator),
      pairAuthority,
      implementationRegistry(wrongGenerator),
    )

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(2)
    expect(report.provenProblems).toEqual([])
    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'ANSWER_MISMATCH',
      caseId: 'pair',
      seed: 1,
      variantIndex: 1,
    }))
  })

  it('rejects wrappers and caller-invented implementation metadata', () => {
    const wrappedGenerator: RegisteredProofGeneratorV1 = (input) => defaultGenerator(input)
    const wrappedOracle: RegisteredProofOracleV1 = (input) => defaultOracle(input)
    const fakeInput = {
      ...pairProof(wrappedGenerator, wrappedOracle),
      generator: {
        generatorId: 'fake-generator',
        sourceModule: 'src/fake-generator.ts',
        sourceDigest: 'sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        generate: wrappedGenerator,
      },
      oracle: {
        oracleId: 'fake-oracle',
        sourceModule: 'src/fake-oracle.ts',
        sourceDigest: 'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        evaluate: wrappedOracle,
      },
    } as unknown as ExhaustiveApplicationProofV1
    const report = runPair(fakeInput, pairAuthority, implementationRegistry())

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.issues.map((issue) => issue.code)).toContain(
      'IMPLEMENTATION_CALLBACK_MISMATCH',
    )
  })

  it('rejects the same executable callback even when it is registered under two IDs', () => {
    const sharedImplementation = ((input: Record<string, unknown>) =>
      'params' in input
        ? String(
            numeric(input.params as Readonly<Record<string, JsonValue>>, 'left') +
            numeric(input.params as Readonly<Record<string, JsonValue>>, 'right'),
          )
        : generated(input.seed as number, input.variantIndex as number))
    const base = implementationRegistry()
    const generatorRegistration = base.implementations.find(
      (registration) => registration.kind === 'generator',
    )
    const oracleRegistration = base.implementations.find(
      (registration) => registration.kind === 'oracle',
    )
    if (generatorRegistration?.kind !== 'generator' || oracleRegistration?.kind !== 'oracle') {
      throw new Error('proof implementation fixtures are incomplete')
    }
    const registry = createTestApplicationProofImplementationRegistryV1({
      dependencies: base.dependencies,
      implementations: [
        {
          ...generatorRegistration,
          execute: sharedImplementation as unknown as RegisteredProofGeneratorV1,
        },
        {
          ...oracleRegistration,
          execute: sharedImplementation as unknown as RegisteredProofOracleV1,
        },
      ],
    })
    const report = runPair(
      pairProof(
        sharedImplementation as unknown as RegisteredProofGeneratorV1,
        sharedImplementation as unknown as RegisteredProofOracleV1,
      ),
      pairAuthority,
      registry,
    )

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.issues.map((issue) => issue.code)).toContain('ORACLE_NOT_INDEPENDENT')
  })

  it('rejects unverifiable oracle registration metadata and a shared source', () => {
    const base = implementationRegistry()
    expect(() => createTestApplicationProofImplementationRegistryV1({
      dependencies: base.dependencies,
      implementations: [{
        ...base.implementations[1],
        implementationVersion: 0,
        evidenceRefs: [],
      }],
    })).toThrow(/implementationVersion/i)

    const sameSourceRegistry = createTestApplicationProofImplementationRegistryV1({
      dependencies: base.dependencies,
      implementations: [
        base.implementations[0],
        {
          ...base.implementations[1],
          sourceModule: base.implementations[0].sourceModule,
        },
      ],
    })
    const report = runPair(pairProof(), pairAuthority, sameSourceRegistry)

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.issues.map((issue) => issue.code)).toContain('ORACLE_NOT_INDEPENDENT')
  })

  it.each([
    ['answer-logic', false],
    ['infrastructure', true],
  ] as const)(
    'allows a shared %s dependency only when authority allowlists infrastructure',
    (sharedKind, expectedProven) => {
      const sharedDependency = {
        schemaVersion: 'application-proof-dependency-v1' as const,
        dependencyId: 'shared-proof-dependency',
        dependencyVersion: 1,
        kind: sharedKind,
        sourceModule: 'src/lib/application-problems/shared/proof-dependency.ts',
        digest: 'sha256:5555555555555555555555555555555555555555555555555555555555555555',
        imports: [],
      } satisfies ApplicationProofDependencyRecordV1
      const sharedRef: ApplicationProofDependencyRefV1 = {
        dependencyId: sharedDependency.dependencyId,
        dependencyVersion: sharedDependency.dependencyVersion,
        digest: sharedDependency.digest,
      }
      const generatorRoot = { ...generatorDependency, imports: [sharedRef] }
      const oracleRoot = { ...oracleDependency, imports: [sharedRef] }
      const base = implementationRegistry()
      const implementations = base.implementations.map((registration) => ({
        ...registration,
        rootDependency: registration.kind === 'generator'
          ? {
              dependencyId: generatorRoot.dependencyId,
              dependencyVersion: generatorRoot.dependencyVersion,
              digest: generatorRoot.digest,
            }
          : {
              dependencyId: oracleRoot.dependencyId,
              dependencyVersion: oracleRoot.dependencyVersion,
              digest: oracleRoot.digest,
            },
      }))
      const registry = createTestApplicationProofImplementationRegistryV1({
        dependencies: [generatorRoot, oracleRoot, sharedDependency],
        implementations,
      })
      const authority = {
        ...pairAuthority,
        manifest: {
          ...pairAuthority.manifest,
          allowedSharedInfrastructure: [sharedRef],
        },
      } satisfies ApplicationProofAuthorityEntryV1
      const report = runPair(pairProof(), authority, registry)

      expect(report.proven).toBe(expectedProven)
      expect(report.checkedCount).toBe(expectedProven ? 2 : 0)
      if (!expectedProven) {
        expect(report.issues.map((issue) => issue.code)).toContain('ORACLE_NOT_INDEPENDENT')
      }
    },
  )
})

describe('invariant-boundary application proof', () => {
  function boundaryProof(
    generator: RegisteredProofGeneratorV1 = defaultGenerator,
    oracle: RegisteredProofOracleV1 = defaultOracle,
    overrides: Partial<InvariantBoundaryApplicationProofV1> = {},
  ): InvariantBoundaryApplicationProofV1 {
    return {
      mode: 'invariant-boundary',
      family: family({ proofMode: 'invariant-boundary' }),
      boundaries: boundaryClasses,
      cases: boundaryCases,
      generator: { generate: generator },
      oracle: { evaluate: oracle },
      ...overrides,
    }
  }

  function runBoundary(
    proof: InvariantBoundaryApplicationProofV1,
    implementations = implementationRegistry(
      proof.generator.generate,
      proof.oracle.evaluate,
    ),
  ) {
    return runApplicationProblemProofWithTestTrust(
      proof,
      createTestApplicationProofAuthorityRegistryV1([boundaryAuthority]),
      implementations,
    )
  }

  it('executes every registered boundary class with the exact oracle', () => {
    const visited: string[] = []
    const oracle: RegisteredProofOracleV1 = (input) => {
      visited.push(input.boundary!)
      return defaultOracle(input)
    }
    const report = runBoundary(boundaryProof(defaultGenerator, oracle))

    expect(report.proven).toBe(true)
    expect(report.checkedCount).toBe(3)
    expect(visited).toEqual(boundaryClasses)
  })

  it('rejects omitted registered boundary classes and cases', () => {
    const report = runBoundary(boundaryProof(defaultGenerator, defaultOracle, {
      boundaries: ['minimum', 'interior'],
      cases: boundaryCases.slice(0, 2),
    }))

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'BOUNDARY_SET_MISMATCH',
      'MANIFEST_CASE_SET_MISMATCH',
    ]))
  })

  it('fails when a declared boundary classification did not execute', () => {
    const report = runBoundary(boundaryProof(defaultGenerator, defaultOracle, {
      boundaries: boundaryClasses,
      cases: boundaryCases.slice(0, 2),
    }))

    expect(report.proven).toBe(false)
    expect(report.provenProblems).toEqual([])
    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'BOUNDARY_NOT_EXECUTED',
      boundary: 'maximum',
    }))
  })

  it('reports registered generation and oracle failures with seed provenance', () => {
    const generator: RegisteredProofGeneratorV1 = ({ seed, variantIndex }) => {
      if (seed === 0) throw new Error('unavailable')
      return generated(seed, variantIndex)
    }
    const oracle: RegisteredProofOracleV1 = (input: ApplicationProofOracleInputV1) => {
      if (input.seed === 5) throw new Error('unavailable')
      return defaultOracle(input)
    }
    const report = runBoundary(boundaryProof(generator, oracle))

    expect(report.proven).toBe(false)
    expect(report.provenProblems).toEqual([])
    expect(report.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'GENERATION_FAILED', seed: 0, variantIndex: 0 }),
      expect.objectContaining({ code: 'ORACLE_FAILED', seed: 5, variantIndex: 1 }),
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
  const reviewedEntries = () => [
    { corpusId: corpusIds[0], problem: generated(1, 0), review: approvedCorpusReview },
    { corpusId: corpusIds[1], problem: generated(2, 0), review: approvedCorpusReview },
  ]
  const runStatic = (proof: StaticCorpusApplicationProofV1) =>
    runApplicationProblemProofWithTestTrust(
      proof,
      createTestApplicationProofAuthorityRegistryV1([staticAuthority]),
    )

  it('accepts only the exact registered and reviewed corpus', () => {
    const report = runStatic({
      mode: 'static-corpus',
      family: staticFamily(),
      entries: reviewedEntries(),
    })

    expect(report).toMatchObject({
      proven: true,
      checkedCount: 2,
      corpusIds,
      issues: [],
      authorityRef: { authorityId: staticAuthority.manifest.authorityId },
    })
    expect(report.provenProblems).toHaveLength(2)
  })

  it('rejects omitted IDs and unreviewed entries without returning proven problems', () => {
    const omitted = runStatic({
      mode: 'static-corpus',
      family: staticFamily(),
      entries: reviewedEntries().slice(0, 1),
    })
    const entries: StaticCorpusApplicationProofV1['entries'] = reviewedEntries().map(
      (entry, index) => index === 1
        ? {
            ...entry,
            review: { ...approvedCorpusReview, status: 'pending', evidenceRefs: [] },
          }
        : entry,
    )
    const unreviewed = runStatic({
      mode: 'static-corpus',
      family: staticFamily(),
      entries,
    })

    expect(omitted.issues.map((issue) => issue.code)).toContain('MANIFEST_CASE_SET_MISMATCH')
    expect(unreviewed.issues).toContainEqual(expect.objectContaining({
      code: 'CORPUS_REVIEW_REQUIRED',
      corpusId: corpusIds[1],
    }))
    expect(omitted.provenProblems).toEqual([])
    expect(unreviewed.provenProblems).toEqual([])
  })

  it('rejects dynamic generator metadata on a static corpus proof', () => {
    const report = runStatic({
      mode: 'static-corpus',
      family: staticFamily(),
      entries: reviewedEntries(),
      generator: { generate: defaultGenerator },
    } as unknown as StaticCorpusApplicationProofV1)

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.issues.map((issue) => issue.code)).toContain(
      'STATIC_CORPUS_DYNAMIC_GENERATOR_FORBIDDEN',
    )
  })

  it('rejects an empty corpus identity and non-ISO review evidence', () => {
    const report = runStatic({
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

  it('rejects a dynamic generate callback disguised as static corpus metadata', () => {
    const report = runStatic({
      mode: 'static-corpus',
      family: staticFamily(),
      entries: reviewedEntries(),
      generate: () => generated(99, 0),
    } as unknown as StaticCorpusApplicationProofV1)

    expect(report.proven).toBe(false)
    expect(report.checkedCount).toBe(0)
    expect(report.provenProblems).toEqual([])
    expect(report.issues.map((issue) => issue.code)).toContain(
      'STATIC_CORPUS_DYNAMIC_GENERATOR_FORBIDDEN',
    )
  })
})
