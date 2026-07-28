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

test('두 자리 수 나눗셈 단원은 몫을 숨기고 K/A/R 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-1-multiplication-division').click()

  await expect(page).toHaveURL(/unitId=unit-4-1-multiplication-division/)
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-div-02')
  const division = page.getByTestId('grade4-visual-division-model')
  await expect(division).toBeVisible()
  await expect(division.locator('[data-quotient]')).toHaveCount(0)
  await expect(division.locator('[data-remainder]')).toHaveCount(0)

  await page.getByTestId('grade4-integer-input').fill('17')
  await page.getByTestId('grade4-integer-submit').click()
  await expect(division.locator('[data-quotient="17"]')).toBeVisible()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-div-07')
  await page.getByTestId('grade4-integer-input').fill('3')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-div-10')
  await page.getByTestId('grade4-integer-input').fill('24')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('두 자리 수로 나누기 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-1-multiplication-division')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-two-digit-division-v1']))
  expect(stored.overflow).toBe(false)
})

test('사칙계산 어림 단원은 네 연산과 방법 비교를 연결해 K/A/R 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-1-arithmetic-estimation').click()

  await expect(page).toHaveURL(/unitId=unit-4-1-arithmetic-estimation/)
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-est-02')
  await page.getByTestId('grade4-integer-input').fill('4700')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-est-07')
  await page.getByTestId('grade4-integer-input').fill('910')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-est-10')
  await page.getByTestId('grade4-choice-십 단위 어림: 1,680').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('사칙계산 어림 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-1-arithmetic-estimation')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-arithmetic-estimation-v1']))
  expect(stored.overflow).toBe(false)
})

test('소수 단원은 미완성 입력을 기록하지 않고 자릿값·배치·비교 추론 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-2-decimals').click()

  await expect(page).toHaveURL(/unitId=unit-4-2-decimals/)
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-dec-02')
  await expect.poll(async () => page.getByTestId('grade4-visual-place-value-table').evaluate(
    (element) => element.scrollWidth <= element.clientWidth,
  )).toBe(true)
  await expect(page.getByTestId('grade4-integer-input')).toHaveAttribute('inputmode', 'decimal')
  await page.getByTestId('grade4-integer-input').fill('0.')
  await page.getByTestId('grade4-integer-submit').click()
  await expect(page.getByTestId('grade4-input-error')).toBeVisible()
  expect(await page.evaluate((key) => localStorage.getItem(key), RECEIPT_KEY)).toBeNull()

  await page.getByTestId('grade4-integer-input').fill('0.09')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-dec-07')
  await page.getByTestId('grade4-integer-input').fill('0.741')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-dec-10')
  await page.getByTestId('grade4-integer-input').fill('3')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('소수 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-2-decimals')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-decimals-v1']))
  expect(stored.overflow).toBe(false)
})

test('분수 덧셈·뺄셈 단원은 미완성 입력을 기록하지 않고 동치 분수와 받아내림 추론을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-2-fraction-add-sub').click()

  await expect(page).toHaveURL(/unitId=unit-4-2-fraction-add-sub/)
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-frac-02')
  await expect(page.getByTestId('grade4-visual-fraction-strip')).not.toContainText('답:')
  await expect(page.getByTestId('grade4-integer-input')).toHaveAttribute('inputmode', 'text')
  await page.getByTestId('grade4-integer-input').fill('1/')
  await page.getByTestId('grade4-integer-submit').click()
  await expect(page.getByTestId('grade4-input-error')).toBeVisible()
  expect(await page.evaluate((key) => localStorage.getItem(key), RECEIPT_KEY)).toBeNull()

  await page.getByTestId('grade4-integer-input').fill('5/8')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-frac-07')
  await page.getByTestId('grade4-integer-input').fill('2/3')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-frac-10')
  await page.getByRole('button', { name: '자연수 1을 9/9로 바꾸어 받아내림하면 답은 7/9입니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('분수의 덧셈과 뺄셈 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-2-fraction-add-sub')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-fraction-add-sub-v1']))
  expect(stored.overflow).toBe(false)
})

test('소수 덧셈·뺄셈 단원은 소수점을 맞추고 받아올림·역산·받아내림 추론을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-2-decimal-add-sub').click()

  await expect(page).toHaveURL(/unitId=unit-4-2-decimal-add-sub/)
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-dop-02')
  const decimalOperation = page.getByTestId('grade4-visual-decimal-operation')
  await expect(decimalOperation).toContainText('소수점')
  await expect(decimalOperation.locator('[data-result]')).toHaveCount(0)
  await expect(page.getByTestId('grade4-integer-input')).toHaveAttribute('inputmode', 'decimal')

  await page.getByTestId('grade4-integer-input').fill('3.30')
  await page.getByTestId('grade4-integer-submit').click()
  await expect(decimalOperation.locator('[data-result="3.30"]')).toBeVisible()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-dop-07')
  await page.getByTestId('grade4-integer-input').fill('4.49')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-dop-10')
  await page.getByRole('button', { name: '윗자리의 1을 아랫자리의 10으로 바꾸어 받아내림하면 답은 3.25입니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('소수의 덧셈과 뺄셈 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-2-decimal-add-sub')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-decimal-add-sub-v1']))
  expect(stored.overflow).toBe(false)
})

test('규칙 찾기 단원은 대응·먼 계산식·두 변화 오류 분석 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-2-patterns').click()

  await expect(page).toHaveURL(/unitId=unit-4-2-patterns/)
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-pat-02')
  const patternTable = page.getByTestId('grade4-visual-pattern-table')
  await expect(patternTable).toContainText('위 수')
  await expect(patternTable.locator('[data-result]')).toHaveCount(0)
  await page.getByTestId('grade4-integer-input').fill('18')
  await page.getByTestId('grade4-integer-submit').click()
  await expect(patternTable.locator('[data-result="18"]')).toBeVisible()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-pat-07')
  await page.getByTestId('grade4-integer-input').fill('1378')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-pat-10')
  await page.getByRole('button', { name: '곱하는 수와 더하는 수를 모두 4로 바꾸어 9×4+4=40으로 써야 합니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('규칙 찾기 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-2-patterns')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-patterns-v1']))
  expect(stored.overflow).toBe(false)
})

test('등호 단원은 빠진 양·양쪽 같은 변화·한쪽 변화 오류 분석 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-2-equality').click()

  await expect(page).toHaveURL(/unitId=unit-4-2-equality/)
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-eq-02')
  const balance = page.getByTestId('grade4-visual-equation-balance')
  await expect(balance).toContainText('두 양이 같아요')
  await expect(balance.locator('[data-result]')).toHaveCount(0)
  await page.getByTestId('grade4-integer-input').fill('24')
  await page.getByTestId('grade4-integer-submit').click()
  await expect(balance.locator('[data-result="24"]')).toBeVisible()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-eq-07')
  await page.getByTestId('grade4-integer-input').fill('10')
  await page.getByTestId('grade4-integer-submit').click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-eq-10')
  await page.getByRole('button', { name: '왼쪽에 6만큼 더했으므로 오른쪽에도 6만큼 더한 20+9+6=29+6으로 써야 합니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('등호와 양의 관계 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-2-equality')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-equality-v1']))
  expect(stored.overflow).toBe(false)
})

test('수직과 평행 단원은 방향·평행선 긋기·동시 회전 추론 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-1-perpendicular-parallel').click()

  await expect(page).toHaveURL(/unitId=unit-4-1-perpendicular-parallel/)
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-line-02')
  const lines = page.getByTestId('grade4-visual-line-relationship')
  await expect(lines).toHaveAttribute('data-testid', 'grade4-visual-line-relationship')
  await expect(lines.locator('svg')).toHaveAttribute('data-angle-a', '25')
  await expect(lines.locator('svg')).toHaveAttribute('data-angle-b', '25')
  await page.getByRole('button', { name: '두 직선은 서로 평행입니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-line-07')
  await page.getByRole('button', { name: '30°', exact: true }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-line-10')
  await expect(page.getByTestId('grade4-right-angle-mark')).toBeVisible()
  await page.getByRole('button', { name: '두 직선의 방향 차는 여전히 90°이므로 서로 수직입니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('수직과 평행 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-1-perpendicular-parallel')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-perpendicular-parallel-v1']))
  expect(stored.overflow).toBe(false)
})

test('도형의 이동 단원은 뒤집기·점 돌리기·두 번 뒤집기 추론 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-1-shape-transformations').click()

  await expect(page).toHaveURL(/unitId=unit-4-1-shape-transformations/)
  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-move-02')
  const movement = page.getByTestId('grade4-visual-shape-transformation')
  await expect(movement).toBeVisible()
  await expect(movement.getByTestId('grade4-transformation-result')).toBeVisible()
  await page.getByRole('button', { name: '세로 기준선을 따라 뒤집기' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-move-07')
  await expect(page.getByTestId('grade4-transformation-result')).toHaveCount(0)
  await page.getByRole('button', { name: '(3, 6)', exact: true }).click()
  await expect(page.getByTestId('grade4-transformation-result')).toHaveAttribute('data-result-x', '3')
  await expect(page.getByTestId('grade4-transformation-result')).toHaveAttribute('data-result-y', '6')
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-move-10')
  await page.getByRole('button', { name: '처음 점 (1, 6)로 돌아오고 도형의 방향도 처음과 같습니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('도형의 이동 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-1-shape-transformations')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-shape-transformations-v1']))
  expect(stored.overflow).toBe(false)
})

test('여러 가지 삼각형 단원은 변과 각의 두 기준으로 K/A/R 분류 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-2-triangles').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-tri-02')
  const triangle = page.getByTestId('grade4-visual-triangle-model')
  await expect(triangle.locator('svg')).toHaveAttribute('data-side-a', '14')
  await expect(triangle.locator('svg')).toHaveAttribute('data-side-b', '14')
  await page.getByRole('button', { name: '이등변삼각형', exact: true }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-tri-07')
  await expect(page.getByTestId('grade4-visual-triangle-model')).toContainText('지붕 골조')
  await page.getByRole('button', { name: '이등변삼각형', exact: true }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-tri-10')
  await page.getByRole('button', { name: '이등변삼각형이면서 둔각삼각형' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('여러 가지 삼각형 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-2-triangles')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-triangles-v1']))
  expect(stored.overflow).toBe(false)
})

test('여러 가지 사각형 단원은 평행·직각·같은 변의 성질로 K/A/R 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-2-quadrilaterals').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-quad-02')
  const square = page.getByTestId('grade4-visual-quadrilateral-model')
  await expect(square.locator('svg')).toHaveAttribute('data-shape-type', 'square')
  await expect(square.getByTestId('grade4-quadrilateral-right-angle')).toHaveCount(4)
  await page.getByRole('button', { name: '정사각형', exact: true }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-quad-07')
  await page.getByRole('button', { name: '정사각형이며 직사각형과 마름모의 성질도 가집니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-quad-10')
  await page.getByRole('button', { name: '두 조건을 모두 만족하므로 정사각형입니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('여러 가지 사각형 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-2-quadrilaterals')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-quadrilaterals-v1']))
  expect(stored.overflow).toBe(false)
})

test('다각형 단원은 정다각형·대각선·모양 채우기로 K/A/R 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-2-polygons').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-poly-02')
  await expect(page.getByTestId('grade4-visual-polygon-model')).toBeVisible()
  await page.getByRole('button', { name: '모든 변의 길이와 모든 각의 크기가 각각 같습니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-poly-07')
  const tiling = page.getByTestId('grade4-visual-tiling-model')
  await expect(tiling.getByTestId('grade4-tiling-cell')).toHaveCount(12)
  await page.getByRole('button', { name: '12개', exact: true }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-poly-10')
  await expect(page.getByTestId('grade4-tiling-gap')).toBeVisible()
  await page.getByRole('button', { name: '빈틈이 남아 이 배열만으로는 평면을 가득 채울 수 없습니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('다각형과 모양 채우기 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-2-polygons')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-polygons-v1']))
  expect(stored.overflow).toBe(false)
})

test('각도 단원은 각도기·회전·내각의 합으로 K/A/R 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-1-angle-measurement').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-ang-02')
  await expect(page.getByTestId('grade4-visual-angle-model')).toBeVisible()
  await page.getByRole('button', { name: '둔각', exact: true }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-ang-07')
  await page.getByRole('button', { name: '오른쪽으로 110° 돕니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-ang-10')
  await expect(page.getByTestId('grade4-angle-sum-diagonal')).toBeVisible()
  await page.getByRole('button', { name: '삼각형 두 개의 각의 합이므로 360°입니다.' }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('각도와 내각의 합 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-1-angle-measurement')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-angle-measurement-v1']))
  expect(stored.overflow).toBe(false)
})

test('꺾은선그래프 단원은 변화 구간·경향·눈금 범위 추론으로 K/A/R 활동을 끝낸다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/grade/4`)
  await expect(page.getByText('검증된 단원 15개')).toBeVisible()
  await page.getByTestId('grade4-unit-card-unit-4-2-line-graphs').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-graph-02')
  await expect(page.getByTestId('grade4-visual-line-graph-model')).toBeVisible()
  await page.getByRole('button', { name: '수요일과 목요일 사이', exact: true }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-graph-07')
  await page.getByRole('button', { name: '수요일까지 오르다가 그 뒤로 내려갑니다.', exact: true }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-mission-card')).toHaveAttribute('data-mission-id', 'g4-graph-10')
  await expect(page.getByTestId('grade4-line-scale-comparison')).toBeVisible()
  await page.getByRole('button', { name: '눈금 범위가 좁은 그래프가 같은 변화를 더 크게 보이게 합니다.', exact: true }).click()
  await page.getByTestId('grade4-next-mission').click()

  await expect(page.getByTestId('grade4-activity-complete')).toContainText('꺾은선그래프 다리를 건넜어요!')
  const stored = await page.evaluate(({ progressKey, receiptKey }) => ({
    progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
    ledger: JSON.parse(localStorage.getItem(receiptKey) ?? 'null'),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  }), { progressKey: PROGRESS_KEY, receiptKey: RECEIPT_KEY })
  expect(stored.progress.selectedUnitId).toBe('unit-4-2-line-graphs')
  expect(stored.ledger.receipts).toHaveLength(3)
  expect(new Set(stored.ledger.receipts.map((receipt: { contentReleaseId: string }) => receipt.contentReleaseId)))
    .toEqual(new Set(['grade4-bridge-line-graphs-v1']))
  expect(stored.overflow).toBe(false)
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
  for (const route of ['/home', '/grade/4', '/grade/4/mission?unitId=unit-4-1-large-numbers', '/grade/4/mission?unitId=unit-4-1-arithmetic-estimation', '/grade/4/mission?unitId=unit-4-2-decimals', '/grade/4/mission?unitId=unit-4-2-fraction-add-sub', '/grade/4/mission?unitId=unit-4-2-decimal-add-sub', '/grade/4/mission?unitId=unit-4-2-patterns', '/grade/4/mission?unitId=unit-4-2-equality', '/grade/4/mission?unitId=unit-4-1-perpendicular-parallel', '/grade/4/mission?unitId=unit-4-1-shape-transformations', '/grade/4/mission?unitId=unit-4-2-triangles', '/grade/4/mission?unitId=unit-4-2-quadrilaterals', '/grade/4/mission?unitId=unit-4-2-polygons', '/grade/4/mission?unitId=unit-4-1-angle-measurement']) {
    await page.goto(`${BASE_PATH}${route}`)
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
  await page.goto(`${BASE_PATH}/grade/4/mission?unitId=unit-4-1-large-numbers`)
  const inputBox = await page.getByTestId('grade4-integer-input').boundingBox()
  const mascotBox = await page.getByTestId('service-mascot').boundingBox()
  expect(inputBox).not.toBeNull()
  expect(mascotBox).not.toBeNull()
  expect(mascotBox!.x).toBeGreaterThanOrEqual(inputBox!.x + inputBox!.width)
})
