import type { ExhaustiveApplicationProofV1 } from '../proof'
import type {
  ApplicationProofAuthorityEntryV1,
  ApplicationProofDependencyRecordV1,
  ApplicationProofImplementationRegistrationV1,
  ApplicationProofPinnedImplementationRefV1,
} from '../proof-trust.internal'
import {
  G2_LENGTH_ROUTE_TOTAL_CASES,
  G2_LENGTH_ROUTE_TOTAL_FAMILY,
  generateG2LengthRouteTotal,
} from './g2-length-route-total'
import { evaluateG2LengthRouteTotalOracle } from './g2-length-route-total.oracle'
import {
  G2_LENGTH_MISSING_SEGMENT_CASES,
  G2_LENGTH_MISSING_SEGMENT_FAMILY,
  generateG2LengthMissingSegment,
} from './g2-length-missing-segment'
import { evaluateG2LengthMissingSegmentOracle } from './g2-length-missing-segment.oracle'
import {
  G2_LENGTH_CLAIM_CHECK_CASES,
  G2_LENGTH_CLAIM_CHECK_FAMILY,
  generateG2LengthClaimCheck,
} from './g2-length-claim-check'
import { evaluateG2LengthClaimCheckOracle } from './g2-length-claim-check.oracle'

const EVIDENCE = ['src/lib/application-problems/families/g2-length-families.test.ts'] as const
const REVIEW = {
  reviewedBy: 'automated-exhaustive-suite',
  reviewedAt: '2026-07-22T00:00:00.000Z',
  evidenceRefs: EVIDENCE,
} as const

const SCENE_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g2-length-scene-infrastructure',
  dependencyVersion: 1,
  kind: 'infrastructure',
  sourceModule: 'src/lib/application-problems/families/g2-length-scene.ts',
  digest: 'sha256:05b48618d35f90898d034d88b69fd7f6e7d772f207129229ea63df7f2e8ff82e',
  imports: [],
} as const satisfies ApplicationProofDependencyRecordV1

const RUNTIME_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g2-length-generator-runtime',
  dependencyVersion: 1,
  kind: 'infrastructure',
  sourceModule: 'src/lib/application-problems/generator.ts',
  digest: 'sha256:15a93ff5976be59d2602b615401979e2062161784beff4678ba9f27c1680f284',
  imports: [],
} as const satisfies ApplicationProofDependencyRecordV1

const SHARED_GENERATOR_IMPORTS = [
  {
    dependencyId: SCENE_DEPENDENCY.dependencyId,
    dependencyVersion: SCENE_DEPENDENCY.dependencyVersion,
    digest: SCENE_DEPENDENCY.digest,
  },
  {
    dependencyId: RUNTIME_DEPENDENCY.dependencyId,
    dependencyVersion: RUNTIME_DEPENDENCY.dependencyVersion,
    digest: RUNTIME_DEPENDENCY.digest,
  },
] as const

const ROUTE_GENERATOR_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g2-length-route-total-generator-logic',
  dependencyVersion: 1,
  kind: 'answer-logic',
  sourceModule: 'src/lib/application-problems/families/g2-length-route-total.ts',
  digest: 'sha256:7042fda5bc254b016e828f58d83559f2f86c2868990202a1c9d4abcda553070b',
  imports: SHARED_GENERATOR_IMPORTS,
} as const satisfies ApplicationProofDependencyRecordV1

const ROUTE_ORACLE_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g2-length-route-total-oracle-logic',
  dependencyVersion: 1,
  kind: 'answer-logic',
  sourceModule: 'src/lib/application-problems/families/g2-length-route-total.oracle.ts',
  digest: 'sha256:9c527ceebd1411489a56083597e3a935b659157c94972ae988efe41d932cfd23',
  imports: [],
} as const satisfies ApplicationProofDependencyRecordV1

const MISSING_GENERATOR_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g2-length-missing-segment-generator-logic',
  dependencyVersion: 1,
  kind: 'answer-logic',
  sourceModule: 'src/lib/application-problems/families/g2-length-missing-segment.ts',
  digest: 'sha256:190a39a68a4a2789c13976625ec0b5a09e14d0d4447fd262625ec52fcede03b5',
  imports: SHARED_GENERATOR_IMPORTS,
} as const satisfies ApplicationProofDependencyRecordV1

const MISSING_ORACLE_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g2-length-missing-segment-oracle-logic',
  dependencyVersion: 1,
  kind: 'answer-logic',
  sourceModule: 'src/lib/application-problems/families/g2-length-missing-segment.oracle.ts',
  digest: 'sha256:ae6e0382c4c03b4ecd350bf4c40cb65d454d8c958dfeadb3c93dcef2624a7261',
  imports: [],
} as const satisfies ApplicationProofDependencyRecordV1

const CLAIM_GENERATOR_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g2-length-claim-check-generator-logic',
  dependencyVersion: 1,
  kind: 'answer-logic',
  sourceModule: 'src/lib/application-problems/families/g2-length-claim-check.ts',
  digest: 'sha256:ba97bb0af5c8afe3ef000c0329670ac3ca668df2d791a8e4c3b47a6534838cb7',
  imports: SHARED_GENERATOR_IMPORTS,
} as const satisfies ApplicationProofDependencyRecordV1

const CLAIM_ORACLE_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g2-length-claim-check-oracle-logic',
  dependencyVersion: 1,
  kind: 'answer-logic',
  sourceModule: 'src/lib/application-problems/families/g2-length-claim-check.oracle.ts',
  digest: 'sha256:1066e8e40e5cc2999ab03466acd880962e72818b9c9d9c6e7cfb0e464f2b2058',
  imports: [],
} as const satisfies ApplicationProofDependencyRecordV1

export const G2_LENGTH_PROOF_DEPENDENCIES: readonly ApplicationProofDependencyRecordV1[] = [
  SCENE_DEPENDENCY,
  RUNTIME_DEPENDENCY,
  ROUTE_GENERATOR_DEPENDENCY,
  ROUTE_ORACLE_DEPENDENCY,
  MISSING_GENERATOR_DEPENDENCY,
  MISSING_ORACLE_DEPENDENCY,
  CLAIM_GENERATOR_DEPENDENCY,
  CLAIM_ORACLE_DEPENDENCY,
]

function implementationRef(
  implementationId: string,
  sourceDigest: string,
): ApplicationProofPinnedImplementationRefV1 {
  return { implementationId, implementationVersion: 1, sourceDigest }
}

const ROUTE_GENERATOR_REF = implementationRef(
  'g2-length-route-total-generator',
  ROUTE_GENERATOR_DEPENDENCY.digest,
)
const ROUTE_ORACLE_REF = implementationRef(
  'g2-length-route-total-independent-oracle',
  ROUTE_ORACLE_DEPENDENCY.digest,
)
const MISSING_GENERATOR_REF = implementationRef(
  'g2-length-missing-segment-generator',
  MISSING_GENERATOR_DEPENDENCY.digest,
)
const MISSING_ORACLE_REF = implementationRef(
  'g2-length-missing-segment-independent-oracle',
  MISSING_ORACLE_DEPENDENCY.digest,
)
const CLAIM_GENERATOR_REF = implementationRef(
  'g2-length-claim-check-generator',
  CLAIM_GENERATOR_DEPENDENCY.digest,
)
const CLAIM_ORACLE_REF = implementationRef(
  'g2-length-claim-check-independent-oracle',
  CLAIM_ORACLE_DEPENDENCY.digest,
)

function rootOf(dependency: ApplicationProofDependencyRecordV1) {
  return {
    dependencyId: dependency.dependencyId,
    dependencyVersion: dependency.dependencyVersion,
    digest: dependency.digest,
  }
}

export const G2_LENGTH_PROOF_IMPLEMENTATIONS: readonly ApplicationProofImplementationRegistrationV1[] = [
  {
    schemaVersion: 'application-proof-implementation-v1',
    kind: 'generator',
    ...ROUTE_GENERATOR_REF,
    sourceModule: ROUTE_GENERATOR_DEPENDENCY.sourceModule,
    evidenceRefs: EVIDENCE,
    rootDependency: rootOf(ROUTE_GENERATOR_DEPENDENCY),
    execute: generateG2LengthRouteTotal,
  },
  {
    schemaVersion: 'application-proof-implementation-v1',
    kind: 'oracle',
    ...ROUTE_ORACLE_REF,
    sourceModule: ROUTE_ORACLE_DEPENDENCY.sourceModule,
    evidenceRefs: EVIDENCE,
    rootDependency: rootOf(ROUTE_ORACLE_DEPENDENCY),
    execute: evaluateG2LengthRouteTotalOracle,
  },
  {
    schemaVersion: 'application-proof-implementation-v1',
    kind: 'generator',
    ...MISSING_GENERATOR_REF,
    sourceModule: MISSING_GENERATOR_DEPENDENCY.sourceModule,
    evidenceRefs: EVIDENCE,
    rootDependency: rootOf(MISSING_GENERATOR_DEPENDENCY),
    execute: generateG2LengthMissingSegment,
  },
  {
    schemaVersion: 'application-proof-implementation-v1',
    kind: 'oracle',
    ...MISSING_ORACLE_REF,
    sourceModule: MISSING_ORACLE_DEPENDENCY.sourceModule,
    evidenceRefs: EVIDENCE,
    rootDependency: rootOf(MISSING_ORACLE_DEPENDENCY),
    execute: evaluateG2LengthMissingSegmentOracle,
  },
  {
    schemaVersion: 'application-proof-implementation-v1',
    kind: 'generator',
    ...CLAIM_GENERATOR_REF,
    sourceModule: CLAIM_GENERATOR_DEPENDENCY.sourceModule,
    evidenceRefs: EVIDENCE,
    rootDependency: rootOf(CLAIM_GENERATOR_DEPENDENCY),
    execute: generateG2LengthClaimCheck,
  },
  {
    schemaVersion: 'application-proof-implementation-v1',
    kind: 'oracle',
    ...CLAIM_ORACLE_REF,
    sourceModule: CLAIM_ORACLE_DEPENDENCY.sourceModule,
    evidenceRefs: EVIDENCE,
    rootDependency: rootOf(CLAIM_ORACLE_DEPENDENCY),
    execute: evaluateG2LengthClaimCheckOracle,
  },
]

function authorityDomain(caseId: string, count: number) {
  return Array.from({ length: count }, (_, variantIndex) => ({ caseId, seed: 0, variantIndex }))
}

const ROUTE_DOMAIN = authorityDomain('route-total-domain', G2_LENGTH_ROUTE_TOTAL_CASES.length)
const MISSING_DOMAIN = authorityDomain(
  'missing-segment-domain',
  G2_LENGTH_MISSING_SEGMENT_CASES.length,
)
const CLAIM_DOMAIN = authorityDomain('claim-check-domain', G2_LENGTH_CLAIM_CHECK_CASES.length)

export const G2_LENGTH_PROOF_AUTHORITY_ENTRIES = [
  {
    schemaVersion: 'application-proof-authority-entry-v1',
    familyId: G2_LENGTH_ROUTE_TOTAL_FAMILY.familyId,
    familyVersion: 1,
    mode: 'exhaustive',
    manifest: {
      schemaVersion: 'application-proof-authority-manifest-v1',
      authorityId: 'g2-length-route-total-exhaustive-authority',
      authorityVersion: 1,
      familyId: G2_LENGTH_ROUTE_TOTAL_FAMILY.familyId,
      familyVersion: 1,
      mode: 'exhaustive',
      expectedCount: 18,
      domainDigest: 'sha256:76bc4a215a90a1a855e3df8eabd6b5a390789cdafbcfb3008b351b944477a13e',
      sourceModule: 'src/lib/application-problems/families/g2-length-route-total.ts',
      sourceDigest: 'sha256:7042fda5bc254b016e828f58d83559f2f86c2868990202a1c9d4abcda553070b',
      generatorRef: ROUTE_GENERATOR_REF,
      oracleRef: ROUTE_ORACLE_REF,
      allowedSharedInfrastructure: [],
      ...REVIEW,
    },
    domain: ROUTE_DOMAIN,
  },
  {
    schemaVersion: 'application-proof-authority-entry-v1',
    familyId: G2_LENGTH_MISSING_SEGMENT_FAMILY.familyId,
    familyVersion: 1,
    mode: 'exhaustive',
    manifest: {
      schemaVersion: 'application-proof-authority-manifest-v1',
      authorityId: 'g2-length-missing-segment-exhaustive-authority',
      authorityVersion: 1,
      familyId: G2_LENGTH_MISSING_SEGMENT_FAMILY.familyId,
      familyVersion: 1,
      mode: 'exhaustive',
      expectedCount: 54,
      domainDigest: 'sha256:2dac928fe2eed252d4baa500ea457edcf717663290db5a4c6a14bc1cb520d7cf',
      sourceModule: 'src/lib/application-problems/families/g2-length-missing-segment.ts',
      sourceDigest: 'sha256:190a39a68a4a2789c13976625ec0b5a09e14d0d4447fd262625ec52fcede03b5',
      generatorRef: MISSING_GENERATOR_REF,
      oracleRef: MISSING_ORACLE_REF,
      allowedSharedInfrastructure: [],
      ...REVIEW,
    },
    domain: MISSING_DOMAIN,
  },
  {
    schemaVersion: 'application-proof-authority-entry-v1',
    familyId: G2_LENGTH_CLAIM_CHECK_FAMILY.familyId,
    familyVersion: 1,
    mode: 'exhaustive',
    manifest: {
      schemaVersion: 'application-proof-authority-manifest-v1',
      authorityId: 'g2-length-claim-check-exhaustive-authority',
      authorityVersion: 1,
      familyId: G2_LENGTH_CLAIM_CHECK_FAMILY.familyId,
      familyVersion: 1,
      mode: 'exhaustive',
      expectedCount: 32,
      domainDigest: 'sha256:2553685bbfe5c1b0c9ff30bb6e45e10ae2bdc1f553a5c20c0657e98d47ecf17b',
      sourceModule: 'src/lib/application-problems/families/g2-length-claim-check.ts',
      sourceDigest: 'sha256:ba97bb0af5c8afe3ef000c0329670ac3ca668df2d791a8e4c3b47a6534838cb7',
      generatorRef: CLAIM_GENERATOR_REF,
      oracleRef: CLAIM_ORACLE_REF,
      allowedSharedInfrastructure: [],
      ...REVIEW,
    },
    domain: CLAIM_DOMAIN,
  },
] as const satisfies readonly ApplicationProofAuthorityEntryV1[]

export const G2_LENGTH_EXHAUSTIVE_PROOFS = [
  {
    mode: 'exhaustive',
    family: G2_LENGTH_ROUTE_TOTAL_FAMILY,
    domain: {
      kind: 'finite-complete',
      cases: [{ caseId: 'route-total-domain', seed: 0 }],
      variantIndexes: G2_LENGTH_ROUTE_TOTAL_CASES.map((_, index) => index),
    },
    generator: { generate: generateG2LengthRouteTotal },
    oracle: { evaluate: evaluateG2LengthRouteTotalOracle },
  },
  {
    mode: 'exhaustive',
    family: G2_LENGTH_MISSING_SEGMENT_FAMILY,
    domain: {
      kind: 'finite-complete',
      cases: [{ caseId: 'missing-segment-domain', seed: 0 }],
      variantIndexes: G2_LENGTH_MISSING_SEGMENT_CASES.map((_, index) => index),
    },
    generator: { generate: generateG2LengthMissingSegment },
    oracle: { evaluate: evaluateG2LengthMissingSegmentOracle },
  },
  {
    mode: 'exhaustive',
    family: G2_LENGTH_CLAIM_CHECK_FAMILY,
    domain: {
      kind: 'finite-complete',
      cases: [{ caseId: 'claim-check-domain', seed: 0 }],
      variantIndexes: G2_LENGTH_CLAIM_CHECK_CASES.map((_, index) => index),
    },
    generator: { generate: generateG2LengthClaimCheck },
    oracle: { evaluate: evaluateG2LengthClaimCheckOracle },
  },
] as const satisfies readonly ExhaustiveApplicationProofV1[]
