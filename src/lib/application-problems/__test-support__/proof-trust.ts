import { runApplicationProblemProofEngineV1Internal } from '../proof-engine.internal'
import type {
  ApplicationProofReportV1,
  ApplicationProblemProofV1,
} from '../proof'
import {
  buildApplicationProofAuthorityRegistryV1Internal,
  buildApplicationProofImplementationRegistryV1Internal,
  type ApplicationProofAuthorityEntryV1,
  type ApplicationProofAuthorityRegistryV1,
  type ApplicationProofDependencyRecordV1,
  type ApplicationProofImplementationRegistrationV1,
  type ApplicationProofImplementationRegistryV1,
} from '../proof-trust.internal'

export function createTestApplicationProofAuthorityRegistryV1(
  entries: readonly ApplicationProofAuthorityEntryV1[],
): ApplicationProofAuthorityRegistryV1 {
  return buildApplicationProofAuthorityRegistryV1Internal(entries)
}

export function createTestApplicationProofImplementationRegistryV1(
  input: {
    dependencies: readonly ApplicationProofDependencyRecordV1[]
    implementations: readonly ApplicationProofImplementationRegistrationV1[]
  },
): ApplicationProofImplementationRegistryV1 {
  return buildApplicationProofImplementationRegistryV1Internal(input)
}

export function runTestApplicationProblemProofEngineV1(
  input: ApplicationProblemProofV1,
  authorityRegistry: ApplicationProofAuthorityRegistryV1,
  implementationRegistry?: ApplicationProofImplementationRegistryV1,
): ApplicationProofReportV1 {
  return runApplicationProblemProofEngineV1Internal(
    input,
    authorityRegistry,
    implementationRegistry,
  )
}
