import { expect, test } from '@playwright/test'

const BASE_PATH = '/math_assist'
const GRADE3_PROGRESS_KEY = 'mathAssist_grade3Progress'

test('3학년 기본과 연습은 항상 열리고 잘못된 모드는 기본으로 돌아간다', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-1-add-sub&mode=unknown`)

    await expect(page.getByTestId('grade3-mode-basic')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('grade3-unit-missions').getByTestId(/grade3-mission-node-/)).toHaveCount(3)
    await expect(page.getByTestId('grade3-mission-card')).toHaveCount(1)
    await expect(page.getByTestId('grade3-mission-card')).toHaveAttribute('data-mission-id', 'g3-1-add-sub-01')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)

    await page.getByTestId('grade3-mode-practice').click()
    await expect(page).toHaveURL(/unitId=g3-1-add-sub&mode=practice/)
    await expect(page.getByTestId('grade3-mode-practice')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('grade3-unit-missions').getByTestId(/grade3-mission-node-/)).toHaveCount(3)
    await expect(page.getByTestId('grade3-mission-card')).toHaveAttribute('data-mission-id', 'g3-1-add-sub-04')
    await page.getByTestId('grade3-mission-node-2').click()
    await expect(page.getByTestId('grade3-mission-card')).toHaveAttribute('data-mission-id', 'g3-1-add-sub-07')
    await page.getByTestId('grade3-mission-node-3').click()
    await expect(page.getByTestId('grade3-mission-card')).toHaveAttribute('data-mission-id', 'g3-1-add-sub-10')
    await expect(page.getByTestId('grade3-mission-card')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
  }
})

test('3학년 기본 완료는 단원을 끝내지 않고 연습 3문제 완료가 단원을 끝낸다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(([grade3Key]) => {
    localStorage.setItem(grade3Key, JSON.stringify({
      schemaVersion: 1,
      completedMissionIds: [
        'g3-1-add-sub-01',
        'g3-1-add-sub-02',
        'g3-1-add-sub-03',
      ],
      checkedMissionIds: [
        'g3-1-add-sub-01',
        'g3-1-add-sub-02',
        'g3-1-add-sub-03',
      ],
      reviewMissionIds: [],
      latestMissionId: 'g3-1-add-sub-03',
      selectedUnitId: 'g3-1-add-sub',
      todaySolvedCount: 3,
      skillSummaryByTag: {},
      introDismissedAt: 1,
      lastPlayedAt: Date.now(),
      missionSketchRunOrdinal: 0,
    }))
    localStorage.setItem('mathAssist_grade1Progress', '{"keep":true}')
  }, [GRADE3_PROGRESS_KEY])

  await page.goto(`${BASE_PATH}/grade/3`)
  const completion = page.getByTestId('grade3-unit-completion-g3-1-add-sub')
  await expect(completion).toContainText('연습 0/3')
  await expect(completion).not.toContainText('단원 완료')
  await expect(page.getByTestId('grade3-practice-g3-1-add-sub')).toBeEnabled()

  await page.evaluate((grade3Key) => {
    const progress = JSON.parse(localStorage.getItem(grade3Key) || 'null')
    progress.completedMissionIds.push(
      'g3-1-add-sub-04',
      'g3-1-add-sub-07',
      'g3-1-add-sub-10',
    )
    progress.checkedMissionIds.push(
      'g3-1-add-sub-04',
      'g3-1-add-sub-07',
      'g3-1-add-sub-10',
    )
    localStorage.setItem(grade3Key, JSON.stringify(progress))
  }, GRADE3_PROGRESS_KEY)
  await page.reload()

  await expect(completion).toHaveText('단원 완료')
  expect(await page.evaluate(() => localStorage.getItem('mathAssist_grade1Progress'))).toBe('{"keep":true}')
})

test('3학년 연습 3문제를 모두 확인하면 오답 복습이 남아도 단원을 완료한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate((grade3Key) => {
    const practiceIds = [
      'g3-1-add-sub-04',
      'g3-1-add-sub-07',
      'g3-1-add-sub-10',
    ]
    localStorage.setItem(grade3Key, JSON.stringify({
      schemaVersion: 1,
      completedMissionIds: [],
      checkedMissionIds: practiceIds,
      reviewMissionIds: practiceIds,
      latestMissionId: 'g3-1-add-sub-10',
      selectedUnitId: 'g3-1-add-sub',
      todaySolvedCount: 0,
      skillSummaryByTag: {},
      introDismissedAt: 1,
      lastPlayedAt: Date.now(),
      missionSketchRunOrdinal: 0,
    }))
  }, GRADE3_PROGRESS_KEY)

  await page.goto(`${BASE_PATH}/grade/3`)

  await expect(page.getByTestId('grade3-practice-g3-1-add-sub')).toHaveText('연습 3/3')
  await expect(page.getByTestId('grade3-unit-completion-g3-1-add-sub')).toHaveText('단원 완료')
})

test('3학년 이전 저장 기록의 최근 미션을 K/A/R 3문제 안에서 다시 연다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate((grade3Key) => {
    localStorage.setItem(grade3Key, JSON.stringify({
      schemaVersion: 1,
      completedMissionIds: [],
      reviewMissionIds: ['g3-2-capacity-weight-05'],
      latestMissionId: 'g3-2-capacity-weight-05',
      selectedUnitId: 'g3-2-capacity-weight',
      todaySolvedCount: 0,
      skillSummaryByTag: {},
      introDismissedAt: 1,
      lastPlayedAt: Date.now(),
      missionSketchRunOrdinal: 0,
    }))
  }, GRADE3_PROGRESS_KEY)

  await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-2-capacity-weight&mode=basic`)

  await expect(page.getByTestId('grade3-unit-missions').getByTestId(/grade3-mission-node-/)).toHaveCount(3)
  await expect(page.getByTestId('grade3-mission-card')).toHaveAttribute(
    'data-mission-id',
    'g3-2-capacity-weight-05',
  )
})

test('3학년 이전 미션이 들어간 실제 연습 3문제를 모두 확인하면 단원을 완료한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate((grade3Key) => {
    localStorage.setItem(grade3Key, JSON.stringify({
      schemaVersion: 1,
      completedMissionIds: [],
      reviewMissionIds: ['g3-2-capacity-weight-05'],
      latestMissionId: 'g3-2-capacity-weight-05',
      selectedUnitId: 'g3-2-capacity-weight',
      todaySolvedCount: 0,
      skillSummaryByTag: {},
      introDismissedAt: 1,
      lastPlayedAt: Date.now(),
      missionSketchRunOrdinal: 0,
    }))
  }, GRADE3_PROGRESS_KEY)

  await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-2-capacity-weight&mode=practice`)
  const visibleMissionIds: string[] = []
  for (const order of [1, 2, 3]) {
    await page.getByTestId(`grade3-mission-node-${order}`).click()
    visibleMissionIds.push(
      await page.getByTestId('grade3-mission-card').getAttribute('data-mission-id') ?? '',
    )
  }
  expect(visibleMissionIds).toEqual([
    'g3-2-capacity-weight-02',
    'g3-2-capacity-weight-05',
    'g3-2-capacity-weight-07',
  ])

  await page.evaluate(([grade3Key, missionIds]) => {
    const progress = JSON.parse(localStorage.getItem(grade3Key) || 'null')
    progress.checkedMissionIds = missionIds
    progress.reviewMissionIds = missionIds
    localStorage.setItem(grade3Key, JSON.stringify(progress))
  }, [GRADE3_PROGRESS_KEY, visibleMissionIds] as const)
  await page.goto(`${BASE_PATH}/grade/3`)

  await expect(page.getByTestId('grade3-practice-g3-2-capacity-weight')).toHaveText('연습 3/3')
  await expect(page.getByTestId('grade3-unit-completion-g3-2-capacity-weight')).toHaveText('단원 완료')
})
