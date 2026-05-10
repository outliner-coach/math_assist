import { expect, test, type Page } from '@playwright/test'

const BASE_PATH = '/math_assist'
const SESSION_KEY = 'mathAssist_currentSession'
const RESULT_KEY = 'mathAssist_lastResult'
const GRADE1_PROGRESS_KEY = 'mathAssist_grade1Progress'
const GRADE2_PROGRESS_KEY = 'mathAssist_grade2Progress'

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

  await expect(page).toHaveURL(/\/math_assist\/result\/?$/)
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

  await expect(page).toHaveURL(/\/math_assist\/result\/?$/)
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

  await expect(page).toHaveURL(/\/math_assist\/result\/?$/)
  await expect(page.getByTestId('retry-wrong-button')).toHaveCount(0)
  await expect(page.getByTestId('practice-more-button')).toBeVisible()

  const result = await readResult(page)
  expect(result.wrongCount).toBe(0)
  expect(result.score).toBe(10)
})

test('1학년 게임 모드에서 지도, 힌트, 보상 흐름을 확인할 수 있다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/1`)

  await expect(page.getByTestId('grade1-game-map')).toBeVisible()
  await expect(page.getByTestId('mission-problem-card')).toBeVisible()
  await expect(page.getByTestId('parent-summary')).toBeVisible()
  await expect(page.getByTestId('grade1-intro-guide')).toBeVisible()
  await expect(page.getByTestId('reward-collection')).toBeVisible()
  await expect(page.getByTestId('reward-count-numberShard')).toContainText('0개')

  await page.getByTestId('start-grade1-mission').click()
  await expect(page.getByTestId('grade1-intro-guide')).toHaveCount(0)

  await page.getByTestId('grade1-choice-6').click()
  await expect(page.getByTestId('mission-hint')).toBeVisible()

  await page.getByTestId('grade1-choice-7').click()
  await page.getByTestId('grade1-choice-7').click()
  await expect(page.getByTestId('mission-success')).toBeVisible()
  await expect(page.getByTestId('reward-reveal')).toBeVisible()
  await expect(page.getByTestId('reward-count-message')).toContainText('숫자 조각 보상, 이제 1개예요.')
  await expect(page.getByTestId('reward-count-numberShard')).toContainText('1개')
  await expect(page.getByTestId('reward-tile-numberShard')).toContainText('방금 받았어요')
  await expect(page.getByTestId('next-grade1-mission-panel')).toContainText('2. 10보다 큰 수를 세어요')
  await expect(page.getByTestId('next-grade1-mission')).toBeVisible()

  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), GRADE1_PROGRESS_KEY)
  expect(progress.completedStageIds).toContain('count-cove-01')
  expect(progress.reviewStageIds).toContain('count-cove-01')
  expect(progress.todaySolvedCount).toBe(1)
  expect(typeof progress.introDismissedAt).toBe('number')

  await page.getByTestId('next-grade1-mission').click()
  await expect(page.getByTestId('mission-problem-card')).toHaveAttribute('data-mission-id', 'count-cove-02')
  await expect(page.getByTestId('reward-reveal')).toHaveCount(0)
  await expect(page.getByTestId('grade1-number-input')).toBeVisible()
})

test('1학년 게임 모드에서 손상된 진행 기록을 복구한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate((key) => localStorage.setItem(key, '{bad json'), GRADE1_PROGRESS_KEY)

  await page.goto(`${BASE_PATH}/grade/1`)

  await expect(page.getByTestId('grade1-storage-notice')).toBeVisible()
  await expect(page.getByTestId('mission-problem-card')).toBeVisible()
  await page.getByTestId('grade1-choice-7').click()
  await expect(page.getByTestId('mission-success')).toBeVisible()
})

test('2학년 게임 모드에서 단원 선택, 힌트, 보상, 다음 미션 흐름을 확인한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/2`)

  await expect(page.getByTestId('grade2-unit-list')).toBeVisible()
  await expect(page.getByTestId('grade2-unit-card-g2-1-place-value')).toBeVisible()
  await expect(page.getByTestId('grade2-mission-card')).toHaveCount(0)

  await page.getByTestId('grade2-unit-card-g2-1-place-value').click()
  await expect(page).toHaveURL(/\/math_assist\/grade\/2\/mission\/?\?unitId=g2-1-place-value$/)
  await expect(page.getByTestId('grade2-unit-list')).toHaveCount(0)
  await expect(page.getByTestId('grade2-mission-nav')).toBeVisible()
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-place-value-01')
  await expect(page.getByTestId('grade2-unit-missions').getByTestId(/grade2-mission-node-/)).toHaveCount(3)

  await page.getByTestId('grade2-integer-input').fill('111')
  await page.getByTestId('grade2-integer-submit').click()
  await expect(page.getByTestId('grade2-mission-hint')).toBeVisible()

  await page.getByTestId('grade2-integer-input').fill('342')
  await page.getByTestId('grade2-integer-submit').click()
  await page.getByTestId('grade2-integer-submit').click()
  await expect(page.getByTestId('grade2-mission-success')).toBeVisible()
  await expect(page.getByTestId('grade2-reward-panel')).toBeVisible()

  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), GRADE2_PROGRESS_KEY)
  expect(progress.completedMissionIds).toContain('g2-1-place-value-01')
  expect(progress.reviewMissionIds).toContain('g2-1-place-value-01')
  expect(progress.todaySolvedCount).toBe(1)

  await page.getByTestId('next-grade2-mission').click()
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-place-value-02')
  await expect(page.getByTestId('grade2-reward-panel')).toHaveCount(0)
})

test('2학년 게임 모드에서 길이와 시간 구조화 입력을 사용한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/2/mission?unitId=g2-1-length`)

  await page.getByTestId('grade2-mission-node-1').click()
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-length-01')
  await expect(page.getByTestId('grade2-length-meters')).toHaveCount(0)
  await page.getByTestId('grade2-length-centimeters').fill('8')
  await page.getByTestId('grade2-length-submit').click()
  await expect(page.getByTestId('grade2-mission-success')).toBeVisible()

  await page.getByTestId('grade2-mission-node-2').click()
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-length-02')
  await expect(page.getByTestId('grade2-length-meters')).toHaveCount(0)
  await page.getByTestId('grade2-length-centimeters').fill('120')
  await page.getByTestId('grade2-length-submit').click()
  await expect(page.getByTestId('grade2-mission-success')).toBeVisible()

  await page.goto(`${BASE_PATH}/grade/2/mission?unitId=g2-2-length`)
  await page.getByTestId('grade2-mission-node-3').click()
  await expect(page.getByTestId('grade2-length-meters')).toBeVisible()
  await page.getByTestId('grade2-length-meters').fill('1')
  await page.getByTestId('grade2-length-centimeters').fill('20')
  await page.getByTestId('grade2-length-submit').click()
  await expect(page.getByTestId('grade2-mission-success')).toBeVisible()

  await page.goto(`${BASE_PATH}/grade/2/mission?unitId=g2-2-time`)
  await page.getByTestId('grade2-time-hours').fill('3')
  await page.getByTestId('grade2-time-minutes').fill('60')
  await page.getByTestId('grade2-time-submit').click()
  await expect(page.getByTestId('grade2-input-error')).toBeVisible()

  await page.getByTestId('grade2-time-minutes').fill('25')
  await page.getByTestId('grade2-time-submit').click()
  await expect(page.getByTestId('grade2-mission-success')).toBeVisible()

  await page.getByTestId('next-grade2-mission').click()
  await page.getByTestId('grade2-duration-hours').fill('0')
  await page.getByTestId('grade2-duration-minutes').fill('35')
  await page.getByTestId('grade2-duration-submit').click()
  await expect(page.getByTestId('grade2-mission-success')).toBeVisible()
})

test('2학년 분류하기 시각화는 풀이 전 개수 숫자를 표식으로 보여준다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/2/mission?unitId=g2-1-classification`)
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-classification-01')

  const classificationVisual = page.getByTestId('grade2-visual-classification-table')
  await expect(classificationVisual.getByTestId('grade2-classification-marks-0')).toBeVisible()
  await expect(classificationVisual.getByText('4', { exact: true })).toHaveCount(0)

  await page.getByTestId('grade2-integer-input').fill('4')
  await page.getByTestId('grade2-integer-submit').click()

  await expect(page.getByTestId('grade2-mission-success')).toBeVisible()
  await expect(classificationVisual.getByText('4', { exact: true })).toHaveCount(1)
})

test('2학년 자리값 블록 시각화는 풀이 전 자리 숫자 라벨을 숨긴다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/2/mission?unitId=g2-1-place-value`)
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-place-value-01')

  const placeValueVisual = page.getByTestId('grade2-visual-place-value-blocks')
  await expect(placeValueVisual.getByTestId('grade2-place-value-count-hundreds')).toContainText('□')
  await expect(placeValueVisual.getByTestId('grade2-place-value-count-tens')).toContainText('□')
  await expect(placeValueVisual.getByTestId('grade2-place-value-count-ones')).toContainText('□')
  await expect(placeValueVisual.getByText('3', { exact: true })).toHaveCount(0)
  await expect(placeValueVisual.getByText('4', { exact: true })).toHaveCount(0)
  await expect(placeValueVisual.getByText('2', { exact: true })).toHaveCount(0)

  await page.getByTestId('grade2-integer-input').fill('342')
  await page.getByTestId('grade2-integer-submit').click()

  await expect(page.getByTestId('grade2-mission-success')).toBeVisible()
  await expect(placeValueVisual.getByTestId('grade2-place-value-count-hundreds')).toContainText('3')
  await expect(placeValueVisual.getByTestId('grade2-place-value-count-tens')).toContainText('4')
  await expect(placeValueVisual.getByTestId('grade2-place-value-count-ones')).toContainText('2')
})

test('2학년 세로셈 시각화는 풀이 전 정답을 숨긴다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/2/mission?unitId=g2-1-add-sub`)
  await page.getByTestId('grade2-mission-node-2').click()
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-add-sub-02')

  const verticalVisual = page.getByTestId('grade2-visual-vertical-operation')
  await expect(verticalVisual.getByTestId('grade2-vertical-result')).toContainText('□')
  await expect(verticalVisual.getByText('24', { exact: true })).toHaveCount(0)

  await page.getByTestId('grade2-integer-input').fill('24')
  await page.getByTestId('grade2-integer-submit').click()

  await expect(page.getByTestId('grade2-mission-success')).toBeVisible()
  await expect(verticalVisual.getByTestId('grade2-vertical-result')).toContainText('24')
})

test('2학년 게임 모드에서 손상된 진행 기록을 2학년만 복구한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(
    ([grade1Key, grade2Key]) => {
      localStorage.setItem(grade1Key, '{"keep":true}')
      localStorage.setItem(grade2Key, '{bad json')
    },
    [GRADE1_PROGRESS_KEY, GRADE2_PROGRESS_KEY]
  )

  await page.goto(`${BASE_PATH}/grade/2/mission?unitId=g2-1-place-value`)

  await expect(page.getByTestId('grade2-storage-notice')).toBeVisible()
  await expect(page.getByTestId('grade2-mission-card')).toBeVisible()
  const grade1Value = await page.evaluate((key) => localStorage.getItem(key), GRADE1_PROGRESS_KEY)
  expect(grade1Value).toBe('{"keep":true}')
})
