import { expect, test, type Page } from '@playwright/test'

const BASE_PATH = '/math_assist'
const SESSION_KEY = 'mathAssist_currentSession'
const RESULT_KEY = 'mathAssist_lastResult'

type StoredProblem = {
  type: 'choice' | 'number'
  correctAnswer: string
  correctChoiceIndex?: number
}

type StoredSession = {
  currentIndex: number
  problems: StoredProblem[]
}

type AnswerMode = 'correct' | 'wrong'

async function clearStorage(page: Page) {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(() => localStorage.clear())
}

async function readSession(page: Page): Promise<StoredSession> {
  await page.waitForFunction((key) => Boolean(localStorage.getItem(key)), SESSION_KEY)
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), SESSION_KEY)
}

async function readResult(page: Page) {
  await page.waitForFunction((key) => Boolean(localStorage.getItem(key)), RESULT_KEY)
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), RESULT_KEY)
}

async function pressKeypadButton(page: Page, char: string) {
  await page.getByTestId(`key-${encodeURIComponent(char)}`).click()
}

async function enterNumberAnswer(page: Page, answer: string) {
  await page.getByTestId('keypad-display').click()
  for (const char of answer) {
    await pressKeypadButton(page, char)
  }
  await page.getByTestId('key-done').click()
}

function wrongNumberAnswer(correctAnswer: string): string {
  return correctAnswer === '999999' ? '999998' : '999999'
}

async function answerCurrentProblem(page: Page, mode: AnswerMode) {
  const session = await readSession(page)
  const problem = session.problems[session.currentIndex]

  if (problem.type === 'choice') {
    const correctIndex = problem.correctChoiceIndex ?? 0
    const choiceIndex = mode === 'correct' ? correctIndex : (correctIndex + 1) % 4
    await page.getByTestId(`choice-${choiceIndex}`).click()
    return
  }

  await enterNumberAnswer(
    page,
    mode === 'correct' ? problem.correctAnswer : wrongNumberAnswer(problem.correctAnswer)
  )
}

async function completeSession(page: Page, wrongIndexes: number[] = []) {
  const session = await readSession(page)

  for (let index = 0; index < session.problems.length; index++) {
    await answerCurrentProblem(page, wrongIndexes.includes(index) ? 'wrong' : 'correct')

    if (index < session.problems.length - 1) {
      await page.getByTestId('next-button').click()
    } else {
      await expect(page.getByTestId('submit-button')).toBeEnabled()
      await page.getByTestId('submit-button').click()
    }
  }
}

test.beforeEach(async ({ page }) => {
  await clearStorage(page)
})

test('표준 10문항 완료 후 행동 중심 결과 화면이 보인다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/divisor-001?set=A`)
  await completeSession(page, [0, 2])

  await expect(page).toHaveURL(/\/math_assist\/result$/)
  await expect(page.getByTestId('score')).toBeVisible()
  await expect(page.getByTestId('retry-wrong-button')).toBeVisible()
  await expect(page.getByTestId('wrong-results')).toBeVisible()

  const result = await readResult(page)
  expect(result.mode).toBe('standard')
  expect(result.total).toBe(10)
  expect(result.wrongCount).toBe(2)
  expect(result.results[0].problem).toBeTruthy()
})

test('결과 화면에서 틀린 문제만 다시 풀 수 있다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/divisor-001?set=A`)
  await completeSession(page, [1, 4])

  await page.getByTestId('retry-wrong-button').click()
  await expect(page).toHaveURL(/mode=retry-wrong/)

  const retrySession = await readSession(page)
  expect(retrySession.problems).toHaveLength(2)

  await completeSession(page)

  await expect(page).toHaveURL(/\/math_assist\/result$/)
  await expect(page.getByTestId('retry-wrong-button')).toHaveCount(0)

  const retryResult = await readResult(page)
  expect(retryResult.mode).toBe('retry-wrong')
  expect(retryResult.wrongCount).toBe(0)
  expect(retryResult.total).toBe(2)
})

test('결과 없이 직접 접근하면 안내 메시지를 보여준다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/result`)

  await expect(page.getByText('결과를 찾을 수 없습니다.')).toBeVisible()
  await expect(page.getByRole('button', { name: '홈으로 돌아가기' })).toBeVisible()
})

test('만점 결과에서는 오답 재도전 대신 새 세트 액션만 노출된다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/divisor-001?set=A`)
  await completeSession(page)

  await expect(page).toHaveURL(/\/math_assist\/result$/)
  await expect(page.getByTestId('retry-wrong-button')).toHaveCount(0)
  await expect(page.getByTestId('practice-more-button')).toBeVisible()

  const result = await readResult(page)
  expect(result.wrongCount).toBe(0)
  expect(result.score).toBe(10)
})
