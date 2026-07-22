import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  parseApplicationProblemFamilyV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from '../contracts'
import { createApplicationProofManifestDigest } from '../proof'
import { applicationProofDependencyClosureV1 } from '../proof-trust.internal'
import { createTestApplicationProofImplementationRegistryV1 } from '../__test-support__/proof-trust'
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
  validateGrade5ApplicationGeometryProblem,
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
    expect(G5_GEOMETRY_PROOF_DEPENDENCY_RECORDS_V1).toHaveLength(9)
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

  it('records the complete common runtime dependency closure for every generator', () => {
    const commonInfrastructureIds = [
      'application-problem-generator-infrastructure',
      'application-problem-contracts-infrastructure',
      'application-problem-random-infrastructure',
    ]
    const registry = createTestApplicationProofImplementationRegistryV1({
      dependencies: G5_GEOMETRY_PROOF_DEPENDENCY_RECORDS_V1,
      implementations: G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1,
    })
    const dependencies = new Map(
      G5_GEOMETRY_PROOF_DEPENDENCY_RECORDS_V1.map((entry) => [entry.dependencyId, entry]),
    )
    const generatorInfrastructure = dependencies.get(commonInfrastructureIds[0])

    for (const dependencyId of commonInfrastructureIds) {
      expect(dependencies.get(dependencyId)?.kind).toBe('infrastructure')
    }
    expect(generatorInfrastructure?.sourceModule).toBe('src/lib/application-problems/generator.ts')
    expect(generatorInfrastructure?.imports.map((entry) => entry.dependencyId).sort()).toEqual(
      commonInfrastructureIds.slice(1).sort(),
    )
    expect(dependencies.get(commonInfrastructureIds[1])?.sourceModule).toBe(
      'src/lib/application-problems/contracts.ts',
    )
    expect(dependencies.get(commonInfrastructureIds[1])?.imports).toEqual([])
    expect(dependencies.get(commonInfrastructureIds[2])?.sourceModule).toBe(
      'src/lib/application-problems/random.ts',
    )
    expect(dependencies.get(commonInfrastructureIds[2])?.imports).toEqual([])

    for (const authority of G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1) {
      expect(authority.allowedSharedInfrastructure).toEqual([])
    }

    const generatorRegistrations = G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1.filter(
      (entry) => entry.kind === 'generator',
    )
    for (const registration of generatorRegistrations) {
      const root = dependencies.get(registration.rootDependency.dependencyId)
      expect(root?.imports.map((entry) => entry.dependencyId)).toEqual([
        'application-problem-generator-infrastructure',
      ])
      const closure = applicationProofDependencyClosureV1(registry, registration.rootDependency)
      expect(new Set(Array.from(closure.values()).map((entry) => entry.dependencyId))).toEqual(new Set([
        `${registration.implementationId}-root`,
        ...commonInfrastructureIds,
      ]))
      const familyId = registration.implementationId.replace(/-generator$/, '')
      const oracle = G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1.find(
        (entry) => entry.kind === 'oracle' && entry.implementationId === `${familyId}-oracle`,
      )
      if (!oracle) throw new Error(`missing oracle registration for ${familyId}`)
      const oracleRoot = dependencies.get(oracle.rootDependency.dependencyId)
      expect(oracleRoot?.imports).toEqual([])
      const oracleClosure = applicationProofDependencyClosureV1(registry, oracle.rootDependency)
      expect(Array.from(oracleClosure.values()).map((entry) => entry.dependencyId)).toEqual([
        `${oracle.implementationId}-root`,
      ])
      const shared = Array.from(closure.keys()).filter((key) => oracleClosure.has(key))
      expect(shared).toEqual([])
    }
  })
})

describe('Grade 5 canonical problem binding', () => {
  const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 0 })
  const scene = parseApplicationVisualSceneV1(problem.visual.mathModel)

  it.each([
    ['schema version', { ...problem, schemaVersion: 'forged-schema' }],
    ['instance id', { ...problem, instanceId: 'forged-instance' }],
    ['family id', { ...problem, familyId: 'forged-family' }],
    ['generator version', { ...problem, generatorVersion: problem.generatorVersion + 1 }],
    ['pack id', { ...problem, packId: 'forged-pack' }],
    ['pack version', { ...problem, packVersion: problem.packVersion + 1 }],
    ['seed', { ...problem, seed: problem.seed + 1 }],
    ['variant index', { ...problem, variantIndex: problem.variantIndex + 1 }],
    ['curriculum codes', { ...problem, curriculumCodes: ['[forged]'] }],
  ])('rejects a mismatched canonical %s', (_name, forged) => {
    expect(validateGrade5ApplicationGeometryProblem(
      forged as unknown as GeneratedApplicationProblemV1,
      scene,
    ).length).toBeGreaterThan(0)
  })

  it.each([
    ['role', { ...problem.visual, role: 'support', answerCritical: false }],
    ['answer-critical flag', { ...problem.visual, answerCritical: false }],
    ['semantics', { ...problem.visual, semantics: 'schematic' }],
    ['generator id', { ...problem.visual, generatorId: 'forged-visual' }],
    ['generator version', { ...problem.visual, generatorVersion: 2 }],
  ])('rejects a mismatched canonical visual %s', (_name, visual) => {
    expect(validateGrade5ApplicationGeometryProblem(
      { ...problem, visual } as unknown as GeneratedApplicationProblemV1,
      scene,
    ).length).toBeGreaterThan(0)
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
      expect(validateGrade5ApplicationGeometryProblem(problem, scene)).toEqual([])
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
      expect(validateGrade5ApplicationGeometryProblem(problem, scene)).toEqual([])
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

  it('keeps every attachment direction aligned across prompt, solution, and geometry', () => {
    const directionByPosition = ['위쪽', '가운데', '아래쪽'] as const
    for (let variantIndex = 0; variantIndex < G5_AREA_COMPOSITE_INVERSE_DOMAIN_SIZE; variantIndex += 1) {
      const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex })
      const scene = parseApplicationVisualSceneV1(problem.visual.mathModel)
      if (scene.surface !== 'diagram') throw new Error('expected a diagram')
      const square = scene.primitives.find((entry) => entry.key === 'square')
      const rectangle = scene.primitives.find((entry) => entry.key === 'rectangle')
      if (square?.kind !== 'polygon' || rectangle?.kind !== 'polygon') {
        throw new Error('expected square and rectangle polygons')
      }
      const squareMinY = Math.min(...square.points.map((point) => point.y))
      const squareMaxY = Math.max(...square.points.map((point) => point.y))
      const rectangleMinY = Math.min(...rectangle.points.map((point) => point.y))
      const rectangleMaxY = Math.max(...rectangle.points.map((point) => point.y))
      const position = Number(problem.params.attachmentPosition) as 0 | 1 | 2
      const direction = directionByPosition[position]

      expect(problem.prompt).toContain(`정사각형 오른쪽 변의 ${direction}에`)
      expect(problem.solutionSteps.join(' ')).toContain(direction)
      if (position === 0) expect(rectangleMinY).toBe(squareMinY)
      if (position === 1) {
        expect((rectangleMinY + rectangleMaxY) / 2).toBe((squareMinY + squareMaxY) / 2)
      }
      if (position === 2) expect(rectangleMaxY).toBe(squareMaxY)
    }
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
      expect(validateGrade5ApplicationGeometryProblem(problem, scene)).toEqual([])
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
    const problem = generateG5AreaOverlapReconstructionProblem({ seed: 0, variantIndex: 0 })
    expect(validateGrade5ApplicationGeometryProblem(problem, tampered).length).toBeGreaterThan(0)
    for (const seed of [Number.MIN_SAFE_INTEGER, -244, -1, Number.MAX_SAFE_INTEGER]) {
      expect(selectG5AreaOverlapReconstructionParams(seed, Number.MAX_SAFE_INTEGER)).toEqual(
        selectG5AreaOverlapReconstructionParams(seed, Number.MAX_SAFE_INTEGER),
      )
    }
  })
})
