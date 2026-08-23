import { getGrade3MissionSession, type Grade3Mission } from '../grade3-problems'
import type { ReviewOnlyApplicationAuthoringCatalogV1 } from './authoring-catalog'
import { GRADE3_APPLICATION_AUTHORING_CATALOG_V1 } from './authoring-catalog'
import {
  adaptGeneratedApplicationProblemToGrade3Replacement,
  isGrade3ApplicationMission,
} from './grade3-adapter'
import { generateApplicationProblem } from './generator'
import { GRADE3_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade3-registry'
import { matchesGrade3ApprovedFamilySnapshot } from './grade3-approved-snapshots'
import { selectApprovedRuntimeCandidates, type ApplicationProblemRegistryV1 } from './registry'
import {
  evaluateGrade3ApplicationOracle,
  verifyGrade3ApplicationProblem,
} from './families/g3-independent-verifier'
import { resolveApplicationVisual } from './visual-validator'

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonical(entry)]),
    )
  }
  return value
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right))
}

function canonicalPlacementShell(mission: Grade3Mission): Grade3Mission | null {
  if (!isGrade3ApplicationMission(mission)) return null
  return getGrade3MissionSession(
    mission.unitId,
    'practice',
    mission.applicationPlacement.baseSeed,
    mission.applicationPlacement.baseMissionId,
  ).find(({ id }) => id === mission.applicationPlacement.baseMissionId) ?? null
}

export function isGrade3ApplicationMissionSemanticallyValid(
  mission: Grade3Mission,
  catalog: ReviewOnlyApplicationAuthoringCatalogV1 = GRADE3_APPLICATION_AUTHORING_CATALOG_V1,
): boolean {
  if (!isGrade3ApplicationMission(mission)) return false
  const source = mission.applicationSource
  const unit = catalog.unitCandidates.find(({ pack }) => (
    pack.grade === 3
    && pack.packId === source.packId
    && pack.version === source.packVersion
    && pack.unitId === mission.unitId
  ))
  const candidate = unit?.familyCandidates.find(({ family }) => (
    family.familyId === source.familyId
    && family.version === source.generatorVersion
    && family.cognitiveDomain === mission.cognitiveDomain
  ))
  if (!candidate || candidate.runtime.kind !== 'deterministic-generator') return false
  try {
    const problem = generateApplicationProblem({
      family: candidate.family,
      generator: candidate.runtime.generator,
      packVersion: unit!.pack.version,
      seed: source.seed,
      variantIndex: source.variantIndex,
    })
    if (
      candidate.oracle(problem) !== problem.answer.normalized
      || candidate.visualValidator(problem) !== true
      || candidate.proof?.proven !== true
      || candidate.proof.verify(problem, candidate.reviewCases[0]).length > 0
    ) return false
    const shell = canonicalPlacementShell(mission)
    if (!shell) return false
    const expected = adaptGeneratedApplicationProblemToGrade3Replacement({
      shell,
      problem,
      baseSeed: mission.applicationPlacement.baseSeed,
    })
    return sameJson(mission, expected)
  } catch {
    return false
  }
}

export function isApprovedGrade3ApplicationMissionSemanticallyValid(
  mission: Grade3Mission,
  registry: ApplicationProblemRegistryV1 = GRADE3_APPLICATION_PROBLEM_REGISTRY_V1,
): boolean {
  if (!isGrade3ApplicationMission(mission)) return false
  const source = mission.applicationSource
  const entries = selectApprovedRuntimeCandidates(registry).filter(({ family }) => (
    family.familyId === source.familyId
    && family.version === source.generatorVersion
    && family.packId === source.packId
    && family.unitId === mission.unitId
    && family.cognitiveDomain === mission.cognitiveDomain
  ))
  const [entry] = entries
  if (
    !entry
    || entries.length !== 1
    || entry.runtime.kind !== 'deterministic-generator'
    || !matchesGrade3ApprovedFamilySnapshot(entry.family)
  ) return false
  if (entry.runtime.generator.packVersion !== source.packVersion) return false
  try {
    const problem = generateApplicationProblem({
      family: entry.family,
      generator: entry.runtime.generator,
      packVersion: source.packVersion,
      seed: source.seed,
      variantIndex: source.variantIndex,
    })
    const visual = resolveApplicationVisual(problem.visual)
    if (
      evaluateGrade3ApplicationOracle(problem) !== problem.answer.normalized
      || verifyGrade3ApplicationProblem(problem).length > 0
      || visual.status !== 'ready'
    ) return false
    const shell = canonicalPlacementShell(mission)
    if (!shell) return false
    const expected = adaptGeneratedApplicationProblemToGrade3Replacement({
      shell,
      problem,
      baseSeed: mission.applicationPlacement.baseSeed,
    })
    return sameJson(mission, expected)
  } catch {
    return false
  }
}
