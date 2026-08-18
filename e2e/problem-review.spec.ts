import { expect, test } from '@playwright/test'

const BASE_PATH = '/math_assist'

function inspectDiagramMetrics(element: SVGSVGElement, targetFamilyId: string) {
  const viewBox = element.viewBox.baseVal
  const svgBox = element.getBoundingClientRect()
  const labels = Array.from(element.querySelectorAll<SVGTextElement>('[data-application-visual-label]'))
  const primitives = Array.from(element.querySelectorAll<SVGGraphicsElement>('[data-application-visual-primitive]'))
  const overlapRatio = (first: DOMRect, second: DOMRect) => {
    const width = Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x))
    const height = Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y))
    return first.width * first.height === 0 ? 0 : (width * height) / (first.width * first.height)
  }
  const labelsWithBoxes = labels.map((label) => ({
    box: label.getBBox(),
    targetKey: label.dataset.applicationVisualTarget ?? '',
  }))
  const primitivesWithBoxes = primitives.map((primitive, paintOrder) => ({
    box: primitive.getBBox(),
    key: primitive.dataset.applicationVisualPrimitive ?? '',
    paintOrder,
  }))
  const contains = (outer: DOMRect, inner: DOMRect) => (
    outer.x <= inner.x &&
    outer.y <= inner.y &&
    outer.x + outer.width >= inner.x + inner.width &&
    outer.y + outer.height >= inner.y + inner.height
  )
  const isAllowedG6TargetPair = (targetKey: string, primitive: typeof primitivesWithBoxes[number]) => {
    if (targetFamilyId !== 'g6-ratio-part-whole' || !['missing-part', 'known-part'].includes(targetKey)) {
      return false
    }
    const target = primitivesWithBoxes.find((entry) => entry.key === targetKey)
    if (!target) return false
    return (
      primitive.key === targetKey ||
      (primitive.key === 'whole-bar' && primitive.paintOrder < target.paintOrder && contains(primitive.box, target.box))
    )
  }
  const boxes = labelsWithBoxes.map(({ box }) => box)
  return {
    hasAnswerEmphasis: element.querySelector('.application-visual--answer') !== null,
    labelTexts: labels.map((label) => label.textContent ?? ''),
    minimumCssFontSize: Math.min(...labels.map((label) => (
      Number(label.getAttribute('font-size')) * svgBox.width / viewBox.width
    ))),
    minimumCssTextHeight: Math.min(...labels.map((label) => label.getBoundingClientRect().height)),
    boxes: boxes.map((box) => ({ x: box.x, y: box.y, width: box.width, height: box.height })),
    maximumLabelOverlap: Math.max(0, ...boxes.flatMap((box, index) => boxes.slice(index + 1).map((other) => overlapRatio(box, other)))),
    maximumForbiddenDiagramCover: Math.max(0, ...labelsWithBoxes.flatMap(({ box, targetKey }) => (
      primitivesWithBoxes
        .filter((primitive) => !isAllowedG6TargetPair(targetKey, primitive))
        .map((primitive) => overlapRatio(box, primitive.box))
    ))),
    maximumAllowedG6TargetCover: Math.max(0, ...labelsWithBoxes.flatMap(({ box, targetKey }) => (
      primitivesWithBoxes
        .filter((primitive) => isAllowedG6TargetPair(targetKey, primitive))
        .map((primitive) => overlapRatio(box, primitive.box))
    ))),
    viewBox: { width: viewBox.width, height: viewBox.height },
  }
}

test('내부 검수 화면은 62단원 family와 읽기 전용 대표·경계 근거를 표시한다', async ({ page }) => {
  await page.goto(`${BASE_PATH}/review/application-problems`)

  await expect(page.getByTestId('application-problem-review')).toBeVisible()
  await expect(page.getByText('전 학년 응용문제 검수')).toBeVisible()
  await expect(page.getByText('전체 단원 62개 · 대표 family 107개')).toBeVisible()
  for (const label of ['학년', '학기', '단원', '개념', '유형(family)', '인지영역', '추론 방식', '표현', '증명 방식', '출시 상태']) {
    await expect(page.getByLabel(label)).toBeVisible()
  }

  await expect(page.getByTestId('review-problem-card')).toHaveCount(107)
  await expect(page.getByTestId('review-representative-case')).toHaveCount(107)
  await expect.poll(() => page.getByTestId('review-boundary-case').count())
    .toBeGreaterThanOrEqual(107)
  await expect(page.getByText('재현 정보').first()).toBeVisible()
  await expect(page.getByText('독립 검산').first()).toBeVisible()
  await expect(page.getByTestId('review-visual-before').locator('.application-visual--answer')).toHaveCount(0)
  await expect(page.getByTestId('review-boundary-visual-before').locator('.application-visual--answer')).toHaveCount(0)
  await expect(page.getByText('자동 검사 근거').first()).toBeVisible()
  await expect(page.getByText('증명 실행: 통과').first()).toBeVisible()
  await expect(page.getByText('감사 결과: 통과').first()).toBeVisible()
  await expect(page.getByTestId('review-visual-before').first()).toBeVisible()
  await expect(page.getByTestId('review-visual-after').first()).toBeVisible()
})

test('내부 검수 화면은 등록 행으로 실제 필터링하고 학습자 동선이나 승인 저장을 제공하지 않는다', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('application-review-sentinel', 'preserve'))
  await page.goto(`${BASE_PATH}/review/application-problems`)

  await page.getByLabel('학년').selectOption('3')
  await expect(page.getByTestId('review-problem-card')).toHaveCount(48)
  await expect(page.getByTestId('review-problem-card').first()).toContainText('draft')
  await page.getByLabel('학년').selectOption('6')
  await expect(page.getByTestId('review-problem-card')).toHaveCount(3)
  await expect(page.getByTestId('review-problem-card').first()).toContainText('6학년')

  await expect(page.getByRole('button', { name: /승인|저장|출시/ })).toHaveCount(0)
  const learnerLinks = page.locator('a[href^="/home"], a[href^="/grade"], a[href^="/concept"], a[href^="/practice"], a[href^="/mission"]')
  await expect(learnerLinks).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('application-review-sentinel'))).toBe('preserve')
})

test('390×844와 1024×768 검수 화면은 가로 넘침이나 고정 행동 가림이 없다', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/review/application-problems`)
    await expect(page.getByTestId('application-problem-review')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    for (const label of ['학년', '학기', '단원', '개념', '유형(family)', '인지영역', '추론 방식', '표현', '증명 방식', '출시 상태']) {
      const box = await page.getByLabel(label).boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(40)
      expect(box?.x ?? -1).toBeGreaterThanOrEqual(0)
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport.width)
    }
  }
  expect(browserErrors).toEqual([])
})

test('Grade 3 draft 대표 시각은 두 뷰포트에서 제출 전 답을 숨기고 증거를 표시한다', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  const representativeFamilies = [
    'g3-1-add-sub-story-change',
    'g3-1-lines-map-classification',
    'g3-2-circle-compass-diameter',
    'g3-2-graph-table-to-bar',
  ]

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/review/application-problems`)
    await page.getByLabel('학년').selectOption('3')
    await expect(page.getByTestId('review-problem-card')).toHaveCount(48)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
      .toBeLessThanOrEqual(0)

    for (const familyId of representativeFamilies) {
      const card = page.getByTestId('review-problem-card').filter({ hasText: familyId })
      await expect(card).toHaveCount(1)
      await expect(card).toContainText('draft')
      await expect(card).toContainText('케이스 판정: passed')
      await expect(card).toContainText('제출 전 노출 검사: passed')
      await expect(card).toContainText('증명 실행: 통과')
      const before = card.getByTestId('review-visual-before')
      const after = card.getByTestId('review-visual-after')
      await expect(before.locator('.application-visual--answer')).toHaveCount(0)
      await expect(before).toBeVisible()
      await expect(after).toBeVisible()
      const beforeLabels = await before.locator('[data-application-visual-label]').allTextContents()
      const afterLabels = await after.locator('[data-application-visual-label]').allTextContents()
      expect(beforeLabels).toContain('답: ?')
      expect(afterLabels).not.toContain('답: ?')
      expect(afterLabels.some((label) => label.startsWith('답: ') && label !== '답: ?')).toBe(true)
    }
  }
  expect(browserErrors).toEqual([])
})

test('등록된 모든 diagram family는 두 뷰포트와 공개 상태에서 읽을 수 있는 label을 보인다', async ({ page }) => {
  const diagramFamilies = [
    'g2-length-route-total',
    'g2-length-missing-segment',
    'g2-length-claim-check',
    'g5-perimeter-boundary-rebuild',
    'g5-area-composite-inverse',
    'g5-area-overlap-reconstruction',
    'g6-ratio-part-whole',
  ]
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE_PATH}/review/application-problems`)
    for (const familyId of diagramFamilies) {
      const card = page.getByTestId('review-problem-card').filter({ hasText: familyId })
      await expect(card).toHaveCount(1)
      for (const state of ['before', 'after'] as const) {
        const svg = card.getByTestId(`review-visual-${state}`).locator('svg')
        const metrics = await svg.evaluate(inspectDiagramMetrics, familyId)

        expect(metrics.minimumCssFontSize).toBeGreaterThanOrEqual(10)
        expect(metrics.minimumCssTextHeight).toBeGreaterThanOrEqual(12)
        expect(metrics.boxes.every((box) => box.x >= 0 && box.y >= 0 && box.x + box.width <= metrics.viewBox.width && box.y + box.height <= metrics.viewBox.height)).toBe(true)
        expect(metrics.maximumLabelOverlap).toBeLessThan(0.2)
        expect(metrics.maximumForbiddenDiagramCover).toBeLessThan(0.2)
        if (familyId === 'g6-ratio-part-whole') {
          expect(metrics.maximumAllowedG6TargetCover).toBeGreaterThanOrEqual(0.2)
        } else {
          expect(metrics.maximumAllowedG6TargetCover).toBe(0)
        }
        expect(metrics.hasAnswerEmphasis).toBe(state === 'after' && familyId === 'g2-length-route-total')
        if (state === 'after') expect(metrics.labelTexts).not.toContain('?')
      }
    }
  }
})

test('Grade 5 matching and Grade 6 nonmatching target-label mutations fail cover checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE_PATH}/review/application-problems`)
  const grade5Card = page.getByTestId('review-problem-card').filter({ hasText: 'g5-area-composite-inverse' })
  const grade5Svg = grade5Card.getByTestId('review-visual-before').locator('svg')
  const grade5Mutation = await grade5Svg.evaluate((element) => {
    const svgElement = element as SVGSVGElement
    const labels = Array.from(svgElement.querySelectorAll<SVGTextElement>('[data-application-visual-label]'))
    const primitives = Array.from(svgElement.querySelectorAll<SVGGraphicsElement>('[data-application-visual-primitive]'))
    const label = labels.find((entry) => {
      const target = primitives.find((primitive) => primitive.dataset.applicationVisualPrimitive === entry.dataset.applicationVisualTarget)
      const box = target?.getBBox()
      return Boolean(box && box.width > 0 && box.height > 0)
    })
    if (!label) throw new Error('expected a Grade 5 target label')
    const target = primitives.find((entry) => entry.dataset.applicationVisualPrimitive === label.dataset.applicationVisualTarget)
    if (!target) throw new Error('expected the exact target primitive')
    const targetBox = target.getBBox()
    label.setAttribute('x', String(targetBox.x + targetBox.width / 2))
    label.setAttribute('y', String(targetBox.y + targetBox.height / 2))
    return {
      targetKey: label.dataset.applicationVisualTarget,
    }
  })
  const grade5Metrics = await grade5Svg.evaluate(inspectDiagramMetrics, 'g5-area-composite-inverse')

  const grade6Card = page.getByTestId('review-problem-card').filter({ hasText: 'g6-ratio-part-whole' })
  const grade6Svg = grade6Card.getByTestId('review-visual-before').locator('svg')
  const grade6Mutation = await grade6Svg.evaluate((element) => {
    const svgElement = element as SVGSVGElement
    const label = svgElement.querySelector<SVGTextElement>('[data-application-visual-target="missing-part"]')
    const target = svgElement.querySelector<SVGGraphicsElement>('[data-application-visual-primitive="known-part"]')
    if (!label || !target) throw new Error('expected a nonmatching Grade 6 target pair')
    const targetBox = target.getBBox()
    label.setAttribute('x', String(targetBox.x + targetBox.width / 2))
    label.setAttribute('y', String(targetBox.y + targetBox.height / 2))
    return {
      targetKey: label.dataset.applicationVisualTarget,
      nonmatchingPrimitiveKey: target.dataset.applicationVisualPrimitive,
    }
  })
  const grade6Metrics = await grade6Svg.evaluate(inspectDiagramMetrics, 'g6-ratio-part-whole')

  expect(grade5Mutation.targetKey).toBeTruthy()
  expect(grade5Metrics.maximumForbiddenDiagramCover).toBeGreaterThanOrEqual(0.2)
  expect(grade6Mutation.targetKey).toBe('missing-part')
  expect(grade6Mutation.nonmatchingPrimitiveKey).toBe('known-part')
  expect(grade6Metrics.maximumForbiddenDiagramCover).toBeGreaterThanOrEqual(0.2)
})
