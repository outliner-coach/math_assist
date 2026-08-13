import type {
  ApplicationProblemSource,
  CognitiveDomain,
  ProblemContextType,
  ProblemRepresentation,
  ReadingLoad,
  ReasoningPattern,
  VisualSemantics,
} from '../types'

export type ApplicationReleaseStatus = 'draft' | 'approved' | 'quarantined' | 'retired'
export type KnowledgePackCoverageStatus = 'pilot' | 'complete'
export type OwnerApprovalStatus = 'pending' | 'approved'
export type ExpertApprovalStatus = 'not-reviewed' | 'reviewed'
export type ApplicationVisualRole = 'none' | 'support' | 'required'
export type ApplicationProofMode = 'exhaustive' | 'invariant-boundary' | 'static-corpus'
export type ApplicationRuntimeMode = 'deterministic-generator' | 'static-corpus'

export type RequiredStudentAction =
  | 'interpret_context'
  | 'select_relevant_data'
  | 'choose_model'
  | 'convert_representation'
  | 'infer_missing_value'
  | 'execute_calculation'
  | 'compare_strategies'
  | 'test_constraint'
  | 'verify_result'
  | 'evaluate_claim'

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export interface ApprovalRecordV1 {
  ownerStatus: OwnerApprovalStatus
  ownerId?: string
  approvedAt?: string
  evidenceRefs: string[]
  expertStatus: ExpertApprovalStatus
  expertId?: string
  expertReviewedAt?: string
}

export interface KnowledgePackMisconceptionV1 {
  id: string
  description: string
  diagnosticEvidence: string
  correctionStrategy: string
}

export type KnowledgePackPrerequisiteV1 =
  | { kind: 'concept'; conceptId: string }
  | { kind: 'standard'; standardCode: string }

export interface KnowledgePackConceptV1 {
  conceptId: string
  name: string
  standardCodes: string[]
  prerequisites: KnowledgePackPrerequisiteV1[]
  allowedScope: string[]
  excludedScope: string[]
  misconceptions: KnowledgePackMisconceptionV1[]
}

export interface ApplicationProblemFamilyRefV1 {
  familyId: string
  version: number
}

export interface UnitKnowledgePackV1 {
  schemaVersion: 'unit-knowledge-pack-v1'
  packId: string
  version: number
  unitId: string
  grade: 1 | 2 | 3 | 4 | 5 | 6
  semester: string
  coverageStatus: KnowledgePackCoverageStatus
  releaseStatus: ApplicationReleaseStatus
  coveredStandardCodes: string[]
  concepts: KnowledgePackConceptV1[]
  familyRefs: ApplicationProblemFamilyRefV1[]
  approval: ApprovalRecordV1
}

export type ApplicationCognitiveDomain = Exclude<CognitiveDomain, 'knowing'>
export type ApplicationReasoningPattern = Exclude<ReasoningPattern, 'direct'>

export interface ApplicationVisualPolicyV1 {
  role: ApplicationVisualRole
  semantics?: VisualSemantics
  generatorId?: string
  answerCritical: boolean
}

export interface ApplicationProblemFamilyV1 {
  schemaVersion: 'application-problem-family-v1'
  familyId: string
  version: number
  packId: string
  unitId: string
  conceptIds: string[]
  primaryStandard: string
  connectedStandards: string[]
  cognitiveDomain: ApplicationCognitiveDomain
  reasoningPattern: ApplicationReasoningPattern
  representations: ProblemRepresentation[]
  contextType: ProblemContextType
  readingLoad: ReadingLoad
  estimatedSteps: number
  modelId: string
  unknownRole: string
  requiredStudentActions: RequiredStudentAction[]
  misconceptionRefs: string[]
  visualPolicy: ApplicationVisualPolicyV1
  proofMode: ApplicationProofMode
  runtimeMode: ApplicationRuntimeMode
  releaseStatus: ApplicationReleaseStatus
  approval: ApprovalRecordV1
}

export type GeneratedAnswerFormatV1 = 'number' | 'choice' | 'text'

export interface GeneratedApplicationAnswerV1 {
  format: GeneratedAnswerFormatV1
  normalized: string
}

export interface GeneratedApplicationVisualV1 extends ApplicationVisualPolicyV1 {
  generatorVersion?: number
  mathModel?: JsonValue
}

export interface GeneratedApplicationProblemV1 extends ApplicationProblemSource {
  schemaVersion: 'generated-application-problem-v1'
  params: Record<string, JsonValue>
  prompt: string
  answer: GeneratedApplicationAnswerV1
  choices?: string[]
  correctChoiceIndex?: number
  solutionSteps: string[]
  hintSteps: string[]
  misconceptionRefs: string[]
  visual: GeneratedApplicationVisualV1
}

export interface ContractValidationIssue {
  code: string
  path: string
  message: string
}

export class ContractValidationError extends Error {
  readonly issues: ContractValidationIssue[]

  constructor(label: string, issues: ContractValidationIssue[]) {
    super(`${label} validation failed: ${issues.map((issue) => issue.message).join('; ')}`)
    this.name = 'ContractValidationError'
    this.issues = issues
  }
}

const RELEASE_STATUSES: readonly ApplicationReleaseStatus[] = [
  'draft',
  'approved',
  'quarantined',
  'retired',
]
const COVERAGE_STATUSES: readonly KnowledgePackCoverageStatus[] = ['pilot', 'complete']
const OWNER_STATUSES: readonly OwnerApprovalStatus[] = ['pending', 'approved']
const EXPERT_STATUSES: readonly ExpertApprovalStatus[] = ['not-reviewed', 'reviewed']
const COGNITIVE_DOMAINS: readonly ApplicationCognitiveDomain[] = ['applying', 'reasoning']
const REASONING_PATTERNS: readonly ReasoningPattern[] = [
  'direct',
  'inverse',
  'constraint',
  'multi_step',
  'representation_shift',
  'compare_methods',
  'error_analysis',
  'pattern_generalization',
  'systematic_counting',
  'optimization',
  'data_sufficiency',
  'model_and_check',
]
const REPRESENTATIONS: readonly ProblemRepresentation[] = [
  'text',
  'equation',
  'table',
  'diagram',
  'graph',
  'manipulative',
]
const CONTEXT_TYPES: readonly ProblemContextType[] = ['pure_math', 'real_world', 'puzzle']
const READING_LOADS: readonly ReadingLoad[] = ['low', 'medium', 'high']
const STUDENT_ACTIONS: readonly RequiredStudentAction[] = [
  'interpret_context',
  'select_relevant_data',
  'choose_model',
  'convert_representation',
  'infer_missing_value',
  'execute_calculation',
  'compare_strategies',
  'test_constraint',
  'verify_result',
  'evaluate_claim',
]
const VISUAL_ROLES: readonly ApplicationVisualRole[] = ['none', 'support', 'required']
const VISUAL_SEMANTICS: readonly VisualSemantics[] = [
  'decorative',
  'schematic',
  'quantitative',
]
const PROOF_MODES: readonly ApplicationProofMode[] = [
  'exhaustive',
  'invariant-boundary',
  'static-corpus',
]
const RUNTIME_MODES: readonly ApplicationRuntimeMode[] = [
  'deterministic-generator',
  'static-corpus',
]
const ANSWER_FORMATS: readonly GeneratedAnswerFormatV1[] = ['number', 'choice', 'text']
const STABLE_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/
const ISO_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function issue(
  issues: ContractValidationIssue[],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message })
}

function readRecord(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
): Record<string, unknown> {
  if (!isRecord(value)) {
    issue(issues, 'invalid_object', path, `${path} must be an object`)
    return {}
  }
  return value
}

function readString(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    issue(issues, 'invalid_string', path, `${path} must be a non-empty string`)
    return ''
  }
  return value
}

function readStableId(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
): string {
  const result = readString(value, path, issues)
  if (result && !STABLE_ID_PATTERN.test(result)) {
    issue(issues, 'invalid_stable_id', path, `${path} must use lowercase letters, digits, and hyphens`)
  }
  return result
}

function readPositiveInteger(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    issue(issues, 'invalid_positive_integer', path, `${path} must be a positive integer`)
    return 0
  }
  return value as number
}

function readEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  issues: ContractValidationIssue[],
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    issue(issues, 'invalid_enum_value', path, `${path} has an unsupported value`)
    return allowed[0]
  }
  return value as T
}

function readArray(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
  allowEmpty: boolean,
): unknown[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    issue(
      issues,
      'invalid_array',
      path,
      `${path} must be ${allowEmpty ? 'an array' : 'a non-empty array'}`,
    )
    return []
  }
  return value
}

function readUniqueStrings(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
  allowEmpty: boolean,
): string[] {
  const result = readArray(value, path, issues, allowEmpty).map((entry, index) =>
    readString(entry, `${path}[${index}]`, issues),
  )
  const seen = new Set<string>()
  result.forEach((entry, index) => {
    if (entry && seen.has(entry)) {
      issue(issues, 'duplicate_value', `${path}[${index}]`, `${path} contains a duplicate value`)
    }
    seen.add(entry)
  })
  return result
}

function readEnumArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  issues: ContractValidationIssue[],
  allowEmpty: boolean,
): T[] {
  const result = readArray(value, path, issues, allowEmpty).map((entry, index) =>
    readEnum(entry, allowed, `${path}[${index}]`, issues),
  )
  const seen = new Set<T>()
  result.forEach((entry, index) => {
    if (seen.has(entry)) {
      issue(issues, 'duplicate_value', `${path}[${index}]`, `${path} contains a duplicate value`)
    }
    seen.add(entry)
  })
  return result
}

function validIsoInstant(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    ISO_INSTANT_PATTERN.test(value) &&
    Number.isFinite(Date.parse(value))
  )
}

function validateApproval(
  value: unknown,
  releaseStatus: ApplicationReleaseStatus,
  path: string,
  issues: ContractValidationIssue[],
): ApprovalRecordV1 {
  const record = readRecord(value, path, issues)
  const ownerStatus = readEnum(record.ownerStatus, OWNER_STATUSES, `${path}.ownerStatus`, issues)
  const evidenceRefs = readUniqueStrings(record.evidenceRefs, `${path}.evidenceRefs`, issues, true)
  const expertStatus = readEnum(record.expertStatus, EXPERT_STATUSES, `${path}.expertStatus`, issues)

  evidenceRefs.forEach((reference, index) => {
    if (reference.startsWith('/') || reference.split('/').includes('..')) {
      issue(
        issues,
        'invalid_evidence_reference',
        `${path}.evidenceRefs[${index}]`,
        'approval evidence must be a repository-relative path',
      )
    }
  })

  if (ownerStatus === 'approved') {
    if (typeof record.ownerId !== 'string' || record.ownerId.trim() === '' || !validIsoInstant(record.approvedAt)) {
      issue(
        issues,
        'invalid_owner_approval',
        path,
        'approved owner records require ownerId and an ISO 8601 approvedAt instant',
      )
    }
  } else if (record.ownerId !== undefined || record.approvedAt !== undefined) {
    issue(
      issues,
      'pending_owner_has_approval_fields',
      path,
      'pending owner records must not contain ownerId or approvedAt',
    )
  }

  if (expertStatus === 'reviewed') {
    if (typeof record.expertId !== 'string' || record.expertId.trim() === '' || !validIsoInstant(record.expertReviewedAt)) {
      issue(
        issues,
        'invalid_expert_approval',
        path,
        'reviewed expert records require expertId and an ISO 8601 expertReviewedAt instant',
      )
    }
  } else if (record.expertId !== undefined || record.expertReviewedAt !== undefined) {
    issue(
      issues,
      'unreviewed_expert_has_approval_fields',
      path,
      'not-reviewed expert records must not contain expertId or expertReviewedAt',
    )
  }

  if (releaseStatus === 'approved' && (ownerStatus !== 'approved' || evidenceRefs.length === 0)) {
    issue(
      issues,
      'approved_release_without_evidence',
      path,
      'approved releases require owner approval and at least one evidence reference',
    )
  }

  return record as unknown as ApprovalRecordV1
}

function validateVisualPolicy(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
): ApplicationVisualPolicyV1 {
  const record = readRecord(value, path, issues)
  const role = readEnum(record.role, VISUAL_ROLES, `${path}.role`, issues)
  const answerCritical = record.answerCritical
  if (typeof answerCritical !== 'boolean') {
    issue(issues, 'invalid_boolean', `${path}.answerCritical`, `${path}.answerCritical must be a boolean`)
  }

  if (role === 'none') {
    if (record.semantics !== undefined || record.generatorId !== undefined) {
      issue(
        issues,
        'none_visual_has_payload',
        path,
        'role none must not declare semantics or a generator',
      )
    }
    if (answerCritical === true) {
      issue(issues, 'none_visual_is_answer_critical', path, 'role none cannot be answer-critical')
    }
  } else {
    const semantics = readEnum(record.semantics, VISUAL_SEMANTICS, `${path}.semantics`, issues)
    readStableId(record.generatorId, `${path}.generatorId`, issues)
    if (semantics === 'decorative' && answerCritical === true) {
      issue(
        issues,
        'decorative_visual_is_answer_critical',
        path,
        'decorative visuals cannot be answer-critical',
      )
    }
    if (role === 'support' && answerCritical === true) {
      issue(
        issues,
        'support_visual_is_answer_critical',
        path,
        'support visuals must remain optional',
      )
    }
    if (role === 'required' && answerCritical !== true) {
      issue(
        issues,
        'required_visual_not_answer_critical',
        path,
        'required visuals must be answer-critical',
      )
    }
  }

  return record as unknown as ApplicationVisualPolicyV1
}

function parsePrerequisite(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
): KnowledgePackPrerequisiteV1 {
  const record = readRecord(value, path, issues)
  const kind = readEnum(record.kind, ['concept', 'standard'] as const, `${path}.kind`, issues)
  if (kind === 'concept') {
    readStableId(record.conceptId, `${path}.conceptId`, issues)
    if (record.standardCode !== undefined) {
      issue(issues, 'invalid_prerequisite', path, 'concept prerequisites cannot include standardCode')
    }
  } else {
    readString(record.standardCode, `${path}.standardCode`, issues)
    if (record.conceptId !== undefined) {
      issue(issues, 'invalid_prerequisite', path, 'standard prerequisites cannot include conceptId')
    }
  }
  return record as unknown as KnowledgePackPrerequisiteV1
}

function parseConcept(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
): KnowledgePackConceptV1 {
  const record = readRecord(value, path, issues)
  readStableId(record.conceptId, `${path}.conceptId`, issues)
  readString(record.name, `${path}.name`, issues)
  readUniqueStrings(record.standardCodes, `${path}.standardCodes`, issues, false)
  const prerequisites = readArray(record.prerequisites, `${path}.prerequisites`, issues, true).map(
    (entry, index) => parsePrerequisite(entry, `${path}.prerequisites[${index}]`, issues),
  )
  const prerequisiteKeys = new Set<string>()
  prerequisites.forEach((entry, index) => {
    const key = entry.kind === 'concept' ? `concept:${entry.conceptId}` : `standard:${entry.standardCode}`
    if (prerequisiteKeys.has(key)) {
      issue(
        issues,
        'duplicate_value',
        `${path}.prerequisites[${index}]`,
        `${path}.prerequisites contains a duplicate reference`,
      )
    }
    prerequisiteKeys.add(key)
  })
  readUniqueStrings(record.allowedScope, `${path}.allowedScope`, issues, false)
  readUniqueStrings(record.excludedScope, `${path}.excludedScope`, issues, false)
  const misconceptions = readArray(
    record.misconceptions,
    `${path}.misconceptions`,
    issues,
    false,
  ).map((entry, index) => {
    const misconception = readRecord(entry, `${path}.misconceptions[${index}]`, issues)
    readStableId(misconception.id, `${path}.misconceptions[${index}].id`, issues)
    readString(misconception.description, `${path}.misconceptions[${index}].description`, issues)
    readString(
      misconception.diagnosticEvidence,
      `${path}.misconceptions[${index}].diagnosticEvidence`,
      issues,
    )
    readString(
      misconception.correctionStrategy,
      `${path}.misconceptions[${index}].correctionStrategy`,
      issues,
    )
    return misconception as unknown as KnowledgePackMisconceptionV1
  })
  const misconceptionIds = new Set<string>()
  misconceptions.forEach((entry, index) => {
    if (misconceptionIds.has(entry.id)) {
      issue(
        issues,
        'duplicate_value',
        `${path}.misconceptions[${index}].id`,
        `${path}.misconceptions contains a duplicate id`,
      )
    }
    misconceptionIds.add(entry.id)
  })
  return record as unknown as KnowledgePackConceptV1
}

function throwIfInvalid<T>(label: string, issues: ContractValidationIssue[], value: T): T {
  if (issues.length > 0) throw new ContractValidationError(label, issues)
  return value
}

export function parseUnitKnowledgePackV1(value: unknown): UnitKnowledgePackV1 {
  const issues: ContractValidationIssue[] = []
  const record = readRecord(value, 'pack', issues)
  if (record.schemaVersion !== 'unit-knowledge-pack-v1') {
    issue(
      issues,
      'invalid_schema_version',
      'pack.schemaVersion',
      'pack.schemaVersion must equal unit-knowledge-pack-v1',
    )
  }
  readStableId(record.packId, 'pack.packId', issues)
  readPositiveInteger(record.version, 'pack.version', issues)
  readStableId(record.unitId, 'pack.unitId', issues)
  const grade = record.grade
  if (!Number.isInteger(grade) || (grade as number) < 1 || (grade as number) > 6) {
    issue(issues, 'invalid_grade', 'pack.grade', 'pack.grade must be an integer from 1 through 6')
  }
  const semester = readString(record.semester, 'pack.semester', issues)
  if (
    Number.isInteger(grade) &&
    (grade as number) >= 1 &&
    (grade as number) <= 6 &&
    semester !== `${grade}-1` &&
    semester !== `${grade}-2`
  ) {
    issue(
      issues,
      'invalid_semester',
      'pack.semester',
      `pack.semester must be ${grade}-1 or ${grade}-2`,
    )
  }
  readEnum(record.coverageStatus, COVERAGE_STATUSES, 'pack.coverageStatus', issues)
  const releaseStatus = readEnum(record.releaseStatus, RELEASE_STATUSES, 'pack.releaseStatus', issues)
  readUniqueStrings(record.coveredStandardCodes, 'pack.coveredStandardCodes', issues, false)
  const concepts = readArray(record.concepts, 'pack.concepts', issues, false).map((entry, index) =>
    parseConcept(entry, `pack.concepts[${index}]`, issues),
  )
  const conceptIds = new Set<string>()
  concepts.forEach((concept, index) => {
    if (conceptIds.has(concept.conceptId)) {
      issue(
        issues,
        'duplicate_value',
        `pack.concepts[${index}].conceptId`,
        'pack.concepts contains a duplicate conceptId',
      )
    }
    conceptIds.add(concept.conceptId)
  })
  const familyRefs = readArray(record.familyRefs, 'pack.familyRefs', issues, false).map(
    (entry, index) => {
      const reference = readRecord(entry, `pack.familyRefs[${index}]`, issues)
      readStableId(reference.familyId, `pack.familyRefs[${index}].familyId`, issues)
      readPositiveInteger(reference.version, `pack.familyRefs[${index}].version`, issues)
      return reference as unknown as ApplicationProblemFamilyRefV1
    },
  )
  const familyKeys = new Set<string>()
  familyRefs.forEach((reference, index) => {
    const key = `${reference.familyId}@${reference.version}`
    if (familyKeys.has(key)) {
      issue(
        issues,
        'duplicate_value',
        `pack.familyRefs[${index}]`,
        'pack.familyRefs contains a duplicate family version',
      )
    }
    familyKeys.add(key)
  })
  validateApproval(record.approval, releaseStatus, 'pack.approval', issues)
  return throwIfInvalid('UnitKnowledgePackV1', issues, record as unknown as UnitKnowledgePackV1)
}

export function parseApplicationProblemFamilyV1(value: unknown): ApplicationProblemFamilyV1 {
  const issues: ContractValidationIssue[] = []
  const record = readRecord(value, 'family', issues)
  if (record.schemaVersion !== 'application-problem-family-v1') {
    issue(
      issues,
      'invalid_schema_version',
      'family.schemaVersion',
      'family.schemaVersion must equal application-problem-family-v1',
    )
  }
  readStableId(record.familyId, 'family.familyId', issues)
  readPositiveInteger(record.version, 'family.version', issues)
  readStableId(record.packId, 'family.packId', issues)
  readStableId(record.unitId, 'family.unitId', issues)
  readUniqueStrings(record.conceptIds, 'family.conceptIds', issues, false).forEach(
    (conceptId, index) => readStableId(conceptId, `family.conceptIds[${index}]`, issues),
  )
  const primaryStandard = readString(record.primaryStandard, 'family.primaryStandard', issues)
  const connectedStandards = readUniqueStrings(
    record.connectedStandards,
    'family.connectedStandards',
    issues,
    true,
  )
  if (connectedStandards.includes(primaryStandard)) {
    issue(
      issues,
      'duplicate_standard_reference',
      'family.connectedStandards',
      'primaryStandard must not be repeated in connectedStandards',
    )
  }
  const cognitiveDomain = readEnum(
    record.cognitiveDomain,
    COGNITIVE_DOMAINS,
    'family.cognitiveDomain',
    issues,
  )
  const reasoningPattern = readEnum(
    record.reasoningPattern,
    REASONING_PATTERNS,
    'family.reasoningPattern',
    issues,
  )
  if (reasoningPattern === 'direct') {
    issue(
      issues,
      'direct_reasoning_pattern',
      'family.reasoningPattern',
      'application families cannot use the direct reasoning pattern',
    )
  }
  readEnumArray(record.representations, REPRESENTATIONS, 'family.representations', issues, false)
  readEnum(record.contextType, CONTEXT_TYPES, 'family.contextType', issues)
  readEnum(record.readingLoad, READING_LOADS, 'family.readingLoad', issues)
  readPositiveInteger(record.estimatedSteps, 'family.estimatedSteps', issues)
  readStableId(record.modelId, 'family.modelId', issues)
  readStableId(record.unknownRole, 'family.unknownRole', issues)
  const actions = readEnumArray(
    record.requiredStudentActions,
    STUDENT_ACTIONS,
    'family.requiredStudentActions',
    issues,
    false,
  )
  const nonCalculationActions = actions.filter((action) => action !== 'execute_calculation')
  if (actions.length === 1 && actions[0] === 'execute_calculation') {
    issue(
      issues,
      'calculation_only_family',
      'family.requiredStudentActions',
      'application families must require reasoning beyond calculation',
    )
  }
  if (cognitiveDomain === 'reasoning' && nonCalculationActions.length < 2) {
    issue(
      issues,
      'insufficient_reasoning_actions',
      'family.requiredStudentActions',
      'reasoning families require at least two non-calculation actions',
    )
  }
  readUniqueStrings(record.misconceptionRefs, 'family.misconceptionRefs', issues, true).forEach(
    (misconceptionId, index) =>
      readStableId(misconceptionId, `family.misconceptionRefs[${index}]`, issues),
  )
  validateVisualPolicy(record.visualPolicy, 'family.visualPolicy', issues)
  const proofMode = readEnum(record.proofMode, PROOF_MODES, 'family.proofMode', issues)
  const runtimeMode = readEnum(record.runtimeMode, RUNTIME_MODES, 'family.runtimeMode', issues)
  if (
    (runtimeMode === 'deterministic-generator' && proofMode === 'static-corpus') ||
    (runtimeMode === 'static-corpus' && proofMode !== 'static-corpus')
  ) {
    issue(
      issues,
      'incompatible_runtime_proof',
      'family.runtimeMode',
      'runtime and proof modes do not form a supported safety pair',
    )
  }
  const releaseStatus = readEnum(record.releaseStatus, RELEASE_STATUSES, 'family.releaseStatus', issues)
  validateApproval(record.approval, releaseStatus, 'family.approval', issues)
  return throwIfInvalid(
    'ApplicationProblemFamilyV1',
    issues,
    record as unknown as ApplicationProblemFamilyV1,
  )
}

function validateJsonValue(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
  seen: Set<object>,
): value is JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return true
  }
  if (typeof value === 'number') {
    issue(issues, 'non_finite_json_number', path, `${path} must contain only finite numbers`)
    return false
  }
  if (typeof value !== 'object' || value === null) {
    issue(issues, 'invalid_json_value', path, `${path} is not a JSON value`)
    return false
  }
  if (seen.has(value)) {
    issue(issues, 'cyclic_json_value', path, `${path} must not contain cycles`)
    return false
  }
  seen.add(value)
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateJsonValue(entry, `${path}[${index}]`, issues, seen))
  } else {
    Object.entries(value).forEach(([key, entry]) =>
      validateJsonValue(entry, `${path}.${key}`, issues, seen),
    )
  }
  seen.delete(value)
  return true
}

function validateGeneratedVisual(
  value: unknown,
  path: string,
  issues: ContractValidationIssue[],
): GeneratedApplicationVisualV1 {
  const record = readRecord(value, path, issues)
  const policy = validateVisualPolicy(record, path, issues)
  if (policy.role === 'none') {
    if (record.generatorVersion !== undefined || record.mathModel !== undefined) {
      issue(
        issues,
        'none_visual_has_generated_payload',
        path,
        'role none must not contain a generator version or math model',
      )
    }
  } else {
    readPositiveInteger(record.generatorVersion, `${path}.generatorVersion`, issues)
    if (policy.semantics === 'quantitative' && record.mathModel === undefined) {
      issue(
        issues,
        'quantitative_visual_missing_math_model',
        `${path}.mathModel`,
        'quantitative visuals require their source math model',
      )
    }
    if (record.mathModel !== undefined) {
      validateJsonValue(record.mathModel, `${path}.mathModel`, issues, new Set<object>())
    }
  }
  return record as unknown as GeneratedApplicationVisualV1
}

export function parseGeneratedApplicationProblemV1(value: unknown): GeneratedApplicationProblemV1 {
  const issues: ContractValidationIssue[] = []
  const record = readRecord(value, 'problem', issues)
  if (record.schemaVersion !== 'generated-application-problem-v1') {
    issue(
      issues,
      'invalid_schema_version',
      'problem.schemaVersion',
      'problem.schemaVersion must equal generated-application-problem-v1',
    )
  }
  const familyId = readStableId(record.familyId, 'problem.familyId', issues)
  const generatorVersion = readPositiveInteger(
    record.generatorVersion,
    'problem.generatorVersion',
    issues,
  )
  readStableId(record.packId, 'problem.packId', issues)
  readPositiveInteger(record.packVersion, 'problem.packVersion', issues)
  if (!Number.isSafeInteger(record.seed)) {
    issue(issues, 'invalid_seed', 'problem.seed', 'problem.seed must be a safe integer')
  }
  if (!Number.isSafeInteger(record.variantIndex) || (record.variantIndex as number) < 0) {
    issue(
      issues,
      'invalid_variant_index',
      'problem.variantIndex',
      'problem.variantIndex must be a non-negative safe integer',
    )
  }
  const expectedInstanceId = `${familyId}@${generatorVersion}:${record.seed}:${record.variantIndex}`
  if (record.instanceId !== expectedInstanceId) {
    issue(
      issues,
      'invalid_instance_id',
      'problem.instanceId',
      `problem.instanceId must equal ${expectedInstanceId}`,
    )
  }
  readUniqueStrings(record.curriculumCodes, 'problem.curriculumCodes', issues, false)
  const params = readRecord(record.params, 'problem.params', issues)
  validateJsonValue(params, 'problem.params', issues, new Set<object>())
  readString(record.prompt, 'problem.prompt', issues)
  const answer = readRecord(record.answer, 'problem.answer', issues)
  const answerFormat = readEnum(answer.format, ANSWER_FORMATS, 'problem.answer.format', issues)
  const normalizedAnswer = readString(answer.normalized, 'problem.answer.normalized', issues)
  if (answerFormat === 'choice') {
    const choices = readUniqueStrings(record.choices, 'problem.choices', issues, false)
    if (choices.length < 2) {
      issue(issues, 'insufficient_choices', 'problem.choices', 'choice problems require at least two choices')
    }
    if (
      !Number.isSafeInteger(record.correctChoiceIndex) ||
      (record.correctChoiceIndex as number) < 0 ||
      (record.correctChoiceIndex as number) >= choices.length
    ) {
      issue(
        issues,
        'invalid_correct_choice_index',
        'problem.correctChoiceIndex',
        'correctChoiceIndex must point to one of the choices',
      )
    } else if (choices[record.correctChoiceIndex as number] !== normalizedAnswer) {
      issue(
        issues,
        'choice_answer_mismatch',
        'problem.answer.normalized',
        'the normalized answer must equal the indexed correct choice',
      )
    }
  } else if (record.choices !== undefined || record.correctChoiceIndex !== undefined) {
    issue(
      issues,
      'non_choice_has_choices',
      'problem.answer',
      'non-choice problems must not contain choices or a correct choice index',
    )
  }
  readUniqueStrings(record.solutionSteps, 'problem.solutionSteps', issues, false)
  readUniqueStrings(record.hintSteps, 'problem.hintSteps', issues, false)
  readUniqueStrings(record.misconceptionRefs, 'problem.misconceptionRefs', issues, true).forEach(
    (misconceptionId, index) =>
      readStableId(misconceptionId, `problem.misconceptionRefs[${index}]`, issues),
  )
  validateGeneratedVisual(record.visual, 'problem.visual', issues)
  return throwIfInvalid(
    'GeneratedApplicationProblemV1',
    issues,
    record as unknown as GeneratedApplicationProblemV1,
  )
}

export interface UnitKnowledgePackCoverageContext {
  unitStandardCodes: readonly string[]
  coreConceptIds: readonly string[]
  requiredRepresentations: readonly ProblemRepresentation[]
  hasKnowingCoverage: boolean
  families: readonly ApplicationProblemFamilyV1[]
}

export function validateUnitKnowledgePackCoverage(
  pack: UnitKnowledgePackV1,
  context: UnitKnowledgePackCoverageContext,
): ContractValidationIssue[] {
  if (pack.coverageStatus !== 'complete') return []
  const issues: ContractValidationIssue[] = []
  const coveredStandards = new Set(pack.coveredStandardCodes)
  if (context.unitStandardCodes.some((standardCode) => !coveredStandards.has(standardCode))) {
    issue(
      issues,
      'incomplete_standard_coverage',
      'pack.coveredStandardCodes',
      'complete packs must cover every standard assigned to the unit',
    )
  }
  const concepts = new Set(pack.concepts.map((concept) => concept.conceptId))
  const missingCoreConcepts = context.coreConceptIds.filter((conceptId) => !concepts.has(conceptId))
  if (missingCoreConcepts.length > 0) {
    issue(
      issues,
      'missing_core_concept',
      'pack.concepts',
      `complete packs are missing core concepts: ${missingCoreConcepts.join(', ')}`,
    )
  }
  const declaredFamilyKeys = new Set(
    pack.familyRefs.map((reference) => `${reference.familyId}@${reference.version}`),
  )
  const families = context.families.filter((family) =>
    declaredFamilyKeys.has(`${family.familyId}@${family.version}`),
  )
  context.coreConceptIds.forEach((conceptId) => {
    if (
      concepts.has(conceptId) &&
      !families.some(
        (family) => family.cognitiveDomain === 'applying' && family.conceptIds.includes(conceptId),
      )
    ) {
      issue(
        issues,
        'missing_applying_family',
        'pack.familyRefs',
        `core concept ${conceptId} has no applying family`,
      )
    }
  })
  const reasoningFamilies = families.filter((family) => family.cognitiveDomain === 'reasoning')
  if (reasoningFamilies.length < 3) {
    issue(
      issues,
      'insufficient_reasoning_families',
      'pack.familyRefs',
      'complete packs require at least three reasoning families',
    )
  }
  if (new Set(reasoningFamilies.map((family) => family.reasoningPattern)).size < 3) {
    issue(
      issues,
      'insufficient_reasoning_patterns',
      'pack.familyRefs',
      'complete packs require at least three distinct reasoning patterns',
    )
  }
  const usedMisconceptions = new Set(families.flatMap((family) => family.misconceptionRefs))
  const declaredMisconceptions = pack.concepts.flatMap((concept) => concept.misconceptions)
  declaredMisconceptions.forEach((misconception) => {
    if (!usedMisconceptions.has(misconception.id)) {
      issue(
        issues,
        'unused_misconception',
        'pack.familyRefs',
        `misconception ${misconception.id} is not used by any family`,
      )
    }
  })
  if (!context.hasKnowingCoverage) {
    issue(
      issues,
      'missing_knowing_coverage',
      'pack.coverageStatus',
      'complete packs require evidence of knowing coverage from the full unit bank',
    )
  }
  const represented = new Set(families.flatMap((family) => family.representations))
  const missingRepresentations = context.requiredRepresentations.filter(
    (representation) => !represented.has(representation),
  )
  if (missingRepresentations.length > 0) {
    issue(
      issues,
      'missing_representation_coverage',
      'pack.familyRefs',
      `complete packs are missing representations: ${missingRepresentations.join(', ')}`,
    )
  }
  return issues
}

export interface ApplicationProblemCatalogInput {
  packs: readonly UnitKnowledgePackV1[]
  families: readonly ApplicationProblemFamilyV1[]
  ledgerAllocations: readonly CurriculumStandardAllocationV1[]
  completeCoverageContexts?: readonly CompletePackCoverageContext[]
  previous?: {
    packs: readonly UnitKnowledgePackV1[]
    families: readonly ApplicationProblemFamilyV1[]
  }
}

export interface CurriculumStandardAllocationV1 {
  standardCode: string
  unitId: string
  assignedGrade: 1 | 2 | 3 | 4 | 5 | 6
  semester: string
}

export interface CompletePackCoverageContext {
  packId: string
  version: number
  coreConceptIds: readonly string[]
  requiredRepresentations: readonly ProblemRepresentation[]
  hasKnowingCoverage: boolean
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function releaseComparable(value: object): Record<string, unknown> {
  const content = { ...(value as Record<string, unknown>) }
  delete content.approval
  delete content.releaseStatus
  return content
}

function validatePackIdentity(
  packs: readonly UnitKnowledgePackV1[],
  issues: ContractValidationIssue[],
): void {
  const byVersion = new Map<string, UnitKnowledgePackV1>()
  const byId = new Map<string, UnitKnowledgePackV1>()
  packs.forEach((pack, index) => {
    const key = `${pack.packId}@${pack.version}`
    const sameVersion = byVersion.get(key)
    if (sameVersion) {
      issue(issues, 'duplicate_pack_version', `packs[${index}]`, `duplicate pack version ${key}`)
    }
    byVersion.set(key, pack)
    const sameId = byId.get(pack.packId)
    if (
      sameId &&
      (sameId.unitId !== pack.unitId ||
        sameId.grade !== pack.grade ||
        sameId.semester !== pack.semester)
    ) {
      issue(
        issues,
        'pack_identity_reused',
        `packs[${index}]`,
        `packId ${pack.packId} is reused for a different unit identity`,
      )
    }
    if (!sameId) byId.set(pack.packId, pack)
  })
}

function validateFamilyIdentity(
  families: readonly ApplicationProblemFamilyV1[],
  issues: ContractValidationIssue[],
): void {
  const byVersion = new Map<string, ApplicationProblemFamilyV1>()
  const byId = new Map<string, ApplicationProblemFamilyV1>()
  const byStructure = new Map<string, ApplicationProblemFamilyV1>()
  families.forEach((family, index) => {
    const key = `${family.familyId}@${family.version}`
    const sameVersion = byVersion.get(key)
    if (sameVersion) {
      issue(
        issues,
        'duplicate_family_version',
        `families[${index}]`,
        `duplicate family version ${key}`,
      )
      if (
        stableJson(releaseComparable(sameVersion)) !== stableJson(releaseComparable(family))
      ) {
        issue(
          issues,
          'family_version_changed',
          `families[${index}]`,
          `family version ${key} has more than one content meaning`,
        )
      }
    }
    byVersion.set(key, family)
    const sameId = byId.get(family.familyId)
    if (sameId && (sameId.packId !== family.packId || sameId.unitId !== family.unitId)) {
      issue(
        issues,
        'family_identity_reused',
        `families[${index}]`,
        `familyId ${family.familyId} is reused in a different pack or unit`,
      )
    }
    if (!sameId) byId.set(family.familyId, family)
    const structureKey = stableJson([
      family.unitId,
      family.modelId,
      family.unknownRole,
      family.reasoningPattern,
      family.requiredStudentActions,
    ])
    const sameStructure = byStructure.get(structureKey)
    if (sameStructure && sameStructure.familyId !== family.familyId) {
      issue(
        issues,
        'duplicate_family_structure',
        `families[${index}]`,
        `${family.familyId} duplicates the reasoning structure of ${sameStructure.familyId}`,
      )
    }
    if (!sameStructure) byStructure.set(structureKey, family)
  })
}

function allocationMatchesPack(
  allocation: CurriculumStandardAllocationV1,
  pack: UnitKnowledgePackV1,
): boolean {
  return (
    allocation.unitId === pack.unitId &&
    allocation.assignedGrade === pack.grade &&
    allocation.semester === pack.semester
  )
}

function validateLedgerAllocations(
  allocations: readonly CurriculumStandardAllocationV1[],
  issues: ContractValidationIssue[],
): Map<string, CurriculumStandardAllocationV1> {
  const byCode = new Map<string, CurriculumStandardAllocationV1>()
  allocations.forEach((allocation, index) => {
    const path = `ledgerAllocations[${index}]`
    if (
      typeof allocation.standardCode !== 'string' ||
      allocation.standardCode.trim() === '' ||
      typeof allocation.unitId !== 'string' ||
      allocation.unitId.trim() === '' ||
      !Number.isInteger(allocation.assignedGrade) ||
      allocation.assignedGrade < 1 ||
      allocation.assignedGrade > 6 ||
      (allocation.semester !== `${allocation.assignedGrade}-1` &&
        allocation.semester !== `${allocation.assignedGrade}-2`)
    ) {
      issue(
        issues,
        'invalid_ledger_allocation',
        path,
        'ledger allocation must declare a standard, unit, grade 1-6, and matching semester',
      )
    }
    if (byCode.has(allocation.standardCode)) {
      issue(
        issues,
        'duplicate_standard_allocation',
        path,
        `standard ${allocation.standardCode} has more than one allocation`,
      )
    } else {
      byCode.set(allocation.standardCode, allocation)
    }
  })
  return byCode
}

function latestPreviousVersion<T extends ReleaseVersionLike>(
  values: readonly T[],
  identity: string,
): T | undefined {
  return values
    .filter((value) => releaseIdentity(value) === identity)
    .reduce<T | undefined>(
      (latest, value) => (!latest || value.version > latest.version ? value : latest),
      undefined,
    )
}

function validateCatalogEvolution<T extends ReleaseVersionLike>(
  current: readonly T[],
  previous: readonly T[],
): ContractValidationIssue[] {
  const previousByVersion = new Map(
    previous.map((value) => [`${releaseIdentity(value)}@${value.version}`, value]),
  )
  return current.flatMap((value) => {
    const identity = releaseIdentity(value)
    const sameVersion = previousByVersion.get(`${identity}@${value.version}`)
    return validateReleaseTransition(
      sameVersion ?? latestPreviousVersion(previous, identity),
      value,
    )
  })
}

export function validateApplicationProblemCatalog(
  input: ApplicationProblemCatalogInput,
): ContractValidationIssue[] {
  const issues: ContractValidationIssue[] = []
  validatePackIdentity(input.packs, issues)
  validateFamilyIdentity(input.families, issues)
  const allocations = validateLedgerAllocations(input.ledgerAllocations, issues)
  const completeCoverageContexts = new Map<string, CompletePackCoverageContext>()
  const providedCoverageContexts = input.completeCoverageContexts ?? []
  providedCoverageContexts.forEach((context, index) => {
    const key = `${context.packId}@${context.version}`
    if (completeCoverageContexts.has(key)) {
      issue(
        issues,
        'duplicate_complete_coverage_context',
        `completeCoverageContexts[${index}]`,
        `complete coverage context ${key} is duplicated`,
      )
    } else {
      completeCoverageContexts.set(key, context)
    }
  })
  const familyVersions = new Map(
    input.families.map((family) => [`${family.familyId}@${family.version}`, family]),
  )
  const declaredFamilyVersions = new Set(
    input.packs.flatMap((pack) =>
      pack.familyRefs.map((reference) => `${reference.familyId}@${reference.version}`),
    ),
  )
  input.families.forEach((family, familyIndex) => {
    if (!declaredFamilyVersions.has(`${family.familyId}@${family.version}`)) {
      issue(
        issues,
        'family_not_declared_by_pack',
        `families[${familyIndex}]`,
        `${family.familyId}@${family.version} is not declared by a unit knowledge pack`,
      )
    }
  })

  input.packs.forEach((pack, packIndex) => {
    const conceptIds = new Set(pack.concepts.map((concept) => concept.conceptId))
    const coveredStandards = new Set(pack.coveredStandardCodes)
    const misconceptionIds = new Set(
      pack.concepts.flatMap((concept) => concept.misconceptions.map((entry) => entry.id)),
    )
    if (pack.semester !== `${pack.grade}-1` && pack.semester !== `${pack.grade}-2`) {
      issue(
        issues,
        'invalid_semester',
        `packs[${packIndex}].semester`,
        `pack semester ${pack.semester} does not match Grade ${pack.grade}`,
      )
    }
    pack.coveredStandardCodes.forEach((standardCode, standardIndex) => {
      const allocation = allocations.get(standardCode)
      if (!allocation) {
        issue(
          issues,
          'unknown_standard_reference',
          `packs[${packIndex}].coveredStandardCodes[${standardIndex}]`,
          `unknown standard ${standardCode}`,
        )
      } else if (!allocationMatchesPack(allocation, pack)) {
        issue(
          issues,
          'standard_allocation_mismatch',
          `packs[${packIndex}].coveredStandardCodes[${standardIndex}]`,
          `standard ${standardCode} is allocated to another unit, grade, or semester`,
        )
      }
    })
    pack.concepts.forEach((concept, conceptIndex) => {
      concept.standardCodes.forEach((standardCode, standardIndex) => {
        if (!allocations.has(standardCode)) {
          issue(
            issues,
            'unknown_standard_reference',
            `packs[${packIndex}].concepts[${conceptIndex}].standardCodes[${standardIndex}]`,
            `unknown standard ${standardCode}`,
          )
        }
        if (!coveredStandards.has(standardCode)) {
          issue(
            issues,
            'concept_standard_outside_pack',
            `packs[${packIndex}].concepts[${conceptIndex}].standardCodes[${standardIndex}]`,
            `concept standard ${standardCode} is not declared in coveredStandardCodes`,
          )
        }
      })
      concept.prerequisites.forEach((prerequisite, prerequisiteIndex) => {
        if (prerequisite.kind === 'concept' && !conceptIds.has(prerequisite.conceptId)) {
          issue(
            issues,
            'unknown_prerequisite_reference',
            `packs[${packIndex}].concepts[${conceptIndex}].prerequisites[${prerequisiteIndex}]`,
            `unknown concept prerequisite ${prerequisite.conceptId}`,
          )
        }
        if (prerequisite.kind === 'standard' && !allocations.has(prerequisite.standardCode)) {
          issue(
            issues,
            'unknown_prerequisite_reference',
            `packs[${packIndex}].concepts[${conceptIndex}].prerequisites[${prerequisiteIndex}]`,
            `unknown standard prerequisite ${prerequisite.standardCode}`,
          )
        }
      })
    })
    pack.familyRefs.forEach((reference, referenceIndex) => {
      const family = familyVersions.get(`${reference.familyId}@${reference.version}`)
      if (!family) {
        issue(
          issues,
          'unknown_family_reference',
          `packs[${packIndex}].familyRefs[${referenceIndex}]`,
          `unknown family version ${reference.familyId}@${reference.version}`,
        )
        return
      }
      if (family.packId !== pack.packId || family.unitId !== pack.unitId) {
        issue(
          issues,
          'family_pack_mismatch',
          `packs[${packIndex}].familyRefs[${referenceIndex}]`,
          `${reference.familyId}@${reference.version} belongs to another pack or unit`,
        )
      }
      if (pack.releaseStatus === 'approved' && family.releaseStatus === 'retired') {
        issue(
          issues,
          'approved_pack_references_retired_family',
          `packs[${packIndex}].familyRefs[${referenceIndex}]`,
          `approved pack ${pack.packId} cannot activate retired family ${family.familyId}`,
        )
      }
      family.conceptIds.forEach((conceptId, conceptIndex) => {
        if (!conceptIds.has(conceptId)) {
          issue(
            issues,
            'unknown_concept_reference',
            `families.${family.familyId}.conceptIds[${conceptIndex}]`,
            `unknown concept ${conceptId}`,
          )
        }
      })
      ;[family.primaryStandard, ...family.connectedStandards].forEach(
        (standardCode, standardIndex) => {
          const allocation = allocations.get(standardCode)
          if (!allocation) {
            issue(
              issues,
              'unknown_standard_reference',
              `families.${family.familyId}.standards[${standardIndex}]`,
              `unknown standard ${standardCode}`,
            )
          } else if (!allocationMatchesPack(allocation, pack)) {
            issue(
              issues,
              'family_standard_allocation_mismatch',
              `families.${family.familyId}.standards[${standardIndex}]`,
              `family standard ${standardCode} is allocated outside ${pack.packId}`,
            )
          }
          if (!coveredStandards.has(standardCode)) {
            issue(
              issues,
              standardIndex === 0
                ? 'primary_standard_outside_pack'
                : 'connected_standard_outside_pack',
              `families.${family.familyId}.standards[${standardIndex}]`,
              `family standard ${standardCode} is not covered by ${pack.packId}`,
            )
          }
        },
      )
      family.misconceptionRefs.forEach((misconceptionId, misconceptionIndex) => {
        if (!misconceptionIds.has(misconceptionId)) {
          issue(
            issues,
            'unknown_misconception_reference',
            `families.${family.familyId}.misconceptionRefs[${misconceptionIndex}]`,
            `unknown misconception ${misconceptionId}`,
          )
        }
      })
    })
    if (pack.coverageStatus === 'complete') {
      const coverageKey = `${pack.packId}@${pack.version}`
      const coverageContext = completeCoverageContexts.get(coverageKey)
      if (!coverageContext) {
        issue(
          issues,
          'missing_complete_coverage_context',
          `packs[${packIndex}].coverageStatus`,
          `complete pack ${coverageKey} requires explicit completeness evidence`,
        )
      } else {
        if (
          coverageContext.coreConceptIds.length === 0 ||
          coverageContext.requiredRepresentations.length === 0
        ) {
          issue(
            issues,
            'invalid_complete_coverage_context',
            `completeCoverageContexts.${coverageKey}`,
            'complete coverage evidence requires core concepts and representations',
          )
        }
        const unitStandardCodes = Array.from(allocations.values())
          .filter((allocation) => allocationMatchesPack(allocation, pack))
          .map((allocation) => allocation.standardCode)
        issues.push(
          ...validateUnitKnowledgePackCoverage(pack, {
            unitStandardCodes,
            coreConceptIds: coverageContext.coreConceptIds,
            requiredRepresentations: coverageContext.requiredRepresentations,
            hasKnowingCoverage: coverageContext.hasKnowingCoverage,
            families: input.families,
          }),
        )
      }
    }
  })

  if (input.previous) {
    issues.push(...validateCatalogEvolution(input.packs, input.previous.packs))
    issues.push(...validateCatalogEvolution(input.families, input.previous.families))
  }

  return issues
}

export interface ReleaseVersionLike {
  version: number
  releaseStatus: ApplicationReleaseStatus
  approval: ApprovalRecordV1
  packId?: string
  familyId?: string
}

function releaseIdentity(value: ReleaseVersionLike): string {
  return value.familyId ?? value.packId ?? ''
}

export function validateReleaseTransition(
  previous: ReleaseVersionLike | undefined,
  next: ReleaseVersionLike,
): ContractValidationIssue[] {
  const issues: ContractValidationIssue[] = []
  if (!previous) {
    if (next.version !== 1 || next.releaseStatus !== 'draft') {
      issue(
        issues,
        'new_version_not_draft',
        'releaseStatus',
        'new identities must begin at version 1 in draft status',
      )
    }
    return issues
  }
  if (releaseIdentity(previous) !== releaseIdentity(next)) {
    issue(
      issues,
      'release_identity_mismatch',
      'releaseStatus',
      'release transitions must compare the same stable identity',
    )
    return issues
  }
  if (previous.releaseStatus === 'retired') {
    const unchangedRetiredSnapshot =
      next.version === previous.version &&
      next.releaseStatus === 'retired' &&
      stableJson(releaseComparable(previous)) === stableJson(releaseComparable(next))
    if (!unchangedRetiredSnapshot) {
      issue(
        issues,
        'retired_identity_reused',
        'releaseStatus',
        'retired identities cannot change status, meaning, or version',
      )
    }
    return issues
  }
  if (next.version < previous.version || next.version > previous.version + 1) {
    issue(
      issues,
      'invalid_version_transition',
      'version',
      'versions must stay fixed for status changes or increase by one for a revision',
    )
    return issues
  }
  if (next.version === previous.version + 1) {
    if (next.releaseStatus !== 'draft') {
      issue(
        issues,
        'new_version_not_draft',
        'releaseStatus',
        'revised versions must begin in draft status',
      )
    }
    return issues
  }

  if (
    stableJson(releaseComparable(previous)) !== stableJson(releaseComparable(next)) &&
    previous.releaseStatus !== 'draft'
  ) {
    issue(
      issues,
      'released_version_changed',
      'version',
      'released, quarantined, and retired version content is immutable',
    )
  }
  if (previous.releaseStatus === 'quarantined' && next.releaseStatus === 'approved') {
    issue(
      issues,
      'quarantined_version_reapproved',
      'releaseStatus',
      'quarantined versions cannot be approved again; create a new draft version',
    )
  }
  const allowedSameVersion =
    previous.releaseStatus === next.releaseStatus ||
    (previous.releaseStatus === 'draft' &&
      ['approved', 'quarantined', 'retired'].includes(next.releaseStatus)) ||
    (previous.releaseStatus === 'approved' &&
      ['quarantined', 'retired'].includes(next.releaseStatus)) ||
    (previous.releaseStatus === 'quarantined' && next.releaseStatus === 'retired')
  if (!allowedSameVersion) {
    issue(
      issues,
      'invalid_release_transition',
      'releaseStatus',
      `cannot change ${previous.releaseStatus} to ${next.releaseStatus} on the same version`,
    )
  }
  if (
    next.releaseStatus === 'approved' &&
    (next.approval.ownerStatus !== 'approved' || next.approval.evidenceRefs.length === 0)
  ) {
    issue(
      issues,
      'approved_release_without_evidence',
      'approval',
      'approved releases require owner approval evidence',
    )
  }
  return issues
}
