import { grade3MissionTemplates } from '../grade3-problems'
import type {
  DraftApplicationFamilyCandidateV1,
  DraftApplicationReviewCaseV1,
  ReviewOnlyApplicationUnitCandidateV1,
} from './authoring-catalog'
import type { GeneratedApplicationProblemV1, UnitKnowledgePackV1 } from './contracts'
import { G3_SEMESTER_ONE_APPLICATION_UNITS } from './families/g3-semester-one'
import { G3_SEMESTER_TWO_APPLICATION_UNITS } from './families/g3-semester-two'
import type {
  G3ApplicationFamilyRecipe,
  G3ApplicationUnitContent,
} from './families/g3-family-support'

const PENDING_APPROVAL = Object.freeze({
  ownerStatus: 'pending' as const,
  evidenceRefs: Object.freeze([]),
  expertStatus: 'not-reviewed' as const,
})

function draftPack(value: unknown): UnitKnowledgePackV1 {
  return {
    ...(value as UnitKnowledgePackV1),
    releaseStatus: 'draft',
    approval: {
      ...PENDING_APPROVAL,
      evidenceRefs: [...PENDING_APPROVAL.evidenceRefs],
    },
  }
}

function reviewCases(recipe: G3ApplicationFamilyRecipe): DraftApplicationReviewCaseV1[] {
  return recipe.cases.map((_, variantIndex) => ({
    caseId: `${recipe.family.familyId}-${variantIndex === 0 ? 'representative' : `boundary-${variantIndex}`}`,
    kind: variantIndex === 0 ? 'representative' as const : 'boundary' as const,
    seed: 0,
    variantIndex,
  }))
}

function familyCandidate(recipe: G3ApplicationFamilyRecipe): DraftApplicationFamilyCandidateV1 {
  return {
    family: recipe.family,
    runtime: recipe.runtime,
    oracle: recipe.oracle,
    visualValidator: recipe.visualValidator,
    placementProposal: {
      familyId: recipe.family.familyId,
      version: recipe.family.version,
      grade: 3,
      unitId: recipe.family.unitId,
      conceptId: recipe.family.conceptIds[0],
      cognitiveDomain: recipe.family.cognitiveDomain,
    },
    reviewCases: reviewCases(recipe),
    proof: {
      authorityId: recipe.proof.authorityId,
      mode: recipe.proof.mode,
      expectedCount: recipe.proof.expectedCount,
      checkedCount: recipe.proof.checkedCount,
      proven: recipe.proof.proven,
      issues: [...recipe.proof.issues],
      verify: (problem: GeneratedApplicationProblemV1) => recipe.proof.verify(problem),
    },
  }
}

function unitCandidate(unit: G3ApplicationUnitContent): ReviewOnlyApplicationUnitCandidateV1 {
  const pack = draftPack(unit.pack)
  const knowingConceptIds = new Set(
    grade3MissionTemplates
      .filter((mission) => (
        mission.unitId === unit.unitId && mission.cognitiveDomain === 'knowing'
      ))
      .map((mission) => `${mission.unitId}-${mission.skill}`),
  )
  return {
    pack,
    familyCandidates: unit.recipes.map(familyCandidate),
    completeness: {
      coreConceptIds: [...unit.coreConceptIds],
      requiredRepresentations: [...unit.requiredRepresentations],
      hasKnowingCoverage: knowingConceptIds.size > 0,
    },
  }
}

/** Raw Grade 3 candidates stay review-only until the explicit T12 approval. */
export function createGrade3AuthoringUnitCandidateValues(): ReviewOnlyApplicationUnitCandidateV1[] {
  return [
    ...G3_SEMESTER_ONE_APPLICATION_UNITS,
    ...G3_SEMESTER_TWO_APPLICATION_UNITS,
  ].map(unitCandidate)
}
