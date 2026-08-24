/**
 * offline-pack.ts — 오프라인 학년 팩 상태 머신 (T5, spec §7)
 *
 * Wraps the fixed service worker message protocol with a pure reducer and an
 * SSR-safe browser client factory. The service worker is authoritative for
 * persistent statuses (not-installed | installed | update-available); this
 * module overlays transient statuses (installing | removing | error).
 *
 * Overlay resolution rules (documented contract):
 * - MATH_ASSIST_INSTALL_GRADE_PACK / REMOVE_GRADE_PACK requests set a local
 *   installing/removing overlay immediately (optimistic, disabled UI).
 * - MATH_ASSIST_OFFLINE_PROGRESS updates progress numbers while installing.
 * - A STATE response ends a removal overlay and ends an installing overlay
 *   when the underlying pack is gone (nothing happened) or when progress has
 *   reached its total and the pack is present (this client's install finished,
 *   including the completion STATE posted by the worker). An installing overlay
 *   survives intermediate STATE broadcasts (e.g. another tab finishing first)
 *   so this tab's in-flight work is not silently swallowed.
 * - MATH_ASSIST_OFFLINE_ERROR with a grade marks that grade `error` with the
 *   fixed code; a new install request or a resolving STATE clears it.
 * - Invalid or foreign messages are ignored without corrupting state.
 */

export const OFFLINE_MESSAGE_SCHEMA_VERSION = 1

export const OFFLINE_REQUEST_MESSAGE_TYPES = {
  installGradePack: 'MATH_ASSIST_INSTALL_GRADE_PACK',
  removeGradePack: 'MATH_ASSIST_REMOVE_GRADE_PACK',
  queryOfflineState: 'MATH_ASSIST_QUERY_OFFLINE_STATE',
  activateUpdate: 'MATH_ASSIST_ACTIVATE_UPDATE',
} as const

export const OFFLINE_RESPONSE_MESSAGE_TYPES = {
  progress: 'MATH_ASSIST_OFFLINE_PROGRESS',
  state: 'MATH_ASSIST_OFFLINE_STATE',
  error: 'MATH_ASSIST_OFFLINE_ERROR',
  updateReady: 'MATH_ASSIST_UPDATE_READY',
} as const

export const OFFLINE_ERROR_CODES = [
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
] as const

export type OfflineErrorCode = (typeof OFFLINE_ERROR_CODES)[number]

export type OfflinePackStatus =
  | 'not-installed'
  | 'installing'
  | 'installed'
  | 'update-available'
  | 'removing'
  | 'error'

export const OFFLINE_PACK_STATUSES: readonly OfflinePackStatus[] = [
  'not-installed',
  'installing',
  'installed',
  'update-available',
  'removing',
  'error',
]

const AUTHORITATIVE_STATUSES: readonly string[] = ['not-installed', 'installed', 'update-available']

export type OfflineAuthoritativeStatus = Exclude<
  OfflinePackStatus,
  'installing' | 'removing' | 'error'
>

export type OfflineGradeValue = 1 | 2 | 3 | 4 | 5 | 6
export const OFFLINE_GRADES: readonly OfflineGradeValue[] = [1, 2, 3, 4, 5, 6]

export function isOfflineGrade(value: unknown): value is OfflineGradeValue {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    (OFFLINE_GRADES as readonly number[]).includes(value)
  )
}

export interface OfflineProgressPayload {
  grade: OfflineGradeValue
  completed: number
  total: number
}

export interface OfflineStatePayload {
  appRelease: string | null
  contentRelease: string | null
  updateReady: boolean
  grades: Record<OfflineGradeValue, OfflineAuthoritativeStatus>
}

export interface OfflineErrorResponse {
  code: OfflineErrorCode
  grade: OfflineGradeValue | null
}

export type OfflineResponseMessage =
  | {
      schemaVersion: 1
      type: typeof OFFLINE_RESPONSE_MESSAGE_TYPES.progress
      payload: OfflineProgressPayload
    }
  | {
      schemaVersion: 1
      type: typeof OFFLINE_RESPONSE_MESSAGE_TYPES.state
      payload: OfflineStatePayload
    }
  | {
      schemaVersion: 1
      type: typeof OFFLINE_RESPONSE_MESSAGE_TYPES.error
      payload: OfflineErrorResponse
    }
  | {
      schemaVersion: 1
      type: typeof OFFLINE_RESPONSE_MESSAGE_TYPES.updateReady
      payload: null
    }

export type OfflineRequestType = keyof typeof OFFLINE_REQUEST_MESSAGE_TYPES

export interface OfflineRequestMessage {
  kind: 'request'
  requestType: OfflineRequestType
  grade?: OfflineGradeValue
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Narrows an unknown postMessage payload into a validated spec §7 response
 * message, or null when it does not satisfy the contract.
 */
export function parseOfflineResponse(raw: unknown): OfflineResponseMessage | null {
  if (!isPlainObject(raw) || raw.schemaVersion !== OFFLINE_MESSAGE_SCHEMA_VERSION) {
    return null
  }

  switch (raw.type) {
    case OFFLINE_RESPONSE_MESSAGE_TYPES.progress: {
      if (
        !isOfflineGrade(raw.grade) ||
        typeof raw.completed !== 'number' ||
        typeof raw.total !== 'number' ||
        !Number.isSafeInteger(raw.completed) ||
        !Number.isSafeInteger(raw.total) ||
        raw.completed < 0 ||
        raw.total <= 0 ||
        raw.completed > raw.total
      ) {
        return null
      }
      return {
        schemaVersion: 1,
        type: OFFLINE_RESPONSE_MESSAGE_TYPES.progress,
        payload: { grade: raw.grade, completed: raw.completed, total: raw.total },
      }
    }
    case OFFLINE_RESPONSE_MESSAGE_TYPES.state: {
      if (!isPlainObject(raw.grades)) {
        return null
      }
      const grades = {} as OfflineStatePayload['grades']
      for (const grade of OFFLINE_GRADES) {
        const status = raw.grades[String(grade)]
        if (typeof status !== 'string' || !AUTHORITATIVE_STATUSES.includes(status)) {
          return null
        }
        grades[grade] = status as OfflineAuthoritativeStatus
      }
      if (
        (raw.appRelease !== null && typeof raw.appRelease !== 'string') ||
        (raw.contentRelease !== null && typeof raw.contentRelease !== 'string') ||
        typeof raw.updateReady !== 'boolean'
      ) {
        return null
      }
      return {
        schemaVersion: 1,
        type: OFFLINE_RESPONSE_MESSAGE_TYPES.state,
        payload: {
          appRelease: raw.appRelease as string | null,
          contentRelease: raw.contentRelease as string | null,
          updateReady: raw.updateReady,
          grades,
        },
      }
    }
    case OFFLINE_RESPONSE_MESSAGE_TYPES.error: {
      if (typeof raw.code !== 'string' || !(OFFLINE_ERROR_CODES as readonly string[]).includes(raw.code)) {
        return null
      }
      if (raw.grade !== undefined && raw.grade !== null && !isOfflineGrade(raw.grade)) {
        return null
      }
      return {
        schemaVersion: 1,
        type: OFFLINE_RESPONSE_MESSAGE_TYPES.error,
        payload: {
          code: raw.code as OfflineErrorCode,
          grade: isOfflineGrade(raw.grade) ? raw.grade : null,
        },
      }
    }
    case OFFLINE_RESPONSE_MESSAGE_TYPES.updateReady:
      return { schemaVersion: 1, type: OFFLINE_RESPONSE_MESSAGE_TYPES.updateReady, payload: null }
    default:
      return null
  }
}

export interface OfflineGradeSnapshot {
  status: OfflinePackStatus
  completed: number | null
  total: number | null
  errorCode: OfflineErrorCode | null
}

export interface OfflineSnapshot {
  ready: boolean
  updateReady: boolean
  appRelease: string | null
  contentRelease: string | null
  grades: Record<OfflineGradeValue, OfflineGradeSnapshot>
}

type TransientStatus = 'installing' | 'removing'

interface InternalState {
  ready: boolean
  updateReady: boolean
  appRelease: string | null
  contentRelease: string | null
  base: Record<OfflineGradeValue, OfflineAuthoritativeStatus>
  errorCodes: Partial<Record<OfflineGradeValue, OfflineErrorCode>>
  progress: Partial<Record<OfflineGradeValue, { completed: number; total: number }>>
  transient: Partial<Record<OfflineGradeValue, TransientStatus>>
}

export function createInitialOfflineSnapshot(): OfflineSnapshot {
  const grades = {} as OfflineSnapshot['grades']
  for (const grade of OFFLINE_GRADES) {
    grades[grade] = { status: 'not-installed', completed: null, total: null, errorCode: null }
  }
  return {
    ready: false,
    updateReady: false,
    appRelease: null,
    contentRelease: null,
    grades,
  }
}

function initialInternal(): InternalState {
  return {
    ready: false,
    updateReady: false,
    appRelease: null,
    contentRelease: null,
    base: { 1: 'not-installed', 2: 'not-installed', 3: 'not-installed', 4: 'not-installed', 5: 'not-installed', 6: 'not-installed' },
    errorCodes: {},
    progress: {},
    transient: {},
  }
}

function deriveSnapshot(internal: InternalState): OfflineSnapshot {
  const grades = {} as OfflineSnapshot['grades']
  for (const grade of OFFLINE_GRADES) {
    const overlay = internal.transient[grade]
    const errorCode = internal.errorCodes[grade] ?? null
    const progress = internal.progress[grade] ?? null
    let status: OfflinePackStatus
    if (overlay === 'installing' || overlay === 'removing') {
      status = overlay
    } else if (errorCode !== null) {
      status = 'error'
    } else {
      status = internal.base[grade]
    }
    grades[grade] = {
      status,
      completed: status === 'installing' ? progress?.completed ?? null : null,
      total: status === 'installing' ? progress?.total ?? null : null,
      errorCode: status === 'error' ? errorCode : null,
    }
  }
  return {
    ready: internal.ready,
    updateReady: internal.updateReady,
    appRelease: internal.appRelease,
    contentRelease: internal.contentRelease,
    grades,
  }
}

/**
 * Applies one protocol message to the snapshot. Requests drive local transient
 * overlays; validated responses drive authoritative state. Unknown messages
 * are ignored and the same snapshot reference is returned.
 */
export function reduceOfflineSnapshot(
  current: OfflineSnapshot,
  message: OfflineResponseMessage | OfflineRequestMessage,
): OfflineSnapshot {
  if ('kind' in message && message.kind === 'request') {
    return reduceRequest(current, message as OfflineRequestMessage)
  }
  const candidate = message as unknown as Record<string, unknown>
  const responseType = candidate.type
  if (
    candidate.schemaVersion !== OFFLINE_MESSAGE_SCHEMA_VERSION ||
    typeof responseType !== 'string' ||
    !(Object.values(OFFLINE_RESPONSE_MESSAGE_TYPES) as string[]).includes(responseType)
  ) {
    return current
  }
  return reduceResponse(current, message as OfflineResponseMessage)
}

function reduceRequest(current: OfflineSnapshot, request: OfflineRequestMessage): OfflineSnapshot {
  if (!isOfflineGrade(request.grade)) {
    return current
  }
  if (request.requestType !== 'installGradePack' && request.requestType !== 'removeGradePack') {
    return current
  }
  const internal = cloneInternal(toInternal(current))
  if (request.requestType === 'installGradePack') {
    internal.transient[request.grade] = 'installing'
    delete internal.progress[request.grade]
    delete internal.errorCodes[request.grade]
  } else {
    internal.transient[request.grade] = 'removing'
  }
  return deriveSnapshot(internal)
}

function reduceResponse(current: OfflineSnapshot, message: OfflineResponseMessage): OfflineSnapshot {
  if (message.type !== OFFLINE_RESPONSE_MESSAGE_TYPES.updateReady && !isPlainObject(message.payload)) {
    return current
  }
  const internal = cloneInternal(toInternal(current))

  switch (message.type) {
    case OFFLINE_RESPONSE_MESSAGE_TYPES.state: {
      const payload = message.payload
      internal.ready = true
      internal.updateReady = payload.updateReady
      internal.appRelease = payload.appRelease
      internal.contentRelease = payload.contentRelease
      for (const grade of OFFLINE_GRADES) {
        const authority = payload.grades[grade]
        internal.base[grade] = authority
        const overlay = internal.transient[grade]
        if (overlay === 'removing') {
          delete internal.transient[grade]
        } else if (overlay === 'installing') {
          const progress = internal.progress[grade]
          const finishedThisInstall = progress !== undefined && progress.completed >= progress.total
          if (authority === 'not-installed' || finishedThisInstall) {
            delete internal.transient[grade]
            delete internal.progress[grade]
          }
        } else {
          delete internal.progress[grade]
        }
        delete internal.errorCodes[grade]
      }
      break
    }
    case OFFLINE_RESPONSE_MESSAGE_TYPES.progress: {
      const { grade, completed, total } = message.payload
      if (internal.transient[grade] !== 'installing') {
        return current
      }
      internal.progress[grade] = { completed, total }
      break
    }
    case OFFLINE_RESPONSE_MESSAGE_TYPES.error: {
      const { grade, code } = message.payload
      if (grade === null) {
        return current
      }
      delete internal.transient[grade]
      delete internal.progress[grade]
      internal.errorCodes[grade] = code
      break
    }
    case OFFLINE_RESPONSE_MESSAGE_TYPES.updateReady: {
      internal.updateReady = true
      break
    }
    default:
      return current
  }

  return deriveSnapshot(internal)
}

function toInternal(snapshot: OfflineSnapshot): InternalState {
  const internal = initialInternal()
  internal.ready = snapshot.ready
  internal.updateReady = snapshot.updateReady
  internal.appRelease = snapshot.appRelease
  internal.contentRelease = snapshot.contentRelease
  for (const grade of OFFLINE_GRADES) {
    const snapshotGrade = snapshot.grades[grade]
    if (
      snapshotGrade.status === 'installed' ||
      snapshotGrade.status === 'update-available' ||
      snapshotGrade.status === 'not-installed'
    ) {
      internal.base[grade] = snapshotGrade.status
    } else if (snapshotGrade.status === 'error') {
      // An externally constructed snapshot cannot recover which fixed code
      // applied; treat it as not-installed rather than guessing a code.
      internal.base[grade] = 'not-installed'
    } else if (snapshotGrade.status === 'installing' || snapshotGrade.status === 'removing') {
      internal.transient[grade] = snapshotGrade.status
    }
  }
  return internal
}

function cloneInternal(internal: InternalState): InternalState {
  return {
    ...internal,
    base: { ...internal.base },
    errorCodes: { ...internal.errorCodes },
    progress: { ...internal.progress },
    transient: { ...internal.transient },
  }
}

export interface OfflineRequestSender {
  postMessage(message: Record<string, unknown>): void
}

export interface OfflinePackClientLike {
  subscribe(listener: (snapshot: OfflineSnapshot) => void): () => void
}

export function sendOfflineRequest(worker: OfflineRequestSender, request: OfflineRequestMessage): void {
  const body: Record<string, unknown> = {
    schemaVersion: OFFLINE_MESSAGE_SCHEMA_VERSION,
    type: OFFLINE_REQUEST_MESSAGE_TYPES[request.requestType],
  }
  if (request.grade !== undefined) {
    body.grade = request.grade
  }
  worker.postMessage(body)
}

export interface OfflinePackClient extends OfflinePackClientLike {
  getSnapshot(): OfflineSnapshot
  queryState(): Promise<void>
  installGradePack(grade: OfflineGradeValue): Promise<void>
  removeGradePack(grade: OfflineGradeValue): Promise<void>
  activateUpdate(): Promise<void>
}

interface WorkerContainer {
  navigator?: {
    serviceWorker?: {
      controller?: OfflineRequestSender | null
      addEventListener?: (type: string, listener: (event: MessageEvent) => void) => void
      removeEventListener?: (type: string, listener: (event: MessageEvent) => void) => void
    }
  }
}

/**
 * Creates a browser client bound to the active service worker controller.
 * Returns null during SSR or when service workers are unavailable — callers
 * must treat null as "offline controls are not offered".
 */
export function createBrowserOfflinePackClient(
  target: WorkerContainer = {},
): (OfflineRequestSender & OfflinePackClient) | null {
  if (typeof window === 'undefined') {
    return null
  }
  const container = target.navigator ?? (typeof navigator !== 'undefined' ? navigator : undefined)
  const registration = container?.serviceWorker
  const worker = registration?.controller ?? null
  if (!worker || typeof registration?.addEventListener !== 'function') {
    return null
  }

  let latest = createInitialOfflineSnapshot()
  const listeners = new Set<(snapshot: OfflineSnapshot) => void>()

  function emit() {
    listeners.forEach(listener => listener(latest))
  }

  function ingest(raw: unknown) {
    const parsed = parseOfflineResponse(raw)
    if (!parsed) {
      return
    }
    latest = reduceOfflineSnapshot(latest, parsed)
    emit()
  }

  registration.addEventListener('message', (event: MessageEvent) => {
    ingest((event as unknown as { data?: unknown }).data)
  })

  return {
    postMessage(message: Record<string, unknown>) {
      worker.postMessage(message)
    },
    subscribe(listener) {
      listeners.add(listener)
      listener(latest)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot() {
      return latest
    },
    queryState: () =>
      Promise.resolve(sendOfflineRequest(worker, { kind: 'request', requestType: 'queryOfflineState' })),
    installGradePack: grade =>
      Promise.resolve(sendOfflineRequest(worker, { kind: 'request', requestType: 'installGradePack', grade })),
    removeGradePack: grade =>
      Promise.resolve(sendOfflineRequest(worker, { kind: 'request', requestType: 'removeGradePack', grade })),
    activateUpdate: () =>
      Promise.resolve(sendOfflineRequest(worker, { kind: 'request', requestType: 'activateUpdate' })),
  }
}
