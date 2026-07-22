import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { parseApplicationProblemFamilyV1, type JsonValue } from '../contracts'
import { createApplicationProofManifestDigest } from '../proof'
import { parseApplicationVisualSceneV1 } from '../visual-model'
import { validateApplicationVisualScene } from '../visual-validator'
import {
  G5_AREA_COMPOSITE_INVERSE_DOMAIN_SIZE,
  G5_AREA_COMPOSITE_INVERSE_FAMILY,
  G5_AREA_OVERLAP_RECONSTRUCTION_DOMAIN_SIZE,
  G5_AREA_OVERLAP_RECONSTRUCTION_FAMILY,
  G5_PERIMETER_BOUNDARY_REBUILD_DOMAIN_SIZE,
  G5_PERIMETER_BOUNDARY_REBUILD_FAMILY,
  buildG5AreaCompositeInverseScene,
  buildG5AreaOverlapReconstructionScene,
  buildG5PerimeterBoundaryRebuildScene,
  generateG5AreaCompositeInverseProblem,
  generateG5AreaOverlapReconstructionProblem,
  generateG5PerimeterBoundaryRebuildProblem,
  selectG5AreaCompositeInverseParams,
  selectG5AreaOverlapReconstructionParams,
  selectG5PerimeterBoundaryRebuildParams,
} from './grade5-geometry-families'
import {
  evaluateG5AreaCompositeInverseOracle,
  measureCompositeInverseModel,
} from './g5-area-composite-inverse-oracle'
import {
  evaluateG5AreaOverlapReconstructionOracle,
  measureOverlapReconstructionModel,
} from './g5-area-overlap-reconstruction-oracle'
import {
  evaluateG5PerimeterBoundaryRebuildOracle,
  measureBoundaryRebuildModel,
} from './g5-perimeter-boundary-rebuild-oracle'
import {
  G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1,
  G5_GEOMETRY_PROOF_DEPENDENCY_RECORDS_V1,
  G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1,
} from './grade5-geometry-proof-registration'
import {
  validateGrade5ApplicationGeometryScene,
} from './grade5-geometry-visual-validator'

const PACK_ID = 'pack-unit-5-1-perimeter-area'
const UNIT_ID = 'unit-5-1-perimeter-area'

function proofInput(problem: ReturnType<typeof generateG5PerimeterBoundaryRebuildProblem>) {
  return {
    caseId: 'complete-domain',
    seed: problem.seed,
    variantIndex: problem.variantIndex,
    params: problem.params,
    mathModel: problem.visual.mathModel,
  }
}

describe('Grade 5 quantitative geometry family metadata', () => {
  it('keeps all three family versions draft, pending, deterministic, and exhaustive', () => {
    const families = [
      G5_PERIMETER_BOUNDARY_REBUILD_FAMILY,
      G5_AREA_COMPOSITE_INVERSE_FAMILY,
      G5_AREA_OVERLAP_RECONSTRUCTION_FAMILY,
    ].map(parseApplicationProblemFamilyV1)

    expect(families.map((family) => family.familyId)).toEqual([
      'g5-perimeter-boundary-rebuild',
      'g5-area-composite-inverse',
      'g5-area-overlap-reconstruction',
    ])
    for (const family of families) {
      expect(family.packId).toBe(PACK_ID)
      expect(family.unitId).toBe(UNIT_ID)
      expect(family.releaseStatus).toBe('draft')
      expect(family.approval).toEqual({
        ownerStatus: 'pending',
        evidenceRefs: [],
        expertStatus: 'not-reviewed',
      })
      expect(family.runtimeMode).toBe('deterministic-generator')
      expect(family.proofMode).toBe('exhaustive')
      expect(family.visualPolicy).toMatchObject({
        role: 'required',
        semantics: 'quantitative',
        answerCritical: true,
      })
    }
    expect(G5_PERIMETER_BOUNDARY_REBUILD_FAMILY).toMatchObject({
      cognitiveDomain: 'applying',
      reasoningPattern: 'representation_shift',
      conceptIds: ['perimeter-boundary-reconstruction'],
      primaryStandard: '[6수03-11]',
      connectedStandards: [],
    })
    expect(G5_AREA_COMPOSITE_INVERSE_FAMILY).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'inverse',
      conceptIds: ['rectangle-area-inverse-composition'],
      primaryStandard: '[6수03-13]',
      connectedStandards: ['[6수03-11]'],
    })
    expect(G5_AREA_OVERLAP_RECONSTRUCTION_FAMILY).toMatchObject({
      cognitiveDomain: 'reasoning',
      reasoningPattern: 'model_and_check',
      conceptIds: ['polygon-area-recomposition'],
      primaryStandard: '[6수03-14]',
      connectedStandards: ['[6수03-13]'],
    })
  })

  it('replays canonical problems for negative and extreme seeds without overflowing selection', () => {
    const generators = [
      {
        size: G5_PERIMETER_BOUNDARY_REBUILD_DOMAIN_SIZE,
        select: selectG5PerimeterBoundaryRebuildParams,
        generate: generateG5PerimeterBoundaryRebuildProblem,
      },
      {
        size: G5_AREA_COMPOSITE_INVERSE_DOMAIN_SIZE,
        select: selectG5AreaCompositeInverseParams,
        generate: generateG5AreaCompositeInverseProblem,
      },
      {
        size: G5_AREA_OVERLAP_RECONSTRUCTION_DOMAIN_SIZE,
        select: selectG5AreaOverlapReconstructionParams,
        generate: generateG5AreaOverlapReconstructionProblem,
      },
    ]
    const floorMod = (value: number, modulus: number) => ((value % modulus) + modulus) % modulus
    for (const generator of generators) {
      for (const seed of [Number.MIN_SAFE_INTEGER, -1, 0, Number.MAX_SAFE_INTEGER]) {
        for (const variantIndex of [0, generator.size - 1, Number.MAX_SAFE_INTEGER]) {
          const canonicalIndex = (
            floorMod(seed, generator.size) + (variantIndex % generator.size)
          ) % generator.size
          expect(generator.select(seed, variantIndex)).toEqual(generator.select(0, canonicalIndex))
          expect(generator.generate({ seed, variantIndex })).toEqual(
            generator.generate({ seed, variantIndex }),
          )
        }
      }
    }
  })

  it('exports pending authority sources and literal digest registrations without a trust registry', () => {
    expect(G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1).toHaveLength(3)
    expect(G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1.map((entry) => entry.expectedCount)).toEqual([
      1024,
      108,
      243,
    ])
    for (const source of G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1) {
      expect(source.reviewStatus).toBe('pending')
      expect(source.domainDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
      expect(source.sourceDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
      expect(source.domain).toHaveLength(source.expectedCount)
      expect(source.domainDigest).toBe(
        createApplicationProofManifestDigest(source.domain as unknown as JsonValue),
      )
      const sourceBytes = readFileSync(join(process.cwd(), source.sourceModule))
      expect(source.sourceDigest).toBe(`sha256:${createHash('sha256').update(sourceBytes).digest('hex')}`)
    }
    expect(G5_GEOMETRY_PROOF_DEPENDENCY_RECORDS_V1.length).toBeGreaterThanOrEqual(6)
    expect(G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1).toHaveLength(6)
    for (const entry of G5_GEOMETRY_PROOF_DEPENDENCY_RECORDS_V1) {
      expect(entry.digest).toMatch(/^sha256:[a-f0-9]{64}$/)
      const sourceBytes = readFileSync(join(process.cwd(), entry.sourceModule))
      expect(entry.digest).toBe(`sha256:${createHash('sha256').update(sourceBytes).digest('hex')}`)
    }
    for (const entry of G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1) {
      expect(entry.sourceDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
      const sourceBytes = readFileSync(join(process.cwd(), entry.sourceModule))
      expect(entry.sourceDigest).toBe(`sha256:${createHash('sha256').update(sourceBytes).digest('hex')}`)
    }
  })
})

describe('g5-perimeter-boundary-rebuild', () => {
  it('exhausts 1024 stable corner-notch constructions with an independent Manhattan oracle', () => {
    const combinations = new Set<string>()
    const signatures = new Set<string>()
    for (let variantIndex = 0; variantIndex < G5_PERIMETER_BOUNDARY_REBUILD_DOMAIN_SIZE; variantIndex += 1) {
      const params = selectG5PerimeterBoundaryRebuildParams(0, variantIndex)
      combinations.add(JSON.stringify(params))
      signatures.add(`${params.rotation}:${params.width > params.height}`)
      const problem = generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex })
      const scene = parseApplicationVisualSceneV1(problem.visual.mathModel)
      const common = validateApplicationVisualScene(scene)
      expect(common.ok).toBe(true)
      expect(validateGrade5ApplicationGeometryScene(problem.familyId, scene)).toEqual([])
      const measured = measureBoundaryRebuildModel(params)
      expect(measured.perimeter).toBe(2 * (params.width + params.height))
      expect(problem.answer.normalized).toBe(evaluateG5PerimeterBoundaryRebuildOracle(proofInput(problem)))
      expect(problem.visual.mathModel).toEqual(buildG5PerimeterBoundaryRebuildScene(params))
    }
    expect(combinations.size).toBe(1024)
    expect(signatures.size).toBeGreaterThanOrEqual(4)
  })

  it('uses safe floor-mod selection for negative and extreme safe seeds', () => {
    for (const seed of [Number.MIN_SAFE_INTEGER, -1025, -1, 0, 1, Number.MAX_SAFE_INTEGER]) {
      for (const variantIndex of [0, 1, 1023, Number.MAX_SAFE_INTEGER]) {
        const first = selectG5PerimeterBoundaryRebuildParams(seed, variantIndex)
        const repeat = selectG5PerimeterBoundaryRebuildParams(seed, variantIndex)
        expect(repeat).toEqual(first)
      }
    }
    expect(() => selectG5PerimeterBoundaryRebuildParams(0.5, 0)).toThrow(/safe integer/i)
    expect(() => buildG5PerimeterBoundaryRebuildScene({
      width: 12,
      height: 9,
      notchWidth: 12,
      notchHeight: 2,
      rotation: 0,
    })).toThrow(/notch/i)
  })
})

describe('g5-area-composite-inverse', () => {
  it('exhausts 108 full-edge attachments and independently verifies area and exposed perimeter', () => {
    const combinations = new Set<string>()
    const signatures = new Set<string>()
    for (let variantIndex = 0; variantIndex < G5_AREA_COMPOSITE_INVERSE_DOMAIN_SIZE; variantIndex += 1) {
      const params = selectG5AreaCompositeInverseParams(0, variantIndex)
      combinations.add(JSON.stringify(params))
      signatures.add(String(params.attachmentPosition))
      const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex })
      const scene = parseApplicationVisualSceneV1(problem.visual.mathModel)
      expect(validateApplicationVisualScene(scene).ok).toBe(true)
      expect(validateGrade5ApplicationGeometryScene(problem.familyId, scene)).toEqual([])
      const measured = measureCompositeInverseModel(params)
      expect(measured.area).toBe(params.totalArea)
      expect(measured.inferredWidth).toBe(params.rectangleWidth)
      expect(measured.exposedPerimeter).toBe(2 * params.rectangleWidth + 4 * params.squareSide)
      expect(problem.answer.normalized).toBe(evaluateG5AreaCompositeInverseOracle(proofInput(problem)))
      expect(problem.visual.mathModel).toEqual(buildG5AreaCompositeInverseScene(params))
    }
    expect(combinations.size).toBe(108)
    expect(signatures).toEqual(new Set(['0', '1', '2']))
  })

  it('rejects impossible area and attachment data instead of drawing a fallback', () => {
    const valid = selectG5AreaCompositeInverseParams(0, 0)
    expect(() => buildG5AreaCompositeInverseScene({ ...valid, totalArea: valid.totalArea + 1 })).toThrow(/area/i)
    expect(() => buildG5AreaCompositeInverseScene({ ...valid, attachmentPosition: 3 as 0 })).toThrow(/attachment/i)
    for (const seed of [Number.MIN_SAFE_INTEGER, -109, -1, Number.MAX_SAFE_INTEGER]) {
      expect(selectG5AreaCompositeInverseParams(seed, Number.MAX_SAFE_INTEGER)).toEqual(
        selectG5AreaCompositeInverseParams(seed, Number.MAX_SAFE_INTEGER),
      )
    }
  })
})

describe('g5-area-overlap-reconstruction', () => {
  it('exhausts 243 convex three-polygon topologies and independently clips every atomic region', () => {
    const combinations = new Set<string>()
    const zeroPairs = new Set<string>()
    for (let variantIndex = 0; variantIndex < G5_AREA_OVERLAP_RECONSTRUCTION_DOMAIN_SIZE; variantIndex += 1) {
      const params = selectG5AreaOverlapReconstructionParams(0, variantIndex)
      combinations.add(JSON.stringify(params))
      zeroPairs.add(params.zeroPair)
      const problem = generateG5AreaOverlapReconstructionProblem({ seed: 0, variantIndex })
      const scene = parseApplicationVisualSceneV1(problem.visual.mathModel)
      const common = validateApplicationVisualScene(scene)
      if (!common.ok) throw new Error(JSON.stringify(common.issues))
      expect(validateGrade5ApplicationGeometryScene(problem.familyId, scene)).toEqual([])
      const measured = measureOverlapReconstructionModel(params)
      expect(measured.shapeAreas.A).toBeCloseTo(params.shapeArea, 9)
      expect(measured.shapeAreas.B).toBeCloseTo(params.shapeArea, 9)
      expect(measured.shapeAreas.C).toBeCloseTo(params.shapeArea, 9)
      expect(measured.atomicAreas[params.zeroPair]).toBeCloseTo(0, 9)
      expect(measured.atomicAreas[params.targetPair]).toBeCloseTo(params.targetOverlap, 9)
      expect(problem.answer.normalized).toBe(evaluateG5AreaOverlapReconstructionOracle(proofInput(problem)))
      expect(problem.visual.mathModel).toEqual(buildG5AreaOverlapReconstructionScene(params))
      if (scene.surface !== 'diagram') throw new Error('expected a diagram')
      expect(scene.labels.some((label) => {
        const pair = label.key.match(/^region-(ab|ac|bc)-(?:answer-)?label$/)?.[1]
        return pair === params.zeroPair
      })).toBe(false)
    }
    expect(combinations.size).toBe(243)
    expect(zeroPairs).toEqual(new Set(['ab', 'ac', 'bc']))
  })

  it('fails closed for unsupported overlap topologies and inconsistent scene data', () => {
    const valid = selectG5AreaOverlapReconstructionParams(0, 0)
    expect(() => buildG5AreaOverlapReconstructionScene({ ...valid, targetOverlap: 0 })).toThrow(/positive/i)
    expect(() => buildG5AreaOverlapReconstructionScene({ ...valid, shapeArea: valid.shapeArea + 1 })).toThrow(/shape area/i)
    const scene = buildG5AreaOverlapReconstructionScene(valid)
    if (scene.surface !== 'diagram') throw new Error('expected a diagram')
    const tampered = {
      ...scene,
      primitives: scene.primitives.map((primitive, index) =>
        index === 0 && primitive.kind === 'polygon'
          ? { ...primitive, points: primitive.points.map((point, pointIndex) => pointIndex === 0 ? { ...point, x: point.x + 0.5 } : point) }
          : primitive,
      ),
    }
    expect(validateGrade5ApplicationGeometryScene(
      G5_AREA_OVERLAP_RECONSTRUCTION_FAMILY.familyId,
      tampered,
    ).length).toBeGreaterThan(0)
    for (const seed of [Number.MIN_SAFE_INTEGER, -244, -1, Number.MAX_SAFE_INTEGER]) {
      expect(selectG5AreaOverlapReconstructionParams(seed, Number.MAX_SAFE_INTEGER)).toEqual(
        selectG5AreaOverlapReconstructionParams(seed, Number.MAX_SAFE_INTEGER),
      )
    }
  })
})
