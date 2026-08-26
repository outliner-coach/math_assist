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
