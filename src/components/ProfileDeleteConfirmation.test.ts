import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import ProfileDeleteConfirmation from './ProfileDeleteConfirmation'

function renderConfirmation(overrides: Record<string, unknown> = {}): string {
  return renderToStaticMarkup(createElement(ProfileDeleteConfirmation, {
    profileLabel: '철수',
    onConfirm: () => {},
    onBack: () => {},
    ...overrides,
  }))
}

describe('ProfileDeleteConfirmation', () => {
  it('is a titled internal step rather than another modal', () => {
    const markup = renderConfirmation()
    expect(markup).toContain('aria-labelledby="profile-delete-confirmation-title"')
    expect(markup).not.toContain('role="dialog"')
    expect(markup).not.toContain('aria-modal="true"')
    expect(markup).toContain('철수 프로필을 삭제할까요?')
  })

  it('keeps the profile-only consequence wording and explicit parent back action', () => {
    const markup = renderConfirmation()
    expect(markup).toContain('이 프로필의 기록만 이 기기에서 지워져요')
    expect(markup).toContain('다른 프로필과 오프라인 팩은 그대로 남아요')
    expect(markup).toContain('삭제합니다')
    expect(markup).toContain('프로필 관리로 돌아가기')
  })

  it('announces parent-owned progress or errors and keeps every action at least 48px', () => {
    const markup = renderConfirmation({ statusMessage: '삭제하지 못했어요.' })
    expect(markup).toContain('role="status"')
    expect(markup).toContain('aria-live="polite"')
    expect(markup).toContain('삭제하지 못했어요.')
    const buttons = markup.match(/<button\b[^>]*>/g) ?? []
    expect(buttons).toHaveLength(2)
    for (const button of buttons) {
      expect(button).toContain('min-width:48px')
      expect(button).toContain('min-height:48px')
    }

    const busy = renderConfirmation({ busy: true })
    expect(busy).toContain('프로필 기록을 삭제하는 중이에요.')
    expect(busy).toContain('disabled')
  })

  it('stays callback-driven and does not import deletion or storage core', () => {
    const source = readFileSync(path.resolve(__dirname, './ProfileDeleteConfirmation.tsx'), 'utf8')
    expect(source).not.toContain('localStorage')
    expect(source).not.toContain('deleteLocalProfile')
    expect(source).not.toContain('resetAllDeviceData')
    expect(source).not.toMatch(/from\s+['"]@\/lib\//)
  })
})
