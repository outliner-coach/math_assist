import {
  parseApplicationProblemFamilyV1,
  parseGeneratedApplicationProblemV1,
  type ApplicationProblemFamilyV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from './contracts'
import {
  APPLICATION_PROOF_AUTHORITY_REGISTRY_V1,
  APPLICATION_PROOF_IMPLEMENTATION_REGISTRY_V1,
} from './proof-trust-catalog'
import {
  applicationProofDependencyClosureV1,
  findApplicationProofAuthorityV1,
  findApplicationProofImplementationV1,
  isApplicationProofAuthorityRegistryV1,
  isApplicationProofImplementationRegistryV1,
  type ApplicationProofAuthorityEntryV1,
  type ApplicationProofAuthorityRegistryV1,
  type BoundaryProofAuthorityV1,
  type ExhaustiveProofAuthorityV1,
  type ApplicationProofImplementationRegistrationV1,
  type ApplicationProofImplementationRegistryV1,
  type StaticCorpusProofAuthorityV1,
} from './proof-trust.internal'

export { createApplicationProofManifestDigest } from './proof-trust.internal'
export type {
  ApplicationProofAuthorityEntryV1,
  ApplicationProofAuthorityRegistryV1,
} from './proof-trust.internal'

export const APPLICATION_PROOF_ERROR_CODES = [
  'PROOF_MODE_MISMATCH',
  'EMPTY_FINITE_DOMAIN',
  'DUPLICATE_CASE_ID',
  'DUPLICATE_VARIANT_INDEX',
  'INVALID_PROOF_SEED',
  'INVALID_PROOF_VARIANT',
  'ORACLE_NOT_INDEPENDENT',
  'INVALID_PROOF_AUTHORITY_REGISTRY',
  'PROOF_AUTHORITY_NOT_FOUND',
  'INVALID_PROOF_IMPLEMENTATION_REGISTRY',
  'IMPLEMENTATION_NOT_REGISTERED',
  'IMPLEMENTATION_CALLBACK_MISMATCH',
  'INVALID_PROOF_MANIFEST',
  'MANIFEST_REVIEW_REQUIRED',
  'MANIFEST_FAMILY_MISMATCH',
  'MANIFEST_DOMAIN_TOO_SMALL',
  'MANIFEST_COUNT_MISMATCH',
  'MANIFEST_DIGEST_MISMATCH',
  'MANIFEST_CASE_SET_MISMATCH',
  'BOUNDARY_SET_MISMATCH',
  'DOMAIN_ENUMERATION_FAILED',
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
  authorityId?: string
}

export interface ApplicationProofAuthorityRefV1 {
  authorityId: string
  authorityVersion: number
  domainDigest: string
  sourceModule: string
  sourceDigest: string
}

export interface ApplicationProofImplementationRefV1 {
  kind: 'generator' | 'oracle'
  implementationId: string
  implementationVersion: number
  sourceModule: string
  sourceDigest: string
  rootDependency: {
    dependencyId: string
    dependencyVersion: number
    digest: string
  }
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
  authorityRef?: ApplicationProofAuthorityRefV1
  generatorRef?: ApplicationProofImplementationRefV1
  oracleRef?: ApplicationProofImplementationRefV1
}

export interface ApplicationProofGeneratorV1 {
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
  authorityRef?: ApplicationProofAuthorityRefV1
  generatorRef?: ApplicationProofImplementationRefV1
  oracleRef?: ApplicationProofImplementationRefV1
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
  context: Partial<GeneratedCaseContext & { corpusId: string; authorityId: string }> = {},
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
    ...(state.authorityRef === undefined ? {} : { authorityRef: state.authorityRef }),
    ...(state.generatorRef === undefined ? {} : { generatorRef: state.generatorRef }),
    ...(state.oracleRef === undefined ? {} : { oracleRef: state.oracleRef }),
  }
}

function bindAuthority(
  state: ReportState,
  authority: ApplicationProofAuthorityEntryV1,
): void {
  const { manifest } = authority
  state.authorityRef = {
    authorityId: manifest.authorityId,
    authorityVersion: manifest.authorityVersion,
    domainDigest: manifest.domainDigest,
    sourceModule: manifest.sourceModule,
    sourceDigest: manifest.sourceDigest,
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

function proofImplementationRef(
  registration: ApplicationProofImplementationRegistrationV1,
): ApplicationProofImplementationRefV1 {
  return {
    kind: registration.kind,
    implementationId: registration.implementationId,
    implementationVersion: registration.implementationVersion,
    sourceModule: registration.sourceModule,
    sourceDigest: registration.sourceDigest,
    rootDependency: { ...registration.rootDependency },
  }
}

function dependencyRefKey(reference: {
  dependencyId: string
  dependencyVersion: number
}): string {
  return `${reference.dependencyId}@${reference.dependencyVersion}`
}

function validateGeneratorOracleIndependence(
  state: ReportState,
  authority: ExhaustiveProofAuthorityV1 | BoundaryProofAuthorityV1,
  registry: ApplicationProofImplementationRegistryV1,
  generator: ApplicationProofGeneratorV1,
  oracle: ApplicationProofOracleV1,
): boolean {
  const { generatorRef, oracleRef, allowedSharedInfrastructure = [] } = authority.manifest
  if (generatorRef === undefined || oracleRef === undefined) {
    issue(state, 'IMPLEMENTATION_NOT_REGISTERED', 'authority does not pin exact implementations')
    return false
  }
  const generatorRegistration = findApplicationProofImplementationV1(
    registry,
    'generator',
    generatorRef.implementationId,
    generatorRef.implementationVersion,
  )
  const oracleRegistration = findApplicationProofImplementationV1(
    registry,
    'oracle',
    oracleRef.implementationId,
    oracleRef.implementationVersion,
  )
  if (
    generatorRegistration === undefined ||
    generatorRegistration.kind !== 'generator' ||
    generatorRegistration.sourceDigest !== generatorRef.sourceDigest ||
    oracleRegistration === undefined ||
    oracleRegistration.kind !== 'oracle' ||
    oracleRegistration.sourceDigest !== oracleRef.sourceDigest
  ) {
    issue(
      state,
      'IMPLEMENTATION_NOT_REGISTERED',
      'authority-pinned generator and oracle refs must resolve exactly in the trusted registry',
    )
    return false
  }
  state.generatorRef = proofImplementationRef(generatorRegistration)
  state.oracleRef = proofImplementationRef(oracleRegistration)
  if (
    generator.generate !== generatorRegistration.execute ||
    oracle.evaluate !== oracleRegistration.execute
  ) {
    issue(
      state,
      'IMPLEMENTATION_CALLBACK_MISMATCH',
      'proof callbacks must be the exact functions registered by the authority refs',
    )
    return false
  }
  if (
    generatorRegistration.implementationId === oracleRegistration.implementationId ||
    generatorRegistration.sourceModule === oracleRegistration.sourceModule ||
    generatorRegistration.execute === (oracleRegistration.execute as unknown)
  ) {
    issue(state, 'ORACLE_NOT_INDEPENDENT', 'generator and oracle implementations must be distinct')
    return false
  }

  const generatorClosure = applicationProofDependencyClosureV1(
    registry,
    generatorRegistration.rootDependency,
  )
  const oracleClosure = applicationProofDependencyClosureV1(
    registry,
    oracleRegistration.rootDependency,
  )
  const allowed = new Map(
    allowedSharedInfrastructure.map((reference) => [dependencyRefKey(reference), reference]),
  )
  let invalidSharedDependency = false
  generatorClosure.forEach((dependency, key) => {
    if (!oracleClosure.has(key)) return
    const allowedReference = allowed.get(key)
    if (
      dependency.kind !== 'infrastructure' ||
      allowedReference === undefined ||
      allowedReference.digest !== dependency.digest
    ) {
      invalidSharedDependency = true
    }
  })
  if (invalidSharedDependency) {
    issue(
      state,
      'ORACLE_NOT_INDEPENDENT',
      'generator and oracle dependency closures may share only authority-allowed infrastructure',
    )
    return false
  }
  return true
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

function exactUniqueSetMatch(left: readonly string[], right: readonly string[]): boolean {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  if (leftSet.size !== left.length || rightSet.size !== right.length) return false
  if (leftSet.size !== rightSet.size) return false
  return left.every((value) => rightSet.has(value))
}

function exhaustiveCaseKey(
  entry: ExhaustiveProofCaseV1 & { variantIndex: number },
): string {
  return JSON.stringify([entry.caseId, entry.seed, entry.variantIndex])
}

function boundaryCaseKey(entry: InvariantBoundaryProofCaseV1): string {
  return JSON.stringify([entry.caseId, entry.boundary, entry.seed, entry.variantIndex])
}

function runExhaustive(
  input: ExhaustiveApplicationProofV1,
  authority: ExhaustiveProofAuthorityV1,
  implementationRegistry: ApplicationProofImplementationRegistryV1,
): ApplicationProofReportV1 {
  const state = createState(parseApplicationProblemFamilyV1(input.family), input.mode)
  bindAuthority(state, authority)
  const validMode = validateMode(state)
  const independent = validateGeneratorOracleIndependence(
    state,
    authority,
    implementationRegistry,
    input.generator,
    input.oracle,
  )
  const authoritativeCases = authority.domain
  const submittedCases = input.domain.cases.flatMap((entry) =>
    input.domain.variantIndexes.map((variantIndex) => ({ ...entry, variantIndex })),
  )
  if (
    !exactUniqueSetMatch(
      submittedCases.map(exhaustiveCaseKey),
      authoritativeCases.map(exhaustiveCaseKey),
    )
  ) {
    issue(
      state,
      'MANIFEST_CASE_SET_MISMATCH',
      'submitted exhaustive cases must exactly match the registered authority domain',
      { authorityId: authority.manifest.authorityId },
    )
  }
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
  authoritativeCases.forEach((proofCase) => {
    checkGeneratedCase(state, input.generator, input.oracle, proofCase)
  })
  return report(state)
}

function runInvariantBoundary(
  input: InvariantBoundaryApplicationProofV1,
  authority: BoundaryProofAuthorityV1,
  implementationRegistry: ApplicationProofImplementationRegistryV1,
): ApplicationProofReportV1 {
  const state = createState(parseApplicationProblemFamilyV1(input.family), input.mode)
  bindAuthority(state, authority)
  const validMode = validateMode(state)
  const independent = validateGeneratorOracleIndependence(
    state,
    authority,
    implementationRegistry,
    input.generator,
    input.oracle,
  )
  const authoritativeCases = authority.cases
  const requiredBoundaryClasses = authority.boundaryClasses
  if (!exactUniqueSetMatch(input.boundaries, requiredBoundaryClasses)) {
    issue(
      state,
      'BOUNDARY_SET_MISMATCH',
      'submitted boundaries must exactly match registered boundary classes',
      { authorityId: authority.manifest.authorityId },
    )
  }
  if (
    !exactUniqueSetMatch(
      input.cases.map(boundaryCaseKey),
      authoritativeCases.map(boundaryCaseKey),
    )
  ) {
    issue(
      state,
      'MANIFEST_CASE_SET_MISMATCH',
      'submitted boundary cases must exactly match the registered authority domain',
      { authorityId: authority.manifest.authorityId },
    )
  }
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

  if (!validMode || !independent || state.issues.length > 0) return report(state)
  authoritativeCases.forEach((proofCase) => {
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

function runStaticCorpus(
  input: StaticCorpusApplicationProofV1,
  authority: StaticCorpusProofAuthorityV1,
): ApplicationProofReportV1 {
  const state = createState(parseApplicationProblemFamilyV1(input.family), input.mode)
  bindAuthority(state, authority)
  state.corpusIds = input.entries.map((entry) => entry.corpusId)
  const validMode = validateMode(state)
  const approvedCorpusIds = authority.corpusIds
  const corpusSetValid = exactUniqueSetMatch(
    state.corpusIds,
    approvedCorpusIds,
  )
  if (!corpusSetValid) {
    issue(
      state,
      'MANIFEST_CASE_SET_MISMATCH',
      'submitted corpus IDs must exactly match the registered authority corpus IDs',
      { authorityId: authority.manifest.authorityId },
    )
  }
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
    if (corpusSetValid) {
      state.checkedCount += 1
      state.checkedProblems.push(problem)
    }
  })
  return report(state)
}

export function runApplicationProblemProof(
  input: ApplicationProblemProofV1,
): ApplicationProofReportV1
export function runApplicationProblemProof(
  input: ApplicationProblemProofV1,
  injectedAuthorityRegistry?: unknown,
  injectedImplementationRegistry?: unknown,
): ApplicationProofReportV1 {
  const testTrustInjected = injectedAuthorityRegistry !== undefined
  const authorityRegistry = injectedAuthorityRegistry === undefined
    ? APPLICATION_PROOF_AUTHORITY_REGISTRY_V1
    : injectedAuthorityRegistry
  const implementationRegistry = testTrustInjected
    ? injectedImplementationRegistry
    : APPLICATION_PROOF_IMPLEMENTATION_REGISTRY_V1
  if (
    !isApplicationProofAuthorityRegistryV1(authorityRegistry)
  ) {
    const state = createState(parseApplicationProblemFamilyV1(input.family), input.mode)
    issue(
      state,
      'INVALID_PROOF_AUTHORITY_REGISTRY',
      'proof execution requires a branded authority registry',
    )
    return report(state)
  }
  if (
    input.mode !== 'static-corpus' &&
    !isApplicationProofImplementationRegistryV1(implementationRegistry)
  ) {
    const state = createState(parseApplicationProblemFamilyV1(input.family), input.mode)
    issue(
      state,
      'INVALID_PROOF_IMPLEMENTATION_REGISTRY',
      'dynamic proof execution requires a branded implementation registry',
    )
    return report(state)
  }
  const authority = findApplicationProofAuthorityV1(
    authorityRegistry,
    input.family.familyId,
    input.family.version,
    input.mode,
  )
  if (authority === undefined) {
    const state = createState(parseApplicationProblemFamilyV1(input.family), input.mode)
    issue(
      state,
      'PROOF_AUTHORITY_NOT_FOUND',
      'no trusted proof authority is registered for familyId@version and proof mode',
    )
    return report(state)
  }
  switch (input.mode) {
    case 'exhaustive':
      if (authority.mode !== 'exhaustive') break
      return runExhaustive(
        input,
        authority,
        implementationRegistry as ApplicationProofImplementationRegistryV1,
      )
    case 'invariant-boundary':
      if (authority.mode !== 'invariant-boundary') break
      return runInvariantBoundary(
        input,
        authority,
        implementationRegistry as ApplicationProofImplementationRegistryV1,
      )
    case 'static-corpus':
      if (authority.mode !== 'static-corpus') break
      return runStaticCorpus(input, authority)
  }
  const state = createState(parseApplicationProblemFamilyV1(input.family), input.mode)
  issue(state, 'PROOF_AUTHORITY_NOT_FOUND', 'registered proof authority mode mismatch')
  return report(state)
}
