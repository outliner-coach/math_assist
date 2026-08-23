import {
  buildApplicationProofAuthorityRegistryV1Internal,
  buildApplicationProofImplementationRegistryV1Internal,
  type ApplicationProofAuthorityEntryV1,
  type ApplicationProofDependencyRecordV1,
  type ApplicationProofImplementationRegistrationV1,
} from './proof-trust.internal'

const AUTHORITY_RECORDS: readonly ApplicationProofAuthorityEntryV1[] = Object.freeze([])

export const APPLICATION_PROOF_AUTHORITY_REGISTRY_V1 =
  buildApplicationProofAuthorityRegistryV1Internal(AUTHORITY_RECORDS)

const DEPENDENCY_RECORDS: readonly ApplicationProofDependencyRecordV1[] = Object.freeze([])
const IMPLEMENTATION_RECORDS: readonly ApplicationProofImplementationRegistrationV1[] =
  Object.freeze([])

export const APPLICATION_PROOF_IMPLEMENTATION_REGISTRY_V1 =
  buildApplicationProofImplementationRegistryV1Internal({
    dependencies: DEPENDENCY_RECORDS,
    implementations: IMPLEMENTATION_RECORDS,
  })
