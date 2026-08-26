'use client'

import { useCallback, type KeyboardEvent } from 'react'

/**
 * Standalone device-wide data reset dialog (T4 spec §6). Unwired by
 * contract: shell registration belongs to a later task. Storage access is
 * injected through onReset; this component never touches storage itself and
 * requires retyping the consequence phrase before arming the destructive
 * action.
 */

export const DEVICE_RESET_CONFIRM_PHRASE = '이 기기의 모든 데이터 삭제' as const

export interface DeviceDataResetOutcome {
  status: 'reset' | 'failed'
  errorCode: string | null
  removedMathAssistKeyCount: number
  indexedDbAndCacheStep: 'deferred-to-offline-integration'
  reloadRecommended: boolean
}

export interface DeviceDataResetDialogProps {
  open: boolean
  typedPhrase: string
  result?: DeviceDataResetOutcome | null
  onClose: () => void
  onTypedPhraseChange?: (value: string) => void
  onReset: (token: string) => Promise<DeviceDataResetOutcome> | DeviceDataResetOutcome
}

const TOUCH_TARGET_STYLE = { minWidth: '48px', minHeight: '48px' } as const

export function isDeviceResetPhraseConfirmed(input: string): boolean {
  return input.trim() === DEVICE_RESET_CONFIRM_PHRASE
}

function handleTabCycle(event: KeyboardEvent<HTMLDivElement>): void {
  if (event.key !== 'Tab') return
  const elements = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
  )
  if (elements.length === 0) return
  const activeIndex = elements.findIndex((element) => element === event.target)
  const total = elements.length
  const nextIndex = event.shiftKey
    ? (activeIndex - 1 + total) % total
    : (activeIndex + 1) % total
  event.preventDefault()
  elements[activeIndex < 0 ? 0 : nextIndex].focus()
}

export default function DeviceDataResetDialog({
  open,
  typedPhrase,
  result = null,
  onClose,
  onTypedPhraseChange,
  onReset,
}: DeviceDataResetDialogProps) {
  const confirmed = isDeviceResetPhraseConfirmed(typedPhrase)

  const handleReset = useCallback(async () => {
    if (!isDeviceResetPhraseConfirmed(typedPhrase)) return
    await onReset(typedPhrase.trim())
  }, [typedPhrase, onReset])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-data-reset-title"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
          return
        }
        handleTabCycle(event)
      }}
      style={{ position: 'relative' }}
    >
      <h2 id="device-data-reset-title">이 기기의 모든 Math Assist 데이터 삭제</h2>
      <p role="status" aria-live="polite">
        {result?.status === 'reset'
          ? '삭제를 마쳤어요. 안전한 마무리를 위해 새로고침해 주세요.'
          : result !== null
            ? '삭제하지 못했어요. 저장 공간을 확인하고 다시 시도해 주세요.'
            : '두 단계 확인 후에 삭제할 수 있어요.'}
      </p>

      <ul>
        <li>모든 학습자 프로필과 학습 기록이 지워져요.</li>
        <li>풀이장 그림과 내부 복구 백업도 함께 지워져요.</li>
        <li>내보내기 파일은 지워지지 않아요. 미리 저장해 두면 기록을 옮길 수 있어요.</li>
      </ul>

      {result?.status === 'reset' || result !== null ? (
        <button type="button" style={TOUCH_TARGET_STYLE} onClick={onClose}>
          닫기
        </button>
      ) : (
        <>
          <input
            type="text"
            value={typedPhrase}
            maxLength={60}
            aria-label={`삭제 확인 문구 재입력: ${DEVICE_RESET_CONFIRM_PHRASE}`}
            placeholder={DEVICE_RESET_CONFIRM_PHRASE}
            onChange={(event) => onTypedPhraseChange?.(event.target.value)}
          />
          <button
            type="button"
            style={TOUCH_TARGET_STYLE}
            disabled={!confirmed}
            onClick={() => {
              void handleReset()
            }}
          >
            모든 데이터 삭제
          </button>
          <button type="button" style={TOUCH_TARGET_STYLE} onClick={onClose}>
            취소
          </button>
        </>
      )}
    </div>
  )
}
