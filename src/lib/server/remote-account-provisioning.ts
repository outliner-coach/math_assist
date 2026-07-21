import { createHash, createHmac, randomBytes } from 'node:crypto'

import {
  isValidFourDigitPin,
  type AccountCreationResult,
  type InMemoryRemoteAuthRepository,
  type RemoteAuthCore,
} from './remote-auth-core'

export const CONSENT_ARTIFACT_SCHEMA_VERSION = 1 as const
export const CONSENT_PURPOSE_REMOTE_PROGRESS = 'remote-progress-account' as const

export type ConsentAuthorizationStatus = 'authorized' | 'consumed' | 'revoked'

export interface ConsentAuthorizationArtifact {
  schemaVersion: typeof CONSENT_ARTIFACT_SCHEMA_VERSION
  artifactId: string
  authorizationTokenHash: string
  learnerBindingHash: string
  purpose: string
  policyVersion: string
  status: ConsentAuthorizationStatus
  issuedAt: number
  guardianConsentedAt: number
  guardianVerifiedAt: number
  expiresAt: number
  guardianVerificationReceiptHash: string
  consumedAt: number | null
  provisionedLearnerNumber: string | null
}

export interface ConsentAuthorizationSeed {
  learnerBindingToken: string
  purpose: string
  policyVersion: string
  status?: ConsentAuthorizationStatus
  issuedAt: number
  guardianConsentedAt: number
  guardianVerifiedAt: number
  expiresAt: number
  guardianVerificationReceiptHash: string
}

export interface ConsentProvisioningTransactionInput {
  authorizationTokenHash: string
  at: number
}

export interface ConsentProvisioningRepository {
  /**
   * The provider MUST serialize by authorizationTokenHash and execute the
   * consent read/validation, operation callback, auth account/session writes,
   * and consent consumption in one database transaction. The callback MUST use
   * a transaction-bound auth repository. Any thrown error MUST roll back every
   * write, including account/session creation and consent consumption.
   */
  consumeAuthorizationAndProvision(
    input: ConsentProvisioningTransactionInput,
    operation: (artifact: ConsentAuthorizationArtifact) => Promise<AccountCreationResult>,
  ): Promise<AccountCreationResult>
}

export type ConsentProvisioningAuditResult = 'success' | 'failure'

export interface ConsentProvisioningAuditEvent {
  at: number
  type: 'remote-account-provisioning'
  subjectHash: string
  result: ConsentProvisioningAuditResult
}

export interface ConsentProvisioningAuditSink {
  append(event: ConsentProvisioningAuditEvent): Promise<void>
}

export interface RemoteAccountProvisioningOptions {
  repository: ConsentProvisioningRepository
  accountCreator: Pick<RemoteAuthCore, 'createAccount'>
  auditSink?: ConsentProvisioningAuditSink
  auditPepper: Buffer
  acceptedPurpose: typeof CONSENT_PURPOSE_REMOTE_PROGRESS
  acceptedPolicyVersion: string
  now?: () => number
}

export interface RemoteAccountProvisioningInput {
  authorizationToken: string
  learnerBindingToken: string
  pin: string
}

export interface RemoteAccountProvisioningService {
  provision(input: RemoteAccountProvisioningInput): Promise<AccountCreationResult>
}

export type RemoteAccountProvisioningErrorCode =
  | 'invalid-request'
  | 'authorization-invalid'
  | 'provisioning-failed'

export class RemoteAccountProvisioningError extends Error {
  constructor(readonly code: RemoteAccountProvisioningErrorCode) {
    super(
      code === 'authorization-invalid'
        ? 'Provisioning authorization failed'
        : code === 'provisioning-failed'
          ? 'Account provisioning failed'
          : 'Invalid provisioning request',
    )
    this.name = 'RemoteAccountProvisioningError'
  }
}

const NOOP_AUDIT_SINK: ConsentProvisioningAuditSink = {
  async append() {},
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isSafeTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isBoundedContractId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9._:-]{1,64}$/.test(value)
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function isOpaqueToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
}

function isLearnerNumber(value: unknown): value is string {
  return typeof value === 'string' && /^\d{12}$/.test(value)
}

function hashToken(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

export function validateConsentAuthorizationArtifact(
  value: unknown,
): ConsentAuthorizationArtifact {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RemoteAccountProvisioningError('authorization-invalid')
  }
  const artifact = value as Partial<ConsentAuthorizationArtifact>
  if (
    artifact.schemaVersion !== CONSENT_ARTIFACT_SCHEMA_VERSION ||
    typeof artifact.artifactId !== 'string' || !/^[a-f0-9]{32}$/.test(artifact.artifactId) ||
    !isSha256(artifact.authorizationTokenHash) ||
    !isSha256(artifact.learnerBindingHash) ||
    !isBoundedContractId(artifact.purpose) ||
    !isBoundedContractId(artifact.policyVersion) ||
    (artifact.status !== 'authorized' && artifact.status !== 'consumed' && artifact.status !== 'revoked') ||
    !isSafeTimestamp(artifact.issuedAt) ||
    !isSafeTimestamp(artifact.guardianConsentedAt) ||
    !isSafeTimestamp(artifact.guardianVerifiedAt) ||
    !isSafeTimestamp(artifact.expiresAt) ||
    artifact.issuedAt > artifact.guardianConsentedAt ||
    artifact.guardianConsentedAt > artifact.guardianVerifiedAt ||
    artifact.guardianVerifiedAt >= artifact.expiresAt ||
    !isSha256(artifact.guardianVerificationReceiptHash)
  ) {
    throw new RemoteAccountProvisioningError('authorization-invalid')
  }

  if (artifact.status === 'consumed') {
    if (
      !isSafeTimestamp(artifact.consumedAt) ||
      artifact.consumedAt < artifact.guardianVerifiedAt ||
      !isLearnerNumber(artifact.provisionedLearnerNumber)
    ) {
      throw new RemoteAccountProvisioningError('authorization-invalid')
    }
  } else if (artifact.consumedAt !== null || artifact.provisionedLearnerNumber !== null) {
    throw new RemoteAccountProvisioningError('authorization-invalid')
  }

  return clone(artifact as ConsentAuthorizationArtifact)
}

function validateServiceOptions(options: RemoteAccountProvisioningOptions): void {
  if (
    !options || typeof options.repository !== 'object' || options.repository === null ||
    typeof options.repository.consumeAuthorizationAndProvision !== 'function' ||
    typeof options.accountCreator !== 'object' || options.accountCreator === null ||
    typeof options.accountCreator.createAccount !== 'function' ||
    (options.auditSink !== undefined && typeof options.auditSink.append !== 'function') ||
    (options.now !== undefined && typeof options.now !== 'function') ||
    !Buffer.isBuffer(options.auditPepper) ||
    options.auditPepper.byteLength < 32 || options.auditPepper.byteLength > 128 ||
    options.acceptedPurpose !== CONSENT_PURPOSE_REMOTE_PROGRESS ||
    !isBoundedContractId(options.acceptedPolicyVersion)
  ) {
    throw new RemoteAccountProvisioningError('invalid-request')
  }
}

class RemoteAccountProvisioningServiceImplementation implements RemoteAccountProvisioningService {
  constructor(private readonly options: RemoteAccountProvisioningOptions) {}

  private timestamp(): number {
    const at = (this.options.now ?? Date.now)()
    if (!isSafeTimestamp(at)) throw new RemoteAccountProvisioningError('invalid-request')
    return at
  }

  private async audit(
    authorizationTokenHash: string,
    learnerBindingHash: string,
    result: ConsentProvisioningAuditResult,
    at: number,
  ): Promise<void> {
    const subjectHash = createHmac('sha256', this.options.auditPepper)
      .update(authorizationTokenHash)
      .update('\0')
      .update(learnerBindingHash)
      .digest('hex')
    try {
      await (this.options.auditSink ?? NOOP_AUDIT_SINK).append({
        at,
        type: 'remote-account-provisioning',
        subjectHash,
        result,
      })
    } catch {
      // A redacted audit transport failure must not turn a committed account into an orphaned retry.
    }
  }

  async provision(input: RemoteAccountProvisioningInput): Promise<AccountCreationResult> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new RemoteAccountProvisioningError('invalid-request')
    }
    if (
      !isOpaqueToken(input.authorizationToken) ||
      !isOpaqueToken(input.learnerBindingToken) ||
      !isValidFourDigitPin(input.pin)
    ) {
      throw new RemoteAccountProvisioningError('invalid-request')
    }

    const at = this.timestamp()
    const authorizationTokenHash = hashToken(input.authorizationToken)
    const learnerBindingHash = hashToken(input.learnerBindingToken)
    try {
      const account = await this.options.repository.consumeAuthorizationAndProvision(
        { authorizationTokenHash, at },
        async (storedArtifact) => {
          const artifact = validateConsentAuthorizationArtifact(storedArtifact)
          if (
            artifact.authorizationTokenHash !== authorizationTokenHash ||
            artifact.learnerBindingHash !== learnerBindingHash ||
            artifact.status !== 'authorized' ||
            artifact.purpose !== this.options.acceptedPurpose ||
            artifact.policyVersion !== this.options.acceptedPolicyVersion ||
            artifact.issuedAt > at ||
            artifact.guardianConsentedAt > at ||
            artifact.guardianVerifiedAt > at ||
            at >= artifact.expiresAt
          ) {
            throw new RemoteAccountProvisioningError('authorization-invalid')
          }
          try {
            return await this.options.accountCreator.createAccount(input.pin)
          } catch {
            throw new RemoteAccountProvisioningError('provisioning-failed')
          }
        },
      )
      await this.audit(authorizationTokenHash, learnerBindingHash, 'success', at)
      return account
    } catch (error) {
      await this.audit(authorizationTokenHash, learnerBindingHash, 'failure', at)
      if (error instanceof RemoteAccountProvisioningError) throw error
      throw new RemoteAccountProvisioningError('provisioning-failed')
    }
  }
}

export function createRemoteAccountProvisioningService(
  options: RemoteAccountProvisioningOptions,
): RemoteAccountProvisioningService {
  validateServiceOptions(options)
  return new RemoteAccountProvisioningServiceImplementation({
    ...options,
    auditPepper: Buffer.from(options.auditPepper),
  })
}

export class InMemoryConsentProvisioningRepository implements ConsentProvisioningRepository {
  private readonly artifacts = new Map<string, ConsentAuthorizationArtifact>()
  private finalizationFailuresRemaining = 0

  constructor(private readonly authRepository: InMemoryRemoteAuthRepository) {}

  async consumeAuthorizationAndProvision(
    input: ConsentProvisioningTransactionInput,
    operation: (artifact: ConsentAuthorizationArtifact) => Promise<AccountCreationResult>,
  ): Promise<AccountCreationResult> {
    if (!isSha256(input.authorizationTokenHash) || !isSafeTimestamp(input.at)) {
      throw new RemoteAccountProvisioningError('invalid-request')
    }

    return this.authRepository.runAtomicForTest(async () => {
      const stored = this.artifacts.get(input.authorizationTokenHash)
      if (!stored) throw new RemoteAccountProvisioningError('authorization-invalid')
      const artifact = validateConsentAuthorizationArtifact(stored)
      const account = await operation(artifact)
      if (this.finalizationFailuresRemaining > 0) {
        this.finalizationFailuresRemaining -= 1
        throw new RemoteAccountProvisioningError('provisioning-failed')
      }
      this.artifacts.set(input.authorizationTokenHash, {
        ...artifact,
        status: 'consumed',
        consumedAt: input.at,
        provisionedLearnerNumber: account.learnerNumber,
      })
      return account
    })
  }

  seedVerifiedAuthorizationForTest(seed: ConsentAuthorizationSeed): {
    authorizationToken: string
  } {
    return this.seedAuthorizationForTest({ ...seed, status: 'authorized' })
  }

  seedAuthorizationForTest(seed: ConsentAuthorizationSeed): {
    authorizationToken: string
  } {
    if (!seed || typeof seed !== 'object' || !isOpaqueToken(seed.learnerBindingToken)) {
      throw new RemoteAccountProvisioningError('invalid-request')
    }
    const authorizationToken = randomBytes(32).toString('base64url')
    const artifact: ConsentAuthorizationArtifact = {
      schemaVersion: CONSENT_ARTIFACT_SCHEMA_VERSION,
      artifactId: randomBytes(16).toString('hex'),
      authorizationTokenHash: hashToken(authorizationToken),
      learnerBindingHash: hashToken(seed.learnerBindingToken),
      purpose: seed.purpose,
      policyVersion: seed.policyVersion,
      status: seed.status ?? 'authorized',
      issuedAt: seed.issuedAt,
      guardianConsentedAt: seed.guardianConsentedAt,
      guardianVerifiedAt: seed.guardianVerifiedAt,
      expiresAt: seed.expiresAt,
      guardianVerificationReceiptHash: seed.guardianVerificationReceiptHash,
      consumedAt: null,
      provisionedLearnerNumber: null,
    }
    const validated = validateConsentAuthorizationArtifact(artifact)
    this.artifacts.set(validated.authorizationTokenHash, validated)
    return { authorizationToken }
  }

  failNextFinalizationsForTest(count: number): void {
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RemoteAccountProvisioningError('invalid-request')
    }
    this.finalizationFailuresRemaining = count
  }

  snapshot(): ConsentAuthorizationArtifact[] {
    return clone(Array.from(this.artifacts.values()))
  }
}

export class InMemoryConsentProvisioningAuditSink implements ConsentProvisioningAuditSink {
  private readonly events: ConsentProvisioningAuditEvent[] = []

  async append(event: ConsentProvisioningAuditEvent): Promise<void> {
    this.events.push(clone(event))
  }

  snapshot(): ConsentProvisioningAuditEvent[] {
    return clone(this.events)
  }
}
