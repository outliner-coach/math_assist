import { getGrade3MissionById, type Grade3Mission } from '../grade3-problems'
import type { ReviewOnlyApplicationAuthoringCatalogV1 } from './authoring-catalog'
import { APPLICATION_PROBLEM_AUTHORING_CATALOG_V1 } from './authoring-catalog'
import {
  adaptGeneratedApplicationProblemToGrade3Replacement,
  isGrade3ApplicationMission,
} from './grade3-adapter'
import { generateApplicationProblem } from './generator'

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

export function isGrade3ApplicationMissionSemanticallyValid(
  mission: Grade3Mission,
  catalog: ReviewOnlyApplicationAuthoringCatalogV1 = APPLICATION_PROBLEM_AUTHORING_CATALOG_V1,
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
    const shell = {
      ...getGrade3MissionById(mission.applicationPlacement.baseMissionId),
      unitMissionOrder: mission.unitMissionOrder,
    }
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
