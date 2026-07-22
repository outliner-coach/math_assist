import type { GeneratedApplicationProblemV1, JsonValue } from './contracts'

export type ApplicationProofModeV1 = 'exhaustive' | 'invariant-boundary' | 'static-corpus'

export interface ApplicationProofAuthorityManifestV1 {
  schemaVersion: 'application-proof-authority-manifest-v1'
  authorityId: string
  authorityVersion: number
  familyId: string
  familyVersion: number
  mode: ApplicationProofModeV1
  expectedCount: number
  domainDigest: string
  sourceModule: string
  sourceDigest: string
  reviewedBy: string
  reviewedAt: string
  evidenceRefs: readonly string[]
  generatorRef?: ApplicationProofPinnedImplementationRefV1
  oracleRef?: ApplicationProofPinnedImplementationRefV1
  allowedSharedInfrastructure?: readonly ApplicationProofDependencyRefV1[]
}

export interface ApplicationProofPinnedImplementationRefV1 {
  implementationId: string
  implementationVersion: number
  sourceDigest: string
}

interface ApplicationProofAuthorityEntryBaseV1 {
  schemaVersion: 'application-proof-authority-entry-v1'
  familyId: string
  familyVersion: number
  mode: ApplicationProofModeV1
  manifest: ApplicationProofAuthorityManifestV1
}

export interface ExhaustiveProofAuthorityV1 extends ApplicationProofAuthorityEntryBaseV1 {
  mode: 'exhaustive'
  domain: readonly {
    caseId: string
    seed: number
    variantIndex: number
  }[]
}

export interface BoundaryProofAuthorityV1 extends ApplicationProofAuthorityEntryBaseV1 {
  mode: 'invariant-boundary'
  boundaryClasses: readonly string[]
  cases: readonly {
    caseId: string
    boundary: string
    seed: number
    variantIndex: number
  }[]
}

export interface StaticCorpusProofAuthorityV1 extends ApplicationProofAuthorityEntryBaseV1 {
  mode: 'static-corpus'
  corpusIds: readonly string[]
}

export type ApplicationProofAuthorityEntryV1 =
  | ExhaustiveProofAuthorityV1
  | BoundaryProofAuthorityV1
  | StaticCorpusProofAuthorityV1

const authorityRegistryBrand: unique symbol = Symbol('ApplicationProofAuthorityRegistryV1')

export interface ApplicationProofAuthorityRegistryV1 {
  readonly schemaVersion: 'application-proof-authority-registry-v1'
  readonly entries: readonly ApplicationProofAuthorityEntryV1[]
  readonly [authorityRegistryBrand]: true
}

export interface ApplicationProofOracleInputV1 {
  caseId: string
  seed: number
  variantIndex: number
  boundary?: string
  params: Readonly<Record<string, JsonValue>>
  mathModel?: JsonValue
}

export type RegisteredProofGeneratorV1 = (
  input: { seed: number; variantIndex: number },
) => GeneratedApplicationProblemV1

export type RegisteredProofOracleV1 = (input: ApplicationProofOracleInputV1) => string

export type ApplicationProofDependencyKindV1 = 'infrastructure' | 'answer-logic' | 'data'

export interface ApplicationProofDependencyRefV1 {
  dependencyId: string
  dependencyVersion: number
  digest: string
}

export interface ApplicationProofDependencyRecordV1 extends ApplicationProofDependencyRefV1 {
  schemaVersion: 'application-proof-dependency-v1'
  kind: ApplicationProofDependencyKindV1
  sourceModule: string
  imports: readonly ApplicationProofDependencyRefV1[]
}

interface ApplicationProofImplementationBaseV1 {
  schemaVersion: 'application-proof-implementation-v1'
  kind: 'generator' | 'oracle'
  implementationId: string
  implementationVersion: number
  sourceModule: string
  sourceDigest: string
  evidenceRefs: readonly string[]
  rootDependency: ApplicationProofDependencyRefV1
}

export interface ApplicationProofGeneratorRegistrationV1
  extends ApplicationProofImplementationBaseV1 {
  kind: 'generator'
  execute: RegisteredProofGeneratorV1
}

export interface ApplicationProofOracleRegistrationV1
  extends ApplicationProofImplementationBaseV1 {
  kind: 'oracle'
  execute: RegisteredProofOracleV1
}

export type ApplicationProofImplementationRegistrationV1 =
  | ApplicationProofGeneratorRegistrationV1
  | ApplicationProofOracleRegistrationV1

const implementationRegistryBrand: unique symbol = Symbol(
  'ApplicationProofImplementationRegistryV1',
)

export interface ApplicationProofImplementationRegistryV1 {
  readonly schemaVersion: 'application-proof-implementation-registry-v1'
  readonly dependencies: readonly ApplicationProofDependencyRecordV1[]
  readonly implementations: readonly ApplicationProofImplementationRegistrationV1[]
  readonly [implementationRegistryBrand]: true
}

const trustedAuthorityRegistries = new WeakSet<object>()
const trustedImplementationRegistries = new WeakSet<object>()

function canonicalJson(value: JsonValue): JsonValue {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(canonicalJson)
  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => [key, canonicalJson(value[key])]),
  )
}

function rotateRight(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount))
}

function sha256Hex(value: string): string {
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]
  const bytes = Array.from(new TextEncoder().encode(value))
  const bitLength = bytes.length * 8
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  const high = Math.floor(bitLength / 0x100000000)
  const low = bitLength >>> 0
  for (let shift = 24; shift >= 0; shift -= 8) bytes.push((high >>> shift) & 0xff)
  for (let shift = 24; shift >= 0; shift -= 8) bytes.push((low >>> shift) & 0xff)

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const words = new Array<number>(64)
    for (let index = 0; index < 16; index += 1) {
      const start = offset + index * 4
      words[index] = (
        (bytes[start] << 24) |
        (bytes[start + 1] << 16) |
        (bytes[start + 2] << 8) |
        bytes[start + 3]
      ) >>> 0
    }
    for (let index = 16; index < 64; index += 1) {
      const previous15 = words[index - 15]
      const previous2 = words[index - 2]
      const sigma0 = rotateRight(previous15, 7) ^ rotateRight(previous15, 18) ^ (previous15 >>> 3)
      const sigma1 = rotateRight(previous2, 17) ^ rotateRight(previous2, 19) ^ (previous2 >>> 10)
      words[index] = (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0
    }

    let [a, b, c, d, e, f, g, h] = hash
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)
      const choose = (e & f) ^ (~e & g)
      const temporary1 = (h + sum1 + choose + constants[index] + words[index]) >>> 0
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)
      const majority = (a & b) ^ (a & c) ^ (b & c)
      const temporary2 = (sum0 + majority) >>> 0
      h = g
      g = f
      f = e
      e = (d + temporary1) >>> 0
      d = c
      c = b
      b = a
      a = (temporary1 + temporary2) >>> 0
    }
    hash[0] = (hash[0] + a) >>> 0
    hash[1] = (hash[1] + b) >>> 0
    hash[2] = (hash[2] + c) >>> 0
    hash[3] = (hash[3] + d) >>> 0
    hash[4] = (hash[4] + e) >>> 0
    hash[5] = (hash[5] + f) >>> 0
    hash[6] = (hash[6] + g) >>> 0
    hash[7] = (hash[7] + h) >>> 0
  }
  return hash.map((part) => part.toString(16).padStart(8, '0')).join('')
}

export function createApplicationProofManifestDigest(value: JsonValue): string {
  return `sha256:${sha256Hex(JSON.stringify(canonicalJson(value)))}`
}

function assertStableId(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(value)) {
    throw new TypeError(`${path} must be a stable lowercase identifier`)
  }
}

function assertPositiveInteger(value: unknown, path: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new TypeError(`${path} must be a positive safe integer`)
  }
}

function assertRepositoryPath(value: unknown, path: string): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    value.startsWith('/') ||
    value.includes('://') ||
    value.split('/').includes('..')
  ) {
    throw new TypeError(`${path} must be a repository-relative path`)
  }
}

function assertSha256(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(value)) {
    throw new TypeError(`${path} must be a literal SHA-256 digest`)
  }
}

function assertReview(entry: ApplicationProofAuthorityManifestV1, path: string): void {
  if (typeof entry.reviewedBy !== 'string' || entry.reviewedBy.trim() === '') {
    throw new TypeError(`${path}.reviewedBy is required`)
  }
  if (
    typeof entry.reviewedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(entry.reviewedAt) ||
    !Number.isFinite(Date.parse(entry.reviewedAt))
  ) {
    throw new TypeError(`${path}.reviewedAt must be an ISO instant`)
  }
  if (!Array.isArray(entry.evidenceRefs) || entry.evidenceRefs.length === 0) {
    throw new TypeError(`${path}.evidenceRefs requires repository evidence`)
  }
  entry.evidenceRefs.forEach((reference, index) =>
    assertRepositoryPath(reference, `${path}.evidenceRefs[${index}]`),
  )
}

function assertUnique(values: readonly string[], path: string): void {
  if (new Set(values).size !== values.length) throw new TypeError(`${path} must be unique`)
}

function exhaustiveKey(entry: ExhaustiveProofAuthorityV1['domain'][number]): string {
  return JSON.stringify([entry.caseId, entry.seed, entry.variantIndex])
}

function boundaryKey(entry: BoundaryProofAuthorityV1['cases'][number]): string {
  return JSON.stringify([entry.caseId, entry.boundary, entry.seed, entry.variantIndex])
}

function assertProofCase(
  entry: { caseId: string; seed: number; variantIndex: number },
  path: string,
): void {
  assertStableId(entry.caseId, `${path}.caseId`)
  if (!Number.isSafeInteger(entry.seed)) throw new TypeError(`${path}.seed must be a safe integer`)
  if (!Number.isSafeInteger(entry.variantIndex) || entry.variantIndex < 0) {
    throw new TypeError(`${path}.variantIndex must be a non-negative safe integer`)
  }
}

function assertPinnedImplementationRef(
  reference: ApplicationProofPinnedImplementationRefV1 | undefined,
  path: string,
): asserts reference is ApplicationProofPinnedImplementationRefV1 {
  if (!reference || typeof reference !== 'object') {
    throw new TypeError(`${path} is required`)
  }
  assertStableId(reference.implementationId, `${path}.implementationId`)
  assertPositiveInteger(reference.implementationVersion, `${path}.implementationVersion`)
  assertSha256(reference.sourceDigest, `${path}.sourceDigest`)
}

function validateAuthorityEntry(entry: ApplicationProofAuthorityEntryV1, index: number): void {
  const path = `authority.entries[${index}]`
  if (
    !entry ||
    typeof entry !== 'object' ||
    entry.schemaVersion !== 'application-proof-authority-entry-v1'
  ) {
    throw new TypeError(`${path} must be an application-proof-authority-entry-v1 record`)
  }
  assertStableId(entry.familyId, `${path}.familyId`)
  assertPositiveInteger(entry.familyVersion, `${path}.familyVersion`)
  if (!['exhaustive', 'invariant-boundary', 'static-corpus'].includes(entry.mode)) {
    throw new TypeError(`${path}.mode is invalid`)
  }
  const manifest = entry.manifest
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    manifest.schemaVersion !== 'application-proof-authority-manifest-v1'
  ) {
    throw new TypeError(`${path}.manifest must be canonical`)
  }
  assertStableId(manifest.authorityId, `${path}.manifest.authorityId`)
  assertPositiveInteger(manifest.authorityVersion, `${path}.manifest.authorityVersion`)
  assertStableId(manifest.familyId, `${path}.manifest.familyId`)
  assertPositiveInteger(manifest.familyVersion, `${path}.manifest.familyVersion`)
  if (
    manifest.familyId !== entry.familyId ||
    manifest.familyVersion !== entry.familyVersion ||
    manifest.mode !== entry.mode
  ) {
    throw new TypeError(`${path}.manifest must bind the exact familyId@version and mode`)
  }
  assertPositiveInteger(manifest.expectedCount, `${path}.manifest.expectedCount`)
  if (manifest.expectedCount < 2) throw new TypeError(`${path} must contain at least two entries`)
  assertSha256(manifest.domainDigest, `${path}.manifest.domainDigest`)
  assertRepositoryPath(manifest.sourceModule, `${path}.manifest.sourceModule`)
  assertSha256(manifest.sourceDigest, `${path}.manifest.sourceDigest`)
  assertReview(manifest, `${path}.manifest`)
  if (entry.mode === 'static-corpus') {
    if (
      manifest.generatorRef !== undefined ||
      manifest.oracleRef !== undefined ||
      manifest.allowedSharedInfrastructure !== undefined
    ) {
      throw new TypeError(`${path}.manifest static corpus cannot pin dynamic implementations`)
    }
  } else {
    assertPinnedImplementationRef(manifest.generatorRef, `${path}.manifest.generatorRef`)
    assertPinnedImplementationRef(manifest.oracleRef, `${path}.manifest.oracleRef`)
    if (!Array.isArray(manifest.allowedSharedInfrastructure)) {
      throw new TypeError(`${path}.manifest.allowedSharedInfrastructure must be an array`)
    }
    manifest.allowedSharedInfrastructure.forEach((reference, sharedIndex) =>
      assertDependencyRef(
        reference,
        `${path}.manifest.allowedSharedInfrastructure[${sharedIndex}]`,
      ),
    )
    assertUnique(
      manifest.allowedSharedInfrastructure.map(dependencyKey),
      `${path}.manifest.allowedSharedInfrastructure`,
    )
  }

  let actualCount: number
  let domainPayload: JsonValue
  if (entry.mode === 'exhaustive') {
    if (!Array.isArray(entry.domain)) throw new TypeError(`${path}.domain must be an array`)
    entry.domain.forEach((proofCase, caseIndex) =>
      assertProofCase(proofCase, `${path}.domain[${caseIndex}]`),
    )
    assertUnique(entry.domain.map(exhaustiveKey), `${path}.domain`)
    actualCount = entry.domain.length
    domainPayload = entry.domain as unknown as JsonValue
  } else if (entry.mode === 'invariant-boundary') {
    if (!Array.isArray(entry.boundaryClasses) || entry.boundaryClasses.length === 0) {
      throw new TypeError(`${path}.boundaryClasses must be non-empty`)
    }
    entry.boundaryClasses.forEach((boundary, boundaryIndex) =>
      assertStableId(boundary, `${path}.boundaryClasses[${boundaryIndex}]`),
    )
    assertUnique(entry.boundaryClasses, `${path}.boundaryClasses`)
    if (!Array.isArray(entry.cases)) throw new TypeError(`${path}.cases must be an array`)
    const declared = new Set(entry.boundaryClasses)
    const executed = new Set<string>()
    entry.cases.forEach((proofCase, caseIndex) => {
      assertProofCase(proofCase, `${path}.cases[${caseIndex}]`)
      assertStableId(proofCase.boundary, `${path}.cases[${caseIndex}].boundary`)
      if (!declared.has(proofCase.boundary)) {
        throw new TypeError(`${path}.cases[${caseIndex}] uses an undeclared boundary`)
      }
      executed.add(proofCase.boundary)
    })
    assertUnique(entry.cases.map(boundaryKey), `${path}.cases`)
    if (entry.boundaryClasses.some((boundary) => !executed.has(boundary))) {
      throw new TypeError(`${path} must execute every boundary class`)
    }
    actualCount = entry.cases.length
    domainPayload = {
      boundaryClasses: entry.boundaryClasses as unknown as JsonValue,
      cases: entry.cases as unknown as JsonValue,
    }
  } else {
    if (!Array.isArray(entry.corpusIds)) throw new TypeError(`${path}.corpusIds must be an array`)
    entry.corpusIds.forEach((corpusId, corpusIndex) =>
      assertStableId(corpusId, `${path}.corpusIds[${corpusIndex}]`),
    )
    assertUnique(entry.corpusIds, `${path}.corpusIds`)
    actualCount = entry.corpusIds.length
    domainPayload = entry.corpusIds as unknown as JsonValue
  }
  if (manifest.expectedCount !== actualCount) {
    throw new TypeError(`${path}.manifest.expectedCount does not match the canonical domain`)
  }
  if (manifest.domainDigest !== createApplicationProofManifestDigest(domainPayload)) {
    throw new TypeError(`${path}.manifest.domainDigest does not match the canonical domain`)
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

export function buildApplicationProofAuthorityRegistryV1Internal(
  entries: readonly ApplicationProofAuthorityEntryV1[],
): ApplicationProofAuthorityRegistryV1 {
  if (!Array.isArray(entries)) throw new TypeError('authority registry entries must be an array')
  entries.forEach(validateAuthorityEntry)
  const keys = entries.map((entry) => `${entry.familyId}@${entry.familyVersion}:${entry.mode}`)
  assertUnique(keys, 'authority registry familyId@version+mode keys')
  const authorityKeys = entries.map(
    (entry) => `${entry.manifest.authorityId}@${entry.manifest.authorityVersion}`,
  )
  assertUnique(authorityKeys, 'authority registry authorityId@version keys')
  const canonicalEntries = canonicalJson(entries as unknown as JsonValue) as unknown as ApplicationProofAuthorityEntryV1[]
  const registry = {
    schemaVersion: 'application-proof-authority-registry-v1' as const,
    entries: canonicalEntries,
    [authorityRegistryBrand]: true as const,
  }
  deepFreeze(registry)
  trustedAuthorityRegistries.add(registry)
  return registry
}

export function isApplicationProofAuthorityRegistryV1(
  value: unknown,
): value is ApplicationProofAuthorityRegistryV1 {
  return typeof value === 'object' && value !== null && trustedAuthorityRegistries.has(value)
}

export function findApplicationProofAuthorityV1(
  registry: ApplicationProofAuthorityRegistryV1,
  familyId: string,
  familyVersion: number,
  mode: ApplicationProofModeV1,
): ApplicationProofAuthorityEntryV1 | undefined {
  if (!isApplicationProofAuthorityRegistryV1(registry)) return undefined
  return registry.entries.find(
    (entry) =>
      entry.familyId === familyId &&
      entry.familyVersion === familyVersion &&
      entry.mode === mode,
  )
}

function dependencyKey(reference: ApplicationProofDependencyRefV1): string {
  return `${reference.dependencyId}@${reference.dependencyVersion}`
}

function assertDependencyRef(
  reference: ApplicationProofDependencyRefV1,
  path: string,
): void {
  if (!reference || typeof reference !== 'object') {
    throw new TypeError(`${path} must be a dependency reference`)
  }
  assertStableId(reference.dependencyId, `${path}.dependencyId`)
  assertPositiveInteger(reference.dependencyVersion, `${path}.dependencyVersion`)
  assertSha256(reference.digest, `${path}.digest`)
}

function resolveDependencyRef(
  reference: ApplicationProofDependencyRefV1,
  dependencies: ReadonlyMap<string, ApplicationProofDependencyRecordV1>,
  path: string,
): ApplicationProofDependencyRecordV1 {
  const dependency = dependencies.get(dependencyKey(reference))
  if (dependency === undefined) throw new TypeError(`${path} contains a dangling dependency`)
  if (dependency.digest !== reference.digest) {
    throw new TypeError(`${path} dependency digest mismatch`)
  }
  return dependency
}

function validateDependencyGraph(
  records: readonly ApplicationProofDependencyRecordV1[],
): Map<string, ApplicationProofDependencyRecordV1> {
  const dependencies = new Map<string, ApplicationProofDependencyRecordV1>()
  records.forEach((record, index) => {
    const path = `implementationRegistry.dependencies[${index}]`
    if (
      !record ||
      typeof record !== 'object' ||
      record.schemaVersion !== 'application-proof-dependency-v1'
    ) {
      throw new TypeError(`${path} must be an application-proof-dependency-v1 record`)
    }
    assertDependencyRef(record, path)
    if (!['infrastructure', 'answer-logic', 'data'].includes(record.kind)) {
      throw new TypeError(`${path}.kind is invalid`)
    }
    assertRepositoryPath(record.sourceModule, `${path}.sourceModule`)
    if (!Array.isArray(record.imports)) throw new TypeError(`${path}.imports must be an array`)
    record.imports.forEach((reference, importIndex) =>
      assertDependencyRef(reference, `${path}.imports[${importIndex}]`),
    )
    assertUnique(record.imports.map(dependencyKey), `${path}.imports`)
    const key = dependencyKey(record)
    if (dependencies.has(key)) throw new TypeError(`duplicate dependency record ${key}`)
    dependencies.set(key, record)
  })

  records.forEach((record, index) => {
    record.imports.forEach((reference, importIndex) =>
      resolveDependencyRef(
        reference,
        dependencies,
        `implementationRegistry.dependencies[${index}].imports[${importIndex}]`,
      ),
    )
  })

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (record: ApplicationProofDependencyRecordV1): void => {
    const key = dependencyKey(record)
    if (visiting.has(key)) throw new TypeError(`dependency graph cycle at ${key}`)
    if (visited.has(key)) return
    visiting.add(key)
    record.imports.forEach((reference) => visit(dependencies.get(dependencyKey(reference))!))
    visiting.delete(key)
    visited.add(key)
  }
  records.forEach(visit)
  return dependencies
}

function validateImplementationRegistration(
  registration: ApplicationProofImplementationRegistrationV1,
  index: number,
  dependencies: ReadonlyMap<string, ApplicationProofDependencyRecordV1>,
): void {
  const path = `implementationRegistry.implementations[${index}]`
  if (
    !registration ||
    typeof registration !== 'object' ||
    registration.schemaVersion !== 'application-proof-implementation-v1'
  ) {
    throw new TypeError(`${path} must be an application-proof-implementation-v1 record`)
  }
  if (!['generator', 'oracle'].includes(registration.kind)) {
    throw new TypeError(`${path}.kind is invalid`)
  }
  assertStableId(registration.implementationId, `${path}.implementationId`)
  assertPositiveInteger(registration.implementationVersion, `${path}.implementationVersion`)
  assertRepositoryPath(registration.sourceModule, `${path}.sourceModule`)
  assertSha256(registration.sourceDigest, `${path}.sourceDigest`)
  if (!Array.isArray(registration.evidenceRefs) || registration.evidenceRefs.length === 0) {
    throw new TypeError(`${path}.evidenceRefs requires repository evidence`)
  }
  registration.evidenceRefs.forEach((reference, evidenceIndex) =>
    assertRepositoryPath(reference, `${path}.evidenceRefs[${evidenceIndex}]`),
  )
  assertDependencyRef(registration.rootDependency, `${path}.rootDependency`)
  resolveDependencyRef(registration.rootDependency, dependencies, `${path}.rootDependency`)
  if (typeof registration.execute !== 'function') {
    throw new TypeError(`${path}.execute must be a function`)
  }
}

export function buildApplicationProofImplementationRegistryV1Internal(input: {
  dependencies: readonly ApplicationProofDependencyRecordV1[]
  implementations: readonly ApplicationProofImplementationRegistrationV1[]
}): ApplicationProofImplementationRegistryV1 {
  if (!input || typeof input !== 'object') {
    throw new TypeError('implementation registry input must be an object')
  }
  if (!Array.isArray(input.dependencies) || !Array.isArray(input.implementations)) {
    throw new TypeError('implementation registry records must be arrays')
  }
  const dependencyMap = validateDependencyGraph(input.dependencies)
  input.implementations.forEach((registration, index) =>
    validateImplementationRegistration(registration, index, dependencyMap),
  )
  const implementationKeys = input.implementations.map(
    (registration) =>
      `${registration.kind}:${registration.implementationId}@${registration.implementationVersion}`,
  )
  assertUnique(implementationKeys, 'implementation registry implementation keys')

  const dependencies = input.dependencies.map((record) => deepFreeze({
    ...record,
    imports: record.imports.map((reference: ApplicationProofDependencyRefV1) => ({
      ...reference,
    })),
  }))
  const implementations = input.implementations.map((registration) => deepFreeze({
    ...registration,
    evidenceRefs: [...registration.evidenceRefs],
    rootDependency: { ...registration.rootDependency },
  })) as ApplicationProofImplementationRegistrationV1[]
  const registry = {
    schemaVersion: 'application-proof-implementation-registry-v1' as const,
    dependencies,
    implementations,
    [implementationRegistryBrand]: true as const,
  }
  deepFreeze(registry)
  trustedImplementationRegistries.add(registry)
  return registry
}

export function isApplicationProofImplementationRegistryV1(
  value: unknown,
): value is ApplicationProofImplementationRegistryV1 {
  return typeof value === 'object' && value !== null && trustedImplementationRegistries.has(value)
}

export function findApplicationProofImplementationV1(
  registry: ApplicationProofImplementationRegistryV1,
  kind: 'generator' | 'oracle',
  implementationId: string,
  implementationVersion: number,
): ApplicationProofImplementationRegistrationV1 | undefined {
  if (!isApplicationProofImplementationRegistryV1(registry)) return undefined
  return registry.implementations.find(
    (registration) =>
      registration.kind === kind &&
      registration.implementationId === implementationId &&
      registration.implementationVersion === implementationVersion,
  )
}

export function applicationProofDependencyClosureV1(
  registry: ApplicationProofImplementationRegistryV1,
  root: ApplicationProofDependencyRefV1,
): ReadonlyMap<string, ApplicationProofDependencyRecordV1> {
  if (!isApplicationProofImplementationRegistryV1(registry)) return new Map()
  const dependencies = new Map(
    registry.dependencies.map((dependency) => [dependencyKey(dependency), dependency]),
  )
  const closure = new Map<string, ApplicationProofDependencyRecordV1>()
  const visit = (reference: ApplicationProofDependencyRefV1): void => {
    const key = dependencyKey(reference)
    if (closure.has(key)) return
    const dependency = dependencies.get(key)
    if (dependency === undefined || dependency.digest !== reference.digest) return
    closure.set(key, dependency)
    dependency.imports.forEach(visit)
  }
  visit(root)
  return closure
}
