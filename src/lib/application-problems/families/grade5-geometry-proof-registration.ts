import type {
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
}

const FAMILY_IMPLEMENTATIONS = {
  perimeter: {
    generatorId: 'g5-perimeter-boundary-rebuild-generator',
    generatorSource: 'src/lib/application-problems/families/g5-perimeter-boundary-rebuild.ts',
    generatorDigest: 'sha256:286df3b2a64bd3d8ad37a9d5d7c63fd44c4c154129c4678d568ccb63b2d70b3b',
    oracleId: 'g5-perimeter-boundary-rebuild-oracle',
    oracleSource: 'src/lib/application-problems/families/g5-perimeter-boundary-rebuild-oracle.ts',
    oracleDigest: 'sha256:19070b2ecf21dc7d252fa1141e056bc480982fe4ca80a3cb6f8a90bf17ca3850',
  },
  composite: {
    generatorId: 'g5-area-composite-inverse-generator',
    generatorSource: 'src/lib/application-problems/families/g5-area-composite-inverse.ts',
    generatorDigest: 'sha256:0ddeb3a0b0b22e4e5c1000f4b2833ac186493a2fc9fc85924813daf2fc896980',
    oracleId: 'g5-area-composite-inverse-oracle',
    oracleSource: 'src/lib/application-problems/families/g5-area-composite-inverse-oracle.ts',
    oracleDigest: 'sha256:3ce409da1b25b1c9c6340142ceefbeff0904fe78c36d8b278551e94a645a84c5',
  },
  overlap: {
    generatorId: 'g5-area-overlap-reconstruction-generator',
    generatorSource: 'src/lib/application-problems/families/g5-area-overlap-reconstruction.ts',
    generatorDigest: 'sha256:7a04a02c70ad7a1437a624573222efb05ef9b28fbab85a8c493bd1794e560d9e',
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
  },
])

function dependency(
  implementationId: string,
  sourceModule: string,
  digest: `sha256:${string}`,
): ApplicationProofDependencyRecordV1 {
  return {
    schemaVersion: 'application-proof-dependency-v1',
    dependencyId: `${implementationId}-root`,
    dependencyVersion: 1,
    kind: 'answer-logic',
    sourceModule,
    digest,
    imports: [],
  }
}

export const G5_GEOMETRY_PROOF_DEPENDENCY_RECORDS_V1 = Object.freeze([
  dependency(
    FAMILY_IMPLEMENTATIONS.perimeter.generatorId,
    FAMILY_IMPLEMENTATIONS.perimeter.generatorSource,
    FAMILY_IMPLEMENTATIONS.perimeter.generatorDigest,
  ),
  dependency(
    FAMILY_IMPLEMENTATIONS.perimeter.oracleId,
    FAMILY_IMPLEMENTATIONS.perimeter.oracleSource,
    FAMILY_IMPLEMENTATIONS.perimeter.oracleDigest,
  ),
  dependency(
    FAMILY_IMPLEMENTATIONS.composite.generatorId,
    FAMILY_IMPLEMENTATIONS.composite.generatorSource,
    FAMILY_IMPLEMENTATIONS.composite.generatorDigest,
  ),
  dependency(
    FAMILY_IMPLEMENTATIONS.composite.oracleId,
    FAMILY_IMPLEMENTATIONS.composite.oracleSource,
    FAMILY_IMPLEMENTATIONS.composite.oracleDigest,
  ),
  dependency(
    FAMILY_IMPLEMENTATIONS.overlap.generatorId,
    FAMILY_IMPLEMENTATIONS.overlap.generatorSource,
    FAMILY_IMPLEMENTATIONS.overlap.generatorDigest,
  ),
  dependency(
    FAMILY_IMPLEMENTATIONS.overlap.oracleId,
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
