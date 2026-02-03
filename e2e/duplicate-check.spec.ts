import { test, expect } from '@playwright/test'

const concepts = [
  { id: 'divisor-001', name: '약수' },
  { id: 'multiple-001', name: '배수' },
  { id: 'gcd-001', name: '최대공약수' },
  { id: 'lcm-001', name: '최소공배수' },
]

for (const concept of concepts) {
  test(`Duplicate check: ${concept.name} (${concept.id})`, async ({ page }) => {
    // 여러 번 시도해서 객관식 문제 찾기
    for (let attempt = 0; attempt < 5; attempt++) {
      // 새 세션 시작을 위해 localStorage 클리어
      await page.goto(`/practice/${concept.id}`)
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForSelector('button:has-text("다음")', { timeout: 10000 })

      // 10문제 모두 확인
      for (let i = 0; i < 10; i++) {
        // 객관식 보기 버튼들 찾기
        const choiceButtons = page.locator('button[data-choice]')
        const count = await choiceButtons.count()

        if (count === 4) {
          // 객관식 문제 발견
          const choices: string[] = []
          for (let j = 0; j < 4; j++) {
            const text = await choiceButtons.nth(j).innerText()
            choices.push(text.trim())
          }

          // 중복 체크
          const uniqueChoices = new Set(choices)
          if (uniqueChoices.size !== 4) {
            // 스크린샷 저장
            await page.screenshot({
              path: `e2e/screenshots/duplicate-${concept.id}-attempt${attempt}-q${i + 1}.png`,
              fullPage: true
            })
            console.log(`중복 발견: ${concept.name} - 문제 ${i + 1}`)
            console.log(`보기: ${choices.join(', ')}`)
          }

          expect(uniqueChoices.size, `${concept.name} 문제 ${i + 1}: 보기 중복 발견 - ${choices.join(', ')}`).toBe(4)
        }

        // 다음 문제로
        if (i < 9) {
          await page.locator('button').filter({ hasText: '다음' }).click()
          await page.waitForTimeout(200)
        }
      }
    }
  })
}
