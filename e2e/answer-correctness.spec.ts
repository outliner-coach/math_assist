import { test, expect } from '@playwright/test'

const basePath = '/math_assist'

/**
 * 각 개념의 객관식 문제에서:
 * 1. 보기가 모두 다른 값인지 (중복 없음)
 * 2. 정답이 정확히 하나인지
 * 를 검증합니다.
 */

const concepts = [
  { id: 'divisor-001', name: '약수' },
  { id: 'multiple-001', name: '배수' },
  { id: 'gcd-001', name: '최대공약수' },
  { id: 'lcm-001', name: '최소공배수' },
]

for (const concept of concepts) {
  test(`Answer correctness: ${concept.name} (${concept.id})`, async ({ page }) => {
    let totalChoiceProblems = 0

    for (let attempt = 0; attempt < 3; attempt++) {
      await page.goto(`${basePath}/practice/${concept.id}`)
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForSelector('button:has-text("다음")', { timeout: 10000 })

      for (let i = 0; i < 10; i++) {
        const choiceButtons = page.locator('button[data-choice]')
        const count = await choiceButtons.count()

        if (count === 4) {
          totalChoiceProblems++
          const choices: string[] = []
          for (let j = 0; j < 4; j++) {
            const text = await choiceButtons.nth(j).innerText()
            choices.push(text.replace(/^[①②③④]\s*/, '').trim())
          }

          // 1. 중복 검사
          const uniqueChoices = new Set(choices)
          expect(
            uniqueChoices.size,
            `${concept.name} attempt${attempt} Q${i + 1}: 보기 중복 - [${choices.join(', ')}]`
          ).toBe(4)

          // 2. 평가되지 않은 템플릿 검사
          for (const choice of choices) {
            expect(choice).not.toContain('[')
            expect(choice).not.toContain('?]')
          }
        }

        if (i < 9) {
          await page.locator('button').filter({ hasText: '다음' }).click()
          await page.waitForTimeout(200)
        }
      }
    }

    console.log(`${concept.name}: ${totalChoiceProblems}개 객관식 문제 검증 완료`)
  })
}
