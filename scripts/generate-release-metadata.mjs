#!/usr/bin/env node
/**
 * generate-release-metadata.mjs — ReleaseMetadataV1 생성기 (T5)
 *
 * Emits public/release-metadata.json:
 *   { schemaVersion: 1, appRelease, contentRelease, storageSchema: 1, exportSchema: 1, offlineCacheSchema: 1 }
 *
 * appRelease input set (EXACT, documented contract):
 *   - package.json
 *   - package-lock.json
 *   - next.config.js
 *   - src/**  (every file, recursively)
 *   - public/sw.js, public/manifest.webmanifest, public/icons/**
 *
 *   Deliberately EXCLUDED from appRelease: public/data/** (tracked by
 *   contentRelease per spec §7, so content-only edits must not churn shell or
 *   visited caches), docs/**, tests/**, scripts/**, out/**, node_modules/**.
 *
 * contentRelease input set: every file under public/data/** (recursive).
 *
 * Digest algorithm (deterministic): walk the input set, sort by POSIX relative
 * path, and hash the canonical text "<relPath>\n sha256:<fileHash>\n" lines
 * with SHA-256. The release id is the lowercase 64-hex digest. No timestamps,
 * no absolute paths, no environment values. Byte-identical regeneration is a
 * release gate (tests/generate-release-metadata.test.ts).
 *
 * Usage: node scripts/generate-release-metadata.mjs [--root <dir>] [--out <dir>]
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function parseArgs(argv) {
  const args = { root: undefined, out: undefined }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--root') {
      index += 1
      args.root = argv[index]
    } else if (value === '--out') {
      index += 1
      args.out = argv[index]
    } else {
      fail(`RELEASE_METADATA_UNKNOWN_ARG:${value}`)
    }
  }
  return args
}

function fail(code) {
  process.stderr.write(`${code}\n`)
  process.exit(1)
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRoot = path.resolve(scriptDir, '..')
const args = parseArgs(process.argv.slice(2))
const root = path.resolve(args.root ?? defaultRoot)
const outDir = path.resolve(args.out ?? path.join(root, 'public'))

function sha256File(absolutePath) {
  return createHash('sha256').update(readFileSync(absolutePath)).digest('hex')
}

function walkRelative(baseDir, relativeDir = '') {
  const entries = readdirSync(path.join(baseDir, relativeDir), { withFileTypes: true })
  const files = []
  entries.forEach(entry => {
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...walkRelative(baseDir, relativePath))
    } else if (entry.isFile()) {
      files.push(relativePath)
    }
  })
  return files
}

function digestOverFiles(relativeFiles) {
  const canonical = relativeFiles
    .slice()
    .sort()
    .map(relativePath => `${relativePath}\n sha256:${sha256File(path.join(root, relativePath))}\n`)
    .join('')
  return createHash('sha256').update(canonical, 'utf8').digest('hex')
}

const appReleaseFixedInputs = ['package.json', 'package-lock.json', 'next.config.js', 'public/sw.js', 'public/manifest.webmanifest']
const appReleaseInputs = [
  ...appReleaseFixedInputs,
  ...walkRelative(path.join(root, 'src')).map(relative => `src/${relative}`),
  ...walkRelative(path.join(root, 'public/icons')).map(relative => `public/icons/${relative}`),
]

appReleaseInputs.forEach(relativePath => {
  try {
    statSync(path.join(root, relativePath))
  } catch {
    fail(`RELEASE_METADATA_MISSING_INPUT:${relativePath}`)
  }
})

let contentFiles
try {
  contentFiles = walkRelative(path.join(root, 'public/data')).map(relative => `public/data/${relative}`)
} catch {
  fail('RELEASE_METADATA_MISSING_INPUT:public/data')
}

const metadata = {
  schemaVersion: 1,
  appRelease: digestOverFiles(appReleaseInputs),
  contentRelease: digestOverFiles(contentFiles),
  storageSchema: 1,
  exportSchema: 1,
  offlineCacheSchema: 1,
}

writeFileSync(path.join(outDir, 'release-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`)
process.stdout.write(`release-metadata.json appRelease=${metadata.appRelease} contentRelease=${metadata.contentRelease}\n`)
