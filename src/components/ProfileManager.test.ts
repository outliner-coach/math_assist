import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  resolveProfileDisplayName,
  validateProfileNickname,
} from './ProfileManager'

import ProfileManager from './ProfileManager'

const PROFILES = [
  { profileId: 'local_11111111-1111-4111-8111-111111111111', nickname: '철수' },
  { profileId: 'local_22222222-2222-4222-9222-222222222222', nickname: null },
]

function renderProfileManager(): string {
  return renderToStaticMarkup(createElement(ProfileManager, {
    profiles: PROFILES,
    activeProfileId: PROFILES[0].profileId,
    maxProfiles: 3,
  }))
}

describe('validateProfileNickname', () => {
  it('trims and accepts 1-20 character nicknames', () => {
    expect(validateProfileNickname('  수리 굿  ')).toEqual({ ok: true, value: '수리 굿' })
    expect(validateProfileNickname('가'.repeat(20))).toEqual({ ok: true, value: '가'.repeat(20) })
  })

  it('maps blank input to no nickname and rejects over-length values', () => {
    expect(validateProfileNickname('   ')).toEqual({ ok: true, value: null })
    const tooLong = validateProfileNickname('가'.repeat(21))
    expect(tooLong.ok).toBe(false)
  })
})

describe('resolveProfileDisplayName', () => {
  it('falls back to the ordinal learner label', () => {
    expect(resolveProfileDisplayName(PROFILES[0], 0)).toBe('철수')
    expect(resolveProfileDisplayName(PROFILES[1], 1)).toBe('학습자 2')
  })
})

describe('ProfileManager markup', () => {
  it('renders an accessible profile list with display names and the active marker', () => {
    const markup = renderProfileManager()
    expect(markup).toContain('aria-label="학습자 프로필"')
    expect(markup).toContain('철수')
    expect(markup).toContain('학습자 2')
    expect(markup).toContain('현재 사용 중')
  })

  it('uses native keyboard-operable buttons with 48px touch targets', () => {
    const markup = renderProfileManager()
    expect(markup).toContain('<button')
    expect(markup).toContain('type="button"')
    expect(markup).toContain('min-width:48px')
    expect(markup).toContain('min-height:48px')
  })

  it('disables selecting the active profile and offers rename, transfer and delete entries', () => {
    const markup = renderProfileManager()
    expect(markup).toContain('disabled')
    expect(markup).toContain('이름 바꾸기')
    expect(markup).toContain('내보내기·가져오기')
    expect(markup).toContain('삭제')
  })

  it('announces state changes through a polite live region', () => {
    const markup = renderProfileManager()
    expect(markup).toContain('role="status"')
    expect(markup).toContain('aria-live="polite"')
  })

  it('offers profile creation and stays silent about routing or storage details', () => {
    const markup = renderProfileManager()
    expect(markup).toContain('프로필 만들기')
    expect(markup).not.toContain('/home/')
    expect(markup).not.toContain('localStorage')
  })

  it('stays unwired from app shell modules', () => {
    const source = readFileSync(path.resolve(__dirname, './ProfileManager.tsx'), 'utf8')
    expect(source).not.toContain("from '../app")
    expect(source).toMatch(/import\s+\{[^}]*\}\s+from\s+'react'/)
    expect(source).not.toMatch(/import\s+[^;]*app\//)
  })
})
