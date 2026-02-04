import { test, expect } from '@playwright/test'

const basePath = '/math_assist'

test.describe('Home Page', () => {
  test('should display app title and unit list', async ({ page }) => {
    await page.goto(`${basePath}/`)

    // 앱 타이틀 확인
    await expect(page.locator('h1')).toContainText('수학 연습장')

    // 단원 링크가 표시되는지 확인
    const unitLinks = page.locator(`a[href^="${basePath}/unit/"]`)
    await expect(unitLinks.first()).toBeVisible()
  })

  test('should navigate to unit page when clicking unit card', async ({ page }) => {
    await page.goto(`${basePath}/`)

    // 첫 번째 단원 클릭
    const firstUnit = page.locator(`a[href^="${basePath}/unit/"]`).first()
    await firstUnit.click()

    // URL이 변경되었는지 확인
    await expect(page).toHaveURL(/\/math_assist\/unit\//)
  })
})

test.describe('Unit Page', () => {
  test('should display concepts list', async ({ page }) => {
    await page.goto(`${basePath}/unit/unit-5-1-divisor-multiple`)

    // 개념 목록 헤더 확인
    await expect(page.locator('h2')).toContainText('개념 선택')

    // 개념 카드들이 표시되는지 확인
    const conceptLinks = page.locator(`a[href^="${basePath}/concept/"]`)
    await expect(conceptLinks.first()).toBeVisible()
  })

  test('should navigate back to home', async ({ page }) => {
    await page.goto(`${basePath}/unit/unit-5-1-divisor-multiple`)

    // 뒤로가기 버튼 클릭
    await page.locator(`a[href="${basePath}"], a[href="${basePath}/"]`).click()
    await expect(page).toHaveURL(new RegExp(`${basePath}/?$`))
  })
})

test.describe('Concept Detail Page', () => {
  test('should display concept explanation', async ({ page }) => {
    await page.goto(`${basePath}/concept/divisor-001`)

    // 친절한 설명 섹션 확인
    await expect(page.locator('h2').filter({ hasText: '친절한 설명' })).toBeVisible()

    // 예시 섹션 확인
    await expect(page.locator('h2').filter({ hasText: '예시' })).toBeVisible()

    // 자주 하는 실수 섹션 확인
    await expect(page.locator('h2').filter({ hasText: '자주 하는 실수' })).toBeVisible()
  })

  test('should have practice start button', async ({ page }) => {
    await page.goto(`${basePath}/concept/divisor-001`)

    // 세트 선택 버튼 확인
    const setButton = page.locator('button').filter({ hasText: '세트 A' })
    await expect(setButton).toBeVisible()
  })

  test('should navigate to practice page', async ({ page }) => {
    await page.goto(`${basePath}/concept/divisor-001`)

    // 세트 A 클릭
    await page.locator('button').filter({ hasText: '세트 A' }).click()

    // practice 페이지로 이동했는지 확인
    await expect(page).toHaveURL(/\/math_assist\/practice\/divisor-001\?set=A/)
  })
})

test.describe('Practice Page', () => {
  test('should display problem and progress', async ({ page }) => {
    await page.goto(`${basePath}/practice/divisor-001`)

    // 진행률 표시 확인
    await expect(page.locator('text=/\\d+\\s*\\/\\s*10/')).toBeVisible()

    // 문제가 표시되는지 확인 (헤더에 약수)
    await expect(page.locator('h1').filter({ hasText: '약수' })).toBeVisible()
  })

  test('should show navigation buttons', async ({ page }) => {
    await page.goto(`${basePath}/practice/divisor-001`)

    // 이전/다음 버튼 확인
    await expect(page.locator('button').filter({ hasText: '이전' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: '다음' })).toBeVisible()
  })

  test('should allow answering choice questions', async ({ page }) => {
    await page.goto(`${basePath}/practice/divisor-001`)

    // 보기 버튼이 있으면 클릭
    const choiceButton = page.locator('button[class*="border"]').first()
    if (await choiceButton.isVisible()) {
      await choiceButton.click()

      // 선택됨 표시 확인 (스타일 변경)
      await expect(choiceButton).toHaveClass(/primary|selected|bg-/)
    }
  })

  test('should navigate between problems', async ({ page }) => {
    await page.goto(`${basePath}/practice/divisor-001`)

    // 첫 문제에서 '다음' 클릭
    await page.locator('button').filter({ hasText: '다음' }).click()

    // 두 번째 문제로 이동
    await page.waitForTimeout(300)

    // '이전' 버튼이 활성화되어야 함
    const prevButton = page.locator('button').filter({ hasText: '이전' })
    await expect(prevButton).toBeEnabled()
  })
})

test.describe('Full Practice Flow', () => {
  test('should complete practice and show results', async ({ page }) => {
    await page.goto(`${basePath}/practice/divisor-001`)

    // 10문제 모두 답하기
    for (let i = 0; i < 10; i++) {
      // 보기가 있으면 첫 번째 선택, 없으면 숫자 입력
      const choiceButton = page.locator('button[class*="border-2"]').first()
      const numberInput = page.locator('input[type="text"], input[inputmode="numeric"]')

      if (await choiceButton.isVisible()) {
        await choiceButton.click()
      } else if (await numberInput.isVisible()) {
        await numberInput.fill('12')
      }

      await page.waitForTimeout(200)

      // 마지막 문제가 아니면 다음으로
      if (i < 9) {
        await page.locator('button').filter({ hasText: '다음' }).click()
        await page.waitForTimeout(200)
      }
    }

    // 마지막 문제에서 제출 버튼 또는 완료 표시 찾기
    // 제출 버튼이 있으면 클릭
    const submitButton = page.locator('button').filter({ hasText: /제출|완료/ })

    // 제출 버튼이 보이면 클릭
    if (await submitButton.isVisible()) {
      await submitButton.click()

      // 결과 페이지로 이동 확인
      await expect(page).toHaveURL(`${basePath}/result`, { timeout: 10000 })

      // 점수가 표시되는지 확인
      await expect(page.locator('[data-testid="score"]')).toBeVisible()
    }
  })
})

test.describe('Result Page', () => {
  test('should show message when accessed without session', async ({ page }) => {
    await page.goto(`${basePath}/result`)

    // 로딩 후 "결과를 찾을 수 없습니다" 메시지 표시 확인
    await expect(page.locator('text=결과를 찾을 수 없습니다')).toBeVisible({ timeout: 5000 })

    // 홈으로 돌아가기 버튼 확인
    await expect(page.locator('button').filter({ hasText: '홈으로 돌아가기' })).toBeVisible()
  })
})

test.describe('Template Evaluation', () => {
  test('should not show unevaluated template expressions in visible text', async ({ page }) => {
    await page.goto('/practice/divisor-001')

    // 실제 표시되는 텍스트에서 템플릿 표현식이 없어야 함
    const visibleText = await page.locator('body').innerText()

    // 템플릿 표현식이 평가되지 않은 상태로 표시되면 안 됨
    expect(visibleText).not.toContain('[divisorCount')
    expect(visibleText).not.toContain('[divisors')
    expect(visibleText).not.toContain('[gcd')
    expect(visibleText).not.toContain('[lcm')
  })
})
