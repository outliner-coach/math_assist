'use client'

/**
 * Profile-only deletion confirmation step. The parent owns the surrounding
 * dialog, persistence operation, error state, navigation and focus return.
 * This surface only presents consequences and invokes injected callbacks.
 */

export interface ProfileDeleteConfirmationProps {
  profileLabel: string
  statusMessage?: string
  busy?: boolean
  onConfirm: () => Promise<void> | void
  onBack: () => void
}

const TOUCH_TARGET_STYLE = { minWidth: '48px', minHeight: '48px' } as const

export default function ProfileDeleteConfirmation({
  profileLabel,
  statusMessage = '',
  busy = false,
  onConfirm,
  onBack,
}: ProfileDeleteConfirmationProps) {
  const announcement = busy
    ? '프로필 기록을 삭제하는 중이에요.'
    : statusMessage.length > 0
      ? statusMessage
      : '삭제할 프로필과 영향을 다시 확인해 주세요.'

  return (
    <section aria-labelledby="profile-delete-confirmation-title">
      <h2 id="profile-delete-confirmation-title">{`${profileLabel} 프로필을 삭제할까요?`}</h2>
      <p role="status" aria-live="polite">{announcement}</p>
      <p>
        이 프로필의 기록만 이 기기에서 지워져요. 다른 프로필과 오프라인 팩은 그대로 남아요. 삭제 전에
        내보내기 파일을 저장했는지 확인해 주세요.
      </p>
      <div>
        <button
          type="button"
          style={TOUCH_TARGET_STYLE}
          disabled={busy}
          onClick={() => {
            void onConfirm()
          }}
        >
          {busy ? '삭제하는 중…' : '삭제합니다'}
        </button>
        <button type="button" style={TOUCH_TARGET_STYLE} disabled={busy} onClick={onBack}>
          프로필 관리로 돌아가기
        </button>
      </div>
    </section>
  )
}
