import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import OfflinePackManager from './OfflinePackManager'
import {
  createInitialOfflineSnapshot,
  parseOfflineResponse,
  reduceOfflineSnapshot,
  type OfflinePackClient,
  type OfflineSnapshot,
} from '@/lib/offline-pack'

const STATE_INSTALLED = {
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
} as const

function buildSnapshot(steps: Array<Record<string, unknown>>): OfflineSnapshot {
  let snapshot = createInitialOfflineSnapshot()
  steps.forEach(step => {
    if (step.kind === 'request') {
      snapshot = reduceOfflineSnapshot(snapshot, step as never)
      return
    }
    const parsed = parseOfflineResponse(step)
    expect(parsed).not.toBeNull()
    snapshot = reduceOfflineSnapshot(snapshot, parsed!)
  })
  return snapshot
}

function fakeClient(snapshot: OfflineSnapshot): OfflinePackClient {
  return {
    subscribe(listener: (snapshot: OfflineSnapshot) => void) {
      listener(snapshot)
      return () => {}
    },
    getSnapshot: () => snapshot,
    queryState: vi.fn(async () => undefined),
    installGradePack: vi.fn(async (_grade: number) => undefined),
    removeGradePack: vi.fn(async (_grade: number) => undefined),
    activateUpdate: vi.fn(async () => undefined),
  }
}

function render(grades: readonly number[] | undefined, snapshot: OfflineSnapshot): string {
  return renderToStaticMarkup(
    createElement(OfflinePackManager, { grades, client: fakeClient(snapshot) }),
  )
}

describe('OfflinePackManager', () => {
  it('renders an accessible group with a polite live region and per-grade labels', () => {
    const markup = render([1, 2], createInitialOfflineSnapshot())
    expect(markup).toContain('role="group"')
    expect(markup).toContain('오프라인 학년 팩')
    expect(markup).toContain('aria-live="polite"')
    expect(markup).toContain('1학년')
    expect(markup).toContain('2학년')
  })

  it('uses native buttons for keyboard operability with 48px minimum touch targets', () => {
    const markup = render([2], createInitialOfflineSnapshot())
    expect(markup).toContain('<button')
    expect(markup).toContain('type="button"')
    expect(markup).toContain('min-width:48px')
    expect(markup).toContain('min-height:48px')
  })

  it('exposes status text and disables actions while installing or removing', () => {
    const installing = buildSnapshot([{ kind: 'request', requestType: 'installGradePack', grade: 3 }])
    const markupInstalling = render([3], installing)
    expect(markupInstalling).toContain('설치 중')
    expect(markupInstalling).toContain('disabled')

    const installed = buildSnapshot([STATE_INSTALLED as unknown as Record<string, unknown>])
    const markupInstalled = render([2], installed)
    expect(markupInstalled).toContain('설치됨')
    expect(markupInstalled).not.toContain('설치 중')

    const removing = buildSnapshot([
      STATE_INSTALLED as unknown as Record<string, unknown>,
      { kind: 'request', requestType: 'removeGradePack', grade: 2 },
    ])
    const markupRemoving = render([2], removing)
    expect(markupRemoving).toContain('제거 중')
    expect(markupRemoving).toContain('disabled')
  })

  it('marks update-available grades and offers the update action', () => {
    const markup = render([5], buildSnapshot([STATE_INSTALLED as unknown as Record<string, unknown>]))
    expect(markup).toContain('업데이트 있음')
    expect(markup).toContain('업데이트')
  })

  it('shows progress numbers and a human-readable quota error with retry', () => {
    const progress = buildSnapshot([
      { kind: 'request', requestType: 'installGradePack', grade: 5 },
      { schemaVersion: 1, type: 'MATH_ASSIST_OFFLINE_PROGRESS', grade: 5, completed: 4, total: 10 },
    ])
    const markupProgress = render([5], progress)
    expect(markupProgress).toContain('4 / 10')

    const errored = buildSnapshot([
      { kind: 'request', requestType: 'installGradePack', grade: 6 },
      { schemaVersion: 1, type: 'MATH_ASSIST_OFFLINE_ERROR', code: 'QUOTA_EXCEEDED', grade: 6 },
    ])
    const markupError = render([6], errored)
    expect(markupError).toContain('저장 공간 부족')
    expect(markupError).not.toContain('QUOTA_EXCEEDED')
  })

  it('renders deterministically for identical snapshots and defaults to all six grades', () => {
    const snapshot = buildSnapshot([STATE_INSTALLED as unknown as Record<string, unknown>])
    const first = render(undefined, snapshot)
    const second = render(undefined, snapshot)
    expect(first).toBe(second)
    for (let grade = 1; grade <= 6; grade += 1) {
      expect(first).toContain(`${grade}학년`)
    }
    expect(first).not.toContain('7학년')
  })

  it('stays unwired from app shell modules', () => {
    const source = readFileSync(path.resolve(__dirname, './OfflinePackManager.tsx'), 'utf8')
    expect(source).not.toContain("from '../app")
    expect(source).not.toContain('LandingPageClient')
    expect(source).not.toMatch(/import\s+[^;]*app\/(layout|page)/)
  })
})
