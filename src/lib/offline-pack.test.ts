import { describe, expect, it } from 'vitest'

import {
  OFFLINE_ERROR_CODES,
  OFFLINE_PACK_STATUSES,
  OFFLINE_REQUEST_MESSAGE_TYPES,
  OFFLINE_RESPONSE_MESSAGE_TYPES,
  createInitialOfflineSnapshot,
  createBrowserOfflinePackClient,
  isOfflineGrade,
  parseOfflineResponse,
  reduceOfflineSnapshot,
  type OfflineRequestMessage,
  type OfflineResponseMessage,
} from './offline-pack'

function stateMessage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    type: 'MATH_ASSIST_OFFLINE_STATE',
    appRelease: 'a'.repeat(64),
    contentRelease: 'b'.repeat(64),
    updateReady: false,
    grades: {
      1: 'not-installed',
      2: 'installed',
      3: 'not-installed',
      4: 'not-installed',
      5: 'update-available',
      6: 'not-installed',
    },
    ...overrides,
  }
}

describe('offline-pack message contract', () => {
  it('mirrors spec §7 message types verbatim', () => {
    expect(OFFLINE_REQUEST_MESSAGE_TYPES).toEqual({
      installGradePack: 'MATH_ASSIST_INSTALL_GRADE_PACK',
      removeGradePack: 'MATH_ASSIST_REMOVE_GRADE_PACK',
      queryOfflineState: 'MATH_ASSIST_QUERY_OFFLINE_STATE',
      activateUpdate: 'MATH_ASSIST_ACTIVATE_UPDATE',
    })
    expect(OFFLINE_RESPONSE_MESSAGE_TYPES).toEqual({
      progress: 'MATH_ASSIST_OFFLINE_PROGRESS',
      state: 'MATH_ASSIST_OFFLINE_STATE',
      error: 'MATH_ASSIST_OFFLINE_ERROR',
      updateReady: 'MATH_ASSIST_UPDATE_READY',
    })
  })

  it('fixes the status enum and error codes to the documented sets', () => {
    expect(OFFLINE_PACK_STATUSES).toEqual([
      'not-installed',
      'installing',
      'installed',
      'update-available',
      'removing',
      'error',
    ])
    expect(Object.values(OFFLINE_ERROR_CODES)).toEqual([
      'INVALID_MESSAGE',
      'INVALID_GRADE',
      'METADATA_UNAVAILABLE',
      'PACK_MANIFEST_INVALID',
      'ASSET_FETCH_FAILED',
      'PACK_WRITE_FAILED',
      'QUOTA_EXCEEDED',
      'VERIFY_FAILED',
      'ALREADY_INSTALLING',
      'REMOVE_FAILED',
      'UNKNOWN_MESSAGE',
    ])
  })

  it('validates grade values 1-6 only', () => {
    expect(isOfflineGrade(1)).toBe(true)
    expect(isOfflineGrade(6)).toBe(true)
    expect(isOfflineGrade(0)).toBe(false)
    expect(isOfflineGrade(7)).toBe(false)
    expect(isOfflineGrade('2')).toBe(false)
    expect(isOfflineGrade(null)).toBe(false)
  })

  it('parses valid responses and rejects foreign or malformed payloads', () => {
    const parsed = parseOfflineResponse(stateMessage())
    expect(parsed?.type).toBe('MATH_ASSIST_OFFLINE_STATE')

    expect(
      parseOfflineResponse({ schemaVersion: 1, type: 'MATH_ASSIST_OFFLINE_PROGRESS', grade: 2, completed: 1, total: 3 })
        ?.type,
    ).toBe('MATH_ASSIST_OFFLINE_PROGRESS')
    const parsedError = parseOfflineResponse({
      schemaVersion: 1,
      type: 'MATH_ASSIST_OFFLINE_ERROR',
      code: 'QUOTA_EXCEEDED',
      grade: 2,
    })
    expect(
      parsedError && parsedError.type === 'MATH_ASSIST_OFFLINE_ERROR' ? parsedError.payload.code : null,
    ).toBe('QUOTA_EXCEEDED')
    expect(parseOfflineResponse({ schemaVersion: 1, type: 'MATH_ASSIST_UPDATE_READY' })?.type).toBe('MATH_ASSIST_UPDATE_READY')

    expect(parseOfflineResponse(undefined)).toBeNull()
    expect(parseOfflineResponse({ schemaVersion: 2, type: 'MATH_ASSIST_OFFLINE_STATE' })).toBeNull()
    expect(parseOfflineResponse({ schemaVersion: 1, type: 'SOMEONE_ELSES_MESSAGE' })).toBeNull()
    expect(parseOfflineResponse({ schemaVersion: 1, type: 'MATH_ASSIST_OFFLINE_ERROR', code: 'NOT_A_CODE' })).toBeNull()
    expect(parseOfflineResponse(stateMessage({ grades: { ...stateMessage().grades as Record<string, string>, 2: 'hacked' } }))).toBeNull()
  })
})

describe('offline-pack state machine', () => {
  it('starts SSR-safe with every grade not installed', () => {
    const snapshot = createInitialOfflineSnapshot()
    expect(snapshot.ready).toBe(false)
    expect(snapshot.updateReady).toBe(false)
    expect(snapshot.appRelease).toBeNull()
    for (const grade of [1, 2, 3, 4, 5, 6] as const) {
      expect(snapshot.grades[grade].status).toBe('not-installed')
      expect(snapshot.grades[grade].errorCode).toBeNull()
    }
  })

  it('applies authoritative state and marks content updates', () => {
    let snapshot = reduceOfflineSnapshot(createInitialOfflineSnapshot(), parseOfflineResponse(stateMessage())!)
    expect(snapshot.ready).toBe(true)
    expect(snapshot.appRelease).toBe('a'.repeat(64))
    expect(snapshot.grades[2].status).toBe('installed')
    expect(snapshot.grades[5].status).toBe('update-available')
    expect(snapshot.grades[1].status).toBe('not-installed')

    snapshot = reduceOfflineSnapshot(
      snapshot,
      parseOfflineResponse(stateMessage({ updateReady: true }))!,
    )
    expect(snapshot.updateReady).toBe(true)
  })

  it('overlays installing/removing transitions and resolves them on terminal states', () => {
    let snapshot = reduceOfflineSnapshot(createInitialOfflineSnapshot(), parseOfflineResponse(stateMessage())!)
    snapshot = reduceOfflineSnapshot(snapshot, { kind: 'request', requestType: 'installGradePack', grade: 3 })
    expect(snapshot.grades[3].status).toBe('installing')
    expect(snapshot.grades[2].status).toBe('installed')

    snapshot = reduceOfflineSnapshot(
      snapshot,
      parseOfflineResponse({ schemaVersion: 1, type: 'MATH_ASSIST_OFFLINE_PROGRESS', grade: 3, completed: 2, total: 9 })!,
    )
    expect(snapshot.grades[3]).toMatchObject({ status: 'installing', completed: 2, total: 9 })

    snapshot = reduceOfflineSnapshot(
      snapshot,
      parseOfflineResponse(stateMessage({ grades: { ...stateMessage().grades as Record<string, string>, 3: 'installed' } }))!,
    )
    expect(snapshot.grades[3].status).toBe('installing')

    snapshot = reduceOfflineSnapshot(
      snapshot,
      parseOfflineResponse(stateMessage({ grades: { ...stateMessage().grades as Record<string, string>, 3: 'not-installed' } }))!,
    )
    expect(snapshot.grades[3].status).toBe('not-installed')

    const retryState = reduceOfflineSnapshot(createInitialOfflineSnapshot(), parseOfflineResponse(stateMessage())!)
    let removing = reduceOfflineSnapshot(retryState, { kind: 'request', requestType: 'removeGradePack', grade: 2 })
    expect(removing.grades[2].status).toBe('removing')
    removing = reduceOfflineSnapshot(removing, parseOfflineResponse(stateMessage())!)
    expect(removing.grades[2].status).toBe('installed')
  })

  it('records fixed error codes per grade and allows recovery through a new install request', () => {
    let snapshot = createInitialOfflineSnapshot()
    snapshot = reduceOfflineSnapshot(
      snapshot,
      parseOfflineResponse({ schemaVersion: 1, type: 'MATH_ASSIST_OFFLINE_ERROR', code: 'ASSET_FETCH_FAILED', grade: 4 })!,
    )
    expect(snapshot.grades[4].status).toBe('error')
    expect(snapshot.grades[4].errorCode).toBe('ASSET_FETCH_FAILED')

    snapshot = reduceOfflineSnapshot(snapshot, { kind: 'request', requestType: 'installGradePack', grade: 4 })
    expect(snapshot.grades[4].status).toBe('installing')
    expect(snapshot.grades[4].errorCode).toBeNull()

    const gradeless = reduceOfflineSnapshot(
      snapshot,
      parseOfflineResponse({ schemaVersion: 1, type: 'MATH_ASSIST_OFFLINE_ERROR', code: 'METADATA_UNAVAILABLE' })!,
    )
    expect(gradeless.grades[4].status).toBe('installing')
  })

  it('ignores invalid responses instead of corrupting state', () => {
    const snapshot = reduceOfflineSnapshot(createInitialOfflineSnapshot(), parseOfflineResponse(stateMessage())!)
    const bogus = { schemaVersion: 1, type: 'MATH_ASSIST_OFFLINE_PROGRESS', grade: 99, completed: -5, total: 0 }
    expect(parseOfflineResponse(bogus)).toBeNull()
    expect(reduceOfflineSnapshot(snapshot, bogus as unknown as OfflineRequestMessage)).toEqual(snapshot)
  })

  it('marks update readiness from MATH_ASSIST_UPDATE_READY', () => {
    const snapshot = reduceOfflineSnapshot(
      createInitialOfflineSnapshot(),
      parseOfflineResponse({ schemaVersion: 1, type: 'MATH_ASSIST_UPDATE_READY' })!,
    )
    expect(snapshot.updateReady).toBe(true)
  })
})

describe('createBrowserOfflinePackClient', () => {
  it('returns null safely when window or serviceWorker is unavailable', () => {
    expect(createBrowserOfflinePackClient()).toBeNull()
  })
})

describe('response payload purity', () => {
  it('never carries urls, profile identifiers, or answers in known payload shapes', () => {
    const messages: OfflineResponseMessage[] = [
      parseOfflineResponse({ schemaVersion: 1, type: 'MATH_ASSIST_OFFLINE_ERROR', code: 'VERIFY_FAILED', grade: 2 })!,
      parseOfflineResponse({ schemaVersion: 1, type: 'MATH_ASSIST_UPDATE_READY' })!,
    ]
    messages.forEach(message => {
      const serialized = JSON.stringify(message)
      expect(serialized).not.toContain('/math_assist')
      expect(serialized).not.toContain('profile')
      expect(serialized).not.toContain('answer')
    })
  })
})
