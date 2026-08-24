import { describe, expect, it } from 'vitest'

import {
  ERROR_KINDS,
  ROUTE_TEMPLATES,
  TECHNICAL_ERROR_MESSAGE,
  buildErrorReportingInitOptions,
  buildTechnicalErrorEvent,
  initErrorReporting,
  isErrorReportingReady,
  isOutboundEventAllowed,
  normalizeErrorKind,
  normalizeRouteTemplate,
  routeTemplateFromPathname,
} from './error-reporting'

const APP_RELEASE = 'test-release-1'

function createFakeTransportFactory(sent: unknown[]) {
  return function fakeTransport() {
    return {
      send: (request: unknown) => {
        sent.push(request)
        return Promise.resolve({ statusCode: 200 })
      },
      flush: () => Promise.resolve(true),
    }
  }
}

describe('error reporting enums', () => {
  it('exposes exactly the spec route_template set', () => {
    expect([...ROUTE_TEMPLATES]).toEqual([
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
    ])
  })

  it('exposes exactly the spec error_kind set', () => {
    expect([...ERROR_KINDS]).toEqual([
      'render',
      'navigation',
      'storage-read',
      'storage-write',
      'offline-cache',
      'import',
      'unknown',
    ])
  })
})

describe('normalizeRouteTemplate', () => {
  it('maps known templates case-insensitively', () => {
    expect(normalizeRouteTemplate('grade')).toBe('grade')
    expect(normalizeRouteTemplate(' Practice ')).toBe('practice')
    expect(normalizeRouteTemplate('OFFLINE')).toBe('offline')
  })

  it('strips query strings and identifiers before matching', () => {
    expect(normalizeRouteTemplate('mission?problemId=x&answer=42')).toBe('mission')
    expect(normalizeRouteTemplate('/concept/g5-fraction-add-001')).toBe('unknown')
    expect(normalizeRouteTemplate('grade/5?learnerId=abc')).toBe('unknown')
  })

  it('falls back to unknown for junk input', () => {
    expect(normalizeRouteTemplate('g5-unit-abc123')).toBe('unknown')
    expect(normalizeRouteTemplate('')).toBe('unknown')
    expect(normalizeRouteTemplate(undefined)).toBe('unknown')
    expect(normalizeRouteTemplate(null)).toBe('unknown')
    expect(normalizeRouteTemplate(42)).toBe('unknown')
  })
})

describe('routeTemplateFromPathname', () => {
  it('maps the landing and first segment', () => {
    expect(routeTemplateFromPathname('/')).toBe('landing')
    expect(routeTemplateFromPathname('/math_assist/home/')).toBe('home')
    expect(routeTemplateFromPathname('/grade/5/practice/x')).toBe('grade')
    expect(routeTemplateFromPathname('/privacy/')).toBe('privacy')
    expect(routeTemplateFromPathname('/review/problems/')).toBe('review')
  })

  it('strips query strings and falls back to unknown', () => {
    expect(routeTemplateFromPathname('/practice/set-a?q=%ED%95%9C%EA%B8%80')).toBe('practice')
    expect(routeTemplateFromPathname('/g5-unit-abc/mission-9')).toBe('unknown')
    expect(routeTemplateFromPathname(null)).toBe('unknown')
    expect(routeTemplateFromPathname(undefined)).toBe('unknown')
  })
})

describe('normalizeErrorKind', () => {
  it('maps known kinds case-insensitively', () => {
    expect(normalizeErrorKind('render')).toBe('render')
    expect(normalizeErrorKind('Storage-Read')).toBe('storage-read')
    expect(normalizeErrorKind('OFFLINE-CACHE')).toBe('offline-cache')
    expect(normalizeErrorKind('import')).toBe('import')
  })

  it('falls back to unknown', () => {
    expect(normalizeErrorKind('boom')).toBe('unknown')
    expect(normalizeErrorKind(undefined)).toBe('unknown')
    expect(normalizeErrorKind({ code: 'x' })).toBe('unknown')
  })
})

describe('buildTechnicalErrorEvent', () => {
  it('builds an event with only the allowed fields and fixed message', () => {
    const event = buildTechnicalErrorEvent(
      { routeTemplate: 'practice', errorKind: 'render' },
      { eventId: 'abc-123', timestamp: 1755900000 },
      APP_RELEASE,
    )
    expect(Object.keys(event).sort()).toEqual(
      ['event_id', 'message', 'platform', 'tags', 'timestamp'].sort(),
    )
    expect(event.message).toBe(TECHNICAL_ERROR_MESSAGE)
    expect(TECHNICAL_ERROR_MESSAGE).toBe('MathAssistTechnicalError')
    expect(event.platform).toBe('javascript')
    expect(event.event_id).toBe('abc-123')
    expect(event.timestamp).toBe(1755900000)
    expect(event.tags).toEqual({
      app_release: APP_RELEASE,
      route_template: 'practice',
      error_kind: 'render',
    })
  })

  it('ignores polluted extra input fields instead of forwarding them', () => {
    const event = buildTechnicalErrorEvent(
      {
        routeTemplate: 'home',
        errorKind: 'storage-read',
        message: 'Cannot read properties of undefined',
        stack: 'Error: boom\n    at Object.<anonymous> (app.js:1:1)',
        user: { id: 'profile-777' },
        breadcrumbs: [{ message: 'localStorage read' }],
        answer: 42,
      } as Record<string, unknown>,
      { eventId: 'evt-1', timestamp: 1755900001 },
      APP_RELEASE,
    )
    expect(event.message).toBe(TECHNICAL_ERROR_MESSAGE)
    expect(event.tags).toEqual({
      app_release: APP_RELEASE,
      route_template: 'home',
      error_kind: 'storage-read',
    })
    expect(JSON.stringify(event)).not.toContain('boom')
    expect(JSON.stringify(event)).not.toContain('profile-777')
    expect(JSON.stringify(event)).not.toContain('42')
  })

  it('normalizes out-of-enum classifications to unknown', () => {
    const event = buildTechnicalErrorEvent(
      { routeTemplate: '/grade/9/secret', errorKind: 'mystery' },
      { eventId: 'evt-2', timestamp: 1755900002 },
      APP_RELEASE,
    )
    expect(event.tags).toEqual({
      app_release: APP_RELEASE,
      route_template: 'unknown',
      error_kind: 'unknown',
    })
  })
})

describe('isOutboundEventAllowed', () => {
  const baseEvent = {
    event_id: 'abc',
    timestamp: 1755900000,
    platform: 'javascript',
    message: TECHNICAL_ERROR_MESSAGE,
    tags: { app_release: 'r1', route_template: 'home', error_kind: 'render' },
  }

  it('accepts a clean event and SDK protocol metadata', () => {
    expect(isOutboundEventAllowed(baseEvent)).toBe(true)
    expect(
      isOutboundEventAllowed({
        ...baseEvent,
        sdk: { name: 'sentry.javascript.browser', version: '10.69.0' },
      }),
    ).toBe(true)
  })

  it('rejects events carrying forbidden payloads', () => {
    const forbidden: Array<[string, Record<string, unknown>]> = [
      ['breadcrumbs', { ...baseEvent, breadcrumbs: [{ message: 'x' }] }],
      ['exception stack', { ...baseEvent, exception: { values: [{ value: 'boom' }] } }],
      ['stacktrace string', { ...baseEvent, message: 'Error\n    at fn (a.js:1:1)' }],
      ['request', { ...baseEvent, request: { url: 'https://x.test/?q=1' } }],
      ['user', { ...baseEvent, user: { id: 'u1' } }],
      ['extra key', { ...baseEvent, extra: { note: 'x' } }],
      ['contexts', { ...baseEvent, contexts: { device: { id: 'd1' } } }],
      ['extra tag key', { ...baseEvent, tags: { ...baseEvent.tags, query_string: 'a=1' } }],
      ['wrong message', { ...baseEvent, message: 'TypeError: x is undefined' }],
      ['missing message', { ...baseEvent, message: undefined }],
      ['ip address', { ...baseEvent, tags: { ...baseEvent.tags, app_release: '1 192.168.0.12' } }],
      ['profile id', { ...baseEvent, tags: { ...baseEvent.tags, route_template: 'profile-123' } }],
      ['learner id', { ...baseEvent, tags: { ...baseEvent.tags, error_kind: 'learner-42' } }],
      ['answer leak', { ...baseEvent, tags: { ...baseEvent.tags, app_release: '정답은 42' } }],
      ['query leak', { ...baseEvent, tags: { ...baseEvent.tags, app_release: 'r1?token=abc' } }],
    ]
    for (const [label, event] of forbidden) {
      expect(isOutboundEventAllowed(event), label).toBe(false)
    }
  })

  it('rejects non-object input', () => {
    expect(isOutboundEventAllowed(null)).toBe(false)
    expect(isOutboundEventAllowed('MathAssistTechnicalError')).toBe(false)
    expect(isOutboundEventAllowed(42)).toBe(false)
  })
})

describe('buildErrorReportingInitOptions', () => {
  it('turns off PII, tracing, replay and profiling surfaces', () => {
    const options = buildErrorReportingInitOptions({
      dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
      release: APP_RELEASE,
    })
    expect(options.dsn).toBe('https://examplePublicKey@o0.ingest.sentry.io/0')
    expect(options.release).toBe(APP_RELEASE)
    expect(options.sendDefaultPii).toBe(false)
    expect(options.tracesSampleRate).toBeUndefined()
    expect(options.replaysSessionSampleRate).toBeUndefined()
    expect(options.replaysOnErrorSampleRate).toBeUndefined()
    expect(options.attachStacktrace).toBe(false)
    expect(options.integrations).toBeUndefined()
  })
})

describe('initErrorReporting', () => {
  it('stays in no-send mode without a DSN', async () => {
    const sent: unknown[] = []
    const controller = await initErrorReporting({ release: APP_RELEASE })
    expect(controller.enabled).toBe(false)
    expect(isErrorReportingReady()).toBe(false)
    await expect(controller.report({ routeTemplate: 'home', errorKind: 'render' })).resolves.toBe(
      null,
    )
    expect(sent).toEqual([])
  })

  it('sends only the sanitized fixed-message event through the injected transport', async () => {
    const sent: unknown[] = []
    const controller = await initErrorReporting({
      dsn: 'https://examplePublicKey@o0.ingest.example.invalid/1',
      release: APP_RELEASE,
      transport: createFakeTransportFactory(sent),
    })
    expect(controller.enabled).toBe(true)
    expect(isErrorReportingReady()).toBe(true)

    const eventId = await controller.report({
      routeTemplate: routeTemplateFromPathname('/grade/9/secret?learnerId=abc'),
      errorKind: 'storage-write',
    })
    expect(typeof eventId).toBe('string')
    expect(eventId).not.toContain('secret')

    expect(sent).toHaveLength(1)
    const serialized = JSON.stringify(sent[0])
    expect(serialized).toContain(TECHNICAL_ERROR_MESSAGE)
    expect(serialized).toContain('"route_template":"grade"')
    expect(serialized).toContain('"error_kind":"storage-write"')
    expect(serialized).toContain(`"app_release":"${APP_RELEASE}"`)
    expect(serialized).not.toContain('secret')
    expect(serialized).not.toContain('learnerId')
    expect(serialized).not.toContain('exception')
    expect(serialized).not.toContain('breadcrumbs')
    expect(serialized).not.toContain('stacktrace')
    expect(serialized).not.toContain('sdkProcessingMetadata')
    expect(serialized).not.toContain('environment')
  })

  it('drops native exceptions instead of forwarding them', async () => {
    const sent: unknown[] = []
    await initErrorReporting({
      dsn: 'https://examplePublicKey@o0.ingest.example.invalid/2',
      release: APP_RELEASE,
      transport: createFakeTransportFactory(sent),
    })
    const Sentry = await import('@sentry/browser')
    Sentry.captureException(new Error('real local stack must never leave the device'))
    await Sentry.flush(1000)
    expect(sent).toEqual([])
  })

  it('reports through the module-level helper after init', async () => {
    const sent: unknown[] = []
    await initErrorReporting({
      dsn: 'https://examplePublicKey@o0.ingest.example.invalid/3',
      release: APP_RELEASE,
      transport: createFakeTransportFactory(sent),
    })
    const { reportTechnicalError } = await import('./error-reporting')
    await expect(
      reportTechnicalError({ routeTemplate: 'support', errorKind: 'render' }),
    ).resolves.toEqual(expect.any(String))
    expect(sent).toHaveLength(1)
  })
})
