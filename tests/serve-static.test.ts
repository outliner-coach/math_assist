import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startStaticServer } from '../scripts/serve-static-out.mjs'

let root: string
let serverHandle: { close: () => Promise<void>; port: number }

beforeAll(async () => {
  root = mkdtempSync(path.join(tmpdir(), 'ma-out-'))
  mkdirSync(path.join(root, 'pkg'), { recursive: true })
  mkdirSync(path.join(root, 'home'), { recursive: true })
  mkdirSync(path.join(root, '_next/static/chunks'), { recursive: true })
  writeFileSync(path.join(root, 'index.html'), '<html>landing</html>\n')
  writeFileSync(path.join(root, 'sw.js'), '// sw\n')
  writeFileSync(path.join(root, 'pkg', 'index.html'), '<html>pkg</html>\n')
  writeFileSync(path.join(root, 'home', 'index.html'), '<html>home</html>\n')
  writeFileSync(path.join(root, 'styles.main.css'), 'body{}\n')
  writeFileSync(path.join(root, 'data.json'), '{}\n')
  writeFileSync(path.join(root, 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>\n')
  writeFileSync(path.join(root, 'manifest.webmanifest'), '{}\n')
  writeFileSync(path.join(root, '_next', 'static', 'chunks', 'app.js'), 'console.log(1)\n')

  serverHandle = await startStaticServer({ port: 0, root })
})

afterAll(async () => {
  if (serverHandle) await serverHandle.close()
  rmSync(root, { recursive: true, force: true })
})

function url(requestPath: string): string {
  return `http://127.0.0.1:${serverHandle.port}${requestPath}`
}

describe('serve-static-out.mjs', () => {
  it('strips the /math_assist prefix and serves index files for directory paths', async () => {
    const pkg = await fetch(url('/math_assist/pkg/index.html'))
    expect(pkg.status).toBe(200)
    expect(await pkg.text()).toContain('pkg')

    const dirWithSlash = await fetch(url('/math_assist/home/'))
    expect(dirWithSlash.status).toBe(200)
    expect(await dirWithSlash.text()).toContain('home')

    const dirNoSlash = await fetch(url('/math_assist/home'))
    expect(dirNoSlash.status).toBe(200)
    expect(await dirNoSlash.text()).toContain('home')
  })

  it('serves correct content types for required static assets', async () => {
    const expectations: Array<[string, string]> = [
      ['/math_assist/', 'text/html'],
      ['/math_assist/_next/static/chunks/app.js', 'text/javascript'],
      ['/math_assist/styles.main.css', 'text/css'],
      ['/math_assist/data.json', 'application/json'],
      ['/math_assist/icon.svg', 'image/svg+xml'],
      ['/math_assist/manifest.webmanifest', 'application/manifest+json'],
      ['/math_assist/sw.js', 'text/javascript'],
    ]
    for (const [requestPath, contentType] of expectations) {
      const response = await fetch(url(requestPath))
      expect(response.status, requestPath).toBe(200)
      expect(response.headers.get('content-type'), requestPath).toContain(contentType)
    }
  })

  it('returns 404 for unknown paths and rejects traversal outside the root', async () => {
    const unknown = await fetch(url('/math_assist/no-such-page/'))
    expect(unknown.status).toBe(404)

    const traversal = await fetch(url('/math_assist/../secret.txt'))
    expect([400, 404]).toContain(traversal.status)
  })

  it('serves the site root index at both / and /math_assist', async () => {
    const bare = await fetch(url('/'))
    expect(bare.status).toBe(200)
    expect(await bare.text()).toContain('landing')

    const prefixed = await fetch(url('/math_assist'))
    expect(prefixed.status).toBe(200)
    expect(await prefixed.text()).toContain('landing')
  })
})
