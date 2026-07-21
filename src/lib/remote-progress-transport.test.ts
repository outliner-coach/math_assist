import { describe, expect, it } from 'vitest'

import {
  InMemoryRemoteProgressTransport,
  RemoteProgressTransportError,
} from './remote-progress-transport'
import type { RemoteProgressEnvelope } from './remote-progress'

function envelope(revision: string, activityId: string | null = null): RemoteProgressEnvelope {
  return {
    schemaVersion: 1,
    learnerId: 'learner-1',
    revision,
    legacyBaselines: [],
    receipts: [],
    recentActivity: activityId ? { grade: 1, activityId, at: 100 } : null,
    avatarId: null,
    updatedAt: 100,
  }
}

describe('remote progress transport contract', () => {
  it('requires the authenticated learner and hides another learner record', async () => {
    const transport = new InMemoryRemoteProgressTransport(envelope('rev-1'), 'learner-1')
    await expect(transport.read('learner-1')).resolves.toMatchObject({ revision: 'rev-1' })
    await expect(transport.read('learner-2')).rejects.toMatchObject({ code: 'not-found' })
  })

  it('uses optimistic revision checks and returns a new server revision', async () => {
    const transport = new InMemoryRemoteProgressTransport(envelope('rev-1'), 'learner-1')
    const merged = await transport.merge('learner-1', 'rev-1', envelope('local', 'g1-next'), 200)

    expect(merged.revision).toBe('rev-2')
    expect(merged.recentActivity?.activityId).toBe('g1-next')
    await expect(transport.merge('learner-1', 'rev-1', envelope('stale'), 300))
      .rejects.toMatchObject({ code: 'revision-conflict' })
  })

  it('surfaces offline failure without mutating the server envelope', async () => {
    const transport = new InMemoryRemoteProgressTransport(envelope('rev-1'), 'learner-1')
    transport.setOffline(true)

    await expect(transport.merge('learner-1', 'rev-1', envelope('local', 'offline'), 200))
      .rejects.toBeInstanceOf(RemoteProgressTransportError)
    transport.setOffline(false)
    await expect(transport.read('learner-1')).resolves.toEqual(envelope('rev-1'))
  })

  it('rejects an unsafe initial runtime envelope before it can be read', () => {
    expect(() => new InMemoryRemoteProgressTransport({
      ...envelope('rev-1'),
      receipts: [{ answer: 'raw-answer', commands: [{ type: 'stroke' }] }],
    } as unknown as RemoteProgressEnvelope, 'learner-1')).toThrow()
  })
})
