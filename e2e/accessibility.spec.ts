import { expect, test, type Page } from '@playwright/test'

import AxeBuilder from '@axe-core/playwright'

const BASE_PATH = '/math_assist'
const AXE_TAGS = ['wcag2a', 'wcag2aa'] as const

const SCANNED_PATHS = ['/', '/home/', '/grade/3/', '/review/problems/'] as const

async function analyzePath(page: Page, path: string): Promise<string[]> {
  await page.goto(`${BASE_PATH}${path}`)
  const results = await new AxeBuilder({ page })
    .withTags([...AXE_TAGS])
    .analyze()
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
  )
}

async function analyzeCurrentPage(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page })
    .withTags([...AXE_TAGS])
    .analyze()
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
  )
}

for (const path of SCANNED_PATHS) {
  test(`axe WCAG 2.x A/AA 위반 0건: ${path}`, async ({ page }) => {
    test.setTimeout(90_000)
    const violations = await analyzePath(page, path)
    expect(violations).toEqual([])
  })
}

test('키보드만으로 홈 기본 학습 행동에 포커스가 도달한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('mathAssist_guestHome_v1', JSON.stringify({ activeGrade: 2 }))
  })
  await page.goto(`${BASE_PATH}/home/`)
  await expect(page.getByTestId('home-primary-action')).toBeVisible()

  let reached = false
  for (let presses = 0; presses < 30 && !reached; presses += 1) {
    await page.keyboard.press('Tab')
    reached = await page.evaluate(() =>
      document.activeElement instanceof HTMLElement
      && document.activeElement.getAttribute('data-testid') === 'home-primary-action',
    )
  }
  expect(reached).toBe(true)
})

test('프로필 관리 목록과 내부 단계는 axe 위반·중첩 modal 없이 키보드 초점을 가둔다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(() => {
    const profileA = 'local_11111111-1111-4111-8111-111111111111'
    const profileB = 'local_22222222-2222-4222-9222-222222222222'
    localStorage.clear()
    localStorage.setItem('mathAssist_profiles_v1', JSON.stringify({
      schemaVersion: 1,
      activeProfileId: profileA,
      profiles: [
        { profileId: profileA, nickname: '같은 이름', createdAt: 1, updatedAt: 1 },
        { profileId: profileB, nickname: '같은 이름', createdAt: 2, updatedAt: 2 },
      ],
      migration: { schemaVersion: 1, status: 'not-needed', targetProfileId: null, backupKey: null },
    }))
  })
  await page.goto(`${BASE_PATH}/home/`)

  const chip = page.getByTestId('profile-chip')
  await chip.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: '학습자 프로필 관리' })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await expect(page.getByRole('button', { name: '학습자 프로필 관리 닫기' })).toBeFocused()
  expect(await analyzeCurrentPage(page)).toEqual([])

  await page.keyboard.press('Shift+Tab')
  expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)).toBe(true)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '학습자 프로필 관리 닫기' })).toBeFocused()

  const secondCard = page.locator('[data-profile-card-ordinal="2"]')
  await secondCard.getByRole('button', { name: /관리$/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: '이름 변경' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: '내보내기' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('profile-transfer-dialog')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(1)
  expect(await analyzeCurrentPage(page)).toEqual([])

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(chip).toBeFocused()
})
