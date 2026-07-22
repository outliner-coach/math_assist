import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import g2LengthPack from '../../../../public/data/application-problems/packs/g2-2-length.json'
import type { JsonValue } from '../contracts'
import { createApplicationProofManifestDigest } from '../proof'
import {
  createTestApplicationProofAuthorityRegistryV1,
  createTestApplicationProofImplementationRegistryV1,
  runTestApplicationProblemProofEngineV1,
} from '../__test-support__/proof-trust'
import { resolveApplicationVisual } from '../visual-validator'
import {
  G2_LENGTH_ROUTE_TOTAL_CASES,
  G2_LENGTH_ROUTE_TOTAL_FAMILY,
  generateG2LengthRouteTotal,
  validateG2LengthRouteTotalScene,
} from './g2-length-route-total'
import { evaluateG2LengthRouteTotalOracle } from './g2-length-route-total.oracle'
import {
  G2_LENGTH_MISSING_SEGMENT_CASES,
  G2_LENGTH_MISSING_SEGMENT_FAMILY,
  generateG2LengthMissingSegment,
  validateG2LengthMissingSegmentScene,
} from './g2-length-missing-segment'
import { evaluateG2LengthMissingSegmentOracle } from './g2-length-missing-segment.oracle'
import {
  G2_LENGTH_CLAIM_CHECK_BASE_CASES,
  G2_LENGTH_CLAIM_CHECK_CASES,
  G2_LENGTH_CLAIM_CHECK_FAMILY,
  generateG2LengthClaimCheck,
  validateG2LengthClaimCheckScene,
} from './g2-length-claim-check'
import { evaluateG2LengthClaimCheckOracle } from './g2-length-claim-check.oracle'
import {
  G2_LENGTH_EXHAUSTIVE_PROOFS,
  G2_LENGTH_PROOF_AUTHORITY_ENTRIES,
  G2_LENGTH_PROOF_DEPENDENCIES,
  G2_LENGTH_PROOF_IMPLEMENTATIONS,
} from './g2-length-proof-registration'

const familyCases = [
  {
    family: G2_LENGTH_ROUTE_TOTAL_FAMILY,
    cases: G2_LENGTH_ROUTE_TOTAL_CASES,
    generate: generateG2LengthRouteTotal,
    oracle: evaluateG2LengthRouteTotalOracle,
    validate: validateG2LengthRouteTotalScene,
  },
  {
    family: G2_LENGTH_MISSING_SEGMENT_FAMILY,
    cases: G2_LENGTH_MISSING_SEGMENT_CASES,
    generate: generateG2LengthMissingSegment,
    oracle: evaluateG2LengthMissingSegmentOracle,
    validate: validateG2LengthMissingSegmentScene,
  },
  {
    family: G2_LENGTH_CLAIM_CHECK_FAMILY,
    cases: G2_LENGTH_CLAIM_CHECK_CASES,
    generate: generateG2LengthClaimCheck,
    oracle: evaluateG2LengthClaimCheckOracle,
    validate: validateG2LengthClaimCheckScene,
  },
] as const

function withoutProvenance(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(params).filter(([key]) => key !== '__generation'))
}

function sourceDigest(sourceModule: string): string {
  const bytes = readFileSync(resolve(process.cwd(), sourceModule))
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`
}

describe('Grade 2 length application families', () => {
  it('keeps all three pilots draft, pending, exhaustive, deterministic, and pack-linked', () => {
    const conceptIds = new Set(g2LengthPack.concepts.map((concept) => concept.conceptId))
    const misconceptionIds = new Set(
      g2LengthPack.concepts.flatMap((concept) =>
        concept.misconceptions.map((misconception) => misconception.id),
      ),
    )

    expect(g2LengthPack.coverageStatus).toBe('pilot')
    for (const { family } of familyCases) {
      expect(family).toMatchObject({
        packId: 'pack-g2-2-length',
        unitId: 'g2-2-length',
        primaryStandard: '[2수03-13]',
        connectedStandards: ['[2수03-11]'],
        releaseStatus: 'draft',
        proofMode: 'exhaustive',
        runtimeMode: 'deterministic-generator',
        approval: {
          ownerStatus: 'pending',
          evidenceRefs: [],
          expertStatus: 'not-reviewed',
        },
      })
      expect(family.conceptIds.every((conceptId) => conceptIds.has(conceptId))).toBe(true)
      expect(
        family.misconceptionRefs.every((misconceptionId) =>
          misconceptionIds.has(misconceptionId),
        ),
      ).toBe(true)
      expect(family.visualPolicy).toMatchObject({
        role: 'required',
        semantics: 'quantitative',
        answerCritical: true,
      })
    }
  })

  it('uses genuinely different family structures', () => {
    expect(
      new Set(
        familyCases.map(({ family }) =>
          [
            family.cognitiveDomain,
            family.reasoningPattern,
            family.modelId,
            family.unknownRole,
            family.requiredStudentActions.join(','),
          ].join('|'),
        ),
      ).size,
    ).toBe(3)

    expect(G2_LENGTH_ROUTE_TOTAL_FAMILY).toMatchObject({
      cognitiveDomain: 'applying',
      reasoningPattern: 'representation_shift',
      modelId: 'length-route-segment-sum-v1',
      unknownRole: 'total-route-length',
      visualPolicy: { generatorId: 'g2-length-route-bars' },
    })
    expect(G2_LENGTH_MISSING_SEGMENT_FAMILY).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'inverse',
      modelId: 'length-segmented-whole-v1',
      unknownRole: 'missing-segment-length',
    })
    expect(G2_LENGTH_CLAIM_CHECK_FAMILY).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'error_analysis',
      modelId: 'length-claim-validity-v1',
      unknownRole: 'valid-speaker',
    })
  })

  it.each(familyCases)(
    'exhausts every $family.familyId case with unique provenance, oracle agreement, and a valid scene',
    ({ family, cases, generate, oracle, validate }) => {
      const problems = cases.map((_, variantIndex) => generate({ seed: 0, variantIndex }))

      expect(new Set(problems.map((problem) => problem.instanceId)).size).toBe(cases.length)
      expect(
        new Set(problems.map((problem) => JSON.stringify(withoutProvenance(problem.params)))).size,
      ).toBe(cases.length)

      problems.forEach((problem, variantIndex) => {
        expect(problem).toEqual(generate({ seed: 0, variantIndex }))
        expect(problem.instanceId).toBe(`${family.familyId}@1:0:${variantIndex}`)
        expect(problem.curriculumCodes).toEqual(['[2수03-13]', '[2수03-11]'])
        expect(problem.answer.normalized).toBe(
          oracle({
            caseId: `${family.familyId}-${variantIndex}`,
            seed: 0,
            variantIndex,
            params: problem.params,
            mathModel: problem.visual.mathModel,
          }),
        )
        const resolution = resolveApplicationVisual(problem.visual, {
          familyValidator: (scene) => validate(scene, problem.params),
        })
        expect(resolution.status).toBe('ready')
      })
    },
  )

  it('covers the exact 18, 54, and 32 finite domains', () => {
    expect(G2_LENGTH_ROUTE_TOTAL_CASES).toHaveLength(18)
    expect(G2_LENGTH_MISSING_SEGMENT_CASES).toHaveLength(54)
    expect(G2_LENGTH_CLAIM_CHECK_BASE_CASES).toHaveLength(16)
    expect(G2_LENGTH_CLAIM_CHECK_CASES).toHaveLength(32)
    expect(
      new Set(G2_LENGTH_CLAIM_CHECK_BASE_CASES.map((entry) => entry.wrongStrategy)),
    ).toEqual(
      new Set([
        'meter-tenfold-add',
        'mixed-concat-add',
        'operate-before-alignment',
        'missing-addition',
      ]),
    )
  })

  it('uses overflow-safe stable selection for negative and maximum safe seeds', () => {
    for (const { cases, generate } of familyCases) {
      for (const [seed, variantIndex] of [
        [-1, 0],
        [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
        [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
      ] as const) {
        const expectedIndex = (((seed % cases.length) + cases.length) % cases.length +
          (variantIndex % cases.length)) % cases.length
        const problem = generate({ seed, variantIndex })
        expect(withoutProvenance(problem.params)).toEqual(cases[expectedIndex])
        expect(problem).toEqual(generate({ seed, variantIndex }))
      }
    }
  })

  it('keeps number and choice answers canonical', () => {
    for (const variantIndex of Array.from(G2_LENGTH_ROUTE_TOTAL_CASES.keys())) {
      const problem = generateG2LengthRouteTotal({ seed: 0, variantIndex })
      expect(problem.answer.format).toBe('number')
      expect(Number.isSafeInteger(Number(problem.answer.normalized))).toBe(true)
    }
    for (const variantIndex of Array.from(G2_LENGTH_MISSING_SEGMENT_CASES.keys())) {
      const problem = generateG2LengthMissingSegment({ seed: 0, variantIndex })
      expect(problem.answer.format).toBe('number')
      expect(Number(problem.answer.normalized)).toBeGreaterThan(0)
    }
    for (const variantIndex of Array.from(G2_LENGTH_CLAIM_CHECK_CASES.keys())) {
      const problem = generateG2LengthClaimCheck({ seed: 0, variantIndex })
      expect(problem.answer.format).toBe('choice')
      expect(problem.choices).toHaveLength(2)
      expect(new Set(problem.choices)).toEqual(new Set(['가', '나']))
      expect(problem.choices?.[problem.correctChoiceIndex!]).toBe(problem.answer.normalized)
      expect(['가', '나']).toContain(problem.answer.normalized)
    }
  })

  it('keeps all quantitative bars connected and exactly proportional in cm coordinates', () => {
    for (const { cases, generate } of familyCases) {
      cases.forEach((_, variantIndex) => {
        const problem = generate({ seed: 0, variantIndex })
        const params = problem.params
        let expected: [number, number, number]
        if (problem.familyId === 'g2-length-route-total') {
          expected = [Number(params.longCm), Number(params.middleCm), Number(params.lastCm)]
        } else if (
          problem.familyId === 'g2-length-claim-check' &&
          params.scenario === 'route-total'
        ) {
          expected = [Number(params.longCm), Number(params.middleCm), Number(params.lastCm)]
        } else {
          const missing = Number(params.totalCm) - Number(params.knownA) - Number(params.knownB)
          const known = [Number(params.knownA), Number(params.knownB)]
          let knownIndex = 0
          expected = [0, 1, 2].map((position) => {
            if (position === Number(params.missingPosition)) return missing
            const value = known[knownIndex]
            knownIndex += 1
            return value
          }) as [number, number, number]
        }

        const scene = problem.visual.mathModel as unknown as {
          scale: { x: number; y: number }
          primitives: Array<{
            key: string
            kind: string
            x1: number
            x2: number
          }>
        }
        const segments = [0, 1, 2].map((index) =>
          scene.primitives.find((primitive) => primitive.key === `segment-${index}`)!,
        )
        const measured = segments.map((segment) => segment.x2 - segment.x1)
        expect(scene.scale).toEqual({ x: 1, y: 1 })
        expect(measured).toEqual(expected)
        expect(segments[0].x2).toBe(segments[1].x1)
        expect(segments[1].x2).toBe(segments[2].x1)
        expect(measured[0] / measured[1]).toBe(expected[0] / expected[1])
        expect(measured[1] / measured[2]).toBe(expected[1] / expected[2])
      })
    }
  })

  it('rejects all three required scenes when geometry and constraints drift from params together', () => {
    for (const { generate, validate } of familyCases) {
      const problem = generate({ seed: 0, variantIndex: 0 })
      const scene = structuredClone(problem.visual.mathModel!) as {
        primitives: Array<Record<string, unknown>>
        constraints: Array<Record<string, unknown>>
      }
      scene.primitives[0].x2 = Number(scene.primitives[0].x2) + 1
      scene.constraints[0].expected = Number(scene.constraints[0].expected) + 1

      const resolution = resolveApplicationVisual(
        { ...problem.visual, mathModel: scene as unknown as JsonValue },
        { familyValidator: (candidate) => validate(candidate, problem.params) },
      )

      expect(resolution.status).toBe('blocked')
      if (resolution.status === 'blocked') {
        expect(resolution.issues.map((entry) => entry.code)).toContain(
          'g2_length_scene_params_mismatch',
        )
      }
    }
  })

  it('pins literal domain digests and proves every registered finite case', () => {
    const authorityRegistry = createTestApplicationProofAuthorityRegistryV1(
      G2_LENGTH_PROOF_AUTHORITY_ENTRIES,
    )
    const implementationRegistry = createTestApplicationProofImplementationRegistryV1({
      dependencies: G2_LENGTH_PROOF_DEPENDENCIES,
      implementations: G2_LENGTH_PROOF_IMPLEMENTATIONS,
    })

    G2_LENGTH_PROOF_AUTHORITY_ENTRIES.forEach((authority) => {
      expect(authority.manifest.domainDigest).toBe(
        createApplicationProofManifestDigest(authority.domain as unknown as JsonValue),
      )
      expect(authority.manifest.expectedCount).toBe(authority.domain.length)
    })

    G2_LENGTH_EXHAUSTIVE_PROOFS.forEach((proof) => {
      const report = runTestApplicationProblemProofEngineV1(
        proof,
        authorityRegistry,
        implementationRegistry,
      )
      expect(report.proven, JSON.stringify(report.issues)).toBe(true)
      expect(report.checkedCount).toBe(
        proof.domain.cases.length * proof.domain.variantIndexes.length,
      )
    })
  })

  it('pins every authority, dependency, and implementation digest to actual source bytes', () => {
    G2_LENGTH_PROOF_AUTHORITY_ENTRIES.forEach((authority) => {
      expect(authority.manifest.sourceDigest).toBe(
        sourceDigest(authority.manifest.sourceModule),
      )
    })
    G2_LENGTH_PROOF_DEPENDENCIES.forEach((dependency) => {
      expect(dependency.digest).toBe(sourceDigest(dependency.sourceModule))
    })
    G2_LENGTH_PROOF_IMPLEMENTATIONS.forEach((implementation) => {
      expect(implementation.sourceDigest).toBe(sourceDigest(implementation.sourceModule))
    })
  })
})
