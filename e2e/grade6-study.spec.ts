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
const ATTEMPT_RECEIPT_KEY = 'mathAssist_attemptReceipts_v1'

type StoredGrade6Problem =
  | {
      type: 'choice'
      correctAnswer: string
      correctChoiceIndex: number
    }
  | {
      type: 'number'
      correctAnswer: string
    }

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

async function answerStoredProblem(page: Page, problem: StoredGrade6Problem) {
  if (problem.type === 'choice') {
    await page.getByTestId(`choice-${problem.correctChoiceIndex}`).click()
    return
  }
  await enterKeypadAnswer(page, problem.correctAnswer)
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
  await page.addInitScript(() => {
    Object.defineProperty(Date, 'now', { value: () => 4 })
  })
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

test('각기둥 모형과 전개도를 밑면 변 수에서 정량 렌더링한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/g6prismpyramid-001?set=A&count=10`)
  await expect(page.getByTestId('practice-session')).toBeVisible()
  const visualIndexes = await page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return {
      prism: session.problems.findIndex((problem: {
        visual?: { type?: string; kind?: string }
      }) => problem.visual?.type === 'poly-solid' && problem.visual.kind === 'prism'),
      net: session.problems.findIndex((problem: {
        visual?: { type?: string; baseSides?: number; lateralFaces?: number; baseCount?: number }
      }) => (
        problem.visual?.type === 'prism-net' &&
        problem.visual.lateralFaces === problem.visual.baseSides &&
        problem.visual.baseCount === 2
      )),
    }
  }, GRADE6_KEYS[0])
  expect(visualIndexes.prism).toBeGreaterThanOrEqual(0)
  expect(visualIndexes.net).toBeGreaterThanOrEqual(0)

  await page.getByTestId(`progress-step-${visualIndexes.prism + 1}`).click()
  const prism = page.getByTestId('geometry-visual-poly-solid')
  await expect(prism).toBeVisible()
  const prismModel = await page.evaluate(({ key, itemIndex }) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return session.problems[itemIndex].visual
  }, { key: GRADE6_KEYS[0], itemIndex: visualIndexes.prism })
  await expect(prism.locator('[data-solid-base]')).toHaveCount(2)
  await expect(prism.locator('[data-solid-lateral-edge]')).toHaveCount(prismModel.baseSides)
  await expect(prism.locator('[data-solid-vertex]')).toHaveCount(prismModel.baseSides * 2)

  await page.getByTestId(`progress-step-${visualIndexes.net + 1}`).click()
  const net = page.getByTestId('geometry-visual-prism-net')
  await expect(net).toBeVisible()
  const netModel = await page.evaluate(({ key, itemIndex }) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return session.problems[itemIndex].visual
  }, { key: GRADE6_KEYS[0], itemIndex: visualIndexes.net })
  await expect(net.locator('[data-net-base]')).toHaveCount(2)
  await expect(net.locator('[data-net-lateral-face]')).toHaveCount(netModel.baseSides)
  await expect(page.locator('[data-answer]')).toHaveCount(0)
  await expect(page.getByText('정답:', { exact: false })).toHaveCount(0)
})

test('곡면 입체와 원기둥 전개도를 실제 반복 수와 조각 수로 렌더링한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/g6roundsolid-001?set=A&count=10`)
  await expect(page.getByTestId('practice-session')).toBeVisible()
  const visualIndexes = await page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return {
      cylinder: session.problems.findIndex((problem: {
        visual?: { type?: string; kind?: string; copies?: number }
      }) => (
        problem.visual?.type === 'round-solid' &&
        problem.visual.kind === 'cylinder' &&
        (problem.visual.copies ?? 1) > 1
      )),
      incompleteNet: session.problems.findIndex((problem: {
        visual?: {
          type?: string
          copies?: number
          circleCount?: number
          rectangleCount?: number
        }
      }) => (
        problem.visual?.type === 'cylinder-net' &&
        (problem.visual.copies ?? 1) > 1 &&
        problem.visual.circleCount === 1 &&
        problem.visual.rectangleCount === 1
      )),
    }
  }, GRADE6_KEYS[0])
  expect(visualIndexes.cylinder).toBeGreaterThanOrEqual(0)
  expect(visualIndexes.incompleteNet).toBeGreaterThanOrEqual(0)

  await page.getByTestId(`progress-step-${visualIndexes.cylinder + 1}`).click()
  const cylinder = page.getByTestId('geometry-visual-round-solid')
  await expect(cylinder).toBeVisible()
  const cylinderModel = await page.evaluate(({ key, itemIndex }) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return session.problems[itemIndex].visual
  }, { key: GRADE6_KEYS[0], itemIndex: visualIndexes.cylinder })
  await expect(cylinder.locator('[data-round-copy]')).toHaveCount(cylinderModel.copies)
  await expect(cylinder.locator('[data-round-base]')).toHaveCount(cylinderModel.copies * 2)
  await expect(cylinder.locator('[data-round-curved-surface]')).toHaveCount(cylinderModel.copies)
  await expect(cylinder.locator('[data-round-vertex]')).toHaveCount(0)

  await page.getByTestId(`progress-step-${visualIndexes.incompleteNet + 1}`).click()
  const net = page.getByTestId('geometry-visual-cylinder-net')
  await expect(net).toBeVisible()
  const netModel = await page.evaluate(({ key, itemIndex }) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return session.problems[itemIndex].visual
  }, { key: GRADE6_KEYS[0], itemIndex: visualIndexes.incompleteNet })
  await expect(net.locator('[data-cylinder-net-copy]')).toHaveCount(netModel.copies)
  await expect(net.locator('[data-cylinder-net-circle]')).toHaveCount(
    netModel.copies * netModel.circleCount,
  )
  await expect(net.locator('[data-cylinder-net-rectangle]')).toHaveCount(
    netModel.copies * netModel.rectangleCount,
  )
  await expect(page.locator('[data-answer]')).toHaveCount(0)
  await expect(page.getByText('정답:', { exact: false })).toHaveCount(0)
})

test('쌓기나무와 위·앞·옆 모양을 하나의 높이 격자에서 정량 렌더링한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/g6spatial-001?set=A&count=10`)
  await expect(page.getByTestId('practice-session')).toBeVisible()
  const visualIndexes = await page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return {
      stack: session.problems.findIndex((problem: {
        visual?: { type?: string; mode?: string }
      }) => problem.visual?.type === 'cube-stack' && problem.visual.mode === 'stack'),
      views: session.problems.findIndex((problem: {
        visual?: { type?: string; mode?: string }
      }) => problem.visual?.type === 'cube-stack' && problem.visual.mode === 'all-views'),
    }
  }, GRADE6_KEYS[0])
  expect(visualIndexes.stack).toBeGreaterThanOrEqual(0)
  expect(visualIndexes.views).toBeGreaterThanOrEqual(0)

  await page.getByTestId(`progress-step-${visualIndexes.stack + 1}`).click()
  const stack = page.getByTestId('geometry-visual-cube-stack')
  await expect(stack).toBeVisible()
  const stackModel = await page.evaluate(({ key, itemIndex }) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return session.problems[itemIndex].visual
  }, { key: GRADE6_KEYS[0], itemIndex: visualIndexes.stack })
  const totalCubes = stackModel.heights.flat().reduce(
    (sum: number, height: number) => sum + height,
    0,
  )
  await expect(stack.locator('[data-stack-cube]')).toHaveCount(totalCubes)

  await page.getByTestId(`progress-step-${visualIndexes.views + 1}`).click()
  const views = page.getByTestId('geometry-visual-cube-stack')
  await expect(views).toBeVisible()
  const viewModel = await page.evaluate(({ key, itemIndex }) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return session.problems[itemIndex].visual
  }, { key: GRADE6_KEYS[0], itemIndex: visualIndexes.views })
  const topCount = viewModel.heights.flat().filter((height: number) => height > 0).length
  const frontCount = viewModel.heights[0].map((_: number, columnIndex: number) => (
    Math.max(...viewModel.heights.map((row: number[]) => row[columnIndex]))
  )).reduce((sum: number, height: number) => sum + height, 0)
  const sideCount = viewModel.heights.map((row: number[]) => Math.max(...row))
    .reduce((sum: number, height: number) => sum + height, 0)
  await expect(views.locator('[data-top-occupied]')).toHaveCount(topCount)
  await expect(views.locator('[data-front-cell]')).toHaveCount(frontCount)
  await expect(views.locator('[data-side-cell]')).toHaveCount(sideCount)
  await expect(page.locator('[data-answer]')).toHaveCount(0)
  await expect(page.getByText('정답:', { exact: false })).toHaveCount(0)
})

test('반지름에서 원주·넓이·측정 원주를 같은 원 모델로 렌더링한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/g6circle-001?set=A&count=10`)
  await expect(page.getByTestId('practice-session')).toBeVisible()
  const visualIndexes = await page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return {
      measuredPi: session.problems.findIndex((problem: {
        visual?: { type?: string; focus?: string }
      }) => problem.visual?.type === 'circle-measurement' && problem.visual.focus === 'pi'),
      repeated: session.problems.findIndex((problem: {
        visual?: { type?: string; copies?: number }
      }) => problem.visual?.type === 'circle-measurement' && (problem.visual.copies ?? 1) > 1),
    }
  }, GRADE6_KEYS[0])
  expect(visualIndexes.measuredPi).toBeGreaterThanOrEqual(0)
  expect(visualIndexes.repeated).toBeGreaterThanOrEqual(0)

  await page.getByTestId(`progress-step-${visualIndexes.measuredPi + 1}`).click()
  const measured = page.getByTestId('geometry-visual-circle-measurement')
  await expect(measured).toBeVisible()
  await expect(measured.locator('[data-circle-diameter]')).toHaveCount(1)
  await expect(measured.getByText(/측정한 원주/)).toBeVisible()

  await page.getByTestId(`progress-step-${visualIndexes.repeated + 1}`).click()
  const repeated = page.getByTestId('geometry-visual-circle-measurement')
  const repeatedModel = await page.evaluate(({ key, itemIndex }) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return session.problems[itemIndex].visual
  }, { key: GRADE6_KEYS[0], itemIndex: visualIndexes.repeated })
  await expect(repeated.locator('[data-circle-copy]')).toHaveCount(repeatedModel.copies)
  await expect(repeated.locator('[data-circle-outer]')).toHaveCount(repeatedModel.copies)
  await expect(page.locator('[data-answer]')).toHaveCount(0)
  await expect(page.getByText('정답:', { exact: false })).toHaveCount(0)
})

test('직육면체의 면·부분 채움·미지 높이를 같은 세 길이 모델로 렌더링한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/g6volume-001?set=A&count=10`)
  await expect(page.getByTestId('practice-session')).toBeVisible()
  const visualIndexes = await page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return {
      openTop: session.problems.findIndex((problem: {
        visual?: { type?: string; openTop?: boolean }
      }) => problem.visual?.type === 'cuboid' && problem.visual.openTop === true),
      filled: session.problems.findIndex((problem: {
        visual?: { type?: string; fillFraction?: number }
      }) => problem.visual?.type === 'cuboid' && (problem.visual.fillFraction ?? 0) > 0),
      unknown: session.problems.findIndex((problem: {
        visual?: { type?: string; unknownMeasurement?: string }
      }) => problem.visual?.type === 'cuboid' && problem.visual.unknownMeasurement === 'height'),
    }
  }, GRADE6_KEYS[0])
  expect(visualIndexes.openTop).toBeGreaterThanOrEqual(0)
  expect(visualIndexes.filled).toBeGreaterThanOrEqual(0)
  expect(visualIndexes.unknown).toBeGreaterThanOrEqual(0)

  await page.getByTestId(`progress-step-${visualIndexes.openTop + 1}`).click()
  const openTop = page.getByTestId('geometry-visual-cuboid')
  await expect(openTop.locator('[data-cuboid-face]')).toHaveCount(3)
  await expect(openTop.locator('[data-cuboid-open-top]')).toHaveCount(1)

  await page.getByTestId(`progress-step-${visualIndexes.filled + 1}`).click()
  const filled = page.getByTestId('geometry-visual-cuboid')
  await expect(filled.locator('[data-cuboid-fill-plane]')).toHaveCount(1)

  await page.getByTestId(`progress-step-${visualIndexes.unknown + 1}`).click()
  const unknown = page.getByTestId('geometry-visual-cuboid')
  await expect(unknown.getByText('높이 ? cm')).toBeVisible()
  await expect(page.locator('[data-answer]')).toHaveCount(0)
  await expect(page.getByText('정답:', { exact: false })).toHaveCount(0)
})

test('띠그래프와 원그래프를 같은 100% 자료 모델에서 정량 렌더링한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/practice/g6ratiograph-001?set=A&count=10`)
  await expect(page.getByTestId('practice-session')).toBeVisible()
  const visualIndexes = await page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return {
      band: session.problems.findIndex((problem: {
        visual?: { type?: string; props?: { kind?: string } }
      }) => problem.visual?.type === 'ratio_graph' && problem.visual.props?.kind === 'band'),
      circle: session.problems.findIndex((problem: {
        visual?: { type?: string; props?: { kind?: string } }
      }) => problem.visual?.type === 'ratio_graph' && problem.visual.props?.kind === 'circle'),
      masked: session.problems.findIndex((problem: {
        visual?: { type?: string; props?: { maskedValueIndex?: number } }
      }) => (
        problem.visual?.type === 'ratio_graph' &&
        problem.visual.props?.maskedValueIndex !== undefined
      )),
    }
  }, GRADE6_KEYS[0])
  expect(visualIndexes.band).toBeGreaterThanOrEqual(0)
  expect(visualIndexes.circle).toBeGreaterThanOrEqual(0)
  expect(visualIndexes.masked).toBeGreaterThanOrEqual(0)

  await page.getByTestId(`progress-step-${visualIndexes.band + 1}`).click()
  const band = page.getByTestId('problem-diagram-ratio-graph')
  await expect(band.locator('[data-ratio-band-segment]')).toHaveCount(3)

  await page.getByTestId(`progress-step-${visualIndexes.circle + 1}`).click()
  const circle = page.getByTestId('problem-diagram-ratio-graph')
  await expect(circle.locator('[data-ratio-circle-segment]')).toHaveCount(3)

  await page.getByTestId(`progress-step-${visualIndexes.masked + 1}`).click()
  const masked = page.getByTestId('problem-diagram-ratio-graph')
  await expect(masked.getByText('?')).toBeVisible()
  const percentTotal = await page.evaluate(({ key, itemIndex }) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return session.problems[itemIndex].visual.props.segments.reduce(
      (sum: number, segment: { percent: number }) => sum + segment.percent,
      0,
    )
  }, { key: GRADE6_KEYS[0], itemIndex: visualIndexes.masked })
  expect(percentTotal).toBe(100)
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

test('숫자형과 객관식이 섞인 5문제를 모두 확인하면 기본 완료 기록과 기존 6학년 진도를 함께 저장한다', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Date, 'now', { value: () => 1 })
  })
  await page.goto(`${BASE_PATH}/practice/g6ratio-001?set=C&count=5`)
  await expect(page.getByTestId('practice-session')).toBeVisible()

  const storedProblems = await page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null')
    return session.problems as StoredGrade6Problem[]
  }, GRADE6_KEYS[0])
  expect(storedProblems).toHaveLength(5)
  expect(storedProblems.some((problem) => problem.type === 'number')).toBe(true)
  expect(storedProblems.some((problem) => problem.type === 'choice')).toBe(true)

  for (let index = 0; index < storedProblems.length; index += 1) {
    await answerStoredProblem(page, storedProblems[index])
    await page.getByTestId('check-answer-button').click()
    if (index < storedProblems.length - 1) await page.getByTestId('next-button').click()
  }

  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL(new RegExp(`${BASE_PATH}/result/\\?grade=6$`))
  await expect(page.getByTestId('score')).toContainText('5')
  const result = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), GRADE6_KEYS[1])
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), GRADE6_KEYS[2])
  const receipts = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) ?? 'null')?.receipts ?? []
  ), ATTEMPT_RECEIPT_KEY)
  expect(result).toMatchObject({ grade: 6, itemCount: 5, score: 5, total: 5 })
  expect(progress['g6ratio-001']).toMatchObject({
    attemptCount: 1,
    latestScore: 100,
    needsReview: false,
  })
  expect(receipts).toHaveLength(5)
  expect(receipts.every((receipt: { contentReleaseId: string }) => (
    receipt.contentReleaseId === 'grade6-ratio-v1'
  ))).toBe(true)
  expect(await readKeys(page, GRADE5_KEYS)).toEqual([null, null, null])
})

for (const releasedConcept of [
  {
    unitId: 'unit-6-1-fraction-division',
    title: '분수의 나눗셈',
    conceptId: 'g6fractiondiv-001',
    releaseId: 'grade6-fraction-division-v1',
  },
  {
    unitId: 'unit-6-1-fraction-decimal-relations',
    title: '분수와 소수의 관계',
    conceptId: 'g6fractiondecimal-001',
    releaseId: 'grade6-fraction-decimal-v1',
  },
  {
    unitId: 'unit-6-1-decimal-division',
    title: '소수의 나눗셈',
    conceptId: 'g6decimaldiv-001',
    releaseId: 'grade6-decimal-division-v1',
  },
  {
    unitId: 'unit-6-2-proportion',
    title: '비례식과 비례배분',
    conceptId: 'g6proportion-001',
    releaseId: 'grade6-proportion-v1',
  },
  {
    unitId: 'unit-6-1-prisms-pyramids',
    title: '각기둥·각뿔과 전개도',
    conceptId: 'g6prismpyramid-001',
    releaseId: 'grade6-prism-pyramid-v1',
  },
  {
    unitId: 'unit-6-2-round-solids',
    title: '원기둥·원뿔·구와 전개도',
    conceptId: 'g6roundsolid-001',
    releaseId: 'grade6-round-solid-v1',
  },
  {
    unitId: 'unit-6-1-spatial-reasoning',
    title: '쌓기나무와 위·앞·옆에서 본 모양',
    conceptId: 'g6spatial-001',
    releaseId: 'grade6-spatial-reasoning-v1',
  },
  {
    unitId: 'unit-6-2-circle-measurement',
    title: '원주율과 원의 둘레·넓이',
    conceptId: 'g6circle-001',
    releaseId: 'grade6-circle-measurement-v1',
  },
  {
    unitId: 'unit-6-2-surface-area-volume',
    title: '직육면체의 겉넓이와 부피',
    conceptId: 'g6volume-001',
    releaseId: 'grade6-surface-area-volume-v1',
  },
  {
    unitId: 'unit-6-1-ratio-graphs',
    title: '띠그래프와 원그래프로 자료 탐구하기',
    conceptId: 'g6ratiograph-001',
    releaseId: 'grade6-ratio-graphs-v1',
  },
] as const) {
  test(`${releasedConcept.title} 단원을 찾아 5문제를 완주하고 단원별 콘텐츠 버전을 기록한다`, async ({ page }) => {
    await page.goto(`${BASE_PATH}/grade/6`)
    await expect(page.getByRole('heading', { name: '6학년 수학을 단원별로 연습해요' })).toBeVisible()
    await page.getByTestId(`grade6-unit-${releasedConcept.unitId}`).click()
    await expect(page.getByRole('heading', { name: releasedConcept.title })).toBeVisible()
    await page.getByRole('link', { name: /학습하기/ }).click()
    await page.getByRole('button', { name: '세트 A · 5문제' }).click()
    await expect(page.getByTestId('practice-session')).toBeVisible()

    const session = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), GRADE6_KEYS[0])
    expect(session).toMatchObject({
      grade: 6,
      itemCount: 5,
      conceptId: releasedConcept.conceptId,
      setId: 'A',
    })

    for (let index = 0; index < 5; index += 1) {
      const answer = await page.evaluate(({ key, itemIndex }) => {
        const currentSession = JSON.parse(localStorage.getItem(key) ?? 'null')
        return String(currentSession.problems[itemIndex].correctAnswer)
      }, { key: GRADE6_KEYS[0], itemIndex: index })
      await enterKeypadAnswer(page, answer)
      await page.getByTestId('check-answer-button').click()
      if (index < 4) await page.getByTestId('next-button').click()
    }

    await page.getByTestId('submit-button').click()
    await expect(page).toHaveURL(new RegExp(`${BASE_PATH}/result/\\?grade=6$`))
    await expect(page.getByTestId('score')).toContainText('5')
    const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), GRADE6_KEYS[2])
    const receipts = await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) ?? 'null')?.receipts ?? []
    ), ATTEMPT_RECEIPT_KEY)

    expect(progress[releasedConcept.conceptId]).toMatchObject({ latestScore: 100, needsReview: false })
    expect(receipts).toHaveLength(5)
    expect(receipts.every((receipt: { contentReleaseId: string }) => (
      receipt.contentReleaseId === releasedConcept.releaseId
    ))).toBe(true)
    expect(await readKeys(page, GRADE5_KEYS)).toEqual([null, null, null])
  })
}

test('390px와 1024px에서 가로 넘침 없이 48px 뒤로가기와 하단 행동을 유지한다', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/concept/g6fractiondiv-001`)
    const backLink = page.getByRole('link', { name: '단원으로 돌아가기' })
    await expect(backLink).toBeVisible()
    expect((await backLink.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)

    const action = page.getByRole('button', { name: '세트 A · 5문제' })
    expect((await action.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48)
    const labelLinesFit = await page.locator('[data-grade6-action-label-line]').evaluateAll((lines) => (
      lines.length === 12 && lines.every((line) => {
        const element = line as HTMLElement
        const button = element.closest('button')
        return (
          getComputedStyle(element).whiteSpace === 'nowrap' &&
          element.scrollWidth <= (button?.clientWidth ?? 0)
        )
      })
    ))
    expect(labelLinesFit).toBe(true)

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const overlap = await page.evaluate(() => {
      const mascot = document.querySelector('[data-testid="service-mascot"]')?.getBoundingClientRect()
      const actionButtons = [...document.querySelectorAll('[data-testid="concept-practice-actions"] button')]
      if (!mascot) return 0
      return actionButtons.reduce((area, button) => {
        const rect = button.getBoundingClientRect()
        const width = Math.max(0, Math.min(rect.right, mascot.right) - Math.max(rect.left, mascot.left))
        const height = Math.max(0, Math.min(rect.bottom, mascot.bottom) - Math.max(rect.top, mascot.top))
        return area + width * height
      }, 0)
    })
    expect(overlap).toBe(0)

    await page.goto(`${BASE_PATH}/practice/g6fractiondiv-001?set=A&count=5`)
    await expect(page.getByTestId('practice-session')).toBeVisible()
    const practiceOverlap = await page.evaluate(() => {
      const mascot = document.querySelector('[data-testid="service-mascot"]')?.getBoundingClientRect()
      const actionButtons = [...document.querySelectorAll('[data-testid="practice-navigation-actions"] button')]
      if (!mascot) return 0
      return actionButtons.reduce((area, button) => {
        const rect = button.getBoundingClientRect()
        const width = Math.max(0, Math.min(rect.right, mascot.right) - Math.max(rect.left, mascot.left))
        const height = Math.max(0, Math.min(rect.bottom, mascot.bottom) - Math.max(rect.top, mascot.top))
        return area + width * height
      }, 0)
    })
    expect(practiceOverlap).toBe(0)
  }
})
