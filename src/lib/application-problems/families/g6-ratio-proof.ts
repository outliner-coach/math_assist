import type { ExhaustiveApplicationProofV1 } from '../proof'
import type {
  ApplicationProofAuthorityEntryV1,
  ApplicationProofDependencyRecordV1,
  ApplicationProofImplementationRegistrationV1,
} from '../proof-trust.internal'
import {
  G6_RATIO_PART_WHOLE_FAMILY,
  G6_RATIO_PART_WHOLE_PROOF_DOMAIN,
  generateG6RatioPartWhole,
} from './g6-ratio-part-whole'
import {
  G6_RATIO_RELATIVE_COMPARISON_FAMILY,
  G6_RATIO_RELATIVE_COMPARISON_PROOF_DOMAIN,
  generateG6RatioRelativeComparison,
} from './g6-ratio-relative-comparison'
import {
  G6_RATIO_REPRESENTATION_CHECK_FAMILY,
  G6_RATIO_REPRESENTATION_CHECK_PROOF_DOMAIN,
  generateG6RatioRepresentationCheck,
} from './g6-ratio-representation-check'
import {
  evaluateG6RatioPartWholeOracle,
  evaluateG6RatioRelativeComparisonOracle,
  evaluateG6RatioRepresentationCheckOracle,
} from './g6-ratio-oracle'

const PROOF_EVIDENCE = [
  'src/lib/application-problems/families/g6-ratio.test.ts',
  'src/lib/application-problems/families/g6-ratio-proof.test.ts',
] as const
const PROOF_REVIEW = {
  reviewedBy: 'automated-exhaustive-proof-suite',
  reviewedAt: '2026-07-22T00:00:00.000Z',
  evidenceRefs: PROOF_EVIDENCE,
}

const PART_WHOLE_GENERATOR_DIGEST =
  'sha256:6fee54f1f033b9f777efd04f257c96151533146bb0eb009223beefc5ca0853d5'
const COMPARISON_GENERATOR_DIGEST =
  'sha256:e96de262317cf8fc48e525deaba349f2952c67a029f4cf30a77becaa3dae4143'
const REPRESENTATION_GENERATOR_DIGEST =
  'sha256:7e7cc1ccd744dfd8d78db38b57d56aa1f75ab44212f8c32a7bbb09aa9f7b95af'
const ORACLE_SOURCE_DIGEST =
  'sha256:8e0c767128b63af7ba5738f6bc8ee1b20dffcdb951cb133cad14904330fa5427'
const GENERATOR_COMMON_DIGEST =
  'sha256:ced4810a60f452b8500a9f9c3a72a5c2dd3fac39aef9e50fb3ceeb538a3a96e8'

const GENERATOR_COMMON_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g6-ratio-generator-common-logic',
  dependencyVersion: 1,
  kind: 'answer-logic',
  sourceModule: 'src/lib/application-problems/families/g6-ratio-common.ts',
  digest: GENERATOR_COMMON_DIGEST,
  imports: [],
} as const satisfies ApplicationProofDependencyRecordV1

const PART_WHOLE_GENERATOR_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g6-ratio-part-whole-generator-logic',
  dependencyVersion: 1,
  kind: 'answer-logic',
  sourceModule: 'src/lib/application-problems/families/g6-ratio-part-whole.ts',
  digest: PART_WHOLE_GENERATOR_DIGEST,
  imports: [
    {
      dependencyId: GENERATOR_COMMON_DEPENDENCY.dependencyId,
      dependencyVersion: 1,
      digest: GENERATOR_COMMON_DEPENDENCY.digest,
    },
  ],
} as const satisfies ApplicationProofDependencyRecordV1

const COMPARISON_GENERATOR_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g6-ratio-relative-comparison-generator-logic',
  dependencyVersion: 1,
  kind: 'answer-logic',
  sourceModule: 'src/lib/application-problems/families/g6-ratio-relative-comparison.ts',
  digest: COMPARISON_GENERATOR_DIGEST,
  imports: [
    {
      dependencyId: GENERATOR_COMMON_DEPENDENCY.dependencyId,
      dependencyVersion: 1,
      digest: GENERATOR_COMMON_DEPENDENCY.digest,
    },
  ],
} as const satisfies ApplicationProofDependencyRecordV1

const REPRESENTATION_GENERATOR_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g6-ratio-representation-check-generator-logic',
  dependencyVersion: 1,
  kind: 'answer-logic',
  sourceModule: 'src/lib/application-problems/families/g6-ratio-representation-check.ts',
  digest: REPRESENTATION_GENERATOR_DIGEST,
  imports: [
    {
      dependencyId: GENERATOR_COMMON_DEPENDENCY.dependencyId,
      dependencyVersion: 1,
      digest: GENERATOR_COMMON_DEPENDENCY.digest,
    },
  ],
} as const satisfies ApplicationProofDependencyRecordV1

const RATIO_ORACLE_DEPENDENCY = {
  schemaVersion: 'application-proof-dependency-v1',
  dependencyId: 'g6-ratio-bigint-oracle-logic',
  dependencyVersion: 1,
  kind: 'answer-logic',
  sourceModule: 'src/lib/application-problems/families/g6-ratio-oracle.ts',
  digest: ORACLE_SOURCE_DIGEST,
  imports: [],
} as const satisfies ApplicationProofDependencyRecordV1

export const G6_RATIO_PROOF_DEPENDENCIES: readonly ApplicationProofDependencyRecordV1[] =
  Object.freeze([
    GENERATOR_COMMON_DEPENDENCY,
    PART_WHOLE_GENERATOR_DEPENDENCY,
    COMPARISON_GENERATOR_DEPENDENCY,
    REPRESENTATION_GENERATOR_DEPENDENCY,
    RATIO_ORACLE_DEPENDENCY,
  ])

const PART_WHOLE_GENERATOR_REGISTRATION = {
  schemaVersion: 'application-proof-implementation-v1',
  kind: 'generator',
  implementationId: 'g6-ratio-part-whole-generator',
  implementationVersion: 1,
  sourceModule: PART_WHOLE_GENERATOR_DEPENDENCY.sourceModule,
  sourceDigest: PART_WHOLE_GENERATOR_DIGEST,
  evidenceRefs: PROOF_EVIDENCE,
  rootDependency: {
    dependencyId: PART_WHOLE_GENERATOR_DEPENDENCY.dependencyId,
    dependencyVersion: 1,
    digest: PART_WHOLE_GENERATOR_DEPENDENCY.digest,
  },
  execute: generateG6RatioPartWhole,
} as const satisfies ApplicationProofImplementationRegistrationV1

const COMPARISON_GENERATOR_REGISTRATION = {
  schemaVersion: 'application-proof-implementation-v1',
  kind: 'generator',
  implementationId: 'g6-ratio-relative-comparison-generator',
  implementationVersion: 1,
  sourceModule: COMPARISON_GENERATOR_DEPENDENCY.sourceModule,
  sourceDigest: COMPARISON_GENERATOR_DIGEST,
  evidenceRefs: PROOF_EVIDENCE,
  rootDependency: {
    dependencyId: COMPARISON_GENERATOR_DEPENDENCY.dependencyId,
    dependencyVersion: 1,
    digest: COMPARISON_GENERATOR_DEPENDENCY.digest,
  },
  execute: generateG6RatioRelativeComparison,
} as const satisfies ApplicationProofImplementationRegistrationV1

const REPRESENTATION_GENERATOR_REGISTRATION = {
  schemaVersion: 'application-proof-implementation-v1',
  kind: 'generator',
  implementationId: 'g6-ratio-representation-check-generator',
  implementationVersion: 1,
  sourceModule: REPRESENTATION_GENERATOR_DEPENDENCY.sourceModule,
  sourceDigest: REPRESENTATION_GENERATOR_DIGEST,
  evidenceRefs: PROOF_EVIDENCE,
  rootDependency: {
    dependencyId: REPRESENTATION_GENERATOR_DEPENDENCY.dependencyId,
    dependencyVersion: 1,
    digest: REPRESENTATION_GENERATOR_DEPENDENCY.digest,
  },
  execute: generateG6RatioRepresentationCheck,
} as const satisfies ApplicationProofImplementationRegistrationV1

const PART_WHOLE_ORACLE_REGISTRATION = {
  schemaVersion: 'application-proof-implementation-v1',
  kind: 'oracle',
  implementationId: 'g6-ratio-part-whole-bigint-oracle',
  implementationVersion: 1,
  sourceModule: RATIO_ORACLE_DEPENDENCY.sourceModule,
  sourceDigest: ORACLE_SOURCE_DIGEST,
  evidenceRefs: PROOF_EVIDENCE,
  rootDependency: {
    dependencyId: RATIO_ORACLE_DEPENDENCY.dependencyId,
    dependencyVersion: 1,
    digest: RATIO_ORACLE_DEPENDENCY.digest,
  },
  execute: evaluateG6RatioPartWholeOracle,
} as const satisfies ApplicationProofImplementationRegistrationV1

const COMPARISON_ORACLE_REGISTRATION = {
  schemaVersion: 'application-proof-implementation-v1',
  kind: 'oracle',
  implementationId: 'g6-ratio-relative-comparison-bigint-oracle',
  implementationVersion: 1,
  sourceModule: RATIO_ORACLE_DEPENDENCY.sourceModule,
  sourceDigest: ORACLE_SOURCE_DIGEST,
  evidenceRefs: PROOF_EVIDENCE,
  rootDependency: {
    dependencyId: RATIO_ORACLE_DEPENDENCY.dependencyId,
    dependencyVersion: 1,
    digest: RATIO_ORACLE_DEPENDENCY.digest,
  },
  execute: evaluateG6RatioRelativeComparisonOracle,
} as const satisfies ApplicationProofImplementationRegistrationV1

const REPRESENTATION_ORACLE_REGISTRATION = {
  schemaVersion: 'application-proof-implementation-v1',
  kind: 'oracle',
  implementationId: 'g6-ratio-representation-check-bigint-oracle',
  implementationVersion: 1,
  sourceModule: RATIO_ORACLE_DEPENDENCY.sourceModule,
  sourceDigest: ORACLE_SOURCE_DIGEST,
  evidenceRefs: PROOF_EVIDENCE,
  rootDependency: {
    dependencyId: RATIO_ORACLE_DEPENDENCY.dependencyId,
    dependencyVersion: 1,
    digest: RATIO_ORACLE_DEPENDENCY.digest,
  },
  execute: evaluateG6RatioRepresentationCheckOracle,
} as const satisfies ApplicationProofImplementationRegistrationV1

export const G6_RATIO_PROOF_IMPLEMENTATIONS: readonly ApplicationProofImplementationRegistrationV1[] =
  Object.freeze([
    PART_WHOLE_GENERATOR_REGISTRATION,
    COMPARISON_GENERATOR_REGISTRATION,
    REPRESENTATION_GENERATOR_REGISTRATION,
    PART_WHOLE_ORACLE_REGISTRATION,
    COMPARISON_ORACLE_REGISTRATION,
    REPRESENTATION_ORACLE_REGISTRATION,
  ])

export const G6_RATIO_PART_WHOLE_PROOF_AUTHORITY = {
  schemaVersion: 'application-proof-authority-entry-v1',
  familyId: G6_RATIO_PART_WHOLE_FAMILY.familyId,
  familyVersion: 1,
  mode: 'exhaustive',
  manifest: {
    schemaVersion: 'application-proof-authority-manifest-v1',
    authorityId: 'g6-ratio-part-whole-exhaustive-authority',
    authorityVersion: 1,
    familyId: G6_RATIO_PART_WHOLE_FAMILY.familyId,
    familyVersion: 1,
    mode: 'exhaustive',
    expectedCount: 144,
    domainDigest: 'sha256:e4e5c14a0c29b4f72efe1429a71fca1f7a38a05d29d893e2fae50e06e89d53b3',
    sourceModule: PART_WHOLE_GENERATOR_DEPENDENCY.sourceModule,
    sourceDigest: PART_WHOLE_GENERATOR_DIGEST,
    generatorRef: {
      implementationId: PART_WHOLE_GENERATOR_REGISTRATION.implementationId,
      implementationVersion: 1,
      sourceDigest: PART_WHOLE_GENERATOR_DIGEST,
    },
    oracleRef: {
      implementationId: PART_WHOLE_ORACLE_REGISTRATION.implementationId,
      implementationVersion: 1,
      sourceDigest: ORACLE_SOURCE_DIGEST,
    },
    allowedSharedInfrastructure: [],
    ...PROOF_REVIEW,
  },
  domain: G6_RATIO_PART_WHOLE_PROOF_DOMAIN,
} as const satisfies ApplicationProofAuthorityEntryV1

export const G6_RATIO_RELATIVE_COMPARISON_PROOF_AUTHORITY = {
  schemaVersion: 'application-proof-authority-entry-v1',
  familyId: G6_RATIO_RELATIVE_COMPARISON_FAMILY.familyId,
  familyVersion: 1,
  mode: 'exhaustive',
  manifest: {
    schemaVersion: 'application-proof-authority-manifest-v1',
    authorityId: 'g6-ratio-relative-comparison-exhaustive-authority',
    authorityVersion: 1,
    familyId: G6_RATIO_RELATIVE_COMPARISON_FAMILY.familyId,
    familyVersion: 1,
    mode: 'exhaustive',
    expectedCount: 110,
    domainDigest: 'sha256:deaca409ac5eb8ed208a0e1be76acb0df3c3c38eb52c9c8ad4c960f5b11f2b64',
    sourceModule: COMPARISON_GENERATOR_DEPENDENCY.sourceModule,
    sourceDigest: COMPARISON_GENERATOR_DIGEST,
    generatorRef: {
      implementationId: COMPARISON_GENERATOR_REGISTRATION.implementationId,
      implementationVersion: 1,
      sourceDigest: COMPARISON_GENERATOR_DIGEST,
    },
    oracleRef: {
      implementationId: COMPARISON_ORACLE_REGISTRATION.implementationId,
      implementationVersion: 1,
      sourceDigest: ORACLE_SOURCE_DIGEST,
    },
    allowedSharedInfrastructure: [],
    ...PROOF_REVIEW,
  },
  domain: G6_RATIO_RELATIVE_COMPARISON_PROOF_DOMAIN,
} as const satisfies ApplicationProofAuthorityEntryV1

export const G6_RATIO_REPRESENTATION_CHECK_PROOF_AUTHORITY = {
  schemaVersion: 'application-proof-authority-entry-v1',
  familyId: G6_RATIO_REPRESENTATION_CHECK_FAMILY.familyId,
  familyVersion: 1,
  mode: 'exhaustive',
  manifest: {
    schemaVersion: 'application-proof-authority-manifest-v1',
    authorityId: 'g6-ratio-representation-check-exhaustive-authority',
    authorityVersion: 1,
    familyId: G6_RATIO_REPRESENTATION_CHECK_FAMILY.familyId,
    familyVersion: 1,
    mode: 'exhaustive',
    expectedCount: 45,
    domainDigest: 'sha256:7b2d7a78eda384d978c146e94cb9f11e2c433ba0f3b454c547cb3d9eb0a9c5fc',
    sourceModule: REPRESENTATION_GENERATOR_DEPENDENCY.sourceModule,
    sourceDigest: REPRESENTATION_GENERATOR_DIGEST,
    generatorRef: {
      implementationId: REPRESENTATION_GENERATOR_REGISTRATION.implementationId,
      implementationVersion: 1,
      sourceDigest: REPRESENTATION_GENERATOR_DIGEST,
    },
    oracleRef: {
      implementationId: REPRESENTATION_ORACLE_REGISTRATION.implementationId,
      implementationVersion: 1,
      sourceDigest: ORACLE_SOURCE_DIGEST,
    },
    allowedSharedInfrastructure: [],
    ...PROOF_REVIEW,
  },
  domain: G6_RATIO_REPRESENTATION_CHECK_PROOF_DOMAIN,
} as const satisfies ApplicationProofAuthorityEntryV1

export const G6_RATIO_PROOF_AUTHORITIES: readonly ApplicationProofAuthorityEntryV1[] =
  Object.freeze([
    G6_RATIO_PART_WHOLE_PROOF_AUTHORITY,
    G6_RATIO_RELATIVE_COMPARISON_PROOF_AUTHORITY,
    G6_RATIO_REPRESENTATION_CHECK_PROOF_AUTHORITY,
  ])

export const G6_RATIO_PART_WHOLE_PROOF: ExhaustiveApplicationProofV1 = {
  mode: 'exhaustive',
  family: G6_RATIO_PART_WHOLE_FAMILY,
  domain: {
    kind: 'finite-complete',
    cases: G6_RATIO_PART_WHOLE_PROOF_DOMAIN.map(({ caseId, seed }) => ({ caseId, seed })),
    variantIndexes: [0],
  },
  generator: { generate: generateG6RatioPartWhole },
  oracle: { evaluate: evaluateG6RatioPartWholeOracle },
}

export const G6_RATIO_RELATIVE_COMPARISON_PROOF: ExhaustiveApplicationProofV1 = {
  mode: 'exhaustive',
  family: G6_RATIO_RELATIVE_COMPARISON_FAMILY,
  domain: {
    kind: 'finite-complete',
    cases: G6_RATIO_RELATIVE_COMPARISON_PROOF_DOMAIN.map(({ caseId, seed }) => ({ caseId, seed })),
    variantIndexes: [0],
  },
  generator: { generate: generateG6RatioRelativeComparison },
  oracle: { evaluate: evaluateG6RatioRelativeComparisonOracle },
}

export const G6_RATIO_REPRESENTATION_CHECK_PROOF: ExhaustiveApplicationProofV1 = {
  mode: 'exhaustive',
  family: G6_RATIO_REPRESENTATION_CHECK_FAMILY,
  domain: {
    kind: 'finite-complete',
    cases: G6_RATIO_REPRESENTATION_CHECK_PROOF_DOMAIN.map(({ caseId, seed }) => ({ caseId, seed })),
    variantIndexes: [0],
  },
  generator: { generate: generateG6RatioRepresentationCheck },
  oracle: { evaluate: evaluateG6RatioRepresentationCheckOracle },
}

export const G6_RATIO_PROOFS: readonly ExhaustiveApplicationProofV1[] = Object.freeze([
  G6_RATIO_PART_WHOLE_PROOF,
  G6_RATIO_RELATIVE_COMPARISON_PROOF,
  G6_RATIO_REPRESENTATION_CHECK_PROOF,
])
