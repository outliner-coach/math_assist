import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SCRIPT = path.resolve(__dirname, '../scripts/generate-release-metadata.mjs')

function writeTree(root: string): void {
  writeFileSync(path.join(root, 'package.json'), '{\n  "name": "fixture"\n}\n')
  writeFileSync(
    path.join(root, 'package-lock.json'),
    '{\n  "name": "fixture",\n  "lockfileVersion": 3\n}\n',
  )
  writeFileSync(
    path.join(root, 'next.config.js'),
    "module.exports = { basePath: '/math_assist' }\n",
  )
  mkdirSync(path.join(root, 'src/app'), { recursive: true })
  writeFileSync(path.join(root, 'src/app/page.tsx'), 'export default function P() {\n  return null\n}\n')
  mkdirSync(path.join(root, 'src/lib'), { recursive: true })
  writeFileSync(path.join(root, 'src/lib/util.ts'), 'export const one = 1\n')

  mkdirSync(path.join(root, 'public/icons'), { recursive: true })
  writeFileSync(path.join(root, 'public/sw.js'), '// service worker fixture\n')
  writeFileSync(path.join(root, 'public/manifest.webmanifest'), '{}\n')
  writeFileSync(path.join(root, 'public/icons/icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>\n')

  mkdirSync(path.join(root, 'public/data/templates'), { recursive: true })
  mkdirSync(path.join(root, 'public/data/application-problems/packs'), { recursive: true })
  writeFileSync(path.join(root, 'public/data/units.json'), '[{"id":"unit-a","grade":2}]\n')
  writeFileSync(path.join(root, 'public/data/concepts.json'), '[{"id":"divisor-001","unit_id":"unit-a"}]\n')
  writeFileSync(path.join(root, 'public/data/templates/divisor.json'), '[]\n')
  writeFileSync(path.join(root, 'public/data/application-problems/packs/g2-1-add-sub.json'), '[]\n')
}

function makeFixtureDir(prefix: string): string {
  return mkdtempSync(path.join(tmpdir(), `ma-release-${prefix}-`))
}

function runGenerator(root: string, out: string): string {
  execFileSync(process.execPath, [SCRIPT, '--root', root, '--out', out])
  return readFileSync(path.join(out, 'release-metadata.json'), 'utf8')
}

describe('generate-release-metadata.mjs', () => {
  it('emits ReleaseMetadataV1 with contract fields, order, and schema values', () => {
    const root = makeFixtureDir('a')
    const out = makeFixtureDir('o1')
    try {
      writeTree(root)
      runGenerator(root, out)

      const raw = readFileSync(path.join(out, 'release-metadata.json'), 'utf8')
      const parsed = JSON.parse(raw) as Record<string, unknown>

      expect(Object.keys(parsed)).toEqual([
        'schemaVersion',
        'appRelease',
        'contentRelease',
        'storageSchema',
        'exportSchema',
        'offlineCacheSchema',
      ])
      expect(parsed.schemaVersion).toBe(1)
      expect(parsed.storageSchema).toBe(1)
      expect(parsed.exportSchema).toBe(1)
      expect(parsed.offlineCacheSchema).toBe(1)
      expect(typeof parsed.appRelease).toBe('string')
      expect(typeof parsed.contentRelease).toBe('string')
      expect(parsed.appRelease).toMatch(/^[0-9a-f]{64}$/)
      expect(parsed.contentRelease).toMatch(/^[0-9a-f]{64}$/)
      expect(raw.endsWith('\n')).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
      rmSync(out, { recursive: true, force: true })
    }
  })

  it('regenerates byte-identical output for an identical tree', () => {
    const rootA = makeFixtureDir('b1')
    const rootB = makeFixtureDir('b2')
    const outA = makeFixtureDir('ob1')
    const outB = makeFixtureDir('ob2')
    try {
      writeTree(rootA)
      writeTree(rootB)
      const first = runGenerator(rootA, outA)
      const second = runGenerator(rootA, outA)
      const otherDir = runGenerator(rootB, outB)

      expect(second).toBe(first)
      expect(otherDir).toBe(first)

      const rawA = readFileSync(path.join(outA, 'release-metadata.json'))
      const rawB = readFileSync(path.join(outB, 'release-metadata.json'))
      expect(rawB.equals(rawA)).toBe(true)
    } finally {
      ;[rootA, rootB, outA, outB].forEach(dir => rmSync(dir, { recursive: true, force: true }))
    }
  })

  it('changes appRelease when a product input changes but not when only docs change', () => {
    const rootA = makeFixtureDir('c1')
    const rootB = makeFixtureDir('c2')
    const out = makeFixtureDir('oc')
    try {
      writeTree(rootA)
      rmSync(rootB, { recursive: true, force: true })
      cpSync(rootA, rootB, { recursive: true })

      const baseline = JSON.parse(
        runGenerator(rootA, out).toString(),
      ) as { appRelease: string; contentRelease: string }

      writeFileSync(path.join(rootB, 'README.md'), '# docs only\n')
      execFileSync(process.execPath, [SCRIPT, '--root', rootB, '--out', out])
      const docsOnly = JSON.parse(readFileSync(path.join(out, 'release-metadata.json'), 'utf8')) as {
        appRelease: string
        contentRelease: string
      }
      expect(docsOnly.appRelease).toBe(baseline.appRelease)
      expect(docsOnly.contentRelease).toBe(baseline.contentRelease)

      writeFileSync(path.join(rootB, 'src/lib/util.ts'), 'export const one = 2\n')
      execFileSync(process.execPath, [SCRIPT, '--root', rootB, '--out', out])
      const changedSrc = JSON.parse(readFileSync(path.join(out, 'release-metadata.json'), 'utf8')) as {
        appRelease: string
        contentRelease: string
      }
      expect(changedSrc.appRelease).not.toBe(baseline.appRelease)
      expect(changedSrc.contentRelease).toBe(baseline.contentRelease)

      writeFileSync(path.join(rootB, 'public/data/units.json'), '[{"id":"unit-b","grade":3}]\n')
      execFileSync(process.execPath, [SCRIPT, '--root', rootB, '--out', out])
      const changedData = JSON.parse(readFileSync(path.join(out, 'release-metadata.json'), 'utf8')) as {
        appRelease: string
        contentRelease: string
      }
      expect(changedData.contentRelease).not.toBe(baseline.contentRelease)
      expect(changedData.appRelease).toBe(changedSrc.appRelease)
    } finally {
      ;[rootA, rootB, out].forEach(dir => rmSync(dir, { recursive: true, force: true }))
    }
  })

  it('documents the exact appRelease input set in the script header', () => {
    const source = readFileSync(SCRIPT, 'utf8')
    expect(source).toContain('appRelease input set')
    expect(source).toContain('package.json')
    expect(source).toContain('package-lock.json')
    expect(source).toContain('next.config.js')
    expect(source).toContain('src/')
    expect(source).toContain('contentRelease')
    expect(source).toContain('deterministic')
  })

  it('fails with a nonzero exit code when a required input is missing', () => {
    const root = makeFixtureDir('d')
    const out = makeFixtureDir('od')
    try {
      writeTree(root)
      rmSync(path.join(root, 'package-lock.json'))
      expect(() => runGenerator(root, out)).toThrow()
    } finally {
      ;[root, out].forEach(dir => rmSync(dir, { recursive: true, force: true }))
    }
  })
})
