import { expect, test, type Page } from '@playwright/test'

const BASE_PATH = '/math_assist'
const REGISTRY_KEY = 'mathAssist_profiles_v1'
const UUID_A = '11111111-1111-4111-8111-111111111111'
const UUID_B = '22222222-2222-4222-9222-222222222222'
const PROFILE_A = `local_${UUID_A}`
const PROFILE_B = `local_${UUID_B}`

function registryWithActive(activeProfileId: string): string {
  return JSON.stringify({
    schemaVersion: 1,
    activeProfileId,
    profiles: [
      { profileId: PROFILE_A, nickname: '수리', createdAt: 1, updatedAt: 1 },
      { profileId: PROFILE_B, nickname: null, createdAt: 2, updatedAt: 2 },
    ],
    migration: { schemaVersion: 1, status: 'not-needed', targetProfileId: null, backupKey: null },
  })
}

async function seedRegistry(page: Page, activeProfileId: string): Promise<void> {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(([key, registry]) => {
    localStorage.clear()
    localStorage.setItem(key, registry)
  }, [REGISTRY_KEY, registryWithActive(activeProfileId)])
}

test('두 탭이 같은 프로필을 읽을 때 한 탭의 프로필 전환은 다른 탭을 즉시 잠근다', async ({ page }) => {
  await seedRegistry(page, PROFILE_A)
  await page.goto(`${BASE_PATH}/home/`)
  await expect(page.getByTestId('offline-pack-section')).toBeVisible()

  const tabB = await page.context().newPage()
  try {
    await tabB.goto(`${BASE_PATH}/home/`)
    await expect(tabB.getByTestId('offline-pack-section')).toBeVisible()

    await page.getByTestId('profile-chip').click()
    await expect(page.getByTestId('profile-manager-dialog')).toBeVisible()
    await page.getByRole('button', { name: '학습자 2 프로필 선택' }).click()

    await expect(page.getByTestId('profile-chip')).toContainText('학습자 2', { timeout: 15_000 })

    await expect(tabB.getByTestId('lease-lost-overlay')).toBeVisible({ timeout: 15_000 })
    await expect(tabB.getByTestId('lease-lost-reload')).toBeVisible()

    await tabB.getByTestId('lease-lost-reload').click()
    await expect(tabB.getByTestId('lease-lost-overlay')).toHaveCount(0)
    await expect(tabB.getByTestId('profile-chip')).toContainText('학습자 2')
  } finally {
    await tabB.close()
  }
})

test('내보낸 프로필 파일을 가져오면 미리보기 개수가 화면에 렌더된다', async ({ page }) => {
  test.setTimeout(60_000)
  await seedRegistry(page, PROFILE_A)
  await page.goto(`${BASE_PATH}/home/`)
  await expect(page.getByTestId('offline-pack-section')).toBeVisible()

  await page.getByTestId('profile-chip').click()
  await expect(page.getByTestId('profile-manager-dialog')).toBeVisible()
  await page.getByRole('button', { name: '수리 내보내기·가져오기' }).click()
  await expect(page.getByRole('dialog', { name: '수리 프로필 내보내기·가져오기' })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '내보내기 파일 저장' }).click()
  const download = await downloadPromise
  const exportedPath = await download.path()
  expect(exportedPath).toBeTruthy()

  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: '가져올 파일 고르기' }).click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(exportedPath as string)

  await expect(page.getByRole('button', { name: '가져오기 적용' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('이 프로필에 합쳐요.')).toBeVisible()
  await expect(page.getByText('완료 추가 0개')).toBeVisible()
  await expect(page.getByText('복습 추가 0개 · 복습 정리 0개')).toBeVisible()
  await expect(page.getByText('시도 기록 추가 0개')).toBeVisible()
})

test('홈에는 6개 학년 오프라인 팩 관리 섹션이 보인다', async ({ page }) => {
  await seedRegistry(page, PROFILE_A)
  await page.goto(`${BASE_PATH}/home/`)
  await expect(page.getByTestId('offline-pack-section')).toBeVisible()

  const group = page.getByRole('group', { name: '오프라인 학년 팩' })
  await expect(group).toBeVisible()
  const rows = group.locator('li')
  await expect(rows).toHaveCount(6)
  for (let grade = 1; grade <= 6; grade += 1) {
    await expect(rows.nth(grade - 1)).toContainText(`${grade}학년`)
    await expect(rows.nth(grade - 1)).toContainText('설치되지 않음')
  }
})

test('랜딩 문서는 강제형 CSP 메타 정책을 가진다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .first()
    .getAttribute('content')
  expect(csp).toContain("default-src 'self'")
  expect(csp).toContain("script-src 'self' 'unsafe-inline'")
  expect(csp).not.toContain('frame-ancestors')
})
