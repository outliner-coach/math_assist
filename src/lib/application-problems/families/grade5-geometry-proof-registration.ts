import type {
  ApplicationProofDependencyKindV1,
  ApplicationProofDependencyRefV1,
  ApplicationProofDependencyRecordV1,
  ApplicationProofImplementationRegistrationV1,
} from '../proof-trust.internal'
import {
  generateG5AreaCompositeInverseProblem,
  generateG5AreaOverlapReconstructionProblem,
  generateG5PerimeterBoundaryRebuildProblem,
} from './grade5-geometry-families'
import { evaluateG5AreaCompositeInverseOracle } from './g5-area-composite-inverse-oracle'
import { evaluateG5AreaOverlapReconstructionOracle } from './g5-area-overlap-reconstruction-oracle'
import { evaluateG5PerimeterBoundaryRebuildOracle } from './g5-perimeter-boundary-rebuild-oracle'
import {
  G5_AREA_COMPOSITE_INVERSE_AUTHORITY_DOMAIN,
  G5_AREA_OVERLAP_RECONSTRUCTION_AUTHORITY_DOMAIN,
  G5_PERIMETER_BOUNDARY_REBUILD_AUTHORITY_DOMAIN,
} from './grade5-geometry-proof-domains'

const DOMAIN_SOURCE = 'src/lib/application-problems/families/grade5-geometry-proof-domains.ts'
const DOMAIN_SOURCE_DIGEST = 'sha256:62b40c6a7d2e1643a62973379e25ef9e95d780cd6978add48d8fb86937a2f20d'
const TEST_EVIDENCE = 'src/lib/application-problems/families/grade5-geometry-families.test.ts'

export interface PendingExhaustiveProofAuthoritySourceV1 {
  schemaVersion: 'application-proof-authority-source-v1'
  authorityId: string
  authorityVersion: 1
  familyId: string
  familyVersion: 1
  mode: 'exhaustive'
  expectedCount: number
  domainDigest: `sha256:${string}`
  sourceModule: string
  sourceDigest: `sha256:${string}`
  reviewStatus: 'pending'
  domain: readonly { caseId: string; seed: number; variantIndex: number }[]
  generatorRef: {
    implementationId: string
    implementationVersion: 1
    sourceDigest: `sha256:${string}`
  }
  oracleRef: {
    implementationId: string
    implementationVersion: 1
    sourceDigest: `sha256:${string}`
  }
  allowedSharedInfrastructure: readonly ApplicationProofDependencyRefV1[]
}

const CONTRACTS_INFRASTRUCTURE = {
  dependencyId: 'application-problem-contracts-infrastructure',
  dependencyVersion: 1,
  sourceModule: 'src/lib/application-problems/contracts.ts',
  digest: 'sha256:fd40dabf1095e87a1c9e8706a512b1bb1b6252415e063cd98eead1369d89fb0b',
} as const
const RANDOM_INFRASTRUCTURE = {
  dependencyId: 'application-problem-random-infrastructure',
  dependencyVersion: 1,
  sourceModule: 'src/lib/application-problems/random.ts',
  digest: 'sha256:b31d86c8f34b63fa7dd1d357207336b2b3c1f7d2e470c3b76c794d754a21aca0',
} as const
const GENERATOR_INFRASTRUCTURE = {
  dependencyId: 'application-problem-generator-infrastructure',
  dependencyVersion: 1,
  sourceModule: 'src/lib/application-problems/generator.ts',
  digest: 'sha256:15a93ff5976be59d2602b615401979e2062161784beff4678ba9f27c1680f284',
} as const

function dependencyRef(
  dependency: Pick<ApplicationProofDependencyRecordV1, 'dependencyId' | 'dependencyVersion' | 'digest'>,
): ApplicationProofDependencyRefV1 {
  return {
    dependencyId: dependency.dependencyId,
    dependencyVersion: dependency.dependencyVersion,
    digest: dependency.digest,
  }
}

const GENERATOR_INFRASTRUCTURE_REF = dependencyRef(GENERATOR_INFRASTRUCTURE)

const FAMILY_IMPLEMENTATIONS = {
  perimeter: {
    generatorId: 'g5-perimeter-boundary-rebuild-generator',
    generatorSource: 'src/lib/application-problems/families/g5-perimeter-boundary-rebuild.ts',
    generatorDigest: 'sha256:f37462c393696a6214e2c273a8155af8d11f2ceb2f480af38d6855e161c7d316',
    oracleId: 'g5-perimeter-boundary-rebuild-oracle',
    oracleSource: 'src/lib/application-problems/families/g5-perimeter-boundary-rebuild-oracle.ts',
    oracleDigest: 'sha256:19070b2ecf21dc7d252fa1141e056bc480982fe4ca80a3cb6f8a90bf17ca3850',
  },
  composite: {
    generatorId: 'g5-area-composite-inverse-generator',
    generatorSource: 'src/lib/application-problems/families/g5-area-composite-inverse.ts',
    generatorDigest: 'sha256:48064eb3723a271ee7d8f50154f77260ac313b94277a7194aa88f83dea4b181c',
    oracleId: 'g5-area-composite-inverse-oracle',
    oracleSource: 'src/lib/application-problems/families/g5-area-composite-inverse-oracle.ts',
    oracleDigest: 'sha256:3ce409da1b25b1c9c6340142ceefbeff0904fe78c36d8b278551e94a645a84c5',
  },
  overlap: {
    generatorId: 'g5-area-overlap-reconstruction-generator',
    generatorSource: 'src/lib/application-problems/families/g5-area-overlap-reconstruction.ts',
    generatorDigest: 'sha256:2df7f15ed08fbcb92ed9e855f8975245080f756a025c20362a8b5481624ad573',
    oracleId: 'g5-area-overlap-reconstruction-oracle',
    oracleSource: 'src/lib/application-problems/families/g5-area-overlap-reconstruction-oracle.ts',
    oracleDigest: 'sha256:4adae455c9f7b955ceb9b3221ef32f839140ecab85e9f36cb39bc97f009a64c8',
  },
} as const

export const G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1: readonly PendingExhaustiveProofAuthoritySourceV1[] = Object.freeze([
  {
    schemaVersion: 'application-proof-authority-source-v1',
    authorityId: 'g5-perimeter-boundary-rebuild-exhaustive-authority',
    authorityVersion: 1,
    familyId: 'g5-perimeter-boundary-rebuild',
    familyVersion: 1,
    mode: 'exhaustive',
    expectedCount: 1024,
    domainDigest: 'sha256:8175e9aa42671a00991c89006a7e75a52b26339f9bf4c579c25ddcfc1daf52c1',
    sourceModule: DOMAIN_SOURCE,
    sourceDigest: DOMAIN_SOURCE_DIGEST,
    reviewStatus: 'pending',
    domain: G5_PERIMETER_BOUNDARY_REBUILD_AUTHORITY_DOMAIN,
    generatorRef: {
      implementationId: FAMILY_IMPLEMENTATIONS.perimeter.generatorId,
      implementationVersion: 1,
      sourceDigest: FAMILY_IMPLEMENTATIONS.perimeter.generatorDigest,
    },
    oracleRef: {
      implementationId: FAMILY_IMPLEMENTATIONS.perimeter.oracleId,
      implementationVersion: 1,
      sourceDigest: FAMILY_IMPLEMENTATIONS.perimeter.oracleDigest,
    },
    allowedSharedInfrastructure: [],
  },
  {
    schemaVersion: 'application-proof-authority-source-v1',
    authorityId: 'g5-area-composite-inverse-exhaustive-authority',
    authorityVersion: 1,
    familyId: 'g5-area-composite-inverse',
    familyVersion: 1,
    mode: 'exhaustive',
    expectedCount: 108,
    domainDigest: 'sha256:00004cf0e9c29f60b587ccd62d46ffe5412c394d491388bd5d5f246b981e5820',
    sourceModule: DOMAIN_SOURCE,
    sourceDigest: DOMAIN_SOURCE_DIGEST,
    reviewStatus: 'pending',
    domain: G5_AREA_COMPOSITE_INVERSE_AUTHORITY_DOMAIN,
    generatorRef: {
      implementationId: FAMILY_IMPLEMENTATIONS.composite.generatorId,
      implementationVersion: 1,
      sourceDigest: FAMILY_IMPLEMENTATIONS.composite.generatorDigest,
    },
    oracleRef: {
      implementationId: FAMILY_IMPLEMENTATIONS.composite.oracleId,
      implementationVersion: 1,
      sourceDigest: FAMILY_IMPLEMENTATIONS.composite.oracleDigest,
    },
    allowedSharedInfrastructure: [],
  },
  {
    schemaVersion: 'application-proof-authority-source-v1',
    authorityId: 'g5-area-overlap-reconstruction-exhaustive-authority',
    authorityVersion: 1,
    familyId: 'g5-area-overlap-reconstruction',
    familyVersion: 1,
    mode: 'exhaustive',
    expectedCount: 243,
    domainDigest: 'sha256:436458534f4912b7da8774a3ef861654afbc60e011aac071b94a1425a9466458',
    sourceModule: DOMAIN_SOURCE,
    sourceDigest: DOMAIN_SOURCE_DIGEST,
    reviewStatus: 'pending',
    domain: G5_AREA_OVERLAP_RECONSTRUCTION_AUTHORITY_DOMAIN,
    generatorRef: {
      implementationId: FAMILY_IMPLEMENTATIONS.overlap.generatorId,
      implementationVersion: 1,
      sourceDigest: FAMILY_IMPLEMENTATIONS.overlap.generatorDigest,
    },
    oracleRef: {
      implementationId: FAMILY_IMPLEMENTATIONS.overlap.oracleId,
      implementationVersion: 1,
      sourceDigest: FAMILY_IMPLEMENTATIONS.overlap.oracleDigest,
    },
    allowedSharedInfrastructure: [],
  },
])

function dependency(
  dependencyId: string,
  sourceModule: string,
  digest: `sha256:${string}`,
  imports: readonly ApplicationProofDependencyRefV1[] = [],
  kind: ApplicationProofDependencyKindV1 = 'answer-logic',
): ApplicationProofDependencyRecordV1 {
  return {
    schemaVersion: 'application-proof-dependency-v1',
    dependencyId,
    dependencyVersion: 1,
    kind,
    sourceModule,
    digest,
    imports,
  }
}

export const G5_GEOMETRY_PROOF_DEPENDENCY_RECORDS_V1 = Object.freeze([
  dependency(
    CONTRACTS_INFRASTRUCTURE.dependencyId,
    CONTRACTS_INFRASTRUCTURE.sourceModule,
    CONTRACTS_INFRASTRUCTURE.digest,
    [],
    'infrastructure',
  ),
  dependency(
    RANDOM_INFRASTRUCTURE.dependencyId,
    RANDOM_INFRASTRUCTURE.sourceModule,
    RANDOM_INFRASTRUCTURE.digest,
    [],
    'infrastructure',
  ),
  dependency(
    GENERATOR_INFRASTRUCTURE.dependencyId,
    GENERATOR_INFRASTRUCTURE.sourceModule,
    GENERATOR_INFRASTRUCTURE.digest,
    [dependencyRef(CONTRACTS_INFRASTRUCTURE), dependencyRef(RANDOM_INFRASTRUCTURE)],
    'infrastructure',
  ),
  dependency(
    `${FAMILY_IMPLEMENTATIONS.perimeter.generatorId}-root`,
    FAMILY_IMPLEMENTATIONS.perimeter.generatorSource,
    FAMILY_IMPLEMENTATIONS.perimeter.generatorDigest,
    [GENERATOR_INFRASTRUCTURE_REF],
  ),
  dependency(
    `${FAMILY_IMPLEMENTATIONS.perimeter.oracleId}-root`,
    FAMILY_IMPLEMENTATIONS.perimeter.oracleSource,
    FAMILY_IMPLEMENTATIONS.perimeter.oracleDigest,
  ),
  dependency(
    `${FAMILY_IMPLEMENTATIONS.composite.generatorId}-root`,
    FAMILY_IMPLEMENTATIONS.composite.generatorSource,
    FAMILY_IMPLEMENTATIONS.composite.generatorDigest,
    [GENERATOR_INFRASTRUCTURE_REF],
  ),
  dependency(
    `${FAMILY_IMPLEMENTATIONS.composite.oracleId}-root`,
    FAMILY_IMPLEMENTATIONS.composite.oracleSource,
    FAMILY_IMPLEMENTATIONS.composite.oracleDigest,
  ),
  dependency(
    `${FAMILY_IMPLEMENTATIONS.overlap.generatorId}-root`,
    FAMILY_IMPLEMENTATIONS.overlap.generatorSource,
    FAMILY_IMPLEMENTATIONS.overlap.generatorDigest,
    [GENERATOR_INFRASTRUCTURE_REF],
  ),
  dependency(
    `${FAMILY_IMPLEMENTATIONS.overlap.oracleId}-root`,
    FAMILY_IMPLEMENTATIONS.overlap.oracleSource,
    FAMILY_IMPLEMENTATIONS.overlap.oracleDigest,
  ),
])

function implementation(
  kind: 'generator' | 'oracle',
  implementationId: string,
  sourceModule: string,
  sourceDigest: `sha256:${string}`,
  execute: ApplicationProofImplementationRegistrationV1['execute'],
): ApplicationProofImplementationRegistrationV1 {
  const common = {
    schemaVersion: 'application-proof-implementation-v1' as const,
    kind,
    implementationId,
    implementationVersion: 1,
    sourceModule,
    sourceDigest,
    evidenceRefs: [TEST_EVIDENCE],
    rootDependency: {
      dependencyId: `${implementationId}-root`,
      dependencyVersion: 1,
      digest: sourceDigest,
    },
  }
  return kind === 'generator'
    ? { ...common, kind, execute: execute as Extract<ApplicationProofImplementationRegistrationV1, { kind: 'generator' }>['execute'] }
    : { ...common, kind, execute: execute as Extract<ApplicationProofImplementationRegistrationV1, { kind: 'oracle' }>['execute'] }
}

export const G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1 = Object.freeze([
  implementation(
    'generator',
    FAMILY_IMPLEMENTATIONS.perimeter.generatorId,
    FAMILY_IMPLEMENTATIONS.perimeter.generatorSource,
    FAMILY_IMPLEMENTATIONS.perimeter.generatorDigest,
    generateG5PerimeterBoundaryRebuildProblem,
  ),
  implementation(
    'oracle',
    FAMILY_IMPLEMENTATIONS.perimeter.oracleId,
    FAMILY_IMPLEMENTATIONS.perimeter.oracleSource,
    FAMILY_IMPLEMENTATIONS.perimeter.oracleDigest,
    evaluateG5PerimeterBoundaryRebuildOracle,
  ),
  implementation(
    'generator',
    FAMILY_IMPLEMENTATIONS.composite.generatorId,
    FAMILY_IMPLEMENTATIONS.composite.generatorSource,
    FAMILY_IMPLEMENTATIONS.composite.generatorDigest,
    generateG5AreaCompositeInverseProblem,
  ),
  implementation(
    'oracle',
    FAMILY_IMPLEMENTATIONS.composite.oracleId,
    FAMILY_IMPLEMENTATIONS.composite.oracleSource,
    FAMILY_IMPLEMENTATIONS.composite.oracleDigest,
    evaluateG5AreaCompositeInverseOracle,
  ),
  implementation(
    'generator',
    FAMILY_IMPLEMENTATIONS.overlap.generatorId,
    FAMILY_IMPLEMENTATIONS.overlap.generatorSource,
    FAMILY_IMPLEMENTATIONS.overlap.generatorDigest,
    generateG5AreaOverlapReconstructionProblem,
  ),
  implementation(
    'oracle',
    FAMILY_IMPLEMENTATIONS.overlap.oracleId,
    FAMILY_IMPLEMENTATIONS.overlap.oracleSource,
    FAMILY_IMPLEMENTATIONS.overlap.oracleDigest,
    evaluateG5AreaOverlapReconstructionOracle,
  ),
])
