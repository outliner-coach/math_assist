import {
  runApplicationProblemProofEngineV1Internal,
  type ApplicationProblemProofV1,
  type ApplicationProofReportV1,
} from './proof-engine.internal'
import {
  APPLICATION_PROOF_AUTHORITY_REGISTRY_V1,
  APPLICATION_PROOF_IMPLEMENTATION_REGISTRY_V1,
} from './proof-trust-catalog'

export {
  APPLICATION_PROOF_ERROR_CODES,
  createApplicationProofManifestDigest,
} from './proof-engine.internal'
export type {
  ApplicationProblemProofV1,
  ApplicationProofAuthorityEntryV1,
  ApplicationProofAuthorityRefV1,
  ApplicationProofAuthorityRegistryV1,
  ApplicationProofErrorCode,
  ApplicationProofGeneratorV1,
  ApplicationProofImplementationRefV1,
  ApplicationProofIssueV1,
  ApplicationProofOracleInputV1,
  ApplicationProofOracleV1,
  ApplicationProofReportV1,
  ExhaustiveApplicationProofV1,
  ExhaustiveProofCaseV1,
  InvariantBoundaryApplicationProofV1,
  InvariantBoundaryProofCaseV1,
  StaticCorpusApplicationProofV1,
  StaticCorpusEntryV1,
  StaticCorpusReviewV1,
} from './proof-engine.internal'

export function runApplicationProblemProof(
  input: ApplicationProblemProofV1,
): ApplicationProofReportV1 {
  return runApplicationProblemProofEngineV1Internal(
    input,
    APPLICATION_PROOF_AUTHORITY_REGISTRY_V1,
    APPLICATION_PROOF_IMPLEMENTATION_REGISTRY_V1,
  )
}
