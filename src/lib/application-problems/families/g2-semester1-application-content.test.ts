import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import addSubPackSource from '../../../../public/data/application-problems/packs/g2-1-add-sub.json'
import classificationPackSource from '../../../../public/data/application-problems/packs/g2-1-classification.json'
import lengthPackSource from '../../../../public/data/application-problems/packs/g2-1-length.json'
import multiplicationPackSource from '../../../../public/data/application-problems/packs/g2-1-multiplication.json'
import placeValuePackSource from '../../../../public/data/application-problems/packs/g2-1-place-value.json'
import shapesPackSource from '../../../../public/data/application-problems/packs/g2-1-shapes.json'
import ApplicationProblemVisual from '../../../components/ApplicationProblemVisual'
import {
  parseUnitKnowledgePackV1,
  validateUnitKnowledgePackCoverage,
  type GeneratedApplicationProblemV1,
  type UnitKnowledgePackV1,
} from '../contracts'
import { resolveApplicationVisual } from '../visual-validator'
import { G2_1_ADD_SUB_FAMILY_RECIPES } from './g2-1-add-sub'
import { evaluateG2SemesterOneAddSubOracle } from './g2-1-add-sub.oracle'
import { proveG2SemesterOneAddSubFamilies } from './g2-1-add-sub-proof'
import { G2_1_CLASSIFICATION_FAMILY_RECIPES } from './g2-1-classification'
import { evaluateG2SemesterOneClassificationOracle } from './g2-1-classification.oracle'
import { proveG2SemesterOneClassificationFamilies } from './g2-1-classification-proof'
import type { G2SemesterOneFamilyRecipe } from './g2-1-family-support'
import { G2_1_LENGTH_FAMILY_RECIPES } from './g2-1-length'
import { evaluateG2SemesterOneLengthOracle } from './g2-1-length.oracle'
import { proveG2SemesterOneLengthFamilies } from './g2-1-length-proof'
import { G2_1_MULTIPLICATION_FAMILY_RECIPES } from './g2-1-multiplication'
import { evaluateG2SemesterOneMultiplicationOracle } from './g2-1-multiplication.oracle'
import { proveG2SemesterOneMultiplicationFamilies } from './g2-1-multiplication-proof'
import { G2_1_PLACE_VALUE_FAMILY_RECIPES } from './g2-1-place-value'
import { evaluateG2SemesterOnePlaceValueOracle } from './g2-1-place-value.oracle'
import { proveG2SemesterOnePlaceValueFamilies } from './g2-1-place-value-proof'
import { G2_1_SHAPES_FAMILY_RECIPES } from './g2-1-shapes'
import { evaluateG2SemesterOneShapesOracle } from './g2-1-shapes.oracle'
import { proveG2SemesterOneShapesFamilies } from './g2-1-shapes-proof'

type Oracle = (problem: GeneratedApplicationProblemV1) => string

const unitSuites: readonly {
  pack: UnitKnowledgePackV1
  recipes: readonly G2SemesterOneFamilyRecipe[]
  oracle: Oracle
  standards: readonly string[]
  coreConceptIds: readonly string[]
  requiredRepresentations: readonly ('text' | 'equation' | 'table' | 'diagram')[]
  prove: () => readonly { familyId: string; checkedCount: number; proven: boolean; issues: readonly string[] }[]
}[] = [
  {
    pack: parseUnitKnowledgePackV1(placeValuePackSource),
    recipes: G2_1_PLACE_VALUE_FAMILY_RECIPES,
    oracle: evaluateG2SemesterOnePlaceValueOracle,
    standards: ['[2수01-02]', '[2수01-03]'],
    coreConceptIds: ['g2-1-place-value-number-comparison', 'g2-1-place-value-place-value'],
    requiredRepresentations: ['diagram', 'text'],
    prove: proveG2SemesterOnePlaceValueFamilies,
  },
  {
    pack: parseUnitKnowledgePackV1(shapesPackSource),
    recipes: G2_1_SHAPES_FAMILY_RECIPES,
    oracle: evaluateG2SemesterOneShapesOracle,
    standards: ['[2수03-01]', '[2수03-02]', '[2수03-03]', '[2수03-04]', '[2수03-05]'],
    coreConceptIds: ['g2-1-shapes-plane-shapes', 'g2-1-shapes-solid-shapes'],
    requiredRepresentations: ['diagram', 'text'],
    prove: proveG2SemesterOneShapesFamilies,
  },
  {
    pack: parseUnitKnowledgePackV1(addSubPackSource),
    recipes: G2_1_ADD_SUB_FAMILY_RECIPES,
    oracle: evaluateG2SemesterOneAddSubOracle,
    standards: ['[2수01-05]', '[2수01-06]', '[2수01-07]', '[2수01-08]', '[2수01-09]'],
    coreConceptIds: ['g2-1-add-sub-addition-subtraction'],
    requiredRepresentations: ['diagram', 'equation', 'text'],
    prove: proveG2SemesterOneAddSubFamilies,
  },
  {
    pack: parseUnitKnowledgePackV1(lengthPackSource),
    recipes: G2_1_LENGTH_FAMILY_RECIPES,
    oracle: evaluateG2SemesterOneLengthOracle,
    standards: ['[2수03-06]', '[2수03-10]', '[2수03-12]'],
    coreConceptIds: ['g2-1-length-length'],
    requiredRepresentations: ['diagram', 'text'],
    prove: proveG2SemesterOneLengthFamilies,
  },
  {
    pack: parseUnitKnowledgePackV1(classificationPackSource),
    recipes: G2_1_CLASSIFICATION_FAMILY_RECIPES,
    oracle: evaluateG2SemesterOneClassificationOracle,
    standards: ['[2수04-01]'],
    coreConceptIds: ['g2-1-classification-classification'],
    requiredRepresentations: ['table', 'text'],
    prove: proveG2SemesterOneClassificationFamilies,
  },
  {
    pack: parseUnitKnowledgePackV1(multiplicationPackSource),
    recipes: G2_1_MULTIPLICATION_FAMILY_RECIPES,
    oracle: evaluateG2SemesterOneMultiplicationOracle,
    standards: ['[2수01-10]'],
    coreConceptIds: ['g2-1-multiplication-multiplication-meaning'],
    requiredRepresentations: ['diagram', 'text'],
    prove: proveG2SemesterOneMultiplicationFamilies,
  },
]

describe('Grade 2 semester 1 complete application candidates', () => {
  it('matches the source-derived unit concepts, standards, representations, and knowing evidence', () => {
    expect(unitSuites).toHaveLength(6)
    for (const suite of unitSuites) {
      expect(suite.pack).toMatchObject({
        grade: 2,
        semester: '2-1',
        coverageStatus: 'complete',
        releaseStatus: 'draft',
        approval: { ownerStatus: 'pending', evidenceRefs: [], expertStatus: 'not-reviewed' },
      })
      expect(new Set(suite.pack.coveredStandardCodes)).toEqual(new Set(suite.standards))
      expect(
        validateUnitKnowledgePackCoverage(suite.pack, {
          unitStandardCodes: suite.standards,
          coreConceptIds: suite.coreConceptIds,
          requiredRepresentations: suite.requiredRepresentations,
          hasKnowingCoverage: true,
          families: suite.recipes.map((recipe) => recipe.family),
        }),
      ).toEqual([])
      expect(
        new Set(suite.pack.familyRefs.map((reference) => `${reference.familyId}@${reference.version}`)),
      ).toEqual(new Set(suite.recipes.map((recipe) => `${recipe.family.familyId}@${recipe.family.version}`)))
    }
  })

  it('gives every core concept applying coverage and each unit three distinct reasoning structures', () => {
    for (const suite of unitSuites) {
      for (const conceptId of suite.coreConceptIds) {
        expect(
          suite.recipes.some(
            (recipe) =>
              recipe.family.cognitiveDomain === 'applying' &&
              recipe.family.conceptIds.includes(conceptId),
          ),
        ).toBe(true)
      }
      const reasoning = suite.recipes.filter(
        (recipe) => recipe.family.cognitiveDomain === 'reasoning',
      )
      expect(reasoning.length).toBeGreaterThanOrEqual(3)
      expect(new Set(reasoning.map((recipe) => recipe.family.reasoningPattern)).size).toBeGreaterThanOrEqual(3)
      expect(
        new Set(
          reasoning.map((recipe) =>
            [
              recipe.family.reasoningPattern,
              recipe.family.modelId,
              recipe.family.unknownRole,
              recipe.family.requiredStudentActions.join(','),
            ].join('|'),
          ),
        ).size,
      ).toBe(reasoning.length)
      for (const recipe of reasoning) {
        expect(
          recipe.family.requiredStudentActions.filter((action) => action !== 'execute_calculation')
            .length,
        ).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('connects every declared misconception to an actual family', () => {
    for (const suite of unitSuites) {
      const declared = new Set(
        suite.pack.concepts.flatMap((concept) =>
          concept.misconceptions.map((misconception) => misconception.id),
        ),
      )
      const used = new Set(
        suite.recipes.flatMap((recipe) => recipe.family.misconceptionRefs),
      )
      expect(used).toEqual(declared)
    }
  })

  it('exhausts every finite case with deterministic generation and an independent oracle', () => {
    for (const suite of unitSuites) {
      for (const recipe of suite.recipes) {
        expect(recipe.cases.length).toBeGreaterThanOrEqual(3)
        expect(
          recipe.cases.every(
            (reviewedCase) =>
              !Object.hasOwn(reviewedCase, 'answer') &&
              !Object.hasOwn(reviewedCase, 'correctSpeaker'),
          ),
        ).toBe(true)
        const problems = recipe.cases.map((_, variantIndex) =>
          recipe.generate({ seed: 0, variantIndex }),
        )
        expect(new Set(problems.map((problem) => problem.instanceId)).size).toBe(recipe.cases.length)
        problems.forEach((problem, variantIndex) => {
          expect(problem).toEqual(recipe.generate({ seed: 0, variantIndex }))
          expect(problem.answer.normalized).toBe(suite.oracle(problem))
          expect(problem.prompt.length).toBeLessThanOrEqual(180)
          expect(problem.hintSteps.every((step) => !step.startsWith('답:'))).toBe(true)
          if (problem.answer.format === 'choice') {
            expect(new Set(problem.choices).size).toBe(problem.choices?.length)
            expect(problem.choices?.[problem.correctChoiceIndex!]).toBe(problem.answer.normalized)
          }
        })
        for (const seed of [-1, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]) {
          expect(recipe.generate({ seed, variantIndex: Number.MAX_SAFE_INTEGER })).toEqual(
            recipe.generate({ seed, variantIndex: Number.MAX_SAFE_INTEGER }),
          )
        }
      }
    }
  })

  it('fails required visuals closed when any reviewed scene field drifts', () => {
    for (const suite of unitSuites) {
      for (const recipe of suite.recipes) {
        const problem = recipe.generate({ seed: 0, variantIndex: 0 })
        const ready = resolveApplicationVisual(problem.visual, {
          familyValidator: (scene) => recipe.validateScene(scene, problem.params),
        })
        expect(ready.status).toBe('ready')
        const changed = structuredClone(problem.visual.mathModel) as Record<string, unknown>
        if (changed.surface === 'diagram') {
          const viewBox = changed.viewBox as { width: number }
          viewBox.width += 1
        } else {
          const caption = changed.caption as { before: { text: string } }
          caption.before.text += ' 바뀜'
        }
        const blocked = resolveApplicationVisual(
          { ...problem.visual, mathModel: changed as never },
          { familyValidator: (scene) => recipe.validateScene(scene, problem.params) },
        )
        expect(blocked.status).toBe('blocked')
      }
    }
  })

  it('keeps answer-only labels out of pre-submit DOM and accessibility markup', () => {
    for (const suite of unitSuites) {
      for (const recipe of suite.recipes) {
        for (const variantIndex of [0, recipe.cases.length - 1]) {
          const problem = recipe.generate({ seed: 0, variantIndex })
          const resolved = resolveApplicationVisual(problem.visual, {
            familyValidator: (scene) => recipe.validateScene(scene, problem.params),
          })
          expect(resolved.status).toBe('ready')
          if (resolved.status !== 'ready') continue
          const before = renderToStaticMarkup(
            createElement(ApplicationProblemVisual, { scene: resolved.scene, showAnswer: false }),
          )
          const after = renderToStaticMarkup(
            createElement(ApplicationProblemVisual, { scene: resolved.scene, showAnswer: true }),
          )
          if (resolved.scene.surface === 'table') {
            expect(before).toContain('<td>답</td><td>?</td>')
            expect(before).not.toContain(
              `<td>답</td><td>${problem.answer.normalized}</td>`,
            )
            expect(after).toContain(
              `<td>답</td><td>${problem.answer.normalized}</td>`,
            )
          } else {
            expect(before).not.toContain(`답: ${problem.answer.normalized}`)
            expect(before).toContain('답: ?')
            expect(after).toContain(`답: ${problem.answer.normalized}`)
          }
          expect(before).not.toContain('data-answer')
        }
      }
    }
  })

  it('records representative and boundary evidence through exhaustive unit proof modules', () => {
    for (const suite of unitSuites) {
      const reports = suite.prove()
      expect(reports).toHaveLength(suite.recipes.length)
      expect(reports.every((report) => report.proven && report.issues.length === 0)).toBe(true)
      expect(reports.map((report) => report.checkedCount)).toEqual(
        suite.recipes.map((recipe) => recipe.cases.length),
      )
    }
  })
})
