import {
  createHash,
  createHmac,
  pbkdf2,
  randomBytes as nodeRandomBytes,
  timingSafeEqual,
} from 'node:crypto'

export const DEFAULT_PBKDF2_ITERATIONS = 600_000
const PBKDF2_KEY_LENGTH = 32
const MAX_PBKDF2_ITERATIONS = 10_000_000
const SALT_BYTES = 16
const LEARNER_NUMBER_DIGITS = 12
const LEARNER_NUMBER_SPACE = BigInt('1000000000000')
const RANDOM_UINT64_SPACE = BigInt(1) << BigInt(64)
const LEARNER_NUMBER_REJECTION_LIMIT = RANDOM_UINT64_SPACE - (RANDOM_UINT64_SPACE % LEARNER_NUMBER_SPACE)
const RECOVERY_CODE_BYTES = 16
const SESSION_TOKEN_BYTES = 32
const MAX_NETWORK_IDENTIFIER_LENGTH = 256
const MAX_GENERATION_ATTEMPTS = 16

export type RemoteAuthErrorCode =
  | 'invalid-request'
  | 'invalid-credentials'
  | 'rate-limited'
  | 'invalid-session'
  | 'service-unavailable'

export class RemoteAuthError extends Error {
  constructor(readonly code: RemoteAuthErrorCode) {
    super(
      code === 'invalid-credentials'
        ? 'Authentication failed'
        : code === 'rate-limited'
          ? 'Try again later'
          : code === 'invalid-session'
            ? 'Session is invalid'
            : code === 'invalid-request'
              ? 'Invalid request'
              : 'Authentication service unavailable',
    )
    this.name = 'RemoteAuthError'
  }
}

export interface StoredSecretVerifier {
  algorithm: 'pbkdf2-sha256'
  salt: string
  derivedKey: string
  iterations: number
  keyLength: number
}

export interface RemoteLearnerAccountRecord {
  learnerNumber: string
  pinVerifier: StoredSecretVerifier
  recoveryVerifier: StoredSecretVerifier
  credentialVersion: number
  sessionGeneration: number
  createdAt: number
  updatedAt: number
}

export interface RemoteAuthSessionRecord {
  tokenHash: string
  learnerNumber: string
  sessionGeneration: number
  createdAt: number
  revokedAt: number | null
}

export interface CredentialRotation {
  learnerNumber: string
  expectedCredentialVersion: number
  nextPinVerifier: StoredSecretVerifier
  nextRecoveryVerifier: StoredSecretVerifier
  nextCredentialVersion: number
  nextSessionGeneration: number
  at: number
}

export interface RemoteAuthRepository {
  createAccountWithSession(
    account: RemoteLearnerAccountRecord,
    session: RemoteAuthSessionRecord,
  ): Promise<boolean>
  findAccount(learnerNumber: string): Promise<RemoteLearnerAccountRecord | null>
  rotateCredentialsRevokeAndCreateSession(
    rotation: CredentialRotation,
    session: RemoteAuthSessionRecord,
  ): Promise<boolean>
  createSession(session: RemoteAuthSessionRecord): Promise<boolean>
  findSession(tokenHash: string): Promise<RemoteAuthSessionRecord | null>
  revokeAllSessions(learnerNumber: string, at: number): Promise<void>
}

export type RemoteAuthAuditEventType =
  | 'account-created'
  | 'login'
  | 'recovery'
  | 'sessions-revoked'
  | 'session-checked'

export type RemoteAuthAuditResult = 'success' | 'failure' | 'rate-limited'

export interface RemoteAuthAuditEvent {
  at: number
  type: RemoteAuthAuditEventType
  subjectHash: string
  result: RemoteAuthAuditResult
}

export interface RemoteAuthAuditSink {
  append(event: RemoteAuthAuditEvent): Promise<void>
}

export interface RemoteAuthRateLimitPolicy {
  maxFailures: number
  windowMs: number
  blockDurationMs: number
}

export interface RemoteAuthCoreOptions {
  repository: RemoteAuthRepository
  auditSink?: RemoteAuthAuditSink
  rateLimitPolicy?: RemoteAuthRateLimitPolicy
  now?: () => number
  randomBytes?: (size: number) => Buffer
  auditPepper?: Buffer
  /** Deliberately test-only. Production callers must omit this and supply a stable auditPepper. */
  unsafeTestPbkdf2Iterations?: number
}

export interface AccountCreationResult {
  learnerNumber: string
  recoveryCode: string
  sessionToken: string
}

export interface LoginInput {
  learnerNumber: string
  pin: string
  networkIdentifier: string
}

export interface LoginResult {
  learnerNumber: string
  sessionToken: string
}

export interface RecoveryInput {
  learnerNumber: string
  recoveryCode: string
  newPin: string
  networkIdentifier: string
}

export interface RecoveryResult extends AccountCreationResult {}

export interface RemoteAuthCore {
  createAccount(pin: string): Promise<AccountCreationResult>
  login(input: LoginInput): Promise<LoginResult>
  recover(input: RecoveryInput): Promise<RecoveryResult>
  authenticateSession(sessionToken: string): Promise<{ learnerNumber: string }>
  revokeAllSessions(sessionToken: string): Promise<void>
}

interface RateLimitState {
  failures: number[]
  blockedUntil: number
}

const NOOP_AUDIT_SINK: RemoteAuthAuditSink = {
  async append() {},
}

const DEFAULT_RATE_LIMIT_POLICY: RemoteAuthRateLimitPolicy = {
  maxFailures: 5,
  windowMs: 15 * 60_000,
  blockDurationMs: 15 * 60_000,
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function validTimestamp(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0
}

function validateNow(now: number): void {
  if (!validTimestamp(now)) throw new RemoteAuthError('invalid-request')
}

function validateRateLimitPolicy(policy: RemoteAuthRateLimitPolicy): void {
  if (
    !Number.isSafeInteger(policy.maxFailures) || policy.maxFailures < 1 || policy.maxFailures > 100 ||
    !Number.isSafeInteger(policy.windowMs) || policy.windowMs < 1 || policy.windowMs > 86_400_000 ||
    !Number.isSafeInteger(policy.blockDurationMs) || policy.blockDurationMs < 1 ||
    policy.blockDurationMs > 86_400_000
  ) {
    throw new RemoteAuthError('invalid-request')
  }
}

function validateTestIterations(iterations: number | undefined): number {
  if (iterations === undefined) return DEFAULT_PBKDF2_ITERATIONS
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > 100_000) {
    throw new RemoteAuthError('invalid-request')
  }
  return iterations
}

function validateRandomBytes(value: Buffer, expectedLength: number): Buffer {
  if (!Buffer.isBuffer(value) || value.byteLength !== expectedLength) {
    throw new RemoteAuthError('service-unavailable')
  }
  return value
}

function validLearnerNumber(value: unknown): value is string {
  return typeof value === 'string' && /^\d{12}$/.test(value)
}

function validRecoveryCode(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{22}$/.test(value)
}

function validSessionToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
}

function validNetworkIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_NETWORK_IDENTIFIER_LENGTH
}

export function isValidFourDigitPin(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}$/.test(value)
}

function deriveKey(
  secret: string,
  salt: Buffer,
  iterations: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    pbkdf2(secret, salt, iterations, PBKDF2_KEY_LENGTH, 'sha256', (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

async function createVerifier(
  secret: string,
  iterations: number,
  randomBytes: (size: number) => Buffer,
): Promise<StoredSecretVerifier> {
  const salt = validateRandomBytes(randomBytes(SALT_BYTES), SALT_BYTES)
  const derivedKey = await deriveKey(secret, salt, iterations)
  return {
    algorithm: 'pbkdf2-sha256',
    salt: salt.toString('base64url'),
    derivedKey: derivedKey.toString('base64url'),
    iterations,
    keyLength: PBKDF2_KEY_LENGTH,
  }
}

async function verifySecret(secret: string, verifier: StoredSecretVerifier): Promise<boolean> {
  if (!validStoredVerifier(verifier)) return false

  try {
    const salt = Buffer.from(verifier.salt, 'base64url')
    const expected = Buffer.from(verifier.derivedKey, 'base64url')
    if (salt.byteLength !== SALT_BYTES || expected.byteLength !== PBKDF2_KEY_LENGTH) return false
    const actual = await deriveKey(secret, salt, verifier.iterations)
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

function validStoredVerifier(verifier: unknown): verifier is StoredSecretVerifier {
  if (!verifier || typeof verifier !== 'object' || Array.isArray(verifier)) return false
  const candidate = verifier as Partial<StoredSecretVerifier>
  return candidate.algorithm === 'pbkdf2-sha256' &&
    Number.isSafeInteger(candidate.iterations) && (candidate.iterations ?? 0) >= 1 &&
    (candidate.iterations ?? Number.MAX_SAFE_INTEGER) <= MAX_PBKDF2_ITERATIONS &&
    candidate.keyLength === PBKDF2_KEY_LENGTH &&
    typeof candidate.salt === 'string' && candidate.salt.length <= 64 &&
    typeof candidate.derivedKey === 'string' && candidate.derivedKey.length <= 128
}

function validStoredAccount(
  account: RemoteLearnerAccountRecord | null,
  expectedLearnerNumber: string,
): account is RemoteLearnerAccountRecord {
  return account !== null &&
    account.learnerNumber === expectedLearnerNumber &&
    validStoredVerifier(account.pinVerifier) &&
    validStoredVerifier(account.recoveryVerifier) &&
    Number.isSafeInteger(account.credentialVersion) && account.credentialVersion >= 1 &&
    Number.isSafeInteger(account.sessionGeneration) && account.sessionGeneration >= 1 &&
    validTimestamp(account.createdAt) && validTimestamp(account.updatedAt)
}

function validStoredSession(
  session: RemoteAuthSessionRecord | null,
  expectedTokenHash: string,
): session is RemoteAuthSessionRecord {
  return session !== null &&
    session.tokenHash === expectedTokenHash && /^[a-f0-9]{64}$/.test(session.tokenHash) &&
    validLearnerNumber(session.learnerNumber) &&
    Number.isSafeInteger(session.sessionGeneration) && session.sessionGeneration >= 1 &&
    validTimestamp(session.createdAt) &&
    (session.revokedAt === null || validTimestamp(session.revokedAt))
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

function generateRecoveryCode(randomBytes: (size: number) => Buffer): string {
  return validateRandomBytes(randomBytes(RECOVERY_CODE_BYTES), RECOVERY_CODE_BYTES).toString('base64url')
}

function generateSessionToken(randomBytes: (size: number) => Buffer): string {
  return validateRandomBytes(randomBytes(SESSION_TOKEN_BYTES), SESSION_TOKEN_BYTES).toString('base64url')
}

function generateLearnerNumber(randomBytes: (size: number) => Buffer): string {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const bytes = validateRandomBytes(randomBytes(8), 8)
    const value = bytes.readBigUInt64BE()
    if (value >= LEARNER_NUMBER_REJECTION_LIMIT) continue
    return (value % LEARNER_NUMBER_SPACE).toString().padStart(LEARNER_NUMBER_DIGITS, '0')
  }
  throw new RemoteAuthError('service-unavailable')
}

class RemoteAuthRateLimiter {
  private readonly entries = new Map<string, RateLimitState>()

  constructor(private readonly policy: RemoteAuthRateLimitPolicy) {}

  private key(scope: 'login' | 'recovery', identity: string): string {
    return createHash('sha256')
      .update(scope)
      .update('\0')
      .update(identity)
      .digest('hex')
  }

  private keys(
    scope: 'login' | 'recovery',
    learnerNumber: string,
    networkIdentifier: string,
  ): string[] {
    return [
      this.key(scope, `account:${learnerNumber}`),
      this.key(scope, `network:${networkIdentifier}`),
      this.key(scope, `pair:${learnerNumber}\0${networkIdentifier}`),
    ]
  }

  private blocked(key: string, now: number): boolean {
    const state = this.entries.get(key)
    if (!state) return false
    if (now < state.blockedUntil) return true
    state.failures = state.failures.filter((at) => at > now - this.policy.windowMs)
    state.blockedUntil = 0
    if (state.failures.length === 0) this.entries.delete(key)
    return false
  }

  isBlocked(
    scope: 'login' | 'recovery',
    learnerNumber: string,
    networkIdentifier: string,
    now: number,
  ): boolean {
    return this.keys(scope, learnerNumber, networkIdentifier)
      .some((key) => this.blocked(key, now))
  }

  recordFailure(
    scope: 'login' | 'recovery',
    learnerNumber: string,
    networkIdentifier: string,
    now: number,
  ): void {
    for (const key of this.keys(scope, learnerNumber, networkIdentifier)) {
      const state = this.entries.get(key) ?? { failures: [], blockedUntil: 0 }
      state.failures = state.failures.filter((at) => at > now - this.policy.windowMs)
      state.failures.push(now)
      if (state.failures.length >= this.policy.maxFailures) {
        state.blockedUntil = now + this.policy.blockDurationMs
      }
      this.entries.set(key, state)
    }
  }

  reset(scope: 'login' | 'recovery', learnerNumber: string, networkIdentifier: string): void {
    this.entries.delete(this.key(scope, `account:${learnerNumber}`))
    this.entries.delete(this.key(scope, `pair:${learnerNumber}\0${networkIdentifier}`))
  }
}

class RemoteAuthCoreImplementation implements RemoteAuthCore {
  private readonly rateLimiter: RemoteAuthRateLimiter

  constructor(
    private readonly repository: RemoteAuthRepository,
    private readonly auditSink: RemoteAuthAuditSink,
    private readonly now: () => number,
    private readonly randomBytes: (size: number) => Buffer,
    private readonly auditPepper: Buffer,
    private readonly iterations: number,
    rateLimitPolicy: RemoteAuthRateLimitPolicy,
    private readonly dummyPinVerifier: StoredSecretVerifier,
    private readonly dummyRecoveryVerifier: StoredSecretVerifier,
  ) {
    this.rateLimiter = new RemoteAuthRateLimiter(rateLimitPolicy)
  }

  private timestamp(): number {
    const now = this.now()
    validateNow(now)
    return now
  }

  private subjectHash(learnerNumber: string): string {
    const boundedSubject = validLearnerNumber(learnerNumber) ? learnerNumber : 'invalid-learner'
    return createHmac('sha256', this.auditPepper).update(boundedSubject).digest('hex')
  }

  private async audit(
    type: RemoteAuthAuditEventType,
    learnerNumber: string,
    result: RemoteAuthAuditResult,
    at: number,
  ): Promise<void> {
    try {
      await this.auditSink.append({
        at,
        type,
        subjectHash: this.subjectHash(learnerNumber),
        result,
      })
    } catch {
      // Audit transport is redacted and best effort. A sink failure after an
      // atomic credential/session write must not hide the newly issued secret
      // from the learner or change a generic authentication result.
    }
  }

  private buildSession(account: RemoteLearnerAccountRecord, at: number): {
    token: string
    record: RemoteAuthSessionRecord
  } {
    const token = generateSessionToken(this.randomBytes)
    return {
      token,
      record: {
        tokenHash: hashSessionToken(token),
        learnerNumber: account.learnerNumber,
        sessionGeneration: account.sessionGeneration,
        createdAt: at,
        revokedAt: null,
      },
    }
  }

  private async createSession(account: RemoteLearnerAccountRecord, at: number): Promise<string> {
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
      const session = this.buildSession(account, at)
      if (await this.repository.createSession(session.record)) return session.token
    }
    throw new RemoteAuthError('service-unavailable')
  }

  async createAccount(pin: string): Promise<AccountCreationResult> {
    if (!isValidFourDigitPin(pin)) throw new RemoteAuthError('invalid-request')
    const at = this.timestamp()
    const pinVerifier = await createVerifier(pin, this.iterations, this.randomBytes)
    const recoveryCode = generateRecoveryCode(this.randomBytes)
    const recoveryVerifier = await createVerifier(recoveryCode, this.iterations, this.randomBytes)

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
      const learnerNumber = generateLearnerNumber(this.randomBytes)
      const account: RemoteLearnerAccountRecord = {
        learnerNumber,
        pinVerifier,
        recoveryVerifier,
        credentialVersion: 1,
        sessionGeneration: 1,
        createdAt: at,
        updatedAt: at,
      }
      const session = this.buildSession(account, at)
      if (!await this.repository.createAccountWithSession(account, session.record)) continue
      await this.audit('account-created', learnerNumber, 'success', at)
      return { learnerNumber, recoveryCode, sessionToken: session.token }
    }
    throw new RemoteAuthError('service-unavailable')
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const at = this.timestamp()
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new RemoteAuthError('invalid-request')
    }
    if (!validNetworkIdentifier(input.networkIdentifier)) {
      throw new RemoteAuthError('invalid-request')
    }
    if (!validLearnerNumber(input.learnerNumber) || typeof input.pin !== 'string' || input.pin.length > 4) {
      await this.audit('login', input.learnerNumber, 'failure', at)
      throw new RemoteAuthError('invalid-credentials')
    }
    if (this.rateLimiter.isBlocked('login', input.learnerNumber, input.networkIdentifier, at)) {
      await this.audit('login', input.learnerNumber, 'rate-limited', at)
      throw new RemoteAuthError('rate-limited')
    }

    const storedAccount = await this.repository.findAccount(input.learnerNumber)
    const account = validStoredAccount(storedAccount, input.learnerNumber) ? storedAccount : null
    const pinIsWellFormed = isValidFourDigitPin(input.pin)
    const verifier = account?.pinVerifier ?? this.dummyPinVerifier
    const valid = await verifySecret(pinIsWellFormed ? input.pin : '0000', verifier)
    if (!account || !pinIsWellFormed || !valid) {
      this.rateLimiter.recordFailure('login', input.learnerNumber, input.networkIdentifier, at)
      await this.audit('login', input.learnerNumber, 'failure', at)
      throw new RemoteAuthError('invalid-credentials')
    }

    this.rateLimiter.reset('login', input.learnerNumber, input.networkIdentifier)
    const sessionToken = await this.createSession(account, at)
    await this.audit('login', input.learnerNumber, 'success', at)
    return { learnerNumber: account.learnerNumber, sessionToken }
  }

  async recover(input: RecoveryInput): Promise<RecoveryResult> {
    const at = this.timestamp()
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new RemoteAuthError('invalid-request')
    }
    if (!validNetworkIdentifier(input.networkIdentifier) || !isValidFourDigitPin(input.newPin)) {
      throw new RemoteAuthError('invalid-request')
    }
    if (
      !validLearnerNumber(input.learnerNumber) ||
      typeof input.recoveryCode !== 'string' || input.recoveryCode.length > 22
    ) {
      await this.audit('recovery', input.learnerNumber, 'failure', at)
      throw new RemoteAuthError('invalid-credentials')
    }
    if (this.rateLimiter.isBlocked('recovery', input.learnerNumber, input.networkIdentifier, at)) {
      await this.audit('recovery', input.learnerNumber, 'rate-limited', at)
      throw new RemoteAuthError('rate-limited')
    }

    const storedAccount = await this.repository.findAccount(input.learnerNumber)
    const account = validStoredAccount(storedAccount, input.learnerNumber) ? storedAccount : null
    const recoveryIsWellFormed = validRecoveryCode(input.recoveryCode)
    const verifier = account?.recoveryVerifier ?? this.dummyRecoveryVerifier
    const valid = await verifySecret(recoveryIsWellFormed ? input.recoveryCode : 'invalid-recovery-code', verifier)
    if (!account || !recoveryIsWellFormed || !valid) {
      this.rateLimiter.recordFailure('recovery', input.learnerNumber, input.networkIdentifier, at)
      await this.audit('recovery', input.learnerNumber, 'failure', at)
      throw new RemoteAuthError('invalid-credentials')
    }

    const recoveryCode = generateRecoveryCode(this.randomBytes)
    const [nextPinVerifier, nextRecoveryVerifier] = await Promise.all([
      createVerifier(input.newPin, this.iterations, this.randomBytes),
      createVerifier(recoveryCode, this.iterations, this.randomBytes),
    ])
    const nextAccount: RemoteLearnerAccountRecord = {
      ...account,
      pinVerifier: nextPinVerifier,
      recoveryVerifier: nextRecoveryVerifier,
      credentialVersion: account.credentialVersion + 1,
      sessionGeneration: account.sessionGeneration + 1,
      updatedAt: at,
    }
    const session = this.buildSession(nextAccount, at)
    const rotated = await this.repository.rotateCredentialsRevokeAndCreateSession({
      learnerNumber: account.learnerNumber,
      expectedCredentialVersion: account.credentialVersion,
      nextPinVerifier,
      nextRecoveryVerifier,
      nextCredentialVersion: nextAccount.credentialVersion,
      nextSessionGeneration: nextAccount.sessionGeneration,
      at,
    }, session.record)
    if (!rotated) {
      this.rateLimiter.recordFailure('recovery', input.learnerNumber, input.networkIdentifier, at)
      await this.audit('recovery', input.learnerNumber, 'failure', at)
      throw new RemoteAuthError('invalid-credentials')
    }

    this.rateLimiter.reset('recovery', input.learnerNumber, input.networkIdentifier)
    await this.audit('recovery', input.learnerNumber, 'success', at)
    return {
      learnerNumber: input.learnerNumber,
      recoveryCode,
      sessionToken: session.token,
    }
  }

  async authenticateSession(sessionToken: string): Promise<{ learnerNumber: string }> {
    const at = this.timestamp()
    if (!validSessionToken(sessionToken)) throw new RemoteAuthError('invalid-session')
    const tokenHash = hashSessionToken(sessionToken)
    const storedSession = await this.repository.findSession(tokenHash)
    const session = validStoredSession(storedSession, tokenHash) ? storedSession : null
    const storedAccount = session ? await this.repository.findAccount(session.learnerNumber) : null
    const account = session && validStoredAccount(storedAccount, session.learnerNumber)
      ? storedAccount
      : null
    if (
      !session || !account || session.revokedAt !== null ||
      session.sessionGeneration !== account.sessionGeneration
    ) {
      if (session) await this.audit('session-checked', session.learnerNumber, 'failure', at)
      throw new RemoteAuthError('invalid-session')
    }
    await this.audit('session-checked', account.learnerNumber, 'success', at)
    return { learnerNumber: account.learnerNumber }
  }

  async revokeAllSessions(sessionToken: string): Promise<void> {
    const authenticated = await this.authenticateSession(sessionToken)
    const at = this.timestamp()
    await this.repository.revokeAllSessions(authenticated.learnerNumber, at)
    await this.audit('sessions-revoked', authenticated.learnerNumber, 'success', at)
  }
}

export async function createRemoteAuthCore(options: RemoteAuthCoreOptions): Promise<RemoteAuthCore> {
  const repository = options?.repository as Partial<RemoteAuthRepository> | undefined
  if (
    !options || !repository || typeof repository !== 'object' ||
    typeof repository.createAccountWithSession !== 'function' ||
    typeof repository.findAccount !== 'function' ||
    typeof repository.rotateCredentialsRevokeAndCreateSession !== 'function' ||
    typeof repository.createSession !== 'function' ||
    typeof repository.findSession !== 'function' ||
    typeof repository.revokeAllSessions !== 'function' ||
    (options.auditSink !== undefined && (
      typeof options.auditSink !== 'object' || options.auditSink === null ||
      typeof options.auditSink.append !== 'function'
    )) ||
    (options.now !== undefined && typeof options.now !== 'function') ||
    (options.randomBytes !== undefined && typeof options.randomBytes !== 'function')
  ) {
    throw new RemoteAuthError('invalid-request')
  }
  const iterations = validateTestIterations(options.unsafeTestPbkdf2Iterations)
  const rateLimitPolicy = options.rateLimitPolicy ?? DEFAULT_RATE_LIMIT_POLICY
  validateRateLimitPolicy(rateLimitPolicy)
  const randomBytes = options.randomBytes ?? nodeRandomBytes
  if (options.auditPepper === undefined && options.unsafeTestPbkdf2Iterations === undefined) {
    throw new RemoteAuthError('invalid-request')
  }
  const auditPepper = options.auditPepper ?? validateRandomBytes(randomBytes(32), 32)
  if (!Buffer.isBuffer(auditPepper) || auditPepper.byteLength < 32 || auditPepper.byteLength > 128) {
    throw new RemoteAuthError('invalid-request')
  }
  const [dummyPinVerifier, dummyRecoveryVerifier] = await Promise.all([
    createVerifier('0000', iterations, randomBytes),
    createVerifier(generateRecoveryCode(randomBytes), iterations, randomBytes),
  ])
  return new RemoteAuthCoreImplementation(
    options.repository,
    options.auditSink ?? NOOP_AUDIT_SINK,
    options.now ?? Date.now,
    randomBytes,
    Buffer.from(auditPepper),
    iterations,
    rateLimitPolicy,
    dummyPinVerifier,
    dummyRecoveryVerifier,
  )
}

export class InMemoryRemoteAuthRepository implements RemoteAuthRepository {
  private readonly accounts = new Map<string, RemoteLearnerAccountRecord>()
  private readonly sessions = new Map<string, RemoteAuthSessionRecord>()
  private accountCreationFailuresRemaining = 0
  private transactionTail: Promise<void> = Promise.resolve()

  async createAccountWithSession(
    account: RemoteLearnerAccountRecord,
    session: RemoteAuthSessionRecord,
  ): Promise<boolean> {
    if (this.accountCreationFailuresRemaining > 0) {
      this.accountCreationFailuresRemaining -= 1
      return false
    }
    if (
      this.accounts.has(account.learnerNumber) ||
      this.sessions.has(session.tokenHash) ||
      session.learnerNumber !== account.learnerNumber ||
      session.sessionGeneration !== account.sessionGeneration
    ) return false
    this.accounts.set(account.learnerNumber, clone(account))
    this.sessions.set(session.tokenHash, clone(session))
    return true
  }

  async findAccount(learnerNumber: string): Promise<RemoteLearnerAccountRecord | null> {
    const account = this.accounts.get(learnerNumber)
    return account ? clone(account) : null
  }

  async rotateCredentialsRevokeAndCreateSession(
    rotation: CredentialRotation,
    nextSession: RemoteAuthSessionRecord,
  ): Promise<boolean> {
    const account = this.accounts.get(rotation.learnerNumber)
    if (
      !account || account.credentialVersion !== rotation.expectedCredentialVersion ||
      this.sessions.has(nextSession.tokenHash) ||
      nextSession.learnerNumber !== rotation.learnerNumber ||
      nextSession.sessionGeneration !== rotation.nextSessionGeneration
    ) return false
    this.accounts.set(rotation.learnerNumber, {
      ...account,
      pinVerifier: clone(rotation.nextPinVerifier),
      recoveryVerifier: clone(rotation.nextRecoveryVerifier),
      credentialVersion: rotation.nextCredentialVersion,
      sessionGeneration: rotation.nextSessionGeneration,
      updatedAt: rotation.at,
    })
    for (const [tokenHash, session] of Array.from(this.sessions.entries())) {
      if (session.learnerNumber === rotation.learnerNumber && session.revokedAt === null) {
        this.sessions.set(tokenHash, { ...session, revokedAt: rotation.at })
      }
    }
    this.sessions.set(nextSession.tokenHash, clone(nextSession))
    return true
  }

  async createSession(session: RemoteAuthSessionRecord): Promise<boolean> {
    if (this.sessions.has(session.tokenHash)) return false
    const account = this.accounts.get(session.learnerNumber)
    if (!account || account.sessionGeneration !== session.sessionGeneration) return false
    this.sessions.set(session.tokenHash, clone(session))
    return true
  }

  async findSession(tokenHash: string): Promise<RemoteAuthSessionRecord | null> {
    const session = this.sessions.get(tokenHash)
    return session ? clone(session) : null
  }

  async revokeAllSessions(learnerNumber: string, at: number): Promise<void> {
    const account = this.accounts.get(learnerNumber)
    if (!account) return
    this.accounts.set(learnerNumber, {
      ...account,
      sessionGeneration: account.sessionGeneration + 1,
      updatedAt: at,
    })
    for (const [tokenHash, session] of Array.from(this.sessions.entries())) {
      if (session.learnerNumber === learnerNumber && session.revokedAt === null) {
        this.sessions.set(tokenHash, { ...session, revokedAt: at })
      }
    }
  }

  failNextAccountCreations(count: number): void {
    if (!Number.isSafeInteger(count) || count < 0) throw new RemoteAuthError('invalid-request')
    this.accountCreationFailuresRemaining = count
  }

  async runAtomicForTest<T>(operation: () => Promise<T>): Promise<T> {
    let release!: () => void
    const previous = this.transactionTail
    const current = new Promise<void>((resolve) => {
      release = resolve
    })
    this.transactionTail = previous.then(() => current)
    await previous

    const accountSnapshot = clone(Array.from(this.accounts.entries()))
    const sessionSnapshot = clone(Array.from(this.sessions.entries()))
    try {
      return await operation()
    } catch (error) {
      this.accounts.clear()
      this.sessions.clear()
      for (const [key, value] of accountSnapshot) this.accounts.set(key, value)
      for (const [key, value] of sessionSnapshot) this.sessions.set(key, value)
      throw error
    } finally {
      release()
    }
  }

  snapshot(): {
    accounts: RemoteLearnerAccountRecord[]
    sessions: RemoteAuthSessionRecord[]
  } {
    return clone({
      accounts: Array.from(this.accounts.values()),
      sessions: Array.from(this.sessions.values()),
    })
  }
}

export class InMemoryRemoteAuthAuditSink implements RemoteAuthAuditSink {
  private readonly events: RemoteAuthAuditEvent[] = []

  async append(event: RemoteAuthAuditEvent): Promise<void> {
    this.events.push(clone(event))
  }

  snapshot(): RemoteAuthAuditEvent[] {
    return clone(this.events)
  }
}
