import { describe, expect, it } from 'vitest'

import {
  parseApplicationProblemFamilyV1,
  parseGeneratedApplicationProblemV1,
  type GeneratedApplicationProblemV1,
} from '../contracts'
import { parseApplicationVisualSceneV1 } from '../visual-model'
import { validateApplicationVisualScene } from '../visual-validator'
import {
  G6_RATIO_ALLOWED_STANDARD_CODES,
  G6_RATIO_FAMILIES,
  G6_RATIO_PART_WHOLE_CASES,
  G6_RATIO_PART_WHOLE_FAMILY,
  G6_RATIO_PART_WHOLE_PROOF_DOMAIN,
  G6_RATIO_RELATIVE_COMPARISON_BASE_CASES,
  G6_RATIO_RELATIVE_COMPARISON_CASES,
  G6_RATIO_RELATIVE_COMPARISON_FAMILY,
  G6_RATIO_RELATIVE_COMPARISON_PROOF_DOMAIN,
  G6_RATIO_REPRESENTATION_BASES,
  G6_RATIO_REPRESENTATION_CASES,
  G6_RATIO_REPRESENTATION_CHECK_FAMILY,
  G6_RATIO_REPRESENTATION_CHECK_PROOF_DOMAIN,
  findG6RatioScopeViolations,
  generateG6RatioPartWhole,
  generateG6RatioRelativeComparison,
  generateG6RatioRepresentationCheck,
  validateG6RatioPartWholeClosure,
  validateG6RatioRelativeComparisonClosure,
  validateG6RatioRepresentationCheckClosure,
} from './g6-ratio'
import {
  compareOracleFractions,
  evaluateG6RatioPartWholeOracle,
  evaluateG6RatioRelativeComparisonOracle,
  evaluateG6RatioRepresentationCheckOracle,
  normalizeOracleFraction,
} from './g6-ratio-oracle'

const PACK_ID = 'pack-unit-6-1-ratio'
const UNIT_ID = 'unit-6-1-ratio'

function proofKey(entry: { caseId: string; seed: number; variantIndex: number }): string {
  return JSON.stringify([entry.caseId, entry.seed, entry.variantIndex])
}

function expectCanonical(problem: GeneratedApplicationProblemV1): void {
  expect(parseGeneratedApplicationProblemV1(problem)).toEqual(problem)
  expect(problem.choices).toHaveLength(4)
  expect(new Set(problem.choices).size).toBe(4)
  expect(problem.choices?.[problem.correctChoiceIndex!]).toBe(problem.answer.normalized)
  const scene = parseApplicationVisualSceneV1(problem.visual.mathModel)
  expect(validateApplicationVisualScene(scene)).toMatchObject({ ok: true })
  expect(findG6RatioScopeViolations(problem)).toEqual([])
}

function oracleInput(problem: GeneratedApplicationProblemV1) {
  return {
    caseId: String(problem.params.caseId),
    seed: problem.seed,
    variantIndex: problem.variantIndex,
    params: problem.params,
    mathModel: problem.visual.mathModel,
  }
}

describe('Grade 6 ratio application family metadata', () => {
  it('keeps all three pack-bound V1 families approved, deterministic, and exhaustive', () => {
    expect(G6_RATIO_FAMILIES).toHaveLength(3)
    for (const family of G6_RATIO_FAMILIES) {
      expect(parseApplicationProblemFamilyV1(family)).toEqual(family)
      expect(family.packId).toBe(PACK_ID)
      expect(family.unitId).toBe(UNIT_ID)
      expect(family.releaseStatus).toBe('approved')
      expect(family.approval).toEqual({
        ownerStatus: 'approved',
        ownerId: 'project-owner',
        approvedAt: '2026-07-28T09:05:24Z',
        evidenceRefs: ['docs/reviews/application-problems-v1-approval.md'],
        expertStatus: 'not-reviewed',
      })
      expect(family.runtimeMode).toBe('deterministic-generator')
      expect(family.proofMode).toBe('exhaustive')
      expect(family.visualPolicy).toMatchObject({
        role: 'required',
        semantics: 'quantitative',
        answerCritical: true,
      })
      expect(findG6RatioScopeViolations(family)).toEqual([])
    }

    expect(G6_RATIO_PART_WHOLE_FAMILY).toMatchObject({
      conceptIds: ['ratio-part-whole-model'],
      cognitiveDomain: 'applying',
      reasoningPattern: 'multi_step',
      modelId: 'missing-part-to-whole-ratio',
      primaryStandard: '[6수02-02]',
      connectedStandards: ['[6수02-03]'],
    })
    expect(G6_RATIO_RELATIVE_COMPARISON_FAMILY).toMatchObject({
      conceptIds: ['ratio-relative-comparison'],
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'compare_methods',
      primaryStandard: '[6수02-03]',
      connectedStandards: ['[6수02-02]'],
    })
    expect(G6_RATIO_REPRESENTATION_CHECK_FAMILY).toMatchObject({
      conceptIds: ['ratio-representation-equivalence'],
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'error_analysis',
      primaryStandard: '[6수02-03]',
      connectedStandards: ['[6수02-02]'],
    })
  })

  it('detects standards and solution language outside the pilot scope', () => {
    expect(G6_RATIO_ALLOWED_STANDARD_CODES).toEqual(['[6수02-02]', '[6수02-03]'])
    expect(
      findG6RatioScopeViolations({
        ...G6_RATIO_PART_WHOLE_FAMILY,
        primaryStandard: '[6수02-04]',
      }),
    ).toContain('standard:[6수02-04]')
    const problem = generateG6RatioPartWhole({ seed: 0, variantIndex: 0 })
    expect(
      findG6RatioScopeViolations({
        ...problem,
        solutionSteps: [...problem.solutionSteps, '미지항이 있는 비례식을 세웁니다.'],
      }),
    ).toContain('language:비례식')
  })
})

describe('Grade 6 ratio exact finite domains', () => {
  it('enumerates the exact 12 × 4 × 3 part-whole domain', () => {
    expect(G6_RATIO_PART_WHOLE_CASES).toHaveLength(144)
    expect(G6_RATIO_PART_WHOLE_PROOF_DOMAIN).toHaveLength(144)
    expect(new Set(G6_RATIO_PART_WHOLE_PROOF_DOMAIN.map(proofKey)).size).toBe(144)
    expect(
      new Set(
        G6_RATIO_PART_WHOLE_CASES.map(
          ({ numerator, denominator, scale, contextIndex }) =>
            `${numerator}/${denominator}:${scale}:${contextIndex}`,
        ),
      ).size,
    ).toBe(144)
  })

  it('derives exactly 55 retained comparison bases and two placements', () => {
    expect(G6_RATIO_RELATIVE_COMPARISON_BASE_CASES).toHaveLength(55)
    for (const entry of G6_RATIO_RELATIVE_COMPARISON_BASE_CASES) {
      expect(entry.lowerSuccesses).toBeGreaterThan(entry.higherSuccesses)
      expect(entry.higherTotal).toBeLessThanOrEqual(60)
      expect(entry.lowerTotal).toBeLessThanOrEqual(60)
      expect(
        compareOracleFractions(
          BigInt(entry.higherSuccesses),
          BigInt(entry.higherTotal),
          BigInt(entry.lowerSuccesses),
          BigInt(entry.lowerTotal),
        ),
      ).toBeGreaterThan(0)
    }
    expect(G6_RATIO_RELATIVE_COMPARISON_CASES).toHaveLength(110)
    expect(G6_RATIO_RELATIVE_COMPARISON_PROOF_DOMAIN).toHaveLength(110)
    expect(new Set(G6_RATIO_RELATIVE_COMPARISON_PROOF_DOMAIN.map(proofKey)).size).toBe(110)
    const placements = new Map<number, Set<string>>()
    for (const entry of G6_RATIO_RELATIVE_COMPARISON_CASES) {
      const current = placements.get(entry.baseCaseIndex) ?? new Set<string>()
      current.add(entry.higherPlacement)
      placements.set(entry.baseCaseIndex, current)
    }
    expect(Array.from(placements.values()).every((values) => values.size === 2)).toBe(true)
  })

  it('enumerates 15 finite-decimal bases across three declared error modes', () => {
    expect(G6_RATIO_REPRESENTATION_BASES).toHaveLength(15)
    expect(G6_RATIO_REPRESENTATION_CASES).toHaveLength(45)
    expect(G6_RATIO_REPRESENTATION_CHECK_PROOF_DOMAIN).toHaveLength(45)
    expect(new Set(G6_RATIO_REPRESENTATION_CHECK_PROOF_DOMAIN.map(proofKey)).size).toBe(45)
    expect(
      new Set(G6_RATIO_REPRESENTATION_CASES.map((entry) => entry.errorMode)),
    ).toEqual(
      new Set(['decimal-percent-shift', 'reference-inversion', 'numerator-only']),
    )
    for (const entry of G6_RATIO_REPRESENTATION_BASES) {
      const decimal = entry.numerator / entry.denominator
      expect(Number.isInteger(decimal * 1_000)).toBe(true)
    }
  })
})

describe('Grade 6 ratio exhaustive generation and closure', () => {
  it('proves every part-whole case against the independent oracle', () => {
    const fingerprints = new Set<string>()
    for (const proofCase of G6_RATIO_PART_WHOLE_PROOF_DOMAIN) {
      const problem = generateG6RatioPartWhole(proofCase)
      expectCanonical(problem)
      expect(problem.answer.normalized).toBe(evaluateG6RatioPartWholeOracle(oracleInput(problem)))
      expect(validateG6RatioPartWholeClosure(problem)).toEqual({ ok: true, issues: [] })
      fingerprints.add(JSON.stringify([problem.params, problem.prompt]))
    }
    expect(fingerprints.size).toBe(144)
  })

  it('proves every comparison case by cross multiplication rather than absolute count', () => {
    const fingerprints = new Set<string>()
    for (const proofCase of G6_RATIO_RELATIVE_COMPARISON_PROOF_DOMAIN) {
      const problem = generateG6RatioRelativeComparison(proofCase)
      expectCanonical(problem)
      expect(problem.answer.normalized).toBe(
        evaluateG6RatioRelativeComparisonOracle(oracleInput(problem)),
      )
      expect(validateG6RatioRelativeComparisonClosure(problem)).toEqual({ ok: true, issues: [] })
      expect(Number(problem.params.lowerSuccesses)).toBeGreaterThan(
        Number(problem.params.higherSuccesses),
      )
      fingerprints.add(JSON.stringify([problem.params, problem.prompt]))
    }
    expect(fingerprints.size).toBe(110)
  })

  it('proves every representation claim set has one erroneous target', () => {
    const fingerprints = new Set<string>()
    for (const proofCase of G6_RATIO_REPRESENTATION_CHECK_PROOF_DOMAIN) {
      const problem = generateG6RatioRepresentationCheck(proofCase)
      expectCanonical(problem)
      expect(problem.answer.normalized).toBe(
        evaluateG6RatioRepresentationCheckOracle(oracleInput(problem)),
      )
      expect(validateG6RatioRepresentationCheckClosure(problem)).toEqual({ ok: true, issues: [] })
      expect(problem.prompt).toContain('잘못된 주장')
      expect(problem.choices?.filter((choice) => choice === problem.answer.normalized)).toHaveLength(1)
      fingerprints.add(JSON.stringify([problem.params, problem.prompt]))
    }
    expect(fingerprints.size).toBe(45)
  })

  it('selects without seed-plus-variant overflow and remains deterministic at safe-integer edges', () => {
    const generators = [
      [generateG6RatioPartWhole, 144],
      [generateG6RatioRelativeComparison, 110],
      [generateG6RatioRepresentationCheck, 45],
    ] as const
    for (const [generate, size] of generators) {
      for (const seed of [Number.MIN_SAFE_INTEGER, -1, 0, Number.MAX_SAFE_INTEGER]) {
        const input = { seed, variantIndex: Number.MAX_SAFE_INTEGER }
        const first = generate(input)
        const second = generate(input)
        expect(first).toEqual(second)
        const expectedIndex =
          (((seed % size) + size) % size + (Number.MAX_SAFE_INTEGER % size)) % size
        expect(first.params.caseIndex).toBe(expectedIndex)
      }
    }
  })

  it('rejects scene/params and answer mismatches in every family closure', () => {
    const fixtures = [
      [generateG6RatioPartWhole({ seed: 0, variantIndex: 0 }), validateG6RatioPartWholeClosure],
      [
        generateG6RatioRelativeComparison({ seed: 0, variantIndex: 0 }),
        validateG6RatioRelativeComparisonClosure,
      ],
      [
        generateG6RatioRepresentationCheck({ seed: 0, variantIndex: 0 }),
        validateG6RatioRepresentationCheckClosure,
      ],
    ] as const
    for (const [problem, validate] of fixtures) {
      const wrongAnswer = {
        ...problem,
        answer: { ...problem.answer, normalized: 'not-the-answer' },
      }
      expect(validate(wrongAnswer).ok).toBe(false)
      const wrongScene = {
        ...problem,
        visual: {
          ...problem.visual,
          mathModel: { schemaVersion: 'application-visual-v1', surface: 'table' },
        },
      }
      expect(validate(wrongScene).ok).toBe(false)
    }
  })
})

describe('independent BigInt rational oracle', () => {
  it('normalizes signs and equivalent fractions with gcd reduction', () => {
    expect(normalizeOracleFraction(BigInt(6), BigInt(8))).toBe('3/4')
    expect(normalizeOracleFraction(-BigInt(6), -BigInt(8))).toBe('3/4')
    expect(normalizeOracleFraction(BigInt(6), -BigInt(8))).toBe('-3/4')
    expect(normalizeOracleFraction(BigInt(0), BigInt(9))).toBe('0')
    expect(compareOracleFractions(BigInt(2), BigInt(3), BigInt(4), BigInt(6))).toBe(0)
    expect(compareOracleFractions(BigInt(7), BigInt(10), BigInt(3), BigInt(5))).toBeGreaterThan(0)
  })

  it('rejects zero denominators', () => {
    expect(() => normalizeOracleFraction(BigInt(1), BigInt(0))).toThrow(/denominator/i)
    expect(() =>
      compareOracleFractions(BigInt(1), BigInt(0), BigInt(1), BigInt(2)),
    ).toThrow(/denominator/i)
  })

  it('rejects each independently forged representation claim instead of echoing params', () => {
    const problem = generateG6RatioRepresentationCheck({ seed: 0, variantIndex: 0 })
    const referenceInversion = generateG6RatioRepresentationCheck({ seed: 1, variantIndex: 0 })
    const numeratorOnly = generateG6RatioRepresentationCheck({ seed: 2, variantIndex: 0 })
    const input = oracleInput(problem)
    for (const [key, forgedClaim] of [
      ['fractionClaim', referenceInversion.params.fractionClaim],
      ['decimalClaim', '소수 주장: 같은 비율은 0.5입니다.'],
      ['percentClaim', referenceInversion.params.percentClaim],
      ['hundredthsClaim', numeratorOnly.params.hundredthsClaim],
    ] as const) {
      expect(() =>
        evaluateG6RatioRepresentationCheckOracle({
          ...input,
          params: { ...input.params, [key]: forgedClaim },
        }),
      ).toThrow(/claim/i)
    }
  })

  it('derives the erroneous representation claim without trusting errorMode', () => {
    const problem = generateG6RatioRepresentationCheck({ seed: 0, variantIndex: 0 })
    const input = oracleInput(problem)
    expect(
      evaluateG6RatioRepresentationCheckOracle({
        ...input,
        params: { ...input.params, errorMode: 'forged-mode' },
      }),
    ).toBe(problem.params.percentClaim)
  })

  it('rejects a zero raw denominator before evaluating representation claims', () => {
    const problem = generateG6RatioRepresentationCheck({ seed: 0, variantIndex: 0 })
    const input = oracleInput(problem)
    expect(() =>
      evaluateG6RatioRepresentationCheckOracle({
        ...input,
        params: { ...input.params, denominator: 0 },
      }),
    ).toThrow(/denominator/i)
  })
})

describe('Grade 6 family structural diversity', () => {
  it('uses different models, reasoning patterns, surfaces, and learner tasks', () => {
    const problems = [
      generateG6RatioPartWhole({ seed: 0, variantIndex: 0 }),
      generateG6RatioRelativeComparison({ seed: 0, variantIndex: 0 }),
      generateG6RatioRepresentationCheck({ seed: 0, variantIndex: 0 }),
    ]
    expect(new Set(G6_RATIO_FAMILIES.map((family) => family.modelId)).size).toBe(3)
    expect(new Set(G6_RATIO_FAMILIES.map((family) => family.reasoningPattern)).size).toBe(3)
    expect(problems.map((problem) => (problem.visual.mathModel as { surface: string }).surface)).toEqual([
      'diagram',
      'table',
      'table',
    ])
    expect(problems[0].prompt).toContain('나머지')
    expect(problems[1].prompt).toContain('성공 비율')
    expect(problems[2].prompt).toContain('잘못된 주장')
  })
})
