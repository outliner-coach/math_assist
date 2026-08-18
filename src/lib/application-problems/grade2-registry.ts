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
import { G2_1_ADD_SUB_FAMILY_RECIPES } from './families/g2-1-add-sub'
import { G2_1_CLASSIFICATION_FAMILY_RECIPES } from './families/g2-1-classification'
import { G2_1_LENGTH_FAMILY_RECIPES } from './families/g2-1-length'
import { G2_1_MULTIPLICATION_FAMILY_RECIPES } from './families/g2-1-multiplication'
import { G2_1_PLACE_VALUE_FAMILY_RECIPES } from './families/g2-1-place-value'
import { G2_1_SHAPES_FAMILY_RECIPES } from './families/g2-1-shapes'
import { G2_2_FACTS_DRAFT_FAMILIES } from './families/g2-2-facts'
import { G2_2_LENGTH_DRAFT_FAMILIES } from './families/g2-2-length'
import { G2_2_PATTERN_DRAFT_FAMILIES } from './families/g2-2-pattern'
import { G2_2_PLACE_VALUE_DRAFT_FAMILIES } from './families/g2-2-place-value'
import { G2_2_TABLE_GRAPH_DRAFT_FAMILIES } from './families/g2-2-table-graph'
import { G2_2_TIME_DRAFT_FAMILIES } from './families/g2-2-time'
import { parseApplicationProblemFamilyV1 } from './contracts'
import {
  createImmutableReleaseFamilySnapshot,
  deterministicRegistryEntry,
  type ApplicationProblemRegistryV1,
} from './registry'

export const GRADE2_FULL_RELEASE_APPROVAL_V1 = Object.freeze({
  ownerStatus: 'approved' as const,
  ownerId: 'project-owner',
  approvedAt: '2026-08-18T05:48:48Z',
  evidenceRefs: Object.freeze(['docs/reviews/application-problems-grade2-approval.md']),
  expertStatus: 'not-reviewed' as const,
})

const semesterOneRecipes = [
  ...G2_1_PLACE_VALUE_FAMILY_RECIPES,
  ...G2_1_SHAPES_FAMILY_RECIPES,
  ...G2_1_ADD_SUB_FAMILY_RECIPES,
  ...G2_1_LENGTH_FAMILY_RECIPES,
  ...G2_1_CLASSIFICATION_FAMILY_RECIPES,
  ...G2_1_MULTIPLICATION_FAMILY_RECIPES,
]

const semesterTwoDrafts = [
  ...G2_2_PLACE_VALUE_DRAFT_FAMILIES,
  ...G2_2_FACTS_DRAFT_FAMILIES,
  ...G2_2_LENGTH_DRAFT_FAMILIES,
  ...G2_2_TIME_DRAFT_FAMILIES,
  ...G2_2_TABLE_GRAPH_DRAFT_FAMILIES,
  ...G2_2_PATTERN_DRAFT_FAMILIES,
]

const releasedEntries = [
  ...semesterOneRecipes.map(({ family, generator }) => ({ family, generator })),
  ...semesterTwoDrafts.map(({ family, generator }) => ({ family, generator })),
].map(({ family, generator }) => deterministicRegistryEntry(
  parseApplicationProblemFamilyV1({
    ...family,
    releaseStatus: 'approved',
    approval: GRADE2_FULL_RELEASE_APPROVAL_V1,
  }),
  generator,
))

export const GRADE2_APPLICATION_PROBLEM_REGISTRY_V1: ApplicationProblemRegistryV1 =
  Object.freeze({
    entries: Object.freeze([
      deterministicRegistryEntry(G2_LENGTH_ROUTE_TOTAL_FAMILY, G2_LENGTH_ROUTE_TOTAL_GENERATOR),
      deterministicRegistryEntry(
        G2_LENGTH_MISSING_SEGMENT_FAMILY,
        G2_LENGTH_MISSING_SEGMENT_GENERATOR,
      ),
      deterministicRegistryEntry(G2_LENGTH_CLAIM_CHECK_FAMILY, G2_LENGTH_CLAIM_CHECK_GENERATOR),
      ...releasedEntries,
    ]),
    releaseLedger: Object.freeze([
      G2_LENGTH_ROUTE_TOTAL_FAMILY,
      G2_LENGTH_MISSING_SEGMENT_FAMILY,
      G2_LENGTH_CLAIM_CHECK_FAMILY,
      ...releasedEntries.map(({ family }) => family),
    ].map(createImmutableReleaseFamilySnapshot)),
  })
