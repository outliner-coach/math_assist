import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import {
  InMemoryRemoteAuthRepository,
  createRemoteAuthCore,
} from './remote-auth-core'
import {
  CONSENT_PURPOSE_REMOTE_PROGRESS,
  InMemoryConsentProvisioningAuditSink,
  InMemoryConsentProvisioningRepository,
  RemoteAccountProvisioningError,
  createRemoteAccountProvisioningService,
  type ConsentAuthorizationSeed,
} from './remote-account-provisioning'

const POLICY_VERSION = 'privacy-policy-staging-v1'
const AUDIT_PEPPER = Buffer.alloc(32, 7)
const VERIFICATION_RECEIPT_HASH = 'a'.repeat(64)

function token(): string {
  return randomBytes(32).toString('base64url')
}

async function fixture(now = 1_000) {
  const authRepository = new InMemoryRemoteAuthRepository()
  const authCore = await createRemoteAuthCore({
    repository: authRepository,
    auditPepper: Buffer.alloc(32, 3),
    unsafeTestPbkdf2Iterations: 1_000,
    now: () => now,
  })
  const repository = new InMemoryConsentProvisioningRepository(authRepository)
  const auditSink = new InMemoryConsentProvisioningAuditSink()
  const service = createRemoteAccountProvisioningService({
    repository,
    accountCreator: authCore,
    auditSink,
    auditPepper: AUDIT_PEPPER,
    acceptedPurpose: CONSENT_PURPOSE_REMOTE_PROGRESS,
    acceptedPolicyVersion: POLICY_VERSION,
    now: () => now,
  })
  return { authRepository, repository, auditSink, service }
}

function authorizationInput(learnerBindingToken: string, overrides: Record<string, unknown> = {}) {
  return {
    learnerBindingToken,
    purpose: CONSENT_PURPOSE_REMOTE_PROGRESS,
    policyVersion: POLICY_VERSION,
    issuedAt: 900,
    guardianConsentedAt: 920,
    guardianVerifiedAt: 940,
    expiresAt: 2_000,
    guardianVerificationReceiptHash: VERIFICATION_RECEIPT_HASH,
    ...overrides,
  }
}

describe('remote account consent provisioning', () => {
  it('rejects a service configured for any purpose other than remote progress', async () => {
    const authRepository = new InMemoryRemoteAuthRepository()
    const authCore = await createRemoteAuthCore({
      repository: authRepository,
      auditPepper: Buffer.alloc(32, 3),
      unsafeTestPbkdf2Iterations: 1_000,
    })
    const repository = new InMemoryConsentProvisioningRepository(authRepository)

    expect(() => createRemoteAccountProvisioningService({
      repository,
      accountCreator: authCore,
      auditPepper: AUDIT_PEPPER,
      acceptedPurpose: 'marketing-profile' as typeof CONSENT_PURPOSE_REMOTE_PROGRESS,
      acceptedPolicyVersion: POLICY_VERSION,
    })).toThrow(new RemoteAccountProvisioningError('invalid-request'))
    expect(authRepository.snapshot()).toEqual({ accounts: [], sessions: [] })
  })

  it('creates zero learner records before consent and provisions only after atomic authorization use', async () => {
    const { authRepository, repository, service } = await fixture()
    const learnerBindingToken = token()
    const authorization = repository.seedVerifiedAuthorizationForTest(
      authorizationInput(learnerBindingToken),
    )

    expect(authRepository.snapshot()).toEqual({ accounts: [], sessions: [] })

    const account = await service.provision({
      authorizationToken: authorization.authorizationToken,
      learnerBindingToken,
      pin: '1234',
    })

    expect(account.learnerNumber).toMatch(/^\d{12}$/)
    expect(authRepository.snapshot().accounts).toHaveLength(1)
    expect(repository.snapshot()[0]).toMatchObject({
      status: 'consumed',
      consumedAt: 1_000,
      provisionedLearnerNumber: account.learnerNumber,
    })
  })

  it('does not consume authorization or leave an orphan account when auth creation fails', async () => {
    const { authRepository, repository, service } = await fixture()
    const learnerBindingToken = token()
    const authorization = repository.seedVerifiedAuthorizationForTest(
      authorizationInput(learnerBindingToken),
    )
    authRepository.failNextAccountCreations(100)

    await expect(service.provision({
      authorizationToken: authorization.authorizationToken,
      learnerBindingToken,
      pin: '1234',
    })).rejects.toMatchObject({ code: 'provisioning-failed' })

    expect(repository.snapshot()[0]).toMatchObject({
      status: 'authorized',
      consumedAt: null,
      provisionedLearnerNumber: null,
    })
    expect(authRepository.snapshot()).toEqual({ accounts: [], sessions: [] })
  })

  it('enforces the provider transaction contract by rolling back auth writes when consent finalization fails', async () => {
    const { authRepository, repository, service } = await fixture()
    const learnerBindingToken = token()
    const authorization = repository.seedVerifiedAuthorizationForTest(
      authorizationInput(learnerBindingToken),
    )
    repository.failNextFinalizationsForTest(1)

    await expect(service.provision({
      authorizationToken: authorization.authorizationToken,
      learnerBindingToken,
      pin: '1234',
    })).rejects.toMatchObject({ code: 'provisioning-failed' })

    expect(repository.snapshot()[0].status).toBe('authorized')
    expect(authRepository.snapshot()).toEqual({ accounts: [], sessions: [] })
  })

  it('prevents learner-binding IDOR, one-time reuse, and concurrent replay', async () => {
    const { authRepository, repository, service } = await fixture()
    const learnerBindingToken = token()
    const authorization = repository.seedVerifiedAuthorizationForTest(
      authorizationInput(learnerBindingToken),
    )

    await expect(service.provision({
      authorizationToken: authorization.authorizationToken,
      learnerBindingToken: token(),
      pin: '1234',
    })).rejects.toMatchObject({ code: 'authorization-invalid' })
    expect(repository.snapshot()[0].status).toBe('authorized')
    expect(authRepository.snapshot().accounts).toHaveLength(0)

    const attempts = await Promise.allSettled([
      service.provision({
        authorizationToken: authorization.authorizationToken,
        learnerBindingToken,
        pin: '1234',
      }),
      service.provision({
        authorizationToken: authorization.authorizationToken,
        learnerBindingToken,
        pin: '5678',
      }),
    ])
    expect(attempts.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(attempts.filter(({ status }) => status === 'rejected')).toHaveLength(1)
    expect(authRepository.snapshot().accounts).toHaveLength(1)

    await expect(service.provision({
      authorizationToken: authorization.authorizationToken,
      learnerBindingToken,
      pin: '1234',
    })).rejects.toMatchObject({ code: 'authorization-invalid' })
    expect(authRepository.snapshot().accounts).toHaveLength(1)
  })

  it.each([
    ['expired', { expiresAt: 1_000 }],
    ['future consent', { guardianConsentedAt: 1_100, guardianVerifiedAt: 1_120 }],
    ['wrong purpose', { purpose: 'marketing-profile' }],
    ['wrong policy', { policyVersion: 'old-policy' }],
    ['revoked', { status: 'revoked' }],
  ])('rejects %s authorization without creating an account', async (_label, overrides) => {
    const { authRepository, repository, service } = await fixture()
    const learnerBindingToken = token()
    const authorization = repository.seedAuthorizationForTest(
      authorizationInput(learnerBindingToken, overrides) as ConsentAuthorizationSeed,
    )

    await expect(service.provision({
      authorizationToken: authorization.authorizationToken,
      learnerBindingToken,
      pin: '1234',
    })).rejects.toMatchObject({
      code: 'authorization-invalid',
      message: 'Provisioning authorization failed',
    })
    expect(authRepository.snapshot().accounts).toHaveLength(0)
  })

  it('runtime-validates artifacts and request bounds without consuming anything', async () => {
    const { authRepository, repository, service } = await fixture()
    const learnerBindingToken = token()

    expect(() => repository.seedAuthorizationForTest({
      ...authorizationInput(learnerBindingToken),
      guardianVerificationReceiptHash: 'raw-receipt',
    } as ConsentAuthorizationSeed)).toThrow(RemoteAccountProvisioningError)
    await expect(service.provision({
      authorizationToken: 'x'.repeat(10_000),
      learnerBindingToken,
      pin: '1234',
    })).rejects.toMatchObject({ code: 'invalid-request' })
    expect(repository.snapshot()).toHaveLength(0)
    expect(authRepository.snapshot().accounts).toHaveLength(0)
  })

  it('stores and audits no raw guardian contact, authorization, binding, PIN, or session secret', async () => {
    const { authRepository, repository, auditSink, service } = await fixture()
    const learnerBindingToken = token()
    const rawGuardianContact = 'guardian@example.test'
    const authorization = repository.seedVerifiedAuthorizationForTest({
      ...authorizationInput(learnerBindingToken),
      guardianContact: rawGuardianContact,
    } as ConsentAuthorizationSeed & { guardianContact: string })

    const account = await service.provision({
      authorizationToken: authorization.authorizationToken,
      learnerBindingToken,
      pin: '1234',
    })
    const storedJson = JSON.stringify({
      consent: repository.snapshot(),
      auth: authRepository.snapshot(),
      audit: auditSink.snapshot(),
    })

    for (const raw of [
      rawGuardianContact,
      authorization.authorizationToken,
      learnerBindingToken,
      account.recoveryCode,
      account.sessionToken,
    ]) {
      expect(storedJson).not.toContain(raw)
    }
    expect(repository.snapshot()[0]).not.toHaveProperty('guardianContact')
    expect(auditSink.snapshot().every((event) => (
      Object.keys(event).sort().join(',') === 'at,result,subjectHash,type'
    ))).toBe(true)
  })
})
