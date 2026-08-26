#!/usr/bin/env node
/**
 * release-digest-core.mjs — shared deterministic release digest core (T8)
 *
 * Single source of the ReleaseMetadataV1 digest routine. Both
 * scripts/generate-release-metadata.mjs and
 * scripts/check-release-evidence.mjs / check-rollback-compat.mjs import this
 * module so an evidence fingerprint can only be produced by exactly the same
 * input-set walk and hash algorithm that produces public/release-metadata.json.
 *
 * Digest algorithm (deterministic): walk the input set, sort by POSIX relative
 * path, and hash the canonical text "<relPath>\n sha256:<fileHash>\n" lines
 * with SHA-256. The release id is the lowercase 64-hex digest. No timestamps,
 * no absolute paths, no environment values.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

export const RELEASE_METADATA_SCHEMA_VERSION = 1

export class ReleaseDigestError extends Error {
  constructor(code) {
    super(code)
    this.name = 'ReleaseDigestError'
    this.code = code
  }
}

export function sha256File(absolutePath) {
  return createHash('sha256').update(readFileSync(absolutePath)).digest('hex')
}

export function walkRelative(baseDir, relativeDir = '') {
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

export function digestOverFiles(root, relativeFiles) {
  const canonical = relativeFiles
    .slice()
    .sort()
    .map(relativePath => `${relativePath}\n sha256:${sha256File(path.join(root, relativePath))}\n`)
    .join('')
  return createHash('sha256').update(canonical, 'utf8').digest('hex')
}

function assertInputsExist(root, relativeFiles) {
  relativeFiles.forEach(relativePath => {
    try {
      statSync(path.join(root, relativePath))
    } catch {
      throw new ReleaseDigestError(`RELEASE_METADATA_MISSING_INPUT:${relativePath}`)
    }
  })
}

export function collectAppReleaseInputs(root) {
  const fixedInputs = ['package.json', 'package-lock.json', 'next.config.js', 'public/sw.js', 'public/manifest.webmanifest']
  const inputs = [
    ...fixedInputs,
    ...walkRelative(path.join(root, 'src')).map(relative => `src/${relative}`),
    ...walkRelative(path.join(root, 'public/icons')).map(relative => `public/icons/${relative}`),
  ]
  assertInputsExist(root, inputs)
  return inputs
}

export function collectContentReleaseInputs(root) {
  let contentFiles
  try {
    contentFiles = walkRelative(path.join(root, 'public/data')).map(relative => `public/data/${relative}`)
  } catch {
    throw new ReleaseDigestError('RELEASE_METADATA_MISSING_INPUT:public/data')
  }
  return contentFiles
}

export function computeAppReleaseDigest(root) {
  return digestOverFiles(root, collectAppReleaseInputs(root))
}

export function computeContentReleaseDigest(root) {
  return digestOverFiles(root, collectContentReleaseInputs(root))
}

export function computeReleaseMetadata(root) {
  return {
    schemaVersion: RELEASE_METADATA_SCHEMA_VERSION,
    appRelease: computeAppReleaseDigest(root),
    contentRelease: computeContentReleaseDigest(root),
    storageSchema: 1,
    exportSchema: 1,
    offlineCacheSchema: 1,
  }
}
