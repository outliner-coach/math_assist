'use client'

import { useCallback, useReducer, useRef, useState, type KeyboardEvent } from 'react'

/**
 * Profile transfer surface (T4 spec §6). Export download, file picking and
 * storage access arrive through injected callbacks so this component never
 * touches window.localStorage or routing itself. Standalone callers keep the
 * modal contract; profile-manager callers set embedded and own the surrounding
 * dialog, step navigation and final focus restoration.
 */

const MASCOT_LABELS = { suri: '수리', moa: '모아', lumi: '루미' } as const

export interface TransferPreview {
  status: 'invalid' | 'new-profile' | 'merge' | 'mascot-choice'
  targetProfileId: string | null
  completedAdded: number
  reviewAdded: number
  reviewRemoved: number
  receiptsAdded: number
  recentActivityChanged: boolean
  mascot: { local: string; imported: string } | null
  errors: string[]
}

export interface TransferApplyOutcome {
  status: 'applied' | 'blocked' | 'failed'
  errorCode: string | null
  errors: string[]
  restoredFromBackup: boolean
  targetProfileId: string | null
}

export type TransferDialogState =
  | { step: 'idle' }
  | { step: 'previewing' }
  | { step: 'preview'; preview: TransferPreview }
  | { step: 'mascot-choice'; preview: TransferPreview }
  | { step: 'applying'; preview: TransferPreview; mascotChoice?: 'local' | 'imported' }
  | { step: 'done'; message: string }
  | { step: 'error'; message: string; detailCodes?: readonly string[] }

export type TransferDialogAction =
  | { type: 'file-selected' }
  | { type: 'preview-ready'; preview: TransferPreview }
  | { type: 'mascot-chosen'; choice: 'local' | 'imported' }
  | { type: 'apply-started' }
  | { type: 'apply-succeeded'; message: string }
  | { type: 'apply-failed'; message: string; detailCodes?: readonly string[] }
  | { type: 'operation-failed'; message: string }
  | { type: 'reset' }

export function reduceTransferDialogState(state: TransferDialogState, action: TransferDialogAction): TransferDialogState {
  switch (action.type) {
    case 'file-selected':
      return { step: 'previewing' }
    case 'preview-ready':
      return action.preview.status === 'mascot-choice'
        ? { step: 'mascot-choice', preview: action.preview }
        : { step: 'preview', preview: action.preview }
    case 'mascot-chosen':
      if (state.step !== 'mascot-choice') return state
      return { step: 'applying', preview: state.preview, mascotChoice: action.choice }
    case 'apply-started':
      if (state.step !== 'preview') return state
      return { step: 'applying', preview: state.preview }
    case 'apply-succeeded':
      return { step: 'done', message: action.message }
    case 'apply-failed':
      return { step: 'error', message: action.message, detailCodes: action.detailCodes }
    case 'operation-failed':
      return { step: 'error', message: action.message }
    case 'reset':
      return { step: 'idle' }
    default:
      return state
  }
}

export function handleDialogTabCycle(currentIndex: number, totalElements: number, shiftKey: boolean): number {
  if (totalElements <= 0) return currentIndex
  if (shiftKey) return (currentIndex - 1 + totalElements) % totalElements
  return (currentIndex + 1) % totalElements
}

export function describeTransferErrorCode(code: string): string {
  switch (code) {
    case 'NOT_VALID_JSON':
    case 'FILE_TOO_LARGE':
    case 'FORMAT_UNSUPPORTED':
    case 'SCHEMA_VERSION_UNSUPPORTED':
    case 'TOP_LEVEL_SHAPE_INVALID':
    case 'LEARNING_SHAPE_INVALID':
    case 'GRADE_PROGRESS_SHAPE_INVALID':
    case 'GRADE_SET_INVALID':
    case 'COMPLETED_IDS_INVALID':
    case 'REVIEW_IDS_INVALID':
    case 'SET_COMPLETION_INVALID':
    case 'RECEIPTS_SHAPE_INVALID':
    case 'RECEIPTS_COUNT_EXCEEDED':
    case 'RECEIPT_INVALID':
    case 'RECEIPT_ATTEMPT_DUPLICATE':
    case 'RECEIPT_ORDER_INVALID':
    case 'RECEIPT_LEARNER_MISMATCH':
    case 'RECENT_ACTIVITY_INVALID':
    case 'MASCOT_ID_INVALID':
    case 'NICKNAME_INVALID':
    case 'PROFILE_ID_INVALID':
    case 'PROFILE_BLOCK_INVALID':
    case 'APP_RELEASE_INVALID':
    case 'CONTENT_RELEASE_INVALID':
    case 'EXPORTED_AT_INVALID':
    case 'DIGEST_MISMATCH':
    case 'DIGEST_SHAPE_INVALID':
      return '파일이 손상되었거나 규격이 맞지 않아요. 다시 내보낸 파일을 사용해 주세요.'
    case 'RECEIPT_CONTENT_CONFLICT':
      return '같은 시도 기록이 다른 내용이라 함께 넣을 수 없어요.'
    case 'MASCOT_CHOICE_REQUIRED':
      return '마스코트를 먼저 골라 주세요.'
    case 'PROFILE_LIMIT_REACHED':
      return '새 프로필을 만들 자리가 부족해요. 프로필을 정리한 뒤 다시 시도해 주세요.'
    case 'APPLY_WRITE_FAILED':
      return '저장하지 못했어요. 원래 상태로 되돌렸으니 안전하게 다시 시도할 수 있어요.'
    case 'EXPORT_PROFILE_NOT_FOUND':
      return '내보낼 프로필을 찾지 못했어요.'
    default:
      return '확인할 수 없는 파일이에요. 다시 내보내서 시도해 주세요.'
  }
}

export interface ProfileTransferDialogProps {
  open: boolean
  profileLabel: string
  state?: TransferDialogState
  embedded?: boolean
  onClose?: () => void
  onBack?: () => void
  onStateAction?: (action: TransferDialogAction) => void
  exportBuilder?: () => Promise<{ filename: string; json: string }>
  downloader?: (filename: string, json: string) => void
  importFileReader?: () => Promise<string | null>
  previewImportText?: (text: string) => Promise<TransferPreview>
  applyImportText?: (text: string, options: { mascotChoice?: 'local' | 'imported' }) => Promise<TransferApplyOutcome>
}

const TOUCH_TARGET_STYLE = { minWidth: '48px', minHeight: '48px' } as const

function transferAnnouncement(state: TransferDialogState, notice: string): string {
  switch (state.step) {
    case 'previewing':
      return '파일을 확인하는 중이에요.'
    case 'preview':
      if (state.preview.status === 'invalid') {
        return describeTransferErrorCode(state.preview.errors[0] ?? '')
      }
      return '가져오기 내용을 확인해 주세요.'
    case 'mascot-choice':
      return '가져온 기록에 다른 마스코트가 있어요. 사용할 마스코트를 골라 주세요.'
    case 'applying':
      return '학습 기록을 적용하는 중이에요.'
    case 'done':
    case 'error':
      return state.message
    case 'idle':
    default:
      return notice.length > 0
        ? notice
        : '기기와 기기를 옮길 때 학습 기록 파일을 직접 주고받아요.'
  }
}

function focusableElements(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
  )
}

export default function ProfileTransferDialog({
  open,
  profileLabel,
  state,
  embedded = false,
  onClose,
  onBack,
  onStateAction,
  exportBuilder,
  downloader,
  importFileReader,
  previewImportText,
  applyImportText,
}: ProfileTransferDialogProps) {
  const [internalState, dispatch] = useReducer(reduceTransferDialogState, { step: 'idle' } as TransferDialogState)
  const [notice, setNotice] = useState('')
  const lastImportTextRef = useRef<string | null>(null)

  const act = useCallback((action: TransferDialogAction) => {
    onStateAction?.(action)
    dispatch(action)
  }, [onStateAction])

  const currentState = state ?? internalState

  const runAction = useCallback(async (run: () => Promise<void>) => {
    try {
      await run()
    } catch {
      act({ type: 'operation-failed', message: '요청을 처리하지 못했어요. 다시 시도해 주세요.' })
    }
  }, [act])

  const handleExport = (): void => {
    void runAction(async () => {
      if (!exportBuilder || !downloader) return
      const file = await exportBuilder()
      downloader(file.filename, file.json)
      setNotice('내보내기 파일을 저장했어요.')
    })
  }

  const handlePickFile = (): void => {
    void runAction(async () => {
      if (!importFileReader || !previewImportText) return
      act({ type: 'file-selected' })
      const text = await importFileReader()
      if (text === null) {
        act({ type: 'reset' })
        return
      }
      lastImportTextRef.current = text
      const preview = await previewImportText(text)
      act({ type: 'preview-ready', preview })
    })
  }

  const startApply = (mascotChoice?: 'local' | 'imported'): void => {
    void runAction(async () => {
      const text = lastImportTextRef.current
      if (!text || !applyImportText) return
      if (currentState.step === 'preview') act({ type: 'apply-started' })
      const outcome = await applyImportText(text, { mascotChoice })
      if (outcome.status === 'applied') {
        act({ type: 'apply-succeeded', message: '학습 기록을 옮겼어요.' })
        return
      }
      const code = outcome.errorCode ?? outcome.errors[0] ?? ''
      act({
        type: 'apply-failed',
        message: code.length > 0 ? describeTransferErrorCode(code) : '적용하지 못했어요.',
        detailCodes: outcome.errors,
      })
    })
  }

  const exitSurface = (): void => {
    if (embedded) {
      onBack?.()
      return
    }
    onClose?.()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (embedded) return
    if (event.key === 'Escape') {
      event.stopPropagation()
      exitSurface()
      return
    }
    if (event.key !== 'Tab') return
    const elements = focusableElements(event.currentTarget)
    if (elements.length === 0) return
    const activeIndex = elements.findIndex((element) => element === event.target)
    const nextIndex = handleDialogTabCycle(activeIndex < 0 ? 0 : activeIndex, elements.length, event.shiftKey)
    event.preventDefault()
    elements[nextIndex].focus()
  }

  if (!open) return null

  return (
    <section
      role={embedded ? undefined : 'dialog'}
      aria-modal={embedded ? undefined : true}
      aria-labelledby="profile-transfer-title"
      tabIndex={embedded ? undefined : -1}
      onKeyDown={handleKeyDown}
      style={{ position: 'relative' }}
    >
      <h2 id="profile-transfer-title">{`${profileLabel} 프로필 내보내기·가져오기`}</h2>
      <p role="status" aria-live="polite">
        {transferAnnouncement(currentState, notice)}
      </p>

      <section aria-label="내보내기">
        <button
          type="button"
          style={TOUCH_TARGET_STYLE}
          onClick={handleExport}
          disabled={!exportBuilder || !downloader || currentState.step === 'applying'}
        >
          내보내기 파일 저장
        </button>
      </section>

      <section aria-label="가져오기">
        <button
          type="button"
          style={TOUCH_TARGET_STYLE}
          onClick={handlePickFile}
          disabled={!importFileReader || !previewImportText || currentState.step === 'applying'}
        >
          가져올 파일 고르기
        </button>

        {currentState.step === 'preview' || currentState.step === 'mascot-choice' || currentState.step === 'applying' ? (
          <div>
            {currentState.preview.status === 'invalid' ? (
              <ul>
                {currentState.preview.errors.map((code) => (
                  <li key={code}>{describeTransferErrorCode(code)}</li>
                ))}
              </ul>
            ) : (
              <>
                <p>
                  {currentState.preview.status === 'new-profile'
                    ? '새 프로필로 추가해요.'
                    : '이 프로필에 합쳐요.'}
                </p>
                <ul>
                  <li>{`완료 추가 ${currentState.preview.completedAdded}개`}</li>
                  <li>{`복습 추가 ${currentState.preview.reviewAdded}개 · 복습 정리 ${currentState.preview.reviewRemoved}개`}</li>
                  <li>{`시도 기록 추가 ${currentState.preview.receiptsAdded}개`}</li>
                </ul>
              </>
            )}
          </div>
        ) : null}

        {currentState.step === 'mascot-choice' && currentState.preview.mascot !== null ? (
          <fieldset>
            <legend>마스코트가 달라요. 어떤 마스코트를 쓸까요?</legend>
            <button
              type="button"
              style={TOUCH_TARGET_STYLE}
              onClick={() => {
                act({ type: 'mascot-chosen', choice: 'local' })
                startApply('local')
              }}
            >
              {`지금 마스코트 유지 (${MASCOT_LABELS[currentState.preview.mascot.local as keyof typeof MASCOT_LABELS] ?? currentState.preview.mascot.local})`}
            </button>
            <button
              type="button"
              style={TOUCH_TARGET_STYLE}
              onClick={() => {
                act({ type: 'mascot-chosen', choice: 'imported' })
                startApply('imported')
              }}
            >
              {`가져온 마스코트 사용 (${MASCOT_LABELS[currentState.preview.mascot.imported as keyof typeof MASCOT_LABELS] ?? currentState.preview.mascot.imported})`}
            </button>
          </fieldset>
        ) : null}

        {currentState.step === 'preview' && currentState.preview.status !== 'invalid' ? (
          <button
            type="button"
            style={TOUCH_TARGET_STYLE}
            onClick={() => startApply(undefined)}
          >
            가져오기 적용
          </button>
        ) : null}

        {currentState.step === 'applying' ? (
          <button type="button" style={TOUCH_TARGET_STYLE} disabled>
            적용하는 중…
          </button>
        ) : null}
      </section>

      {currentState.step === 'error' ? (
        <div>
          {(currentState.detailCodes ?? []).map((code) => (
            <p key={code}>{describeTransferErrorCode(code)}</p>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        style={TOUCH_TARGET_STYLE}
        onClick={() => {
          act({ type: 'reset' })
          exitSurface()
        }}
      >
        {embedded ? '프로필 관리로 돌아가기' : '닫기'}
      </button>
    </section>
  )
}
