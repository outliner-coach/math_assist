import {
  getGrade2Missions,
  getGrade2MissionSet,
  grade2Units,
  type Grade2Mission,
  type Grade2MissionProvider,
} from '../grade2-problems'
import type {
  ReviewOnlyApplicationAuthoringCatalogV1,
  ReviewOnlyApplicationUnitCandidateV1,
} from './authoring-catalog'
import { GRADE2_APPLICATION_AUTHORING_CATALOG_V1 } from './authoring-catalog'
import {
  adaptGeneratedApplicationProblemToGrade2Replacement,
  type Grade2ApplicationMissionV1,
} from './grade2-adapter'
import { generateApplicationProblem } from './generator'
import { planCognitiveDomainApplicationPlacements } from './practice-runtime'
import { GRADE2_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade2-registry'
import type { ApplicationProblemRegistryEntryV1, ApplicationProblemRegistryV1 } from './registry'
import {
  approvedRuntimeEntriesById,
  generateRegisteredApplicationProblemWithRetry,
} from './runtime-integration'

export type Grade2ApplicationPracticeSetResult =
  | { status: 'ready'; missions: Grade2Mission[] }
  | { status: 'blocked' }

function replaceMission(
  base: readonly Grade2Mission[],
  replacement: Grade2ApplicationMissionV1,
): Grade2Mission[] | null {
  const index = base.findIndex((mission) => mission.id === replacement.id)
  if (
    index < 0 ||
    base[index].mode !== 'practice' ||
    base[index].unitId !== replacement.unitId ||
    base[index].cognitiveDomain === 'knowing' ||
    base[index].cognitiveDomain !== replacement.cognitiveDomain
  ) return null
  return base.map((mission, missionIndex) => missionIndex === index ? replacement : mission)
}

function plannedReplacement(input: {
  base: readonly Grade2Mission[]
  applications: readonly {
    familyId: string
    version: number
    cognitiveDomain: 'applying' | 'reasoning'
  }[]
  rotationSeed: number
}) {
  const applications = Array.from(new Map(
    input.applications.map((candidate) => [
      `${candidate.familyId}@${candidate.version}`,
      candidate,
    ]),
  ).values()).sort((left, right) => (
    `${left.familyId}@${left.version}`.localeCompare(`${right.familyId}@${right.version}`)
  ))
  if (applications.length === 0) return null

  const familyOffset = ((input.rotationSeed % applications.length) + applications.length)
    % applications.length
  const slotRotation = Math.trunc(input.rotationSeed / applications.length)
  for (let offset = 0; offset < applications.length; offset += 1) {
    const application = applications[(familyOffset + offset) % applications.length]
    const planned = planCognitiveDomainApplicationPlacements({
      grade: 2,
      mode: 'basic',
      sessionCount: input.base.length,
      baseSlots: input.base.map((mission) => ({
        id: mission.id,
        cognitiveDomain: mission.cognitiveDomain,
      })),
      applications: [application],
      rotationSeed: slotRotation,
    })
    if (!planned.ok) continue
    const slot = planned.slots.find((candidate) => candidate.kind === 'application')
    if (slot) return slot
  }
  return null
}

function approvedEntriesForUnit(
  registry: ApplicationProblemRegistryV1,
  unitId: string,
): ApplicationProblemRegistryEntryV1[] {
  const approved = approvedRuntimeEntriesById(registry)
  return Array.from(approved.values()).filter(({ family }) => family.unitId === unitId)
}

function buildApprovedUnitPracticeSet(input: {
  unitId: string
  seed: number
  registry: ApplicationProblemRegistryV1
}): Grade2ApplicationPracticeSetResult {
  const base = getGrade2MissionSet(input.unitId, 'practice', input.seed)
  if (base.length !== 6) return { status: 'blocked' }
  const entries = approvedEntriesForUnit(input.registry, input.unitId)
  if (entries.length === 0) return { status: 'ready', missions: [...base] }
  const slot = plannedReplacement({
    base,
    applications: entries.map(({ family }) => ({
      familyId: family.familyId,
      version: family.version,
      cognitiveDomain: family.cognitiveDomain,
    })),
    rotationSeed: input.seed,
  })
  if (!slot?.application) return { status: 'blocked' }
  const entry = entries.find(({ family }) => (
    family.familyId === slot.application?.familyId && family.version === slot.application.version
  ))
  const shell = base.find(({ id }) => id === slot.baseSlotId)
  if (!entry || !shell) return { status: 'blocked' }
  try {
    const problem = generateRegisteredApplicationProblemWithRetry({
      registry: input.registry,
      entry,
      seed: input.seed,
      variantIndex: Math.abs(input.seed) % 97,
    })
    const replacement = adaptGeneratedApplicationProblemToGrade2Replacement({
      shell,
      problem,
      baseSeed: input.seed,
    })
    const missions = replaceMission(base, replacement)
    return missions ? { status: 'ready', missions } : { status: 'blocked' }
  } catch {
    return { status: 'blocked' }
  }
}

function buildDraftUnitPracticeSet(input: {
  unit: ReviewOnlyApplicationUnitCandidateV1
  seed: number
}): Grade2ApplicationPracticeSetResult {
  const base = getGrade2MissionSet(input.unit.pack.unitId, 'practice', input.seed)
  if (base.length !== 6 || input.unit.familyCandidates.length === 0) return { status: 'blocked' }
  const attemptCount = Math.max(3, input.unit.familyCandidates.length * 2)
  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    const rotationSeed = input.seed + attempt
    const slot = plannedReplacement({
      base,
      applications: input.unit.familyCandidates.map(({ family }) => ({
        familyId: family.familyId,
        version: family.version,
        cognitiveDomain: family.cognitiveDomain,
      })),
      rotationSeed,
    })
    if (!slot?.application) continue
    const candidate = input.unit.familyCandidates.find(({ family }) => (
      family.familyId === slot.application?.familyId && family.version === slot.application.version
    ))
    const shell = base.find(({ id }) => id === slot.baseSlotId)
    if (!candidate || !shell || candidate.runtime.kind !== 'deterministic-generator') continue
    try {
      const problem = generateApplicationProblem({
        family: candidate.family,
        generator: candidate.runtime.generator,
        packVersion: input.unit.pack.version,
        seed: input.seed + attempt * 104729,
        variantIndex: attempt,
        maxAttempts: candidate.runtime.generator.maxAttempts,
      })
      const reviewCase = candidate.reviewCases.find(({ kind }) => kind === 'representative')
        ?? candidate.reviewCases[0]
      const proofIssues = reviewCase && candidate.proof
        ? candidate.proof.verify(problem, reviewCase)
        : ['missing draft proof evidence']
      if (
        candidate.oracle(problem) !== problem.answer.normalized ||
        candidate.visualValidator(problem) !== true ||
        proofIssues.length > 0
      ) continue
      const replacement = adaptGeneratedApplicationProblemToGrade2Replacement({
        shell,
        problem,
        baseSeed: input.seed,
      })
      const missions = replaceMission(base, replacement)
      if (missions) return { status: 'ready', missions }
    } catch {
      // A candidate is never allowed to produce a partial six-problem practice.
    }
  }
  return { status: 'blocked' }
}

export function buildGrade2AuthoringPracticeSet(input: {
  unitId: string
  seed: number
  catalog?: ReviewOnlyApplicationAuthoringCatalogV1
}): Grade2ApplicationPracticeSetResult {
  const catalog = input.catalog ?? GRADE2_APPLICATION_AUTHORING_CATALOG_V1
  const unit = catalog.unitCandidates.find(({ pack }) => pack.unitId === input.unitId)
  return unit ? buildDraftUnitPracticeSet({ unit, seed: input.seed }) : { status: 'blocked' }
}

export function buildApprovedGrade2ApplicationMissions(
  seed: number,
  registry: ApplicationProblemRegistryV1 = GRADE2_APPLICATION_PROBLEM_REGISTRY_V1,
): Grade2ApplicationMissionV1[] {
  return grade2Units.flatMap((unit) => {
    if (approvedEntriesForUnit(registry, unit.id).length === 0) return []
    const result = buildApprovedUnitPracticeSet({ unitId: unit.id, seed, registry })
    if (result.status !== 'ready') {
      throw new Error(`Grade 2 application practice is incomplete for ${unit.id}`)
    }
    return result.missions.filter((mission): mission is Grade2ApplicationMissionV1 => (
      'applicationSource' in mission
    ))
  })
}

export type Grade2MissionCatalogResult =
  | { status: 'ready'; missions: Grade2Mission[] }
  | { status: 'blocked' }

export function buildGrade2MissionCatalog(
  seed: number,
  applicationMissionProvider: Grade2MissionProvider = buildApprovedGrade2ApplicationMissions,
): Grade2MissionCatalogResult {
  try {
    const base = getGrade2Missions(seed)
    const replacements = [...applicationMissionProvider(seed)]
    let missions = base
    for (const replacement of replacements) {
      if (!('applicationSource' in replacement)) return { status: 'blocked' }
      const next = replaceMission(missions, replacement as Grade2ApplicationMissionV1)
      if (!next) return { status: 'blocked' }
      missions = next
    }
    return { status: 'ready', missions }
  } catch {
    return { status: 'blocked' }
  }
}
