import { test, expect } from '@playwright/test'

const basePath = '/math_assist'

/**
 * localStorage를 완전히 클리어한 뒤 새 세션에서
 * 모든 문제가 올바르게 생성되는지 확인합니다.
 */
const concepts = [
  { id: 'divisor-001', name: '약수' },
  { id: 'multiple-001', name: '배수' },
  { id: 'gcd-001', name: '최대공약수' },
  { id: 'lcm-001', name: '최소공배수' },
]

for (const concept of concepts) {
  test(`Fresh session: ${concept.name}`, async ({ page }) => {
    // localStorage 완전 클리어 후 새 세션
    await page.goto(`${basePath}/practice/${concept.id}`)
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForSelector('button:has-text("다음")', { timeout: 10000 })

    for (let i = 0; i < 10; i++) {
      // 문제 텍스트 캡처
      const promptText = await page.locator('.text-xl, .text-2xl').first().innerText()

      // "아닌 것은?" 질문이 없어야 함 (약수/공약수 관련)
      if (concept.id === 'divisor-001') {
        expect(promptText).not.toContain('아닌 것은')
      }

      // 객관식이면 보기 검증
      const choiceButtons = page.locator('button[data-choice]')
      const count = await choiceButtons.count()

      if (count === 4) {
        const choices: string[] = []
        for (let j = 0; j < count; j++) {
          const text = await choiceButtons.nth(j).innerText()
          choices.push(text.replace(/^[①②③④]\s*/, '').trim())
        }

        // 중복 없음
        const unique = new Set(choices)
        expect(unique.size, `Q${i + 1} 중복: [${choices.join(', ')}]`).toBe(4)

        // 미평가 템플릿 없음
        for (const c of choices) {
          expect(c).not.toMatch(/\[.*\?\]/)
          expect(c).not.toContain('{{')
        }

        // 스크린샷
        await page.screenshot({
          path: `e2e/screenshots/fresh-${concept.id}-q${i + 1}.png`,
          fullPage: true
        })
      }

      if (i < 9) {
        await page.locator('button').filter({ hasText: '다음' }).click()
        await page.waitForTimeout(200)
      }
    }
  })
}
