import type { ThreeShapeOverlapModel } from './types'

interface ThreeShapeOverlapInput {
  shapeArea: number
  exclusiveAreas: [number, number, number]
  tripleOverlap: number
}

function assertUnitCellValue(name: string, value: number): void {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${name} must be a finite integer for the unit-cell model`)
  }
  if (value < 0) {
    throw new Error(`${name} cannot be negative`)
  }
}

export function buildThreeShapeOverlapModel({
  shapeArea,
  exclusiveAreas,
  tripleOverlap
}: ThreeShapeOverlapInput): ThreeShapeOverlapModel {
  assertUnitCellValue('shapeArea', shapeArea)
  exclusiveAreas.forEach((value, index) => assertUnitCellValue(`exclusiveAreas[${index}]`, value))
  assertUnitCellValue('tripleOverlap', tripleOverlap)

  if (shapeArea === 0) {
    throw new Error('shapeArea must be greater than zero')
  }

  const [aOnly, bOnly, cOnly] = exclusiveAreas
  const aPairwiseTotal = shapeArea - aOnly - tripleOverlap
  const bPairwiseTotal = shapeArea - bOnly - tripleOverlap
  const cPairwiseTotal = shapeArea - cOnly - tripleOverlap

  const abOnly = (aPairwiseTotal + bPairwiseTotal - cPairwiseTotal) / 2
  const acOnly = (aPairwiseTotal + cPairwiseTotal - bPairwiseTotal) / 2
  const bcOnly = (bPairwiseTotal + cPairwiseTotal - aPairwiseTotal) / 2

  for (const [name, value] of Object.entries({ abOnly, acOnly, bcOnly })) {
    if (value < 0) {
      throw new Error(`${name} cannot be negative`)
    }
    assertUnitCellValue(name, value)
  }

  const regions = {
    aOnly,
    bOnly,
    cOnly,
    abOnly,
    acOnly,
    bcOnly,
    abc: tripleOverlap
  }
  const shapeAreas: [number, number, number] = [
    aOnly + abOnly + acOnly + tripleOverlap,
    bOnly + abOnly + bcOnly + tripleOverlap,
    cOnly + acOnly + bcOnly + tripleOverlap
  ]

  if (shapeAreas.some(value => value !== shapeArea)) {
    throw new Error('derived regions do not reconstruct the three equal shape areas')
  }

  return {
    cellArea: 1,
    regions,
    shapeAreas,
    unionArea: Object.values(regions).reduce((sum, value) => sum + value, 0)
  }
}
