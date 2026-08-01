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
    await expect(page).toHaveURL(/unitId=g2-1-place-value&mode=practice$/)
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
    await page.goto(`${BASE_PATH}/grade/1?islandId=count-cove&mode=practice`)

    await expect(page.getByTestId('mission-problem-card')).toHaveAttribute(
      'data-mission-id',
      'count-cove-08',
    )
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
  }
})
