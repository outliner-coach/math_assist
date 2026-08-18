import {
  ContractValidationError,
  type ContractValidationIssue,
} from './contracts'

export type ApplicationRolloutGrade = 2 | 3 | 4 | 5 | 6

export const APPLICATION_PROBLEM_BASELINE_PILOT_PACK_REFS = Object.freeze([
  'pack-g2-2-length@1',
  'pack-unit-5-1-perimeter-area@1',
  'pack-unit-6-1-ratio@1',
] as const)

export const APPLICATION_PROBLEM_BASELINE_PILOT_FAMILY_REFS = Object.freeze([
  'g2-length-route-total@1',
  'g2-length-missing-segment@1',
  'g2-length-claim-check@1',
  'g5-perimeter-boundary-rebuild@1',
  'g5-area-composite-inverse@1',
  'g5-area-overlap-reconstruction@1',
  'g6-ratio-part-whole@1',
  'g6-ratio-relative-comparison@1',
  'g6-ratio-representation-check@1',
] as const)

export interface ApplicationProblemRolloutV1 {
  schemaVersion: 'application-problem-rollout-v1'
  releasedThroughGrade: ApplicationRolloutGrade | null
  buildingGrade: ApplicationRolloutGrade | null
  baselinePilotPackRefs: string[]
  baselinePilotFamilyRefs: string[]
}

const VERSIONED_REF_PATTERN = /^[a-z0-9][a-z0-9-]*@[1-9]\d*$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function addIssue(
  issues: ContractValidationIssue[],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message })
}

function readRolloutGrade(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
): ApplicationRolloutGrade | null {
  if (value === null) return null
  if (![2, 3, 4, 5, 6].includes(value as number)) {
    addIssue(issues, 'invalid_rollout_grade', path, `${path} must be null or a Grade from 2 through 6`)
    return null
  }
  return value as ApplicationRolloutGrade
}

function validateFixedBaselineRefs(
  value: unknown,
  expected: readonly string[],
  path: string,
  issues: ContractValidationIssue[],
): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, 'invalid_baseline_pilot_refs', path, `${path} must be a non-empty array`)
    return []
  }
  const refs = value.map((entry, index) => {
    if (typeof entry !== 'string' || !VERSIONED_REF_PATTERN.test(entry)) {
      addIssue(
        issues,
        'malformed_baseline_pilot_ref',
        `${path}[${index}]`,
        `${path} must contain stable id@positive-version references`,
      )
      return typeof entry === 'string' ? entry : ''
    }
    return entry
  })
  if (new Set(refs).size !== refs.length) {
    addIssue(issues, 'duplicate_baseline_pilot_ref', path, `${path} must not contain duplicates`)
  }
  if (refs.length !== expected.length || refs.some((ref, index) => ref !== expected[index])) {
    addIssue(
      issues,
      'invalid_baseline_pilot_refs',
      path,
      `${path} must exactly match the fixed baseline pilot exception`,
    )
  }
  return refs
}

function expectedBuildingGrade(
  releasedThroughGrade: ApplicationRolloutGrade | null,
): ApplicationRolloutGrade | null {
  if (releasedThroughGrade === null) return 2
  if (releasedThroughGrade === 6) return null
  return (releasedThroughGrade + 1) as ApplicationRolloutGrade
}

export function parseApplicationProblemRolloutV1(value: unknown): ApplicationProblemRolloutV1 {
  const issues: ContractValidationIssue[] = []
  const record = isRecord(value) ? value : {}
  if (!isRecord(value)) addIssue(issues, 'invalid_object', 'rollout', 'rollout must be an object')
  const allowedFields = new Set([
    'schemaVersion',
    'releasedThroughGrade',
    'buildingGrade',
    'baselinePilotPackRefs',
    'baselinePilotFamilyRefs',
  ])
  Object.keys(record).forEach((field) => {
    if (!allowedFields.has(field)) {
      addIssue(issues, 'unknown_rollout_field', `rollout.${field}`, `rollout.${field} is not allowed`)
    }
  })
  if (record.schemaVersion !== 'application-problem-rollout-v1') {
    addIssue(
      issues,
      'invalid_schema_version',
      'rollout.schemaVersion',
      'rollout.schemaVersion must equal application-problem-rollout-v1',
    )
  }
  const releasedThroughGrade = readRolloutGrade(
    record.releasedThroughGrade,
    'rollout.releasedThroughGrade',
    issues,
  )
  const buildingGrade = readRolloutGrade(record.buildingGrade, 'rollout.buildingGrade', issues)
  if (buildingGrade !== expectedBuildingGrade(releasedThroughGrade)) {
    addIssue(
      issues,
      'invalid_rollout_state',
      'rollout.buildingGrade',
      'buildingGrade must be the immediate Grade after releasedThroughGrade, ending at 6/null',
    )
  }
  validateFixedBaselineRefs(
    record.baselinePilotPackRefs,
    APPLICATION_PROBLEM_BASELINE_PILOT_PACK_REFS,
    'rollout.baselinePilotPackRefs',
    issues,
  )
  validateFixedBaselineRefs(
    record.baselinePilotFamilyRefs,
    APPLICATION_PROBLEM_BASELINE_PILOT_FAMILY_REFS,
    'rollout.baselinePilotFamilyRefs',
    issues,
  )
  if (issues.length > 0) throw new ContractValidationError('ApplicationProblemRolloutV1', issues)
  return record as unknown as ApplicationProblemRolloutV1
}

export function validateApplicationProblemRolloutTransition(
  previous: ApplicationProblemRolloutV1,
  next: ApplicationProblemRolloutV1,
): ContractValidationIssue[] {
  const expectedReleased = previous.buildingGrade
  const expectedBuilding = expectedBuildingGrade(expectedReleased)
  const unchangedPilots =
    JSON.stringify(previous.baselinePilotPackRefs) === JSON.stringify(next.baselinePilotPackRefs) &&
    JSON.stringify(previous.baselinePilotFamilyRefs) === JSON.stringify(next.baselinePilotFamilyRefs)
  if (
    next.releasedThroughGrade === expectedReleased &&
    next.buildingGrade === expectedBuilding &&
    unchangedPilots
  ) return []
  return [{
    code: 'invalid_rollout_transition',
    path: 'rollout',
    message: 'rollout must advance exactly one Grade and preserve the fixed pilot exception',
  }]
}
