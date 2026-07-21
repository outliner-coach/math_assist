import {
  applyRemoteProgressMerge,
  buildRemoteProgressMergePreview,
  validateRemoteProgressEnvelope,
  type RemoteProgressEnvelope,
} from './remote-progress'

export type RemoteProgressTransportErrorCode =
  | 'offline'
  | 'not-found'
  | 'revision-conflict'

export class RemoteProgressTransportError extends Error {
  constructor(readonly code: RemoteProgressTransportErrorCode) {
    super(code === 'not-found' ? 'Remote progress was not found' : code)
    this.name = 'RemoteProgressTransportError'
  }
}

export interface RemoteProgressTransport {
  read(learnerId: string): Promise<RemoteProgressEnvelope>
  merge(
    learnerId: string,
    expectedRevision: string,
    local: RemoteProgressEnvelope,
    now?: number,
  ): Promise<RemoteProgressEnvelope>
}

function copyEnvelope(envelope: RemoteProgressEnvelope): RemoteProgressEnvelope {
  return JSON.parse(JSON.stringify(envelope)) as RemoteProgressEnvelope
}

/**
 * Contract-test transport for Phase 5A only. It is deliberately not exported
 * from a route and cannot authenticate a production learner.
 */
export class InMemoryRemoteProgressTransport implements RemoteProgressTransport {
  private offline = false
  private revisionSequence: number

  constructor(
    private envelope: RemoteProgressEnvelope,
    private readonly authenticatedLearnerId: string,
  ) {
    const sequence = Number.parseInt(envelope.revision.match(/(\d+)$/)?.[1] ?? '1', 10)
    this.revisionSequence = Number.isFinite(sequence) ? sequence : 1
    this.envelope = validateRemoteProgressEnvelope(envelope)
  }

  setOffline(offline: boolean): void {
    this.offline = offline
  }

  async read(learnerId: string): Promise<RemoteProgressEnvelope> {
    this.assertAvailable()
    this.assertAuthorized(learnerId)
    return copyEnvelope(this.envelope)
  }

  async merge(
    learnerId: string,
    expectedRevision: string,
    local: RemoteProgressEnvelope,
    now = Date.now(),
  ): Promise<RemoteProgressEnvelope> {
    this.assertAvailable()
    this.assertAuthorized(learnerId)
    if (expectedRevision !== this.envelope.revision) {
      throw new RemoteProgressTransportError('revision-conflict')
    }
    const preview = buildRemoteProgressMergePreview(local, this.envelope, now)
    if (preview.conflicts.length > 0) {
      throw new RemoteProgressTransportError('revision-conflict')
    }
    const merged = applyRemoteProgressMerge(preview)
    this.revisionSequence += 1
    this.envelope = {
      ...merged,
      revision: `rev-${this.revisionSequence}`,
      updatedAt: now,
    }
    return copyEnvelope(this.envelope)
  }

  private assertAvailable(): void {
    if (this.offline) throw new RemoteProgressTransportError('offline')
  }

  private assertAuthorized(learnerId: string): void {
    if (
      learnerId !== this.authenticatedLearnerId
      || learnerId !== this.envelope.learnerId
    ) {
      throw new RemoteProgressTransportError('not-found')
    }
  }
}
