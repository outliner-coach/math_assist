import type { CognitiveDomain, PracticeGrade } from '../types'
import type { AdditionalProblemCandidate } from '../problem-generator'
import type { ApplicationProblemRegistryV1 } from './registry'
import {
  buildPracticeApplicationProblem,
  selectApprovedPracticeApplicationPlacements,
} from './runtime-integration'

export type ApplicationPlacementGrade = 2 | 3 | 4 | 5 | 6
export type ApplicationSessionMode = 'basic' | 'focused'

export interface CognitiveDomainBaseSlotV1 {
  id: string
  cognitiveDomain: CognitiveDomain
}

export interface CognitiveDomainApplicationCandidateV1 {
  familyId: string
  version: number
  cognitiveDomain: Exclude<CognitiveDomain, 'knowing'>
}

export interface PlannedApplicationSlotV1 {
  kind: 'base' | 'application'
  baseSlotId: string
  cognitiveDomain: CognitiveDomain
  application?: CognitiveDomainApplicationCandidateV1
}

export type CognitiveDomainApplicationPlacementResultV1 =
  | { ok: true; slots: PlannedApplicationSlotV1[] }
  | {
      ok: false
      code: 'invalid_session_contract' | 'insufficient_safe_application_slots'
      requiredApplicationCount: number
    }

const APPLICATION_SESSION_POLICY: Readonly<
  Record<ApplicationPlacementGrade, Partial<Record<ApplicationSessionMode, { total: number; application: number }>>>
> = Object.freeze({
  2: Object.freeze({ basic: Object.freeze({ total: 6, application: 1 }) }),
  3: Object.freeze({ basic: Object.freeze({ total: 3, application: 1 }) }),
  4: Object.freeze({ basic: Object.freeze({ total: 3, application: 1 }) }),
  5: Object.freeze({
    basic: Object.freeze({ total: 5, application: 1 }),
    focused: Object.freeze({ total: 10, application: 2 }),
  }),
  6: Object.freeze({
    basic: Object.freeze({ total: 5, application: 1 }),
    focused: Object.freeze({ total: 10, application: 2 }),
  }),
})

function applicationSessionPolicy(input: {
  grade: ApplicationPlacementGrade
  mode: ApplicationSessionMode
  sessionCount: number
}): { total: number; application: number } | null {
  const policy = APPLICATION_SESSION_POLICY[input.grade][input.mode]
  return policy && policy.total === input.sessionCount ? policy : null
}

export function applicationSlotCount(input: {
  grade: ApplicationPlacementGrade
  mode: ApplicationSessionMode
  sessionCount: number
}): number {
  const policy = applicationSessionPolicy(input)
  if (!policy) {
    throw new TypeError(
      `unsupported Grade ${input.grade} ${input.mode} application session count ${input.sessionCount}`,
    )
  }
  return policy.application
}

function rotated<T>(values: readonly T[], offset: number): T[] {
  if (values.length === 0) return []
  const normalized = ((offset % values.length) + values.length) % values.length
  return [...values.slice(normalized), ...values.slice(0, normalized)]
}

export function planCognitiveDomainApplicationPlacements(input: {
  grade: ApplicationPlacementGrade
  mode: ApplicationSessionMode
  sessionCount: number
  baseSlots: readonly CognitiveDomainBaseSlotV1[]
  applications: readonly CognitiveDomainApplicationCandidateV1[]
  rotationSeed: number
}): CognitiveDomainApplicationPlacementResultV1 {
  const policy = applicationSessionPolicy(input)
  if (!policy || input.baseSlots.length !== input.sessionCount || !Number.isSafeInteger(input.rotationSeed)) {
    return {
      ok: false,
      code: 'invalid_session_contract',
      requiredApplicationCount: policy?.application ?? 0,
    }
  }
  const requiredApplicationCount = policy.application
  const uniqueApplications = Array.from(new Map(
    input.applications.map((candidate) => [`${candidate.familyId}@${candidate.version}`, candidate]),
  ).values())
  if (uniqueApplications.length < requiredApplicationCount) {
    return {
      ok: false,
      code: 'insufficient_safe_application_slots',
      requiredApplicationCount,
    }
  }
  const orderedApplications = rotated(
    [...uniqueApplications].sort((left, right) =>
      `${left.familyId}@${left.version}`.localeCompare(`${right.familyId}@${right.version}`),
    ),
    input.rotationSeed,
  )
  const eligibleSlotIndices = rotated(
    input.baseSlots
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => slot.cognitiveDomain !== 'knowing'),
    input.rotationSeed,
  )
  const selected: Array<{ application: CognitiveDomainApplicationCandidateV1; slotIndex: number }> = []
  const usedSlots = new Set<number>()

  function search(applicationIndex: number): boolean {
    if (selected.length === requiredApplicationCount) return true
    if (applicationIndex >= orderedApplications.length) return false
    const remainingApplications = orderedApplications.length - applicationIndex
    if (selected.length + remainingApplications < requiredApplicationCount) return false
    const application = orderedApplications[applicationIndex]
    for (const { slot, index } of eligibleSlotIndices) {
      if (usedSlots.has(index) || slot.cognitiveDomain !== application.cognitiveDomain) continue
      usedSlots.add(index)
      selected.push({ application, slotIndex: index })
      if (search(applicationIndex + 1)) return true
      selected.pop()
      usedSlots.delete(index)
    }
    return search(applicationIndex + 1)
  }

  if (!search(0)) {
    return {
      ok: false,
      code: 'insufficient_safe_application_slots',
      requiredApplicationCount,
    }
  }
  const selectedBySlot = new Map(selected.map((entry) => [entry.slotIndex, entry.application]))
  return {
    ok: true,
    slots: input.baseSlots.map((slot, index) => {
      const application = selectedBySlot.get(index)
      return application
        ? {
            kind: 'application' as const,
            baseSlotId: slot.id,
            cognitiveDomain: slot.cognitiveDomain,
            application,
          }
        : {
            kind: 'base' as const,
            baseSlotId: slot.id,
            cognitiveDomain: slot.cognitiveDomain,
          }
    }),
  }
}

export interface ApprovedPracticeApplicationCandidate extends AdditionalProblemCandidate {
  familyId: string
  version: number
  cognitiveDomain: Exclude<CognitiveDomain, 'knowing'>
}

export function buildApprovedPracticeProblemCandidates(input: {
  grade: PracticeGrade
  conceptId: string
  registry?: ApplicationProblemRegistryV1
}): ApprovedPracticeApplicationCandidate[] {
  const registry = input.registry
  if (!registry) return []
  return selectApprovedPracticeApplicationPlacements({
    registry,
    grade: input.grade,
    conceptId: input.conceptId,
  }).map(({ placement, entry }) => ({
    id: `${entry.family.familyId}@${entry.family.version}`,
    familyId: entry.family.familyId,
    version: entry.family.version,
    cognitiveDomain: entry.family.cognitiveDomain,
    difficulty: placement.difficulty,
    generate: ({ seed, variantIndex, index, setId }) => buildPracticeApplicationProblem({
      registry,
      placement,
      entry,
      seed,
      variantIndex,
      index,
      setId,
    }),
  }))
}
