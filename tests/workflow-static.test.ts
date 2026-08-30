import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const WORKFLOWS_DIR = path.resolve(__dirname, '../.github/workflows')

function readWorkflow(name: string): string {
  return readFileSync(path.join(WORKFLOWS_DIR, name), 'utf8')
}

function triggerBlock(source: string): string {
  const lines = source.split(/\r?\n/)
  const start = lines.findIndex(line => line === 'on:')
  if (start < 0) return ''

  const block = [lines[start]]
  for (const line of lines.slice(start + 1)) {
    if (line !== '' && !/^\s/.test(line)) break
    block.push(line)
  }
  return block.join('\n')
}

describe('GitHub workflow static contract', () => {
  it('removes the push-triggered Pages deploy workflow', () => {
    expect(existsSync(path.join(WORKFLOWS_DIR, 'nextjs.yml'))).toBe(false)
  })

  it('ci.yml runs verify:fast on pull requests and never deploys', () => {
    const source = readWorkflow('ci.yml')
    const triggers = triggerBlock(source)
    expect(triggers).toContain('pull_request')
    expect(triggers).not.toMatch(/push:/)
    expect(source).toContain('npm run verify:fast')
    expect(source).toContain('actions/setup-node@v4')
    expect(source).toContain("node-version: '24'")
    expect(source).toContain('npm ci')
    expect(source).toContain('actions/dependency-review-action@v4')
    expect(source.toLowerCase()).not.toContain('deploy-pages')
    expect(source.toLowerCase()).not.toContain('upload-pages-artifact')
  })

  it('nightly.yml runs verify:full on schedule and manual dispatch and uploads failure artifacts', () => {
    const source = readWorkflow('nightly.yml')
    const triggers = triggerBlock(source)
    expect(triggers).toContain("cron: '30 19 * * *'")
    expect(triggers).toContain('workflow_dispatch')
    expect(source).toContain('npm run verify:full')
    expect(source).toMatch(/if:.*failure\(\)/)
    expect((source.match(/actions\/upload-artifact@v4/g) ?? []).length).toBeGreaterThanOrEqual(2)
    expect(source).toContain('playwright-report')
    expect(source).toContain('out')
  })

  it('release.yml is dispatch-only, separates formal release from device validation, and uses the github-pages environment', () => {
    const source = readWorkflow('release.yml')
    const triggers = triggerBlock(source)
    expect(triggers).toContain('workflow_dispatch')
    expect(triggers).not.toMatch(/push:/)
    expect(triggers).not.toMatch(/pull_request/)
    expect(source).toMatch(/inputs:\s*\n\s*ref:/)
    expect(source).toMatch(/deployment_mode:\s*\n\s*description:/)
    expect(source).toMatch(/type: choice/)
    expect(source).toMatch(/default: release/)
    expect(source).toContain('- release')
    expect(source).toContain('- device-validation')
    expect(source).toContain('github-pages')
    expect(source).toContain('actions/upload-pages-artifact@v3')
    expect(source).toContain('actions/deploy-pages@v4')
    expect(source).toContain('needs: [resolve-ref]')
    expect(source).toContain('needs: verify-release')
    expect(source).toContain("if: inputs.deployment_mode == 'release'")
    expect(source).toContain('npm run verify:release')
    expect(source).toContain("if: inputs.deployment_mode == 'device-validation'")
    expect(source).toContain('npm run verify:full')
    expect(source).toContain('npm audit --omit=dev --audit-level=high')
    expect(source).toContain('node scripts/check-rollback-compat.mjs --check-current')
    // Deploy job must consume the verified artifact only.
    const deploySection = source.slice(source.indexOf('  deploy:'))
    expect(deploySection).toContain('environment:')
    expect(deploySection).toContain('name: github-pages')
  })

  it('release.yml materializes validated offline pack manifests into the uploaded Pages artifact', () => {
    const source = readWorkflow('release.yml')
    const browserInstallIndex = source.indexOf('npx playwright install --with-deps chromium')
    const metadataIndex = source.indexOf('node scripts/generate-release-metadata.mjs')
    const formalVerifyIndex = source.indexOf('npm run verify:release')
    const deviceVerifyIndex = source.indexOf('npm run verify:full')
    const metadataCopyIndex = source.indexOf('cp public/release-metadata.json out/release-metadata.json')
    const manifestIndex = source.indexOf(
      'node scripts/generate-offline-manifests.mjs --out out/offline-packs --metadata out/release-metadata.json --validate-out out',
    )
    const uploadIndex = source.indexOf('actions/upload-pages-artifact@v3')

    expect(metadataIndex).toBeGreaterThan(browserInstallIndex)
    expect(formalVerifyIndex).toBeGreaterThan(metadataIndex)
    expect(deviceVerifyIndex).toBeGreaterThan(metadataIndex)
    expect(metadataCopyIndex).toBeGreaterThan(formalVerifyIndex)
    expect(metadataCopyIndex).toBeGreaterThan(deviceVerifyIndex)
    expect(manifestIndex).toBeGreaterThan(metadataCopyIndex)
    expect(uploadIndex).toBeGreaterThan(manifestIndex)
  })

  it('no workflow allows a push event to reach a Pages deploy step', () => {
    const files = ['ci.yml', 'nightly.yml', 'release.yml', 'monitor.yml', 'codeql.yml']
    files.forEach(name => {
      const source = readWorkflow(name)
      if (!/^\s+push:/m.test(triggerBlock(source))) return
      // Push-triggered workflows must not contain any Pages deployment action.
      expect(source, name).not.toContain('deploy-pages')
      expect(source, name).not.toContain('upload-pages-artifact')
    })
  })

  it('installs the pinned Playwright Chromium before every browser verification lane', () => {
    const workflows = [
      ['ci.yml', 'npm run verify:fast'],
      ['nightly.yml', 'npm run verify:full'],
      ['release.yml', 'npm run verify:release'],
    ] as const

    workflows.forEach(([name, verificationCommand]) => {
      const source = readWorkflow(name)
      const installIndex = source.indexOf('npx playwright install --with-deps chromium')
      expect(installIndex, name).toBeGreaterThan(source.indexOf('npm ci'))
      expect(installIndex, name).toBeLessThan(source.indexOf(verificationCommand))
    })
  })

  it('monitor.yml watches the public site every six hours without writing learner data', () => {
    const source = readWorkflow('monitor.yml')
    const triggers = triggerBlock(source)
    expect(triggers).toContain('*/6')
    expect(triggers).toContain('workflow_dispatch')
    expect(source).toContain('scripts/public-site-monitor.mjs')
    expect(source).toContain('https://outliner-coach.github.io/math_assist/')
  })

  it('codeql.yml analyzes javascript-typescript on main pushes, PRs, and a weekly schedule', () => {
    const source = readWorkflow('codeql.yml')
    const triggers = triggerBlock(source)
    expect(triggers).toContain('branches:')
    expect(triggers).toContain('main')
    expect(triggers).toContain('pull_request')
    expect(triggers).toMatch(/cron: '.+ \* \* 0'/)
    expect(source).toContain('github/codeql-action/init@v3')
    expect(source).toContain('github/codeql-action/analyze@v3')
    expect(source).toContain('javascript-typescript')
  })

  it('dependabot.yml declares weekly npm and github-actions ecosystems', () => {
    const source = readFileSync(path.join(WORKFLOWS_DIR, '..', 'dependabot.yml'), 'utf8')
    expect(source.trim().startsWith('version: 2')).toBe(true)
    expect(source.match(/package-ecosystem: npm/g)).toHaveLength(1)
    expect(source.match(/package-ecosystem: github-actions/g)).toHaveLength(1)
    expect((source.match(/interval: weekly/g) ?? []).length).toBe(2)
    expect((source.match(/directory: \//g) ?? []).length).toBe(2)
  })
})
