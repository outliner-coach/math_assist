import { getGrade3MissionSession, type Grade3Mission } from '../grade3-problems'
import type {
  ReviewOnlyApplicationAuthoringCatalogV1,
  ReviewOnlyApplicationUnitCandidateV1,
} from './authoring-catalog'
import { APPLICATION_PROBLEM_AUTHORING_CATALOG_V1 } from './authoring-catalog'
import {
  adaptGeneratedApplicationProblemToGrade3Replacement,
  type Grade3ApplicationMissionV1,
} from './grade3-adapter'
import { generateApplicationProblem } from './generator'
import { planCognitiveDomainApplicationPlacements } from './practice-runtime'

export type Grade3ApplicationPracticeSetResult =
  | { status: 'ready'; missions: Grade3Mission[] }
  | { status: 'blocked' }

function replaceMission(
  base: readonly Grade3Mission[],
  replacement: Grade3ApplicationMissionV1,
): Grade3Mission[] | null {
  const index = base.findIndex(({ id }) => id === replacement.id)
  if (
    index < 0
    || base[index].unitId !== replacement.unitId
    || base[index].cognitiveDomain === 'knowing'
    || base[index].cognitiveDomain !== replacement.cognitiveDomain
  ) return null
  return base.map((mission, missionIndex) => missionIndex === index ? replacement : mission)
}

function buildDraftUnitPracticeSet(input: {
  unit: ReviewOnlyApplicationUnitCandidateV1
  seed: number
}): Grade3ApplicationPracticeSetResult {
  const base = getGrade3MissionSession(input.unit.pack.unitId, 'practice', input.seed)
  if (base.length !== 3 || input.unit.familyCandidates.length === 0) return { status: 'blocked' }
  const candidates = [...input.unit.familyCandidates].sort((left, right) => (
    `${left.family.familyId}@${left.family.version}`
      .localeCompare(`${right.family.familyId}@${right.family.version}`)
  ))
  for (let offset = 0; offset < candidates.length; offset += 1) {
    const rotationSeed = input.seed + offset
    const planned = planCognitiveDomainApplicationPlacements({
      grade: 3,
      mode: 'basic',
      sessionCount: base.length,
      baseSlots: base.map(({ id, cognitiveDomain }) => ({ id, cognitiveDomain })),
      applications: candidates.map(({ family }) => ({
        familyId: family.familyId,
        version: family.version,
        cognitiveDomain: family.cognitiveDomain,
      })),
      rotationSeed,
    })
    if (!planned.ok) continue
    const slot = planned.slots.find(({ kind }) => kind === 'application')
    if (!slot?.application) continue
    const candidate = candidates.find(({ family }) => (
      family.familyId === slot.application?.familyId
      && family.version === slot.application.version
    ))
    const shell = base.find(({ id }) => id === slot.baseSlotId)
    if (
      !candidate
      || !shell
      || candidate.runtime.kind !== 'deterministic-generator'
      || !candidate.proof
      || candidate.proof.proven !== true
      || candidate.proof.checkedCount !== candidate.proof.expectedCount
      || candidate.proof.issues.length > 0
    ) continue
    try {
      const generationSeed = input.seed + offset * 104729
      const variantIndex = Math.abs(input.seed + offset) % candidate.proof.expectedCount
      const problem = generateApplicationProblem({
        family: candidate.family,
        generator: candidate.runtime.generator,
        packVersion: input.unit.pack.version,
        seed: generationSeed,
        variantIndex,
      })
      const reviewCase = candidate.reviewCases.find((entry) => entry.variantIndex === variantIndex)
        ?? candidate.reviewCases[0]
      if (
        !reviewCase
        || candidate.oracle(problem) !== problem.answer.normalized
        || candidate.visualValidator(problem) !== true
        || candidate.proof.verify(problem, reviewCase).length > 0
      ) continue
      const missions = replaceMission(base, adaptGeneratedApplicationProblemToGrade3Replacement({
        shell,
        problem,
        baseSeed: input.seed,
      }))
      if (missions) return { status: 'ready', missions }
    } catch {
      // Review-only candidates fail closed and never return a partial session.
    }
  }
  return { status: 'blocked' }
}

export function buildGrade3AuthoringPracticeSet(input: {
  unitId: string
  seed: number
  catalog?: ReviewOnlyApplicationAuthoringCatalogV1
}): Grade3ApplicationPracticeSetResult {
  const catalog = input.catalog ?? APPLICATION_PROBLEM_AUTHORING_CATALOG_V1
  const unit = catalog.unitCandidates.find(({ pack }) => (
    pack.grade === 3 && pack.unitId === input.unitId
  ))
  return unit ? buildDraftUnitPracticeSet({ unit, seed: input.seed }) : { status: 'blocked' }
}
