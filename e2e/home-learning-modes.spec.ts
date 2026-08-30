import { expect, test } from '@playwright/test'

const BASE_PATH = '/math_assist'

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1024, height: 768 },
] as const

test('홈은 기본을 마친 2학년 학습자에게 잠금 없는 연습 선택을 추천한다', async ({ page }) => {
  const unitId = 'g2-1-place-value'
  const basicIds = Array.from({ length: 6 }, (_, index) => `${unitId}-0${index + 1}`)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/`)
    await page.evaluate(({ ids, selectedUnitId }) => {
      localStorage.clear()
      localStorage.setItem('mathAssist_guestHome_v1', JSON.stringify({ activeGrade: 2 }))
      localStorage.setItem('mathAssist_grade2Progress', JSON.stringify({
        schemaVersion: 4,
        completedMissionIds: ids,
        checkedMissionIds: ids,
        completedUnitIds: [],
        reviewMissionIds: [],
        latestMissionId: ids.at(-1),
        selectedUnitId,
        todaySolvedCount: ids.length,
        skillSummaryByTag: {},
        lastPlayedAt: Date.now(),
      }))
    }, { ids: basicIds, selectedUnitId: unitId })

    await page.goto(`${BASE_PATH}/home`)
    await expect(page.getByTestId('home-mode-choices')).toBeVisible()
    await expect(page.getByTestId('home-basic-action')).toContainText('기본 6문제')
    await expect(page.getByTestId('home-basic-action')).toContainText('완주')
    await expect(page.getByTestId('home-practice-action')).toContainText('연습 6문제')
    await expect(page.getByTestId('home-practice-action')).toContainText('열림')
    await expect(page.getByTestId('home-practice-action')).toHaveAttribute('aria-current', 'step')
    await expect(page.getByTestId('home-primary-action')).toHaveAttribute(
      'href',
      /\/math_assist\/grade\/2\/mission\/?\?unitId=g2-1-place-value&mode=practice$/,
    )
    await expect(page.getByTestId('home-basic-action')).toHaveAttribute('href', /mode=basic$/)
    await expect(page.getByTestId('home-practice-action')).toHaveAttribute('href', /mode=practice$/)
    await expect(page.getByTestId('home-progress-summary').locator('article').first()).toContainText('0개')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)

    await page.getByTestId('home-practice-action').click()
    await expect(page).toHaveURL(
      /unitId=g2-1-place-value&mode=practice$/,
      { timeout: 15_000 },
    )
    await expect(page.getByTestId('grade2-mode-practice')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute(
      'data-mission-id',
      'g2-1-place-value-01-v1',
    )
  }
})

test('1학년 홈용 섬·모드 링크는 요청한 연습 7문제로 바로 진입한다', async ({ page }) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/`)
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem('mathAssist_guestHome_v1', JSON.stringify({ activeGrade: 1 }))
    })
    await page.goto(`${BASE_PATH}/home`)

    await expect(page.getByText('98개 미션', { exact: true })).toBeVisible()
    await expect(page.getByTestId('home-basic-action')).toContainText('기본 7문제')
    await expect(page.getByTestId('home-practice-action')).toContainText('연습 7문제')
    await page.getByTestId('home-practice-action').click()

    await expect(page.getByTestId('mission-problem-card')).toHaveAttribute(
      'data-mission-id',
      'count-cove-08',
    )
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
  }
})

test('오프라인 학습 준비는 학년별 카드와 48px 행동을 반응형으로 보여 준다', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', error => browserErrors.push(error.message))

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/home`)

    const manager = page.getByTestId('offline-pack-manager')
    const cards = manager.locator('[data-testid^="offline-pack-grade-"]')
    await expect(manager).toBeVisible()
    await expect(manager.getByRole('heading', { name: '오프라인 학습 준비' })).toBeVisible()
    await expect(manager).toContainText('인터넷이 잠시 끊겨도 학습을 이어갈 수 있어요.')
    await expect(cards).toHaveCount(6)
    await expect(manager.getByRole('button', { name: /학년 오프라인 팩/ })).toHaveCount(6)

    const cardBoxes = await cards.evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect()
      return { left: rect.left, top: rect.top, right: rect.right }
    }))
    const buttonHeights = await manager.getByRole('button', { name: /학년 오프라인 팩/ }).evaluateAll(
      elements => elements.map(element => element.getBoundingClientRect().height),
    )

    expect(buttonHeights.every(height => height >= 48)).toBe(true)
    expect(cardBoxes.every(box => box.left >= 0 && box.right <= viewport.width)).toBe(true)
    if (viewport.width === 390) {
      expect(new Set(cardBoxes.map(box => Math.round(box.top))).size).toBe(6)
    } else {
      expect(new Set(cardBoxes.slice(0, 3).map(box => Math.round(box.top))).size).toBe(1)
      expect(cardBoxes[3].top).toBeGreaterThan(cardBoxes[0].top)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
  }

  expect(browserErrors).toEqual([])
})
