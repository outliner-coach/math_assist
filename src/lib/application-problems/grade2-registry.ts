import {
  G2_LENGTH_CLAIM_CHECK_FAMILY,
  G2_LENGTH_CLAIM_CHECK_GENERATOR,
} from './families/g2-length-claim-check'
import {
  G2_LENGTH_MISSING_SEGMENT_FAMILY,
  G2_LENGTH_MISSING_SEGMENT_GENERATOR,
} from './families/g2-length-missing-segment'
import {
  G2_LENGTH_ROUTE_TOTAL_FAMILY,
  G2_LENGTH_ROUTE_TOTAL_GENERATOR,
} from './families/g2-length-route-total'
import {
  createImmutableReleaseFamilySnapshot,
  deterministicRegistryEntry,
  type ApplicationProblemRegistryV1,
} from './registry'

export const GRADE2_APPLICATION_PROBLEM_REGISTRY_V1: ApplicationProblemRegistryV1 =
  Object.freeze({
    entries: Object.freeze([
      deterministicRegistryEntry(G2_LENGTH_ROUTE_TOTAL_FAMILY, G2_LENGTH_ROUTE_TOTAL_GENERATOR),
      deterministicRegistryEntry(
        G2_LENGTH_MISSING_SEGMENT_FAMILY,
        G2_LENGTH_MISSING_SEGMENT_GENERATOR,
      ),
      deterministicRegistryEntry(G2_LENGTH_CLAIM_CHECK_FAMILY, G2_LENGTH_CLAIM_CHECK_GENERATOR),
    ]),
    releaseLedger: Object.freeze([
      G2_LENGTH_ROUTE_TOTAL_FAMILY,
      G2_LENGTH_MISSING_SEGMENT_FAMILY,
      G2_LENGTH_CLAIM_CHECK_FAMILY,
    ].map(createImmutableReleaseFamilySnapshot)),
  })
