import { expect, test, type Page } from '@playwright/test'

const BASE_PATH = '/math_assist'
const GRADE5_KEYS = [
  'mathAssist_currentSession',
  'mathAssist_lastResult',
  'mathAssist_progress_v1',
] as const
const GRADE6_KEYS = [
  'mathAssist_grade6CurrentSession',
  'mathAssist_grade6LastResult',
  'mathAssist_grade6Progress',
] as const

async function clearStorage(page: Page) {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(() => localStorage.clear())
}

async function readKeys(page: Page, keys: readonly string[]) {
  return page.evaluate((storageKeys) => storageKeys.map((key) => localStorage.getItem(key)), [...keys])
}

async function enterKeypadAnswer(page: Page, answer: string) {
  await page.getByTestId('keypad-display').click()
  for (const character of answer) {
    await page.getByTestId(`key-${encodeURIComponent(character)}`).click()
  }
}

test.beforeEach(async ({ page }) => {
  await clearStorage(page)
})

test('홈에서 6학년을 선택해 단원·개념·기본 5문제까지 진입한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await expect(page.getByText(/1·2·3·4·5·6학년 수학/)).toBeVisible()
  await page.goto(`${BASE_PATH}/home`)
  await page.getByTestId('choose-grade-6').click()
  await expect(page.getByTestId('home-primary-action')).toHaveAttribute('href', /\/grade\/6\/?$/)
  await page.getByTestId('home-primary-action').click()

  await expect(page.getByTestId('grade6-study-home')).toBeVisible()
  await page.getByTestId('grade6-unit-unit-6-1-ratio').click()
  await expect(page.getByText('개념 선택 (1개)')).toBeVisible()
  await page.getByRole('link', { name: /학습하기/ }).click()
  await expect(page.getByRole('button', { name: '세트 A · 5문제' })).toBeVisible()

  await page.getByRole('button', { name: '세트 A · 5문제' }).click()
  await expect(page.getByTestId('practice-session')).toHaveAttribute('data-experience-preset', 'study')
  const grade6Session = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), GRADE6_KEYS[0])
  expect(grade6Session).toMatchObject({ grade: 6, itemCount: 5, conceptId: 'g6ratio-001', setId: 'A' })
  expect(grade6Session.problems).toHaveLength(5)
  expect(await readKeys(page, GRADE5_KEYS)).toEqual([null, null, null])
})

test('10문제 세트의 실제 비율 표를 렌더링하고 답 전용 metadata를 노출하지 않는다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/g6ratio-001?set=A&count=10`)
  await expect(page.getByTestId('practice-session')).toBeVisible()
  const tableIndex = await page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return session.problems.findIndex((problem: { visual?: { type?: string } }) => problem.visual?.type === 'ratio_table')
  }, GRADE6_KEYS[0])
  expect(tableIndex).toBeGreaterThanOrEqual(0)

  await page.getByTestId(`progress-step-${tableIndex + 1}`).click()
  const table = page.getByTestId('problem-diagram-ratio-table')
  await expect(table).toBeVisible()
  await expect(table.getByRole('table')).toBeVisible()
  await expect(table.getByRole('columnheader')).toHaveCount(3)
  await expect(page.locator('[data-answer]')).toHaveCount(0)
  await expect(page.getByText('정답:', { exact: false })).toHaveCount(0)
})

test('손상된 6학년 세션은 원문을 보존하고 명시적 초기화 뒤에만 새로 저장한다', async ({ page }) => {
  await page.evaluate(({ grade5Key, grade6Key }) => {
    localStorage.setItem(grade5Key, '{"keep":"grade5"}')
    localStorage.setItem(grade6Key, '{corrupt-grade6-session')
  }, { grade5Key: GRADE5_KEYS[0], grade6Key: GRADE6_KEYS[0] })

  await page.goto(`${BASE_PATH}/practice/g6ratio-001?set=B&count=5`)
  await expect(page.getByTestId('grade6-session-recovery')).toBeVisible()
  expect(await page.evaluate((key) => localStorage.getItem(key), GRADE6_KEYS[0])).toBe('{corrupt-grade6-session')
  expect(await page.evaluate((key) => localStorage.getItem(key), GRADE5_KEYS[0])).toBe('{"keep":"grade5"}')

  await page.getByTestId('reset-grade6-session').click()
  await expect(page.getByTestId('practice-session')).toBeVisible()
  const recovered = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), GRADE6_KEYS[0])
  expect(recovered).toMatchObject({ grade: 6, itemCount: 5, setId: 'B' })
  expect(await page.evaluate((key) => localStorage.getItem(key), GRADE5_KEYS[0])).toBe('{"keep":"grade5"}')
})

test('5문제를 모두 확인하면 6학년 결과와 진도만 격리 저장한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/g6ratio-001?set=C&count=5`)
  await expect(page.getByTestId('practice-session')).toBeVisible()

  for (let index = 0; index < 5; index += 1) {
    const answer = await page.evaluate(({ key, itemIndex }) => {
      const session = JSON.parse(localStorage.getItem(key) ?? 'null')
      return String(session.problems[itemIndex].correctAnswer)
    }, { key: GRADE6_KEYS[0], itemIndex: index })
    await enterKeypadAnswer(page, answer)
    await page.getByTestId('check-answer-button').click()
    if (index < 4) await page.getByTestId('next-button').click()
  }

  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL(new RegExp(`${BASE_PATH}/result/\\?grade=6$`))
  await expect(page.getByTestId('score')).toContainText('5')
  const result = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), GRADE6_KEYS[1])
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), GRADE6_KEYS[2])
  expect(result).toMatchObject({ grade: 6, itemCount: 5, score: 5, total: 5 })
  expect(progress['g6ratio-001']).toMatchObject({ latestScore: 100, needsReview: false })
  expect(await readKeys(page, GRADE5_KEYS)).toEqual([null, null, null])
})

test('390px와 1024px에서 가로 넘침 없이 48px 뒤로가기와 하단 행동을 유지한다', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/concept/g6ratio-001`)
    const backLink = page.getByRole('link', { name: '단원으로 돌아가기' })
    await expect(backLink).toBeVisible()
    expect((await backLink.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)

    const action = page.getByRole('button', { name: '세트 A · 5문제' })
    expect((await action.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48)
  }
})
