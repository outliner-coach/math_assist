'use client'

import { useCallback, useState, type ChangeEvent } from 'react'

/**
 * Standalone learner-profile manager (T4). Unwired by contract: shell/home
 * registration belongs to a later task. The caller owns persistence and
 * navigation: onSelectProfile is invoked only AFTER the caller's save-first
 * flow succeeds, and this component never routes or writes storage itself.
 */

export interface ProfileManagerProfile {
  profileId: string
  nickname: string | null
}

export interface ProfileManagerProps {
  profiles: readonly ProfileManagerProfile[]
  activeProfileId: string | null
  maxProfiles?: number
  onCreateProfile?: (nickname: string | null) => Promise<boolean> | boolean
  onRenameProfile?: (profileId: string, nickname: string | null) => Promise<boolean> | boolean
  onSelectProfile?: (profileId: string) => Promise<boolean> | boolean
  onOpenTransferDialog?: (profileId: string, action: 'transfer' | 'delete') => void
}

const TOUCH_TARGET_STYLE = { minWidth: '48px', minHeight: '48px' } as const

export function validateProfileNickname(input: string): { ok: true; value: string | null } | { ok: false } {
  const trimmed = input.trim()
  if (trimmed.length === 0) return { ok: true, value: null }
  if (Array.from(trimmed).length > 20) return { ok: false }
  return { ok: true, value: trimmed }
}

export function resolveProfileDisplayName(profile: ProfileManagerProfile, index: number): string {
  return profile.nickname ?? `학습자 ${index + 1}`
}

const SAVE_FAILURE_MESSAGE = '저장하지 못했어요. 기기 저장 공간을 확인하고 다시 시도해 주세요.'

export default function ProfileManager({
  profiles,
  activeProfileId,
  maxProfiles = 6,
  onCreateProfile,
  onRenameProfile,
  onSelectProfile,
  onOpenTransferDialog,
}: ProfileManagerProps) {
  const [newNickname, setNewNickname] = useState('')
  const [renamingProfileId, setRenamingProfileId] = useState<string | null>(null)
  const [renameInput, setRenameInput] = useState('')
  const [message, setMessage] = useState('')

  const runCallback = useCallback(
    async (action: () => Promise<boolean> | boolean, successMessage: string): Promise<boolean> => {
      try {
        const ok = await action()
        if (!ok) {
          setMessage(SAVE_FAILURE_MESSAGE)
          return false
        }
        setMessage(successMessage)
        return true
      } catch {
        setMessage(SAVE_FAILURE_MESSAGE)
        return false
      }
    },
    [],
  )

  const handleCreate = async (): Promise<void> => {
    const validated = validateProfileNickname(newNickname)
    if (!validated.ok) {
      setMessage('닉네임은 20자 이하로 입력해 주세요.')
      return
    }
    if (profiles.length >= maxProfiles) {
      setMessage(`프로필은 최대 ${maxProfiles}명까지 만들 수 있어요.`)
      return
    }
    const ok = await runCallback(
      () => onCreateProfile?.(validated.value) ?? Promise.resolve(false),
      '새 프로필을 만들었어요.',
    )
    if (ok) setNewNickname('')
  }

  const handleRenameStart = (profileId: string, current: string | null): void => {
    setRenamingProfileId(profileId)
    setRenameInput(current ?? '')
    setMessage('')
  }

  const handleRenameSubmit = async (profileId: string): Promise<void> => {
    const validated = validateProfileNickname(renameInput)
    if (!validated.ok) {
      setMessage('닉네임은 20자 이하로 입력해 주세요.')
      return
    }
    const ok = await runCallback(
      () => onRenameProfile?.(profileId, validated.value) ?? Promise.resolve(false),
      '이름을 바꿨어요.',
    )
    if (ok) setRenamingProfileId(null)
  }

  const handleSelect = async (profileId: string): Promise<void> => {
    await runCallback(
      () => onSelectProfile?.(profileId) ?? Promise.resolve(false),
      '프로필을 바꿨어요.',
    )
  }

  const limitReached = profiles.length >= maxProfiles

  return (
    <section aria-label="학습자 프로필">
      <h2>학습자 프로필</h2>
      <p role="status" aria-live="polite">
        {message.length > 0 ? message : '프로필을 골라 학습 기록을 나눠서 관리해요.'}
      </p>
      <ul>
        {profiles.map((profile, index) => {
          const displayName = resolveProfileDisplayName(profile, index)
          const isActive = profile.profileId === activeProfileId
          return (
            <li key={profile.profileId}>
              <span>{displayName}</span>
              {isActive ? <strong data-active-profile="true">현재 사용 중</strong> : null}
              <button
                type="button"
                style={TOUCH_TARGET_STYLE}
                disabled={isActive}
                onClick={() => {
                  void handleSelect(profile.profileId)
                }}
                aria-label={`${displayName} 프로필 선택`}
              >
                선택하기
              </button>
              <button
                type="button"
                style={TOUCH_TARGET_STYLE}
                onClick={() => handleRenameStart(profile.profileId, profile.nickname)}
                aria-label={`${displayName} 이름 바꾸기`}
              >
                이름 바꾸기
              </button>
              <button
                type="button"
                style={TOUCH_TARGET_STYLE}
                onClick={() => onOpenTransferDialog?.(profile.profileId, 'transfer')}
                aria-label={`${displayName} 내보내기·가져오기`}
              >
                내보내기·가져오기
              </button>
              <button
                type="button"
                style={TOUCH_TARGET_STYLE}
                onClick={() => onOpenTransferDialog?.(profile.profileId, 'delete')}
                aria-label={`${displayName} 프로필 삭제`}
              >
                삭제
              </button>
              {renamingProfileId === profile.profileId ? (
                <span>
                  <input
                    type="text"
                    value={renameInput}
                    maxLength={40}
                    aria-label="새 닉네임"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setRenameInput(event.target.value)}
                  />
                  <button
                    type="button"
                    style={TOUCH_TARGET_STYLE}
                    onClick={() => {
                      void handleRenameSubmit(profile.profileId)
                    }}
                  >
                    이름 저장
                  </button>
                  <button
                    type="button"
                    style={TOUCH_TARGET_STYLE}
                    onClick={() => setRenamingProfileId(null)}
                  >
                    취소
                  </button>
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
      <div>
        <input
          type="text"
          value={newNickname}
          maxLength={40}
          aria-label="새 프로필 닉네임"
          placeholder="닉네임은 비워 둘 수 있어요"
          onChange={(event: ChangeEvent<HTMLInputElement>) => setNewNickname(event.target.value)}
        />
        <button
          type="button"
          style={TOUCH_TARGET_STYLE}
          disabled={limitReached}
          onClick={() => {
            void handleCreate()
          }}
        >
          프로필 만들기
        </button>
        {limitReached ? <small>{`프로필은 최대 ${maxProfiles}명까지 만들 수 있어요.`}</small> : null}
      </div>
    </section>
  )
}
