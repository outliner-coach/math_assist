import type { PracticeGrade } from '../types'
import { parseGeneratedApplicationProblemV1, type GeneratedApplicationProblemV1 } from './contracts'
import { generateApplicationProblem } from './generator'
import {
  selectApprovedRuntimeCandidates,
  type ApplicationProblemRegistryEntryV1,
  type ApplicationProblemRegistryV1,
} from './registry'
import {
  adaptGeneratedApplicationProblemToPractice,
  type ApplicationPracticeProblemV1,
} from './template-adapter'

export const APPLICATION_PROBLEM_MAX_SEED_RETRIES = 3
export const APPLICATION_PROBLEM_MAX_SEED_ATTEMPTS =
  APPLICATION_PROBLEM_MAX_SEED_RETRIES + 1

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)
const MIN_SAFE_BIGINT = -MAX_SAFE_BIGINT
const SAFE_INTEGER_SPAN = MAX_SAFE_BIGINT - MIN_SAFE_BIGINT + BigInt(1)
const RETRY_SEED_STEP = BigInt(1_000_003)

export class ApplicationProblemRuntimeGenerationError extends Error {
  readonly familyId: string
  readonly attempts: number
  readonly attemptedSeeds: readonly number[]

  constructor(input: {
    familyId: string
    attempts: number
    attemptedSeeds: readonly number[]
    cause?: unknown
  }) {
    super(`failed to generate ${input.familyId} after ${input.attempts} deterministic seeds`, {
      cause: input.cause,
    })
    this.name = 'ApplicationProblemRuntimeGenerationError'
    this.familyId = input.familyId
    this.attempts = input.attempts
    this.attemptedSeeds = [...input.attemptedSeeds]
  }
}

export function deriveApplicationRetrySeed(seed: number, attempt: number): number {
  if (!Number.isSafeInteger(seed)) throw new TypeError('seed must be a safe integer')
  if (!Number.isSafeInteger(attempt) || attempt < 0) {
    throw new TypeError('attempt must be a non-negative safe integer')
  }
  const zeroBased = BigInt(seed) - MIN_SAFE_BIGINT
  const wrapped = (zeroBased + BigInt(attempt) * RETRY_SEED_STEP) % SAFE_INTEGER_SPAN
  return Number(wrapped + MIN_SAFE_BIGINT)
}

function staticCorpusIndex(seed: number, variantIndex: number, count: number): number {
  const sum = BigInt(seed) + BigInt(variantIndex)
  const modulo = ((sum % BigInt(count)) + BigInt(count)) % BigInt(count)
  return Number(modulo)
}

function assertApprovedEntry(
  registry: ApplicationProblemRegistryV1,
  entry: ApplicationProblemRegistryEntryV1,
): void {
  if (!selectApprovedRuntimeCandidates(registry).includes(entry)) {
    throw new TypeError(`${entry.family.familyId}@${entry.family.version} is not an approved runtime candidate`)
  }
}

export function generateRegisteredApplicationProblemWithRetry(input: {
  registry: ApplicationProblemRegistryV1
  entry: ApplicationProblemRegistryEntryV1
  seed: number
  variantIndex: number
}): GeneratedApplicationProblemV1 {
  assertApprovedEntry(input.registry, input.entry)
  if (!Number.isSafeInteger(input.variantIndex) || input.variantIndex < 0) {
    throw new TypeError('variantIndex must be a non-negative safe integer')
  }

  if (input.entry.runtime.kind === 'static-corpus') {
    const selected = input.entry.runtime.entries[
      staticCorpusIndex(input.seed, input.variantIndex, input.entry.runtime.entries.length)
    ]
    return parseGeneratedApplicationProblemV1(JSON.parse(JSON.stringify(selected.problem)))
  }

  const attemptedSeeds: number[] = []
  let lastCause: unknown
  for (let attempt = 0; attempt < APPLICATION_PROBLEM_MAX_SEED_ATTEMPTS; attempt += 1) {
    const seed = deriveApplicationRetrySeed(input.seed, attempt)
    attemptedSeeds.push(seed)
    try {
      return generateApplicationProblem({
        family: input.entry.family,
        generator: input.entry.runtime.generator,
        packVersion: input.entry.runtime.generator.packVersion,
        seed,
        variantIndex: input.variantIndex,
      })
    } catch (cause) {
      lastCause = cause
    }
  }

  throw new ApplicationProblemRuntimeGenerationError({
    familyId: input.entry.family.familyId,
    attempts: APPLICATION_PROBLEM_MAX_SEED_ATTEMPTS,
    attemptedSeeds,
    cause: lastCause,
  })
}

export interface PracticeApplicationPlacementV1 {
  kind: 'practice'
  familyId: string
  grade: PracticeGrade
  conceptId: string
  difficulty: 1 | 2 | 3
}

const PRACTICE_APPLICATION_PLACEMENTS: readonly PracticeApplicationPlacementV1[] = Object.freeze([
  {
    kind: 'practice',
    familyId: 'g5-perimeter-boundary-rebuild',
    grade: 5,
    conceptId: 'perimeter-001',
    difficulty: 2,
  },
  {
    kind: 'practice',
    familyId: 'g5-area-composite-inverse',
    grade: 5,
    conceptId: 'area-001',
    difficulty: 3,
  },
  {
    kind: 'practice',
    familyId: 'g5-area-overlap-reconstruction',
    grade: 5,
    conceptId: 'area-001',
    difficulty: 3,
  },
  {
    kind: 'practice',
    familyId: 'g6-ratio-part-whole',
    grade: 6,
    conceptId: 'g6ratio-001',
    difficulty: 2,
  },
  {
    kind: 'practice',
    familyId: 'g6-ratio-relative-comparison',
    grade: 6,
    conceptId: 'g6ratio-001',
    difficulty: 3,
  },
  {
    kind: 'practice',
    familyId: 'g6-ratio-representation-check',
    grade: 6,
    conceptId: 'g6ratio-001',
    difficulty: 3,
  },
])

export function approvedRuntimeEntriesById(
  registry: ApplicationProblemRegistryV1,
): Map<string, ApplicationProblemRegistryEntryV1> {
  const selected = new Map<string, ApplicationProblemRegistryEntryV1>()
  selectApprovedRuntimeCandidates(registry).forEach((entry) => {
    const current = selected.get(entry.family.familyId)
    if (!current || entry.family.version > current.family.version) {
      selected.set(entry.family.familyId, entry)
    }
  })
  return selected
}

export function selectApprovedPracticeApplicationPlacements(input: {
  registry: ApplicationProblemRegistryV1
  grade: PracticeGrade
  conceptId: string
}): Array<{
  placement: PracticeApplicationPlacementV1
  entry: ApplicationProblemRegistryEntryV1
}> {
  const entries = approvedRuntimeEntriesById(input.registry)
  return PRACTICE_APPLICATION_PLACEMENTS
    .filter((placement) => placement.grade === input.grade && placement.conceptId === input.conceptId)
    .flatMap((placement) => {
      const entry = entries.get(placement.familyId)
      return entry ? [{ placement, entry }] : []
    })
}

function numericParams(params: Readonly<Record<string, unknown>>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]),
    ),
  )
}

export function buildPracticeApplicationProblem(input: {
  registry: ApplicationProblemRegistryV1
  placement: PracticeApplicationPlacementV1
  entry: ApplicationProblemRegistryEntryV1
  seed: number
  variantIndex: number
  index: number
  setId: 'A' | 'B' | 'C'
}): ApplicationPracticeProblemV1 {
  const generated = generateRegisteredApplicationProblemWithRetry({
    registry: input.registry,
    entry: input.entry,
    seed: input.seed,
    variantIndex: input.variantIndex,
  })
  return adaptGeneratedApplicationProblemToPractice({
    problem: generated,
    placement: {
      index: input.index,
      templateId: `application-${input.entry.family.familyId}-v${input.entry.family.version}`,
      setId: input.setId,
      difficulty: input.placement.difficulty,
    },
    mapParams: numericParams,
  })
}
