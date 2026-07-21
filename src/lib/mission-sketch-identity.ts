import type { SketchDocumentKey } from './sketch-document'

export type MissionSketchGrade = 1 | 2 | 3

export interface MissionSketchIdentityInput {
  grade: MissionSketchGrade
  sessionRunKey: string | number
  missionId: string
  variantKey: string
}

export interface MissionSketchStatusInput {
  completed: boolean
  expiresAt?: number | null
  now?: number
}

export interface MissionSketchRunState {
  missionSketchRunOrdinal?: number
}

function requiredIdentityPart(value: string | number, label: string): string {
  const normalized = String(value).trim()
  if (!normalized) throw new TypeError(`${label} is required`)
  return normalized
}

export function createMissionSketchKey(input: MissionSketchIdentityInput): SketchDocumentKey {
  const sessionRunKey = requiredIdentityPart(input.sessionRunKey, 'sessionRunKey')
  const missionId = requiredIdentityPart(input.missionId, 'missionId')
  const variantKey = requiredIdentityPart(input.variantKey, 'variantKey')
  return {
    learnerId: null,
    sessionId: `grade${input.grade}:missions:${sessionRunKey}`,
    itemId: `${missionId}:${variantKey}`,
  }
}

export function normalizeMissionSketchRunOrdinal(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0
}

export function advanceMissionSketchRun<T extends MissionSketchRunState>(progress: T): T & {
  missionSketchRunOrdinal: number
} {
  return {
    ...progress,
    missionSketchRunOrdinal: normalizeMissionSketchRunOrdinal(progress.missionSketchRunOrdinal) + 1,
  }
}

export function resolveMissionSketchStatus(
  input: MissionSketchStatusInput,
): 'active' | 'completed' | 'expired' {
  const now = input.now ?? Date.now()
  if (input.expiresAt !== null && input.expiresAt !== undefined && input.expiresAt <= now) {
    return 'expired'
  }
  return input.completed ? 'completed' : 'active'
}
