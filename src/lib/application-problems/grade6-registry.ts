import {
  G6_RATIO_PART_WHOLE_FAMILY,
  G6_RATIO_PART_WHOLE_GENERATOR,
  G6_RATIO_RELATIVE_COMPARISON_FAMILY,
  G6_RATIO_RELATIVE_COMPARISON_GENERATOR,
  G6_RATIO_REPRESENTATION_CHECK_FAMILY,
  G6_RATIO_REPRESENTATION_CHECK_GENERATOR,
} from './families/g6-ratio'
import {
  createImmutableReleaseFamilySnapshot,
  deterministicRegistryEntry,
  type ApplicationProblemRegistryV1,
} from './registry'

export const GRADE6_APPLICATION_PROBLEM_REGISTRY_V1: ApplicationProblemRegistryV1 =
  Object.freeze({
    entries: Object.freeze([
      deterministicRegistryEntry(G6_RATIO_PART_WHOLE_FAMILY, G6_RATIO_PART_WHOLE_GENERATOR),
      deterministicRegistryEntry(
        G6_RATIO_RELATIVE_COMPARISON_FAMILY,
        G6_RATIO_RELATIVE_COMPARISON_GENERATOR,
      ),
      deterministicRegistryEntry(
        G6_RATIO_REPRESENTATION_CHECK_FAMILY,
        G6_RATIO_REPRESENTATION_CHECK_GENERATOR,
      ),
    ]),
    releaseLedger: Object.freeze([
      G6_RATIO_PART_WHOLE_FAMILY,
      G6_RATIO_RELATIVE_COMPARISON_FAMILY,
      G6_RATIO_REPRESENTATION_CHECK_FAMILY,
    ].map(createImmutableReleaseFamilySnapshot)),
  })
