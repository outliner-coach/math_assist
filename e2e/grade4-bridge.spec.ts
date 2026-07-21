import { expect, test } from '@playwright/test'

const BASE_PATH = '/math_assist'
const PROGRESS_KEY = 'mathAssist_grade4Progress'
const RECEIPT_KEY = 'mathAssist_attemptReceipts_v1'

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(() => localStorage.clear())
})

test('홈에서 4학년을 골라 세 번의 탭 안에 3문제 Bridge 활동에 들어간다', async ({ page }) => {
  let taps = 0
  await page.goto(`${BASE_PATH}/home`)
  await expect(page.getByTestId('grade-picker')).toBeVisible()

  await page.getByTestId('choose-grade-4').click(); taps += 1
  await expect(page.getByTestId('home-primary-action')).toHaveAttribute('href', /\/math_assist\/grade\/4\/?$/)
  await page.getByTestId('home-primary-action').click(); taps += 1
  await expect(page).toHaveURL(/\/math_assist\/grade\/4\/?$/)
  await expect(page.getByText('Bridge · Released')).toBeVisible()
  await expect(page.getByText('현재 공개 범위')).toBeVisible()
  await expect(page.getByText(/Release candidate|공개 준비 범위/)).toHaveCount(0)
  await page.getByTestId('grade4-unit-card-unit-4-1-large-numbers').click(); taps += 1

  await expect(page).toHaveURL(/\/math_assist\/grade\/4\/mission\/?\?unitId=unit-4-1-large-numbers/)
  await expect(page.getByTestId('grade4-mission-card')).toBeVisible()
  await expect(page.getByText('활동 1 · 1/3')).toBeVisible()
  expect(taps).toBeLessThanOrEqual(3)
})

test('4학년 진행은 reload와 홈 hydration 뒤 같은 문제로 이어진다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/4/mission?unitId=unit-4-1-large-numbers`)
  await page.getByTestId('grade4-integer-input').fill('283056')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-big-07')

  await page.reload()
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-big-07')
  await page.goto(`${BASE_PATH}/home`)
  await expect(page.getByTestId('change-grade')).toContainText('4학년')
  await expect(page.getByTestId('home-primary-action')).toHaveAttribute('href', /\/math_assist\/grade\/4\/mission\/?\?unitId=unit-4-1-large-numbers$/)
  await page.getByTestId('home-primary-action').click()
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-big-07')
})

test('손상된 4학년 기록을 홈에서 읽어도 다른 학년 원문과 손상 원문을 보존한다', async ({ page }) => {
  await page.evaluate(({ progressKey }) => {
    localStorage.setItem('mathAssist_guestHome_v1', JSON.stringify({ activeGrade: 4 }))
    localStorage.setItem(progressKey, '{broken')
    localStorage.setItem('mathAssist_grade1Progress', '{"completedStageIds":["g1-safe"]}')
    localStorage.setItem('mathAssist_progress_v1', '{"g5-safe":{"conceptId":"g5-safe","lastCompletedAt":400,"needsReview":false}}')
  }, { progressKey: PROGRESS_KEY })

  await page.goto(`${BASE_PATH}/home`)
  await expect(page.getByTestId('change-grade')).toContainText('4학년')
  const raw = await page.evaluate(({ progressKey }) => ({
    grade4: localStorage.getItem(progressKey),
    grade1: localStorage.getItem('mathAssist_grade1Progress'),
    grade5: localStorage.getItem('mathAssist_progress_v1'),
  }), { progressKey: PROGRESS_KEY })
  expect(raw).toEqual({
    grade4: '{broken',
    grade1: '{"completedStageIds":["g1-safe"]}',
    grade5: '{"g5-safe":{"conceptId":"g5-safe","lastCompletedAt":400,"needsReview":false}}',
  })
})

test('4학년 Bridge는 형식 오류를 기록하지 않고 오답과 정답을 별도 영수증으로 남긴다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/4/mission?unitId=unit-4-1-large-numbers`)
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-big-02')

  await page.getByTestId('grade4-integer-input').fill('-')
  await page.getByTestId('grade4-integer-submit').click()
  await expect(page.getByTestId('grade4-input-error')).toBeVisible()
  expect(await page.evaluate((key) => localStorage.getItem(key), RECEIPT_KEY)).toBeNull()

  await page.getByTestId('grade4-integer-input').fill('1')
  await page.getByTestId('grade4-integer-submit').click()
  await expect(page.getByTestId('grade4-wrong-feedback')).toBeVisible()

  await page.getByTestId('grade4-integer-input').fill('283056')
  await page.getByTestId('grade4-integer-submit').click()
  await expect(page.getByTestId('grade4-solution')).toBeVisible()

  await expect.poll(async () => page.evaluate((key) => {
    const ledger = JSON.parse(localStorage.getItem(key) ?? '{"receipts":[]}')
    return ledger.receipts.length
  }, RECEIPT_KEY)).toBe(2)

  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.ledger.receipts.map((receipt: { attemptOrdinal: number; correct: boolean; usedHint: boolean }) => ({ ordinal: receipt.attemptOrdinal, correct: receipt.correct, usedHint: receipt.usedHint })))
    .toEqual([{ ordinal: 0, correct: false, usedHint: false }, { ordinal: 1, correct: true, usedHint: true }])
  expect(JSON.stringify(stored.ledger)).not.toContain('283056')
  expect(JSON.stringify(stored.ledger)).not.toContain('strokes')
  expect(stored.progress.completedVariantKeys).toContain('g4-big-02:seed-20260721:variant-8')
  expect(stored.progress.reviewVariantKeys).toContain('g4-big-02:seed-20260721:variant-8')
})

test('4학년 활동은 알기·적용·추론 3문제를 끝내고 새 변형으로 이어진다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/4/mission?unitId=invalid-unit`)
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-big-02')

  await page.getByTestId('grade4-integer-input').fill('283056')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-big-07')

  await page.getByTestId('grade4-integer-input').fill('20300')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-big-10')

  await page.getByTestId('grade4-choice-십만의 자리에서 3<4이므로 왼쪽 수가 더 작아요.').click()
  await page.getByTestId('grade4-next-mission').click()
  await expect(page.getByTestId('grade4-activity-complete')).toBeVisible()
  await page.getByTestId('grade4-next-activity').click()
  await expect(page.getByText('활동 2 · 1/3')).toBeVisible()
})

test('4학년 선택과 활동 화면은 작은 태블릿 폭에서 가로로 넘치지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of ['/home', '/grade/4', '/grade/4/mission?unitId=unit-4-1-large-numbers']) {
    await page.goto(`${BASE_PATH}${route}`)
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})
