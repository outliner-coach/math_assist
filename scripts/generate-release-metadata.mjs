#!/usr/bin/env node
/**
 * generate-release-metadata.mjs — ReleaseMetadataV1 생성기 (T5, T8 core 추출)
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
 * The digest algorithm itself lives in scripts/release-digest-core.mjs and is
 * shared with the release evidence/rollback checkers so no consumer can drift
 * from the generator. It is deterministic: walk the input set, sort by POSIX
 * relative path, and hash the canonical text "<relPath>\n sha256:<fileHash>\n"
 * lines with SHA-256. Byte-identical regeneration is a release gate
 * (tests/generate-release-metadata.test.ts).
 *
 * Usage: node scripts/generate-release-metadata.mjs [--root <dir>] [--out <dir>]
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ReleaseDigestError, computeReleaseMetadata } from './release-digest-core.mjs'

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

let metadata
try {
  metadata = computeReleaseMetadata(root)
} catch (error) {
  fail(error instanceof ReleaseDigestError ? error.code : `RELEASE_METADATA_FAILED:${error?.message ?? error}`)
}

writeFileSync(path.join(outDir, 'release-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`)
process.stdout.write(`release-metadata.json appRelease=${metadata.appRelease} contentRelease=${metadata.contentRelease}\n`)
