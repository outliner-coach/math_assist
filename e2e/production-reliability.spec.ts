import { expect, test, type Page } from '@playwright/test'

const BASE_PATH = '/math_assist'
const REGISTRY_KEY = 'mathAssist_profiles_v1'
const UUID_A = '11111111-1111-4111-8111-111111111111'
const UUID_B = '22222222-2222-4222-9222-222222222222'
const PROFILE_A = `local_${UUID_A}`
const PROFILE_B = `local_${UUID_B}`
const PROFILE_C = 'local_33333333-3333-4333-8333-333333333333'
const PROFILE_D = 'local_44444444-4444-4444-8444-444444444444'
const PROFILE_E = 'local_55555555-5555-4555-8555-555555555555'
const PROFILE_F = 'local_66666666-6666-4666-8666-666666666666'

interface SeedProfile {
  profileId: string
  nickname: string | null
  createdAt: number
  updatedAt: number
}

function registryWithProfiles(
  activeProfileId: string,
  profiles: SeedProfile[] = [
    { profileId: PROFILE_A, nickname: '수리', createdAt: 1, updatedAt: 1 },
    { profileId: PROFILE_B, nickname: null, createdAt: 2, updatedAt: 2 },
  ],
): string {
  return JSON.stringify({
    schemaVersion: 1,
    activeProfileId,
    profiles,
    migration: { schemaVersion: 1, status: 'not-needed', targetProfileId: null, backupKey: null },
  })
}

async function seedRegistry(page: Page, activeProfileId: string): Promise<void> {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(([key, registry]) => {
    localStorage.clear()
    localStorage.setItem(key, registry)
  }, [REGISTRY_KEY, registryWithProfiles(activeProfileId)])
}

async function openProfileManager(page: Page): Promise<void> {
  await page.getByTestId('profile-chip').click()
  await expect(page.getByTestId('profile-manager-dialog')).toBeVisible()
  await expect(page.getByRole('dialog', { name: '학습자 프로필 관리' })).toHaveCount(1)
}

function profileCard(page: Page, ordinal: number) {
  return page.locator(`[data-profile-card-ordinal="${ordinal}"]`)
}

async function openManagementMenu(page: Page, ordinal: number): Promise<void> {
  await profileCard(page, ordinal).getByRole('button', { name: /관리$/ }).click()
}

test('두 탭이 같은 프로필을 읽을 때 한 탭의 프로필 전환은 다른 탭을 즉시 잠근다', async ({ page }) => {
  await seedRegistry(page, PROFILE_A)
  await page.goto(`${BASE_PATH}/home/`)
  await expect(page.getByTestId('offline-pack-section')).toBeVisible()

  const tabB = await page.context().newPage()
  try {
    await tabB.goto(`${BASE_PATH}/home/`)
    await expect(tabB.getByTestId('offline-pack-section')).toBeVisible()

    await openProfileManager(page)
    await profileCard(page, 2).getByRole('button', { name: /이 프로필로 시작/ }).click()

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

  await openProfileManager(page)
  await openManagementMenu(page, 1)
  await page.getByRole('menuitem', { name: '내보내기' }).click()
  await expect(page.getByTestId('profile-transfer-dialog')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(1)

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

test('프로필 관리창은 한 단계만 보여 주고 취소·뒤로·닫기 초점을 원래 행동으로 돌린다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(([key, registry, profileA, profileB]) => {
    localStorage.clear()
    localStorage.setItem(key, registry)
    localStorage.setItem(`mathAssist_profile_v1:${profileA}:mathAssist_mascot_v1`, JSON.stringify({ avatarId: 'moa' }))
    localStorage.setItem(`mathAssist_profile_v1:${profileB}:mathAssist_mascot_v1`, JSON.stringify({ avatarId: 'moa' }))
  }, [REGISTRY_KEY, registryWithProfiles(PROFILE_A, [
    { profileId: PROFILE_A, nickname: '같은 이름', createdAt: 1, updatedAt: 1 },
    { profileId: PROFILE_B, nickname: '같은 이름', createdAt: 2, updatedAt: 2 },
  ]), PROFILE_A, PROFILE_B])
  await page.goto(`${BASE_PATH}/home/`)
  await openProfileManager(page)

  await expect(profileCard(page, 1)).toContainText('학습자 1')
  await expect(profileCard(page, 2)).toContainText('학습자 2')
  await expect(profileCard(page, 1).locator('[data-mascot-id="moa"]')).toBeVisible()
  await expect(profileCard(page, 2).locator('[data-mascot-id="moa"]')).toBeVisible()

  const createTrigger = page.getByTestId('profile-manager-dialog').getByRole('button', { name: '새 학습자 프로필 만들기' })
  await createTrigger.click()
  await expect(page.locator('[data-profile-manager-step="create"]')).toBeVisible()
  await expect(page.locator('[data-profile-manager-step="list"]')).toHaveCount(0)
  await expect(page.getByLabel('새 프로필 닉네임')).toBeFocused()
  await page.getByRole('button', { name: '취소' }).click()
  await expect(page.getByRole('button', { name: '새 학습자 프로필 만들기' })).toBeFocused()

  await openManagementMenu(page, 2)
  await page.getByRole('menuitem', { name: '이름 변경' }).click()
  await expect(page.locator('[data-profile-manager-step="rename"]')).toBeVisible()
  await expect(page.getByLabel('학습자 2 새 닉네임')).toBeFocused()
  await page.getByRole('button', { name: '취소' }).click()
  await expect(profileCard(page, 2).getByRole('button', { name: /관리$/ })).toBeFocused()

  await openManagementMenu(page, 2)
  await page.getByRole('menuitem', { name: '내보내기' }).click()
  await expect(page.getByTestId('profile-transfer-dialog')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await page.getByRole('button', { name: '프로필 관리로 돌아가기' }).click()
  await expect(profileCard(page, 2).getByRole('button', { name: /관리$/ })).toBeFocused()

  await openManagementMenu(page, 2)
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(page.getByTestId('profile-delete-confirm')).toBeVisible()
  await page.getByRole('button', { name: '프로필 관리로 돌아가기' }).click()
  await expect(profileCard(page, 2).getByRole('button', { name: /관리$/ })).toBeFocused()

  await page.getByTestId('device-reset-open').click()
  await expect(page.getByTestId('device-reset-dialog')).toBeVisible()
  await page.getByRole('button', { name: '프로필 관리로 돌아가기' }).click()
  await expect(page.getByTestId('device-reset-open')).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('profile-manager-dialog')).toHaveCount(0)
  await expect(page.getByTestId('profile-chip')).toBeFocused()
})

test('프로필 삭제 뒤 다음 카드, 이전 카드, 새 기본 카드 순서로 초점을 복구한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(([key, registry]) => {
    localStorage.clear()
    localStorage.setItem(key, registry)
  }, [REGISTRY_KEY, registryWithProfiles(PROFILE_A, [
    { profileId: PROFILE_A, nickname: '첫째', createdAt: 1, updatedAt: 1 },
    { profileId: PROFILE_B, nickname: '둘째', createdAt: 2, updatedAt: 2 },
    { profileId: PROFILE_C, nickname: '셋째', createdAt: 3, updatedAt: 3 },
  ])])
  await page.goto(`${BASE_PATH}/home/`)
  await openProfileManager(page)

  await openManagementMenu(page, 2)
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByTestId('profile-delete-confirm-button').click()
  await expect(profileCard(page, 2)).toBeFocused()
  await expect(profileCard(page, 2)).toContainText('셋째')

  await openManagementMenu(page, 2)
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByTestId('profile-delete-confirm-button').click()
  await expect(profileCard(page, 1)).toBeFocused()
  await expect(profileCard(page, 1)).toContainText('첫째')

  await openManagementMenu(page, 1)
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByTestId('profile-delete-confirm-button').click()
  await expect(profileCard(page, 1)).toBeFocused()
  await expect(profileCard(page, 1)).toContainText('학습자 1')
})

test('관리 중 대상 프로필이 다른 창에서 사라지면 쓰지 않고 최신 목록으로 돌아간다', async ({ page }) => {
  await seedRegistry(page, PROFILE_A)
  await page.goto(`${BASE_PATH}/home/`)
  await openProfileManager(page)
  await openManagementMenu(page, 2)
  await page.getByRole('menuitem', { name: '내보내기' }).click()
  await expect(page.getByTestId('profile-transfer-dialog')).toBeVisible()

  const otherPage = await page.context().newPage()
  try {
    await otherPage.goto(`${BASE_PATH}/home/`)
    await otherPage.evaluate(([key, registry]) => localStorage.setItem(key, registry), [REGISTRY_KEY, registryWithProfiles(PROFILE_A, [
      { profileId: PROFILE_A, nickname: '수리', createdAt: 1, updatedAt: 1 },
    ])])
    await expect(page.getByTestId('profile-transfer-dialog')).toHaveCount(0)
    await expect(page.getByText('다른 창에서 프로필 목록이 바뀌었어요. 최신 목록을 다시 확인해 주세요.')).toBeVisible()
    await expect(profileCard(page, 1)).toBeVisible()
    await expect(profileCard(page, 2)).toHaveCount(0)
  } finally {
    await otherPage.close()
  }
})

test('프로필 관리창은 모바일·태블릿·200% 확대 상당 폭에서 넘치지 않고 오류가 없다', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const sixProfiles = [
    { profileId: PROFILE_A, nickname: '가'.repeat(20), createdAt: 1, updatedAt: 1 },
    { profileId: PROFILE_B, nickname: '둘째', createdAt: 2, updatedAt: 2 },
    { profileId: PROFILE_C, nickname: '셋째', createdAt: 3, updatedAt: 3 },
    { profileId: PROFILE_D, nickname: '넷째', createdAt: 4, updatedAt: 4 },
    { profileId: PROFILE_E, nickname: '다섯째', createdAt: 5, updatedAt: 5 },
    { profileId: PROFILE_F, nickname: '여섯째', createdAt: 6, updatedAt: 6 },
  ]

  for (const viewport of [
    { width: 390, height: 844, label: 'mobile' },
    { width: 1024, height: 768, label: 'tablet' },
    { width: 640, height: 720, label: '200-percent-reflow' },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/`)
    await page.evaluate(([key, registry]) => {
      localStorage.clear()
      localStorage.setItem(key, registry)
    }, [REGISTRY_KEY, registryWithProfiles(PROFILE_A, sixProfiles)])
    await page.goto(`${BASE_PATH}/home/`)
    await openProfileManager(page)
    await expect(page.locator('[data-profile-card]')).toHaveCount(6)
    await expect(profileCard(page, 1)).toContainText('가'.repeat(20))
    const overflow = await page.getByTestId('profile-manager-dialog').evaluate((dialog) => ({
      dialogOverflow: dialog.scrollWidth > dialog.clientWidth,
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
    }))
    expect(overflow, viewport.label).toEqual({ dialogOverflow: false, pageOverflow: false })
    await expect(page.getByTestId('device-reset-open')).toBeVisible()
    await page.keyboard.press('Escape')
  }
  expect(errors).toEqual([])
})

test('최초 registry 부재만 초기화하고 손상·저장소 접근 불가에서는 관리 행동을 차단한다', async ({ page, context }) => {
  await page.goto(`${BASE_PATH}/`)
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE_PATH}/home/`)
  await expect(page.getByTestId('profile-chip')).toBeVisible()
  await openProfileManager(page)
  await expect(profileCard(page, 1)).toBeVisible()
  await page.keyboard.press('Escape')

  await page.goto(`${BASE_PATH}/`)
  await page.evaluate((key) => {
    localStorage.clear()
    localStorage.setItem(key, '{broken registry')
  }, REGISTRY_KEY)
  await page.goto(`${BASE_PATH}/home/`)
  await expect(page.getByTestId('home-storage-unavailable')).toBeVisible()
  await expect(page.getByTestId('profile-chip')).toHaveCount(0)
  await expect(page.getByTestId('device-reset-open')).toHaveCount(0)

  const blockedPage = await context.newPage()
  try {
    await blockedPage.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('blocked', 'SecurityError')
        },
      })
    })
    await blockedPage.goto(`${BASE_PATH}/home/`)
    await expect(blockedPage.getByTestId('home-storage-unavailable')).toBeVisible()
    await expect(blockedPage.getByTestId('profile-chip')).toHaveCount(0)
    await expect(blockedPage.getByTestId('profile-manager-dialog')).toHaveCount(0)
  } finally {
    await blockedPage.close()
  }
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
