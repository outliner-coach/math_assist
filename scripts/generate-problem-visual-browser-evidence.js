const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { chromium } = require('@playwright/test')

const ROOT_DIR = path.join(__dirname, '..')
const DEFAULT_OUTPUT = path.join(
  ROOT_DIR,
  'out',
  'quality',
  'problem-visual-browser-evidence.json'
)
const VIEWPORTS = Object.freeze({
  mobile: Object.freeze({ width: 390, height: 844 }),
  tablet: Object.freeze({ width: 1024, height: 768 }),
})
const REVIEW_STATES = Object.freeze(['pre', 'hint', 'revealed'])
const EXPECTED_VISUAL_ITEM_COUNT = 1013

function readOption(args, option) {
  const index = args.indexOf(option)
  if (index === -1) return undefined
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${option} requires a value`)
  }
  return value
}

function readPositiveInteger(args, option, fallback) {
  const raw = readOption(args, option)
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${option} must be a positive integer`)
  }
  return value
}

function stableCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}

function stableJson(value) {
  const canonicalize = candidate => {
    if (
      candidate === null
      || typeof candidate === 'string'
      || typeof candidate === 'number'
      || typeof candidate === 'boolean'
    ) return candidate
    if (Array.isArray(candidate)) return candidate.map(canonicalize)
    return Object.fromEntries(
      Object.keys(candidate)
        .sort(stableCompare)
        .map(key => [key, canonicalize(candidate[key])])
    )
  }
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`
}

async function delay(milliseconds) {
  await new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function serverIsReady(baseUrl) {
  try {
    const response = await fetch(baseUrl, { redirect: 'manual' })
    return response.ok || response.status === 307 || response.status === 308
  } catch {
    return false
  }
}

async function startReviewServer(port) {
  const baseUrl = `http://127.0.0.1:${port}/math_assist`
  if (await serverIsReady(baseUrl)) {
    return { baseUrl, process: null }
  }

  const server = spawn(
    'npm',
    ['run', 'dev', '--', '--port', String(port)],
    {
      cwd: ROOT_DIR,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  )
  let serverOutput = ''
  const appendOutput = chunk => {
    serverOutput = `${serverOutput}${chunk}`.slice(-20_000)
  }
  server.stdout.on('data', appendOutput)
  server.stderr.on('data', appendOutput)

  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(
        `review server exited with ${server.exitCode}\n${serverOutput}`
      )
    }
    if (await serverIsReady(baseUrl)) return { baseUrl, process: server }
    await delay(250)
  }
  server.kill('SIGTERM')
  throw new Error(`review server did not become ready\n${serverOutput}`)
}

function representativeKey(item) {
  return [
    item.visualKind,
    item.visualSemantics,
    ...[...item.taskActions].sort(stableCompare),
  ].join('|')
}

async function readSurfaceMetadata(page) {
  return page.getByTestId('problem-review-surface').evaluate(surface => ({
    reviewId: surface.getAttribute('data-review-id'),
    contentHash: surface.getAttribute('data-review-content-hash'),
    reviewedHash: surface.getAttribute('data-review-reviewed-hash'),
    reviewStatus: surface.getAttribute('data-review-status'),
    visualKind: surface.getAttribute('data-review-visual-kind'),
    visualSemantics: (
      surface.querySelector('[data-testid="problem-review-metadata"]')
        ?.textContent
        ?.match(/(decorative|schematic|quantitative|none)/)?.[1]
      ?? 'none'
    ),
    taskActions: (
      surface.querySelector('[data-testid="problem-review-metadata"]')
        ?.textContent
        ?.match(
          /(recognize|classify|compare|calculate|measure|construct|model|interpret|explain|analyze_error|reason)(?:,\s*(recognize|classify|compare|calculate|measure|construct|model|interpret|explain|analyze_error|reason))*/g
        )
        ?.flatMap(match => match.split(',').map(value => value.trim()))
      ?? []
    ),
  }))
}

async function inspectCurrentSurface(page, expected) {
  return page.evaluate(({ reviewId, variantKey, state }) => {
    const surface = document.querySelector(
      '[data-testid="problem-review-surface"]'
    )
    const visual = surface?.querySelector('[data-actual-renderer]')
    const answer = surface?.querySelector(
      '[data-testid="problem-review-answer"]'
    )
    const solution = surface?.querySelector(
      '[data-testid="problem-review-solution"]'
    )
    const hints = surface?.querySelector(
      '[data-testid="problem-review-hints"]'
    )
    const stateButton = document.querySelector(
      `[data-testid="review-state-${state}"]`
    )
    const errors = []

    if (!surface) return ['missing review surface']
    if (surface.getAttribute('data-review-id') !== reviewId) {
      errors.push('review ID changed')
    }
    if (surface.getAttribute('data-review-variant') !== variantKey) {
      errors.push('variant key changed')
    }
    if (surface.getAttribute('data-review-state') !== state) {
      errors.push('review state changed')
    }
    if (!visual) {
      errors.push('actual renderer is missing')
    } else {
      if (visual.getAttribute('data-review-visual-state') !== state) {
        errors.push('actual renderer state is stale')
      }
      if (visual.getAttribute('data-review-source-id') !== reviewId.split(':').slice(2).join(':')) {
        errors.push('actual renderer source ID changed')
      }
      const visualRect = visual.getBoundingClientRect()
      if (visualRect.width <= 0 || visualRect.height <= 0) {
        errors.push('actual renderer has an empty boundary')
      }
      if (
        visualRect.left < -1
        || visualRect.right > document.documentElement.clientWidth + 1
      ) {
        errors.push('actual renderer crosses the viewport horizontally')
      }

      const forbiddenAttributes = []
      for (const element of [visual, ...visual.querySelectorAll('*')]) {
        for (const attribute of element.attributes) {
          if (/^data-(?:answer|correct-answer)$/i.test(attribute.name)) {
            forbiddenAttributes.push(attribute.name)
          }
        }
      }
      if (forbiddenAttributes.length > 0) {
        errors.push(
          `actual renderer exposes forbidden attributes: ${[
            ...new Set(forbiddenAttributes),
          ].sort().join(',')}`
        )
      }
    }

    const answerVisible = surface.getAttribute('data-review-answer-visible')
    if (state === 'revealed') {
      if (answerVisible !== 'true' || !answer || !solution) {
        errors.push('revealed state is missing answer or solution')
      }
    } else if (answerVisible !== 'false' || answer || solution) {
      errors.push('answer or solution exists before revealed state')
    }
    if (state === 'hint' ? !hints : Boolean(hints)) {
      errors.push('hint panel does not match the selected state')
    }
    if (!stateButton || stateButton.getBoundingClientRect().height < 47.5) {
      errors.push('state control is smaller than 48px')
    }
    if (document.documentElement.scrollWidth > window.innerWidth) {
      errors.push('page has horizontal overflow')
    }

    const clippedFilters = [
      ...document.querySelectorAll(
        '[data-testid^="review-"][data-testid$="-filter"]'
      ),
    ].flatMap(element => {
      const rect = element.getBoundingClientRect()
      return rect.left < -1
        || rect.right > document.documentElement.clientWidth + 1
        ? [element.getAttribute('data-testid')]
        : []
    })
    if (clippedFilters.length > 0) {
      errors.push(`filters cross viewport: ${clippedFilters.join(',')}`)
    }
    return errors
  }, expected)
}

async function generateEvidence({
  baseUrl,
  outputPath,
  limit,
}) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: VIEWPORTS.mobile })
  const page = await context.newPage()
  page.setDefaultTimeout(15_000)
  const browserErrors = []
  let activeReviewId = 'initial-page'
  page.on('console', message => {
    if (message.type() === 'error') {
      browserErrors.push({
        reviewId: activeReviewId,
        message: message.text(),
      })
    }
  })
  page.on('pageerror', error => {
    browserErrors.push({
      reviewId: activeReviewId,
      message: error.message,
    })
  })

  try {
    await page.goto(
      `${baseUrl}/review/problems?id=1%3Amission%3Acount-cove-03&state=pre&variant=minimum`,
      { waitUntil: 'networkidle' }
    )
    await page.evaluate(() => {
      localStorage.setItem('mathAssist_visualEvidenceProbe', 'keep')
    })
    await page.getByTestId('review-grade-filter').selectOption('all')
    await page.getByTestId('review-visual-filter').selectOption('visual')
    await page.getByTestId('review-status-filter').selectOption('all')
    const allReviewIds = await page
      .getByTestId('review-source-select')
      .locator('option')
      .evaluateAll(options => options.map(option => option.value))
    const reviewIds = limit === undefined
      ? allReviewIds
      : allReviewIds.slice(0, limit)
    const items = []
    const representativeByKey = new Map()

    for (let itemIndex = 0; itemIndex < reviewIds.length; itemIndex += 1) {
      const reviewId = reviewIds[itemIndex]
      activeReviewId = reviewId
      await page.getByTestId('review-source-select').selectOption(reviewId)
      await page.getByTestId('problem-review-surface').waitFor({
        state: 'visible',
      })
      await page.waitForFunction(
        expectedReviewId => document
          .querySelector('[data-testid="problem-review-surface"]')
          ?.getAttribute('data-review-id') === expectedReviewId,
        reviewId
      )
      const metadata = await readSurfaceMetadata(page)
      const variants = await page
        .getByTestId('review-variant-select')
        .locator('option')
        .evaluateAll(options => options.map(option => ({
          key: option.value,
          label: option.textContent?.trim() ?? option.value,
        })))
      const itemErrors = []
      const variantEvidence = []

      if (metadata.contentHash !== metadata.reviewedHash) {
        itemErrors.push('current content hash does not match editorial receipt')
      }
      if (metadata.reviewId !== reviewId) {
        itemErrors.push('surface metadata review ID mismatch')
      }

      for (const variant of variants) {
        const viewportEvidence = {}
        for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
          await page.setViewportSize(viewport)
          await page
            .getByTestId('review-variant-select')
            .selectOption(variant.key)
          const stateEvidence = {}
          for (const state of REVIEW_STATES) {
            await page.getByTestId(`review-state-${state}`).click()
            await page.waitForFunction(
              expectedState => document
                .querySelector('[data-testid="problem-review-surface"]')
                ?.getAttribute('data-review-state') === expectedState,
              state
            )
            const errors = await inspectCurrentSurface(page, {
              reviewId,
              variantKey: variant.key,
              state,
            })
            stateEvidence[state] = errors.length === 0
            itemErrors.push(
              ...errors.map(error => (
                `${variant.key}/${viewportName}/${state}: ${error}`
              ))
            )
          }
          viewportEvidence[viewportName] = stateEvidence
        }
        variantEvidence.push({
          key: variant.key,
          label: variant.label,
          viewports: viewportEvidence,
        })
      }

      const item = {
        reviewId,
        contentHash: metadata.contentHash,
        visualKind: metadata.visualKind,
        visualSemantics: metadata.visualSemantics,
        taskActions: [...new Set(metadata.taskActions)].sort(stableCompare),
        variants: variantEvidence,
        passed: itemErrors.length === 0,
        errors: [...new Set(itemErrors)].sort(stableCompare),
      }
      items.push(item)
      const sampleKey = representativeKey(item)
      if (!representativeByKey.has(sampleKey)) {
        representativeByKey.set(sampleKey, {
          sampleKey,
          reviewId,
          visualKind: item.visualKind,
          visualSemantics: item.visualSemantics,
          taskActions: item.taskActions,
          variantKeys: item.variants.map(variant => variant.key),
        })
      }

      if (
        (itemIndex + 1) % 25 === 0
        || itemIndex === reviewIds.length - 1
      ) {
        console.log(
          `Visual evidence progress: ${itemIndex + 1}/${reviewIds.length}`
        )
      }
    }

    const storagePreserved = await page.evaluate(
      () => localStorage.getItem('mathAssist_visualEvidenceProbe') === 'keep'
    )
    const failures = items.filter(item => !item.passed)
    const report = {
      schemaVersion: 1,
      catalogVisualItemCount: allReviewIds.length,
      reviewedItemCount: items.length,
      viewports: VIEWPORTS,
      states: REVIEW_STATES,
      storagePreserved,
      browserErrors,
      representativeSamples: Array.from(representativeByKey.values())
        .sort((left, right) => stableCompare(left.sampleKey, right.sampleKey)),
      items,
      summary: {
        passed: items.length - failures.length,
        failed: failures.length,
        representativeSampleCount: representativeByKey.size,
      },
    }
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, stableJson(report))
    console.log(
      `Visual browser evidence written: ${outputPath} `
      + `(${report.summary.passed}/${items.length} passed)`
    )

    if (!storagePreserved) throw new Error('review route changed localStorage')
    if (browserErrors.length > 0) {
      throw new Error(`browser errors: ${browserErrors.length}`)
    }
    if (allReviewIds.length !== EXPECTED_VISUAL_ITEM_COUNT) {
      throw new Error(
        `visual catalog count must be ${EXPECTED_VISUAL_ITEM_COUNT}, received ${allReviewIds.length}`
      )
    }
    if (failures.length > 0) {
      throw new Error(
        `${failures.length} visual items failed; first=${failures[0].reviewId}`
      )
    }
    return report
  } finally {
    await browser.close()
  }
}

async function main(args = process.argv.slice(2)) {
  const outputPath = path.resolve(
    readOption(args, '--output') ?? DEFAULT_OUTPUT
  )
  const port = readPositiveInteger(args, '--port', 3110)
  const limit = readPositiveInteger(args, '--limit', undefined)
  const server = await startReviewServer(port)
  try {
    await generateEvidence({
      baseUrl: server.baseUrl,
      outputPath,
      limit,
    })
  } finally {
    if (server.process) server.process.kill('SIGTERM')
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Visual browser evidence generation failed:')
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}

module.exports = {
  REVIEW_STATES,
  VIEWPORTS,
  generateEvidence,
  main,
  representativeKey,
  stableJson,
}
