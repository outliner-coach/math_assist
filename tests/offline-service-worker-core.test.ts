import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

const SW_SOURCE = readFileSync(path.resolve(__dirname, '../public/sw.js'), 'utf8')
const BASE = '/math_assist'
const METADATA_URL = `${BASE}/release-metadata.json`

const APP_A = 'a'.repeat(64)
const CONT_A = 'b'.repeat(64)
const CONT_B = 'c'.repeat(64)

interface FakeResponseInit {
  status?: number
  headers?: Record<string, string>
}

class FakeResponse {
  body: string
  status: number
  ok: boolean
  headers: Record<string, string>
  constructor(body: string, init: FakeResponseInit = {}) {
    this.body = body
    this.status = init.status ?? 200
    this.ok = this.status >= 200 && this.status < 300
    this.headers = init.headers ?? {}
  }
  clone(): FakeResponse {
    return new FakeResponse(this.body, { status: this.status, headers: this.headers })
  }
  async json(): Promise<unknown> {
    return JSON.parse(this.body)
  }
  async text(): Promise<string> {
    return this.body
  }
}

class FakeCache {
  entries = new Map<string, FakeResponse>()
  parent: FakeCacheStorage | undefined
  static key(request: { url: string } | string): string {
    return typeof request === 'string' ? request : request.url
  }
  async match(request: { url: string } | string): Promise<FakeResponse | undefined> {
    const found = this.entries.get(FakeCache.key(request))
    return found ? new FakeResponse(found.body, { status: found.status }) : undefined
  }
  async put(request: { url: string } | string, response: FakeResponse): Promise<void> {
    if (this.parent?.quotaFailUrls.has(FakeCache.key(request))) {
      const error = new Error('quota exceeded')
      ;(error as Error & { name: string }).name = 'QuotaExceededError'
      throw error
    }
    this.entries.set(FakeCache.key(request), response)
  }
}

class FakeCacheStorage {
  stores = new Map<string, FakeCache>()
  quotaFailUrls = new Set<string>()
  async open(name: string): Promise<FakeCache> {
    let store = this.stores.get(name)
    if (!store) {
      store = new FakeCache()
      store.parent = this
      this.stores.set(name, store)
    }
    return store
  }
  async delete(name: string): Promise<boolean> {
    return this.stores.delete(name)
  }
  async keys(): Promise<string[]> {
    return [...this.stores.keys()]
  }
}

interface RecordedPost {
  type: string
  payload: Record<string, unknown>
}

interface Pending {
  promises: Promise<unknown>[]
}

type FetchResponder = (url: string, init?: { cache?: string }) => FakeResponse | Promise<FakeResponse>

interface HarnessOptions {
  metadataContentRelease?: string
  fetchResponder?: FetchResponder
  withRegistration?: boolean
  autoWire?: boolean
}

interface Harness {
  sandbox: Record<string, unknown>
  caches: FakeCacheStorage
  posts: RecordedPost[]
  pending: Pending
  skipWaitingCalls: number
  claimed: number
  clients: Array<{ postMessage: (data: unknown) => void; sent: unknown[] }>
  core: {
    handleInstall: (event: unknown) => void
    handleActivate: (event: unknown) => void
    handleFetch: (event: unknown) => Promise<FakeResponse> | FakeResponse | undefined | void
    handleMessage: (event: unknown) => void
  }
  sendMessage: (data: unknown) => Promise<RecordedPost[]>
  waitForPosts: (count: number) => Promise<RecordedPost[]>
  drainPending: () => Promise<void>
  navigationRequest: (url: string) => Promise<FakeResponse>
  assetRequest: (url: string) => Promise<FakeResponse>
  storageAccessCount: () => number
}

function metadataBody(contentRelease: string): string {
  return JSON.stringify({
    schemaVersion: 1,
    appRelease: APP_A,
    contentRelease,
    storageSchema: 1,
    exportSchema: 1,
    offlineCacheSchema: 1,
  })
}

function packManifestBody(urls: string[]): string {
  return JSON.stringify({
    schemaVersion: 1,
    grade: 2,
    appRelease: APP_A,
    contentRelease: CONT_A,
    urls,
  })
}

function defaultResponder(options: HarnessOptions): FetchResponder {
  return url => {
    if (url === METADATA_URL) {
      return new FakeResponse(metadataBody(options.metadataContentRelease ?? CONT_A))
    }
    if (url === `${BASE}/offline-packs/grade-2.json`) {
      return new FakeResponse(
        packManifestBody([`${BASE}/grade/2/`, `${BASE}/data/units.json`, `${BASE}/data/concepts.json`]),
      )
    }
    return new FakeResponse('<html>asset</html>')
  }
}

function createHarness(options: HarnessOptions = {}): Harness {
  const responder = options.fetchResponder ?? defaultResponder(options)
  const caches = new FakeCacheStorage()
  const posts: RecordedPost[] = []
  const pending: Pending = { promises: [] }
  let skipWaitingCalls = 0
  let claimed = 0
  let storageAccesses = 0

  const source = {
    postMessage: (data: unknown) => {
      const payload = data as Record<string, unknown>
      posts.push({ type: String(payload.type), payload })
    },
  }

  const clients = [
    { postMessage: (_data: unknown) => {}, sent: [] as unknown[] },
    { postMessage: (_data: unknown) => {}, sent: [] as unknown[] },
  ]
  clients.forEach(client => {
    client.postMessage = (data: unknown) => {
      client.sent.push(data)
    }
  })

  const sandbox: Record<string, unknown> = {
    console: { warn: () => {}, log: () => {} },
    Response: FakeResponse,
    setTimeout: () => 0,
    clearTimeout: () => {},
    __listeners: {} as Record<string, Array<(event: unknown) => void>>,
  }
  const listeners = sandbox.__listeners as Record<string, Array<(event: unknown) => void>>
  sandbox.addEventListener = (type: string, handler: (event: unknown) => void) => {
    listeners[type] = listeners[type] ?? []
    listeners[type].push(handler)
  }
  Object.defineProperty(sandbox, 'localStorage', {
    configurable: true,
    get() {
      storageAccesses += 1
      throw new Error('service worker must not touch localStorage')
    },
  })

  const fetchFn = async (input: string | { url: string }, init?: { cache?: string }) => {
    const url = typeof input === 'string' ? input : input.url
    return responder(url, init)
  }

  sandbox.self = sandbox
  sandbox.caches = caches
  sandbox.fetch = fetchFn
  sandbox.clients = {
    async matchAll() {
      return clients
    },
    async claim() {
      claimed += 1
    },
  }
  sandbox.registration = options.withRegistration === false ? undefined : {
    get waiting() {
      return null
    },
    skipWaiting: async () => {
      skipWaitingCalls += 1
    },
  }
  if (options.autoWire) {
    sandbox.importScripts = () => {}
  }

  const context = vm.createContext(sandbox)
  vm.runInContext(SW_SOURCE, context, { filename: 'public/sw.js' })

  const factory = sandbox.mathAssistServiceWorker as {
    createCore: (env: Record<string, unknown>) => Harness['core']
    wire: (target: unknown) => void
  }
  const core = factory.createCore({
    self: sandbox,
    caches,
    fetch: fetchFn,
    clients: sandbox.clients,
    registration: sandbox.registration,
  })

  function drainPending(): Promise<void> {
    const all = pending.promises
    pending.promises = []
    return Promise.all(all.map(p => p.catch(() => {}))).then(() => undefined)
  }

  function waitForStable(): Promise<void> {
    return (async () => {
      for (let attempt = 0; attempt < 200; attempt += 1) {
        await drainPending()
        await new Promise(resolve => setImmediate(resolve))
        if (pending.promises.length === 0) {
          await drainPending()
          if (pending.promises.length === 0) return
        }
      }
    })()
  }

  async function waitForPosts(count: number): Promise<RecordedPost[]> {
    for (let attempt = 0; attempt < 200 && posts.length < count; attempt += 1) {
      await drainPending()
      await new Promise(resolve => setImmediate(resolve))
    }
    await waitForStable()
    return posts
  }

  async function sendMessage(data: unknown): Promise<RecordedPost[]> {
    const before = posts.length
    core.handleMessage({
      data,
      source,
      waitUntil: (p: Promise<unknown>) => {
        pending.promises.push(p)
      },
    })
    await waitForPosts(before + 1)
    return posts.slice(before)
  }

  function dispatchFetch(request: { mode?: string; method?: string; url: string }): Promise<FakeResponse> {
    return new Promise((resolve, reject) => {
      const handled = core.handleFetch({
        request: { mode: request.mode ?? 'no-cors', method: request.method ?? 'GET', url: request.url },
      })
      if (!handled) {
        reject(new Error(`fetch handler ignored request: ${request.url}`))
        return
      }
      const guard = setTimeout(() => {
        reject(new Error(`fetch never resolved: ${request.url}`))
      }, 1000)
      Promise.resolve(handled).then(
        response => {
          clearTimeout(guard)
          resolve(response)
        },
        error => {
          clearTimeout(guard)
          reject(error)
        },
      )
    })
  }

  async function navigationRequest(url: string): Promise<FakeResponse> {
    return dispatchFetch({ mode: 'navigate', url })
  }

  async function assetRequest(url: string): Promise<FakeResponse> {
    return dispatchFetch({ url })
  }

  return {
    sandbox,
    caches,
    posts,
    pending,
    get skipWaitingCalls() {
      return skipWaitingCalls
    },
    get claimed() {
      return claimed
    },
    clients,
    core,
    sendMessage,
    waitForPosts,
    drainPending,
    navigationRequest,
    assetRequest,
    storageAccessCount: () => storageAccesses,
  }
}

function gradeName(app: string, content: string, grade: number): string {
  return `math-assist-grade:${app}:${content}:${grade}`
}

async function installGrade2(h: Harness, grade = 2): Promise<RecordedPost[]> {
  const replies = await h.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_INSTALL_GRADE_PACK', grade })
  return replies
}

describe('public/sw.js offline core (logic-level, no browser)', () => {
  let h: Harness

  beforeEach(() => {
    h = createHarness()
  })

  it('precaches the shell into math-assist-shell:<appRelease> on install and never skips waiting automatically', () => {
    h.core.handleInstall({ waitUntil: (p: Promise<unknown>) => h.pending.promises.push(p) })
    return h.drainPending().then(() => {
      const shellName = `math-assist-shell:${APP_A}`
      expect(h.caches.stores.has(shellName)).toBe(true)
      const shell = h.caches.stores.get(shellName)!
      expect(shell.entries.has(`${BASE}/`)).toBe(true)
      expect(shell.entries.has(`${BASE}/home/`)).toBe(true)
      expect(shell.entries.has(`${BASE}/offline/`)).toBe(true)
      expect(h.skipWaitingCalls).toBe(0)
    })
  })

  it('completes shell install even when an optional shell asset is unavailable', () => {
    const failing = createHarness({
      fetchResponder: (url) => {
        if (url === `${BASE}/favicon.ico`) {
          return new FakeResponse('nope', { status: 404 })
        }
        return defaultResponder({})(url)
      },
    })
    failing.core.handleInstall({ waitUntil: (p: Promise<unknown>) => failing.pending.promises.push(p) })
    return failing.drainPending().then(() => {
      expect(failing.caches.stores.has(`math-assist-shell:${APP_A}`)).toBe(true)
      expect(failing.posts.every(post => post.type !== 'MATH_ASSIST_OFFLINE_ERROR')).toBe(true)
    })
  })

  it('installs a grade pack atomically: temp cache, verify, activate, delete temp, progress messages', async () => {
    const replies = await installGrade2(h)
    const finalName = gradeName(APP_A, CONT_A, 2)
    const tmpName = `math-assist-grade-tmp:${APP_A}:${CONT_A}:2`

    expect(h.caches.stores.has(finalName)).toBe(true)
    expect(h.caches.stores.has(tmpName)).toBe(false)

    const finalCache = h.caches.stores.get(finalName)!
    expect(finalCache.entries.has(`${BASE}/grade/2/`)).toBe(true)
    expect(finalCache.entries.has(`${BASE}/data/units.json`)).toBe(true)

    const types = h.posts.map(post => post.type)
    expect(types).toContain('MATH_ASSIST_OFFLINE_PROGRESS')
    expect(types).toContain('MATH_ASSIST_OFFLINE_STATE')

    const progresses = h.posts.filter(post => post.type === 'MATH_ASSIST_OFFLINE_PROGRESS')
    const last = progresses[progresses.length - 1].payload
    expect(last).toMatchObject({ schemaVersion: 1, grade: 2, completed: 3, total: 3 })

    const statePost = h.posts.find(post => post.type === 'MATH_ASSIST_OFFLINE_STATE')
    expect(statePost?.payload.grades).toMatchObject({ 2: 'installed' })
    expect(statePost?.payload.appRelease).toBe(APP_A)
    expect(statePost?.payload.contentRelease).toBe(CONT_A)
    expect(replies.length).toBeGreaterThan(0)
  })

  it('keeps the previous complete pack and deletes temp when a download fails midway', async () => {
    await installGrade2(h)
    const finalName = gradeName(APP_A, CONT_A, 2)
    const tmpName = `math-assist-grade-tmp:${APP_A}:${CONT_A}:2`

    const failing = createHarness({
      fetchResponder: url => {
        if (url === `${BASE}/data/concepts.json`) {
          return new FakeResponse('network gone', { status: 503 })
        }
        if (url === METADATA_URL) {
          return new FakeResponse(metadataBody(CONT_A))
        }
        if (url === `${BASE}/offline-packs/grade-2.json`) {
          return new FakeResponse(packManifestBody([`${BASE}/grade/2/`, `${BASE}/data/units.json`, `${BASE}/data/concepts.json`]))
        }
        return new FakeResponse('asset')
      },
    })
    // Seed previous pack into the failing instance's cache store.
    failing.caches.stores.set(finalName, h.caches.stores.get(finalName)!)

    const replies = await failing.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_INSTALL_GRADE_PACK', grade: 2 })

    const errorPost = replies.find(post => post.type === 'MATH_ASSIST_OFFLINE_ERROR')
    expect(errorPost?.payload).toMatchObject({
      schemaVersion: 1,
      type: 'MATH_ASSIST_OFFLINE_ERROR',
      code: 'ASSET_FETCH_FAILED',
      grade: 2,
    })
    expect(failing.caches.stores.has(tmpName)).toBe(false)
    const kept = failing.caches.stores.get(finalName)!
    expect(kept.entries.size).toBe(3)
    expect(JSON.stringify(replies)).not.toContain(`${BASE}/data/concepts.json`)
  })

  it('maps quota errors to QUOTA_EXCEEDED and preserves existing packs', async () => {
    await installGrade2(h)
    const finalName = gradeName(APP_A, CONT_A, 2)
    const updatedManifest = createHarness({})
    updatedManifest.caches.stores.set(finalName, h.caches.stores.get(finalName)!)
    updatedManifest.caches.quotaFailUrls.add(`${BASE}/data/units.json`)

    const replies = await updatedManifest.sendMessage({
      schemaVersion: 1,
      type: 'MATH_ASSIST_INSTALL_GRADE_PACK',
      grade: 2,
    })

    const errorPost = replies.find(post => post.type === 'MATH_ASSIST_OFFLINE_ERROR')
    expect(errorPost?.payload.code).toBe('QUOTA_EXCEEDED')
    expect(updatedManifest.caches.stores.get(finalName)!.entries.size).toBe(3)
  })

  it('removes only the requested grade pack cache', async () => {
    await installGrade2(h)
    const other = await h.caches.open(gradeName(APP_A, CONT_A, 3))
    await other.put(`${BASE}/grade/3/`, new FakeResponse('g3'))

    const replies = await h.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_REMOVE_GRADE_PACK', grade: 2 })

    expect(h.caches.stores.has(gradeName(APP_A, CONT_A, 2))).toBe(false)
    expect(h.caches.stores.has(gradeName(APP_A, CONT_A, 3))).toBe(true)
    const statePost = replies.find(post => post.type === 'MATH_ASSIST_OFFLINE_STATE')
    expect(statePost?.payload.grades).toMatchObject({ 2: 'not-installed', 3: 'installed' })
  })

  it('reports update-available when installed content release differs from current release', async () => {
    await installGrade2(h)

    const newer = createHarness({ metadataContentRelease: CONT_B })
    newer.caches.stores.set(gradeName(APP_A, CONT_A, 2), h.caches.stores.get(gradeName(APP_A, CONT_A, 2))!)

    const replies = await newer.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_QUERY_OFFLINE_STATE' })
    const statePost = replies.find(post => post.type === 'MATH_ASSIST_OFFLINE_STATE')
    expect(statePost?.payload.contentRelease).toBe(CONT_B)
    expect(statePost?.payload.grades).toMatchObject({ 2: 'update-available' })
  })

  it('rejects invalid grades and unknown messages with fixed codes only', async () => {
    const zero = await h.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_INSTALL_GRADE_PACK', grade: 0 })
    expect(zero[0]?.payload.code).toBe('INVALID_GRADE')

    const seven = await h.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_REMOVE_GRADE_PACK', grade: 7 })
    expect(seven[0]?.payload.code).toBe('INVALID_GRADE')

    const badType = await h.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_SOMETHING_ELSE' })
    expect(badType[0]?.payload.code).toBe('UNKNOWN_MESSAGE')

    const badSchema = await h.sendMessage({ schemaVersion: 2, type: 'MATH_ASSIST_QUERY_OFFLINE_STATE' })
    expect(badSchema[0]?.payload.code).toBe('INVALID_MESSAGE')

    h.posts.forEach(post => {
      const serialized = JSON.stringify(post.payload)
      expect(serialized.startsWith('{')).toBe(true)
      expect(Object.keys(post.payload).every(key => /^[a-zA-Z]+$/.test(key))).toBe(true)
    })
  })

  it('activates an update only through MATH_ASSIST_ACTIVATE_UPDATE and broadcasts MATH_ASSIST_UPDATE_READY once activated', async () => {
    expect(h.skipWaitingCalls).toBe(0)
    await h.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_ACTIVATE_UPDATE' })
    expect(h.skipWaitingCalls).toBe(1)
    expect(h.claimed).toBe(0)

    h.core.handleActivate({ waitUntil: (p: Promise<unknown>) => h.pending.promises.push(p) })
    await h.drainPending()

    expect(h.claimed).toBe(1)
    h.clients.forEach(client => {
      const ready = client.sent.find(entry => (entry as Record<string, unknown>).type === 'MATH_ASSIST_UPDATE_READY')
      expect((ready as Record<string, unknown>)?.schemaVersion).toBe(1)
    })

    const stateReplies = await h.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_QUERY_OFFLINE_STATE' })
    expect(stateReplies.find(post => post.type === 'MATH_ASSIST_OFFLINE_STATE')?.payload.updateReady).toBe(false)
  })

  it('never auto-activates while a new worker waits during normal operations', async () => {
    const watching = createHarness({})
    await installGrade2(watching)
    watching.core.handleActivate({ waitUntil: (p: Promise<unknown>) => watching.pending.promises.push(p) })
    await watching.drainPending()
    await watching.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_QUERY_OFFLINE_STATE' })
    expect(watching.skipWaitingCalls).toBe(0)
  })

  it('serves installed pack assets offline and falls back to /offline/ for unprepared routes', async () => {
    await installGrade2(h)
    h.core.handleInstall({ waitUntil: (p: Promise<unknown>) => h.pending.promises.push(p) })
    await h.drainPending()

    const offlineFetcher = createHarness({
      fetchResponder: () => {
        throw new Error('network unreachable')
      },
      withRegistration: false,
    })
    offlineFetcher.caches.stores.set(gradeName(APP_A, CONT_A, 2), h.caches.stores.get(gradeName(APP_A, CONT_A, 2))!)
    offlineFetcher.caches.stores.set(`math-assist-shell:${APP_A}`, h.caches.stores.get(`math-assist-shell:${APP_A}`)!)
    const shell = offlineFetcher.caches.stores.get(`math-assist-shell:${APP_A}`)!
    shell.entries.set(
      `${BASE}/offline/`,
      new FakeResponse('<html>오프라인 안내</html>', { headers: { 'content-type': 'text/html' } }),
    )

    const servedUnits = await offlineFetcher.assetRequest(`${BASE}/data/units.json`)
    expect(servedUnits.ok).toBe(true)

    const unknownRoute = await offlineFetcher.navigationRequest(`${BASE}/grade/9/whatever/`)
    expect(unknownRoute.body).toContain('오프라인 안내')
    expect(offlineFetcher.storageAccessCount()).toBe(0)
  })

  it('caches visited navigations into math-assist-visited:<appRelease> while online', async () => {
    h.core.handleInstall({ waitUntil: (p: Promise<unknown>) => h.pending.promises.push(p) })
    await h.drainPending()

    const response = await h.navigationRequest(`${BASE}/concept/divisor-001/`)
    expect(response.ok).toBe(true)
    const visited = h.caches.stores.get(`math-assist-visited:${APP_A}`)
    expect(visited?.entries.has(`${BASE}/concept/divisor-001/`)).toBe(true)
  })

  it('does not enumerate or touch localStorage during any operation', async () => {
    await installGrade2(h)
    await h.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_QUERY_OFFLINE_STATE' })
    await h.sendMessage({ schemaVersion: 1, type: 'MATH_ASSIST_REMOVE_GRADE_PACK', grade: 2 })
    h.core.handleInstall({ waitUntil: (p: Promise<unknown>) => h.pending.promises.push(p) })
    await h.drainPending()
    expect(h.storageAccessCount()).toBe(0)
  })

  it('wires standard service worker events when loaded as a classic worker script', () => {
    const wired = createHarness({ autoWire: true })
    const listeners = wired.sandbox.__listeners as Record<string, Array<() => void>>
    expect(Object.keys(listeners).sort()).toEqual(['activate', 'fetch', 'install', 'message'])
  })
})
