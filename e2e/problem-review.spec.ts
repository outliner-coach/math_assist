import { expect, test } from '@playwright/test'

const BASE_PATH = '/math_assist'

test('내부 검수 화면은 세 학년 family와 읽기 전용 검수 근거를 표시한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/review/problems`)

  await expect(page.getByTestId('application-problem-review')).toBeVisible()
  await expect(page.getByText('세 학년 응용문제 검수')).toBeVisible()
  await expect(page.getByText('대표 family 9개')).toBeVisible()
  for (const label of ['학년', '단원', '유형(family)', '버전', '인지영역', '추론패턴', '성취기준', '증명 방식', '출시 상태']) {
    await expect(page.getByLabel(label)).toBeVisible()
  }

  await expect(page.getByTestId('review-problem-card')).toHaveCount(9)
  await expect(page.getByText('자동 검사 근거').first()).toBeVisible()
  await expect(page.getByTestId('review-visual-before').first()).toBeVisible()
  await expect(page.getByTestId('review-visual-after').first()).toBeVisible()
})

test('내부 검수 화면은 등록 행으로 실제 필터링하고 학습자 동선이나 승인 저장을 제공하지 않는다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/review/problems`)

  await page.getByLabel('학년').selectOption('6')
  await expect(page.getByTestId('review-problem-card')).toHaveCount(3)
  await expect(page.getByTestId('review-problem-card').first()).toContainText('6학년')

  await expect(page.getByRole('button', { name: /승인|저장|출시/ })).toHaveCount(0)
  const learnerLinks = page.locator('a[href^="/home"], a[href^="/grade"], a[href^="/concept"], a[href^="/practice"], a[href^="/mission"]')
  await expect(learnerLinks).toHaveCount(0)
})

test('390×844와 1024×768 검수 화면은 가로 넘침이나 고정 행동 가림이 없다', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/review/problems`)
    await expect(page.getByTestId('application-problem-review')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    const gradeFilter = page.getByLabel('학년')
    expect((await gradeFilter.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(40)
  }
})
