import {
  G5_AREA_COMPOSITE_INVERSE_DOMAIN_SIZE,
  G5_AREA_OVERLAP_RECONSTRUCTION_DOMAIN_SIZE,
  G5_PERIMETER_BOUNDARY_REBUILD_DOMAIN_SIZE,
} from './grade5-geometry-families'

function variants(size: number): readonly number[] {
  return Object.freeze(Array.from({ length: size }, (_, variantIndex) => variantIndex))
}

function flattenedDomain(size: number) {
  return Object.freeze(Array.from({ length: size }, (_, variantIndex) => Object.freeze({
    caseId: 'complete-domain',
    seed: 0,
    variantIndex,
  })))
}

export const G5_PERIMETER_BOUNDARY_REBUILD_EXHAUSTIVE_DOMAIN = Object.freeze({
  kind: 'finite-complete' as const,
  cases: Object.freeze([{ caseId: 'complete-domain', seed: 0 }]),
  variantIndexes: variants(G5_PERIMETER_BOUNDARY_REBUILD_DOMAIN_SIZE),
})

export const G5_AREA_COMPOSITE_INVERSE_EXHAUSTIVE_DOMAIN = Object.freeze({
  kind: 'finite-complete' as const,
  cases: Object.freeze([{ caseId: 'complete-domain', seed: 0 }]),
  variantIndexes: variants(G5_AREA_COMPOSITE_INVERSE_DOMAIN_SIZE),
})

export const G5_AREA_OVERLAP_RECONSTRUCTION_EXHAUSTIVE_DOMAIN = Object.freeze({
  kind: 'finite-complete' as const,
  cases: Object.freeze([{ caseId: 'complete-domain', seed: 0 }]),
  variantIndexes: variants(G5_AREA_OVERLAP_RECONSTRUCTION_DOMAIN_SIZE),
})

export const G5_PERIMETER_BOUNDARY_REBUILD_AUTHORITY_DOMAIN = flattenedDomain(
  G5_PERIMETER_BOUNDARY_REBUILD_DOMAIN_SIZE,
)
export const G5_AREA_COMPOSITE_INVERSE_AUTHORITY_DOMAIN = flattenedDomain(
  G5_AREA_COMPOSITE_INVERSE_DOMAIN_SIZE,
)
export const G5_AREA_OVERLAP_RECONSTRUCTION_AUTHORITY_DOMAIN = flattenedDomain(
  G5_AREA_OVERLAP_RECONSTRUCTION_DOMAIN_SIZE,
)
