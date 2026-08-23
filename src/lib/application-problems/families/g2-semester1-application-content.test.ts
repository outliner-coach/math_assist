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
import { grade2MissionTemplates, grade2Units } from '../../grade2-problems'
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

describe('Grade 2 semester 1 complete released applications', () => {
  it('matches the source-derived unit concepts, standards, representations, and knowing evidence', () => {
    expect(unitSuites).toHaveLength(6)
    for (const suite of unitSuites) {
      expect(suite.pack).toMatchObject({
        grade: 2,
        semester: '2-1',
        coverageStatus: 'complete',
        releaseStatus: 'approved',
        approval: {
          ownerStatus: 'approved',
          ownerId: 'project-owner',
          evidenceRefs: ['docs/reviews/application-problems-grade2-approval.md'],
          expertStatus: 'not-reviewed',
        },
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

  it('exercises every referenced misconception through an executable learner-facing path', () => {
    const cues: Readonly<Record<string, RegExp>> = {
      'g2-place-value-zero-placeholder': /빈 자리|0인 자리|없는 자리/,
      'g2-place-value-digit-value': /백의 자리|자릿값|백, 십, 일|십의 자리/,
      'g2-place-value-compare-last-digit': /백의 자리부터|일의 자리부터/,
      'g2-shapes-flat-solid-confusion': /평면|입체|면과/,
      'g2-shapes-size-direction-name': /방향/,
      'g2-shapes-side-vertex-count': /곧은 변|꼭짓점/,
      'g2-add-sub-operation-word': /연산|식을|더하고|빼|합치는지/,
      'g2-add-sub-missing-part-add': /처음|전체에서|빠진/,
      'g2-length-end-mark-only': /끝 눈금|시작 눈금|끝에서 시작/,
      'g2-length-unit-sense': /단위를 함께|1cm와 1m|cm와 m/,
      'g2-classification-changing-rule': /기준/,
      'g2-classification-double-count': /두 번|한 번씩|합/,
      'g2-multiplication-add-factors': /더하지|번 더|반복 덧셈/,
      'g2-multiplication-swap-meaning': /서로 바꾸|뒤바꾸|순서를 바꾸|바꾸어 말하지/,
    }
    for (const suite of unitSuites) {
      for (const recipe of suite.recipes) {
        const learnerSurface = recipe.cases
          .map((_, variantIndex) => {
            const problem = recipe.generate({ seed: 0, variantIndex })
            return [problem.prompt, ...(problem.choices ?? []), ...problem.solutionSteps, ...problem.hintSteps].join(' ')
          })
          .join(' ')
        for (const misconceptionId of recipe.family.misconceptionRefs) {
          expect(learnerSurface, `${recipe.family.familyId}:${misconceptionId}`).toMatch(
            cues[misconceptionId],
          )
        }
      }
    }
  })

  it('exposes an independent full-contract validator for every family', () => {
    for (const suite of unitSuites) {
      for (const recipe of suite.recipes) {
        expect(typeof recipe.validateContract).toBe('function')
        const original = recipe.generate({ seed: 0, variantIndex: 0 })
        expect(recipe.validateContract(original), recipe.family.familyId).toEqual([])

        const prompt = structuredClone(original)
        prompt.prompt = '손상된 문제 문장'
        expect(recipe.validateContract(prompt)).not.toEqual([])

        const answer = structuredClone(original)
        answer.answer.normalized = answer.answer.normalized === '9999' ? '9998' : '9999'
        expect(recipe.validateContract(answer)).not.toEqual([])

        const solution = structuredClone(original)
        solution.solutionSteps = ['손상된 풀이']
        expect(recipe.validateContract(solution)).not.toEqual([])

        if (original.choices) {
          const choices = structuredClone(original)
          choices.choices![0] = '손상된 보기'
          expect(recipe.validateContract(choices)).not.toEqual([])
        }

        const visual = structuredClone(original)
        const scene = visual.visual.mathModel as unknown as {
          surface: 'diagram' | 'table'
          primitives?: unknown[]
          rows?: Array<{ cells: Array<{ numericValue?: number }> }>
        }
        if (scene.surface === 'diagram') scene.primitives = []
        else if (scene.rows?.[0]?.cells[1]) scene.rows[0].cells[1].numericValue = 9999
        expect(recipe.validateContract(visual)).not.toEqual([])
      }
    }
  })

  it('publishes explicit exhaustive case, boundary-class, and invariant evidence', () => {
    for (const suite of unitSuites) {
      for (const recipe of suite.recipes) {
        const evidence = (recipe as unknown as {
          proofEvidence?: {
            exhaustive: boolean
            boundaryClasses: readonly string[]
            invariants: readonly string[]
            cases: readonly { variantIndex: number; classes: readonly string[] }[]
          }
        }).proofEvidence
        expect(evidence, recipe.family.familyId).toBeDefined()
        expect(evidence?.exhaustive).toBe(true)
        expect(evidence?.boundaryClasses.length).toBeGreaterThanOrEqual(2)
        expect(evidence?.invariants.length).toBeGreaterThanOrEqual(2)
        expect(evidence?.cases.map((entry) => entry.variantIndex)).toEqual(
          recipe.cases.map((_, variantIndex) => variantIndex),
        )
        expect(evidence?.cases.every((entry) => entry.classes.length > 0)).toBe(true)
      }
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
        expect(ready.status, JSON.stringify(ready)).toBe('ready')
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
        for (const variantIndex of recipe.cases.map((_, index) => index)) {
          const problem = recipe.generate({ seed: 0, variantIndex })
          const resolved = resolveApplicationVisual(problem.visual, {
            familyValidator: (scene) => recipe.validateScene(scene, problem.params),
          })
          expect(resolved.status, JSON.stringify(resolved)).toBe('ready')
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

  it('keeps every hidden tens digit and its intermediate values out of every pre-submit surface', () => {
    const recipe = G2_1_PLACE_VALUE_FAMILY_RECIPES.find(
      (candidate) => candidate.family.familyId === 'g2-1-place-value-missing-digit',
    )!
    recipe.cases.forEach((reviewedCase, variantIndex) => {
      const problem = recipe.generate({ seed: 0, variantIndex })
      const hundreds = Number(reviewedCase.hundreds)
      const tens = Number(reviewedCase.tens)
      const ones = Number(reviewedCase.ones)
      const completeNumber = hundreds * 100 + tens * 10 + ones
      const publicScene = JSON.stringify(problem.visual.mathModel, (key, value) =>
        key === 'after' || value === 'solution' || value === 'intermediate' ? undefined : value,
      )
      const resolved = resolveApplicationVisual(problem.visual, {
        familyValidator: (scene) => recipe.validateScene(scene, problem.params),
      })
      expect(resolved.status).toBe('ready')
      if (resolved.status !== 'ready') return
      const before = renderToStaticMarkup(
        createElement(ApplicationProblemVisual, { scene: resolved.scene, showAnswer: false }),
      )

      expect(problem.prompt).not.toContain(String(completeNumber))
      expect(problem.prompt).not.toContain(`십 ${tens}개`)
      expect(publicScene).not.toContain(String(completeNumber))
      expect(publicScene).not.toContain(`십 ${tens}개`)
      expect(
        resolved.scene.surface === 'diagram' &&
          resolved.scene.primitives.some(
            (primitive) => primitive.kind === 'rect' && primitive.width === tens,
          ),
      ).toBe(false)
      expect(before).not.toContain(String(completeNumber))
      expect(before).not.toContain(`십 ${tens}개`)
      expect(before).not.toContain(`답: ${tens}`)
    })
  })

  it('represents a zero place with no positive quantitative region', () => {
    const recipe = G2_1_PLACE_VALUE_FAMILY_RECIPES.find(
      (candidate) => candidate.family.familyId === 'g2-1-place-value-build-number',
    )!
    for (const variantIndex of [1, 2]) {
      const problem = recipe.generate({ seed: 0, variantIndex })
      const scene = problem.visual.mathModel as unknown as {
        primitives: Array<{ key: string; kind: string; width?: number; height?: number }>
        labels: Array<{ key: string; content: { before?: { text: string } } }>
      }
      for (const [index, place, value] of [
        [0, 'hundreds', Number(problem.params.hundreds)],
        [1, 'tens', Number(problem.params.tens)],
        [2, 'ones', Number(problem.params.ones)],
      ] as const) {
        const primitive = scene.primitives.find(
          (candidate) =>
            candidate.key === `place-${place}` || candidate.key === `bar-${index}`,
        )
        if (value === 0) {
          expect(primitive).toBeUndefined()
        } else {
          expect(primitive).toMatchObject({ kind: 'rect', width: value, height: 14 })
        }
      }
    }
  })

  it('uses actual solid-object topology instead of generic count decoration', () => {
    const recipe = G2_1_SHAPES_FAMILY_RECIPES.find(
      (candidate) => candidate.family.familyId === 'g2-1-shapes-object-match',
    )!
    const problem = recipe.generate({ seed: 0, variantIndex: 0 })
    const scene = problem.visual.mathModel as unknown as {
      primitives: Array<{ key: string; kind: string }>
      constraints: Array<{ kind: string; firstKey?: string; secondKey?: string; relation?: string }>
    }
    expect(scene.primitives.map((primitive) => primitive.key)).toEqual(
      expect.arrayContaining([
        'cuboid-front',
        'cuboid-back',
        'cylinder-body',
        'cylinder-top',
        'sphere-outline',
        'sphere-equator',
      ]),
    )
    expect(scene.constraints.some((constraint) => constraint.kind === 'topology')).toBe(true)
  })

  it('asks add-sub operation choice from a concrete whole-part relation, not a keyword label', () => {
    const recipe = G2_1_ADD_SUB_FAMILY_RECIPES.find(
      (candidate) => candidate.family.familyId === 'g2-1-add-sub-operation-check',
    )!
    recipe.cases.forEach((_, variantIndex) => {
      const problem = recipe.generate({ seed: 0, variantIndex })
      expect(problem.prompt).not.toMatch(/남은 수|모두|차이/)
      expect(problem.prompt).toMatch(/주었어요|한 상자에 넣었어요|몇 개 더 많을까요/)
    })
  })

  it('derives unit standards, concepts, and representations from the live Grade 2 base bank', () => {
    const normalizeRepresentation = (value: string) => {
      if (value.includes('table')) return 'table'
      if (value.includes('equation') || value.includes('operation')) return 'equation'
      return 'diagram'
    }
    for (const suite of unitSuites) {
      const unit = grade2Units.find((candidate) => candidate.id === suite.pack.unitId)!
      const templates = grade2MissionTemplates.filter((template) => template.unitId === unit.id)
      const concepts = new Set(templates.map((template) => `${unit.id}-${template.skill}`))
      const representations = new Set([
        'text',
        ...templates.map((template) => normalizeRepresentation(template.visualModel)),
      ])
      expect(new Set(suite.standards)).toEqual(new Set(unit.curriculumCodes))
      expect(new Set(suite.coreConceptIds)).toEqual(concepts)
      expect(new Set(suite.requiredRepresentations)).toEqual(representations)
    }
  })

  it('records representative and boundary evidence through exhaustive unit proof modules', () => {
    for (const suite of unitSuites) {
      const reports = suite.prove()
      expect(reports).toHaveLength(suite.recipes.length)
      expect(
        reports.every((report) => report.proven && report.issues.length === 0),
        JSON.stringify(reports.filter((report) => !report.proven)),
      ).toBe(true)
      expect(reports.map((report) => report.checkedCount)).toEqual(
        suite.recipes.map((recipe) => recipe.cases.length),
      )
    }
  })
})
