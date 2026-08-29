// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import ProfileTransferDialog, {
  describeTransferErrorCode,
  handleDialogTabCycle,
  reduceTransferDialogState,
  type TransferDialogState,
} from './ProfileTransferDialog'

const PREVIEW_MERGE = {
  status: 'merge' as const,
  targetProfileId: 'local_11111111-1111-4111-8111-111111111111',
  completedAdded: 3,
  reviewAdded: 1,
  reviewRemoved: 0,
  receiptsAdded: 2,
  recentActivityChanged: true,
  mascot: null,
  errors: [] as string[],
}

const PREVIEW_INVALID = {
  status: 'invalid' as const,
  targetProfileId: null,
  completedAdded: 0,
  reviewAdded: 0,
  reviewRemoved: 0,
  receiptsAdded: 0,
  recentActivityChanged: false,
  mascot: null,
  errors: ['DIGEST_MISMATCH'] as string[],
}

const EMBEDDED_PROPS = { embedded: true, onBack: () => {} } as const

function renderTransferDialog(stepState: TransferDialogState, overrides: Record<string, unknown> = {}): string {
  return renderToStaticMarkup(createElement(ProfileTransferDialog, {
    open: true,
    profileLabel: '철수',
    state: stepState,
    onClose: () => {},
    ...overrides,
  }))
}

describe('reduceTransferDialogState', () => {
  const initial: TransferDialogState = { step: 'idle' }

  it('walks the import flow: file → previewing → preview', () => {
    let state = reduceTransferDialogState(initial, { type: 'file-selected' })
    expect(state.step).toBe('previewing')
    state = reduceTransferDialogState(state, { type: 'preview-ready', preview: PREVIEW_MERGE })
    expect(state.step).toBe('preview')
  })

  it('keeps invalid files in the preview step with their error codes visible', () => {
    let state = reduceTransferDialogState(initial, { type: 'file-selected' })
    state = reduceTransferDialogState(state, { type: 'preview-ready', preview: PREVIEW_INVALID })
    expect(state.step).toBe('preview')
    if (state.step === 'preview') expect(state.preview.errors).toEqual(['DIGEST_MISMATCH'])
  })

  it('requires a mascot choice before applying and records it', () => {
    const mascotPreview = {
      ...PREVIEW_MERGE,
      status: 'mascot-choice' as const,
      mascot: { local: 'suri' as const, imported: 'moa' as const },
    }
    const chosen = reduceTransferDialogState(
      reduceTransferDialogState(initial, { type: 'preview-ready', preview: mascotPreview }),
      { type: 'mascot-chosen', choice: 'imported' },
    )
    expect(chosen).toMatchObject({ step: 'applying', mascotChoice: 'imported' })
  })

  it('routes apply outcomes to done and error states and resets to idle', () => {
    const previewing = reduceTransferDialogState(initial, { type: 'preview-ready', preview: PREVIEW_MERGE })
    expect(reduceTransferDialogState(previewing, { type: 'apply-succeeded', message: '끝났어요' }).step).toBe('done')
    expect(reduceTransferDialogState(previewing, { type: 'apply-failed', message: '실패했어요' }).step).toBe('error')
    expect(reduceTransferDialogState({ step: 'done', message: 'x' }, { type: 'reset' }).step).toBe('idle')
  })
})

describe('handleDialogTabCycle', () => {
  it('wraps forward and backward within the focusable set', () => {
    expect(handleDialogTabCycle(0, 3, false)).toBe(1)
    expect(handleDialogTabCycle(2, 3, false)).toBe(0)
    expect(handleDialogTabCycle(0, 3, true)).toBe(2)
    expect(handleDialogTabCycle(1, 3, true)).toBe(0)
  })
})

describe('describeTransferErrorCode', () => {
  it('maps stable codes to Korean guidance without leaking internals', () => {
    expect(describeTransferErrorCode('DIGEST_MISMATCH')).toContain('파일이 손상되었거나')
    expect(describeTransferErrorCode('RECEIPT_CONTENT_CONFLICT')).toContain('같은 시도')
    expect(describeTransferErrorCode('MASCOT_CHOICE_REQUIRED')).toContain('마스코트')
    expect(describeTransferErrorCode('UNKNOWN_FUTURE_CODE')).toContain('확인할 수 없는 파일')
  })
})

describe('ProfileTransferDialog markup', () => {
  it('renders an accessible modal dialog with close action when open and nothing when closed', () => {
    const markup = renderTransferDialog({ step: 'idle' })
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('aria-labelledby="profile-transfer-title"')
    expect(markup).toContain('tabindex="-1"')
    expect(markup).toContain('닫기')

    const closed = renderToStaticMarkup(createElement(ProfileTransferDialog, {
      open: false,
      profileLabel: '철수',
      state: { step: 'idle' },
      onClose: () => {},
    }))
    expect(closed).toBe('')
  })

  it('renders as a titled embedded step without a nested modal or focus trap', () => {
    const markup = renderTransferDialog(
      { step: 'idle' },
      { embedded: true, onBack: () => {} },
    )
    expect(markup).toContain('aria-labelledby="profile-transfer-title"')
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
      root.render(createElement(ProfileTransferDialog, {
        open: true,
        embedded: true,
        profileLabel: '철수',
        state: { step: 'idle' },
        onBack,
        onClose,
      }))
    })

    const backButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === '프로필 관리로 돌아가기')
    if (!backButton) throw new Error('Missing embedded back button')
    backButton.focus()
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    backButton.dispatchEvent(tabEvent)
    expect(tabEvent.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(backButton)

    await act(async () => {
      backButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    })
    expect(onBack).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()

    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  it('offers export with the injected downloader contract wording', () => {
    const markup = renderTransferDialog({ step: 'idle' })
    expect(markup).toContain('내보내기 파일 저장')
  })

  it('shows merge counts in the preview step', () => {
    const markup = renderTransferDialog({
      step: 'preview',
      preview: PREVIEW_MERGE,
    }, EMBEDDED_PROPS)
    expect(markup).toContain('완료 추가 3개')
    expect(markup).toContain('복습 추가 1개')
    expect(markup).toContain('시도 기록 추가 2개')
    expect(markup).toContain('이 프로필에 합쳐요')
  })

  it('lists validation errors for invalid files in Korean', () => {
    const markup = renderTransferDialog({
      step: 'preview',
      preview: PREVIEW_INVALID,
    }, EMBEDDED_PROPS)
    expect(markup).toContain('파일이 손상되었거나')
    expect(markup).not.toContain('DIGEST_MISMATCH')
  })

  it('stops at the mascot-choice branch until a side is picked', () => {
    const markup = renderTransferDialog({
      step: 'mascot-choice',
      preview: { ...PREVIEW_MERGE, status: 'mascot-choice', mascot: { local: 'suri', imported: 'moa' } },
    }, EMBEDDED_PROPS)
    expect(markup).toContain('마스코트가 달라요')
    expect(markup).toContain('지금 마스코트 유지')
    expect(markup).toContain('가져온 마스코트 사용')
    expect(markup).not.toContain('가져오기 적용')
  })

  it('shows applying progress and terminal done/error messages in the live region', () => {
    const applying = renderTransferDialog({
      step: 'applying',
      preview: PREVIEW_MERGE,
      mascotChoice: 'local',
    }, EMBEDDED_PROPS)
    expect(applying).toContain('적용하는 중')
    expect(applying).toContain('aria-live="polite"')

    const done = renderTransferDialog({ step: 'done', message: '끝났어요' }, EMBEDDED_PROPS)
    expect(done).toContain('끝났어요')

    const errored = renderTransferDialog(
      { step: 'error', message: '실패했어요', detailCodes: ['APPLY_WRITE_FAILED'] },
      EMBEDDED_PROPS,
    )
    expect(errored).toContain('실패했어요')
  })

  it('keeps previewing and new-profile states available in embedded mode', () => {
    const previewing = renderTransferDialog({ step: 'previewing' }, EMBEDDED_PROPS)
    expect(previewing).toContain('파일을 확인하는 중이에요')

    const newProfile = renderTransferDialog({
      step: 'preview',
      preview: { ...PREVIEW_MERGE, status: 'new-profile', targetProfileId: null },
    }, EMBEDDED_PROPS)
    expect(newProfile).toContain('새 프로필로 추가해요')
  })

  it('uses native buttons with 48px touch targets', () => {
    const markup = renderTransferDialog({ step: 'idle' }, EMBEDDED_PROPS)
    expect(markup).toContain('type="button"')
    expect(markup).toContain('min-width:48px')
    expect(markup).toContain('min-height:48px')
  })

  it('stays unwired from app shell modules', () => {
    const source = readFileSync(path.resolve(__dirname, './ProfileTransferDialog.tsx'), 'utf8')
    expect(source).not.toContain("from '../app")
    expect(source).not.toMatch(/import\s+[^;]*app\//)
  })
})
