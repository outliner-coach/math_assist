import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

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
    expect(markup).toContain('내보내기 파일은 지워지지 않아요')
    expect(markup).toContain('role="status"')
    expect(markup).toContain('aria-live="polite"')
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

  it('uses native buttons and inputs with 48px touch targets', () => {
    const markup = renderResetDialog()
    expect(markup).toContain('type="button"')
    expect(markup).toContain('min-width:48px')
    expect(markup).toContain('min-height:48px')
  })

  it('stays unwired from app shell modules', () => {
    const source = readFileSync(path.resolve(__dirname, './DeviceDataResetDialog.tsx'), 'utf8')
    expect(source).not.toContain("from '../app")
    expect(source).not.toMatch(/import\s+[^;]*app\//)
    expect(source).not.toContain('localStorage.removeItem')
  })
})
