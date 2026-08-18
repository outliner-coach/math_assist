import { describe, expect, it } from 'vitest'
import curriculumAllocations from '../../../../public/data/curriculum-allocations-v1.json'
import { grade3Units } from '../../grade3-problems'
import {
  parseUnitKnowledgePackV1,
  type CurriculumStandardAllocationV1,
  validateApplicationProblemCatalog,
} from '../contracts'
import { answerIsPublicBeforeSubmission } from '../quality-evidence'
import { resolveApplicationVisual } from '../visual-validator'
import { G3_SEMESTER_ONE_APPLICATION_UNITS } from './g3-semester-one'
import { G3_SEMESTER_TWO_APPLICATION_UNITS } from './g3-semester-two'

const EXPECTED_BASE_EVIDENCE = {
  'g3-1-add-sub': {
    concepts: ['g3-1-add-sub-addition-subtraction'],
    representations: ['equation', 'text'],
  },
  'g3-1-lines': {
    concepts: ['g3-1-lines-line-angle'],
    representations: ['diagram', 'text'],
  },
  'g3-1-division': {
    concepts: ['g3-1-division-division-meaning'],
    representations: ['diagram', 'text'],
  },
  'g3-1-multiply': {
    concepts: ['g3-1-multiply-multiplication'],
    representations: ['diagram', 'text'],
  },
  'g3-1-length-time': {
    concepts: ['g3-1-length-time-length-time'],
    representations: ['diagram', 'text'],
  },
  'g3-1-fraction-decimal': {
    concepts: ['g3-1-fraction-decimal-fraction-decimal'],
    representations: ['diagram', 'text'],
  },
  'g3-2-multiply': {
    concepts: ['g3-2-multiply-multiplication'],
    representations: ['diagram', 'text'],
  },
  'g3-2-division': {
    concepts: ['g3-2-division-division-remainder'],
    representations: ['diagram', 'text'],
  },
  'g3-2-circle': {
    concepts: ['g3-2-circle-circle'],
    representations: ['diagram', 'text'],
  },
  'g3-2-fraction': {
    concepts: ['g3-2-fraction-fraction'],
    representations: ['diagram', 'text'],
  },
  'g3-2-capacity-weight': {
    concepts: ['g3-2-capacity-weight-capacity-weight'],
    representations: ['diagram', 'text'],
  },
  'g3-2-graph': {
    concepts: ['g3-2-graph-graph'],
    representations: ['graph', 'text'],
  },
} as const

const NON_CALCULATION_ACTIONS = new Set([
  'interpret_context',
  'select_relevant_data',
  'choose_model',
  'convert_representation',
  'infer_missing_value',
  'compare_strategies',
  'test_constraint',
  'verify_result',
  'evaluate_claim',
])

const units = [
  ...G3_SEMESTER_ONE_APPLICATION_UNITS,
  ...G3_SEMESTER_TWO_APPLICATION_UNITS,
]

function publicVisualLabels(problem: { visual: { mathModel?: unknown } }): string[] {
  const model = problem.visual.mathModel as {
    labels?: Array<{ content?: { before?: { text?: unknown } } }>
  }
  return (model.labels ?? []).flatMap(({ content }) => (
    typeof content?.before?.text === 'string' ? [content.before.text] : []
  ))
}

describe('Grade 3 complete application content', () => {
  it('declares twelve approved complete packs from the canonical Grade 3 bank', () => {
    expect(units.map(({ unitId }) => unitId)).toEqual(grade3Units.map(({ id }) => id))

    for (const content of units) {
      const canonical = grade3Units.find(({ id }) => id === content.unitId)!
      const expected = EXPECTED_BASE_EVIDENCE[content.unitId as keyof typeof EXPECTED_BASE_EVIDENCE]
      const pack = parseUnitKnowledgePackV1(content.pack)

      expect(pack).toMatchObject({
        unitId: canonical.id,
        grade: 3,
        semester: canonical.semester,
        coverageStatus: 'complete',
        releaseStatus: 'approved',
        approval: {
          ownerStatus: 'approved',
          ownerId: 'project-owner',
          approvedAt: '2026-08-18T09:24:24Z',
          evidenceRefs: ['docs/reviews/application-problems-grade3-approval.md'],
          expertStatus: 'not-reviewed',
        },
      })
      expect(pack.coveredStandardCodes).toEqual(canonical.curriculumCodes)
      expect(pack.concepts.map(({ conceptId }) => conceptId).sort()).toEqual([...expected.concepts].sort())
      expect(content.coreConceptIds).toEqual(expected.concepts)
      expect(content.requiredRepresentations).toEqual(expected.representations)
      expect(new Set(pack.familyRefs.map(({ familyId }) => familyId))).toEqual(
        new Set(content.recipes.map(({ family }) => family.familyId)),
      )
    }
  })

  it('covers every core concept with applying work and three distinct reasoning structures per unit', () => {
    for (const content of units) {
      const applyingConcepts = new Set(content.recipes
        .filter(({ family }) => family.cognitiveDomain === 'applying')
        .flatMap(({ family }) => family.conceptIds))
      expect(content.coreConceptIds.every((conceptId) => applyingConcepts.has(conceptId)), content.unitId)
        .toBe(true)

      const reasoning = content.recipes.filter(({ family }) => family.cognitiveDomain === 'reasoning')
      expect(reasoning.length, content.unitId).toBeGreaterThanOrEqual(3)
      expect(new Set(reasoning.map(({ family }) => family.reasoningPattern)).size, content.unitId)
        .toBeGreaterThanOrEqual(3)
      expect(new Set(reasoning.map(({ family }) => `${family.modelId}:${family.unknownRole}`)).size, content.unitId)
        .toBe(reasoning.length)

      for (const { family } of content.recipes) {
        expect(
          family.requiredStudentActions.some((action) => NON_CALCULATION_ACTIONS.has(action)),
          family.familyId,
        ).toBe(true)
      }
    }
  })

  it('replays every reviewed variant through independent oracle, visual, disclosure, and proof checks', () => {
    for (const content of units) {
      for (const recipe of content.recipes) {
        expect(recipe.cases.length, recipe.family.familyId).toBeGreaterThanOrEqual(3)
        expect(recipe.proof.expectedCount, recipe.family.familyId).toBe(recipe.cases.length)
        expect(recipe.proof.checkedCount, `${recipe.family.familyId}: ${recipe.proof.issues.join('; ')}`).toBe(recipe.cases.length)
        expect(recipe.proof.proven, `${recipe.family.familyId}: ${recipe.proof.issues.join('; ')}`).toBe(true)
        expect(recipe.proof.issues, recipe.family.familyId).toEqual([])

        recipe.cases.forEach((_, variantIndex) => {
          const input = { seed: 0, variantIndex }
          const first = recipe.generate(input)
          const second = recipe.generate(input)
          expect(first, recipe.family.familyId).toEqual(second)
          expect(recipe.oracle(first), recipe.family.familyId).toBe(first.answer.normalized)
          expect(recipe.verify(first), recipe.family.familyId).toEqual([])
          expect(recipe.visualValidator(first), recipe.family.familyId).toBe(true)
          expect(resolveApplicationVisual(first.visual).status, recipe.family.familyId).toBe('ready')
          expect(answerIsPublicBeforeSubmission(first), recipe.family.familyId).toBe(false)
        })
      }
    }
  })

  it('fails closed when a reviewed surface is corrupted or exposes the answer before submission', () => {
    for (const content of units) {
      const recipe = content.recipes[0]
      const original = recipe.generate({ seed: 0, variantIndex: 0 })
      expect(recipe.verify({ ...original, prompt: '손상된 문제 문장' }).length, content.unitId).toBeGreaterThan(0)
      expect(recipe.verify({
        ...original,
        answer: { ...original.answer, normalized: `${original.answer.normalized}-손상` },
      }).length, content.unitId).toBeGreaterThan(0)
      expect(recipe.verify({
        ...original,
        solutionSteps: ['근거가 없는 풀이', '잘못된 결론'],
      }).length, content.unitId).toBeGreaterThan(0)

      const exposed = structuredClone(original)
      const model = exposed.visual.mathModel as {
        labels: Array<{
          key: string
          content: { before?: { text: string; disclosure: 'given' | 'identifier' } }
        }>
      }
      const answerLabel = model.labels.find(({ key }) => key === 'answer-label')!
      answerLabel.content.before = {
        text: original.answer.normalized,
        disclosure: 'identifier',
      }
      expect(recipe.verify(exposed).length, content.unitId).toBeGreaterThan(0)
      expect(recipe.visualValidator(exposed), content.unitId).toBe(false)
    }
  })

  it('keeps derived circle values and hidden graph category names out of public visuals', () => {
    const circle = units
      .find(({ unitId }) => unitId === 'g3-2-circle')!
      .recipes.find(({ family }) => family.familyId === 'g3-2-circle-missing-radius')!
    const missingRadius = circle.generate({ seed: 0, variantIndex: 0 })
    expect(publicVisualLabels(missingRadius)).toContain('지름 8')
    expect(publicVisualLabels(missingRadius)).not.toContain('반지름 4')

    const exposedRadius = structuredClone(missingRadius)
    const exposedRadiusModel = exposedRadius.visual.mathModel as {
      labels: Array<{ key: string; content: { before?: { text: string; disclosure: 'given' } } }>
    }
    exposedRadiusModel.labels.find(({ key }) => key === 'diameter-label')!.content.before = {
      text: '반지름 4',
      disclosure: 'given',
    }
    expect(circle.verify(exposedRadius)).toContain('derived radius is public before submission')

    const graph = units
      .find(({ unitId }) => unitId === 'g3-2-graph')!
      .recipes.find(({ family }) => family.familyId === 'g3-2-graph-data-sufficiency')!
    const missingLabels = graph.generate({ seed: 0, variantIndex: 1 })
    expect(publicVisualLabels(missingLabels)).toEqual(expect.arrayContaining([
      '막대 1 높이 9',
      '막대 2 높이 14',
    ]))
    expect(publicVisualLabels(missingLabels).join(' ')).not.toMatch(/(?:^|\s)[ab]\s/)

    const exposedCategories = structuredClone(missingLabels)
    const exposedCategoryModel = exposedCategories.visual.mathModel as {
      labels: Array<{ key: string; content: { before?: { text: string; disclosure: 'given' } } }>
    }
    exposedCategoryModel.labels[0].content.before = { text: 'a 9', disclosure: 'given' }
    exposedCategoryModel.labels[1].content.before = { text: 'b 14', disclosure: 'given' }
    expect(graph.verify(exposedCategories)).toContain('hidden graph category names are public')
  })

  it('uses learner-facing labels instead of internal parameter keys in every visual variant', () => {
    for (const content of units) {
      for (const recipe of content.recipes) {
        recipe.cases.forEach((_, variantIndex) => {
          const labels = publicVisualLabels(recipe.generate({ seed: 0, variantIndex })).join(' ')
          expect(labels, `${recipe.family.familyId}:${variantIndex}`).not.toMatch(
            /(?:^|\s)[A-Za-z][A-Za-z0-9]*\s+-?\d/,
          )
        })
      }
    }
  })

  it('passes canonical complete-pack coverage and exact Grade 3 ledger allocation', () => {
    for (const content of units) {
      const pack = parseUnitKnowledgePackV1(content.pack)
      const canonical = grade3Units.find(({ id }) => id === content.unitId)!
      const ledgerAllocations = curriculumAllocations.allocations.map((allocation) => (
        canonical.curriculumCodes.includes(allocation.standardCode)
          ? { ...allocation, unitId: canonical.id, assignedGrade: 3 as const, semester: canonical.semester }
          : allocation
      )) as CurriculumStandardAllocationV1[]
      expect(validateApplicationProblemCatalog({
        packs: [pack],
        families: content.recipes.map(({ family }) => family),
        ledgerAllocations,
        completeCoverageContexts: [{
          packId: pack.packId,
          version: pack.version,
          coreConceptIds: content.coreConceptIds,
          requiredRepresentations: content.requiredRepresentations,
          hasKnowingCoverage: true,
        }],
      }), content.unitId).toEqual([])
    }
  })
})
