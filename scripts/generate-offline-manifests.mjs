#!/usr/bin/env node
/**
 * generate-offline-manifests.mjs — 학년별 offline pack manifest 생성기 (T5)
 *
 * Emits public/offline-packs/grade-<1..6>.json:
 *   { schemaVersion: 1, grade, appRelease, contentRelease, urls: [...] }
 *
 * URL derivation (deterministic, documented):
 *   - /math_assist/grade/<N>/  and, when the route directory
 *     src/app/grade/<N>/mission exists, /math_assist/grade/<N>/mission/
 *   - /math_assist/unit/<unitId>/ for units.json entries with grade === N
 *   - /math_assist/concept/<id>/ and /math_assist/practice/<id>/ for concepts
 *     whose unit belongs to grade N (mirrors generateStaticParams sources)
 *   - /math_assist/data/units.json + /math_assist/data/concepts.json (shared)
 *   - /math_assist/data/templates/<prefix>.json where prefix is
 *     concept.id.split('-')[0], only when the template file exists
 *   - /math_assist/data/application-problems/packs/<file>.json by filename
 *     ownership rule: g<N>-* → grade N; unit-5-* → grade 5; unit-6-* → grade 6.
 *     Grades 1 and 4 have no application-problem packs today.
 *
 * Contract enforced at build time (exit nonzero otherwise):
 *   every URL starts with /math_assist/, has no query string or fragment,
 *   ends with "/" for pages, no duplicates, sorted output. Release ids come
 *   from scripts/generate-release-metadata.mjs run against the same tree.
 *
 * --validate-out <dir> checks every emitted URL resolves to a real file in a
 * provided static export tree (out/). Missing file → OFFLINE_MANIFEST_URL_MISSING.
 *
 * Usage: node scripts/generate-offline-manifests.mjs [--root <dir>] [--out <dir>] [--validate-out <dir>]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE_PATH = '/math_assist'

function fail(code) {
  process.stderr.write(`${code}\n`)
  process.exit(1)
}

function parseArgs(argv) {
  const args = { root: undefined, out: undefined, validateOut: undefined, metadata: undefined }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--root') {
      index += 1
      args.root = argv[index]
    } else if (value === '--out') {
      index += 1
      args.out = argv[index]
    } else if (value === '--validate-out') {
      index += 1
      args.validateOut = argv[index]
    } else if (value === '--metadata') {
      index += 1
      args.metadata = argv[index]
    } else {
      fail(`OFFLINE_MANIFEST_UNKNOWN_ARG:${value}`)
    }
  }
  return args
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRoot = path.resolve(scriptDir, '..')
const args = parseArgs(process.argv.slice(2))
const root = path.resolve(args.root ?? defaultRoot)
const outDir = path.resolve(args.out ?? path.join(root, 'public/offline-packs'))

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'))
  } catch {
    fail(`OFFLINE_MANIFEST_INPUT_UNREADABLE:${relativePath}`)
    return null
  }
}

const metadataPath = path.resolve(
  args.metadata ?? path.join(root, 'public', 'release-metadata.json'),
)
let metadata
try {
  metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
} catch {
  fail('OFFLINE_MANIFEST_METADATA_MISSING')
}

if (
  metadata.schemaVersion !== 1 ||
  typeof metadata.appRelease !== 'string' ||
  typeof metadata.contentRelease !== 'string' ||
  !/^[0-9a-f]{64}$/.test(metadata.appRelease) ||
  !/^[0-9a-f]{64}$/.test(metadata.contentRelease)
) {
  fail('OFFLINE_MANIFEST_METADATA_INVALID')
}

const units = readJson('public/data/units.json')
const concepts = readJson('public/data/concepts.json')

if (!Array.isArray(units) || !Array.isArray(concepts)) {
  fail('OFFLINE_MANIFEST_DATA_INVALID')
}

const missionGrades = new Set([2, 3, 4].filter(grade =>
  existsSync(path.join(root, 'src/app/grade', String(grade), 'mission')),
))

const unitGradeById = new Map()
units.forEach(unit => {
  if (!unit || typeof unit.id !== 'string' || !Number.isInteger(unit.grade)) {
    fail('OFFLINE_MANIFEST_DATA_INVALID:units')
  }
  unitGradeById.set(unit.id, unit.grade)
})

function applicationPackFilesForGrade(grade) {
  const packsDir = path.join(root, 'public/data/application-problems/packs')
  if (!existsSync(packsDir)) {
    return []
  }
  const prefix = `g${grade}-`
  const olderPrefix = `unit-${grade}-`
  return readdirSync(packsDir)
    .filter(name => name.endsWith('.json'))
    .filter(name => name.startsWith(prefix) || name.startsWith(olderPrefix))
    .sort()
}

function pageUrl(pathname) {
  return pathname === '' ? `${BASE_PATH}/` : `${BASE_PATH}${pathname}/`
}

function collectGradeUrls(grade) {
  const urls = []
  urls.push(pageUrl(`/grade/${grade}`))
  if (missionGrades.has(grade)) {
    urls.push(pageUrl(`/grade/${grade}/mission`))
  }

  const gradeUnits = units.filter(unit => unit.grade === grade)
  const gradeConcepts = concepts.filter(concept => unitGradeById.get(concept.unit_id) === grade)

  gradeUnits.forEach(unit => {
    urls.push(pageUrl(`/unit/${unit.id}`))
  })

  const templatePrefixes = new Set()
  gradeConcepts.forEach(concept => {
    urls.push(pageUrl(`/concept/${concept.id}`))
    urls.push(pageUrl(`/practice/${concept.id}`))
    templatePrefixes.add(String(concept.id).split('-')[0])
  })

  urls.push(`${BASE_PATH}/data/units.json`)
  urls.push(`${BASE_PATH}/data/concepts.json`)

  ;[...templatePrefixes].sort().forEach(prefix => {
    if (existsSync(path.join(root, 'public/data/templates', `${prefix}.json`))) {
      urls.push(`${BASE_PATH}/data/templates/${prefix}.json`)
    }
  })

  applicationPackFilesForGrade(grade).forEach(name => {
    urls.push(`${BASE_PATH}/data/application-problems/packs/${name}`)
  })

  return finalizeUrls(urls, grade)
}

function finalizeUrls(urls, grade) {
  const unique = []
  const seen = new Set()
  urls.forEach(url => {
    if (!url.startsWith(`${BASE_PATH}/`)) {
      fail(`OFFLINE_MANIFEST_URL_ORIGIN:${url}`)
    }
    if (url.includes('?') || url.includes('#')) {
      fail(`OFFLINE_MANIFEST_URL_QUERY:${url}`)
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(url.replace(BASE_PATH, ''))) {
      fail(`OFFLINE_MANIFEST_URL_SCHEME:${url}`)
    }
    if (seen.has(url)) {
      fail(`OFFLINE_MANIFEST_URL_DUPLICATE:${url}`)
    }
    seen.add(url)
    unique.push(url)
  })
  unique.sort()
  if (unique.length === 0) {
    fail(`OFFLINE_MANIFEST_EMPTY:${grade}`)
  }
  return unique
}

function validateAgainstOutTree(treeDir, manifests) {
  manifests.forEach(manifest => {
    manifest.urls.forEach(url => {
      const relative = url.slice(BASE_PATH.length + 1)
      const candidates = url.endsWith('/')
        ? [path.join(treeDir, relative, 'index.html')]
        : [path.join(treeDir, relative)]
      const present = candidates.some(candidate => {
        try {
          return statSync(candidate).isFile()
        } catch {
          return false
        }
      })
      if (!present) {
        fail(`OFFLINE_MANIFEST_URL_MISSING:${url}`)
      }
    })
  })
}

mkdirSync(outDir, { recursive: true })

const manifests = []
for (let grade = 1; grade <= 6; grade += 1) {
  manifests.push({
    schemaVersion: 1,
    grade,
    appRelease: metadata.appRelease,
    contentRelease: metadata.contentRelease,
    urls: collectGradeUrls(grade),
  })
}

manifests.forEach(manifest => {
  writeFileSync(
    path.join(outDir, `grade-${manifest.grade}.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )
})

if (args.validateOut !== undefined) {
  validateAgainstOutTree(path.resolve(args.validateOut), manifests)
}

process.stdout.write(`offline-packs written for grades 1-6 (appRelease=${metadata.appRelease.slice(0, 12)}…)\n`)
