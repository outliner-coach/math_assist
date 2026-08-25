#!/usr/bin/env node
/**
 * serve-static-out.mjs — zero-dependency static server for the out/ export (T8)
 *
 * Serves the Next.js static export directory with GitHub Pages-like behavior:
 *   - strips the /math_assist basePath prefix from request paths
 *   - maps "/" and "/path/" to index.html inside the export directory
 *   - correct MIME types for html, js, css, json, svg, webmanifest, images,
 *     fonts, and maps
 *
 * Usage: node scripts/serve-static-out.mjs <port> [--root <dir>]
 * Used by playwright.config.production.ts; no writes, no learner data.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const BASE_PATH = '/math_assist'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function contentTypeFor(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

export function stripBasePath(pathname) {
  if (pathname === BASE_PATH || pathname === `${BASE_PATH}/`) return '/'
  if (pathname.startsWith(`${BASE_PATH}/`)) return pathname.slice(BASE_PATH.length)
  return pathname
}

/**
 * Resolve a request path to a file inside root. Returns
 * { status: 200, filePath, contentType }, { status: 400 } for malformed
 * paths, or { status: 404 }.
 */
export function resolveStaticPath(root, rawPath) {
  let decoded
  try {
    decoded = decodeURIComponent(rawPath.split('?')[0].split('#')[0])
  } catch {
    return { status: 400 }
  }

  const withoutBase = stripBasePath(decoded)
  if (withoutBase.split('/').some(segment => segment === '..')) {
    return { status: 400 }
  }

  const resolvedRoot = path.resolve(root)
  const target = path.resolve(resolvedRoot, `.${withoutBase}`)

  const candidates = withoutBase.endsWith('/')
    ? [path.join(target, 'index.html')]
    : [target, path.join(target, 'index.html')]

  for (const candidate of candidates) {
    try {
      const stat = statSync(candidate)
      if (stat.isFile()) {
        return { status: 200, filePath: candidate, contentType: contentTypeFor(candidate) }
      }
    } catch {
      // Try the next mapping.
    }
  }

  return { status: 404 }
}

export function createRequestHandler({ root }) {
  const resolvedRoot = path.resolve(root)
  return (request, response) => {
    const resolved = resolveStaticPath(resolvedRoot, request.url ?? '/')
    if (resolved.status !== 200) {
      response.statusCode = resolved.status
      response.setHeader('content-type', 'text/plain; charset=utf-8')
      response.end(resolved.status === 404 ? 'not found\n' : 'bad request\n')
      return
    }

    response.statusCode = 200
    response.setHeader('content-type', resolved.contentType)
    if (request.method === 'HEAD') {
      response.end()
      return
    }
    createReadStream(resolved.filePath).pipe(response)
  }
}

export function startStaticServer({ port, root }) {
  const resolvedRoot = path.resolve(root)
  if (!existsSync(resolvedRoot)) {
    return Promise.reject(new Error(`STATIC_ROOT_MISSING:${resolvedRoot}`))
  }
  return new Promise((resolve, reject) => {
    const server = createServer(createRequestHandler({ root: resolvedRoot }))
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      const address = server.address()
      resolve({
        port: typeof address === 'object' && address ? address.port : port,
        close: () => new Promise(closeResolve => server.close(() => closeResolve())),
      })
    })
  })
}

async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h') || argv.length < 1) {
    process.stdout.write('Usage: node scripts/serve-static-out.mjs <port> [--root <dir>]\n')
    return argv.includes('--help') ? 0 : 2
  }
  const port = Number(argv[0])
  const rootFlagIndex = argv.indexOf('--root')
  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const defaultRoot = path.join(scriptDir, '..', 'out')
  const root = rootFlagIndex !== -1 ? argv[rootFlagIndex + 1] : defaultRoot

  if (!Number.isInteger(port) || port <= 0) {
    process.stderr.write('INVALID_PORT\n')
    return 2
  }

  try {
    const handle = await startStaticServer({ port, root })
    process.stdout.write(`serving ${path.resolve(root)} at http://127.0.0.1:${handle.port}${BASE_PATH}/\n`)
    const shutdown = () => {
      handle.close().then(() => process.exit(0))
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    return undefined
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 1
  }
}

const invokedDirectly = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (invokedDirectly) {
  main(process.argv.slice(2)).then(code => {
    if (code !== undefined) process.exit(code)
  })
}
