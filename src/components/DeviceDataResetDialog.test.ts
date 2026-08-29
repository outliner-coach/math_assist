// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import DeviceDataResetDialog, {
  DEVICE_RESET_CONFIRM_PHRASE,
  isDeviceResetPhraseConfirmed,
  type DeviceDataResetOutcome,
} from './DeviceDataResetDialog'

const RESET_OK: DeviceDataResetOutcome = {
  status: 'reset',
  errorCode: null,
  removedMathAssistKeyCount: 3,
  indexedDbAndCacheStep: 'deferred-to-offline-integration',
  reloadRecommended: true,
}

function renderResetDialog(overrides: Record<string, unknown> = {}): string {
  return renderToStaticMarkup(createElement(DeviceDataResetDialog, {
    open: true,
    typedPhrase: '',
    onClose: () => {},
    onReset: async () => RESET_OK,
    ...overrides,
  }))
}

describe('isDeviceResetPhraseConfirmed', () => {
  it('requires the exact consequence phrase after trimming', () => {
    expect(isDeviceResetPhraseConfirmed(`  ${DEVICE_RESET_CONFIRM_PHRASE}  `)).toBe(true)
    expect(isDeviceResetPhraseConfirmed('모두 삭제')).toBe(false)
    expect(isDeviceResetPhraseConfirmed('')).toBe(false)
  })
})

describe('DeviceDataResetDialog markup', () => {
  it('renders an accessible modal with the consequence list and live region', () => {
    const markup = renderResetDialog()
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('aria-labelledby="device-data-reset-title"')
    expect(markup).toContain('모든 학습자 프로필과 학습 기록')
    expect(markup).toContain('풀이장')
    expect(markup).toContain('내보내기 파일과 오프라인 학습 자료 저장소는 지워지지 않아요')
    expect(markup).toContain('data-reset-scope="browser-storage"')
    expect(markup).toContain('role="status"')
    expect(markup).toContain('aria-live="polite"')
  })

  it('renders as a separate titled risk step without nesting another modal', () => {
    const markup = renderResetDialog({ embedded: true, onBack: () => {} })
    expect(markup).toContain('aria-labelledby="device-data-reset-title"')
    expect(markup).not.toContain('role="dialog"')
    expect(markup).not.toContain('aria-modal="true"')
    expect(markup).not.toContain('tabindex="-1"')
    expect(markup).toContain('프로필 관리로 돌아가기')
  })

  it('leaves embedded Tab and Escape handling to the parent dialog', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const onBack = vi.fn()
    const onClose = vi.fn()
    await act(async () => {
      root.render(createElement(DeviceDataResetDialog, {
        open: true,
        embedded: true,
        typedPhrase: '',
        onBack,
        onClose,
        onReset: async () => RESET_OK,
      }))
    })

    const input = container.querySelector('input')
    if (!input) throw new Error('Missing reset confirmation input')
    input.focus()
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    input.dispatchEvent(tabEvent)
    expect(tabEvent.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(input)

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    })
    expect(onBack).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()

    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  it('keeps the destructive confirm disabled until the phrase is retyped', () => {
    const untouched = renderResetDialog()
    expect(untouched).toContain('disabled')

    const armed = renderResetDialog({ typedPhrase: DEVICE_RESET_CONFIRM_PHRASE })
    expect(armed).not.toContain('disabled')
    expect(armed).toContain('모든 데이터 삭제')
  })

  it('shows the result states and reload recommendation', () => {
    const done = renderResetDialog({
      typedPhrase: DEVICE_RESET_CONFIRM_PHRASE,
      result: { status: 'reset', errorCode: null, removedMathAssistKeyCount: 8, indexedDbAndCacheStep: 'deferred-to-offline-integration', reloadRecommended: true } satisfies DeviceDataResetOutcome,
    })
    expect(done).toContain('삭제를 마쳤어요')
    expect(done).toContain('새로고침')

    const failed = renderResetDialog({
      typedPhrase: DEVICE_RESET_CONFIRM_PHRASE,
      result: { status: 'failed', errorCode: 'WRITE_FAILED', removedMathAssistKeyCount: 2, indexedDbAndCacheStep: 'deferred-to-offline-integration', reloadRecommended: true } satisfies DeviceDataResetOutcome,
    })
    expect(failed).toContain('삭제하지 못했어요')
  })

  it('preserves the deferred offline-integration outcome without claiming broader deletion', () => {
    expect(RESET_OK.indexedDbAndCacheStep).toBe('deferred-to-offline-integration')
    const done = renderResetDialog({
      result: RESET_OK,
      typedPhrase: DEVICE_RESET_CONFIRM_PHRASE,
    })
    expect(done).not.toContain('IndexedDB')
    expect(done).not.toContain('Cache API')
    expect(done).not.toContain('서비스 워커')
  })

  it('uses native buttons and inputs with 48px touch targets', () => {
    const markup = renderResetDialog({ embedded: true, onBack: () => {} })
    const controls = markup.match(/<(?:button|input)\b[^>]*>/g) ?? []
    expect(controls.length).toBeGreaterThan(0)
    for (const control of controls) {
      expect(control).toContain('min-width:48px')
      expect(control).toContain('min-height:48px')
    }
  })

  it('stays unwired from app shell modules', () => {
    const source = readFileSync(path.resolve(__dirname, './DeviceDataResetDialog.tsx'), 'utf8')
    expect(source).not.toContain("from '../app")
    expect(source).not.toMatch(/import\s+[^;]*app\//)
    expect(source).not.toContain('localStorage.removeItem')
  })
})
