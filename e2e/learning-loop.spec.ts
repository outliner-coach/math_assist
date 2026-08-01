import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

import { getGrade1Missions, getGrade1PracticeMissionIds } from '../src/lib/grade1-problems'
import { createInitialGrade1Progress } from '../src/lib/grade1-progress'

const BASE_PATH = '/math_assist'
const SESSION_KEY = 'mathAssist_currentSession'
const RESULT_KEY = 'mathAssist_lastResult'
const GRADE1_PROGRESS_KEY = 'mathAssist_grade1Progress'
const GRADE2_PROGRESS_KEY = 'mathAssist_grade2Progress'
const GRADE3_PROGRESS_KEY = 'mathAssist_grade3Progress'
const ATTEMPT_RECEIPT_KEY = 'mathAssist_attemptReceipts_v1'

type StoredProblem = {
  type: 'choice' | 'number'
  correctAnswer: string
  correctChoiceIndex?: number
  visual?: {
    type?: string
    props: {
      exclusiveAreas: [number, number, number]
    }
  }
}

type StoredSession = {
  grade?: 5 | 6
  itemCount?: 5 | 10
  currentIndex: number
  problems: StoredProblem[]
  checkedAnswers: (boolean | null)[]
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

async function readAttemptReceipts(page: Page) {
  await page.waitForFunction((key) => Boolean(localStorage.getItem(key)), ATTEMPT_RECEIPT_KEY)
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null').receipts, ATTEMPT_RECEIPT_KEY)
}

async function pressKeypadButton(page: Page, char: string) {
  await page.getByTestId(`key-${encodeURIComponent(char)}`).click()
}

async function drawScratchStroke(page: Page) {
  const canvas = page.getByLabel('문제 풀이를 쓰는 캔버스')
  await canvas.scrollIntoViewIfNeeded()
  const box = await canvas.boundingBox()
  if (!box) throw new Error('ScratchPad canvas is not visible')
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.35)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.6, { steps: 6 })
  await page.mouse.up()
  await expect(page.getByText('이 문제의 풀이를 기기에 자동 저장했어요.')).toBeVisible()
}

async function paintedScratchPixels(page: Page): Promise<number> {
  return page.getByLabel('문제 풀이를 쓰는 캔버스').evaluate((canvas) => {
    const element = canvas as HTMLCanvasElement
    const context = element.getContext('2d')
    if (!context) return 0
    const pixels = context.getImageData(0, 0, element.width, element.height).data
    let painted = 0
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 0) painted += 1
    }
    return painted
  })
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
  await expect(page.getByTestId('problem-card')).toBeVisible()

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
    await expect(page.getByTestId('check-answer-button')).toBeEnabled()
    await page.getByTestId('check-answer-button').click()
    await expect(page.getByTestId('answer-feedback')).toBeVisible()

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

test('5학년 개념에서 기본 5문제와 집중 10문제를 모두 선택한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/concept/divisor-001`)

  await expect(page.getByRole('button', { name: '세트 A · 5문제' })).toBeVisible()
  await expect(page.getByRole('button', { name: '세트 A · 10문제' })).toBeVisible()

  await page.getByRole('button', { name: '세트 A · 5문제' }).click()
  await expect(page).toHaveURL(/\/practice\/divisor-001\/?\?set=A&count=5$/)
  const basic = await readSession(page)
  expect(basic).toMatchObject({ grade: 5, itemCount: 5 })
  expect(basic.problems).toHaveLength(5)

  await page.goto(`${BASE_PATH}/concept/divisor-001`)
  await page.getByRole('button', { name: '세트 A · 10문제' }).click()
  await expect(page).toHaveURL(/\/practice\/divisor-001\/?\?set=A&count=10$/)
  await page.waitForFunction((key) => (
    JSON.parse(localStorage.getItem(key) ?? 'null')?.itemCount === 10
  ), SESSION_KEY)
  const practice = await readSession(page)
  expect(practice).toMatchObject({ grade: 5, itemCount: 10 })
  expect(practice.problems).toHaveLength(10)
})

test('5학년 기본 결과는 10문제를 추천하면서 재도전과 새 5문제 선택을 보존한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/divisor-001?set=B&count=5`)
  await completeSession(page, [0])

  await expect(page).toHaveURL(/\/math_assist\/result\/?$/)
  await expect(page.getByRole('button', { name: '10문제로 집중 연습' })).toBeVisible()
  await expect(page.getByRole('button', { name: '새 기본 5문제' })).toBeVisible()

  await page.getByTestId('retry-wrong-button').click()
  await expect(page).toHaveURL(/set=B&count=5&mode=retry-wrong/)
  const retry = await readSession(page)
  expect(retry).toMatchObject({ grade: 5, itemCount: 5 })

  await page.goto(`${BASE_PATH}/result`)
  await page.getByRole('button', { name: '10문제로 집중 연습' }).click()
  await expect(page).toHaveURL(/\/practice\/divisor-001\/?\?set=B&count=10$/)

  await page.goto(`${BASE_PATH}/result`)
  await page.getByRole('button', { name: '새 기본 5문제' }).click()
  await expect(page).toHaveURL(/\/practice\/divisor-001\/?\?set=B&count=5$/)
})

test('각 문제를 푼 직후 정답과 풀이를 확인한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/divisor-001?set=A`)
  await answerCurrentProblem(page, 'wrong')

  await page.getByTestId('check-answer-button').click()

  await expect(page.getByTestId('feedback-wrong')).toBeVisible()
  await expect(page.getByTestId('feedback-answer')).not.toBeEmpty()
  await expect(page.getByTestId('feedback-solution')).toBeVisible()
  await expect(page.getByTestId('next-button')).toBeVisible()

  const session = await readSession(page)
  expect(session.checkedAnswers[0]).toBe(false)
})

test('5학년 수의 범위는 열린·닫힌 경계를 그리고 10문제를 완주한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/unit/unit-5-2-rounding`)
  await expect(page.getByText('개념 선택 (3개)')).toBeVisible()
  await expect(page.getByRole('link', { name: /이상·이하·초과·미만/ })).toBeVisible()

  await page.goto(`${BASE_PATH}/concept/numberrange-001`)
  const conceptVisual = page.getByTestId('problem-diagram-number-range')
  await expect(conceptVisual).toBeVisible()
  await expect(conceptVisual.locator('[data-range-lower-inclusive="true"]')).toHaveCount(1)
  await expect(conceptVisual.locator('[data-range-upper-inclusive="false"]')).toHaveCount(1)

  await page.goto(`${BASE_PATH}/practice/numberrange-001?set=A`)
  const session = await readSession(page)
  expect(session.problems).toHaveLength(10)
  expect(session.problems.every((problem) => problem.visual?.type === 'number_range')).toBe(true)

  const practiceVisual = page.getByTestId('problem-diagram-number-range')
  await expect(practiceVisual).toBeVisible()
  await expect(page.locator('[data-answer]')).toHaveCount(0)
  await expect(page.getByText('정답:', { exact: false })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)

  await completeSession(page)
  const result = await readResult(page)
  expect(result.score).toBe(10)
  expect(result.total).toBe(10)
})

test('5학년 이분모 분수 비교는 같은 길이 막대를 그리고 10문제를 완주한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/unit/unit-5-1-fraction-simplify`)
  await expect(page.getByText('개념 선택 (3개)')).toBeVisible()
  await expect(page.getByRole('link', { name: /분모가 다른 분수의 크기 비교/ })).toBeVisible()

  await page.goto(`${BASE_PATH}/concept/fraccompare-001`)
  const conceptVisual = page.getByTestId('problem-diagram-fraction-comparison')
  await expect(conceptVisual).toBeVisible()
  await expect(conceptVisual.locator('[data-fraction-part="left"]')).toHaveCount(3)
  await expect(conceptVisual.locator('[data-fraction-part="right"]')).toHaveCount(5)

  await page.goto(`${BASE_PATH}/practice/fraccompare-001?set=A`)
  const session = await readSession(page)
  expect(session.problems).toHaveLength(10)
  expect(session.problems.every((problem) => problem.visual?.type === 'fraction_comparison')).toBe(true)

  const practiceVisual = page.getByTestId('problem-diagram-fraction-comparison')
  await expect(practiceVisual).toBeVisible()
  await expect(page.locator('[data-answer]')).toHaveCount(0)
  await expect(page.getByText('정답:', { exact: false })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)

  await completeSession(page)
  const result = await readResult(page)
  expect(result.score).toBe(10)
  expect(result.total).toBe(10)
})

test('5학년 넓이 단위는 두 방향 변환을 그리고 10문제를 완주한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/unit/unit-5-1-perimeter-area`)
  await expect(page.getByText('개념 선택 (4개)')).toBeVisible()
  await expect(page.getByRole('link', { name: /넓이 단위의 관계/ })).toBeVisible()

  await page.goto(`${BASE_PATH}/concept/areaunit-001`)
  const conceptVisuals = page.getByTestId('problem-diagram-area-unit-square')
  await expect(conceptVisuals).toHaveCount(2)
  await expect(conceptVisuals.nth(0)).toContainText('100cm × 100cm')
  await expect(conceptVisuals.nth(1)).toContainText('1000m × 1000m')

  await page.goto(`${BASE_PATH}/practice/areaunit-001?set=A`)
  const session = await readSession(page)
  expect(session.problems).toHaveLength(10)
  expect(session.problems.every((problem) => problem.visual?.type === 'area_unit_square')).toBe(true)

  const practiceVisual = page.getByTestId('problem-diagram-area-unit-square')
  await expect(practiceVisual).toBeVisible()
  await expect(page.locator('[data-answer]')).toHaveCount(0)
  await expect(page.getByText('정답:', { exact: false })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)

  await completeSession(page)
  const result = await readResult(page)
  expect(result.score).toBe(10)
  expect(result.total).toBe(10)
})

test('5학년 가능성은 관찰 자료로 말·수·예측을 연결해 10문제를 완주한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/unit/unit-5-2-average`)
  await expect(page.getByText('개념 선택 (2개)')).toBeVisible()
  await expect(page.getByRole('link', { name: /가능성과 자료에 근거한 예측/ })).toBeVisible()

  await page.goto(`${BASE_PATH}/concept/possibility-001`)
  const conceptVisual = page.getByTestId('problem-diagram-possibility-trials')
  await expect(conceptVisual).toBeVisible()
  await expect(conceptVisual.locator('[data-possibility-row]')).toHaveCount(2)
  await expect(conceptVisual.locator('[data-trial-outcome="favorable"]')).toHaveCount(10)

  await page.goto(`${BASE_PATH}/practice/possibility-001?set=A`)
  const session = await readSession(page)
  expect(session.problems).toHaveLength(10)
  expect(session.problems.every((problem) => problem.visual?.type === 'possibility_trials')).toBe(true)

  const practiceVisual = page.getByTestId('problem-diagram-possibility-trials')
  await expect(practiceVisual).toBeVisible()
  await expect(page.locator('[data-answer]')).toHaveCount(0)
  await expect(page.getByText('정답:', { exact: false })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)

  await completeSession(page)
  const result = await readResult(page)
  expect(result.score).toBe(10)
  expect(result.total).toBe(10)
})

test('5학년 풀이장은 문제별로 자동 저장하고 이동·새로고침 뒤 복구한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/divisor-001?set=A`)
  await drawScratchStroke(page)

  const firstStored = await page.evaluate(() => Object.keys(localStorage).filter(
    (key) => key.startsWith('mathAssist_sketch_v1:'),
  ))
  expect(firstStored).toHaveLength(1)

  await answerCurrentProblem(page, 'correct')
  await page.getByTestId('check-answer-button').click()
  await page.getByTestId('next-button').click()
  await expect.poll(() => paintedScratchPixels(page)).toBe(0)
  await drawScratchStroke(page)

  const secondStored = await page.evaluate(() => Object.keys(localStorage).filter(
    (key) => key.startsWith('mathAssist_sketch_v1:'),
  ))
  expect(secondStored).toHaveLength(2)

  await page.getByTestId('previous-button').click()
  await expect.poll(() => paintedScratchPixels(page)).toBeGreaterThan(0)
  await page.reload()
  await expect.poll(() => paintedScratchPixels(page)).toBeGreaterThan(0)
})

test('5학년의 완성되지 않은 숫자 입력은 오답으로 잠그지 않는다', async ({ page }) => {
  const now = Date.now()
  await page.evaluate(({ key, now }) => {
    localStorage.setItem(key, JSON.stringify({
      sessionId: 'incomplete-number-input',
      conceptId: 'divisor-001',
      setId: 'A',
      mode: 'standard',
      problems: [{
        index: 0,
        templateId: 'number-format-boundary',
        setId: 'A',
        params: {},
        prompt: '1과 1/2를 대분수로 쓰세요.',
        type: 'number',
        correctAnswer: '1 1/2',
        solutionSteps: ['분자와 분모를 모두 씁니다.']
      }],
      answers: [null],
      checkedAnswers: [null],
      currentIndex: 0,
      startedAt: now,
      expiresAt: now + 60 * 60 * 1000
    }))
  }, { key: SESSION_KEY, now })

  await page.goto(`${BASE_PATH}/practice/divisor-001?set=A`)

  await enterNumberAnswer(page, '1/')
  await page.getByTestId('check-answer-button').click()
  await expect(page.getByTestId('number-input-error')).toContainText('분모')
  await expect(page.getByTestId('answer-feedback')).toHaveCount(0)
  expect((await readSession(page)).checkedAnswers).toEqual([null])
  expect(await page.evaluate((key) => localStorage.getItem(key), ATTEMPT_RECEIPT_KEY)).toBeNull()

  await page.getByTestId('keypad-display').click()
  await pressKeypadButton(page, 'backspace')
  await pressKeypadButton(page, 'backspace')
  await pressKeypadButton(page, '-')
  await page.getByTestId('key-done').click()
  await page.getByTestId('check-answer-button').click()
  await expect(page.getByTestId('number-input-error')).toContainText('숫자')
  expect((await readSession(page)).checkedAnswers).toEqual([null])
  expect(await page.evaluate((key) => localStorage.getItem(key), ATTEMPT_RECEIPT_KEY)).toBeNull()

  await page.getByTestId('keypad-display').click()
  await pressKeypadButton(page, 'backspace')
  await pressKeypadButton(page, '.')
  await page.getByTestId('key-done').click()
  await page.getByTestId('check-answer-button').click()
  await expect(page.getByTestId('number-input-error')).toContainText('소수점')
  expect((await readSession(page)).checkedAnswers).toEqual([null])
  expect(await page.evaluate((key) => localStorage.getItem(key), ATTEMPT_RECEIPT_KEY)).toBeNull()

  await page.getByTestId('keypad-display').click()
  await pressKeypadButton(page, 'backspace')
  for (const char of '1 1/') await pressKeypadButton(page, char)
  await page.getByTestId('key-done').click()
  await page.getByTestId('check-answer-button').click()
  await expect(page.getByTestId('number-input-error')).toContainText('대분수')
  expect((await readSession(page)).checkedAnswers).toEqual([null])
  expect(await page.evaluate((key) => localStorage.getItem(key), ATTEMPT_RECEIPT_KEY)).toBeNull()

  await page.getByTestId('keypad-display').click()
  await pressKeypadButton(page, '2')
  await page.getByTestId('key-done').click()
  await expect(page.getByTestId('number-input-error')).toHaveCount(0)
  await page.getByTestId('check-answer-button').click()
  await expect(page.getByTestId('feedback-correct')).toBeVisible()
  expect((await readSession(page)).checkedAnswers).toEqual([true])
  const ledger = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), ATTEMPT_RECEIPT_KEY)
  expect(ledger.receipts).toHaveLength(1)
  expect(ledger.receipts[0]).toMatchObject({
    schemaVersion: 1,
    sessionId: 'incomplete-number-input',
    activityId: 'divisor-001',
    grade: 5,
    correct: true,
    usedHint: false,
  })
  expect(JSON.stringify(ledger)).not.toContain('1 1/2')
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

test('5학년 도형 연습은 SVG 정답을 제출 전 숨기고 결과에서 공개한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/congruence-001?set=A`)

  await expect(page.getByTestId('geometry-visual-congruence')).toBeVisible()
  await expect(page.getByTestId('problem-card')).not.toContainText('정답:')

  await completeSession(page, [0])

  await expect(page).toHaveURL(/\/math_assist\/result\/?$/)
  await expect(page.getByTestId('wrong-results').getByTestId('geometry-visual-congruence')).toBeVisible()
  await expect(page.getByTestId('wrong-results')).toContainText('정답:')
})

test('5학년 합동 그림은 실제 길이 비율을 보존한 도형을 회전해 그린다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/practice/congruence-001?set=A`)

  const session = await readSession(page)
  type CongruenceVisual = {
    type: 'congruence'
    shape?: 'quadrilateral' | 'rectangle'
    a?: number
    b?: number
    c?: number
  }
  const quantitativeIndex = session.problems.findIndex(problem => {
    const visual = problem.visual as unknown as CongruenceVisual | undefined
    return visual?.type === 'congruence' &&
      typeof visual.a === 'number' &&
      typeof visual.b === 'number' &&
      typeof visual.c === 'number' &&
      visual.shape !== 'rectangle'
  })
  expect(quantitativeIndex).toBeGreaterThanOrEqual(0)

  const visual = session.problems[quantitativeIndex].visual as unknown as CongruenceVisual
  if (session.currentIndex !== quantitativeIndex) {
    await page.getByRole('button', {
      name: `문제 ${quantitativeIndex + 1}`,
      exact: true,
    }).click()
  }

  const diagram = page.getByTestId('geometry-visual-congruence')
  await expect(diagram).toBeVisible()
  const polygons = await diagram.locator('svg polygon').evaluateAll(elements => elements.map(element => {
    const points = (element as SVGPolygonElement).points
    return Array.from({ length: points.numberOfItems }, (_, index) => {
      const point = points.getItem(index)
      return { x: point.x, y: point.y }
    })
  }))
  expect(polygons).toHaveLength(2)

  const distance = (
    left: { x: number; y: number },
    right: { x: number; y: number },
  ) => Math.hypot(left.x - right.x, left.y - right.y)
  for (let first = 0; first < 4; first += 1) {
    for (let second = first + 1; second < 4; second += 1) {
      expect(distance(polygons[0][first], polygons[0][second])).toBeCloseTo(
        distance(polygons[1][first], polygons[1][second]),
        1,
      )
    }
  }

  const leftEdges = polygons[0].map((point, index) => (
    distance(point, polygons[0][(index + 1) % polygons[0].length])
  ))
  expect(leftEdges[0] / leftEdges[1]).toBeCloseTo(visual.a! / visual.b!, 1)
  expect(leftEdges[2] / leftEdges[1]).toBeCloseTo(visual.c! / visual.b!, 1)
  await expect(diagram).toContainText(`${visual.a}cm`)
  await expect(diagram).toContainText(`${visual.b}cm`)
  await expect(diagram).toContainText(`${visual.c}cm`)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('5학년 직육면체와 전개도 그림은 치수와 접기 구조를 그대로 반영한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/practice/cuboid-001?set=A`)

  type CuboidVisual = {
    type: 'cuboid'
    width?: number
    height?: number
    depth?: number
    focus?: string
    unknownMeasurement?: 'width' | 'height' | 'depth'
  }
  const session = await readSession(page)
  const quantitativeIndex = session.problems.findIndex(problem => {
    const visual = problem.visual as unknown as CuboidVisual | undefined
    return (
      visual?.type === 'cuboid' &&
      typeof visual.width === 'number' &&
      typeof visual.height === 'number' &&
      typeof visual.depth === 'number' &&
      !visual.unknownMeasurement
    )
  })
  expect(quantitativeIndex).toBeGreaterThanOrEqual(0)
  const visual = session.problems[quantitativeIndex].visual as unknown as CuboidVisual
  if (session.currentIndex !== quantitativeIndex) {
    await page.getByRole('button', {
      name: `문제 ${quantitativeIndex + 1}`,
      exact: true,
    }).click()
  }

  const cuboid = page.getByTestId('geometry-visual-cuboid')
  await expect(cuboid).toBeVisible()
  const polygons = await cuboid.locator('svg polygon').evaluateAll(elements => elements.map(element => {
    const points = (element as SVGPolygonElement).points
    return Array.from({ length: points.numberOfItems }, (_, index) => {
      const point = points.getItem(index)
      return { x: point.x, y: point.y }
    })
  }))
  expect(polygons).toHaveLength(3)

  const distance = (
    left: { x: number; y: number },
    right: { x: number; y: number },
  ) => Math.hypot(left.x - right.x, left.y - right.y)
  const front = polygons[2]
  const frontWidth = distance(front[0], front[1])
  const frontHeight = distance(front[0], front[3])
  const projectedDepth = distance(polygons[0][0], polygons[0][1])
  expect(frontWidth / frontHeight).toBeCloseTo(visual.width! / visual.height!, 1)
  expect(projectedDepth / frontWidth).toBeCloseTo(
    (visual.depth! / visual.width!) * Math.hypot(0.65, 0.45),
    1,
  )
  await expect(cuboid).toContainText(`가로 ${visual.width} cm`)
  await expect(cuboid).toContainText(`세로 ${visual.depth} cm`)
  await expect(cuboid).toContainText(`높이 ${visual.height} cm`)

  const propertyIndex = session.problems.findIndex(problem => {
    const propertyVisual = problem.visual as unknown as CuboidVisual | undefined
    return propertyVisual?.type === 'cuboid' && propertyVisual.focus === 'face'
  })
  expect(propertyIndex).toBeGreaterThanOrEqual(0)
  await page.getByRole('button', {
    name: `문제 ${propertyIndex + 1}`,
    exact: true,
  }).click()
  await expect(cuboid.locator('[data-cuboid-measurement]')).toHaveCount(0)
  await expect(cuboid.locator('svg')).toHaveAttribute('aria-label', /직육면체 면/)

  await page.evaluate((key) => localStorage.removeItem(key), SESSION_KEY)
  await page.goto(`${BASE_PATH}/practice/cuboidnet-001?set=A`)
  const netSession = await readSession(page)
  type NetVisual = { type: 'cuboid-net'; mode: 'single' | 'options' }
  const optionIndex = netSession.problems.findIndex(problem => {
    const netVisual = problem.visual as unknown as NetVisual | undefined
    return netVisual?.type === 'cuboid-net' && netVisual.mode === 'options'
  })
  expect(optionIndex).toBeGreaterThanOrEqual(0)
  if (netSession.currentIndex !== optionIndex) {
    await page.getByRole('button', {
      name: `문제 ${optionIndex + 1}`,
      exact: true,
    }).click()
  }

  const netDiagram = page.getByTestId('geometry-visual-cuboid-net')
  await expect(netDiagram).toBeVisible()
  const layouts = await netDiagram.locator('[data-net-option]').evaluateAll(options => (
    options.map(option => {
      const cells = Array.from(option.querySelectorAll('rect')).map(rect => ({
        x: Number(rect.getAttribute('x')),
        y: Number(rect.getAttribute('y')),
      }))
      const minX = Math.min(...cells.map(cell => cell.x))
      const minY = Math.min(...cells.map(cell => cell.y))
      return cells
        .map(cell => `${cell.x - minX},${cell.y - minY}`)
        .sort()
    })
  ))
  expect(layouts).toHaveLength(4)
  expect(layouts.every(layout => layout.length === 6)).toBe(true)
  expect(new Set(layouts.map(layout => JSON.stringify(layout))).size).toBe(4)
  await expect(netDiagram.locator('rect[stroke="#16a34a"]')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('5학년 다각형 그림은 실제 치수 비율을 따르고 미지 길이를 좌표에서도 가린다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/practice/perimeter-001?set=A`)

  const session = await readSession(page)
  const quantitativeIndex = session.problems.findIndex(problem => (
    problem.visual?.type === 'polygon' &&
    problem.visual.shape === 'rectangle' &&
    !problem.visual.unknownMeasurement
  ))
  expect(quantitativeIndex).toBeGreaterThanOrEqual(0)

  const quantitativeVisual = session.problems[quantitativeIndex].visual
  if (!quantitativeVisual || quantitativeVisual.type !== 'polygon' || quantitativeVisual.b === undefined) {
    throw new Error('quantitative rectangle visual was not generated')
  }
  if (session.currentIndex !== quantitativeIndex) {
    await page.getByRole('button', { name: `문제 ${quantitativeIndex + 1}`, exact: true }).click()
  }

  const diagram = page.getByTestId('geometry-visual-polygon')
  await expect(diagram).toBeVisible()
  const renderedRatio = await diagram.locator('svg polygon').evaluate(element => {
    const box = (element as SVGGraphicsElement).getBBox()
    return box.width / box.height
  })
  expect(renderedRatio).toBeCloseTo(quantitativeVisual.a / quantitativeVisual.b, 1)
  await expect(diagram).toContainText(`${quantitativeVisual.a}cm`)
  await expect(diagram).toContainText(`${quantitativeVisual.b}cm`)

  const unknownIndex = session.problems.findIndex(problem => {
    if (problem.visual?.type !== 'polygon' || !problem.visual.unknownMeasurement) return false
    const hiddenValue = problem.visual[problem.visual.unknownMeasurement]
    const visibleValues = ['a', 'b', 'c', 'height']
      .filter(key => key !== problem.visual?.unknownMeasurement)
      .map(key => problem.visual?.type === 'polygon'
        ? problem.visual[key as 'a' | 'b' | 'c' | 'height']
        : undefined)
    return typeof hiddenValue === 'number' && !visibleValues.includes(hiddenValue)
  })
  expect(unknownIndex).toBeGreaterThanOrEqual(0)
  await page.getByRole('button', { name: `문제 ${unknownIndex + 1}`, exact: true }).click()

  const unknownVisual = session.problems[unknownIndex].visual
  if (!unknownVisual || unknownVisual.type !== 'polygon' || !unknownVisual.unknownMeasurement) {
    throw new Error('reverse polygon visual was not generated')
  }
  const hiddenValue = unknownVisual[unknownVisual.unknownMeasurement]
  await expect(diagram).toContainText('?cm')
  await expect(diagram).not.toContainText(`${hiddenValue}cm`)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('세 도형 겹침은 설명 없는 원·삼각형·사각형 중첩도로 보여 준다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/practice/area-001?set=A`)
  const session = await readSession(page)
  const overlapProblemIndex = session.problems.findIndex(
    problem => problem.visual?.type === 'three_shape_overlap'
  )
  const overlapVisual = session.problems[overlapProblemIndex]?.visual

  expect(overlapProblemIndex).toBeGreaterThanOrEqual(0)
  expect(overlapVisual).toBeTruthy()
  if (!overlapVisual) throw new Error('three_shape_overlap visual was not generated')

  await page.getByRole('button', { name: `문제 ${overlapProblemIndex + 1}`, exact: true }).click()

  const diagram = page.getByTestId('problem-diagram-three-shape-overlap')
  await expect(diagram).toBeVisible()
  await expect(diagram.locator('[data-overlap-shape]')).toHaveCount(3)
  await expect(diagram.locator('[data-overlap-shape-label]')).toHaveCount(3)
  await expect(diagram.locator('figcaption')).toHaveCount(0)
  await expect(diagram.locator('[data-cell-region]')).toHaveCount(0)
  await expect(diagram.locator('[data-overlap-mask]')).toHaveCount(0)
  await expect(diagram.locator('[data-region-callout]')).toHaveCount(0)
  await expect(diagram).not.toContainText('cm²')
  await expect(diagram).not.toContainText('?')
  const readability = await diagram.evaluate(element => {
    const svg = element.querySelector('svg')
    const shapes = Array.from(element.querySelectorAll<SVGGeometryElement>('[data-overlap-shape]'))
    const labels = Array.from(element.querySelectorAll<SVGTextElement>('[data-overlap-shape-label]'))
    if (!svg || shapes.length !== 3 || labels.length !== 3) {
      throw new Error('overlap readability elements are missing')
    }
    const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
    const triplePoint = svg.createSVGPoint()
    triplePoint.x = 210
    triplePoint.y = 140
    return {
      smallestLabelFont: Math.min(
        ...labels.map(label => Number(label.getAttribute('font-size')) * scale)
      ),
      allShapesOverlapAtCenter: shapes.every(shape => shape.isPointInFill(triplePoint)),
      translucentFills: shapes.every(shape => (
        Number.parseFloat(getComputedStyle(shape).fillOpacity) > 0
        && Number.parseFloat(getComputedStyle(shape).fillOpacity) < 1
      )),
      fitsViewport: document.documentElement.scrollWidth <= window.innerWidth,
    }
  })
  expect(readability.smallestLabelFont).toBeGreaterThanOrEqual(20)
  expect(readability.allShapesOverlapAtCenter).toBe(true)
  expect(readability.translucentFills).toBe(true)
  expect(readability.fitsViewport).toBe(true)

  await page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key) || 'null')
    delete session.problems[session.currentIndex].visual.model
    delete session.problems[session.currentIndex].visual.semantics
    localStorage.setItem(key, JSON.stringify(session))
  }, SESSION_KEY)
  await page.reload()

  const legacyDiagram = page.getByTestId('problem-diagram-three-shape-overlap')
  await expect(legacyDiagram).toBeVisible()
  await expect(legacyDiagram.locator('[data-overlap-shape]')).toHaveCount(3)
  await expect(legacyDiagram.locator('[data-cell-region]')).toHaveCount(0)
  await expect(legacyDiagram).not.toContainText('cm²')

  await answerCurrentProblem(page, 'correct')
  await page.getByTestId('check-answer-button').click()
  await expect(legacyDiagram.locator('[data-overlap-shape]')).toHaveCount(3)
  await expect(legacyDiagram.locator('[data-cell-region]')).toHaveCount(0)
  await expect(legacyDiagram.locator('[data-region-callout]')).toHaveCount(0)
  await expect(legacyDiagram).not.toContainText('cm²')
})

test('1학년 게임 모드에서 지도, 힌트, 보상 흐름을 확인할 수 있다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/1`)

  await expect(page.getByTestId('grade1-game-map')).toBeVisible()
  await expect(page.getByTestId('mission-problem-card')).toBeVisible()
  await expect(page.getByTestId('parent-summary')).toBeVisible()
  await expect(page.getByTestId('grade1-intro-guide')).toBeVisible()
  await expect(page.getByTestId('reward-collection')).toBeVisible()
  await expect(page.getByTestId('adventure-progress-panel')).toBeVisible()
  await expect(page.getByTestId('daily-goal')).toContainText('0/8')
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
  expect(progress.schemaVersion).toBe(3)
  expect(progress.xp).toBe(10)

  const grade1Receipts = await readAttemptReceipts(page)
  expect(grade1Receipts).toHaveLength(2)
  expect(grade1Receipts.map((receipt: { correct: boolean }) => receipt.correct)).toEqual([false, true])
  expect(grade1Receipts[1]).toMatchObject({
    grade: 1,
    activityId: 'count-cove-01',
    itemId: 'count-cove-01',
    attemptOrdinal: 1,
    usedHint: true,
  })
  expect(grade1Receipts[1]).not.toHaveProperty('answer')
  expect(grade1Receipts[1]).not.toHaveProperty('strokes')

  const firstState = JSON.parse(await page.evaluate(() => (
    window as typeof window & { render_game_to_text?: () => string }
  ).render_game_to_text?.() ?? '{}'))
  await page.getByTestId('replay-grade1-mission').click()
  const replayState = JSON.parse(await page.evaluate(() => (
    window as typeof window & { render_game_to_text?: () => string }
  ).render_game_to_text?.() ?? '{}'))
  expect(replayState.missionSeed).not.toBe(firstState.missionSeed)
  const replayMission = getGrade1Missions(replayState.missionSeed).find(
    (mission) => mission.id === replayState.selectedMissionId,
  )
  if (!replayMission) throw new Error('Replayed Grade 1 mission was not generated')
  const firstMission = getGrade1Missions(firstState.missionSeed).find(
    (mission) => mission.id === firstState.selectedMissionId,
  )
  if (!firstMission) throw new Error('Initial Grade 1 mission was not generated')
  const replayHasNewContent = JSON.stringify([
    replayMission.prompt,
    replayMission.correctAnswer,
    replayMission.choices,
    replayMission.visualConfig,
  ]) !== JSON.stringify([
    firstMission.prompt,
    firstMission.correctAnswer,
    firstMission.choices,
    firstMission.visualConfig,
  ])
  await page.getByTestId(`grade1-choice-${replayMission.correctAnswer}`).click()
  await expect(page.getByTestId('daily-goal')).toContainText(replayHasNewContent ? '2/8' : '1/8')

  const replayProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), GRADE1_PROGRESS_KEY)
  expect(replayProgress.xp).toBe(replayHasNewContent ? 25 : 10)
  expect(replayProgress.solvedVariantKeys).toHaveLength(replayHasNewContent ? 2 : 1)

  await page.getByTestId('next-grade1-mission').click()
  await expect(page.getByTestId('mission-problem-card')).toHaveAttribute('data-mission-id', 'count-cove-02')
  await expect(page.getByTestId('reward-reveal')).toHaveCount(0)
  await expect(page.getByTestId('grade1-number-input')).toBeVisible()
  const grade1ReceiptCountBeforeFormatError = (await readAttemptReceipts(page)).length
  await page.getByTestId('grade1-number-input').fill('1/')
  await page.getByTestId('grade1-number-submit').click()
  await expect(page.getByTestId('grade1-number-error')).toBeVisible()
  expect((await readAttemptReceipts(page))).toHaveLength(grade1ReceiptCountBeforeFormatError)
})

test('1학년 풀이장은 새로고침 복구, 완료 읽기 전용, 재시작 격리를 유지한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/1`)
  await drawScratchStroke(page)
  await page.reload()
  await expect(page.getByTestId('mission-problem-card')).toHaveAttribute('data-mission-id', 'count-cove-01')
  await expect.poll(() => paintedScratchPixels(page)).toBeGreaterThan(0)

  await page.getByTestId('grade1-choice-7').click()
  await expect(page.getByTestId('mission-success')).toBeVisible()
  await expect(page.getByLabel('문제 풀이를 쓰는 캔버스')).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByTestId('scratch-pad').getByRole('button', { name: '펜', exact: true })).toBeDisabled()

  await page.getByTestId('next-grade1-mission').click()
  await expect.poll(() => paintedScratchPixels(page)).toBe(0)
  await page.getByTestId('stage-node-1').click()
  await expect.poll(() => paintedScratchPixels(page)).toBeGreaterThan(0)
  await page.getByTestId('grade1-choice-7').click()
  await expect(page.getByTestId('mission-success')).toBeVisible()
  await page.getByTestId('replay-grade1-mission').click()
  await expect(page.getByLabel('문제 풀이를 쓰는 캔버스')).toHaveAttribute('aria-disabled', 'false')
  await expect.poll(() => paintedScratchPixels(page)).toBe(0)
  await drawScratchStroke(page)
  await page.reload()
  await expect(page.getByTestId('mission-problem-card')).toHaveAttribute('data-mission-id', 'count-cove-01')
  await expect.poll(() => paintedScratchPixels(page)).toBeGreaterThan(0)
  const replayProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), GRADE1_PROGRESS_KEY)
  expect(replayProgress.missionSketchRunOrdinal).toBe(1)
  const documents = await page.evaluate(() => Object.keys(localStorage).filter(
    (key) => key.startsWith('mathAssist_sketch_v1:'),
  ))
  expect(documents).toHaveLength(2)
})

test('1학년은 기본과 연습을 처음부터 고르고 연습 7개를 완주해야 섬을 완료한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/1`)

  await expect(page.getByTestId('grade1-basic-count-cove')).toBeVisible()
  await expect(page.getByTestId('grade1-practice-count-cove')).toBeVisible()
  const practiceIds = getGrade1PracticeMissionIds('count-cove')
  const missions = getGrade1Missions(42)
  const basicIds = missions
    .filter((mission) => mission.islandId === 'count-cove' && mission.mode === 'basic')
    .map((mission) => mission.id)
  await expect(page.locator(`[data-stage-id="${practiceIds[0]}"]`)).toBeEnabled()

  const initialProgress = createInitialGrade1Progress(Date.now())
  await page.evaluate(({ key, basic, initial }) => {
    localStorage.setItem(key, JSON.stringify({
      ...initial,
      completedStageIds: basic.slice(0, 6),
      checkedStageIds: basic,
      completedIslandIds: [],
      reviewStageIds: [basic[6]],
    }))
  }, { key: GRADE1_PROGRESS_KEY, basic: basicIds, initial: initialProgress })
  await page.reload()
  await expect(page.getByTestId('grade1-game-surface')).toHaveAttribute(
    'data-progress-restored',
    'true',
  )
  await expect(page.getByTestId('grade1-island-completion-count-cove')).toHaveText('연습 7개 완주 전')
  await page.getByTestId('start-grade1-mission').click()
  await expect(page.getByTestId('mission-problem-card')).toHaveAttribute(
    'data-mission-id',
    practiceIds[0],
  )

  await page.evaluate(({ key, basic, practice }) => {
    const progress = JSON.parse(localStorage.getItem(key) || '{}')
    localStorage.setItem(key, JSON.stringify({
      ...progress,
      completedStageIds: [...basic, ...practice.slice(0, 6)],
      checkedStageIds: [...basic, ...practice.slice(0, 6)],
      completedIslandIds: [],
    }))
  }, { key: GRADE1_PROGRESS_KEY, basic: basicIds, practice: practiceIds })
  await page.reload()

  const lastPracticeId = practiceIds[6]
  await page.locator(`[data-stage-id="${lastPracticeId}"]`).click()
  await expect(page.getByTestId('mission-problem-card')).toHaveAttribute('data-mission-id', lastPracticeId)
  const state = JSON.parse(await page.evaluate(() => (
    window as typeof window & { render_game_to_text?: () => string }
  ).render_game_to_text?.() ?? '{}'))
  const lastMission = getGrade1Missions(state.missionSeed).find((mission) => mission.id === lastPracticeId)
  if (!lastMission) throw new Error('Grade 1 final practice mission was not generated')
  if (lastMission.answerType === 'choice') {
    const wrongChoice = lastMission.choices?.find((choice) => choice !== lastMission.correctAnswer)
    if (!wrongChoice) throw new Error('Grade 1 final practice mission needs a wrong choice')
    await page.getByTestId(`grade1-choice-${wrongChoice}`).click()
  } else {
    const wrongAnswer = lastMission.correctAnswer === '999999' ? '999998' : '999999'
    await page.getByTestId('grade1-number-input').fill(wrongAnswer)
    await page.getByTestId('grade1-number-submit').click()
  }

  await expect(page.getByTestId('grade1-island-completion-count-cove')).toHaveText('섬 완료')
  const completionProgress = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || '{}')
  ), GRADE1_PROGRESS_KEY)
  expect(completionProgress.completedIslandIds).toContain('count-cove')
  expect(completionProgress.reviewStageIds).toContain(lastPracticeId)
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
  await expect(page).toHaveURL(/\/math_assist\/grade\/2\/mission\/?\?unitId=g2-1-place-value&mode=basic$/)
  await expect(page.getByTestId('grade2-unit-list')).toHaveCount(0)
  await expect(page.getByTestId('grade2-mission-nav')).toBeVisible()
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-place-value-01')
  await expect(page.getByTestId('grade2-unit-missions').getByTestId(/grade2-mission-node-/)).toHaveCount(6)
  await expect(page.getByTestId('adventure-progress-panel')).toBeVisible()
  await expect(page.getByTestId('grade2-reward-collection')).toBeVisible()

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
  expect(progress.schemaVersion).toBe(4)
  expect(progress.xp).toBe(10)

  const grade2Receipts = await readAttemptReceipts(page)
  expect(grade2Receipts).toHaveLength(2)
  expect(grade2Receipts.map((receipt: { correct: boolean }) => receipt.correct)).toEqual([false, true])
  expect(grade2Receipts[1]).toMatchObject({
    grade: 2,
    activityId: 'g2-1-place-value-01',
    itemId: 'g2-1-place-value-01',
    attemptOrdinal: 1,
    usedHint: true,
  })
  expect(grade2Receipts[1]).not.toHaveProperty('answer')
  expect(grade2Receipts[1]).not.toHaveProperty('strokes')

  const firstState = JSON.parse(await page.evaluate(() => (
    window as typeof window & { render_game_to_text?: () => string }
  ).render_game_to_text?.() ?? '{}'))
  await page.getByTestId('grade2-retry-mission').click()
  const replayState = JSON.parse(await page.evaluate(() => (
    window as typeof window & { render_game_to_text?: () => string }
  ).render_game_to_text?.() ?? '{}'))
  expect(replayState.missionSeed).not.toBe(firstState.missionSeed)
  await page.getByTestId('grade2-integer-input').fill('342')
  await page.getByTestId('grade2-integer-submit').click()
  await expect(page.getByTestId('daily-goal')).toContainText('1/8')

  const replayProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), GRADE2_PROGRESS_KEY)
  expect(replayProgress.xp).toBe(10)
  expect(replayProgress.solvedVariantKeys).toHaveLength(1)

  await page.getByTestId('next-grade2-mission').click()
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-place-value-02')
  await expect(page.getByTestId('grade2-reward-panel')).toHaveCount(0)
})

test('2학년 기본과 연습은 잠금 없이 열리고 연습 6문제를 확인해야 단원을 완료한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/2`)

  const basicLink = page.getByTestId('grade2-basic-g2-1-place-value')
  const practiceLink = page.getByTestId('grade2-practice-g2-1-place-value')
  await expect(basicLink).toHaveAttribute('href', /mode=basic/)
  await expect(practiceLink).toHaveAttribute('href', /mode=practice/)
  await expect(practiceLink).toBeEnabled()
  await expect(page.getByTestId('grade2-unit-completion-g2-1-place-value')).not.toContainText('단원 완료')

  await basicLink.click()
  await expect(page.getByTestId('grade2-mode-basic')).toHaveAttribute('aria-current', 'page')
  await expect(page.getByTestId('grade2-unit-missions').getByTestId(/grade2-mission-node-/)).toHaveCount(6)
  await page.getByTestId('grade2-mode-practice').click()
  await expect(page).toHaveURL(/unitId=g2-1-place-value&mode=practice/)
  await expect(page.getByTestId('grade2-mode-practice')).toHaveAttribute('aria-current', 'page')
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-place-value-01-v1')
  await expect(page.getByTestId('grade2-unit-missions').getByTestId(/grade2-mission-node-/)).toHaveCount(6)

  const practiceIds = Array.from(
    { length: 6 },
    (_, index) => `g2-1-place-value-0${index + 1}-v1`,
  )
  await page.evaluate(
    ([key, missionIds]) => {
      const current = JSON.parse(localStorage.getItem(key) || '{}')
      localStorage.setItem(key, JSON.stringify({
        ...current,
        schemaVersion: 4,
        checkedMissionIds: missionIds,
        completedUnitIds: ['g2-1-place-value'],
      }))
    },
    [GRADE2_PROGRESS_KEY, practiceIds] as const,
  )
  await page.goto(`${BASE_PATH}/grade/2`)
  await expect(page.getByTestId('grade2-unit-completion-g2-1-place-value')).toContainText('단원 완료')

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/grade/2/mission?unitId=g2-1-place-value&mode=practice`)
    await expect(page.getByTestId('grade2-mode-practice')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  }
})

test('2학년 기존 연습 링크는 mode가 없어도 같은 v1 문제를 연다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/2/mission?unitId=g2-1-place-value&missionId=g2-1-place-value-03-v1`)

  await expect(page.getByTestId('grade2-mode-practice')).toHaveAttribute('aria-current', 'page')
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute(
    'data-mission-id',
    'g2-1-place-value-03-v1',
  )
  await expect(page.getByTestId('grade2-unit-missions').getByTestId(/grade2-mission-node-/)).toHaveCount(6)
})

test('2학년 풀이장은 문항 이동과 새로고침을 복구하고 재시작을 격리한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/2/mission?unitId=g2-1-place-value`)
  await drawScratchStroke(page)

  await page.getByTestId('grade2-mission-node-2').click()
  await expect.poll(() => paintedScratchPixels(page)).toBe(0)
  await drawScratchStroke(page)
  await page.getByTestId('grade2-mission-node-1').click()
  await expect.poll(() => paintedScratchPixels(page)).toBeGreaterThan(0)
  await page.reload()
  await expect.poll(() => paintedScratchPixels(page)).toBeGreaterThan(0)

  await page.getByTestId('grade2-integer-input').fill('342')
  await page.getByTestId('grade2-integer-submit').click()
  await expect(page.getByLabel('문제 풀이를 쓰는 캔버스')).toHaveAttribute('aria-disabled', 'true')

  await page.getByTestId('grade2-retry-mission').click()
  await expect(page.getByLabel('문제 풀이를 쓰는 캔버스')).toHaveAttribute('aria-disabled', 'false')
  await expect.poll(() => paintedScratchPixels(page)).toBe(0)
  await drawScratchStroke(page)
  await page.reload()
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-place-value-01')
  await expect.poll(() => paintedScratchPixels(page)).toBeGreaterThan(0)
  const replayProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), GRADE2_PROGRESS_KEY)
  expect(replayProgress.missionSketchRunOrdinal).toBe(1)
  const documents = await page.evaluate(() => Object.keys(localStorage).filter(
    (key) => key.startsWith('mathAssist_sketch_v1:'),
  ))
  expect(documents).toHaveLength(3)
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
  const grade2ReceiptCountBeforeFormatError = (await readAttemptReceipts(page)).length
  await page.getByTestId('grade2-time-hours').fill('3')
  await page.getByTestId('grade2-time-minutes').fill('60')
  await page.getByTestId('grade2-time-submit').click()
  await expect(page.getByTestId('grade2-input-error')).toBeVisible()
  expect((await readAttemptReceipts(page))).toHaveLength(grade2ReceiptCountBeforeFormatError)

  await page.getByTestId('grade2-time-minutes').fill('25')
  await page.getByTestId('grade2-time-submit').click()
  await expect(page.getByTestId('grade2-mission-success')).toBeVisible()

  await page.getByTestId('next-grade2-mission').click()
  await page.getByTestId('grade2-duration-hours').fill('1')
  await page.getByTestId('grade2-duration-minutes').fill('0')
  await page.getByTestId('grade2-duration-submit').click()
  await expect(page.getByTestId('grade2-mission-success')).toBeVisible()
})

test('2학년 분류하기 시각화는 풀이 전 개수 숫자를 표식으로 보여준다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/2/mission?unitId=g2-1-classification`)
  await expect(page.getByTestId('grade2-mission-card')).toHaveAttribute('data-mission-id', 'g2-1-classification-01')

  const classificationVisual = page.getByTestId('grade2-visual-classification-table')
  await expect(classificationVisual.getByTestId('grade2-classification-marks-0')).toBeVisible()
  await expect(classificationVisual.getByText('4', { exact: true })).toHaveCount(0)
  await expect(classificationVisual.getByTestId('grade2-classification-category-0')).toHaveCSS('color', 'rgb(153, 27, 27)')
  await expect(classificationVisual.getByTestId('grade2-classification-category-1')).toHaveCSS('color', 'rgb(30, 58, 138)')
  await expect(classificationVisual.getByTestId('grade2-classification-category-2')).toHaveCSS('color', 'rgb(133, 77, 14)')

  const markColors = await Promise.all(
    [0, 1, 2].map((index) =>
      classificationVisual
        .getByTestId(`grade2-classification-mark-${index}-0`)
        .evaluate((node) => getComputedStyle(node).backgroundColor)
    )
  )
  expect(new Set(markColors).size).toBe(3)

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

test('3학년 탐험섬에서 단원 선택, 발판, 힌트, 보상 흐름을 확인한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/3`)

  await expect(page.getByTestId('grade3-unit-list')).toBeVisible()
  await expect(page.getByTestId('grade3-unit-card-g3-1-add-sub')).toBeVisible()
  await expect(page.getByTestId('grade3-mission-card')).toHaveCount(0)

  await page.getByTestId('grade3-unit-card-g3-1-add-sub').click()
  await expect(page).toHaveURL(/\/math_assist\/grade\/3\/mission\/?\?unitId=g3-1-add-sub&mode=basic$/)
  await expect(page.getByTestId('grade3-mission-nav')).toBeVisible()
  await expect(page.getByTestId('grade3-mission-card')).toHaveAttribute('data-mission-id', 'g3-1-add-sub-01')
  await expect(page.getByTestId('grade3-unit-missions').getByTestId(/grade3-mission-node-/)).toHaveCount(3)

  await page.getByTestId('grade3-scaffold-option-일').click()
  await page.getByTestId('grade3-integer-input').fill('111')
  await page.getByTestId('grade3-integer-submit').click()
  await expect(page.getByTestId('grade3-mission-hint')).toBeVisible()

  await page.getByTestId('grade3-integer-input').fill('385')
  await page.getByTestId('grade3-integer-submit').click()
  await expect(page.getByTestId('grade3-mission-success')).toBeVisible()
  await expect(page.getByTestId('grade3-reward-panel')).toBeVisible()

  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), GRADE3_PROGRESS_KEY)
  expect(progress.completedMissionIds).toContain('g3-1-add-sub-01')
  expect(progress.reviewMissionIds).toContain('g3-1-add-sub-01')
  expect(progress.todaySolvedCount).toBe(1)

  const grade3Receipts = await readAttemptReceipts(page)
  expect(grade3Receipts).toHaveLength(2)
  expect(grade3Receipts.map((receipt: { correct: boolean }) => receipt.correct)).toEqual([false, true])
  expect(grade3Receipts[1]).toMatchObject({
    grade: 3,
    activityId: 'g3-1-add-sub-01',
    itemId: 'g3-1-add-sub-01',
    attemptOrdinal: 1,
    usedHint: true,
  })
  expect(grade3Receipts[1]).not.toHaveProperty('answer')
  expect(grade3Receipts[1]).not.toHaveProperty('strokes')

  await page.getByTestId('next-grade3-mission').click()
  await expect(page.getByTestId('grade3-mission-card')).toHaveAttribute('data-mission-id', 'g3-1-add-sub-02')
  await expect(page.getByTestId('grade3-reward-panel')).toHaveCount(0)
})

test('3학년 미션을 떠났다가 돌아오면 새 실행의 정답 영수증을 보존한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-1-add-sub`)

  await page.getByTestId('grade3-integer-input').fill('111')
  await page.getByTestId('grade3-integer-submit').click()
  await expect(page.getByTestId('grade3-mission-hint')).toBeVisible()

  await page.getByTestId('grade3-mission-node-2').click()
  await page.getByTestId('grade3-mission-node-1').click()
  await page.getByTestId('grade3-integer-input').fill('385')
  await page.getByTestId('grade3-integer-submit').click()
  await expect(page.getByTestId('grade3-mission-success')).toBeVisible()

  const receipts = (await readAttemptReceipts(page)).filter(
    (receipt: { grade: number; activityId: string }) => (
      receipt.grade === 3 && receipt.activityId === 'g3-1-add-sub-01'
    ),
  )
  expect(receipts.map((receipt: { correct: boolean }) => receipt.correct)).toEqual([false, true])
  expect(receipts.map((receipt: { attemptOrdinal: number }) => receipt.attemptOrdinal)).toEqual([0, 0])
  expect(new Set(receipts.map((receipt: { attemptId: string }) => receipt.attemptId)).size).toBe(2)
})

test('3학년 들이와 무게는 기본·연습에서 정량 그림과 안전한 공개 흐름으로 푼다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const sessions = [
    {
      mode: 'basic',
      missions: [
        { order: 1, code: '[4수03-17]', fields: [['grade3-capacity-liters', '1'], ['grade3-capacity-milliliters', '250']], submit: 'grade3-capacity-submit', shown: '1L 250mL' },
        { order: 2, code: '[4수03-19]', fields: [['grade3-capacity-liters', '3'], ['grade3-capacity-milliliters', '400']], submit: 'grade3-capacity-submit', shown: '3L400mL' },
        { order: 3, code: '[4수03-22]', fields: [['grade3-integer-input', '4000']], submit: 'grade3-integer-submit', shown: '4000kg' },
      ],
    },
    {
      mode: 'practice',
      missions: [
        { order: 1, code: '[4수03-20]', fields: [['grade3-weight-kilograms', '2'], ['grade3-weight-grams', '300']], submit: 'grade3-weight-submit', shown: '2kg 300g' },
        { order: 2, code: '[4수03-18]', fields: [['grade3-integer-input', '3250']], submit: 'grade3-integer-submit', shown: '3250mL' },
        { order: 3, code: '[4수03-23]', fields: [['grade3-weight-kilograms', '2'], ['grade3-weight-grams', '450']], submit: 'grade3-weight-submit', shown: '2kg450g' },
      ],
    },
  ] as const

  for (const session of sessions) {
    await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-2-capacity-weight&mode=${session.mode}`)
    await expect(page.getByTestId('grade3-unit-missions').getByTestId(/grade3-mission-node-/)).toHaveCount(3)
    for (const mission of session.missions) {
      await page.getByTestId(`grade3-mission-node-${mission.order}`).click()
      const card = page.getByTestId('grade3-mission-card')
      await expect(card).toContainText(mission.code)
      const result = card.locator('[data-testid="grade3-unit-result"], [data-testid="grade3-tonne-result"]')
      await expect(result).toContainText('□')
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)

      for (const [testId, value] of mission.fields) {
        await page.getByTestId(testId).fill(value)
      }
      await page.getByTestId(mission.submit).click()
      await expect(page.getByTestId('grade3-mission-success')).toBeVisible()
      await expect(result).toContainText(mission.shown)
    }
  }

  await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-2-capacity-weight&mode=basic`)
  await page.getByTestId('grade3-mission-node-3').click()
  await expect(page.getByTestId('grade3-visual-tonne-scale').locator('[data-tonne-block="true"]')).toHaveCount(4)
  await expect(page.getByTestId('grade3-visual-tonne-scale')).toContainText('1t = 1000kg')
  const gameState = await page.evaluate(() => JSON.parse(
    (window as unknown as { render_game_to_text: () => string }).render_game_to_text()
  ))
  expect(gameState).toMatchObject({
    selectedMissionId: 'g3-2-capacity-weight-06',
    curriculumCode: '[4수03-22]',
    visualModel: 'tonne-scale',
  })
})

test('3학년 원 구성은 폭 조절과 실제 그리기를 답 제출의 선행조건으로 유지한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-2-circle`)
  await page.getByTestId('grade3-mission-node-3').click()

  const card = page.getByTestId('grade3-mission-card')
  await expect(card).toHaveAttribute('data-mission-id', 'g3-2-circle-03')
  await expect(card).toContainText('지름 12cm')
  const preAnswerExposure = await card.evaluate((element) => ({
    htmlHasAnswer: element.outerHTML.includes('6cm'),
    textHasAnswer: element.textContent?.includes('6cm') ?? false,
    accessibleNames: Array.from(element.querySelectorAll('[aria-label]'))
      .map((node) => node.getAttribute('aria-label'))
      .join(' '),
    answerAttributes: Array.from(element.querySelectorAll('*')).some((node) =>
      Array.from(node.attributes).some((attribute) =>
        /^data-(?:answer|correct-answer|radius)$/.test(attribute.name)
      )
    ),
  }))
  expect(preAnswerExposure).toEqual({
    htmlHasAnswer: false,
    textHasAnswer: false,
    accessibleNames: expect.not.stringMatching(/6cm|6센티미터/),
    answerAttributes: false,
  })
  for (const testId of [
    'grade3-compass-decrease',
    'grade3-compass-increase',
    'grade3-compass-draw',
  ]) {
    const box = await page.getByTestId(testId).boundingBox()
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(48)
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48)
  }

  const answer = page.getByTestId('grade3-integer-input')
  const submit = page.getByTestId('grade3-integer-submit')
  await answer.fill('6')
  await expect(submit).toBeDisabled()

  await page.getByTestId('grade3-compass-draw').click()
  await expect(page.getByTestId('grade3-compass-drawn-circle')).toBeVisible()
  await expect(submit).toBeDisabled()

  await answer.fill('4')
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(page.getByTestId('grade3-mission-hint')).toBeVisible()
  await expect(page.getByTestId('grade3-mission-success')).toHaveCount(0)

  await page.getByTestId('grade3-compass-increase').click()
  await page.getByTestId('grade3-compass-increase').click()
  await expect(page.getByTestId('grade3-compass-width')).toHaveText('6')
  await expect(page.getByTestId('grade3-compass-drawn-circle')).toHaveCount(0)
  await answer.fill('6')
  await expect(submit).toBeDisabled()

  await page.getByTestId('grade3-compass-draw').click()
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(page.getByTestId('grade3-mission-success')).toBeVisible()
  await expect(page.getByTestId('grade3-compass-radius-result')).toContainText('6cm')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)

  await page.getByTestId('grade3-retry-mission').click()
  await expect(page.getByTestId('grade3-compass-width')).toHaveText('4')
  await expect(page.getByTestId('grade3-compass-drawn-circle')).toHaveCount(0)
  await expect(page.getByTestId('grade3-integer-submit')).toBeDisabled()
})

test('3학년 풀이장은 문항 이동과 새로고침을 복구하고 재시작을 격리한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-1-add-sub`)
  await drawScratchStroke(page)

  await page.getByTestId('grade3-mission-node-2').click()
  await expect.poll(() => paintedScratchPixels(page)).toBe(0)
  await drawScratchStroke(page)
  await page.getByTestId('grade3-mission-node-1').click()
  await expect.poll(() => paintedScratchPixels(page)).toBeGreaterThan(0)
  await page.reload()
  await expect.poll(() => paintedScratchPixels(page)).toBeGreaterThan(0)

  await page.getByTestId('grade3-integer-input').fill('385')
  await page.getByTestId('grade3-integer-submit').click()
  await expect(page.getByLabel('문제 풀이를 쓰는 캔버스')).toHaveAttribute('aria-disabled', 'true')

  await page.getByTestId('grade3-retry-mission').click()
  await expect(page.getByLabel('문제 풀이를 쓰는 캔버스')).toHaveAttribute('aria-disabled', 'false')
  await expect.poll(() => paintedScratchPixels(page)).toBe(0)
  await drawScratchStroke(page)
  await page.reload()
  await expect(page.getByTestId('grade3-mission-card')).toHaveAttribute('data-mission-id', 'g3-1-add-sub-01')
  await expect.poll(() => paintedScratchPixels(page)).toBeGreaterThan(0)
  const replayProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), GRADE3_PROGRESS_KEY)
  expect(replayProgress.missionSketchRunOrdinal).toBe(1)
  const documents = await page.evaluate(() => Object.keys(localStorage).filter(
    (key) => key.startsWith('mathAssist_sketch_v1:'),
  ))
  expect(documents).toHaveLength(3)
})

test('3학년 구조화 입력 오류는 오답 횟수로 기록하지 않는다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-1-fraction-decimal`)

  await expect(page.getByTestId('grade3-mission-card')).toHaveAttribute('data-mission-id', 'g3-1-fraction-decimal-01')
  await page.getByTestId('grade3-scaffold-option-전체 5').click()
  await page.getByTestId('grade3-fraction-numerator').fill('2')
  await page.getByTestId('grade3-fraction-denominator').fill('0')
  await page.getByTestId('grade3-fraction-submit').click()

  await expect(page.getByTestId('grade3-input-error')).toBeVisible()
  await expect(page.getByTestId('grade3-mission-hint')).toHaveCount(0)
  expect(await page.evaluate((key) => localStorage.getItem(key), ATTEMPT_RECEIPT_KEY)).toBeNull()

  const progressAfterInputError = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), GRADE3_PROGRESS_KEY)
  expect(progressAfterInputError.reviewMissionIds).toEqual([])
  expect(progressAfterInputError.skillSummaryByTag).toEqual({})

  await page.getByTestId('grade3-fraction-denominator').fill('5')
  await page.getByTestId('grade3-fraction-submit').click()
  await expect(page.getByTestId('grade3-mission-success')).toBeVisible()

  await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-1-length-time`)
  await page.getByTestId('grade3-length-centimeters').fill('4')
  await page.getByTestId('grade3-length-millimeters').fill('7')
  await page.getByTestId('grade3-length-submit').click()
  await expect(page.getByTestId('grade3-mission-success')).toBeVisible()

  await page.getByTestId('next-grade3-mission').click()
  await page.getByTestId('grade3-time-hours').fill('3')
  await page.getByTestId('grade3-time-minutes').fill('25')
  await page.getByTestId('grade3-time-seconds').fill('40')
  await page.getByTestId('grade3-time-submit').click()
  await expect(page.getByTestId('grade3-mission-success')).toBeVisible()
})

test('3학년 시각화는 풀이 전 정답을 숨기고 성공 후 공개한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-1-add-sub`)

  const verticalVisual = page.getByTestId('grade3-visual-vertical-operation')
  await expect(verticalVisual.getByTestId('grade3-vertical-result')).toContainText('□')
  await expect(verticalVisual.getByText('385', { exact: true })).toHaveCount(0)

  await page.getByTestId('grade3-integer-input').fill('385')
  await page.getByTestId('grade3-integer-submit').click()
  await expect(page.getByTestId('grade3-mission-success')).toBeVisible()
  await expect(verticalVisual.getByTestId('grade3-vertical-result')).toContainText('385')

  await page.goto(`${BASE_PATH}/grade/3/mission?unitId=g3-1-fraction-decimal`)
  const fractionVisual = page.getByTestId('grade3-visual-fraction-strip')
  await expect(fractionVisual.getByTestId('grade3-fraction-result')).toContainText('□')
  await expect(fractionVisual.getByText('2/5', { exact: true })).toHaveCount(0)

  await page.getByTestId('grade3-fraction-numerator').fill('2')
  await page.getByTestId('grade3-fraction-denominator').fill('5')
  await page.getByTestId('grade3-fraction-submit').click()
  await expect(page.getByTestId('grade3-mission-success')).toBeVisible()
  await expect(fractionVisual.getByTestId('grade3-fraction-result')).toContainText('2/5')
})

test('문제 렌더러 검수 화면은 실제 표본과 상태를 모바일·태블릿에서 재현한다', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', error => browserErrors.push(error.message))
  await page.evaluate(() => {
    localStorage.setItem('mathAssist_reviewPreservationProbe', 'keep')
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(
    `${BASE_PATH}/review/problems?id=1%3Amission%3Acount-cove-03&state=pre&variant=minimum`
  )

  const surface = page.getByTestId('problem-review-surface')
  await expect(surface).toHaveAttribute('data-review-id', '1:mission:count-cove-03')
  await expect(surface).toHaveAttribute('data-review-variant', 'minimum')
  await expect(surface).toHaveAttribute('data-review-state', 'pre')
  await expect(surface).toHaveAttribute('data-review-answer-visible', 'false')
  await expect(surface).toHaveAttribute('data-review-status', 'pass')
  await expect(surface.locator('[data-actual-renderer]')).toHaveAttribute(
    'data-actual-renderer',
    'grade1'
  )
  await expect(page.getByText('1622', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('1013', { exact: true }).first()).toBeVisible()
  await expect(page.getByTestId('problem-review-hints')).toHaveCount(0)
  await expect(page.getByTestId('problem-review-answer')).toHaveCount(0)
  await expect(page.getByTestId('problem-review-solution')).toHaveCount(0)
  const hashes = await surface.evaluate(element => ({
    current: element.getAttribute('data-review-content-hash'),
    reviewed: element.getAttribute('data-review-reviewed-hash'),
  }))
  expect(hashes.current).toBe(hashes.reviewed)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    )
  ).toBe(false)
  expect(await page.locator(
    '[data-testid^="review-"][data-testid$="-filter"]'
  ).evaluateAll(elements => elements.flatMap(element => {
    const rect = element.getBoundingClientRect()
    return rect.left < -1 || rect.right > document.documentElement.clientWidth + 1
      ? [element.getAttribute('data-testid')]
      : []
  }))).toEqual([])

  await page.getByTestId('review-variant-select').selectOption('maximum')
  await expect(surface).toHaveAttribute('data-review-variant', 'maximum')
  await expect(page).toHaveURL(/variant=maximum/)

  await page.getByTestId('review-state-hint').click()
  await expect(surface).toHaveAttribute('data-review-state', 'hint')
  await expect(page).toHaveURL(/state=hint/)
  await expect(page.getByTestId('problem-review-hints')).toBeVisible()
  await expect(page.getByTestId('problem-review-answer')).toHaveCount(0)

  await page.getByTestId('review-state-revealed').click()
  await expect(surface).toHaveAttribute('data-review-state', 'revealed')
  await expect(surface).toHaveAttribute('data-review-answer-visible', 'true')
  await expect(page).toHaveURL(/state=revealed/)
  await expect(page.getByTestId('problem-review-answer')).toBeVisible()
  await expect(page.getByTestId('problem-review-solution')).toBeVisible()

  await page.getByTestId('review-grade-filter').selectOption('all')
  await page.getByTestId('review-visual-filter').selectOption('all')
  await page.getByTestId('review-status-filter').selectOption('blocked')
  await expect(page.getByTestId('review-source-select').locator('option')).toHaveCount(0)
  await page.getByTestId('review-status-filter').selectOption('pass')
  await expect(page.getByTestId('review-source-select').locator('option')).toHaveCount(1_622)
  await page.getByTestId('review-reset-filters').click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('review-export-ledger').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('problem-editorial-review-v1.json')
  const downloadPath = await download.path()
  expect(downloadPath).not.toBeNull()
  const exportedLedger = JSON.parse(await readFile(downloadPath!, 'utf8'))
  expect(exportedLedger.schemaVersion).toBe(1)
  expect(exportedLedger.items).toHaveLength(1_622)
  expect(new Set(
    exportedLedger.items.map((item: { reviewId: string }) => item.reviewId)
  ).size).toBe(1_622)
  expect(exportedLedger.items.every(
    (item: { status: string }) => item.status === 'pass'
  )).toBe(true)
  expect(exportedLedger.items.every(
    (item: { findingCategories: string[] }) => item.findingCategories.length === 0
  )).toBe(true)

  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto(
    `${BASE_PATH}/review/problems?id=5%3Atemplate%3Atmpl-cuboidnet-A-01&state=pre`
  )
  await expect(surface).toHaveAttribute(
    'data-review-id',
    '5:template:tmpl-cuboidnet-A-01'
  )
  await expect(surface).toHaveAttribute('data-review-visual-kind', 'cuboid-net')
  await expect(surface).toHaveAttribute('data-review-answer-visible', 'false')
  await expect(surface.locator('[data-actual-renderer]')).toHaveAttribute(
    'data-actual-renderer',
    'practice'
  )
  await expect(page.getByTestId('problem-review-answer')).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    )
  ).toBe(false)
  expect(await page.evaluate(
    () => localStorage.getItem('mathAssist_reviewPreservationProbe')
  )).toBe('keep')
  expect(browserErrors).toEqual([])
})
