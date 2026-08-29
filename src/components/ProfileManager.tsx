'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import MascotCharacter from './MascotCharacter'

/**
 * Callback-driven learner-profile manager. The caller owns persistence,
 * navigation, transfer, and deletion; this component only presents registry
 * entries and reports the learner's requested action.
 */

export const PROFILE_MANAGER_MASCOT_IDS = ['suri', 'moa', 'lumi'] as const
export type ProfileManagerMascotId = (typeof PROFILE_MANAGER_MASCOT_IDS)[number]

export interface ProfileManagerProfile {
  profileId: string
  nickname: string | null
  mascotId: ProfileManagerMascotId
}

export type ProfileManagerFocusTarget =
  | { kind: 'profile-card'; profileId: string }
  | { kind: 'manage'; profileId: string }
  | { kind: 'create-trigger' }

export interface ProfileManagerProps {
  profiles: readonly ProfileManagerProfile[]
  activeProfileId: string | null
  maxProfiles?: number
  onCreateProfile?: (nickname: string | null) => Promise<boolean> | boolean
  onRenameProfile?: (profileId: string, nickname: string | null) => Promise<boolean> | boolean
  onSelectProfile?: (profileId: string) => Promise<boolean> | boolean
  onOpenTransferDialog?: (profileId: string, action: 'transfer' | 'delete') => void
  focusTarget?: ProfileManagerFocusTarget | null
  onFocusTargetHandled?: () => void
}

type FocusRequest =
  | { kind: 'created-card'; previousProfileIds: ReadonlySet<string> }
  | { kind: 'profile-card'; profileId: string }
  | { kind: 'manage'; profileId: string }
  | { kind: 'create-trigger' }

type ProfileEditorStep =
  | { kind: 'create' }
  | { kind: 'rename'; profileId: string }

const TOUCH_TARGET_STYLE = { minWidth: '48px', minHeight: '48px' } as const
const INPUT_STYLE = { minWidth: '48px', minHeight: '48px' } as const
const PROFILE_LIMIT = 6
const SAVE_FAILURE_MESSAGE = '저장하지 못했어요. 기기 저장 공간을 확인하고 다시 시도해 주세요.'

export function validateProfileNickname(input: string): { ok: true; value: string | null } | { ok: false } {
  const trimmed = input.trim()
  if (trimmed.length === 0) return { ok: true, value: null }
  if (Array.from(trimmed).length > 20) return { ok: false }
  return { ok: true, value: trimmed }
}

export function resolveProfileDisplayName(profile: ProfileManagerProfile, index: number): string {
  return profile.nickname ?? `학습자 ${index + 1}`
}

function moveWithinMenu(event: ReactKeyboardEvent<HTMLDivElement>): void {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
  if (items.length === 0) return

  event.preventDefault()
  const currentIndex = items.findIndex((item) => item === document.activeElement)
  if (event.key === 'Home') {
    items[0].focus()
    return
  }
  if (event.key === 'End') {
    items[items.length - 1].focus()
    return
  }
  const direction = event.key === 'ArrowDown' ? 1 : -1
  const nextIndex = currentIndex < 0
    ? (direction === 1 ? 0 : items.length - 1)
    : (currentIndex + direction + items.length) % items.length
  items[nextIndex].focus()
}

export default function ProfileManager({
  profiles,
  activeProfileId,
  maxProfiles = PROFILE_LIMIT,
  onCreateProfile,
  onRenameProfile,
  onSelectProfile,
  onOpenTransferDialog,
  focusTarget = null,
  onFocusTargetHandled,
}: ProfileManagerProps) {
  const [editorStep, setEditorStep] = useState<ProfileEditorStep | null>(null)
  const [newNickname, setNewNickname] = useState('')
  const [renameInput, setRenameInput] = useState('')
  const [openMenuProfileId, setOpenMenuProfileId] = useState<string | null>(null)
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)
  const [message, setMessage] = useState('')

  const cardRefs = useRef(new Map<string, HTMLElement>())
  const manageButtonRefs = useRef(new Map<string, HTMLButtonElement>())
  const menuRefs = useRef(new Map<string, HTMLDivElement>())
  const createTriggerRef = useRef<HTMLButtonElement>(null)
  const createInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const profileLimit = Math.min(Math.max(maxProfiles, 0), PROFILE_LIMIT)
  const limitReached = profiles.length >= profileLimit

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

  useEffect(() => {
    if (openMenuProfileId === null) return
    menuRefs.current.get(openMenuProfileId)?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [openMenuProfileId])

  useEffect(() => {
    if (editorStep?.kind === 'create') createInputRef.current?.focus()
  }, [editorStep])

  useEffect(() => {
    if (editorStep?.kind === 'rename') renameInputRef.current?.focus()
  }, [editorStep])

  useEffect(() => {
    const request = focusRequest ?? focusTarget
    if (request === null) return
    let target: HTMLElement | undefined | null
    if (request.kind === 'create-trigger') {
      target = createTriggerRef.current
    } else if (request.kind === 'profile-card') {
      target = cardRefs.current.get(request.profileId)
    } else if (request.kind === 'manage') {
      target = manageButtonRefs.current.get(request.profileId)
    } else {
      const createdProfile = profiles.find((profile) => !request.previousProfileIds.has(profile.profileId))
      target = createdProfile ? cardRefs.current.get(createdProfile.profileId) : null
    }
    if (!target) return
    target.focus()
    if (focusRequest !== null) {
      queueMicrotask(() => {
        setFocusRequest((current) => current === request ? null : current)
      })
    } else {
      onFocusTargetHandled?.()
    }
  }, [focusRequest, focusTarget, onFocusTargetHandled, profiles, editorStep])

  const closeMenu = (profileId: string, returnFocus = true): void => {
    setOpenMenuProfileId(null)
    if (returnFocus) setFocusRequest({ kind: 'manage', profileId })
  }

  const handleCreate = async (): Promise<void> => {
    const validated = validateProfileNickname(newNickname)
    if (!validated.ok) {
      setMessage('닉네임은 20자 이하로 입력해 주세요.')
      return
    }
    if (limitReached) {
      setMessage(`프로필은 최대 ${profileLimit}명까지 만들 수 있어요.`)
      return
    }

    const previousProfileIds = new Set(profiles.map((profile) => profile.profileId))
    const ok = await runCallback(
      () => onCreateProfile?.(validated.value) ?? Promise.resolve(false),
      '새 프로필을 만들었어요.',
    )
    if (!ok) return

    setNewNickname('')
    setEditorStep(null)
    setFocusRequest({ kind: 'created-card', previousProfileIds })
  }

  const handleRenameStart = (profile: ProfileManagerProfile): void => {
    setOpenMenuProfileId(null)
    setEditorStep({ kind: 'rename', profileId: profile.profileId })
    setRenameInput(profile.nickname ?? '')
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
      '이름을 바꿔어요.',
    )
    if (!ok) return

    setEditorStep(null)
    setFocusRequest({ kind: 'profile-card', profileId })
  }

  const handleSelect = async (profileId: string): Promise<void> => {
    await runCallback(
      () => onSelectProfile?.(profileId) ?? Promise.resolve(false),
      '프로필을 바꿔어요.',
    )
  }

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>, profileId: string): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu(profileId)
      return
    }
    moveWithinMenu(event)
  }

  const openTransfer = (profileId: string): void => {
    onOpenTransferDialog?.(profileId, 'transfer')
    closeMenu(profileId)
  }

  const renamingProfileIndex = editorStep?.kind === 'rename'
    ? profiles.findIndex((profile) => profile.profileId === editorStep.profileId)
    : -1
  const renamingProfile = renamingProfileIndex >= 0 ? profiles[renamingProfileIndex] : null

  return (
    <section aria-label="학습자 프로필" className="rounded-[2rem] bg-[#f8fafc] p-4 md:p-6">
      <div className="text-center">
        <p className="text-sm font-black text-[#0f766e]">학습 기록 나누기</p>
        <h2 className="mt-1 text-2xl font-black text-[#0f172a]">누가 공부하나요?</h2>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-6 text-center text-sm font-bold text-[#475569]">
        {message.length > 0 ? message : '프로필을 골라 학습 기록을 나눠서 관리해요.'}
      </p>

      {editorStep?.kind === 'create' ? (
        <form
          data-profile-manager-step="create"
          className="mx-auto mt-5 max-w-xl rounded-[1.75rem] border-2 border-[#bae6fd] bg-white p-5 shadow-sm"
          aria-label="새 프로필 만들기"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            void handleCreate()
          }}
        >
          <h3 className="text-xl font-black text-[#0f172a]">새 프로필 만들기</h3>
          <p className="mt-2 text-sm font-bold text-[#64748b]">닉네임은 비워 둘 수 있어요.</p>
          <label className="mt-4 block text-left text-sm font-black text-[#334155]">
            닉네임 (선택)
            <input
              ref={createInputRef}
              type="text"
              value={newNickname}
              maxLength={40}
              style={INPUT_STYLE}
              aria-label="새 프로필 닉네임"
              placeholder="비워 둘 수 있어요"
              className="mt-2 w-full rounded-xl border-2 border-[#94a3b8] bg-white px-3 font-bold text-[#0f172a]"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setNewNickname(event.target.value)}
            />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="submit" style={TOUCH_TARGET_STYLE} className="rounded-xl bg-[#0f766e] px-3 font-black text-white">
              프로필 만들기
            </button>
            <button
              type="button"
              style={TOUCH_TARGET_STYLE}
              className="rounded-xl border-2 border-[#cbd5e1] bg-white px-3 font-black text-[#475569]"
              onClick={() => {
                setEditorStep(null)
                setMessage('')
                setFocusRequest({ kind: 'create-trigger' })
              }}
            >
              취소
            </button>
          </div>
        </form>
      ) : editorStep?.kind === 'rename' && renamingProfile !== null ? (
        <form
          data-profile-manager-step="rename"
          className="mx-auto mt-5 max-w-xl rounded-[1.75rem] border-2 border-[#bae6fd] bg-white p-5 shadow-sm"
          aria-label={`${resolveProfileDisplayName(renamingProfile, renamingProfileIndex)} 이름 변경`}
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            void handleRenameSubmit(renamingProfile.profileId)
          }}
        >
          <p className="text-sm font-black text-[#0f766e]">{`학습자 ${renamingProfileIndex + 1}`}</p>
          <h3 className="mt-1 text-xl font-black text-[#0f172a]">이름 변경</h3>
          <label className="mt-4 block text-sm font-black text-[#334155]">
            새 닉네임
            <input
              ref={renameInputRef}
              type="text"
              value={renameInput}
              maxLength={40}
              style={INPUT_STYLE}
              aria-label={`학습자 ${renamingProfileIndex + 1} 새 닉네임`}
              className="mt-2 w-full rounded-xl border-2 border-[#94a3b8] bg-white px-3 font-bold text-[#0f172a]"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setRenameInput(event.target.value)}
            />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="submit" style={TOUCH_TARGET_STYLE} className="rounded-xl bg-[#0f766e] px-3 font-black text-white">
              이름 저장
            </button>
            <button
              type="button"
              style={TOUCH_TARGET_STYLE}
              className="rounded-xl border-2 border-[#cbd5e1] bg-white px-3 font-black text-[#475569]"
              onClick={() => {
                setEditorStep(null)
                setMessage('')
                setFocusRequest({ kind: 'manage', profileId: renamingProfile.profileId })
              }}
            >
              취소
            </button>
          </div>
        </form>
      ) : (
      <ul data-profile-manager-step="list" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile, index) => {
          const ordinalLabel = `학습자 ${index + 1}`
          const displayName = resolveProfileDisplayName(profile, index)
          const isActive = profile.profileId === activeProfileId
          const menuOpen = openMenuProfileId === profile.profileId
          const menuId = `profile-manager-menu-${index + 1}`

          return (
            <li
              key={profile.profileId}
              ref={(element) => {
                if (element) cardRefs.current.set(profile.profileId, element)
                else cardRefs.current.delete(profile.profileId)
              }}
              tabIndex={-1}
              data-profile-card="true"
              data-profile-card-ordinal={index + 1}
              aria-label={`${ordinalLabel}, ${displayName}`}
              className="relative flex min-h-[290px] flex-col rounded-[1.75rem] border-2 bg-white p-4 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-[#67e8f9]"
              style={{ borderColor: isActive ? '#14b8a6' : '#dbeafe' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#0f766e]">{ordinalLabel}</p>
                  <h3 className="mt-1 text-xl font-black text-[#0f172a]">
                    {profile.nickname ?? ordinalLabel}
                  </h3>
                </div>
                <MascotCharacter mascotId={profile.mascotId} state="welcome" mode="coach" className="shrink-0" />
              </div>

              <div className="mt-auto pt-5">
                {isActive ? (
                  <p
                    data-active-profile="true"
                    className="flex min-h-[48px] items-center justify-center rounded-2xl bg-[#ccfbf1] px-4 text-center font-black text-[#0f766e]"
                  >
                    현재 사용 중
                  </p>
                ) : (
                  <button
                    type="button"
                    style={TOUCH_TARGET_STYLE}
                    onClick={() => {
                      void handleSelect(profile.profileId)
                    }}
                    aria-label={`${ordinalLabel} ${displayName}, 이 프로필로 시작`}
                    className="w-full rounded-2xl bg-[#0f766e] px-4 font-black text-white shadow-sm"
                  >
                    이 프로필로 시작
                  </button>
                )}

                <button
                  ref={(element) => {
                    if (element) manageButtonRefs.current.set(profile.profileId, element)
                    else manageButtonRefs.current.delete(profile.profileId)
                  }}
                  type="button"
                  style={TOUCH_TARGET_STYLE}
                  aria-label={`${ordinalLabel} ${displayName} 관리`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-controls={menuOpen ? menuId : undefined}
                  data-profile-manage="true"
                  className="mt-2 w-full rounded-2xl border-2 border-[#cbd5e1] bg-white px-4 font-black text-[#334155]"
                  onClick={() => {
                    if (menuOpen) closeMenu(profile.profileId)
                    else setOpenMenuProfileId(profile.profileId)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      setOpenMenuProfileId(profile.profileId)
                    }
                  }}
                >
                  관리
                </button>

                {menuOpen ? (
                  <div
                    ref={(element) => {
                      if (element) menuRefs.current.set(profile.profileId, element)
                      else menuRefs.current.delete(profile.profileId)
                    }}
                    id={menuId}
                    role="menu"
                    aria-label={`${ordinalLabel} 관리 메뉴`}
                    className="absolute inset-x-4 bottom-4 z-10 grid gap-1 rounded-2xl border-2 border-[#bae6fd] bg-white p-2 shadow-xl"
                    onKeyDown={(event) => handleMenuKeyDown(event, profile.profileId)}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      style={TOUCH_TARGET_STYLE}
                      className="rounded-xl px-4 text-left font-black text-[#334155] hover:bg-[#f0fdfa]"
                      onClick={() => handleRenameStart(profile)}
                    >
                      이름 변경
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      style={TOUCH_TARGET_STYLE}
                      className="rounded-xl px-4 text-left font-black text-[#334155] hover:bg-[#f0fdfa]"
                      onClick={() => openTransfer(profile.profileId)}
                    >
                      내보내기
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      style={TOUCH_TARGET_STYLE}
                      className="rounded-xl px-4 text-left font-black text-[#334155] hover:bg-[#f0fdfa]"
                      onClick={() => openTransfer(profile.profileId)}
                    >
                      가져오기
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      style={TOUCH_TARGET_STYLE}
                      className="rounded-xl px-4 text-left font-black text-[#991b1b] hover:bg-[#fef2f2]"
                      onClick={() => {
                        onOpenTransferDialog?.(profile.profileId, 'delete')
                        closeMenu(profile.profileId)
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ) : null}

              </div>
            </li>
          )
        })}

        <li
          data-profile-create-card="true"
          className="flex min-h-[290px] flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-[#93c5fd] bg-[#eff6ff] p-4 text-center"
        >
          <button
            ref={createTriggerRef}
            type="button"
            style={TOUCH_TARGET_STYLE}
            disabled={limitReached}
            aria-label="새 학습자 프로필 만들기"
            data-profile-create-trigger="true"
            className="w-full rounded-2xl bg-white px-5 text-lg font-black text-[#1d4ed8] shadow-sm disabled:cursor-not-allowed disabled:text-[#64748b]"
            onClick={() => {
              setEditorStep({ kind: 'create' })
              setOpenMenuProfileId(null)
              setMessage('')
            }}
          >
            + 새 프로필
          </button>
          {limitReached ? (
            <small className="mt-3 font-bold leading-5 text-[#64748b]">
              {`프로필은 최대 ${profileLimit}명까지 만들 수 있어요.`}
            </small>
          ) : (
            <small className="mt-3 font-bold leading-5 text-[#64748b]">닉네임은 비워 둘 수 있어요.</small>
          )}
        </li>
      </ul>
      )}
    </section>
  )
}
