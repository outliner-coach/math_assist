import { expect, test } from '@playwright/test'

const BASE_PATH = '/math_assist'
const MASCOT_KEY = 'mathAssist_mascot_v1'

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(() => localStorage.clear())
})
test('수리·모아·루미를 소개하고 선택한 친구를 전 학년 경험 프리셋에 연결한다', async ({ page }) => {
  await expect(page.getByTestId('landing-mascot-lineup')).toBeVisible()
  await expect(page.getByAltText('수달 수리, 부엉이 모아, 여우 루미가 함께 인사하는 모습')).toBeVisible()

  await page.goto(`${BASE_PATH}/home`)
  await page.getByTestId('choose-grade-4').click()
  await expect(page.getByTestId('mascot-picker')).toBeVisible()
  await page.getByTestId('choose-mascot-lumi').click()
  await expect(page.getByTestId('choose-mascot-lumi')).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate((key) => localStorage.getItem(key), MASCOT_KEY)).toBe(JSON.stringify({ avatarId: 'lumi' }))

  await page.getByTestId('home-primary-action').click()
  const companion = page.getByTestId('service-mascot')
  await expect(companion).toHaveAttribute('data-mascot-id', 'lumi')
  await expect(companion).toHaveAttribute('data-mascot-mode', 'companion')
  await expect(companion).toHaveAttribute('data-mascot-state', 'think')

  await page.getByTestId('grade4-unit-card-unit-4-1-large-numbers').click()
  await page.getByTestId('grade4-show-hint').click()
  await expect(companion).toHaveAttribute('data-mascot-state', 'hint')
})

test('정답 결과는 캐릭터 반응만 바꾸고 선택 저장은 그대로 유지한다', async ({ page }) => {
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ avatarId: 'moa' })), MASCOT_KEY)
  await page.goto(`${BASE_PATH}/grade/4/mission?unitId=unit-4-1-large-numbers`)

  const companion = page.getByTestId('service-mascot')
  await expect(companion).toHaveAttribute('data-mascot-id', 'moa')
  await page.getByTestId('grade4-integer-input').fill('1')
  await page.getByTestId('grade4-integer-submit').click()
  await expect(companion).toHaveAttribute('data-mascot-state', 'recover')

  await page.getByTestId('grade4-integer-input').fill('283056')
  await page.getByTestId('grade4-integer-submit').click()
  await expect(companion).toHaveAttribute('data-mascot-state', 'celebrate')
  expect(await page.evaluate((key) => localStorage.getItem(key), MASCOT_KEY)).toBe(JSON.stringify({ avatarId: 'moa' }))
})
