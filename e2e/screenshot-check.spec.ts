import { test, expect } from '@playwright/test'

const concepts = [
  { id: 'divisor-001', name: '약수' },
  { id: 'multiple-001', name: '배수' },
  { id: 'gcd-001', name: '최대공약수' },
  { id: 'lcm-001', name: '최소공배수' },
]

for (const concept of concepts) {
  test(`Screenshot: ${concept.name} (${concept.id})`, async ({ page }) => {
    await page.goto(`/practice/${concept.id}`)

    // 로딩 대기
    await page.waitForSelector('button:has-text("다음")', { timeout: 10000 })

    // 첫 3문제 스크린샷
    for (let i = 0; i < 3; i++) {
      await page.screenshot({
        path: `e2e/screenshots/${concept.id}-problem-${i + 1}.png`,
        fullPage: true
      })

      // 페이지 텍스트에서 평가되지 않은 템플릿 확인
      const visibleText = await page.locator('body').innerText()
      expect(visibleText).not.toContain('[gcd')
      expect(visibleText).not.toContain('[lcm')
      expect(visibleText).not.toContain('[divisor')
      expect(visibleText).not.toContain('?]')

      if (i < 2) {
        await page.locator('button').filter({ hasText: '다음' }).click()
        await page.waitForTimeout(300)
      }
    }
  })
}
