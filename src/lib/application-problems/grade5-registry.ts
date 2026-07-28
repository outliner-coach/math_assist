import {
  G5_AREA_COMPOSITE_INVERSE_FAMILY,
  G5_AREA_COMPOSITE_INVERSE_GENERATOR,
  G5_AREA_OVERLAP_RECONSTRUCTION_FAMILY,
  G5_AREA_OVERLAP_RECONSTRUCTION_GENERATOR,
  G5_PERIMETER_BOUNDARY_REBUILD_FAMILY,
  G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR,
} from './families/grade5-geometry-families'
import { deterministicRegistryEntry, type ApplicationProblemRegistryV1 } from './registry'

export const GRADE5_APPLICATION_PROBLEM_REGISTRY_V1: ApplicationProblemRegistryV1 =
  Object.freeze({
    entries: Object.freeze([
      deterministicRegistryEntry(
        G5_PERIMETER_BOUNDARY_REBUILD_FAMILY,
        G5_PERIMETER_BOUNDARY_REBUILD_GENERATOR,
      ),
      deterministicRegistryEntry(
        G5_AREA_COMPOSITE_INVERSE_FAMILY,
        G5_AREA_COMPOSITE_INVERSE_GENERATOR,
      ),
      deterministicRegistryEntry(
        G5_AREA_OVERLAP_RECONSTRUCTION_FAMILY,
        G5_AREA_OVERLAP_RECONSTRUCTION_GENERATOR,
      ),
    ]),
    releaseLedger: Object.freeze([
      G5_PERIMETER_BOUNDARY_REBUILD_FAMILY,
      G5_AREA_COMPOSITE_INVERSE_FAMILY,
      G5_AREA_OVERLAP_RECONSTRUCTION_FAMILY,
    ]),
  })
