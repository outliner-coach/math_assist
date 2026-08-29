// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import path from 'node:path'
import React, { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ProfileManager, {
  PROFILE_MANAGER_MASCOT_IDS,
  resolveProfileDisplayName,
  validateProfileNickname,
  type ProfileManagerProfile,
} from './ProfileManager'

const PROFILES: readonly ProfileManagerProfile[] = [
  {
    profileId: 'local_11111111-1111-4111-8111-111111111111',
    nickname: '철수',
    mascotId: 'suri',
  },
  {
    profileId: 'local_22222222-2222-4222-9222-222222222222',
    nickname: null,
    mascotId: 'moa',
  },
  {
    profileId: 'local_33333333-3333-4333-8333-333333333333',
    nickname: '철수',
    mascotId: 'suri',
  },
]

let container: HTMLDivElement
let root: Root

function renderProfileManager(
  props: Partial<React.ComponentProps<typeof ProfileManager>> = {},
): void {
  act(() => {
    root.render(
      React.createElement(ProfileManager, {
        profiles: PROFILES,
        activeProfileId: PROFILES[0].profileId,
        ...props,
      }),
    )
  })
}

function buttonByText(text: string, scope: ParentNode = container): HTMLButtonElement {
  const button = Array.from(scope.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === text,
  )
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Button not found: ${text}`)
  return button
}

function changeInput(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function click(button: HTMLButtonElement): Promise<void> {
  await act(async () => {
    button.click()
    await Promise.resolve()
  })
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('profile expression contracts', () => {
  it('allows only the three approved mascot identifiers', () => {
    expect(PROFILE_MANAGER_MASCOT_IDS).toEqual(['suri', 'moa', 'lumi'])
  })

  it('trims and accepts blank or 1-20 character nicknames', () => {
    expect(validateProfileNickname('  수리 굿  ')).toEqual({ ok: true, value: '수리 굿' })
    expect(validateProfileNickname('   ')).toEqual({ ok: true, value: null })
    expect(validateProfileNickname('가'.repeat(20))).toEqual({ ok: true, value: '가'.repeat(20) })
    expect(validateProfileNickname('가'.repeat(21))).toEqual({ ok: false })
  })

  it('keeps the ordinal fallback deterministic', () => {
    expect(resolveProfileDisplayName(PROFILES[0], 0)).toBe('철수')
    expect(resolveProfileDisplayName(PROFILES[1], 1)).toBe('학습자 2')
  })
})

describe('ProfileManager cards', () => {
  it('renders every registry entry as an independent ordinal card without technical identifiers', () => {
    renderProfileManager()
    const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-profile-card]'))

    expect(cards).toHaveLength(3)
    expect(cards[0].textContent).toContain('학습자 1')
    expect(cards[1].textContent).toContain('학습자 2')
    expect(cards[2].textContent).toContain('학습자 3')
    expect(cards[0].textContent).toContain('철수')
    expect(cards[1].querySelector('h3')?.textContent).toBe('학습자 2')
    expect(cards[2].textContent).toContain('철수')
    expect(cards[0].querySelector('[data-mascot-id="suri"]')).not.toBeNull()
    expect(cards[1].querySelector('[data-mascot-id="moa"]')).not.toBeNull()
    expect(cards[2].querySelector('[data-mascot-id="suri"]')).not.toBeNull()
    expect(container.innerHTML).not.toContain('local_11111111')
    expect(container.innerHTML).not.toContain('local_22222222')
  })

  it('shows a start action only for inactive profiles and a state for the active profile', () => {
    renderProfileManager()
    const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-profile-card]'))

    expect(cards[0].textContent).toContain('현재 사용 중')
    expect(cards[0].textContent).not.toContain('이 프로필로 시작')
    expect(buttonByText('이 프로필로 시작', cards[1]).disabled).toBe(false)
    expect(buttonByText('이 프로필로 시작', cards[2]).disabled).toBe(false)
  })

  it('keeps management actions inside one menu and restores focus on Escape', async () => {
    renderProfileManager()
    const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-profile-card]'))
    const manageButton = buttonByText('관리', cards[1])

    expect(cards[1].querySelector('[role="menu"]')).toBeNull()
    expect(cards[1].textContent).not.toContain('이름 변경')
    await click(manageButton)

    const menu = cards[1].querySelector<HTMLElement>('[role="menu"]')
    expect(menu).not.toBeNull()
    expect(Array.from(menu?.querySelectorAll('[role="menuitem"]') ?? []).map((item) => item.textContent)).toEqual([
      '이름 변경',
      '내보내기',
      '가져오기',
      '삭제',
    ])
    expect(document.activeElement).toBe(menu?.querySelector('[role="menuitem"]'))

    await act(async () => {
      menu?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await Promise.resolve()
    })
    expect(cards[1].querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(manageButton)
  })

  it('uses 48 by 48 pixel minimum targets and accessible names for every major action', async () => {
    renderProfileManager()
    await click(buttonByText('관리', container.querySelectorAll('[data-profile-card]')[1]))
    const menuControls = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
    )
    for (const control of menuControls) {
      expect(control.style.minWidth, control.outerHTML).toBe('48px')
      expect(control.style.minHeight, control.outerHTML).toBe('48px')
      expect(control.textContent?.trim(), control.outerHTML).toBeTruthy()
    }

    await click(buttonByText('+ 새 프로필'))

    const controls = Array.from(container.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input'))
    expect(controls.length).toBeGreaterThan(0)
    for (const control of controls) {
      expect(control.style.minWidth, control.outerHTML).toBe('48px')
      expect(control.style.minHeight, control.outerHTML).toBe('48px')
      expect(control.getAttribute('aria-label') ?? control.textContent?.trim(), control.outerHTML).toBeTruthy()
    }
  })

  it('maps the four menu entries to the existing transfer and delete callback boundary', async () => {
    const onOpenTransferDialog = vi.fn()
    renderProfileManager({ onOpenTransferDialog })
    const card = container.querySelectorAll<HTMLElement>('[data-profile-card]')[1]

    for (const action of ['내보내기', '가져오기'] as const) {
      await click(buttonByText('관리', card))
      await click(buttonByText(action, card))
      expect(onOpenTransferDialog).toHaveBeenLastCalledWith(PROFILES[1].profileId, 'transfer')
      expect(document.activeElement).toBe(buttonByText('관리', card))
    }

    await click(buttonByText('관리', card))
    await click(buttonByText('삭제', card))
    expect(onOpenTransferDialog).toHaveBeenLastCalledWith(PROFILES[1].profileId, 'delete')
    expect(document.activeElement).toBe(buttonByText('관리', card))
  })

  it('honors a parent focus request without exposing the profile identifier in the DOM', () => {
    const onFocusTargetHandled = vi.fn()
    renderProfileManager({
      focusTarget: { kind: 'manage', profileId: PROFILES[1].profileId },
      onFocusTargetHandled,
    })

    const secondCard = container.querySelectorAll<HTMLElement>('[data-profile-card]')[1]
    expect(document.activeElement).toBe(buttonByText('관리', secondCard))
    expect(onFocusTargetHandled).toHaveBeenCalledOnce()
    expect(container.innerHTML).not.toContain(PROFILES[1].profileId)
  })

  it('caps the registry at six profiles and disables the create card at the limit', () => {
    const sixProfiles = Array.from({ length: 6 }, (_, index) => ({
      profileId: `profile-${index}`,
      nickname: null,
      mascotId: PROFILE_MANAGER_MASCOT_IDS[index % PROFILE_MANAGER_MASCOT_IDS.length],
    }))
    renderProfileManager({ profiles: sixProfiles, activeProfileId: sixProfiles[0].profileId, maxProfiles: 12 })

    expect(container.querySelectorAll('[data-profile-card]')).toHaveLength(6)
    expect(buttonByText('+ 새 프로필').disabled).toBe(true)
    expect(container.textContent).toContain('프로필은 최대 6명까지')
  })
})

describe('ProfileManager creation and rename flows', () => {
  it('submits a trimmed 20-character nickname and keeps callback failures in the creation step', async () => {
    const onCreateProfile = vi.fn().mockResolvedValue(false)
    renderProfileManager({ onCreateProfile })
    await click(buttonByText('+ 새 프로필'))
    expect(container.querySelector('[data-profile-manager-step="create"]')).not.toBeNull()
    expect(container.querySelector('[data-profile-manager-step="list"]')).toBeNull()
    const input = container.querySelector<HTMLInputElement>('input[aria-label="새 프로필 닉네임"]')
    if (!input) throw new Error('Create input not found')

    act(() => changeInput(input, `  ${'가'.repeat(20)}  `))
    await click(buttonByText('프로필 만들기'))

    expect(onCreateProfile).toHaveBeenCalledWith('가'.repeat(20))
    expect(container.textContent).toContain('저장하지 못했어요')
    expect(container.querySelector('input[aria-label="새 프로필 닉네임"]')).not.toBeNull()
  })

  it('focuses the new card after successful creation and the create card after cancellation', async () => {
    function CreateHarness() {
      const [profiles, setProfiles] = useState<readonly ProfileManagerProfile[]>(PROFILES)
      return React.createElement(ProfileManager, {
          profiles,
          activeProfileId: PROFILES[0].profileId,
          onCreateProfile: (nickname) => {
            setProfiles((current) => [
              ...current,
              { profileId: 'new-profile-id', nickname, mascotId: 'lumi' },
            ])
            return true
          },
        })
    }

    act(() => root.render(React.createElement(CreateHarness)))
    const createButton = buttonByText('+ 새 프로필')
    await click(createButton)
    expect(document.activeElement).toBe(container.querySelector('input[aria-label="새 프로필 닉네임"]'))
    await click(buttonByText('취소'))
    expect(document.activeElement).toBe(buttonByText('+ 새 프로필'))

    await click(buttonByText('+ 새 프로필'))
    const input = container.querySelector<HTMLInputElement>('input[aria-label="새 프로필 닉네임"]')
    if (!input) throw new Error('Create input not found')
    act(() => changeInput(input, '루미와 함께'))
    await click(buttonByText('프로필 만들기'))

    const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-profile-card]'))
    expect(cards).toHaveLength(4)
    expect(cards[3].textContent).toContain('학습자 4')
    expect(cards[3].textContent).toContain('루미와 함께')
    expect(document.activeElement).toBe(cards[3])
  })

  it('returns rename cancellation to Manage and successful rename to the target card', async () => {
    const onRenameProfile = vi.fn().mockResolvedValue(true)
    renderProfileManager({ onRenameProfile })
    const card = container.querySelectorAll<HTMLElement>('[data-profile-card]')[1]
    const manageButton = buttonByText('관리', card)

    await click(manageButton)
    await click(buttonByText('이름 변경', card))
    expect(container.querySelector('[data-profile-manager-step="rename"]')).not.toBeNull()
    expect(container.querySelector('[data-profile-manager-step="list"]')).toBeNull()
    expect(document.activeElement).toBe(container.querySelector('input[aria-label="학습자 2 새 닉네임"]'))
    await click(buttonByText('취소'))
    const restoredCard = container.querySelectorAll<HTMLElement>('[data-profile-card]')[1]
    const restoredManageButton = buttonByText('관리', restoredCard)
    expect(document.activeElement).toBe(restoredManageButton)

    await click(restoredManageButton)
    await click(buttonByText('이름 변경', restoredCard))
    const input = container.querySelector<HTMLInputElement>('input[aria-label="학습자 2 새 닉네임"]')
    if (!input) throw new Error('Rename input not found')
    act(() => changeInput(input, '  새 이름  '))
    await click(buttonByText('이름 저장'))

    expect(onRenameProfile).toHaveBeenCalledWith(PROFILES[1].profileId, '새 이름')
    expect(document.activeElement).toBe(container.querySelectorAll<HTMLElement>('[data-profile-card]')[1])
  })

  it('announces selection callback failures without navigating or changing storage', async () => {
    const onSelectProfile = vi.fn().mockRejectedValue(new Error('write failed'))
    renderProfileManager({ onSelectProfile })

    await click(buttonByText('이 프로필로 시작', container.querySelectorAll('[data-profile-card]')[1]))

    expect(onSelectProfile).toHaveBeenCalledWith(PROFILES[1].profileId)
    expect(container.querySelector('[role="status"]')?.textContent).toContain('저장하지 못했어요')
  })
})

describe('ProfileManager boundary', () => {
  it('stays callback-driven without storage, navigation, or app-shell dependencies', () => {
    const source = readFileSync(path.resolve(__dirname, './ProfileManager.tsx'), 'utf8')
    expect(source).not.toMatch(/localStorage|sessionStorage|window\.location|location\.href|router\.push/)
    expect(source).not.toMatch(/from\s+['"](?:@\/app|\.\.\/app)/)
    expect(source).not.toMatch(/from\s+['"]next\/navigation['"]/)
    expect(source).toMatch(/onCreateProfile/)
    expect(source).toMatch(/onRenameProfile/)
    expect(source).toMatch(/onSelectProfile/)
    expect(source).toMatch(/onOpenTransferDialog/)
  })

  it('exposes a polite live region', () => {
    renderProfileManager()
    const status = container.querySelector('[role="status"]')
    expect(status?.getAttribute('aria-live')).toBe('polite')
  })
})
