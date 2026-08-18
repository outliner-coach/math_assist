import addSubPack from '../../../public/data/application-problems/packs/g2-1-add-sub.json'
import classificationPack from '../../../public/data/application-problems/packs/g2-1-classification.json'
import semesterOneLengthPack from '../../../public/data/application-problems/packs/g2-1-length.json'
import multiplicationPack from '../../../public/data/application-problems/packs/g2-1-multiplication.json'
import semesterOnePlaceValuePack from '../../../public/data/application-problems/packs/g2-1-place-value.json'
import shapesPack from '../../../public/data/application-problems/packs/g2-1-shapes.json'
import factsPack from '../../../public/data/application-problems/packs/g2-2-facts.json'
import semesterTwoLengthPack from '../../../public/data/application-problems/packs/g2-2-length-v2.json'
import patternPack from '../../../public/data/application-problems/packs/g2-2-pattern.json'
import semesterTwoPlaceValuePack from '../../../public/data/application-problems/packs/g2-2-place-value.json'
import tableGraphPack from '../../../public/data/application-problems/packs/g2-2-table-graph.json'
import timePack from '../../../public/data/application-problems/packs/g2-2-time.json'
import { grade2MissionTemplates } from '../grade2-problems'
import type { ProblemRepresentation } from '../types'
import type {
  DraftApplicationFamilyCandidateV1,
  DraftApplicationProofEvidenceV1,
  DraftApplicationReviewCaseV1,
  ReviewOnlyApplicationUnitCandidateV1,
} from './authoring-catalog'
import type { GeneratedApplicationProblemV1, UnitKnowledgePackV1 } from './contracts'
import { G2_1_ADD_SUB_FAMILY_RECIPES } from './families/g2-1-add-sub'
import { evaluateG2SemesterOneAddSubOracle } from './families/g2-1-add-sub.oracle'
import { G2_1_CLASSIFICATION_FAMILY_RECIPES } from './families/g2-1-classification'
import { evaluateG2SemesterOneClassificationOracle } from './families/g2-1-classification.oracle'
import type { G2SemesterOneFamilyRecipe } from './families/g2-1-family-support'
import { G2_1_LENGTH_FAMILY_RECIPES } from './families/g2-1-length'
import { evaluateG2SemesterOneLengthOracle } from './families/g2-1-length.oracle'
import { G2_1_MULTIPLICATION_FAMILY_RECIPES } from './families/g2-1-multiplication'
import { evaluateG2SemesterOneMultiplicationOracle } from './families/g2-1-multiplication.oracle'
import { G2_1_PLACE_VALUE_FAMILY_RECIPES } from './families/g2-1-place-value'
import { evaluateG2SemesterOnePlaceValueOracle } from './families/g2-1-place-value.oracle'
import { G2_1_SHAPES_FAMILY_RECIPES } from './families/g2-1-shapes'
import { evaluateG2SemesterOneShapesOracle } from './families/g2-1-shapes.oracle'
import type { G2FiniteDraftFamily } from './families/g2-2-content-core'
import { G2_2_FACTS_DRAFT_FAMILIES } from './families/g2-2-facts'
import { oracleG2FactsProblem, verifyG2FactsProblem } from './families/g2-2-facts.oracle'
import { validateG2FactsVisual } from './families/g2-2-facts.visual'
import { G2_2_LENGTH_DRAFT_FAMILIES } from './families/g2-2-length'
import {
  oracleG2LengthDraftProblem,
  verifyG2LengthDraftProblem,
} from './families/g2-2-length.oracle'
import { validateG2LengthDraftVisual } from './families/g2-2-length.visual'
import { G2_2_PATTERN_DRAFT_FAMILIES } from './families/g2-2-pattern'
import { oracleG2PatternProblem, verifyG2PatternProblem } from './families/g2-2-pattern.oracle'
import { validateG2PatternVisual } from './families/g2-2-pattern.visual'
import { G2_2_PLACE_VALUE_DRAFT_FAMILIES } from './families/g2-2-place-value'
import {
  oracleG2PlaceValueProblem,
  verifyG2PlaceValueProblem,
} from './families/g2-2-place-value.oracle'
import { validateG2PlaceValueVisual } from './families/g2-2-place-value.visual'
import { G2_2_TABLE_GRAPH_DRAFT_FAMILIES } from './families/g2-2-table-graph'
import {
  oracleG2TableGraphProblem,
  verifyG2TableGraphProblem,
} from './families/g2-2-table-graph.oracle'
import { validateG2TableGraphVisual } from './families/g2-2-table-graph.visual'
import { G2_2_TIME_DRAFT_FAMILIES } from './families/g2-2-time'
import { oracleG2TimeProblem, verifyG2TimeProblem } from './families/g2-2-time.oracle'
import { validateG2TimeVisual } from './families/g2-2-time.visual'

type Oracle = (problem: GeneratedApplicationProblemV1) => string
type Verifier = (problem: GeneratedApplicationProblemV1) => readonly string[]
type VisualValidator = (problem: GeneratedApplicationProblemV1) => boolean

interface SemesterOneUnitSource {
  pack: unknown
  recipes: readonly G2SemesterOneFamilyRecipe[]
  oracle: Oracle
}

interface SemesterTwoUnitSource {
  pack: unknown
  families: readonly G2FiniteDraftFamily[]
  oracle: Oracle
  verify: Verifier
  visual: VisualValidator
}

const CANDIDATE_APPROVAL = Object.freeze({
  ownerStatus: 'pending' as const,
  evidenceRefs: Object.freeze([]),
  expertStatus: 'not-reviewed' as const,
})

function reviewCandidatePack(value: unknown): UnitKnowledgePackV1 {
  return {
    ...(value as UnitKnowledgePackV1),
    releaseStatus: 'draft',
    approval: {
      ...CANDIDATE_APPROVAL,
      evidenceRefs: [...CANDIDATE_APPROVAL.evidenceRefs],
    },
  }
}

function normalizeRepresentation(value: string): ProblemRepresentation {
  if (['text', 'equation', 'table', 'diagram', 'graph', 'manipulative'].includes(value)) {
    return value as ProblemRepresentation
  }
  const normalized = value.toLowerCase()
  if (normalized.includes('graph')) return 'graph'
  if (normalized.includes('table')) return 'table'
  if (
    normalized.includes('equation') ||
    normalized.includes('operation') ||
    normalized.includes('balance')
  ) return 'equation'
  if (normalized === 'context') return 'text'
  return 'diagram'
}

function baseBankCompleteness(unitId: string) {
  const templates = grade2MissionTemplates.filter((template) => template.unitId === unitId)
  const coreConceptIds = Array.from(new Set(templates.map((template) => (
    `${template.unitId}-${template.skill}`
  )))).sort()
  const requiredRepresentations = Array.from(new Set([
    'text' as ProblemRepresentation,
    ...templates.map((template) => normalizeRepresentation(template.visualModel)),
  ])).sort()
  return {
    coreConceptIds,
    requiredRepresentations,
    hasKnowingCoverage: templates.some((template) => template.cognitiveDomain === 'knowing'),
  }
}

function proofEvidence(input: {
  authorityId: string
  mode: DraftApplicationProofEvidenceV1['mode']
  expectedCount: number
  fullIssues: readonly string[]
  verify: Verifier
}): DraftApplicationProofEvidenceV1 {
  return {
    authorityId: input.authorityId,
    mode: input.mode,
    expectedCount: input.expectedCount,
    checkedCount: input.expectedCount,
    proven: input.fullIssues.length === 0,
    issues: [...input.fullIssues],
    verify: (problem) => input.verify(problem),
  }
}

function placement(
  family: DraftApplicationFamilyCandidateV1['family'],
): DraftApplicationFamilyCandidateV1['placementProposal'] {
  return {
    familyId: family.familyId,
    version: family.version,
    grade: 2,
    unitId: family.unitId,
    conceptId: family.conceptIds[0],
    cognitiveDomain: family.cognitiveDomain,
  }
}

function semesterOneCandidate(
  recipe: G2SemesterOneFamilyRecipe,
  oracle: Oracle,
): DraftApplicationFamilyCandidateV1 {
  const fullIssues = recipe.cases.flatMap((_, variantIndex) => (
    recipe.validateContract(recipe.generate({ seed: 0, variantIndex }))
      .map((entry) => `${variantIndex}:${entry.surface}:${entry.code}`)
  ))
  const reviewCases: DraftApplicationReviewCaseV1[] = [
    {
      caseId: `${recipe.family.familyId}-representative`,
      kind: 'representative',
      seed: 0,
      variantIndex: Math.floor(recipe.cases.length / 2),
    },
    ...recipe.proofEvidence.cases.map(({ variantIndex }) => ({
      caseId: `${recipe.family.familyId}-boundary-${variantIndex}`,
      kind: 'boundary' as const,
      seed: 0,
      variantIndex,
    })),
  ]
  const verify: Verifier = (problem) => recipe.validateContract(problem)
    .map((entry) => `${entry.surface}:${entry.code}:${entry.message}`)
  return {
    family: recipe.family,
    runtime: recipe.runtime,
    oracle,
    visualValidator: (problem) => recipe.validateContract(problem).length === 0,
    placementProposal: placement(recipe.family),
    reviewCases,
    proof: proofEvidence({
      authorityId: `${recipe.family.familyId}-exhaustive-proof-v1`,
      mode: recipe.family.proofMode,
      expectedCount: recipe.cases.length,
      fullIssues,
      verify,
    }),
  }
}

function semesterTwoCandidate(
  draft: G2FiniteDraftFamily,
  oracle: Oracle,
  verify: Verifier,
  visual: VisualValidator,
): DraftApplicationFamilyCandidateV1 {
  const fullIssues = draft.cases.flatMap((_, variantIndex) => (
    verify(draft.generate({ seed: 0, variantIndex })).map((entry) => `${variantIndex}:${entry}`)
  ))
  return {
    family: draft.family,
    runtime: { kind: 'deterministic-generator', generator: draft.generator },
    oracle,
    visualValidator: visual,
    placementProposal: placement(draft.family),
    reviewCases: draft.reviewCases.map(({ caseId, kind, seed, variantIndex }) => ({
      caseId: caseId.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      kind,
      seed,
      variantIndex,
    })),
    proof: proofEvidence({
      authorityId: `${draft.family.familyId}-exhaustive-proof-v1`,
      mode: draft.family.proofMode,
      expectedCount: draft.cases.length,
      fullIssues,
      verify,
    }),
  }
}

const SEMESTER_ONE_UNITS: readonly SemesterOneUnitSource[] = [
  { pack: semesterOnePlaceValuePack, recipes: G2_1_PLACE_VALUE_FAMILY_RECIPES, oracle: evaluateG2SemesterOnePlaceValueOracle },
  { pack: shapesPack, recipes: G2_1_SHAPES_FAMILY_RECIPES, oracle: evaluateG2SemesterOneShapesOracle },
  { pack: addSubPack, recipes: G2_1_ADD_SUB_FAMILY_RECIPES, oracle: evaluateG2SemesterOneAddSubOracle },
  { pack: semesterOneLengthPack, recipes: G2_1_LENGTH_FAMILY_RECIPES, oracle: evaluateG2SemesterOneLengthOracle },
  { pack: classificationPack, recipes: G2_1_CLASSIFICATION_FAMILY_RECIPES, oracle: evaluateG2SemesterOneClassificationOracle },
  { pack: multiplicationPack, recipes: G2_1_MULTIPLICATION_FAMILY_RECIPES, oracle: evaluateG2SemesterOneMultiplicationOracle },
]

const SEMESTER_TWO_UNITS: readonly SemesterTwoUnitSource[] = [
  { pack: semesterTwoPlaceValuePack, families: G2_2_PLACE_VALUE_DRAFT_FAMILIES, oracle: oracleG2PlaceValueProblem, verify: verifyG2PlaceValueProblem, visual: validateG2PlaceValueVisual },
  { pack: factsPack, families: G2_2_FACTS_DRAFT_FAMILIES, oracle: oracleG2FactsProblem, verify: verifyG2FactsProblem, visual: validateG2FactsVisual },
  { pack: semesterTwoLengthPack, families: G2_2_LENGTH_DRAFT_FAMILIES, oracle: oracleG2LengthDraftProblem, verify: verifyG2LengthDraftProblem, visual: validateG2LengthDraftVisual },
  { pack: timePack, families: G2_2_TIME_DRAFT_FAMILIES, oracle: oracleG2TimeProblem, verify: verifyG2TimeProblem, visual: validateG2TimeVisual },
  { pack: tableGraphPack, families: G2_2_TABLE_GRAPH_DRAFT_FAMILIES, oracle: oracleG2TableGraphProblem, verify: verifyG2TableGraphProblem, visual: validateG2TableGraphVisual },
  { pack: patternPack, families: G2_2_PATTERN_DRAFT_FAMILIES, oracle: oracleG2PatternProblem, verify: verifyG2PatternProblem, visual: validateG2PatternVisual },
]

/**
 * Raw Grade 2 candidates are finalized by authoring-catalog.ts. Keeping the
 * constructor outside this module avoids a runtime cycle while preserving a
 * review-only import boundary.
 */
export function createGrade2AuthoringUnitCandidateValues(): ReviewOnlyApplicationUnitCandidateV1[] {
  const semesterOne = SEMESTER_ONE_UNITS.map((unit) => {
    const pack = reviewCandidatePack(unit.pack)
    return {
      pack,
      familyCandidates: unit.recipes.map((recipe) => semesterOneCandidate(recipe, unit.oracle)),
      completeness: baseBankCompleteness(pack.unitId),
    }
  })
  const semesterTwo = SEMESTER_TWO_UNITS.map((unit) => {
    const pack = reviewCandidatePack(unit.pack)
    return {
      pack,
      familyCandidates: unit.families.map((draft) => (
        semesterTwoCandidate(draft, unit.oracle, unit.verify, unit.visual)
      )),
      completeness: baseBankCompleteness(pack.unitId),
    }
  })
  return [...semesterOne, ...semesterTwo]
}
