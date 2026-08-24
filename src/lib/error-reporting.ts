export const TECHNICAL_ERROR_MESSAGE = 'MathAssistTechnicalError'

import type { Event as SentryEvent } from '@sentry/browser'

export const ROUTE_TEMPLATES = [
  'landing',
  'home',
  'grade',
  'mission',
  'concept',
  'practice',
  'result',
  'settings',
  'privacy',
  'support',
  'offline',
  'review',
  'unknown',
] as const

export type RouteTemplate = (typeof ROUTE_TEMPLATES)[number]

export const ERROR_KINDS = [
  'render',
  'navigation',
  'storage-read',
  'storage-write',
  'offline-cache',
  'import',
  'unknown',
] as const

export type ErrorKind = (typeof ERROR_KINDS)[number]

export interface TechnicalErrorInput {
  routeTemplate?: unknown
  errorKind?: unknown
}

export interface EventIdentifiers {
  eventId: string
  timestamp: number
}

export interface TechnicalErrorEvent {
  event_id: string
  timestamp: number
  platform: 'javascript'
  message: string
  tags: {
    app_release: string
    route_template: RouteTemplate
    error_kind: ErrorKind
  }
}

export interface ErrorReportingTransportSendResponse {
  statusCode?: number
}

export interface ErrorReportingTransport {
  send(request: unknown): PromiseLike<ErrorReportingTransportSendResponse>
  flush(timeout?: number): PromiseLike<boolean>
}

export type ErrorReportingTransportFactory = () => ErrorReportingTransport

export interface ErrorReportingInitOptions {
  dsn?: string | null
  release?: string
  transport?: ErrorReportingTransportFactory
}

interface BuiltInitOptions {
  dsn: string
  release?: string
  sendDefaultPii: false
  attachStacktrace: false
  autoSessionTracking: false
  tracesSampleRate: undefined
  replaysSessionSampleRate: undefined
  replaysOnErrorSampleRate: undefined
  integrations: undefined
}

const APP_RELEASE_PATTERN = /^[A-Za-z0-9._@:+-]{1,64}$/

const ALLOWED_TOP_LEVEL_KEYS = new Set([
  'event_id',
  'timestamp',
  'platform',
  'sdk',
  'message',
  'tags',
])

const ALLOWED_TAG_KEYS = new Set(['app_release', 'route_template', 'error_kind'])

const FORBIDDEN_KEY_PATTERN =
  /^(breadcrumbs|breadcrumb|request|query_string|query|user|extra|contexts|exception|stacktrace|stack_trace|modules|fingerprints|sdkProcessingMetadata)$/i

const FORBIDDEN_VALUE_PATTERNS: RegExp[] = [
  /(^|\n)\s{4,}at\s+.+:\d+:\d+/,
  /\bbreadcrumbs?\b/i,
  /\bstacktrace\b|\bstack_trace\b/i,
  /sdkProcessingMetadata/,
  /\brequest\b/i,
  /\buser\b/i,
  /\b(?:profile|learner|device)[-_:]?\s*(?:id)?[-_:]?\s*\d+/i,
  /(?:profile|learner|device)[-_]id/i,
  /\banswer\b|\bisCorrect\b/i,
  /(정답|오답|답안)/,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  /[?#][^\s]*=/,
]

export function normalizeRouteTemplate(raw: unknown): RouteTemplate {
  if (typeof raw !== 'string') return 'unknown'
  const cleaned = raw.split(/[?#]/)[0].trim().toLowerCase()
  if (cleaned === '') return 'unknown'
  return (ROUTE_TEMPLATES as readonly string[]).includes(cleaned)
    ? (cleaned as RouteTemplate)
    : 'unknown'
}

export function routeTemplateFromPathname(pathname: string | null | undefined): RouteTemplate {
  if (typeof pathname !== 'string') return 'unknown'
  const segments = pathname.split(/[?#]/)[0].split('/').filter(Boolean)
  if (segments[0] === 'math_assist') segments.shift()
  if (segments.length === 0) return 'landing'
  return normalizeRouteTemplate(segments[0])
}

export function normalizeErrorKind(raw: unknown): ErrorKind {
  if (typeof raw !== 'string') return 'unknown'
  const cleaned = raw.trim().toLowerCase()
  return (ERROR_KINDS as readonly string[]).includes(cleaned)
    ? (cleaned as ErrorKind)
    : 'unknown'
}

export function buildTechnicalErrorEvent(
  input: TechnicalErrorInput,
  identifiers: EventIdentifiers,
  appRelease: string,
): TechnicalErrorEvent {
  return {
    event_id: identifiers.eventId,
    timestamp: identifiers.timestamp,
    platform: 'javascript',
    message: TECHNICAL_ERROR_MESSAGE,
    tags: {
      app_release: appRelease,
      route_template: normalizeRouteTemplate(input.routeTemplate),
      error_kind: normalizeErrorKind(input.errorKind),
    },
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function collectForbiddenStrings(value: unknown, found: string[]): void {
  if (typeof value === 'string') {
    found.push(value)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectForbiddenStrings(item, found)
    return
  }
  if (isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      found.push(key)
      collectForbiddenStrings(item, found)
    }
  }
}

function containsForbiddenContent(value: unknown): boolean {
  const strings: string[] = []
  collectForbiddenStrings(value, strings)
  for (const text of strings) {
    for (const pattern of FORBIDDEN_VALUE_PATTERNS) {
      if (pattern.test(text)) return true
    }
  }
  return false
}

export function isOutboundEventAllowed(event: unknown): boolean {
  if (!isPlainObject(event)) return false
  for (const key of Object.keys(event)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) return false
  }
  if (event.message !== TECHNICAL_ERROR_MESSAGE) return false
  if (typeof event.event_id !== 'string' || event.event_id === '') return false
  if (typeof event.timestamp !== 'number' || Number.isNaN(event.timestamp)) return false
  if (event.platform !== 'javascript') return false
  if (!isPlainObject(event.tags)) return false
  const tagKeys = Object.keys(event.tags)
  if (tagKeys.length !== ALLOWED_TAG_KEYS.size) return false
  for (const key of tagKeys) {
    if (!ALLOWED_TAG_KEYS.has(key)) return false
    if (typeof event.tags[key] !== 'string') return false
  }
  if (FORBIDDEN_KEY_PATTERN.test(Object.keys(event).join('|'))) return false
  if (containsForbiddenContent(event)) return false
  const tags = event.tags as TechnicalErrorEvent['tags']
  if (!(ROUTE_TEMPLATES as readonly string[]).includes(tags.route_template)) return false
  if (!(ERROR_KINDS as readonly string[]).includes(tags.error_kind)) return false
  if (!APP_RELEASE_PATTERN.test(tags.app_release)) return false
  return true
}

export function buildErrorReportingInitOptions(options: {
  dsn: string
  release?: string
}): BuiltInitOptions {
  return {
    dsn: options.dsn,
    release: options.release,
    sendDefaultPii: false,
    attachStacktrace: false,
    autoSessionTracking: false,
    tracesSampleRate: undefined,
    replaysSessionSampleRate: undefined,
    replaysOnErrorSampleRate: undefined,
    integrations: undefined,
  }
}

export interface ErrorReportingController {
  enabled: boolean
  report(input: TechnicalErrorInput): Promise<string | null>
}

function createEventId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

let activeController: ErrorReportingController | null = null

const disabledController: ErrorReportingController = {
  enabled: false,
  report: () => Promise.resolve(null),
}

export function isErrorReportingReady(): boolean {
  return activeController?.enabled === true
}

export async function initErrorReporting(
  options: ErrorReportingInitOptions = {},
): Promise<ErrorReportingController> {
  const dsn = typeof options.dsn === 'string' ? options.dsn.trim() : ''
  if (dsn === '') {
    activeController = disabledController
    return activeController
  }
  const release = typeof options.release === 'string' ? options.release : undefined
  const Sentry = await import('@sentry/browser')
  Sentry.init({
    ...buildErrorReportingInitOptions({ dsn, release }),
    ...(options.transport ? { transport: options.transport } : {}),
    beforeSend: (event) => {
      if (event.message !== TECHNICAL_ERROR_MESSAGE) return null
      const rawTags = event.tags ?? {}
      const appReleaseTag = typeof rawTags.app_release === 'string' ? rawTags.app_release : ''
      const routeRaw = typeof rawTags.route_template === 'string' ? rawTags.route_template : ''
      const kindRaw = typeof rawTags.error_kind === 'string' ? rawTags.error_kind : ''
      if (
        appReleaseTag === ''
        || routeRaw === ''
        || kindRaw === ''
        || typeof event.event_id !== 'string'
        || event.event_id === ''
        || typeof event.timestamp !== 'number'
        || Number.isNaN(event.timestamp)
      ) {
        return null
      }
      const core: Omit<SentryEvent & { type: undefined }, 'type'> = {
        event_id: event.event_id,
        timestamp: event.timestamp,
        platform: 'javascript',
        message: TECHNICAL_ERROR_MESSAGE,
        tags: {
          app_release: appReleaseTag,
          route_template: normalizeRouteTemplate(routeRaw),
          error_kind: normalizeErrorKind(kindRaw),
        },
      }
      if (!isOutboundEventAllowed(core)) return null
      return { ...core, type: undefined }
    },
  })
  activeController = {
    enabled: true,
    report: async (input) => {
      const event = buildTechnicalErrorEvent(
        input,
        { eventId: createEventId(), timestamp: Math.floor(Date.now() / 1000) },
        release ?? 'unknown-release',
      )
      if (!isOutboundEventAllowed(event)) return null
      Sentry.captureEvent(event)
      return event.event_id
    },
  }
  return activeController
}

export async function reportTechnicalError(
  input: TechnicalErrorInput,
): Promise<string | null> {
  if (!activeController?.enabled) return null
  return activeController.report(input)
}
