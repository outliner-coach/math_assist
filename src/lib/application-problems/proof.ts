import {
  parseApplicationProblemFamilyV1,
  parseGeneratedApplicationProblemV1,
  type ApplicationProblemFamilyV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from './contracts'

export const APPLICATION_PROOF_ERROR_CODES = [
  'PROOF_MODE_MISMATCH',
  'EMPTY_FINITE_DOMAIN',
  'DUPLICATE_CASE_ID',
  'DUPLICATE_VARIANT_INDEX',
  'INVALID_PROOF_SEED',
  'INVALID_PROOF_VARIANT',
  'ORACLE_NOT_INDEPENDENT',
  'GENERATION_FAILED',
  'INVALID_GENERATED_PROBLEM',
  'GENERATED_IDENTITY_MISMATCH',
  'ORACLE_FAILED',
  'ANSWER_MISMATCH',
  'EMPTY_BOUNDARY_SET',
  'DUPLICATE_BOUNDARY',
  'UNDECLARED_BOUNDARY',
  'BOUNDARY_NOT_EXECUTED',
  'EMPTY_STATIC_CORPUS',
  'INVALID_CORPUS_ID',
  'DUPLICATE_CORPUS_ID',
  'CORPUS_REVIEW_REQUIRED',
  'STATIC_CORPUS_DYNAMIC_GENERATOR_FORBIDDEN',
] as const

export type ApplicationProofErrorCode = (typeof APPLICATION_PROOF_ERROR_CODES)[number]

export interface ApplicationProofIssueV1 {
  code: ApplicationProofErrorCode
  message: string
  familyId: string
  version: number
  caseId?: string
  seed?: number
  variantIndex?: number
  boundary?: string
  corpusId?: string
}

export interface ApplicationProofReportV1 {
  proven: boolean
  mode: 'exhaustive' | 'invariant-boundary' | 'static-corpus'
  familyId: string
  version: number
  checkedCount: number
  issues: ApplicationProofIssueV1[]
  provenProblems: GeneratedApplicationProblemV1[]
  corpusIds?: string[]
}

export interface ApplicationProofGeneratorV1 {
  generatorId: string
  generate(input: { seed: number; variantIndex: number }): GeneratedApplicationProblemV1
}

export interface ApplicationProofOracleInputV1 {
  caseId: string
  seed: number
  variantIndex: number
  boundary?: string
  params: Readonly<Record<string, JsonValue>>
  mathModel?: JsonValue
}

export interface ApplicationProofOracleV1 {
  oracleId: string
  evaluate(input: ApplicationProofOracleInputV1): string
}

export interface ExhaustiveProofCaseV1 {
  caseId: string
  seed: number
}

export interface ExhaustiveApplicationProofV1 {
  mode: 'exhaustive'
  family: ApplicationProblemFamilyV1
  domain: {
    kind: 'finite-complete'
    cases: readonly ExhaustiveProofCaseV1[]
    variantIndexes: readonly number[]
  }
  generator: ApplicationProofGeneratorV1
  oracle: ApplicationProofOracleV1
}

export interface InvariantBoundaryProofCaseV1 {
  caseId: string
  boundary: string
  seed: number
  variantIndex: number
}

export interface InvariantBoundaryApplicationProofV1 {
  mode: 'invariant-boundary'
  family: ApplicationProblemFamilyV1
  boundaries: readonly string[]
  cases: readonly InvariantBoundaryProofCaseV1[]
  generator: ApplicationProofGeneratorV1
  oracle: ApplicationProofOracleV1
}

export interface StaticCorpusReviewV1 {
  status: 'pending' | 'approved'
  reviewerId?: string
  reviewedAt?: string
  evidenceRefs: readonly string[]
}

export interface StaticCorpusEntryV1 {
  corpusId: string
  problem: GeneratedApplicationProblemV1
  review: StaticCorpusReviewV1
}

export interface StaticCorpusApplicationProofV1 {
  mode: 'static-corpus'
  family: ApplicationProblemFamilyV1
  entries: readonly StaticCorpusEntryV1[]
}

export type ApplicationProblemProofV1 =
  | ExhaustiveApplicationProofV1
  | InvariantBoundaryApplicationProofV1
  | StaticCorpusApplicationProofV1

interface ReportState {
  family: ApplicationProblemFamilyV1
  mode: ApplicationProofReportV1['mode']
  issues: ApplicationProofIssueV1[]
  checkedCount: number
  checkedProblems: GeneratedApplicationProblemV1[]
  corpusIds?: string[]
}

interface GeneratedCaseContext {
  caseId: string
  seed: number
  variantIndex: number
  boundary?: string
}

function issue(
  state: ReportState,
  code: ApplicationProofErrorCode,
  message: string,
  context: Partial<GeneratedCaseContext & { corpusId: string }> = {},
): void {
  state.issues.push({
    code,
    message,
    familyId: state.family.familyId,
    version: state.family.version,
    ...context,
  })
}

function report(state: ReportState): ApplicationProofReportV1 {
  const proven = state.issues.length === 0
  return {
    proven,
    mode: state.mode,
    familyId: state.family.familyId,
    version: state.family.version,
    checkedCount: state.checkedCount,
    issues: state.issues,
    provenProblems: proven ? state.checkedProblems : [],
    ...(state.corpusIds === undefined ? {} : { corpusIds: state.corpusIds }),
  }
}

function createState(
  family: ApplicationProblemFamilyV1,
  mode: ApplicationProofReportV1['mode'],
): ReportState {
  return {
    family,
    mode,
    issues: [],
    checkedCount: 0,
    checkedProblems: [],
  }
}

function validateMode(state: ReportState): boolean {
  if (state.family.proofMode === state.mode) return true
  issue(
    state,
    'PROOF_MODE_MISMATCH',
    `family declares ${state.family.proofMode}, not ${state.mode}`,
  )
  return false
}

function validateGeneratorOracleIndependence(
  state: ReportState,
  generator: ApplicationProofGeneratorV1,
  oracle: ApplicationProofOracleV1,
): boolean {
  if (
    generator.generatorId.trim() !== '' &&
    oracle.oracleId.trim() !== '' &&
    generator.generatorId !== oracle.oracleId &&
    (generator.generate as unknown) !== oracle.evaluate
  ) {
    return true
  }
  issue(
    state,
    'ORACLE_NOT_INDEPENDENT',
    'generatorId and oracleId must be distinct non-empty implementation identities',
  )
  return false
}

function validateCaseIdentity(
  state: ReportState,
  context: GeneratedCaseContext,
): boolean {
  let valid = true
  if (!Number.isSafeInteger(context.seed)) {
    issue(state, 'INVALID_PROOF_SEED', 'proof seed must be a safe integer', context)
    valid = false
  }
  if (!Number.isSafeInteger(context.variantIndex) || context.variantIndex < 0) {
    issue(
      state,
      'INVALID_PROOF_VARIANT',
      'proof variantIndex must be a non-negative safe integer',
      context,
    )
    valid = false
  }
  return valid
}

function cloneJson<T extends JsonValue>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function checkGeneratedCase(
  state: ReportState,
  generator: ApplicationProofGeneratorV1,
  oracle: ApplicationProofOracleV1,
  context: GeneratedCaseContext,
): void {
  if (!validateCaseIdentity(state, context)) return

  let generated: GeneratedApplicationProblemV1
  try {
    generated = generator.generate({ seed: context.seed, variantIndex: context.variantIndex })
  } catch {
    issue(state, 'GENERATION_FAILED', 'generator failed for a declared proof case', context)
    return
  }

  let problem: GeneratedApplicationProblemV1
  try {
    problem = parseGeneratedApplicationProblemV1(generated)
  } catch {
    issue(
      state,
      'INVALID_GENERATED_PROBLEM',
      'generator returned a non-canonical GeneratedApplicationProblemV1',
      context,
    )
    return
  }
  if (
    problem.familyId !== state.family.familyId ||
    problem.generatorVersion !== state.family.version ||
    problem.seed !== context.seed ||
    problem.variantIndex !== context.variantIndex
  ) {
    issue(
      state,
      'GENERATED_IDENTITY_MISMATCH',
      'generated problem identity does not match the declared proof case',
      context,
    )
    return
  }

  let expected: string
  try {
    expected = oracle.evaluate({
      caseId: context.caseId,
      seed: context.seed,
      variantIndex: context.variantIndex,
      ...(context.boundary === undefined ? {} : { boundary: context.boundary }),
      params: cloneJson(problem.params),
      ...(problem.visual.mathModel === undefined
        ? {}
        : { mathModel: cloneJson(problem.visual.mathModel) }),
    })
    if (typeof expected !== 'string' || expected.trim() === '') {
      throw new TypeError('oracle answer must be a non-empty normalized string')
    }
  } catch {
    issue(state, 'ORACLE_FAILED', 'independent oracle failed for a declared proof case', context)
    return
  }

  state.checkedCount += 1
  state.checkedProblems.push(problem)
  if (problem.answer.normalized !== expected) {
    issue(
      state,
      'ANSWER_MISMATCH',
      'generated answer does not match the independent oracle',
      context,
    )
  }
}

function duplicateValues(values: readonly string[]): Set<string> {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  })
  return duplicates
}

function runExhaustive(input: ExhaustiveApplicationProofV1): ApplicationProofReportV1 {
  const state = createState(parseApplicationProblemFamilyV1(input.family), input.mode)
  const validMode = validateMode(state)
  const independent = validateGeneratorOracleIndependence(state, input.generator, input.oracle)
  if (input.domain.kind !== 'finite-complete' || input.domain.cases.length === 0 || input.domain.variantIndexes.length === 0) {
    issue(
      state,
      'EMPTY_FINITE_DOMAIN',
      'exhaustive proof requires a declared complete finite case and variant domain',
    )
  }

  duplicateValues(input.domain.cases.map((entry) => entry.caseId)).forEach((caseId) =>
    issue(state, 'DUPLICATE_CASE_ID', 'exhaustive case IDs must be unique', { caseId }),
  )
  const variantKeys = input.domain.variantIndexes.map(String)
  duplicateValues(variantKeys).forEach((variantIndex) =>
    issue(state, 'DUPLICATE_VARIANT_INDEX', 'exhaustive variants must be unique', {
      variantIndex: Number(variantIndex),
    }),
  )

  if (!validMode || !independent || state.issues.length > 0) return report(state)
  input.domain.cases.forEach((proofCase) => {
    input.domain.variantIndexes.forEach((variantIndex) => {
      checkGeneratedCase(state, input.generator, input.oracle, {
        caseId: proofCase.caseId,
        seed: proofCase.seed,
        variantIndex,
      })
    })
  })
  return report(state)
}

function runInvariantBoundary(
  input: InvariantBoundaryApplicationProofV1,
): ApplicationProofReportV1 {
  const state = createState(parseApplicationProblemFamilyV1(input.family), input.mode)
  const validMode = validateMode(state)
  const independent = validateGeneratorOracleIndependence(state, input.generator, input.oracle)
  if (input.boundaries.length === 0) {
    issue(state, 'EMPTY_BOUNDARY_SET', 'boundary proof requires explicit boundary classes')
  }
  duplicateValues(input.boundaries).forEach((boundary) =>
    issue(state, 'DUPLICATE_BOUNDARY', 'boundary classes must be unique', { boundary }),
  )
  duplicateValues(input.cases.map((entry) => entry.caseId)).forEach((caseId) =>
    issue(state, 'DUPLICATE_CASE_ID', 'boundary case IDs must be unique', { caseId }),
  )

  const declared = new Set(input.boundaries)
  const executed = new Set<string>()
  input.cases.forEach((proofCase) => {
    if (!declared.has(proofCase.boundary)) {
      issue(state, 'UNDECLARED_BOUNDARY', 'case uses an undeclared boundary class', proofCase)
    } else {
      executed.add(proofCase.boundary)
    }
  })
  input.boundaries.forEach((boundary) => {
    if (!executed.has(boundary)) {
      issue(
        state,
        'BOUNDARY_NOT_EXECUTED',
        'every declared boundary class must have an executed case',
        { boundary },
      )
    }
  })

  if (!validMode || !independent) return report(state)
  input.cases.forEach((proofCase) => {
    if (!declared.has(proofCase.boundary)) return
    checkGeneratedCase(state, input.generator, input.oracle, proofCase)
  })
  return report(state)
}

function validReviewedCorpusEntry(entry: StaticCorpusEntryV1): boolean {
  const isoInstant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/
  return (
    entry.review.status === 'approved' &&
    typeof entry.review.reviewerId === 'string' &&
    entry.review.reviewerId.trim() !== '' &&
    typeof entry.review.reviewedAt === 'string' &&
    isoInstant.test(entry.review.reviewedAt) &&
    Number.isFinite(Date.parse(entry.review.reviewedAt)) &&
    entry.review.evidenceRefs.length > 0 &&
    entry.review.evidenceRefs.every(
      (reference) => typeof reference === 'string' && reference.trim() !== '',
    )
  )
}

function runStaticCorpus(input: StaticCorpusApplicationProofV1): ApplicationProofReportV1 {
  const state = createState(parseApplicationProblemFamilyV1(input.family), input.mode)
  state.corpusIds = input.entries.map((entry) => entry.corpusId)
  const validMode = validateMode(state)
  if (
    Object.prototype.hasOwnProperty.call(input, 'generate') ||
    Object.prototype.hasOwnProperty.call(input, 'generator')
  ) {
    issue(
      state,
      'STATIC_CORPUS_DYNAMIC_GENERATOR_FORBIDDEN',
      'static corpus proof cannot contain a dynamic generator',
    )
    return report(state)
  }
  if (input.entries.length === 0) {
    issue(state, 'EMPTY_STATIC_CORPUS', 'static corpus proof requires reviewed entries')
  }
  input.entries.forEach((entry) => {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.corpusId)) {
      issue(
        state,
        'INVALID_CORPUS_ID',
        'static corpus IDs must use lowercase letters, digits, and hyphens',
        { corpusId: entry.corpusId },
      )
    }
  })
  duplicateValues(state.corpusIds).forEach((corpusId) =>
    issue(state, 'DUPLICATE_CORPUS_ID', 'static corpus IDs must be unique', { corpusId }),
  )
  if (!validMode) return report(state)

  input.entries.forEach((entry) => {
    if (!validReviewedCorpusEntry(entry)) {
      issue(
        state,
        'CORPUS_REVIEW_REQUIRED',
        'every static corpus entry requires explicit reviewer approval and evidence',
        { corpusId: entry.corpusId },
      )
      return
    }
    let problem: GeneratedApplicationProblemV1
    try {
      problem = parseGeneratedApplicationProblemV1(entry.problem)
    } catch {
      issue(
        state,
        'INVALID_GENERATED_PROBLEM',
        'static corpus entry is not a canonical GeneratedApplicationProblemV1',
        { corpusId: entry.corpusId },
      )
      return
    }
    if (
      problem.familyId !== state.family.familyId ||
      problem.generatorVersion !== state.family.version
    ) {
      issue(
        state,
        'GENERATED_IDENTITY_MISMATCH',
        'static corpus problem does not match familyId@version',
        {
          corpusId: entry.corpusId,
          seed: problem.seed,
          variantIndex: problem.variantIndex,
        },
      )
      return
    }
    state.checkedCount += 1
    state.checkedProblems.push(problem)
  })
  return report(state)
}

export function runApplicationProblemProof(
  input: ApplicationProblemProofV1,
): ApplicationProofReportV1 {
  switch (input.mode) {
    case 'exhaustive':
      return runExhaustive(input)
    case 'invariant-boundary':
      return runInvariantBoundary(input)
    case 'static-corpus':
      return runStaticCorpus(input)
  }
}
