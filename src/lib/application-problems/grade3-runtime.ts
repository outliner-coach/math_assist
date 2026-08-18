import { getGrade3MissionSession, type Grade3Mission } from '../grade3-problems'
import type {
  ReviewOnlyApplicationAuthoringCatalogV1,
  ReviewOnlyApplicationUnitCandidateV1,
} from './authoring-catalog'
import { GRADE3_APPLICATION_AUTHORING_CATALOG_V1 } from './authoring-catalog'
import {
  adaptGeneratedApplicationProblemToGrade3Replacement,
  type Grade3ApplicationMissionV1,
} from './grade3-adapter'
import { generateApplicationProblem } from './generator'
import { planCognitiveDomainApplicationPlacements } from './practice-runtime'
import { GRADE3_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade3-registry'
import { matchesGrade3ApprovedFamilySnapshot } from './grade3-approved-snapshots'
import type { ApplicationProblemRegistryEntryV1, ApplicationProblemRegistryV1 } from './registry'
import { selectApprovedRuntimeCandidates } from './registry'
import { generateRegisteredApplicationProblemWithRetry } from './runtime-integration'
import {
  evaluateGrade3ApplicationOracle,
  verifyGrade3ApplicationProblem,
} from './families/g3-independent-verifier'
import { resolveApplicationVisual } from './visual-validator'

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
  const catalog = input.catalog ?? GRADE3_APPLICATION_AUTHORING_CATALOG_V1
  const unit = catalog.unitCandidates.find(({ pack }) => (
    pack.grade === 3 && pack.unitId === input.unitId
  ))
  return unit ? buildDraftUnitPracticeSet({ unit, seed: input.seed }) : { status: 'blocked' }
}

function approvedEntriesForUnit(
  registry: ApplicationProblemRegistryV1,
  unitId: string,
): ApplicationProblemRegistryEntryV1[] {
  return selectApprovedRuntimeCandidates(registry)
    .filter(({ family }) => (
      family.unitId === unitId && matchesGrade3ApprovedFamilySnapshot(family)
    ))
    .sort((left, right) => (
      `${left.family.familyId}@${left.family.version}`
        .localeCompare(`${right.family.familyId}@${right.family.version}`)
    ))
}

export function buildApprovedGrade3PracticeSet(input: {
  unitId: string
  seed: number
  applicationRotation?: number
  preferredMissionId?: string | null
  registry?: ApplicationProblemRegistryV1
}): Grade3ApplicationPracticeSetResult {
  const registry = input.registry ?? GRADE3_APPLICATION_PROBLEM_REGISTRY_V1
  const applicationRotation = input.applicationRotation ?? input.seed
  const base = getGrade3MissionSession(
    input.unitId,
    'practice',
    input.seed,
    input.preferredMissionId,
  )
  const entries = approvedEntriesForUnit(registry, input.unitId)
  if (base.length !== 3 || entries.length === 0) return { status: 'blocked' }

  for (let offset = 0; offset < entries.length; offset += 1) {
    const entry = entries[(Math.abs(applicationRotation) + offset) % entries.length]
    const planned = planCognitiveDomainApplicationPlacements({
      grade: 3,
      mode: 'basic',
      sessionCount: base.length,
      baseSlots: base.map(({ id, cognitiveDomain }) => ({ id, cognitiveDomain })),
      applications: [{
        familyId: entry.family.familyId,
        version: entry.family.version,
        cognitiveDomain: entry.family.cognitiveDomain,
      }],
      rotationSeed: Math.trunc(applicationRotation / entries.length),
    })
    const slot = planned.ok ? planned.slots.find(({ kind }) => kind === 'application') : undefined
    const shell = slot ? base.find(({ id }) => id === slot.baseSlotId) : undefined
    if (!slot?.application || !shell) continue
    try {
      const problem = generateRegisteredApplicationProblemWithRetry({
        registry,
        entry,
        seed: applicationRotation + offset * 104729,
        variantIndex: Math.abs(applicationRotation + offset) % 3,
      })
      const visual = resolveApplicationVisual(problem.visual)
      if (
        evaluateGrade3ApplicationOracle(problem) !== problem.answer.normalized
        || verifyGrade3ApplicationProblem(problem).length > 0
        || visual.status !== 'ready'
      ) continue
      const missions = replaceMission(base, adaptGeneratedApplicationProblemToGrade3Replacement({
        shell,
        problem,
        baseSeed: input.seed,
      }))
      if (missions) return { status: 'ready', missions }
    } catch {
      // Approved Grade 3 practice fails closed and never returns a partial session.
    }
  }
  return { status: 'blocked' }
}
