import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  DEFAULT_PBKDF2_ITERATIONS,
  InMemoryRemoteAuthAuditSink,
  InMemoryRemoteAuthRepository,
  RemoteAuthError,
  createRemoteAuthCore,
  isValidFourDigitPin,
} from './remote-auth-core'

const TEST_ITERATIONS = 1_000

async function fixture(options: {
  maxFailures?: number
  now?: () => number
} = {}) {
  const repository = new InMemoryRemoteAuthRepository()
  const auditSink = new InMemoryRemoteAuthAuditSink()
  const core = await createRemoteAuthCore({
    repository,
    auditSink,
    unsafeTestPbkdf2Iterations: TEST_ITERATIONS,
    now: options.now,
    rateLimitPolicy: options.maxFailures
      ? { maxFailures: options.maxFailures, windowMs: 60_000, blockDurationMs: 60_000 }
      : undefined,
  })
  return { core, repository, auditSink }
}

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? filesUnder(path) : [path]
  })
}

describe('remote auth server core', () => {
  it('accepts exactly four ASCII digits and keeps a secure production PBKDF2 default', () => {
    expect(isValidFourDigitPin('0000')).toBe(true)
    expect(isValidFourDigitPin('9876')).toBe(true)
    for (const invalid of ['123', '12345', '12 4', '１２３４', 'abcd', 1234, null]) {
      expect(isValidFourDigitPin(invalid)).toBe(false)
    }
    expect(DEFAULT_PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600_000)
  })

  it('creates unique cryptographically-random learner numbers and stores no raw credentials', async () => {
    const { core, repository } = await fixture()
    const created = await Promise.all([
      core.createAccount('1234'),
      core.createAccount('1234'),
      core.createAccount('1234'),
      core.createAccount('1234'),
    ])

    expect(new Set(created.map((account) => account.learnerNumber)).size).toBe(4)
    for (const account of created) {
      expect(account.learnerNumber).toMatch(/^\d{12}$/)
      expect(account.recoveryCode).toMatch(/^[A-Za-z0-9_-]{22}$/)
      expect(account.sessionToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    }
    const numericIds = created.map(({ learnerNumber }) => BigInt(learnerNumber))
    expect(numericIds.some((value, index) => index > 0 && value === numericIds[index - 1] + 1n))
      .toBe(false)

    const snapshot = repository.snapshot()
    const stored = JSON.stringify(snapshot)
    expect(stored).not.toContain('"pin":')
    expect(stored).not.toContain('"recoveryCode":')
    expect(stored).not.toContain('"sessionToken":')
    expect(snapshot.accounts[0].pinVerifier).toMatchObject({
      algorithm: 'pbkdf2-sha256',
      iterations: TEST_ITERATIONS,
    })
    expect(snapshot.accounts[0].pinVerifier.salt).not.toBe(snapshot.accounts[1].pinVerifier.salt)
    for (const account of created) {
      expect(stored).not.toContain(account.recoveryCode)
      expect(stored).not.toContain(account.sessionToken)
    }
    expect(snapshot.sessions.every((session) => /^[a-f0-9]{64}$/.test(session.tokenHash))).toBe(true)
  })

  it('uses the same public failure for an unknown learner and a wrong PIN', async () => {
    const { core } = await fixture()
    const created = await core.createAccount('1234')

    await expect(core.login({
      learnerNumber: created.learnerNumber,
      pin: '9999',
      networkIdentifier: 'network-a',
    })).rejects.toMatchObject({
      code: 'invalid-credentials',
      message: 'Authentication failed',
    })
    await expect(core.login({
      learnerNumber: '000000000000',
      pin: '9999',
      networkIdentifier: 'network-a',
    })).rejects.toMatchObject({
      code: 'invalid-credentials',
      message: 'Authentication failed',
    })
  })

  it('rate limits login independently by account and by network across changed identifiers', async () => {
    let now = 1_000
    const { core } = await fixture({ maxFailures: 2, now: () => now })
    const first = await core.createAccount('1234')
    const second = await core.createAccount('5678')

    await expect(core.login({
      learnerNumber: first.learnerNumber,
      pin: '9999',
      networkIdentifier: 'network-a',
    })).rejects.toMatchObject({ code: 'invalid-credentials' })
    await expect(core.login({
      learnerNumber: first.learnerNumber,
      pin: '9999',
      networkIdentifier: 'network-b',
    })).rejects.toMatchObject({ code: 'invalid-credentials' })
    await expect(core.login({
      learnerNumber: first.learnerNumber,
      pin: '1234',
      networkIdentifier: 'network-c',
    })).rejects.toMatchObject({ code: 'rate-limited' })

    await expect(core.login({
      learnerNumber: '000000000000',
      pin: '9999',
      networkIdentifier: 'network-shared',
    })).rejects.toMatchObject({ code: 'invalid-credentials' })
    await expect(core.login({
      learnerNumber: '000000000001',
      pin: '9999',
      networkIdentifier: 'network-shared',
    })).rejects.toMatchObject({ code: 'invalid-credentials' })
    await expect(core.login({
      learnerNumber: second.learnerNumber,
      pin: '5678',
      networkIdentifier: 'network-shared',
    })).rejects.toMatchObject({ code: 'rate-limited' })

    now += 60_001
    await expect(core.login({
      learnerNumber: first.learnerNumber,
      pin: '1234',
      networkIdentifier: 'network-c',
    })).resolves.toMatchObject({
      learnerNumber: first.learnerNumber,
    })
  })

  it('applies the same account-and-network limiter and generic failures to recovery', async () => {
    let now = 1_000
    const { core } = await fixture({ maxFailures: 2, now: () => now })
    const created = await core.createAccount('1234')
    const wrong = {
      learnerNumber: created.learnerNumber,
      recoveryCode: 'AAAAAAAAAAAAAAAAAAAAAA',
      newPin: '5678',
      networkIdentifier: 'network-a',
    }

    await expect(core.recover(wrong)).rejects.toMatchObject({ code: 'invalid-credentials' })
    await expect(core.recover(wrong)).rejects.toMatchObject({ code: 'invalid-credentials' })
    await expect(core.recover({ ...wrong, recoveryCode: created.recoveryCode }))
      .rejects.toMatchObject({ code: 'rate-limited' })
    await expect(core.recover({
      ...wrong,
      learnerNumber: '000000000000',
      networkIdentifier: 'network-b',
    })).rejects.toMatchObject({
      code: 'invalid-credentials',
      message: 'Authentication failed',
    })
    await expect(core.recover({
      ...wrong,
      recoveryCode: created.recoveryCode,
      networkIdentifier: 'network-b',
    })).rejects.toMatchObject({ code: 'rate-limited' })

    now += 60_001
    await expect(core.recover({
      ...wrong,
      recoveryCode: created.recoveryCode,
      networkIdentifier: 'network-b',
    })).resolves.toMatchObject({ learnerNumber: created.learnerNumber })
  })

  it('uses recovery codes once, rotates the code and PIN, and revokes every old session', async () => {
    const { core } = await fixture()
    const created = await core.createAccount('1234')
    const login = await core.login({
      learnerNumber: created.learnerNumber,
      pin: '1234',
      networkIdentifier: 'network-a',
    })

    const recovered = await core.recover({
      learnerNumber: created.learnerNumber,
      recoveryCode: created.recoveryCode,
      newPin: '5678',
      networkIdentifier: 'network-a',
    })

    await expect(core.authenticateSession(created.sessionToken))
      .rejects.toMatchObject({ code: 'invalid-session' })
    await expect(core.authenticateSession(login.sessionToken))
      .rejects.toMatchObject({ code: 'invalid-session' })
    await expect(core.authenticateSession(recovered.sessionToken)).resolves.toEqual({
      learnerNumber: created.learnerNumber,
    })
    await expect(core.recover({
      learnerNumber: created.learnerNumber,
      recoveryCode: created.recoveryCode,
      newPin: '0000',
      networkIdentifier: 'network-b',
    })).rejects.toMatchObject({ code: 'invalid-credentials' })
    await expect(core.login({
      learnerNumber: created.learnerNumber,
      pin: '1234',
      networkIdentifier: 'network-c',
    })).rejects.toMatchObject({ code: 'invalid-credentials' })
    await expect(core.login({
      learnerNumber: created.learnerNumber,
      pin: '5678',
      networkIdentifier: 'network-c',
    })).resolves.toMatchObject({ learnerNumber: created.learnerNumber })
    expect(recovered.recoveryCode).not.toBe(created.recoveryCode)
  })

  it('atomically allows only one concurrent use of a recovery code', async () => {
    const { core } = await fixture()
    const created = await core.createAccount('1234')
    const input = {
      learnerNumber: created.learnerNumber,
      recoveryCode: created.recoveryCode,
      newPin: '5678',
      networkIdentifier: 'network-a',
    }

    const attempts = await Promise.allSettled([
      core.recover(input),
      core.recover({ ...input, networkIdentifier: 'network-b' }),
    ])
    expect(attempts.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    const rejected = attempts.find(({ status }) => status === 'rejected')
    expect(rejected).toMatchObject({
      status: 'rejected',
      reason: expect.objectContaining({ code: 'invalid-credentials' }),
    })
  })

  it('stores opaque session hashes and supports explicit revoke-all', async () => {
    const { core, repository } = await fixture()
    const created = await core.createAccount('1234')
    const second = await core.login({
      learnerNumber: created.learnerNumber,
      pin: '1234',
      networkIdentifier: 'network-a',
    })

    expect(JSON.stringify(repository.snapshot())).not.toContain(second.sessionToken)
    await core.revokeAllSessions(created.sessionToken)
    await expect(core.authenticateSession(created.sessionToken))
      .rejects.toMatchObject({ code: 'invalid-session' })
    await expect(core.authenticateSession(second.sessionToken))
      .rejects.toMatchObject({ code: 'invalid-session' })
  })

  it('requires an authenticated session for self revoke-all', async () => {
    const { core } = await fixture()
    const first = await core.createAccount('1234')
    const second = await core.createAccount('5678')

    await expect(core.revokeAllSessions('x'.repeat(43)))
      .rejects.toMatchObject({ code: 'invalid-session' })
    await expect(core.revokeAllSessions(second.learnerNumber))
      .rejects.toMatchObject({ code: 'invalid-session' })
    await expect(core.authenticateSession(first.sessionToken)).resolves.toMatchObject({
      learnerNumber: first.learnerNumber,
    })
    await expect(core.authenticateSession(second.sessionToken)).resolves.toMatchObject({
      learnerNumber: second.learnerNumber,
    })
  })

  it('requires a stable production audit pepper and leaves no orphan on atomic account failure', async () => {
    const productionRepository = new InMemoryRemoteAuthRepository()
    await expect(createRemoteAuthCore({ repository: productionRepository }))
      .rejects.toMatchObject({ code: 'invalid-request' })

    const repository = new InMemoryRemoteAuthRepository()
    repository.failNextAccountCreations(100)
    const core = await createRemoteAuthCore({
      repository,
      unsafeTestPbkdf2Iterations: TEST_ITERATIONS,
    })
    await expect(core.createAccount('1234')).rejects.toMatchObject({
      code: 'service-unavailable',
    })
    expect(repository.snapshot()).toEqual({ accounts: [], sessions: [] })
  })

  it('does not orphan committed credentials when the redacted audit transport fails', async () => {
    const repository = new InMemoryRemoteAuthRepository()
    const core = await createRemoteAuthCore({
      repository,
      auditSink: { async append() { throw new Error('audit unavailable') } },
      auditPepper: Buffer.alloc(32, 9),
      unsafeTestPbkdf2Iterations: TEST_ITERATIONS,
    })

    const created = await core.createAccount('1234')
    expect(repository.snapshot()).toMatchObject({
      accounts: [{ learnerNumber: created.learnerNumber }],
      sessions: [{ learnerNumber: created.learnerNumber }],
    })
    await expect(core.authenticateSession(created.sessionToken)).resolves.toEqual({
      learnerNumber: created.learnerNumber,
    })
  })

  it('redacts credentials, session tokens, learner numbers, and network identifiers from audit events', async () => {
    const { core, auditSink } = await fixture()
    const created = await core.createAccount('1234')
    await core.login({
      learnerNumber: created.learnerNumber,
      pin: '1234',
      networkIdentifier: '203.0.113.42',
    })
    await core.recover({
      learnerNumber: created.learnerNumber,
      recoveryCode: created.recoveryCode,
      newPin: '5678',
      networkIdentifier: '203.0.113.42',
    })

    const auditJson = JSON.stringify(auditSink.snapshot())
    expect(auditSink.snapshot().every((event) => (
      Object.keys(event).sort().join(',') === 'at,result,subjectHash,type'
    ))).toBe(true)
    for (const secret of [
      created.learnerNumber,
      created.recoveryCode,
      created.sessionToken,
      '203.0.113.42',
    ]) {
      expect(auditJson).not.toContain(secret)
    }
    expect(auditSink.snapshot().every((event) => /^[a-f0-9]{64}$/.test(event.subjectHash))).toBe(true)
  })

  it('rejects malformed and oversized runtime inputs before storage mutation', async () => {
    const { core, repository } = await fixture()
    await expect(core.createAccount('123')).rejects.toBeInstanceOf(RemoteAuthError)
    expect(repository.snapshot().accounts).toHaveLength(0)

    await expect(core.login(null as unknown as Parameters<typeof core.login>[0]))
      .rejects.toMatchObject({ code: 'invalid-request' })
    await expect(core.recover([] as unknown as Parameters<typeof core.recover>[0]))
      .rejects.toMatchObject({ code: 'invalid-request' })

    await expect(core.login({
      learnerNumber: '1'.repeat(10_000),
      pin: '1'.repeat(10_000),
      networkIdentifier: 'network-a',
    })).rejects.toMatchObject({ code: 'invalid-credentials' })
    await expect(core.login({
      learnerNumber: '000000000000',
      pin: '1234',
      networkIdentifier: '',
    })).rejects.toMatchObject({ code: 'invalid-request' })
    await expect(core.authenticateSession('x'.repeat(10_000)))
      .rejects.toMatchObject({ code: 'invalid-session' })

    await expect(createRemoteAuthCore({
      repository: {} as InMemoryRemoteAuthRepository,
      auditPepper: Buffer.alloc(32, 1),
    })).rejects.toMatchObject({ code: 'invalid-request' })
  })
})

describe('remote auth client boundary', () => {
  it('uses Node crypto and is not imported by any production source outside the server boundary', () => {
    const corePath = join(process.cwd(), 'src/lib/server/remote-auth-core.ts')
    expect(readFileSync(corePath, 'utf8')).toContain("from 'node:crypto'")

    const productionSources = filesUnder(join(process.cwd(), 'src'))
      .filter((path) => /\.(ts|tsx)$/.test(path))
      .filter((path) => !path.includes('/src/lib/server/'))
      .filter((path) => !path.endsWith('.test.ts'))
    for (const path of productionSources) {
      expect(readFileSync(path, 'utf8')).not.toMatch(/(?:@\/lib\/server|lib\/server\/remote-auth)/)
    }
  })
})
