import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const METADATA_SCRIPT = path.resolve(__dirname, '../scripts/generate-release-metadata.mjs')
const SCRIPT = path.resolve(__dirname, '../scripts/generate-offline-manifests.mjs')

interface PackManifest {
  schemaVersion: number
  grade: number
  appRelease: string
  contentRelease: string
  urls: string[]
}

function makeRoot(prefix: string): string {
  return mkdtempSync(path.join(tmpdir(), `ma-packs-${prefix}-`))
}

interface FixtureUnit {
  id: string
  grade: number
}

function writeSourceTree(root: string): void {
  const units: FixtureUnit[] = [
    { id: 'unit-2-1-length', grade: 2 },
    { id: 'unit-3-1-multiply', grade: 3 },
  ]
  const concepts = [
    { id: 'g2length-001', unit_id: 'unit-2-1-length' },
    { id: 'g2add-001', unit_id: 'unit-2-1-length' },
    { id: 'g3mul-001', unit_id: 'unit-3-1-multiply' },
  ]

  mkdirSync(path.join(root, 'public/data/templates'), { recursive: true })
  mkdirSync(path.join(root, 'public/data/application-problems/packs'), { recursive: true })
  mkdirSync(path.join(root, 'public/icons'), { recursive: true })
  mkdirSync(path.join(root, 'src/app/grade/2/mission'), { recursive: true })
  mkdirSync(path.join(root, 'src/app/grade/4/mission'), { recursive: true })
  mkdirSync(path.join(root, 'src/app/grade/5'), { recursive: true })

  writeFileSync(path.join(root, 'public/data/units.json'), JSON.stringify(units))
  writeFileSync(path.join(root, 'public/data/concepts.json'), JSON.stringify(concepts))
  writeFileSync(path.join(root, 'public/data/templates/g2length.json'), '[]')
  writeFileSync(path.join(root, 'public/data/templates/g2add.json'), '[]')
  writeFileSync(path.join(root, 'public/data/templates/g3mul.json'), '[]')

  const packs = ['g2-1-add-sub.json', 'g2-2-facts.json', 'g3-1-multiply.json', 'unit-5-1-perimeter-area.json']
  packs.forEach(name => writeFileSync(path.join(root, 'public/data/application-problems/packs', name), '[]'))

  writeFileSync(path.join(root, 'public/sw.js'), '// sw\n')
  writeFileSync(path.join(root, 'public/manifest.webmanifest'), '{}\n')
  writeFileSync(path.join(root, 'public/icons/icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n')

  // Product inputs so release digests can be computed on this fixture tree.
  writeFileSync(path.join(root, 'package.json'), '{}\n')
  writeFileSync(path.join(root, 'package-lock.json'), '{}\n')
  writeFileSync(path.join(root, 'next.config.js'), "module.exports = {}\n")
  writeFileSync(path.join(root, 'src/app/grade/2/mission/page.tsx'), 'export default function M() {\n  return null\n}\n')
  writeFileSync(path.join(root, 'public/sw.js'), '// sw\n')
}

function runMetadata(root: string): void {
  execFileSync(process.execPath, [METADATA_SCRIPT, '--root', root, '--out', path.join(root, 'public')])
}

function runPacks(root: string, extraArgs: string[] = []): void {
  execFileSync(process.execPath, [SCRIPT, '--root', root, ...extraArgs])
}

function readPack(outDir: string, grade: number): PackManifest {
  return JSON.parse(readFileSync(path.join(outDir, `grade-${grade}.json`), 'utf8')) as PackManifest
}

describe('generate-offline-manifests.mjs', () => {
  it('emits grade manifests with contract fields in order and spec-compliant URLs', () => {
    const root = makeRoot('a')
    try {
      writeSourceTree(root)
      runMetadata(root)
      runPacks(root)

      for (let grade = 1; grade <= 6; grade += 1) {
        const pack = readPack(path.join(root, 'public/offline-packs'), grade)
        expect(Object.keys(pack)).toEqual([
          'schemaVersion',
          'grade',
          'appRelease',
          'contentRelease',
          'urls',
        ])
        expect(pack.schemaVersion).toBe(1)
        expect(pack.grade).toBe(grade)
      }

      const metadata = JSON.parse(
        readFileSync(path.join(root, 'public/release-metadata.json'), 'utf8'),
      ) as { appRelease: string; contentRelease: string }
      const g2 = readPack(path.join(root, 'public/offline-packs'), 2)

      expect(g2.appRelease).toBe(metadata.appRelease)
      expect(g2.contentRelease).toBe(metadata.contentRelease)

      const allUrls = new Set<string>()
      for (let grade = 1; grade <= 6; grade += 1) {
        const pack = readPack(path.join(root, 'public/offline-packs'), grade)
        pack.urls.forEach(url => {
          expect(url.startsWith('/math_assist/')).toBe(true)
          expect(url.includes('?')).toBe(false)
          expect(url.includes('#')).toBe(false)
          if (/\/(grade|unit|concept|practice)\//.test(url)) {
            expect(url.endsWith('/')).toBe(true)
          }
          expect(allUrls.has(`${grade}:${url}`)).toBe(false)
          allUrls.add(`${grade}:${url}`)
        })
        const sorted = [...pack.urls].sort()
        expect(pack.urls).toEqual(sorted)
      }

      expect(g2.urls).toContain('/math_assist/grade/2/')
      expect(g2.urls).toContain('/math_assist/grade/2/mission/')
      expect(g2.urls).toContain('/math_assist/unit/unit-2-1-length/')
      expect(g2.urls).toContain('/math_assist/concept/g2length-001/')
      expect(g2.urls).toContain('/math_assist/practice/g2length-001/')
      expect(g2.urls).toContain('/math_assist/data/units.json')
      expect(g2.urls).toContain('/math_assist/data/concepts.json')
      expect(g2.urls).toContain('/math_assist/data/templates/g2length.json')
      expect(g2.urls).toContain('/math_assist/data/application-problems/packs/g2-1-add-sub.json')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('keeps each grade manifest owned by that grade only', () => {
    const root = makeRoot('b')
    try {
      writeSourceTree(root)
      runMetadata(root)
      runPacks(root)

      const out = path.join(root, 'public/offline-packs')
      const g2 = readPack(out, 2)
      const g3 = readPack(out, 3)
      const g5 = readPack(out, 5)
      const g1 = readPack(out, 1)

      expect(g2.urls.some(url => url.includes('g3-') || url.includes('unit-3-1'))).toBe(false)
      expect(g3.urls).toContain('/math_assist/data/application-problems/packs/g3-1-multiply.json')
      expect(g5.urls).toContain('/math_assist/data/application-problems/packs/unit-5-1-perimeter-area.json')
      expect(g3.urls.some(url => url.includes('/grade/2'))).toBe(false)
      expect(g1.urls).toEqual(
        expect.arrayContaining(['/math_assist/grade/1/', '/math_assist/data/units.json']),
      )
      expect(g1.urls.some(url => url.includes('application-problems/packs/'))).toBe(false)
      expect(readPack(out, 4).urls).toContain('/math_assist/grade/4/mission/')
      expect(g5.urls.some(url => url.includes('/mission/'))).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('regenerates byte-identical manifests', () => {
    const root = makeRoot('c')
    const altOut = makeRoot('cout')
    try {
      writeSourceTree(root)
      runMetadata(root)
      runPacks(root)
      const firstFiles: Record<string, Buffer> = {}
      readdirSync(path.join(root, 'public/offline-packs')).forEach(name => {
        firstFiles[name] = readFileSync(path.join(root, 'public/offline-packs', name))
      })

      runPacks(root, ['--out', altOut])
      readdirSync(altOut).forEach(name => {
        expect(readFileSync(path.join(altOut, name)).equals(firstFiles[name])).toBe(true)
      })
      expect(Object.keys(firstFiles).sort()).toEqual([
        'grade-1.json',
        'grade-2.json',
        'grade-3.json',
        'grade-4.json',
        'grade-5.json',
        'grade-6.json',
      ])
    } finally {
      ;[root, altOut].forEach(dir => rmSync(dir, { recursive: true, force: true }))
    }
  })

  it('validates every URL against a provided out/ filesystem tree and fails on missing files', () => {
    const root = makeRoot('d')
    const outTree = makeRoot('outtree')
    try {
      writeSourceTree(root)
      runMetadata(root)
      runPacks(root)

      for (let grade = 1; grade <= 6; grade += 1) {
        const pack = readPack(path.join(root, 'public/offline-packs'), grade)
        pack.urls.forEach(url => {
          const rel = url.replace(/^\/math_assist\//, '')
          if (url.endsWith('.json')) {
            const target = path.join(outTree, rel)
            mkdirSync(path.dirname(target), { recursive: true })
            writeFileSync(target, '[]')
            return
          }
          const target = path.join(outTree, rel, 'index.html')
          mkdirSync(path.dirname(target), { recursive: true })
          writeFileSync(target, '<html></html>')
        })
      }

      runPacks(root, ['--validate-out', outTree])

      rmSync(path.join(outTree, 'data/templates/g2length.json'))
      let failed = ''
      try {
        execFileSync(process.execPath, [SCRIPT, '--root', root, '--validate-out', outTree], {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      } catch (error) {
        failed = String((error as { stderr?: Buffer | string }).stderr ?? error)
      }
      expect(failed).toContain('OFFLINE_MANIFEST_URL_MISSING')
    } finally {
      ;[root, outTree].forEach(dir => rmSync(dir, { recursive: true, force: true }))
    }
  })

  it('fails when the source data would produce duplicate or invalid URLs', () => {
    const root = makeRoot('e')
    try {
      writeSourceTree(root)
      writeFileSync(
        path.join(root, 'public/data/concepts.json'),
        JSON.stringify([
          { id: 'g2length-001', unit_id: 'unit-2-1-length' },
          { id: 'g2length-001?x', unit_id: 'unit-2-1-length' },
        ]),
      )
      expect(() => runPacks(root)).toThrow()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
